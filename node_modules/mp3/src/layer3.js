var AV = require('av');
var tables = require('./tables');
var MP3FrameHeader = require('./header');
var MP3Frame = require('./frame');
var huffman = require('./huffman');
var IMDCT = require('./imdct');
var utils = require('./utils');

function MP3SideInfo() {
    this.main_data_begin = null;
    this.private_bits = null;
    this.gr = [new MP3Granule(), new MP3Granule()];
    this.scfsi = new Uint8Array(2);
}

function MP3Granule() {
    this.ch = [new MP3Channel(), new MP3Channel()];
}

function MP3Channel() {
    // from side info
    this.part2_3_length    = null;
    this.big_values        = null;
    this.global_gain       = null;
    this.scalefac_compress = null;
    
    this.flags         = null;
    this.block_type    = null;
    this.table_select  = new Uint8Array(3);
    this.subblock_gain = new Uint8Array(3);
    this.region0_count = null;
    this.region1_count = null;
    
    // from main_data
    this.scalefac = new Uint8Array(39);
}

function Layer3() {
    this.imdct = new IMDCT();
    this.si = new MP3SideInfo();
    
    // preallocate reusable typed arrays for performance
    this.xr = [new Float64Array(576), new Float64Array(576)];
    this._exponents = new Int32Array(39);
    this.reqcache = new Float64Array(16);
    this.modes = new Int16Array(39);
    this.output = new Float64Array(36);
    
    this.tmp = utils.makeArray([32, 3, 6]);
    this.tmp2 = new Float64Array(32 * 3 * 6);
}

MP3Frame.layers[3] = Layer3;

Layer3.prototype.decode = function(stream, frame) {
    var header = frame.header;
    var next_md_begin = 0;
    var md_len = 0;
    
    var nch = header.nchannels();
    var si_len = (header.flags & MP3FrameHeader.FLAGS.LSF_EXT) ? (nch === 1 ? 9 : 17) : (nch === 1 ? 17 : 32);
        
    // check frame sanity
    if (stream.next_frame - stream.nextByte() < si_len) {
        stream.md_len = 0;
        throw new Error('Bad frame length');
    }
    
    // check CRC word
    if (header.flags & MP3FrameHeader.FLAGS.PROTECTION) {
        // TODO: crc check
    }
    
    // decode frame side information
    var sideInfo = this.sideInfo(stream, nch, header.flags & MP3FrameHeader.FLAGS.LSF_EXT);        
    var si = sideInfo.si;
    var data_bitlen = sideInfo.data_bitlen;
    var priv_bitlen = sideInfo.priv_bitlen;
    
    header.flags        |= priv_bitlen;
    header.private_bits |= si.private_bits;
    
    // find main_data of next frame
    var peek = stream.copy();
    peek.seek(stream.next_frame * 8);
    
    var nextHeader = peek.read(16);    
    if ((nextHeader & 0xffe6) === 0xffe2) { // syncword | layer
        if ((nextHeader & 1) === 0) // protection bit
            peek.advance(16); // crc check
            
        peek.advance(16); // skip the rest of the header
        next_md_begin = peek.read((nextHeader & 8) ? 9 : 8);
    }
    
    // find main_data of this frame
    var frame_space = stream.next_frame - stream.nextByte();
    
    if (next_md_begin > si.main_data_begin + frame_space)
        next_md_begin = 0;
        
    var md_len = si.main_data_begin + frame_space - next_md_begin;
    var frame_used = 0;
    var ptr;
    
    if (si.main_data_begin === 0) {
        ptr = stream.stream;
        stream.md_len = 0;
        frame_used = md_len;
    } else {
        if (si.main_data_begin > stream.md_len) {
            throw new Error('bad main_data_begin pointer');
        } else {
            var old_md_len = stream.md_len;
            
            if (md_len > si.main_data_begin) {
                if (stream.md_len + md_len - si.main_data_begin > MP3FrameHeader.BUFFER_MDLEN) {
                    throw new Error("Assertion failed: (stream.md_len + md_len - si.main_data_begin <= MAD_MP3FrameHeader.BUFFER_MDLEN)");
                }
                
                frame_used = md_len - si.main_data_begin;
                this.memcpy(stream.main_data, stream.md_len, stream.stream.stream, stream.nextByte(), frame_used);
                stream.md_len += frame_used;
            }
            
            ptr = new AV.Bitstream(AV.Stream.fromBuffer(new AV.Buffer(stream.main_data)));
            ptr.advance((old_md_len - si.main_data_begin) * 8);
        }
    }
    
    var frame_free = frame_space - frame_used;
    
    // decode main_data
    this.decodeMainData(ptr, frame, si, nch);
    
    // preload main_data buffer with up to 511 bytes for next frame(s)
    if (frame_free >= next_md_begin) {
        this.memcpy(stream.main_data, 0, stream.stream.stream, stream.next_frame - next_md_begin, next_md_begin);
        stream.md_len = next_md_begin;
    } else {
        if (md_len < si.main_data_begin) {
            var extra = si.main_data_begin - md_len;
            if (extra + frame_free > next_md_begin)
                extra = next_md_begin - frame_free;

            if (extra < stream.md_len) {
                this.memcpy(stream.main_data, 0, stream.main_data, stream.md_len - extra, extra);
                stream.md_len = extra;
            }
        } else {
            stream.md_len = 0;
        }
        
        this.memcpy(stream.main_data, stream.md_len, stream.stream.stream, stream.next_frame - frame_free, frame_free);
        stream.md_len += frame_free;
    }
};

