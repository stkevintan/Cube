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
    
// Temporal Noise Shaping
function TNS(config) {
    this.maxBands = TNS_MAX_BANDS_1024[config.sampleIndex]
    this.nFilt = new Int32Array(8);
    this.length = new Array(8);
    this.direction = new Array(8);
    this.order = new Array(8);
    this.coef = new Array(8);
    
    // Probably could allocate these as needed
    for (var w = 0; w < 8; w++) {
        this.length[w] = new Int32Array(4);
        this.direction[w] = new Array(4);
        this.order[w] = new Int32Array(4);
        this.coef[w] = new Array(4);
        
        for (var filt = 0; filt < 4; filt++) {
            this.coef[w][filt] = new Float32Array(TNS_MAX_ORDER);
        }
    }
    
    this.lpc = new Float32Array(TNS_MAX_ORDER);
    this.tmp = new Float32Array(TNS_MAX_ORDER);
}

const TNS_MAX_ORDER = 20,
      SHORT_BITS = [1, 4, 3],
      LONG_BITS = [2, 6, 5];
      
const TNS_COEF_1_3 = [0.00000000, -0.43388373, 0.64278758, 0.34202015],

      TNS_COEF_0_3 = [0.00000000, -0.43388373, -0.78183150, -0.97492790,
                      0.98480773, 0.86602539, 0.64278758, 0.34202015],
                      
      TNS_COEF_1_4 = [0.00000000, -0.20791170, -0.40673664, -0.58778524,
                      0.67369562, 0.52643216, 0.36124167, 0.18374951],
                      
      TNS_COEF_0_4 = [0.00000000, -0.20791170, -0.40673664, -0.58778524,
                      -0.74314481, -0.86602539, -0.95105654, -0.99452192,
                      0.99573416, 0.96182561, 0.89516330, 0.79801720,
                      0.67369562, 0.52643216, 0.36124167, 0.18374951],
                      
      TNS_TABLES = [TNS_COEF_0_3, TNS_COEF_0_4, TNS_COEF_1_3, TNS_COEF_1_4];
      
const TNS_MAX_BANDS_1024 = [31, 31, 34, 40, 42, 51, 46, 46, 42, 42, 42, 39, 39],
      TNS_MAX_BANDS_128 = [9, 9, 10, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14];

TNS.prototype.decode = function(stream, info) {
    var windowCount = info.windowCount,
        bits = info.windowSequence === 2 ? SHORT_BITS : LONG_BITS;
    
    for (var w = 0; w < windowCount; w++) {
        if (this.nFilt[w] = stream.read(bits[0])) {
            var coefRes = stream.read(1),
                nFilt_w = this.nFilt[w],
                length_w = this.length[w],
                order_w = this.order[w],
                direction_w = this.direction[w],
                coef_w = this.coef[w];
            
            for (var filt = 0; filt < nFilt_w; filt++) {
                length_w[filt] = stream.read(bits[1]);
                
                if ((order_w[filt] = stream.read(bits[2])) > 20)
                    throw new Error("TNS filter out of range: " + order_w[filt]);
                
                if (order_w[filt]) {
                    direction_w[filt] = !!stream.read(1);
                    var coefCompress = stream.read(1),
                        coefLen = coefRes + 3 - coefCompress,
                        tmp = 2 * coefCompress + coefRes,
                        table = TNS_TABLES[tmp],
                        order_w_filt = order_w[filt],
                        coef_w_filt = coef_w[filt];
                        
                    for (var i = 0; i < order_w_filt; i++)
                        coef_w_filt[i] = table[stream.read(coefLen)];
                }
                    
            }
        }
    }
};

TNS.prototype.process = function(ics, data, decode) {
    var mmm = Math.min(this.maxBands, ics.maxSFB),
        lpc = this.lpc,
        tmp = this.tmp,
        info = ics.info,
        windowCount = info.windowCount;
        
    for (var w = 0; w < windowCount; w++) {
        var bottom = info.swbCount,
            nFilt_w = this.nFilt[w],
            length_w = this.length[w],
            order_w = this.order[w],
            coef_w = this.coef[w],
            direction_w = this.direction[w];
        
        for (var filt = 0; filt < nFilt_w; filt++) {
            var top = bottom,
                bottom = Math.max(0, tmp - length_w[filt]),
                order = order_w[filt];
                
            if (order === 0) continue;
            
            // calculate lpc coefficients
            var autoc = coef_w[filt];
            for (var i = 0; i < order; i++) {
                var r = -autoc[i];
                lpc[i] = r;

                for (var j = 0, len = (i + 1) >> 1; j < len; j++) {
                    var f = lpc[j],
                        b = lpc[i - 1 - j];

                    lpc[j] = f + r * b;
                    lpc[i - 1 - j] = b + r * f;
                }
            }
            
            var start = info.swbOffsets[Math.min(bottom, mmm)],
                end = info.swbOffsets[Math.min(top, mmm)],
                size,
                inc = 1;
                
            if ((size = end - start) <= 0) continue;
            
            if (direction_w[filt]) {
                inc = -1;
                start = end - 1;
            }
            
            start += w * 128;
            
            if (decode) {
                // ar filter
                for (var m = 0; m < size; m++, start += inc) {
                    for (var i = 1; i <= Math.min(m, order); i++) {
                        data[start] -= data[start - i * inc] * lpc[i - 1];
                    }
                }
            } else {
                // ma filter
                for (var m = 0; m < size; m++, start += inc) {
                    tmp[0] = data[start];
                    
                    for (var i = 1; i <= Math.min(m, order); i++)
                        data[start] += tmp[i] * lpc[i - 1];
                    
                    for (var i = order; i > 0; i--)
                        tmp[i] = tmp[i - 1];
                }
            }
        }
    }
};
    
module.exports = TNS;
