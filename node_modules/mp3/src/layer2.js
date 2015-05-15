var tables = require('./tables');
var MP3FrameHeader = require('./header');
var MP3Frame = require('./frame');
var utils = require('./utils');

function Layer2() {    
    this.samples = new Float64Array(3);
    this.allocation = utils.makeArray([2, 32], Uint8Array);
    this.scfsi = utils.makeArray([2, 32], Uint8Array);
    this.scalefactor = utils.makeArray([2, 32, 3], Uint8Array);
}

MP3Frame.layers[2] = Layer2;

// possible quantization per subband table
const SBQUANT = [
  // ISO/IEC 11172-3 Table B.2a
  { sblimit: 27, offsets:
      [ 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0 ] },
      
  // ISO/IEC 11172-3 Table B.2b
  { sblimit: 30, offsets:
      [ 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0 ] },
      
  // ISO/IEC 11172-3 Table B.2c
  {  sblimit: 8, offsets:
      [ 5, 5, 2, 2, 2, 2, 2, 2 ] },
      
  // ISO/IEC 11172-3 Table B.2d
  { sblimit: 12, offsets:
      [ 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ] },
      
  // ISO/IEC 13818-3 Table B.1
  { sblimit: 30, offsets:
      [ 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ] }
];

// bit allocation table
const BITALLOC = [
    { nbal: 2, offset: 0 },  // 0
    { nbal: 2, offset: 3 },  // 1
    { nbal: 3, offset: 3 },  // 2
    { nbal: 3, offset: 1 },  // 3
    { nbal: 4, offset: 2 },  // 4
    { nbal: 4, offset: 3 },  // 5
    { nbal: 4, offset: 4 },  // 6
    { nbal: 4, offset: 5 }   // 7
];

// offsets into quantization class table
const OFFSETS = [
    [ 0, 1, 16                                             ],  // 0
    [ 0, 1,  2, 3, 4, 5, 16                                ],  // 1
    [ 0, 1,  2, 3, 4, 5,  6, 7,  8,  9, 10, 11, 12, 13, 14 ],  // 2
    [ 0, 1,  3, 4, 5, 6,  7, 8,  9, 10, 11, 12, 13, 14, 15 ],  // 3
    [ 0, 1,  2, 3, 4, 5,  6, 7,  8,  9, 10, 11, 12, 13, 16 ],  // 4
    [ 0, 2,  4, 5, 6, 7,  8, 9, 10, 11, 12, 13, 14, 15, 16 ]   // 5
];



/*
 * These are the Layer II classes of quantization.
 * The table is derived from Table B.4 of ISO/IEC 11172-3.
 */
const QC_TABLE = [
    { nlevels:     3, group: 2, bits:  5, C: 1.33333333333, D: 0.50000000000 },
    { nlevels:     5, group: 3, bits:  7, C: 1.60000000000, D: 0.50000000000 },
    { nlevels:     7, group: 0, bits:  3, C: 1.14285714286, D: 0.25000000000 },
    { nlevels:     9, group: 4, bits: 10, C: 1.77777777777, D: 0.50000000000 },
    { nlevels:    15, group: 0, bits:  4, C: 1.06666666666, D: 0.12500000000 },
    { nlevels:    31, group: 0, bits:  5, C: 1.03225806452, D: 0.06250000000 },
    { nlevels:    63, group: 0, bits:  6, C: 1.01587301587, D: 0.03125000000 },
    { nlevels:   127, group: 0, bits:  7, C: 1.00787401575, D: 0.01562500000 },
    { nlevels:   255, group: 0, bits:  8, C: 1.00392156863, D: 0.00781250000 },
    { nlevels:   511, group: 0, bits:  9, C: 1.00195694716, D: 0.00390625000 },
    { nlevels:  1023, group: 0, bits: 10, C: 1.00097751711, D: 0.00195312500 },
    { nlevels:  2047, group: 0, bits: 11, C: 1.00048851979, D: 0.00097656250 },
    { nlevels:  4095, group: 0, bits: 12, C: 1.00024420024, D: 0.00048828125 },
    { nlevels:  8191, group: 0, bits: 13, C: 1.00012208522, D: 0.00024414063 },
    { nlevels: 16383, group: 0, bits: 14, C: 1.00006103888, D: 0.00012207031 },
    { nlevels: 32767, group: 0, bits: 15, C: 1.00003051851, D: 0.00006103516 },
    { nlevels: 65535, group: 0, bits: 16, C: 1.00001525902, D: 0.00003051758 }
];

