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
    
function FFT(length) {
    this.length = length;

    switch (length) {
        case 64:
            this.roots = generateFFTTableShort(64);
            break;

        case 512:
            this.roots = generateFFTTableLong(512);
            break;

        case 60:
            this.roots = generateFFTTableShort(60);
            break;

        case 480:
            this.roots = generateFFTTableLong(480);
            break;

        default:
            throw new Error("unexpected FFT length: " + length);
    }

    // processing buffers
    this.rev = new Array(length);
    for (var i = 0; i < length; i++) {
        this.rev[i] = new Float32Array(2);
    }

    this.a = new Float32Array(2);
    this.b = new Float32Array(2);
    this.c = new Float32Array(2);
    this.d = new Float32Array(2);     
    this.e1 = new Float32Array(2);
    this.e2 = new Float32Array(2);
}

function generateFFTTableShort(len) {
    var t = 2 * Math.PI / len,
        cosT = Math.cos(t),
        sinT = Math.sin(t),
        f = new Array(len);

    for (var i = 0; i < len; i++) {
        f[i] = new Float32Array(2);
    }

    f[0][0] = 1;
    f[0][1] = 0;
    var lastImag = 0;

    for (var i = 1; i < len; i++) {
        f[i][0] = f[i - 1][0] * cosT + lastImag * sinT;
        lastImag = lastImag * cosT - f[i - 1][0] * sinT;
        f[i][1] = -lastImag;
    }

    return f;
}

function generateFFTTableLong(len) {
    var t = 2 * Math.PI / len,
        cosT = Math.cos(t),
        sinT = Math.sin(t),
        f = new Array(len);

    for (var i = 0; i < len; i++) {
        f[i] = new Float32Array(3);
    }

    f[0][0] = 1;
    f[0][1] = 0;
    f[0][2] = 0;

    for (var i = 1; i < len; i++) {
        f[i][0] = f[i - 1][0] * cosT + f[i - 1][2] * sinT;
        f[i][2] = f[i - 1][2] * cosT - f[i - 1][0] * sinT;
        f[i][1] = -f[i][2];
    }

    return f;
}

FFT.prototype.process = function(input, forward) {
    var length = this.length,
        imOffset = (forward ? 2 : 1),
        scale = (forward ? length : 1),
        rev = this.rev,
        roots = this.roots;

    // bit-reversal
    var ii = 0;
    for (var i = 0; i < length; i++) {
        rev[i][0] = input[ii][0];
        rev[i][1] = input[ii][1];

        var k = length >>> 1;
        while (ii >= k && k > 0) {
            ii -= k;
            k >>= 1;
        }

        ii += k;
    }

    var a = this.a,
        b = this.b,
        c = this.c,
        d = this.d,
        e1 = this.e1,
        e2 = this.e2;

    for (var i = 0; i < length; i++) {
        input[i][0] = rev[i][0];
        input[i][1] = rev[i][1];
    }

    // bottom base-4 round
    for (var i = 0; i < length; i += 4) {
        a[0] = input[i][0] + input[i + 1][0];
        a[1] = input[i][1] + input[i + 1][1];
        b[0] = input[i + 2][0] + input[i + 3][0];
        b[1] = input[i + 2][1] + input[i + 3][1];
        c[0] = input[i][0] - input[i + 1][0];
        c[1] = input[i][1] - input[i + 1][1];
        d[0] = input[i + 2][0] - input[i + 3][0];
        d[1] = input[i + 2][1] - input[i + 3][1];
        input[i][0] = a[0] + b[0];
        input[i][1] = a[1] + b[1];
        input[i + 2][0] = a[0] - b[0];
        input[i + 2][1] = a[1] - b[1];

        e1[0] = c[0] - d[1];
        e1[1] = c[1] + d[0];
        e2[0] = c[0] + d[1];
        e2[1] = c[1] - d[0];

        if (forward) {
            input[i + 1][0] = e2[0];
            input[i + 1][1] = e2[1];
            input[i + 3][0] = e1[0];
            input[i + 3][1] = e1[1];
        } else {
            input[i + 1][0] = e1[0];
            input[i + 1][1] = e1[1];
            input[i + 3][0] = e2[0];
            input[i + 3][1] = e2[1];
        }
    }

    // iterations from bottom to top
    for (var i = 4; i < length; i <<= 1) {
        var shift = i << 1,
            m = length / shift;

        for(var j = 0; j < length; j += shift) {
            for(var k = 0; k < i; k++) {
                var km = k * m,
                    rootRe = roots[km][0],
                    rootIm = roots[km][imOffset],
                    zRe = input[i + j + k][0] * rootRe - input[i + j + k][1] * rootIm,
                    zIm = input[i + j + k][0] * rootIm + input[i + j + k][1] * rootRe;

                input[i + j + k][0] = (input[j + k][0] - zRe) * scale;
                input[i + j + k][1] = (input[j + k][1] - zIm) * scale;
                input[j + k][0] = (input[j + k][0] + zRe) * scale;
                input[j + k][1] = (input[j + k][1] + zIm) * scale;
            }
        }
    }
};

module.exports = FFT;