Layer3.prototype.memcpy = function(dst, dstOffset, pSrc, srcOffset, length) {
    var subarr;
    if (pSrc.subarray)
        subarr = pSrc.subarray(srcOffset, srcOffset + length);
    else
        subarr = pSrc.peekBuffer(srcOffset - pSrc.offset, length).data;

    // oh my, memcpy actually exists in JavaScript?
    dst.set(subarr, dstOffset);
    return dst;
};

Layer3.prototype.sideInfo = function(stream, nch, lsf) {
    var si = this.si;
    var data_bitlen = 0;
    var priv_bitlen = lsf ? ((nch === 1) ? 1 : 2) : ((nch === 1) ? 5 : 3);
    
    si.main_data_begin = stream.read(lsf ? 8 : 9);
    si.private_bits    = stream.read(priv_bitlen);

    var ngr = 1;
    if (!lsf) {
        ngr = 2;
        for (var ch = 0; ch < nch; ++ch)
            si.scfsi[ch] = stream.read(4);
    }
    
    for (var gr = 0; gr < ngr; gr++) {
        var granule = si.gr[gr];
        
        for (var ch = 0; ch < nch; ch++) {
            var channel = granule.ch[ch];
            
            channel.part2_3_length    = stream.read(12);
            channel.big_values        = stream.read(9);
            channel.global_gain       = stream.read(8);
            channel.scalefac_compress = stream.read(lsf ? 9 : 4);

            data_bitlen += channel.part2_3_length;

            if (channel.big_values > 288)
                throw new Error('bad big_values count');

            channel.flags = 0;

            // window_switching_flag
            if (stream.read(1)) {
                channel.block_type = stream.read(2);

                if (channel.block_type === 0)
                    throw new Error('reserved block_type');

                if (!lsf && channel.block_type === 2 && si.scfsi[ch])
                    throw new Error('bad scalefactor selection info');

                channel.region0_count = 7;
                channel.region1_count = 36;

                if (stream.read(1))
                    channel.flags |= tables.MIXED_BLOCK_FLAG;
                else if (channel.block_type === 2)
                    channel.region0_count = 8;

                for (var i = 0; i < 2; i++)
                    channel.table_select[i] = stream.read(5);

                for (var i = 0; i < 3; i++)
                    channel.subblock_gain[i] = stream.read(3);
            } else {
                channel.block_type = 0;

                for (var i = 0; i < 3; i++)
                    channel.table_select[i] = stream.read(5);

                channel.region0_count = stream.read(4);
                channel.region1_count = stream.read(3);
            }

            // [preflag,] scalefac_scale, count1table_select
            channel.flags |= stream.read(lsf ? 2 : 3);
        }
    }
    
    return {
        si: si,
        data_bitlen: data_bitlen,
        priv_bitlen: priv_bitlen
    };
};