Layer2.prototype.decode = function(stream, frame) {
    var header = frame.header;
    var nch = header.nchannels();
    var index;
    
    if (header.flags & MP3FrameHeader.FLAGS.LSF_EXT) {
        index = 4;
    } else if (header.flags & MP3FrameHeader.FLAGS.FREEFORMAT) {
        index = header.samplerate === 48000 ? 0 : 1;
    } else {
        var bitrate_per_channel = header.bitrate;
        
        if (nch === 2) {
            bitrate_per_channel /= 2;
            
            /*
             * ISO/IEC 11172-3 allows only single channel mode for 32, 48, 56, and
             * 80 kbps bitrates in Layer II, but some encoders ignore this
             * restriction, so we ignore it as well.
             */
        } else {
            /*
        	 * ISO/IEC 11172-3 does not allow single channel mode for 224, 256,
        	 * 320, or 384 kbps bitrates in Layer II.
        	 */
            if (bitrate_per_channel > 192000)
                throw new Error('bad bitrate/mode combination');
        }
        
        if (bitrate_per_channel <= 48000)
            index = header.samplerate === 32000 ? 3 : 2;
        else if (bitrate_per_channel <= 80000)
            index = 0;
        else
            index = header.samplerate === 48000 ? 0 : 1;
    }
    
    var sblimit = SBQUANT[index].sblimit;
    var offsets = SBQUANT[index].offsets;
    
    var bound = 32;
    if (header.mode === MP3FrameHeader.MODE.JOINT_STEREO) {
        header.flags |= MP3FrameHeader.FLAGS.I_STEREO;
        bound = 4 + header.mode_extension * 4;
    }
    
    if (bound > sblimit)
        bound = sblimit;
    
    // decode bit allocations
    var allocation = this.allocation;
    for (var sb = 0; sb < bound; sb++) {
        var nbal = BITALLOC[offsets[sb]].nbal;
        
        for (var ch = 0; ch < nch; ch++)
            allocation[ch][sb] = stream.read(nbal);
    }
    
    for (var sb = bound; sb < sblimit; sb++) {
        var nbal = BITALLOC[offsets[sb]].nbal;
        
        allocation[0][sb] =
        allocation[1][sb] = stream.read(nbal);
    }
    
    // decode scalefactor selection info
    var scfsi = this.scfsi;
    for (var sb = 0; sb < sblimit; sb++) {
        for (var ch = 0; ch < nch; ch++) {
            if (allocation[ch][sb])
                scfsi[ch][sb] = stream.read(2);
        }
    }
    
    if (header.flags & MP3FrameHeader.FLAGS.PROTECTION) {
        // TODO: crc check
    }
    
    // decode scalefactors
    var scalefactor = this.scalefactor;
    for (var sb = 0; sb < sblimit; sb++) {
        for (var ch = 0; ch < nch; ch++) {
            if (allocation[ch][sb]) {
                scalefactor[ch][sb][0] = stream.read(6);
                
                switch (scfsi[ch][sb]) {
            	    case 2:
            	        scalefactor[ch][sb][2] =
                        scalefactor[ch][sb][1] = scalefactor[ch][sb][0];
                        break;
                        
                    case 0:
                        scalefactor[ch][sb][1] = stream.read(6);
                    	// fall through
                    	
                    case 1:
                    case 3:
                        scalefactor[ch][sb][2] = stream.read(6);
                }
                
                if (scfsi[ch][sb] & 1)
                    scalefactor[ch][sb][1] = scalefactor[ch][sb][scfsi[ch][sb] - 1];
                    
                /*
            	 * Scalefactor index 63 does not appear in Table B.1 of
            	 * ISO/IEC 11172-3. Nonetheless, other implementations accept it,
            	 * so we do as well.
            	 */
            }
        }
    }
    
    // decode samples
    for (var gr = 0; gr < 12; gr++) {
        // normal
        for (var sb = 0; sb < bound; sb++) {
            for (var ch = 0; ch < nch; ch++) {                
                if (index = allocation[ch][sb]) {
                    index = OFFSETS[BITALLOC[offsets[sb]].offset][index - 1];
                    this.decodeSamples(stream, QC_TABLE[index]);
                    
                    var scale = tables.SF_TABLE[scalefactor[ch][sb][gr >> 2]];
                    for (var s = 0; s < 3; s++) {
                        frame.sbsample[ch][3 * gr + s][sb] = this.samples[s] * scale;
                    }
                } else {
                    for (var s = 0; s < 3; s++) {
                        frame.sbsample[ch][3 * gr + s][sb] = 0;
                    }
                }
            }
        }
        
        // joint stereo
        for (var sb = bound; sb < sblimit; sb++) {
            if (index = allocation[0][sb]) {
                index = OFFSETS[BITALLOC[offsets[sb]].offset][index - 1];
                this.decodeSamples(stream, QC_TABLE[index]);
                
                for (var ch = 0; ch < nch; ch++) {
                    var scale = tables.SF_TABLE[scalefactor[ch][sb][gr >> 2]];
                    for (var s = 0; s < 3; s++) {
                        frame.sbsample[ch][3 * gr + s][sb] = this.samples[s] * scale;
                    }
                }
            } else {
                for (var ch = 0; ch < nch; ch++) {
                    for (var s = 0; s < 3; s++) {
                        frame.sbsample[ch][3 * gr + s][sb] = 0;
                    }
                }
            }
        }
        
        // the rest
        for (var ch = 0; ch < nch; ch++) {
            for (var s = 0; s < 3; s++) {
                for (var sb = sblimit; sb < 32; sb++) {
                    frame.sbsample[ch][3 * gr + s][sb] = 0;
                }
            }
        }
    }
};

Layer2.prototype.decodeSamples = function(stream, quantclass) {
    var sample = this.samples;
    var nb = quantclass.group;
    
    if (nb) {
        // degrouping
        var c = stream.read(quantclass.bits);
        var nlevels = quantclass.nlevels;
        
        for (var s = 0; s < 3; s++) {
            sample[s] = c % nlevels;
            c = c / nlevels | 0;
        }
    } else {
        nb = quantclass.bits;
        for (var s = 0; s < 3; s++) {
            sample[s] = stream.read(nb);
        }
    }
    
    for (var s = 0; s < 3; s++) {
        // invert most significant bit, and form a 2's complement sample
        var requantized = sample[s] ^ (1 << (nb - 1));
        requantized |= -(requantized & (1 << (nb - 1)));
        requantized /= (1 << (nb - 1));
        
        // requantize the sample
        sample[s] = (requantized + quantclass.D) * quantclass.C;
    }
};

module.exports = Layer2;
