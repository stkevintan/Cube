var AV = require('av');

function MP3FrameHeader() {
    this.layer          = 0; // audio layer (1, 2, or 3)
    this.mode           = 0; // channel mode (see above)
    this.mode_extension = 0; // additional mode info
    this.emphasis       = 0; // de-emphasis to use (see above)

    this.bitrate        = 0; // stream bitrate (bps)
    this.samplerate     = 0; // sampling frequency (Hz)

    this.crc_check      = 0; // frame CRC accumulator
    this.crc_target     = 0; // final target CRC checksum

    this.flags          = 0; // flags (see above)
    this.private_bits   = 0; // private bits
}

const BITRATES = [
    // MPEG-1
    [ 0,  32000,  64000,  96000, 128000, 160000, 192000, 224000,  // Layer I
         256000, 288000, 320000, 352000, 384000, 416000, 448000 ],
    [ 0,  32000,  48000,  56000,  64000,  80000,  96000, 112000,  // Layer II
         128000, 160000, 192000, 224000, 256000, 320000, 384000 ],
    [ 0,  32000,  40000,  48000,  56000,  64000,  80000,  96000,  // Layer III
         112000, 128000, 160000, 192000, 224000, 256000, 320000 ],

    // MPEG-2 LSF
    [ 0,  32000,  48000,  56000,  64000,  80000,  96000, 112000,  // Layer I
         128000, 144000, 160000, 176000, 192000, 224000, 256000 ],
    [ 0,   8000,  16000,  24000,  32000,  40000,  48000,  56000,  // Layers
          64000,  80000,  96000, 112000, 128000, 144000, 160000 ] // II & III
];

const SAMPLERATES = [ 
    44100, 48000, 32000 
];

MP3FrameHeader.FLAGS = {
    NPRIVATE_III: 0x0007,   // number of Layer III private bits
    INCOMPLETE  : 0x0008,   // header but not data is decoded

    PROTECTION  : 0x0010,   // frame has CRC protection
    COPYRIGHT   : 0x0020,   // frame is copyright
    ORIGINAL    : 0x0040,   // frame is original (else copy)
    PADDING     : 0x0080,   // frame has additional slot

    I_STEREO    : 0x0100,   // uses intensity joint stereo
    MS_STEREO   : 0x0200,   // uses middle/side joint stereo
    FREEFORMAT  : 0x0400,   // uses free format bitrate

    LSF_EXT     : 0x1000,   // lower sampling freq. extension
    MC_EXT      : 0x2000,   // multichannel audio extension
    MPEG_2_5_EXT: 0x4000    // MPEG 2.5 (unofficial) extension
};

const PRIVATE = {
    HEADER  : 0x0100, // header private bit
    III     : 0x001f  // Layer III private bits (up to 5)
};

MP3FrameHeader.MODE = {
    SINGLE_CHANNEL: 0, // single channel
    DUAL_CHANNEL  : 1, // dual channel
    JOINT_STEREO  : 2, // joint (MS/intensity) stereo
    STEREO        : 3  // normal LR stereo
};

const EMPHASIS = {
    NONE      : 0, // no emphasis
    _50_15_US : 1, // 50/15 microseconds emphasis
    CCITT_J_17: 3, // CCITT J.17 emphasis
    RESERVED  : 2  // unknown emphasis
};

MP3FrameHeader.BUFFER_GUARD = 8;
MP3FrameHeader.BUFFER_MDLEN = (511 + 2048 + MP3FrameHeader.BUFFER_GUARD);

MP3FrameHeader.prototype.copy = function() {
    var clone = new MP3FrameHeader();
    var keys = Object.keys(this);
    
    for (var key in keys) {
        clone[key] = this[key];
    }
    
    return clone;
}

MP3FrameHeader.prototype.nchannels = function () {
    return this.mode === 0 ? 1 : 2;
};

MP3FrameHeader.prototype.nbsamples = function() {
    return (this.layer === 1 ? 12 : ((this.layer === 3 && (this.flags & MP3FrameHeader.FLAGS.LSF_EXT)) ? 18 : 36));
};

MP3FrameHeader.prototype.framesize = function() {
    if (this.bitrate === 0)
        return null;
    
    var padding = (this.flags & MP3FrameHeader.FLAGS.PADDING ? 1 : 0);
    switch (this.layer) {
        case 1:
            var size = (this.bitrate * 12) / this.samplerate | 0;
            return (size + padding) * 4;
            
        case 2:
            var size = (this.bitrate * 144) / this.samplerate | 0;
            return size + padding;
            
        case 3:
        default:
            var lsf = this.flags & MP3FrameHeader.FLAGS.LSF_EXT ? 1 : 0;
            var size = (this.bitrate * 144) / (this.samplerate << lsf) | 0;
            return size + padding;
    }
};

