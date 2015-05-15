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

var tables = require('./tables');
var Huffman = require('./huffman');
var TNS = require('./tns');
    
// Individual Channel Stream
function ICStream(config) {
    this.info = new ICSInfo();
    this.bandTypes = new Int32Array(MAX_SECTIONS);
    this.sectEnd = new Int32Array(MAX_SECTIONS);
    this.data = new Float32Array(config.frameLength);
    this.scaleFactors = new Float32Array(MAX_SECTIONS);
    this.randomState = 0x1F2E3D4C;
    this.tns = new TNS(config);
    this.specBuf = new Int32Array(4);
}
      
ICStream.ZERO_BT = 0;         // Scalefactors and spectral data are all zero.
ICStream.FIRST_PAIR_BT = 5;   // This and later band types encode two values (rather than four) with one code word.
ICStream.ESC_BT = 11;         // Spectral data are coded with an escape sequence.
ICStream.NOISE_BT = 13;       // Spectral data are scaled white noise not coded in the bitstream.
ICStream.INTENSITY_BT2 = 14;  // Scalefactor data are intensity stereo positions.
ICStream.INTENSITY_BT = 15;   // Scalefactor data are intensity stereo positions.

ICStream.ONLY_LONG_SEQUENCE = 0;
ICStream.LONG_START_SEQUENCE = 1;
ICStream.EIGHT_SHORT_SEQUENCE = 2;
ICStream.LONG_STOP_SEQUENCE = 3;

const MAX_SECTIONS = 120,
      MAX_WINDOW_GROUP_COUNT = 8;

const SF_DELTA = 60,
      SF_OFFSET = 200;

ICStream.prototype = {
    decode: function(stream, config, commonWindow) {
        this.globalGain = stream.read(8);
        
        if (!commonWindow)
            this.info.decode(stream, config, commonWindow);
            
        this.decodeBandTypes(stream, config);
        this.decodeScaleFactors(stream);
        
        if (this.pulsePresent = stream.read(1)) {
            if (this.info.windowSequence === ICStream.EIGHT_SHORT_SEQUENCE)
                throw new Error("Pulse tool not allowed in eight short sequence.");
                
            this.decodePulseData(stream);
        }
        
        if (this.tnsPresent = stream.read(1)) {
            this.tns.decode(stream, this.info);
        }
        
        if (this.gainPresent = stream.read(1)) {
            throw new Error("TODO: decode gain control/SSR");
        }
        
        this.decodeSpectralData(stream);
    },
    
    decodeBandTypes: function(stream, config) {
        var bits = this.info.windowSequence === ICStream.EIGHT_SHORT_SEQUENCE ? 3 : 5,
            groupCount = this.info.groupCount,
            maxSFB = this.info.maxSFB,
            bandTypes = this.bandTypes,
            sectEnd = this.sectEnd,
            idx = 0,
            escape = (1 << bits) - 1;
        
        for (var g = 0; g < groupCount; g++) {
            var k = 0;
            while (k < maxSFB) {
                var end = k,
                    bandType = stream.read(4);
                    
                if (bandType === 12)
                    throw new Error("Invalid band type: 12");
                    
                var incr;
                while ((incr = stream.read(bits)) === escape)
                    end += incr;
                    
                end += incr;
                
                if (end > maxSFB)
                    throw new Error("Too many bands (" + end + " > " + maxSFB + ")");
                    
                for (; k < end; k++) {
                    bandTypes[idx] = bandType;
                    sectEnd[idx++] = end;
                }
            }
        }
    },
    
    decodeScaleFactors: function(stream) {
        var groupCount = this.info.groupCount,
            maxSFB = this.info.maxSFB,
            offset = [this.globalGain, this.globalGain - 90, 0], // spectrum, noise, intensity
            idx = 0,
            noiseFlag = true,
            scaleFactors = this.scaleFactors,
            sectEnd = this.sectEnd,
            bandTypes = this.bandTypes;
                        
        for (var g = 0; g < groupCount; g++) {
            for (var i = 0; i < maxSFB;) {
                var runEnd = sectEnd[idx];
                
                switch (bandTypes[idx]) {
                    case ICStream.ZERO_BT:
                        for (; i < runEnd; i++, idx++) {
                            scaleFactors[idx] = 0;
                        }
                        break;
                        
                    case ICStream.INTENSITY_BT:
                    case ICStream.INTENSITY_BT2:
                        for(; i < runEnd; i++, idx++) {
                            offset[2] += Huffman.decodeScaleFactor(stream) - SF_DELTA;
                            var tmp = Math.min(Math.max(offset[2], -155), 100);
                            scaleFactors[idx] = tables.SCALEFACTOR_TABLE[-tmp + SF_OFFSET];
                        }
                        break;
                        
                    case ICStream.NOISE_BT:
                        for(; i < runEnd; i++, idx++) {
                            if (noiseFlag) {
                                offset[1] += stream.read(9) - 256;
                                noiseFlag = false;
                            } else {
                                offset[1] += Huffman.decodeScaleFactor(stream) - SF_DELTA;
                            }
                            var tmp = Math.min(Math.max(offset[1], -100), 155);
                            scaleFactors[idx] = -tables.SCALEFACTOR_TABLE[tmp + SF_OFFSET];
                        }
                        break;
                        
                    default:
                        for(; i < runEnd; i++, idx++) {
                            offset[0] += Huffman.decodeScaleFactor(stream) - SF_DELTA;
                            if(offset[0] > 255) 
                                throw new Error("Scalefactor out of range: " + offset[0]);
                                
                            scaleFactors[idx] = tables.SCALEFACTOR_TABLE[offset[0] - 100 + SF_OFFSET];
                        }
                        break;
                }
            }
        }
    },
    
    decodePulseData: function(stream) {
        var pulseCount = stream.read(2) + 1,
            pulseSWB = stream.read(6);
            
        if (pulseSWB >= this.info.swbCount)
            throw new Error("Pulse SWB out of range: " + pulseSWB);
            
        if (!this.pulseOffset || this.pulseOffset.length !== pulseCount) {
            // only reallocate if needed
            this.pulseOffset = new Int32Array(pulseCount);
            this.pulseAmp = new Int32Array(pulseCount);
        }
        
        this.pulseOffset[0] = this.info.swbOffsets[pulseSWB] + stream.read(5);
        this.pulseAmp[0] = stream.read(4);
        
        if (this.pulseOffset[0] > 1023)
            throw new Error("Pulse offset out of range: " + this.pulseOffset[0]);
        
        for (var i = 1; i < pulseCount; i++) {
            this.pulseOffset[i] = stream.read(5) + this.pulseOffset[i - 1];
            if (this.pulseOffset[i] > 1023)
                throw new Error("Pulse offset out of range: " + this.pulseOffset[i]);
                
            this.pulseAmp[i] = stream.read(4);
        }
    },
    
    decodeSpectralData: function(stream) {
        var data = this.data,
            info = this.info,
            maxSFB = info.maxSFB,
            windowGroups = info.groupCount,
            offsets = info.swbOffsets,
            bandTypes = this.bandTypes,
            scaleFactors = this.scaleFactors,
            buf = this.specBuf;
            
        var groupOff = 0, idx = 0;
        for (var g = 0; g < windowGroups; g++) {
            var groupLen = info.groupLength[g];
            
            for (var sfb = 0; sfb < maxSFB; sfb++, idx++) {
                var hcb = bandTypes[idx],
                    off = groupOff + offsets[sfb],
                    width = offsets[sfb + 1] - offsets[sfb];
                    
                if (hcb === ICStream.ZERO_BT || hcb === ICStream.INTENSITY_BT || hcb === ICStream.INTENSITY_BT2) {
                    for (var group = 0; group < groupLen; group++, off += 128) {
                        for (var i = off; i < off + width; i++) {
                            data[i] = 0;
                        }
                    }
                } else if (hcb === ICStream.NOISE_BT) {
                    // fill with random values
                    for (var group = 0; group < groupLen; group++, off += 128) {
                        var energy = 0;
                        
                        for (var k = 0; k < width; k++) {
                            this.randomState *= 1664525 + 1013904223;
                            data[off + k] = this.randomState;
                            energy += data[off + k] * data[off + k];
                        }
                        
                        var scale = scaleFactors[idx] / Math.sqrt(energy);
                        for (var k = 0; k < width; k++) {
                            data[off + k] *= scale;
                        }
                    }
                } else {
                    for (var group = 0; group < groupLen; group++, off += 128) {
                        var num = (hcb >= ICStream.FIRST_PAIR_BT) ? 2 : 4;
                        for (var k = 0; k < width; k += num) {
                            Huffman.decodeSpectralData(stream, hcb, buf, 0);
                            
                            // inverse quantization & scaling
                            for (var j = 0; j < num; j++) {
                                data[off + k + j] = (buf[j] > 0) ? tables.IQ_TABLE[buf[j]] : -tables.IQ_TABLE[-buf[j]];
                                data[off + k + j] *= scaleFactors[idx];
                            }
                        }
                    }
                }
            }
            groupOff += groupLen << 7;
        }
        
        // add pulse data, if present
        if (this.pulsePresent) {
            throw new Error('TODO: add pulse data');
        }
    }
}

