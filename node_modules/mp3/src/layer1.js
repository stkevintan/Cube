var tables = require('./tables');
var MP3FrameHeader = require('./header');
var MP3Frame = require('./frame');
var utils = require('./utils');

function Layer1() {    
    this.allocation = utils.makeArray([2, 32], Uint8Array);
    this.scalefactor = utils.makeArray([2, 32], Uint8Array);
}

MP3Frame.layers[1] = Layer1;

// linear scaling table
const LINEAR_TABLE = new Float32Array([
    1.33333333333333, 1.14285714285714, 1.06666666666667,
    1.03225806451613, 1.01587301587302, 1.00787401574803,
    1.00392156862745, 1.00195694716243, 1.00097751710655,
    1.00048851978505, 1.00024420024420, 1.00012208521548,
    1.00006103888177, 1.00003051850948
]);

Layer1.prototype.decode = function(stream, frame) {
    var header = frame.header;
    var nch = header.nchannels();
    
    var bound = 32;
    if (header.mode === MP3FrameHeader.MODE.JOINT_STEREO) {
        header.flags |= MP3FrameHeader.FLAGS.I_STEREO;
        bound = 4 + header.mode_extension * 4;
    }
    
    if (header.flags & MP3FrameHeader.FLAGS.PROTECTION) {
        // TODO: crc check
    }
    
    // decode bit allocations
    var allocation = this.allocation;
    for (var sb = 0; sb < bound; sb++) {
        for (var ch = 0; ch < nch; ch++) {
            var nb = stream.read(4);
            if (nb === 15)
                throw new Error("forbidden bit allocation value");
                
            allocation[ch][sb] = nb ? nb + 1 : 0;
        }
    }
    
    for (var sb = bound; sb < 32; sb++) {
        var nb = stream.read(4);
        if (nb === 15)
            throw new Error("forbidden bit allocation value");
            
        allocation[0][sb] =
        allocation[1][sb] = nb ? nb + 1 : 0;
    }
    
    // decode scalefactors
    var scalefactor = this.scalefactor;
    for (var sb = 0; sb < 32; sb++) {
        for (var ch = 0; ch < nch; ch++) {
            if (allocation[ch][sb]) {
                scalefactor[ch][sb] = stream.read(6);
                
            	/*
            	 * Scalefactor index 63 does not appear in Table B.1 of
            	 * ISO/IEC 11172-3. Nonetheless, other implementations accept it,
                 * so we do as well 
                 */
            }
        }
    }
    
    // decode samples
    for (var s = 0; s < 12; s++) {
        for (var sb = 0; sb < bound; sb++) {
            for (var ch = 0; ch < nch; ch++) {
                var nb = allocation[ch][sb];
                frame.sbsample[ch][s][sb] = nb ? this.sample(stream, nb) * tables.SF_TABLE[scalefactor[ch][sb]] : 0;
            }
        }
        
        for (var sb = bound; sb < 32; sb++) {
            var nb = allocation[0][sb];
            if (nb) {
                var sample = this.sample(stream, nb);
                
                for (var ch = 0; ch < nch; ch++) {
                    frame.sbsample[ch][s][sb] = sample * tables.SF_TABLE[scalefactor[ch][sb]];
                }
            } else {
                for (var ch = 0; ch < nch; ch++) {
                    frame.sbsample[ch][s][sb] = 0;
                }
            }
        }
    }
};

Layer1.prototype.sample = function(stream, nb) {
    var sample = stream.read(nb);
    
    // invert most significant bit, and form a 2's complement sample
    sample ^= 1 << (nb - 1);
    sample |= -(sample & (1 << (nb - 1)));
    sample /= (1 << (nb - 1));
        
    // requantize the sample
    // s'' = (2^nb / (2^nb - 1)) * (s''' + 2^(-nb + 1))
    sample += 1 >> (nb - 1);
    return sample * LINEAR_TABLE[nb - 2];
};

module.exports = Layer1;
