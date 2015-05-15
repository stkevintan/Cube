#
#  Original C(++) version by Apple, http://alac.macosforge.org
#
#  Javascript port by Jens Nockert and Devon Govett of OFMLabs, https://github.com/ofmlabs/alac.js
# 
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

AV = require 'av'
Aglib = require './ag_dec'
Dplib = require './dp_dec'
Matrixlib = require './matrix_dec'

class ALACDecoder extends AV.Decoder
    AV.Decoder.register('alac', ALACDecoder)
    
    ID_SCE = 0 # Single Channel Element
    ID_CPE = 1 # Channel Pair Element
    ID_CCE = 2 # Coupling Channel Element
    ID_LFE = 3 # LFE Channel Element
    ID_DSE = 4 # not yet supported
    ID_PCE = 5
    ID_FIL = 6
    ID_END = 7
    
    setCookie: (cookie) ->
        data = AV.Stream.fromBuffer(cookie)

        # For historical reasons the decoder needs to be resilient to magic cookies vended by older encoders.
        # There may be additional data encapsulating the ALACSpecificConfig. 
        # This would consist of format ('frma') and 'alac' atoms which precede the ALACSpecificConfig. 
        # See ALACMagicCookieDescription.txt in the original Apple decoder for additional documentation 
        # concerning the 'magic cookie'
        
        # skip format ('frma') atom if present
        if data.peekString(4, 4) is 'frma'
            data.advance(12)
            
        # skip 'alac' atom header if present
        if data.peekString(4, 4) is 'alac'
            data.advance(12)
        
        # read the ALACSpecificConfig    
        @config =
            frameLength: data.readUInt32()
            compatibleVersion: data.readUInt8()
            bitDepth: data.readUInt8()
            pb: data.readUInt8()
            mb: data.readUInt8()
            kb: data.readUInt8()
            numChannels: data.readUInt8()
            maxRun: data.readUInt16()
            maxFrameBytes: data.readUInt32()
            avgBitRate: data.readUInt32()
            sampleRate: data.readUInt32()
            
        # CAF files don't encode the bitsPerChannel
        @format.bitsPerChannel ||= @config.bitDepth
        
        # allocate mix buffers
        @mixBuffers = [
            new Int32Array(@config.frameLength) # left channel
            new Int32Array(@config.frameLength) # right channel
        ]
        
        # allocate dynamic predictor buffer
        predictorBuffer = new ArrayBuffer(@config.frameLength * 4)
        @predictor = new Int32Array(predictorBuffer)
        
        # "shift off" buffer shares memory with predictor buffer
        @shiftBuffer = new Int16Array(predictorBuffer)
    
    readChunk: (data) ->
        return unless @stream.available(4)
        
        data = @bitstream
        samples = @config.frameLength
        numChannels = @config.numChannels
        channelIndex = 0
                
        output = new ArrayBuffer(samples * numChannels * @config.bitDepth / 8)
        end = false
        
        while not end            
            # read element tag
            tag = data.read(3)
            
            switch tag
                when ID_SCE, ID_LFE, ID_CPE
                    channels = if tag is ID_CPE then 2 else 1
                
                    # if decoding this would take us over the max channel limit, bail
                    if channelIndex + channels > numChannels
                        throw new Error 'Too many channels!'
                    
                    # no idea what this is for... doesn't seem used anywhere
                    elementInstanceTag = data.read(4)
                    
                    # read the 12 unused header bits
                    unused = data.read(12)
                    
                    unless unused is 0
                        throw new Error 'Unused part of header does not contain 0, it should'
                    
                    # read the 1-bit "partial frame" flag, 2-bit "shift-off" flag & 1-bit "escape" flag
                    partialFrame = data.read(1)
                    bytesShifted = data.read(2)
                    escapeFlag = data.read(1)
                    
                    if bytesShifted is 3
                        throw new Error "Bytes are shifted by 3, they shouldn't be"
                    
                    # check for partial frame to override requested samples
                    if partialFrame
                        samples = data.read(32)
                    
                    if escapeFlag is 0
                        shift = bytesShifted * 8
                        chanBits = @config.bitDepth - shift + channels - 1
                        
                        # compressed frame, read rest of parameters
                        mixBits = data.read(8)
                        mixRes = data.read(8)
                        
                        mode = []
                        denShift = []
                        pbFactor = []
                        num = []
                        coefs = []
                        
                        for ch in [0...channels] by 1
                            mode[ch] = data.read(4)
                            denShift[ch] = data.read(4)
                            pbFactor[ch] = data.read(3)
                            num[ch] = data.read(5)
                            table = coefs[ch] = new Int16Array(32)
                            
                            for i in [0...num[ch]] by 1
                                table[i] = data.read(16)
                        
                        # if shift active, skip the the shift buffer but remember where it starts
                        if bytesShifted
                            shiftbits = data.copy()
                            data.advance(shift * channels * samples)
                        
                        # decompress and run predictors
                        {mb, pb, kb, maxRun} = @config
                        
                        for ch in [0...channels] by 1
                            params = Aglib.ag_params(mb, (pb * pbFactor[ch]) / 4, kb, samples, samples, maxRun)
                            status = Aglib.dyn_decomp(params, data, @predictor, samples, chanBits)
                            unless status
                                throw new Error 'Error in Aglib.dyn_decomp'
                        
                            if mode[ch] is 0
                                Dplib.unpc_block(@predictor, @mixBuffers[ch], samples, coefs[ch], num[ch], chanBits, denShift[ch])
                            else
                                # the special "numActive == 31" mode can be done in-place
                                Dplib.unpc_block(@predictor, @predictor, samples, null, 31, chanBits, 0)
                                Dplib.unpc_block(@predictor, @mixBuffers[ch], samples, coefs[ch], num[ch], chanBits, denShift[ch])
                        
                    else
                        # uncompressed frame, copy data into the mix buffer to use common output code
                        chanBits = @config.bitDepth
                        shift = 32 - chanBits
                        
                        for i in [0...samples] by 1
                            for ch in [0...channels] by 1
                                val = (data.read(chanBits) << shift) >> shift
                                @mixBuffers[ch][i] = val
                        
                        mixBits = mixRes = 0
                        bytesShifted = 0
                    
                    # now read the shifted values into the shift buffer
                    if bytesShifted
                        shift = bytesShifted * 8
                        for i in [0...samples * channels] by 1
                            @shiftBuffer[i] = shiftbits.read(shift)
                    
                    # un-mix the data and convert to output format
                    # - note that mixRes = 0 means just interleave so we use that path for uncompressed frames
                    switch @config.bitDepth
                        when 16
                            out16 = new Int16Array(output, channelIndex)
                            
                            if channels is 2
                                Matrixlib.unmix16(@mixBuffers[0], @mixBuffers[1], out16, numChannels, samples, mixBits, mixRes)
                            else
                                j = 0
                                buf = @mixBuffers[0]
                                for i in [0...samples] by 1
                                    out16[j] = buf[i]
                                    j += numChannels
                                
                        else
                            throw new Error 'Only supports 16-bit samples right now'
                        
                    channelIndex += channels

                when ID_CCE, ID_PCE
                    throw new Error "Unsupported element: #{tag}"
                    
                when ID_DSE
                    # the tag associates this data stream element with a given audio element
                    elementInstanceTag = data.read(4)
                    dataByteAlignFlag = data.read(1)
                    
                    # 8-bit count or (8-bit + 8-bit count) if 8-bit count == 255
                    count = data.read(8)
                    if count is 255
                        count += data.read(8)
                    
                    # the align flag means the bitstream should be byte-aligned before reading the following data bytes
                    if dataByteAlignFlag
                        data.align()
                        
                    # skip the data bytes
                    data.advance(count * 8)
                    unless data.pos < data.length
                        throw new Error 'buffer overrun'
                    
                when ID_FIL
                    # 4-bit count or (4-bit + 8-bit count) if 4-bit count == 15
                	  # - plus this weird -1 thing I still don't fully understand
                    count = data.read(4)
                    if count is 15
                        count += data.read(8) - 1
                        
                    data.advance(count * 8)
                    unless data.pos < data.length
                        throw new Error 'buffer overrun'
                                            
                when ID_END
                    data.align()
                    end = true
                    
                else
                    throw new Error "Unknown element: #{tag}"
            
            if channelIndex > numChannels
                throw new Error 'Channel index too large.'
            
        return new Int16Array(output)
        
module.exports = ALACDecoder