MP3FrameHeader.prototype.decode = function(stream) {
    this.flags        = 0;
    this.private_bits = 0;
    
    // syncword 
    stream.advance(11);

    // MPEG 2.5 indicator (really part of syncword) 
    if (stream.read(1) === 0)
        this.flags |= MP3FrameHeader.FLAGS.MPEG_2_5_EXT;

    // ID 
    if (stream.read(1) === 0) {
        this.flags |= MP3FrameHeader.FLAGS.LSF_EXT;
    } else if (this.flags & MP3FrameHeader.FLAGS.MPEG_2_5_EXT) {
        throw new AV.UnderflowError(); // LOSTSYNC
    }

    // layer 
    this.layer = 4 - stream.read(2);

    if (this.layer === 4)
        throw new Error('Invalid layer');

    // protection_bit 
    if (stream.read(1) === 0)
        this.flags |= MP3FrameHeader.FLAGS.PROTECTION;

    // bitrate_index 
    var index = stream.read(4);
    if (index === 15)
        throw new Error('Invalid bitrate');

    if (this.flags & MP3FrameHeader.FLAGS.LSF_EXT) {
        this.bitrate = BITRATES[3 + (this.layer >> 1)][index];
    } else {
        this.bitrate = BITRATES[this.layer - 1][index];
    }

    // sampling_frequency 
    index = stream.read(2);
    if (index === 3)
        throw new Error('Invalid sampling frequency');

    this.samplerate = SAMPLERATES[index];

    if (this.flags & MP3FrameHeader.FLAGS.LSF_EXT) {
        this.samplerate /= 2;

        if (this.flags & MP3FrameHeader.FLAGS.MPEG_2_5_EXT)
            this.samplerate /= 2;
    }

    // padding_bit 
    if (stream.read(1))
        this.flags |= MP3FrameHeader.FLAGS.PADDING;

    // private_bit 
    if (stream.read(1))
        this.private_bits |= PRIVATE.HEADER;

    // mode 
    this.mode = 3 - stream.read(2);

    // mode_extension 
    this.mode_extension = stream.read(2);

    // copyright 
    if (stream.read(1))
        this.flags |= MP3FrameHeader.FLAGS.COPYRIGHT;

    // original/copy 
    if (stream.read(1))
        this.flags |= MP3FrameHeader.FLAGS.ORIGINAL;

    // emphasis 
    this.emphasis = stream.read(2);

    // crc_check 
    if (this.flags & MP3FrameHeader.FLAGS.PROTECTION)
        this.crc_target = stream.read(16);
};

MP3FrameHeader.decode = function(stream) {
    // synchronize
    var ptr = stream.next_frame;
    var syncing = true;
    var header = null;
    
    while (syncing) {
        syncing = false;
        
        if (stream.sync) {
            if (!stream.available(MP3FrameHeader.BUFFER_GUARD)) {
                stream.next_frame = ptr;
                throw new AV.UnderflowError();
            } else if (!(stream.getU8(ptr) === 0xff && (stream.getU8(ptr + 1) & 0xe0) === 0xe0)) {
                // mark point where frame sync word was expected
                stream.this_frame = ptr;
                stream.next_frame = ptr + 1;
                throw new AV.UnderflowError(); // LOSTSYNC
            }
        } else {
            stream.seek(ptr * 8);
            if (!stream.doSync())
                throw new AV.UnderflowError();
                
            ptr = stream.nextByte();
        }
        
        // begin processing
        stream.this_frame = ptr;
        stream.next_frame = ptr + 1; // possibly bogus sync word
        
        stream.seek(stream.this_frame * 8);
        
        header = new MP3FrameHeader();
        header.decode(stream);
        
        if (header.bitrate === 0) {
            if (stream.freerate === 0 || !stream.sync || (header.layer === 3 && stream.freerate > 640000))
                MP3FrameHeader.free_bitrate(stream, header);
            
            header.bitrate = stream.freerate;
            header.flags |= MP3FrameHeader.FLAGS.FREEFORMAT;
        }
        
        // calculate beginning of next frame
        var pad_slot = (header.flags & MP3FrameHeader.FLAGS.PADDING) ? 1 : 0;
        
        if (header.layer === 1) {
            var N = (((12 * header.bitrate / header.samplerate) << 0) + pad_slot) * 4;
        } else {
            var slots_per_frame = (header.layer === 3 && (header.flags & MP3FrameHeader.FLAGS.LSF_EXT)) ? 72 : 144;
            var N = ((slots_per_frame * header.bitrate / header.samplerate) << 0) + pad_slot;
        }
        
        // verify there is enough data left in buffer to decode this frame
        if (!stream.available(N + MP3FrameHeader.BUFFER_GUARD)) {
            stream.next_frame = stream.this_frame;
            throw new AV.UnderflowError();
        }
        
        stream.next_frame = stream.this_frame + N;
        
        if (!stream.sync) {
            // check that a valid frame header follows this frame
            ptr = stream.next_frame;
            
            if (!(stream.getU8(ptr) === 0xff && (stream.getU8(ptr + 1) & 0xe0) === 0xe0)) {
                ptr = stream.next_frame = stream.this_frame + 1;

                // emulating 'goto sync'
                syncing = true;
                continue;
            }
            
            stream.sync = true;
        }
    }
    
    header.flags |= MP3FrameHeader.FLAGS.INCOMPLETE;
    return header;
};

MP3FrameHeader.free_bitrate = function(stream, header) {
    var pad_slot = header.flags & MP3FrameHeader.FLAGS.PADDING ? 1 : 0,
        slots_per_frame = header.layer === 3 && header.flags & MP3FrameHeader.FLAGS.LSF_EXT ? 72 : 144;
    
    var start = stream.offset();
    var rate = 0;
        
    while (stream.doSync()) {
        var peek_header = header.copy();
        var peek_stream = stream.copy();
        
        if (peek_header.decode(peek_stream) && peek_header.layer === header.layer && peek_header.samplerate === header.samplerate) {
            var N = stream.nextByte() - stream.this_frame;
            
            if (header.layer === 1) {
                rate = header.samplerate * (N - 4 * pad_slot + 4) / 48 / 1000 | 0;
            } else {
                rate = header.samplerate * (N - pad_slot + 1) / slots_per_frame / 1000 | 0;
            }
            
            if (rate >= 8)
                break;
        }
        
        stream.advance(8);
    }
    
    stream.seek(start);
    
    if (rate < 8 || (header.layer === 3 && rate > 640))
        throw new AV.UnderflowError(); // LOSTSYNC
    
    stream.freerate = rate * 1000;
};

module.exports = MP3FrameHeader;
