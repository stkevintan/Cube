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

var ICStream = require('./ics');
var MDCT = require('./mdct');
  
function FilterBank(smallFrames, channels) {
    if (smallFrames) {
        throw new Error("WHA?? No small frames allowed.");
    }

    this.length = 1024;
    this.shortLength = 128;

    this.mid = (this.length - this.shortLength) / 2;
    this.trans = this.shortLength / 2;

    this.mdctShort = new MDCT(this.shortLength * 2);
    this.mdctLong  = new MDCT(this.length * 2);

    this.overlaps = new Array(channels);
    for (var i = 0; i < channels; i++) {
        this.overlaps[i] = new Float32Array(this.length);
    }

    this.buf = new Float32Array(2 * this.length);
}
  
function generateSineWindow(len) {
    var d = new Float32Array(len);
    for (var i = 0; i < len; i++) {
        d[i] = Math.sin((i + 0.5) * (Math.PI / (2.0 * len)))
    }
    return d;
}

function generateKBDWindow(alpha, len) {
    var PIN = Math.PI / len,
        out = new Float32Array(len),
        sum = 0,
        f = new Float32Array(len),
        alpha2 = (alpha * PIN) * (alpha * PIN);

    for (var n = 0; n < len; n++) {
        var tmp = n * (len - n) * alpha2,
            bessel = 1;

        for (var j = 50; j > 0; j--) {
            bessel = bessel * tmp / (j * j) + 1;
        }

        sum += bessel;
        f[n] = sum;
    }

    sum++;
    for (var n = 0; n < len; n++) {
        out[n] = Math.sqrt(f[n] / sum);
    }

    return out;
}

const SINE_1024 = generateSineWindow(1024),
      SINE_128  = generateSineWindow(128),
      KBD_1024  = generateKBDWindow(4, 1024),
      KBD_128   = generateKBDWindow(6, 128),
      LONG_WINDOWS = [SINE_1024, KBD_1024],
      SHORT_WINDOWS = [SINE_128, KBD_128];

FilterBank.prototype.process = function(info, input, output, channel) {
    var overlap = this.overlaps[channel],
        windowShape = info.windowShape[1],
        windowShapePrev = info.windowShape[0],
        longWindows = LONG_WINDOWS[windowShape],
        shortWindows = SHORT_WINDOWS[windowShape],
        longWindowsPrev = LONG_WINDOWS[windowShapePrev],
        shortWindowsPrev = SHORT_WINDOWS[windowShapePrev],
        length = this.length,
        shortLen = this.shortLength,
        mid = this.mid,
        trans = this.trans,
        buf = this.buf,
        mdctLong = this.mdctLong,
        mdctShort = this.mdctShort;

    switch (info.windowSequence) {
        case ICStream.ONLY_LONG_SEQUENCE:
            mdctLong.process(input, 0, buf, 0);

            // add second half output of previous frame to windowed output of current frame
            for (var i = 0; i < length; i++) {
                output[i] = overlap[i] + (buf[i] * longWindowsPrev[i]);
            }

            // window the second half and save as overlap for next frame
            for (var i = 0; i < length; i++) {
                overlap[i] = buf[length + i] * longWindows[length - 1 - i];
            }

            break;

        case ICStream.LONG_START_SEQUENCE:
            mdctLong.process(input, 0, buf, 0);

            // add second half output of previous frame to windowed output of current frame
            for (var i = 0; i < length; i++) {
                output[i] = overlap[i] + (buf[i] * longWindowsPrev[i]);
            }

            // window the second half and save as overlap for next frame
            for (var i = 0; i < mid; i++) {
                overlap[i] = buf[length + i];
            }

            for (var i = 0; i < shortLen; i++) {
                overlap[mid + i] = buf[length + mid + i] * shortWindows[shortLen - i - 1];
            }

            for (var i = 0; i < mid; i++) {
                overlap[mid + shortLen + i] = 0;
            }

            break;

        case ICStream.EIGHT_SHORT_SEQUENCE:
            for (var i = 0; i < 8; i++) {
                mdctShort.process(input, i * shortLen, buf, 2 * i * shortLen);
            }

            // add second half output of previous frame to windowed output of current frame
            for (var i = 0; i < mid; i++) {
                output[i] = overlap[i];
            }

            for (var i = 0; i < shortLen; i++) {
                output[mid + i] = overlap[mid + i] + buf[i] * shortWindowsPrev[i];
                output[mid + 1 * shortLen + i] = overlap[mid + shortLen * 1 + i] + (buf[shortLen * 1 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 2 + i]  * shortWindows[i]);
                output[mid + 2 * shortLen + i] = overlap[mid + shortLen * 2 + i] + (buf[shortLen * 3 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 4 + i] * shortWindows[i]);
                output[mid + 3 * shortLen + i] = overlap[mid + shortLen * 3 + i] + (buf[shortLen * 5 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 6 + i] * shortWindows[i]);

                if (i < trans)
                    output[mid + 4 * shortLen + i] = overlap[mid + shortLen * 4 + i] + (buf[shortLen * 7 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 8 + i] * shortWindows[i]);
            }

            // window the second half and save as overlap for next frame
            for (var i = 0; i < shortLen; i++) {
                if(i >= trans) 
                    overlap[mid + 4 * shortLen + i - length] = (buf[shortLen * 7 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 8 + i] * shortWindows[i]);

                overlap[mid + 5 * shortLen + i - length] = (buf[shortLen * 9 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 10 + i] * shortWindows[i]);
                overlap[mid + 6 * shortLen + i - length] = (buf[shortLen * 11 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 12 + i]*shortWindows[i]);
                overlap[mid + 7 * shortLen + i - length] = (buf[shortLen * 13 + i] * shortWindows[shortLen - 1 - i]) + (buf[shortLen * 14 + i]*shortWindows[i]);
                overlap[mid + 8 * shortLen + i - length] = (buf[shortLen * 15 + i] * shortWindows[shortLen - 1 - i]);
            }

            for (var i = 0; i < mid; i++) {
                overlap[mid + shortLen + i] = 0;
            }

            break;

        case ICStream.LONG_STOP_SEQUENCE:
            mdctLong.process(input, 0, buf, 0);

            // add second half output of previous frame to windowed output of current frame
            // construct first half window using padding with 1's and 0's
            for (var i = 0; i < mid; i++) {
                output[i] = overlap[i];
            }

            for (var i = 0; i < shortLen; i++) {
                output[mid + i] = overlap[mid + i] + (buf[mid + i] * shortWindowsPrev[i]);
            }

            for (var i = 0; i < mid; i++) {
                output[mid + shortLen + i] = overlap[mid + shortLen + i] + buf[mid + shortLen + i];
            }

            // window the second half and save as overlap for next frame
            for (var i = 0; i < length; i++) {
                overlap[i] = buf[length + i] * longWindows[length - 1 - i];
            }

            break;
    }
};

module.exports = FilterBank;