// Individual Channel Stream Info
function ICSInfo() {
    this.windowShape = new Int32Array(2);
    this.windowSequence = ICStream.ONLY_LONG_SEQUENCE;
    this.groupLength = new Int32Array(MAX_WINDOW_GROUP_COUNT);
    this.ltpData1Present = false;
    this.ltpData2Present = false;
}

ICSInfo.prototype = {
    decode: function(stream, config, commonWindow) {
        stream.advance(1); // reserved
        
        this.windowSequence = stream.read(2);
        this.windowShape[0] = this.windowShape[1];
        this.windowShape[1] = stream.read(1);
        
        this.groupCount = 1;
        this.groupLength[0] = 1;
        
        if (this.windowSequence === ICStream.EIGHT_SHORT_SEQUENCE) {
            this.maxSFB = stream.read(4);
            for (var i = 0; i < 7; i++) {
                if (stream.read(1)) {
                    this.groupLength[this.groupCount - 1]++;
                } else {
                    this.groupCount++;
                    this.groupLength[this.groupCount - 1] = 1;
                }
            }
            
            this.windowCount = 8;
            this.swbOffsets = tables.SWB_OFFSET_128[config.sampleIndex];
            this.swbCount = tables.SWB_SHORT_WINDOW_COUNT[config.sampleIndex];
            this.predictorPresent = false;
        } else {
            this.maxSFB = stream.read(6);
            this.windowCount = 1;
            this.swbOffsets = tables.SWB_OFFSET_1024[config.sampleIndex];
            this.swbCount = tables.SWB_LONG_WINDOW_COUNT[config.sampleIndex];
            this.predictorPresent = !!stream.read(1);
            
            if (this.predictorPresent)
                this.decodePrediction(stream, config, commonWindow);
        }
    },
    
    decodePrediction: function(stream, config, commonWindow) {
        throw new Error('Prediction not implemented.');
        
        switch (config.profile) {
            case AOT_AAC_MAIN:
                throw new Error('Prediction not implemented.');
                break;
                
            case AOT_AAC_LTP:
                throw new Error('LTP prediction not implemented.');
                break;
                
            default:
                throw new Error('Unsupported profile for prediction ' + config.profile);
        }
    }
};

module.exports = ICStream;
