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

var tables = require('./mdct_tables');
var FFT = require('./fft');

// Modified Discrete Cosine Transform
function MDCT(length) {
    this.N = length;
    this.N2 = length >>> 1;
    this.N4 = length >>> 2;
    this.N8 = length >>> 3;
    
    switch (length) {
        case 2048:
            this.sincos = tables.MDCT_TABLE_2048;
            break;
            
        case 256:
            this.sincos = tables.MDCT_TABLE_256;
            break;
            
        case 1920:
            this.sincos = tables.MDCT_TABLE_1920;
            break;
            
        case 240:
            this.sincos = tables.MDCT_TABLE_240;
            break;
            
        default:
            throw new Error("unsupported MDCT length: " + length);
    }
    
    this.fft = new FFT(this.N4);
    
    this.buf = new Array(this.N4);
    for (var i = 0; i < this.N4; i++) {
        this.buf[i] = new Float32Array(2);
    }
    
    this.tmp = new Float32Array(2);
}

MDCT.prototype.process = function(input, inOffset, output, outOffset) {
    // local access
    var N2 = this.N2,
        N4 = this.N4,
        N8 = this.N8,
        buf = this.buf,
        tmp = this.tmp,
        sincos = this.sincos,
        fft = this.fft;
    
    // pre-IFFT complex multiplication
    for (var k = 0; k < N4; k++) {
        buf[k][1] = (input[inOffset + 2 * k] * sincos[k][0]) + (input[inOffset + N2 - 1 - 2 * k] * sincos[k][1]);
        buf[k][0] = (input[inOffset + N2 - 1 - 2 * k] * sincos[k][0]) - (input[inOffset + 2 * k] * sincos[k][1]);
    }
    
    // complex IFFT, non-scaling
    fft.process(buf, false);
    
    // post-IFFT complex multiplication
    for (var k = 0; k < N4; k++) {
        tmp[0] = buf[k][0];
        tmp[1] = buf[k][1];
        buf[k][1] = (tmp[1] * sincos[k][0]) + (tmp[0] * sincos[k][1]);
        buf[k][0] = (tmp[0] * sincos[k][0]) - (tmp[1] * sincos[k][1]);
    }
    
    // reordering
    for (var k = 0; k < N8; k += 2) {
        output[outOffset + 2 * k] = buf[N8 + k][1];
        output[outOffset + 2 + 2 * k] = buf[N8 + 1 + k][1];

        output[outOffset + 1 + 2 * k] = -buf[N8 - 1 - k][0];
        output[outOffset + 3 + 2 * k] = -buf[N8 - 2 - k][0];

        output[outOffset + N4 + 2 * k] = buf[k][0];
        output[outOffset + N4 + 2 + 2 * k] = buf[1 + k][0];

        output[outOffset + N4 + 1 + 2 * k] = -buf[N4 - 1 - k][1];
        output[outOffset + N4 + 3 + 2 * k] = -buf[N4 - 2 - k][1];

        output[outOffset + N2 + 2 * k] = buf[N8 + k][0];
        output[outOffset + N2 + 2 + 2 * k] = buf[N8 + 1 + k][0];

        output[outOffset + N2 + 1 + 2 * k] = -buf[N8 - 1 - k][1];
        output[outOffset + N2 + 3 + 2 * k] = -buf[N8 - 2 - k][1];

        output[outOffset + N2 + N4 + 2 * k] = -buf[k][1];
        output[outOffset + N2 + N4 + 2 + 2 * k] = -buf[1 + k][1];

        output[outOffset + N2 + N4 + 1 + 2 * k] = buf[N4 - 1 - k][0];
        output[outOffset + N2 + N4 + 3 + 2 * k] = buf[N4 - 2 - k][0];
    }
};

module.exports = MDCT;
