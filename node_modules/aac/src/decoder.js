/*
 * AAC.js - Advanced Audio Coding decoder in JavaScript
 * Created by Devon Govett
 * Copyright (c) 2012, Official.fm Labs
 *
 * AAC.js is free software; you can redistribute it and/or modify it 
 * under the terms of the GNU Lesser General Public License as 
 * published by the Free Software Foundation; either version 3 of the 
 * License, or (at your option) any later version.
 *
 * AAC.js is distributed in the hope that it will be useful, but WITHOUT 
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General 
 * Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library.
 * If not, see <http://www.gnu.org/licenses/>.
 */

var AV          = require('av');
var ADTSDemuxer = require('./adts_demuxer');
var ICStream    = require('./ics');
var CPEElement  = require('./cpe');
var CCEElement  = require('./cce');
var FilterBank  = require('./filter_bank');
var tables      = require('./tables');

var AACDecoder = AV.Decoder.extend(function() {
    AV.Decoder.register('mp4a', this);
    AV.Decoder.register('aac ', this);
    
    // AAC profiles
    const AOT_AAC_MAIN = 1, // no
          AOT_AAC_LC = 2,   // yes
          AOT_AAC_LTP = 4,  // no
          AOT_ESCAPE = 31;
          
    // Channel configurations
    const CHANNEL_CONFIG_NONE = 0,
          CHANNEL_CONFIG_MONO = 1,
          CHANNEL_CONFIG_STEREO = 2,
          CHANNEL_CONFIG_STEREO_PLUS_CENTER = 3,
          CHANNEL_CONFIG_STEREO_PLUS_CENTER_PLUS_REAR_MONO = 4,
          CHANNEL_CONFIG_FIVE = 5,
          CHANNEL_CONFIG_FIVE_PLUS_ONE = 6,
          CHANNEL_CONFIG_SEVEN_PLUS_ONE = 8;
          
    this.prototype.init = function() {
      this.format.floatingPoint = true;
    }
    
    this.prototype.setCookie = function(buffer) {
        var data = AV.Stream.fromBuffer(buffer),
            stream = new AV.Bitstream(data);
        
        this.config = {};
        
        this.config.profile = stream.read(5);
        if (this.config.profile === AOT_ESCAPE)
            this.config.profile = 32 + stream.read(6);
            
        this.config.sampleIndex = stream.read(4);
        if (this.config.sampleIndex === 0x0f) {
            this.config.sampleRate = stream.read(24);
            for (var i = 0; i < tables.SAMPLE_RATES.length; i++) {
                if (tables.SAMPLE_RATES[i] === this.config.sampleRate) {
                    this.config.sampleIndex = i;
                    break;
                }
            }
        } else {
            this.config.sampleRate = tables.SAMPLE_RATES[this.config.sampleIndex];
        }
            
        this.config.chanConfig = stream.read(4);
        this.format.channelsPerFrame = this.config.chanConfig; // sometimes m4a files encode this wrong
        
        switch (this.config.profile) {
            case AOT_AAC_MAIN:
            case AOT_AAC_LC:
            case AOT_AAC_LTP:
                if (stream.read(1)) // frameLengthFlag
                    throw new Error('frameLengthFlag not supported');
                    
                this.config.frameLength = 1024;
                    
                if (stream.read(1)) // dependsOnCoreCoder
                    stream.advance(14); // coreCoderDelay
                    
                if (stream.read(1)) { // extensionFlag
                    if (this.config.profile > 16) { // error resiliant profile
                        this.config.sectionDataResilience = stream.read(1);
                        this.config.scalefactorResilience = stream.read(1);
                        this.config.spectralDataResilience = stream.read(1);
                    }
                    
                    stream.advance(1);
                }
                
                if (this.config.chanConfig === CHANNEL_CONFIG_NONE) {
                    stream.advance(4) // element_instance_tag
                    throw new Error('PCE unimplemented');
                }
                
                break;
                
            default:
                throw new Error('AAC profile ' + this.config.profile + ' not supported.');
        }
        
        this.filter_bank = new FilterBank(false, this.config.chanConfig);        
        this.ics = new ICStream(this.config);
        this.cpe = new CPEElement(this.config);
        this.cce = new CCEElement(this.config);
    };
    
    const SCE_ELEMENT = 0,
          CPE_ELEMENT = 1,
          CCE_ELEMENT = 2,
          LFE_ELEMENT = 3,
          DSE_ELEMENT = 4,
          PCE_ELEMENT = 5,
          FIL_ELEMENT = 6,
          END_ELEMENT = 7;
    
    // The main decoding function.
    this.prototype.readChunk = function() {
        var stream = this.bitstream;
        
        // check if there is an ADTS header, and read it if so
        if (stream.peek(12) === 0xfff)
            ADTSDemuxer.readHeader(stream);
        
        this.cces = [];
        var elements = [],
            config = this.config,
            frameLength = config.frameLength,
            elementType = null;
        
        while ((elementType = stream.read(3)) !== END_ELEMENT) {
            var id = stream.read(4);
            
            switch (elementType) {
                // single channel and low frequency elements
                case SCE_ELEMENT:
                case LFE_ELEMENT:
                    var ics = this.ics;
                    ics.id = id;
                    elements.push(ics);
                    ics.decode(stream, config, false);
                    break;
                    
                // channel pair element
                case CPE_ELEMENT:
                    var cpe = this.cpe;
                    cpe.id = id;
                    elements.push(cpe);
                    cpe.decode(stream, config);
                    break;
                
                // channel coupling element
                case CCE_ELEMENT:
                    var cce = this.cce;
                    this.cces.push(cce);
                    cce.decode(stream, config);
                    break;
                    
                // data-stream element
                case DSE_ELEMENT:
                    var align = stream.read(1),
                        count = stream.read(8);
                        
                    if (count === 255)
                        count += stream.read(8);
                        
                    if (align)
                        stream.align();
                        
                    // skip for now...
                    stream.advance(count * 8);
                    break;
                    
                // program configuration element
                case PCE_ELEMENT:
                    throw new Error("TODO: PCE_ELEMENT")
                    break;
                    
                // filler element
                case FIL_ELEMENT:
                    if (id === 15)
                        id += stream.read(8) - 1;
                        
                    // skip for now...
                    stream.advance(id * 8);
                    break;
                    
                default:
                    throw new Error('Unknown element')
            }
        }
        
        stream.align();
        this.process(elements);
        
        // Interleave channels
        var data = this.data,
            channels = data.length,
            output = new Float32Array(frameLength * channels),
            j = 0;
            
        for (var k = 0; k < frameLength; k++) {
            for (var i = 0; i < channels; i++) {
                output[j++] = data[i][k] / 32768;
            }
        }
        
        return output;
    };
    
    this.prototype.process = function(elements) {
        var channels = this.config.chanConfig;
        
        // if (channels === 1 &&  psPresent)
        // TODO: sbrPresent (2)
        var mult = 1;
        
        var len = mult * this.config.frameLength;
        var data = this.data = [];
        
        // Initialize channels
        for (var i = 0; i < channels; i++) {
            data[i] = new Float32Array(len);
        }
        
        var channel = 0;
        for (var i = 0; i < elements.length && channel < channels; i++) {
            var e = elements[i];
            
            if (e instanceof ICStream) { // SCE or LFE element
                channel += this.processSingle(e, channel);
            } else if (e instanceof CPEElement) {
                this.processPair(e, channel);
                channel += 2;
            } else if (e instanceof CCEElement) {
                channel++;
            } else {
                throw new Error("Unknown element found.")
            }
        }
    };
    
    this.prototype.processSingle = function(element, channel) {
        var profile = this.config.profile,
            info = element.info,
            data = element.data;
            
        if (profile === AOT_AAC_MAIN)
            throw new Error("Main prediction unimplemented");
            
        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");
            
        this.applyChannelCoupling(element, CCEElement.BEFORE_TNS, data, null);
        
        if (element.tnsPresent)
            element.tns.process(element, data, false);
            
        this.applyChannelCoupling(element, CCEElement.AFTER_TNS, data, null);
        
        // filterbank
        this.filter_bank.process(info, data, this.data[channel], channel);
        
        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");
        
        this.applyChannelCoupling(element, CCEElement.AFTER_IMDCT, this.data[channel], null);
        
        if (element.gainPresent)
            throw new Error("Gain control not implemented");
            
        if (this.sbrPresent)
            throw new Error("SBR not implemented");
            
        return 1;
    };
    
    this.prototype.processPair = function(element, channel) {
        var profile = this.config.profile,
            left = element.left,
            right = element.right,
            l_info = left.info,
            r_info = right.info,
            l_data = left.data,
            r_data = right.data;
            
        // Mid-side stereo
        if (element.commonWindow && element.maskPresent)
            this.processMS(element, l_data, r_data);
            
        if (profile === AOT_AAC_MAIN)
            throw new Error("Main prediction unimplemented");
        
        // Intensity stereo    
        this.processIS(element, l_data, r_data);
            
        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");
            
        this.applyChannelCoupling(element, CCEElement.BEFORE_TNS, l_data, r_data);
        
        if (left.tnsPresent)
            left.tns.process(left, l_data, false);
            
        if (right.tnsPresent)
            right.tns.process(right, r_data, false);
        
        this.applyChannelCoupling(element, CCEElement.AFTER_TNS, l_data, r_data);
        
        // filterbank
        this.filter_bank.process(l_info, l_data, this.data[channel], channel);
        this.filter_bank.process(r_info, r_data, this.data[channel + 1], channel + 1);
        
        if (profile === AOT_AAC_LTP)
            throw new Error("LTP prediction unimplemented");
        
        this.applyChannelCoupling(element, CCEElement.AFTER_IMDCT, this.data[channel], this.data[channel + 1]);
        
        if (left.gainPresent)
            throw new Error("Gain control not implemented");
            
        if (right.gainPresent)
            throw new Error("Gain control not implemented");
            
        if (this.sbrPresent)
            throw new Error("SBR not implemented");
    };
    
    // Intensity stereo
    this.prototype.processIS = function(element, left, right) {
        var ics = element.right,
            info = ics.info,
            offsets = info.swbOffsets,
            windowGroups = info.groupCount,
            maxSFB = info.maxSFB,
            bandTypes = ics.bandTypes,
            sectEnd = ics.sectEnd,
            scaleFactors = ics.scaleFactors;
        
        var idx = 0, groupOff = 0;
        for (var g = 0; g < windowGroups; g++) {
            for (var i = 0; i < maxSFB;) {
                var end = sectEnd[idx];
                
                if (bandTypes[idx] === ICStream.INTENSITY_BT || bandTypes[idx] === ICStream.INTENSITY_BT2) {
                    for (; i < end; i++, idx++) {
                        var c = bandTypes[idx] === ICStream.INTENSITY_BT ? 1 : -1;
                        if (element.maskPresent)
                            c *= element.ms_used[idx] ? -1 : 1;
                            
                        var scale = c * scaleFactors[idx];
                        for (var w = 0; w < info.groupLength[g]; w++) {
                            var off = groupOff + w * 128 + offsets[i],
                                len = offsets[i + 1] - offsets[i];
                                
                            for (var j = 0; j < len; j++) {
                                right[off + j] = left[off + j] * scale;
                            }
                        }
                    }
                } else  {
                    idx += end - i;
                    i = end;
                }
            }
            
            groupOff += info.groupLength[g] * 128;
        }
    };
    
    // Mid-side stereo
    this.prototype.processMS = function(element, left, right) {
        var ics = element.left,
            info = ics.info,
            offsets = info.swbOffsets,
            windowGroups = info.groupCount,
            maxSFB = info.maxSFB,
            sfbCBl = ics.bandTypes,
            sfbCBr = element.right.bandTypes;
            
        var groupOff = 0, idx = 0;
        for (var g = 0; g < windowGroups; g++) {
            for (var i = 0; i < maxSFB; i++, idx++) {
                if (element.ms_used[idx] && sfbCBl[idx] < ICStream.NOISE_BT && sfbCBr[idx] < ICStream.NOISE_BT) {
                    for (var w = 0; w < info.groupLength[g]; w++) {
                        var off = groupOff + w * 128 + offsets[i];
                        for (var j = 0; j < offsets[i + 1] - offsets[i]; j++) {
                            var t = left[off + j] - right[off + j];
                            left[off + j] += right[off + j];
                            right[off + j] = t;
                        }
                    }
                }
            }
            groupOff += info.groupLength[g] * 128;
        }
    };
    
    this.prototype.applyChannelCoupling = function(element, couplingPoint, data1, data2) {
        var cces = this.cces,
            isChannelPair = element instanceof CPEElement,
            applyCoupling = couplingPoint === CCEElement.AFTER_IMDCT ? 'applyIndependentCoupling' : 'applyDependentCoupling';
        
        for (var i = 0; i < cces.length; i++) {
            var cce = cces[i],
                index = 0;
                
            if (cce.couplingPoint === couplingPoint) {
                for (var c = 0; c < cce.coupledCount; c++) {
                    var chSelect = cce.chSelect[c];
                    if (cce.channelPair[c] === isChannelPair && cce.idSelect[c] === element.id) {
                        if (chSelect !== 1) {
                            cce[applyCoupling](index, data1);
                            if (chSelect) index++;
                        }
                        
                        if (chSelect !== 2)
                            cce[applyCoupling](index++, data2);
                            
                    } else {
                        index += 1 + (chSelect === 3 ? 1 : 0);
                    }
                }
            }
        }
    };
    
});

module.exports = AACDecoder;