Layer3.prototype.decodeMainData = function(stream, frame, si, nch) {
    var header = frame.header;
    var sfreq = header.samplerate;

    if (header.flags & MP3FrameHeader.FLAGS.MPEG_2_5_EXT)
        sfreq *= 2;

    // 48000 => 0, 44100 => 1, 32000 => 2,
    // 24000 => 3, 22050 => 4, 16000 => 5
    var sfreqi = ((sfreq >>  7) & 0x000f) + ((sfreq >> 15) & 0x0001) - 8;

    if (header.flags & MP3FrameHeader.FLAGS.MPEG_2_5_EXT)
        sfreqi += 3;
        
    // scalefactors, Huffman decoding, requantization
    var ngr = (header.flags & MP3FrameHeader.FLAGS.LSF_EXT) ? 1 : 2;
    var xr = this.xr;
    
    for (var gr = 0; gr < ngr; ++gr) {
        var granule = si.gr[gr];
        var sfbwidth = [];
        var l = 0;
        
        for (var ch = 0; ch < nch; ++ch) {
            var channel = granule.ch[ch];
            var part2_length;
            
            sfbwidth[ch] = tables.SFBWIDTH_TABLE[sfreqi].l;
            if (channel.block_type === 2) {
                sfbwidth[ch] = (channel.flags & tables.MIXED_BLOCK_FLAG) ? tables.SFBWIDTH_TABLE[sfreqi].m : tables.SFBWIDTH_TABLE[sfreqi].s;
            }

            if (header.flags & MP3FrameHeader.FLAGS.LSF_EXT) {
                part2_length = this.scalefactors_lsf(stream, channel, ch === 0 ? 0 : si.gr[1].ch[1], header.mode_extension);
            } else {
                part2_length = this.scalefactors(stream, channel, si.gr[0].ch[ch], gr === 0 ? 0 : si.scfsi[ch]);
            }

            this.huffmanDecode(stream, xr[ch], channel, sfbwidth[ch], part2_length);
        }
        
        // joint stereo processing
        if (header.mode === MP3FrameHeader.MODE.JOINT_STEREO && header.mode_extension !== 0)
            this.stereo(xr, si.gr, gr, header, sfbwidth[0]);
        
        // reordering, alias reduction, IMDCT, overlap-add, frequency inversion
        for (var ch = 0; ch < nch; ch++) {
            var channel = granule.ch[ch];
            var sample = frame.sbsample[ch].slice(18 * gr);
            
            var sb, l = 0, i, sblimit;
            var output = this.output;
            
            if (channel.block_type === 2) {
                this.reorder(xr[ch], channel, sfbwidth[ch]);

                /*
                 * According to ISO/IEC 11172-3, "Alias reduction is not applied for
                 * granules with block_type === 2 (short block)." However, other
                 * sources suggest alias reduction should indeed be performed on the
                 * lower two subbands of mixed blocks. Most other implementations do
                 * this, so by default we will too.
                 */
                if (channel.flags & tables.MIXED_BLOCK_FLAG)
                    this.aliasreduce(xr[ch], 36);
            } else {
                this.aliasreduce(xr[ch], 576);
            }
            
            // subbands 0-1
            if (channel.block_type !== 2 || (channel.flags & tables.MIXED_BLOCK_FLAG)) {
                var block_type = channel.block_type;
                if (channel.flags & tables.MIXED_BLOCK_FLAG)
                    block_type = 0;

                // long blocks
                for (var sb = 0; sb < 2; ++sb, l += 18) {
                    this.imdct_l(xr[ch].subarray(l, l + 18), output, block_type);
                    this.overlap(output, frame.overlap[ch][sb], sample, sb);
                }
            } else {
                // short blocks
                for (var sb = 0; sb < 2; ++sb, l += 18) {
                    this.imdct_s(xr[ch].subarray(l, l + 18), output);
                    this.overlap(output, frame.overlap[ch][sb], sample, sb);
                }
            }
            
            this.freqinver(sample, 1);

            // (nonzero) subbands 2-31
            var i = 576;
            while (i > 36 && xr[ch][i - 1] === 0) {
                --i;
            }
            
            sblimit = 32 - (((576 - i) / 18) << 0);

            if (channel.block_type !== 2) {
                // long blocks
                for (var sb = 2; sb < sblimit; ++sb, l += 18) {
                    this.imdct_l(xr[ch].subarray(l, l + 18), output, channel.block_type);
                    this.overlap(output, frame.overlap[ch][sb], sample, sb);

                    if (sb & 1)
                        this.freqinver(sample, sb);
                }
            } else {
                // short blocks
                for (var sb = 2; sb < sblimit; ++sb, l += 18) {
                    this.imdct_s(xr[ch].subarray(l, l + 18), output);
                    this.overlap(output, frame.overlap[ch][sb], sample, sb);

                    if (sb & 1)
                        this.freqinver(sample, sb);
                }
            }
            
            // remaining (zero) subbands
            for (var sb = sblimit; sb < 32; ++sb) {
                this.overlap_z(frame.overlap[ch][sb], sample, sb);

                if (sb & 1)
                    this.freqinver(sample, sb);
            }
        }
    }
};

Layer3.prototype.scalefactors = function(stream, channel, gr0ch, scfsi) {
    var start = stream.offset();
    var slen1 = tables.SFLEN_TABLE[channel.scalefac_compress].slen1;
    var slen2 = tables.SFLEN_TABLE[channel.scalefac_compress].slen2;
    var sfbi;
    
    if (channel.block_type === 2) {
        sfbi = 0;

        var nsfb = (channel.flags & tables.MIXED_BLOCK_FLAG) ? 8 + 3 * 3 : 6 * 3;
        while (nsfb--)
            channel.scalefac[sfbi++] = stream.read(slen1);

        nsfb = 6 * 3;
        while (nsfb--)
            channel.scalefac[sfbi++] = stream.read(slen2);

        nsfb = 1 * 3;
        while (nsfb--)
            channel.scalefac[sfbi++] = 0;
    } else {
        if (scfsi & 0x8) {
            for (var sfbi = 0; sfbi < 6; ++sfbi)
                channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
        } else {
            for (var sfbi = 0; sfbi < 6; ++sfbi)
                channel.scalefac[sfbi] = stream.read(slen1);
        }

        if (scfsi & 0x4) {
            for (var sfbi = 6; sfbi < 11; ++sfbi)
                channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
        } else {
            for (var sfbi = 6; sfbi < 11; ++sfbi)
                channel.scalefac[sfbi] = stream.read(slen1);
        }

        if (scfsi & 0x2) {
            for (var sfbi = 11; sfbi < 16; ++sfbi)
                channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
        } else {
            for (var sfbi = 11; sfbi < 16; ++sfbi)
                channel.scalefac[sfbi] = stream.read(slen2);
        }

        if (scfsi & 0x1) {
            for (var sfbi = 16; sfbi < 21; ++sfbi)
                channel.scalefac[sfbi] = gr0ch.scalefac[sfbi];
        } else {
            for (var sfbi = 16; sfbi < 21; ++sfbi)
                channel.scalefac[sfbi] = stream.read(slen2);
        }

        channel.scalefac[21] = 0;
    }
    
    return stream.offset() - start;
};

