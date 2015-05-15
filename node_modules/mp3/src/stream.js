var AV = require('av');
var MP3FrameHeader = require('./header');

function MP3Stream(stream) {
    this.stream = stream;                     // actual bitstream
    this.sync = false;                        // stream sync found
    this.freerate = 0;                        // free bitrate (fixed)
    this.this_frame = stream.stream.offset;   // start of current frame
    this.next_frame = stream.stream.offset;   // start of next frame
    
    this.main_data = new Uint8Array(MP3FrameHeader.BUFFER_MDLEN); // actual audio data
    this.md_len = 0;                               // length of main data
    
    // copy methods from actual stream
    for (var key in stream) {
        if (typeof stream[key] === 'function')
            this[key] = stream[key].bind(stream);
    }
}

MP3Stream.prototype.getU8 = function(offset) {
    var stream = this.stream.stream;
    return stream.peekUInt8(offset - stream.offset);
};

MP3Stream.prototype.nextByte = function() {
    var stream = this.stream;
    return stream.bitPosition === 0 ? stream.stream.offset : stream.stream.offset + 1;
};

MP3Stream.prototype.doSync = function() {
    var stream = this.stream.stream;
    this.align();
    
    while (this.available(16) && !(stream.peekUInt8(0) === 0xff && (stream.peekUInt8(1) & 0xe0) === 0xe0)) {
        this.advance(8);
    }

    if (!this.available(MP3FrameHeader.BUFFER_GUARD))
        return false;
        
    return true;
};

MP3Stream.prototype.reset = function(byteOffset) {
    this.seek(byteOffset * 8);
    this.next_frame = byteOffset;
    this.sync = true;
};

module.exports = MP3Stream;