Layer3.prototype.scalefactors_lsf = function(stream, channel, gr1ch, mode_extension) {
    var start = stream.offset();
    var scalefac_compress = channel.scalefac_compress;
    var index = channel.block_type === 2 ? (channel.flags & tables.MIXED_BLOCK_FLAG ? 2 : 1) : 0;
    var slen = new Int32Array(4);
    var nsfb;
    
    if (!((mode_extension & tables.I_STEREO) && gr1ch)) {
        if (scalefac_compress < 400) {
            slen[0] = (scalefac_compress >>> 4) / 5;
            slen[1] = (scalefac_compress >>> 4) % 5;
            slen[2] = (scalefac_compress % 16) >>> 2;
            slen[3] =  scalefac_compress %  4;
        
            nsfb = tables.NSFB_TABLE[0][index];
        } else if (scalefac_compress < 500) {
            scalefac_compress -= 400;

            slen[0] = (scalefac_compress >>> 2) / 5;
            slen[1] = (scalefac_compress >>> 2) % 5;
            slen[2] =  scalefac_compress % 4;
            slen[3] = 0;

            nsfb = tables.NSFB_TABLE[1][index];
        } else {
            scalefac_compress -= 500;

            slen[0] = scalefac_compress / 3;
            slen[1] = scalefac_compress % 3;
            slen[2] = 0;
            slen[3] = 0;

            channel.flags |= tables.PREFLAG;
            nsfb = tables.NSFB_TABLE[2][index];
        }
        
        var n = 0;
        for (var part = 0; part < 4; part++) {
            for (var i = 0; i < nsfb[part]; i++) {
                channel.scalefac[n++] = stream.read(slen[part]);
            }
        }
        
        while (n < 39) {
            channel.scalefac[n++] = 0;
        }
    } else {  // (mode_extension & tables.I_STEREO) && gr1ch (i.e. ch == 1)
        scalefac_compress >>>= 1;
        
        if (scalefac_compress < 180) {
            slen[0] =  scalefac_compress / 36;
            slen[1] = (scalefac_compress % 36) / 6;
            slen[2] = (scalefac_compress % 36) % 6;
            slen[3] = 0;

            nsfb = tables.NSFB_TABLE[3][index];
        } else if (scalefac_compress < 244) {
            scalefac_compress -= 180;

            slen[0] = (scalefac_compress % 64) >>> 4;
            slen[1] = (scalefac_compress % 16) >>> 2;
            slen[2] =  scalefac_compress %  4;
            slen[3] = 0;

            nsfb = tables.NSFB_TABLE[4][index];
        } else {
            scalefac_compress -= 244;

            slen[0] = scalefac_compress / 3;
            slen[1] = scalefac_compress % 3;
            slen[2] = 0;
            slen[3] = 0;

            nsfb = tables.NSFB_TABLE[5][index];
        }
        
        var n = 0;
        for (var part = 0; part < 4; ++part) {
            var max = (1 << slen[part]) - 1;
            for (var i = 0; i < nsfb[part]; ++i) {
                var is_pos = stream.read(slen[part]);

                channel.scalefac[n] = is_pos;
                gr1ch.scalefac[n++] = is_pos === max ? 1 : 0;
            }
        }
        
        while (n < 39) {
            channel.scalefac[n] = 0;
            gr1ch.scalefac[n++] = 0;  // apparently not illegal
        }
    }
    
    return stream.offset() - start;
};

Layer3.prototype.huffmanDecode = function(stream, xr, channel, sfbwidth, part2_length) {
    var exponents = this._exponents;
    var sfbwidthptr = 0;
    
    var bits_left = channel.part2_3_length - part2_length;    
    if (bits_left < 0)
        throw new Error('bad audio data length');
    
    this.exponents(channel, sfbwidth, exponents);
    
    var peek = stream.copy();
    stream.advance(bits_left);
    
    /* align bit reads to byte boundaries */
    var cachesz  = 8 - peek.bitPosition;
    cachesz += ((32 - 1 - 24) + (24 - cachesz)) & ~7;
    
    var bitcache = peek.read(cachesz);
    bits_left -= cachesz;

    var xrptr = 0;
    
    // big_values
    var region = 0;
    var reqcache = this.reqcache;
    
    var sfbound = xrptr + sfbwidth[sfbwidthptr++];
    var rcount  = channel.region0_count + 1;
    
    var entry = huffman.huff_pair_table[channel.table_select[region]];
    var table     = entry.table;
    var linbits   = entry.linbits;
    var startbits = entry.startbits;
    
    if (typeof table === 'undefined')
        throw new Error('bad Huffman table select');
        
    var expptr = 0;
    var exp = exponents[expptr++];
    var reqhits = 0;
    var big_values = channel.big_values;
    
    while (big_values-- && cachesz + bits_left > 0) {
         if (xrptr === sfbound) {
             sfbound += sfbwidth[sfbwidthptr++];

             // change table if region boundary
             if (--rcount === 0) {
                 if (region === 0)
                     rcount = channel.region1_count + 1;
                 else
                     rcount = 0; // all remaining

                 entry     = huffman.huff_pair_table[channel.table_select[++region]];
                 table     = entry.table;
                 linbits   = entry.linbits;
                 startbits = entry.startbits;

                 if (typeof table === 'undefined')
                     throw new Error('bad Huffman table select');
             }

             if (exp !== exponents[expptr]) {
                 exp = exponents[expptr];
                 reqhits = 0;
             }

             ++expptr;
         }
         
         if (cachesz < 21) {
             var bits   = ((32 - 1 - 21) + (21 - cachesz)) & ~7;
             bitcache   = (bitcache << bits) | peek.read(bits);
             cachesz   += bits;
             bits_left -= bits;
         }
         
         var clumpsz = startbits;
         var pair = table[ (((bitcache) >> ((cachesz) - (clumpsz))) & ((1 << (clumpsz)) - 1))];
         
         while (!pair.final) {
             cachesz -= clumpsz;
             clumpsz = pair.ptr.bits;
             pair    = table[pair.ptr.offset + (((bitcache) >> ((cachesz) - (clumpsz))) & ((1 << (clumpsz)) - 1))];
         }
         
         cachesz -= pair.value.hlen;
         
         if (linbits) {
             var value = pair.value.x;
             var x_final = false;
             
             switch (value) {
                 case 0:
                     xr[xrptr] = 0;
                     break;

                 case 15:
                     if (cachesz < linbits + 2) {
                         bitcache   = (bitcache << 16) | peek.read(16);
                         cachesz   += 16;
                         bits_left -= 16;
                     }

                     value += (((bitcache) >> ((cachesz) - (linbits))) & ((1 << (linbits)) - 1));
                     cachesz -= linbits;

                     requantized = this.requantize(value, exp);
                     x_final = true; // simulating goto, yay
                     break;

                 default:
                     if (reqhits & (1 << value)) {
                         requantized = reqcache[value];
                     } else {
                         reqhits |= (1 << value);
                         requantized = reqcache[value] = this.requantize(value, exp);
                     }
                     
                     x_final = true;
             }
             
             if(x_final) {
                 xr[xrptr] = ((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized;
             }
             
             value = pair.value.y;
             var y_final = false;
             
             switch (value) {
                 case 0:
                     xr[xrptr + 1] = 0;
                     break;

                 case 15:
                     if (cachesz < linbits + 1) {
                         bitcache   = (bitcache << 16) | peek.read(16);
                         cachesz   += 16;
                         bits_left -= 16;
                     }

                     value += (((bitcache) >> ((cachesz) - (linbits))) & ((1 << (linbits)) - 1));
                     cachesz -= linbits;

                     requantized = this.requantize(value, exp);
                     y_final = true;
                     break; // simulating goto, yayzor

                 default:
                     if (reqhits & (1 << value)) {
                         requantized = reqcache[value];
                     } else {
                         reqhits |= (1 << value);
                         reqcache[value] = this.requantize(value, exp);
                         requantized = reqcache[value];
                     }
                     
                     y_final = true;
             }
             
             if(y_final) {
                 xr[xrptr + 1] = ((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized;
             }
             
         } else {
             var value = pair.value.x;

             if (value === 0) {
                 xr[xrptr] = 0;
             } else {
                 if (reqhits & (1 << value))
                     requantized = reqcache[value];
                 else {
                     reqhits |= (1 << value);
                     requantized = reqcache[value] = this.requantize(value, exp);
                 }

                 xr[xrptr] = ((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized;
             }

             value = pair.value.y;

             if (value === 0) {
                 xr[xrptr + 1] = 0;
             } else {
                 if (reqhits & (1 << value))
                     requantized = reqcache[value];
                 else {
                     reqhits |= (1 << value);
                     requantized = reqcache[value] = this.requantize(value, exp);
                 }

                 xr[xrptr + 1] = ((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized;
             }
         }

         xrptr += 2;
    }
    
    if (cachesz + bits_left < 0)
        throw new Error('Huffman data overrun');
    
    // count1    
    var table = huffman.huff_quad_table[channel.flags & tables.COUNT1TABLE_SELECT];
    var requantized = this.requantize(1, exp);
    
    while (cachesz + bits_left > 0 && xrptr <= 572) {
        if (cachesz < 10) {
            bitcache   = (bitcache << 16) | peek.read(16);
            cachesz   += 16;
            bits_left -= 16;
        }
        
        var quad = table[(((bitcache) >> ((cachesz) - (4))) & ((1 << (4)) - 1))];
        
        // quad tables guaranteed to have at most one extra lookup
        if (!quad.final) {
            cachesz -= 4;
            quad = table[quad.ptr.offset + (((bitcache) >> ((cachesz) - (quad.ptr.bits))) & ((1 << (quad.ptr.bits)) - 1))];
        }
        
        cachesz -= quad.value.hlen;

        if (xrptr === sfbound) {
            sfbound += sfbwidth[sfbwidthptr++];

            if (exp !== exponents[expptr]) {
                exp = exponents[expptr];
                requantized = this.requantize(1, exp);
            }

            ++expptr;
        }
        
        // v (0..1)
        xr[xrptr] = quad.value.v ? (((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized) : 0;

        // w (0..1)
        xr[xrptr + 1] = quad.value.w ? (((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized) : 0;

        xrptr += 2;
        if (xrptr === sfbound) {
            sfbound += sfbwidth[sfbwidthptr++];

            if (exp !== exponents[expptr]) {
                exp = exponents[expptr];
                requantized = this.requantize(1, exp);
            }

            ++expptr;
        }
        
        // x (0..1)
        xr[xrptr] = quad.value.x ? (((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized) : 0;

        // y (0..1)
        xr[xrptr + 1] = quad.value.y ? (((bitcache) & (1 << ((cachesz--) - 1))) ? -requantized : requantized) : 0;

        xrptr += 2;
        
        if (cachesz + bits_left < 0) {
            // technically the bitstream is misformatted, but apparently
            // some encoders are just a bit sloppy with stuffing bits
            xrptr -= 4;
        }
    }
    
    if (-bits_left > MP3FrameHeader.BUFFER_GUARD * 8) {
        throw new Error("assertion failed: (-bits_left <= MP3FrameHeader.BUFFER_GUARD * CHAR_BIT)");
    }
    
    // rzero
    while (xrptr < 576) {
        xr[xrptr]     = 0;
        xr[xrptr + 1] = 0;
        xrptr += 2;
    }
};

Layer3.prototype.requantize = function(value, exp) {
    // usual (x >> 0) tricks to make sure frac and exp stay integers
    var frac = (exp % 4) >> 0;  // assumes sign(frac) === sign(exp)
    exp = (exp / 4) >> 0;

    var requantized = Math.pow(value, 4.0 / 3.0);
    requantized *= Math.pow(2.0, (exp / 4.0));
    
    if (frac) {
        requantized *= Math.pow(2.0, (frac / 4.0));
    }
    
    if (exp < 0) {
        requantized /= Math.pow(2.0, -exp * (3.0 / 4.0));
    }

    return requantized;
};

Layer3.prototype.exponents = function(channel, sfbwidth, exponents) {
    var gain = channel.global_gain - 210;
    var scalefac_multiplier = (channel.flags & tables.SCALEFAC_SCALE) ? 2 : 1;
    
    if (channel.block_type === 2) {
        var sfbi = 0, l = 0;
        
        if (channel.flags & tables.MIXED_BLOCK_FLAG) {
            var premask = (channel.flags & tables.PREFLAG) ? ~0 : 0;
            
            // long block subbands 0-1
            while (l < 36) {
                exponents[sfbi] = gain - ((channel.scalefac[sfbi] + (tables.PRETAB[sfbi] & premask)) << scalefac_multiplier);
                l += sfbwidth[sfbi++];
            }
        }
        
        // this is probably wrong for 8000 Hz short/mixed blocks
        var gain0 = gain - 8 * channel.subblock_gain[0];
        var gain1 = gain - 8 * channel.subblock_gain[1];
        var gain2 = gain - 8 * channel.subblock_gain[2];
        
        while (l < 576) {
            exponents[sfbi + 0] = gain0 - (channel.scalefac[sfbi + 0] << scalefac_multiplier);
            exponents[sfbi + 1] = gain1 - (channel.scalefac[sfbi + 1] << scalefac_multiplier);
            exponents[sfbi + 2] = gain2 - (channel.scalefac[sfbi + 2] << scalefac_multiplier);
            
            l += 3 * sfbwidth[sfbi];
            sfbi += 3;
        }
    } else {
        if (channel.flags & tables.PREFLAG) {
            for (var sfbi = 0; sfbi < 22; sfbi++) {
                exponents[sfbi] = gain - ((channel.scalefac[sfbi] + tables.PRETAB[sfbi]) << scalefac_multiplier);
            }
        } else {
            for (var sfbi = 0; sfbi < 22; sfbi++) {
                exponents[sfbi] = gain - (channel.scalefac[sfbi] << scalefac_multiplier);
            }
        }
    }
};

Layer3.prototype.stereo = function(xr, granules, gr, header, sfbwidth) {
    var granule = granules[gr];
    var modes = this.modes;
    var sfbi, l, n, i;
    
    if (granule.ch[0].block_type !== granule.ch[1].block_type || (granule.ch[0].flags & tables.MIXED_BLOCK_FLAG) !== (granule.ch[1].flags & tables.MIXED_BLOCK_FLAG))
        throw new Error('incompatible stereo block_type');
        
    for (var i = 0; i < 39; i++)
        modes[i] = header.mode_extension;
        
    // intensity stereo
    if (header.mode_extension & tables.I_STEREO) {
        var right_ch = granule.ch[1];
        var right_xr = xr[1];
        
        header.flags |= MP3FrameHeader.FLAGS.tables.I_STEREO;
         
        // first determine which scalefactor bands are to be processed
        if (right_ch.block_type === 2) {
            var lower, start, max, bound = new Uint32Array(3), w;

            lower = start = max = bound[0] = bound[1] = bound[2] = 0;
            sfbi = l = 0;
            
            if (right_ch.flags & tables.MIXED_BLOCK_FLAG) {
                while (l < 36) {
                    n = sfbwidth[sfbi++];

                    for (var i = 0; i < n; ++i) {
                        if (right_xr[i]) {
                            lower = sfbi;
                            break;
                        }
                    }

                    right_xr += n;
                    l += n;
                }

                start = sfbi;
            }
            
            var w = 0;
            while (l < 576) {
                n = sfbwidth[sfbi++];

                for (i = 0; i < n; ++i) {
                    if (right_xr[i]) {
                        max = bound[w] = sfbi;
                        break;
                    }
                }

                right_xr += n;
                l += n;
                w = (w + 1) % 3;
            }
            
            if (max)
                lower = start;

            // long blocks
            for (i = 0; i < lower; ++i)
                modes[i] = header.mode_extension & ~tables.I_STEREO;

            // short blocks
            w = 0;
            for (i = start; i < max; ++i) {
                if (i < bound[w])
                    modes[i] = header.mode_extension & ~tables.I_STEREO;

                w = (w + 1) % 3;
            }
        } else {
            var bound = 0;
            for (sfbi = l = 0; l < 576; l += n) {
                n = sfbwidth[sfbi++];

                for (i = 0; i < n; ++i) {
                    if (right_xr[i]) {
                        bound = sfbi;
                        break;
                    }
                }

                right_xr += n;
            }

            for (i = 0; i < bound; ++i)
                modes[i] = header.mode_extension & ~tables.I_STEREO;
        }
        
        // now do the actual processing
        if (header.flags & MP3FrameHeader.FLAGS.LSF_EXT) {
            var illegal_pos = granules[gr + 1].ch[1].scalefac;

            // intensity_scale
            var lsf_scale = IS_Ltables.SF_TABLE[right_ch.scalefac_compress & 0x1];
            
            for (sfbi = l = 0; l < 576; ++sfbi, l += n) {
                n = sfbwidth[sfbi];

                if (!(modes[sfbi] & tables.I_STEREO))
                    continue;

                if (illegal_pos[sfbi]) {
                    modes[sfbi] &= ~tables.I_STEREO;
                    continue;
                }

                is_pos = right_ch.scalefac[sfbi];
                
                for (i = 0; i < n; ++i) {
                    var left = xr[0][l + i];

                    if (is_pos === 0) {
                        xr[1][l + i] = left;
                    } else {
                        var opposite = left * lsf_scale[(is_pos - 1) / 2];

                        if (is_pos & 1) {
                            xr[0][l + i] = opposite;
                            xr[1][l + i] = left;
                        }
                        else {
                            xr[1][l + i] = opposite;
                        }
                    }
                }
            }
        } else {
            for (sfbi = l = 0; l < 576; ++sfbi, l += n) {
                n = sfbwidth[sfbi];

                if (!(modes[sfbi] & tables.I_STEREO))
                    continue;

                is_pos = right_ch.scalefac[sfbi];

                if (is_pos >= 7) {  // illegal intensity position
                    modes[sfbi] &= ~tables.I_STEREO;
                    continue;
                }

                for (i = 0; i < n; ++i) {
                    var left = xr[0][l + i];
                    xr[0][l + i] = left * tables.IS_TABLE[is_pos];
                    xr[1][l + i] = left * tables.IS_TABLE[6 - is_pos];
                }
            }
        }
    }
    
    // middle/side stereo
    if (header.mode_extension & tables.MS_STEREO) {
        header.flags |= tables.MS_STEREO;

        var invsqrt2 = tables.ROOT_TABLE[3 + -2];

        for (sfbi = l = 0; l < 576; ++sfbi, l += n) {
            n = sfbwidth[sfbi];

            if (modes[sfbi] !== tables.MS_STEREO)
                continue;

            for (i = 0; i < n; ++i) {
                var m = xr[0][l + i];
                var s = xr[1][l + i];

                xr[0][l + i] = (m + s) * invsqrt2;  // l = (m + s) / sqrt(2)
                xr[1][l + i] = (m - s) * invsqrt2;  // r = (m - s) / sqrt(2)
            }
        }
    }
};

Layer3.prototype.aliasreduce = function(xr, lines) {
    for (var xrPointer = 18; xrPointer < lines; xrPointer += 18) {
        for (var i = 0; i < 8; ++i) {
            var a = xr[xrPointer - i - 1];
            var b = xr[xrPointer + i];

            xr[xrPointer - i - 1] = a * tables.CS[i] - b * tables.CA[i];
            xr[xrPointer + i] = b * tables.CS[i] + a * tables.CA[i];
        }
    }
};

// perform IMDCT and windowing for long blocks
Layer3.prototype.imdct_l = function (X, z, block_type) {
    // IMDCT
    this.imdct.imdct36(X, z);

    // windowing
    switch (block_type) {
        case 0:  // normal window
            for (var i = 0; i < 36; ++i) z[i] = z[i] * tables.WINDOW_L[i];
            break;

        case 1:  // start block
            for (var i =  0; i < 18; ++i) z[i] = z[i] * tables.WINDOW_L[i];
            for (var i = 24; i < 30; ++i) z[i] = z[i] * tables.WINDOW_S[i - 18];
            for (var i = 30; i < 36; ++i) z[i] = 0;
            break;

        case 3:  // stop block
            for (var i =  0; i <  6; ++i) z[i] = 0;
            for (var i =  6; i < 12; ++i) z[i] = z[i] * tables.WINDOW_S[i - 6];
            for (var i = 18; i < 36; ++i) z[i] = z[i] * tables.WINDOW_L[i];
            break;
    }
};

/*
 * perform IMDCT and windowing for short blocks
 */
Layer3.prototype.imdct_s = function (X, z) {
    var yptr = 0;
    var wptr;
    var Xptr = 0;
    
    var y = new Float64Array(36);
    var hi, lo;

    // IMDCT
    for (var w = 0; w < 3; ++w) {
        var sptr = 0;

        for (var i = 0; i < 3; ++i) {
            lo = X[Xptr + 0] * IMDCT.S[sptr][0] +
                 X[Xptr + 1] * IMDCT.S[sptr][1] +
                 X[Xptr + 2] * IMDCT.S[sptr][2] +
                 X[Xptr + 3] * IMDCT.S[sptr][3] +
                 X[Xptr + 4] * IMDCT.S[sptr][4] +
                 X[Xptr + 5] * IMDCT.S[sptr][5];


            y[yptr + i + 0] = lo;
            y[yptr + 5 - i] = -y[yptr + i + 0];

            ++sptr;

            lo = X[Xptr + 0] * IMDCT.S[sptr][0] +
                 X[Xptr + 1] * IMDCT.S[sptr][1] +
                 X[Xptr + 2] * IMDCT.S[sptr][2] +
                 X[Xptr + 3] * IMDCT.S[sptr][3] +
                 X[Xptr + 4] * IMDCT.S[sptr][4] +
                 X[Xptr + 5] * IMDCT.S[sptr][5];

            y[yptr +  i + 6] = lo;
            y[yptr + 11 - i] = y[yptr + i + 6];

            ++sptr;
        }

        yptr += 12;
        Xptr += 6;
    }

    // windowing, overlapping and concatenation
    yptr = 0;
    var wptr = 0;

    for (var i = 0; i < 6; ++i) {
        z[i + 0] = 0;
        z[i + 6] = y[yptr +  0 + 0] * tables.WINDOW_S[wptr + 0];

        lo = y[yptr + 0 + 6] * tables.WINDOW_S[wptr + 6] +
             y[yptr + 12 + 0] * tables.WINDOW_S[wptr + 0];

        z[i + 12] = lo;

        lo = y[yptr + 12 + 6] * tables.WINDOW_S[wptr + 6] +
             y[yptr + 24 + 0] * tables.WINDOW_S[wptr + 0];

        z[i + 18] = lo;
        z[i + 24] = y[yptr + 24 + 6] * tables.WINDOW_S[wptr + 6];
        z[i + 30] = 0;

        ++yptr;
        ++wptr;
    }
};

Layer3.prototype.overlap = function (output, overlap, sample, sb) {
    for (var i = 0; i < 18; ++i) {
        sample[i][sb] = output[i] + overlap[i];
        overlap[i]    = output[i + 18];
    }
};

Layer3.prototype.freqinver = function (sample, sb) {
    for (var i = 1; i < 18; i += 2)
        sample[i][sb] = -sample[i][sb];
};

Layer3.prototype.overlap_z = function (overlap, sample, sb) {
    for (var i = 0; i < 18; ++i) {
        sample[i][sb] = overlap[i];
        overlap[i]    = 0;
    }
};

Layer3.prototype.reorder = function (xr, channel, sfbwidth) {
    var sfbwidthPointer = 0;
    var tmp = this.tmp;
    var sbw = new Uint32Array(3);
    var sw  = new Uint32Array(3);
    
    // this is probably wrong for 8000 Hz mixed blocks

    var sb = 0;
    if (channel.flags & tables.MIXED_BLOCK_FLAG) {
        var sb = 2;

        var l = 0;
        while (l < 36)
            l += sfbwidth[sfbwidthPointer++];
    }

    for (var w = 0; w < 3; ++w) {
        sbw[w] = sb;
        sw[w]  = 0;
    }

    f = sfbwidth[sfbwidthPointer++];
    w = 0;

    for (var l = 18 * sb; l < 576; ++l) {
        if (f-- === 0) {
            f = sfbwidth[sfbwidthPointer++] - 1;
            w = (w + 1) % 3;
        }
        
        tmp[sbw[w]][w][sw[w]++] = xr[l];

        if (sw[w] === 6) {
            sw[w] = 0;
            ++sbw[w];
        }
    }

    var tmp2 = this.tmp2;
    var ptr = 0;
    
    for (var i = 0; i < 32; i++) {
        for (var j = 0; j < 3; j++) {
            for (var k = 0; k < 6; k++) {
                tmp2[ptr++] = tmp[i][j][k];
            }
        }
    }
    
    var len = (576 - 18 * sb); 
    for (var i = 0; i < len; i++) {
        xr[18 * sb + i] = tmp2[sb + i];
    }
};

module.exports = Layer3;
