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
    
// Channel Pair Element
function CPEElement(config) {
    this.ms_used = [];
    this.left = new ICStream(config);
    this.right = new ICStream(config);
}

const MAX_MS_MASK = 128;

const MASK_TYPE_ALL_0 = 0,
      MASK_TYPE_USED = 1,
      MASK_TYPE_ALL_1 = 2,
      MASK_TYPE_RESERVED = 3;

CPEElement.prototype.decode = function(stream, config) {
    var left = this.left,
        right = this.right,
        ms_used = this.ms_used;
        
    if (this.commonWindow = !!stream.read(1)) {
        left.info.decode(stream, config, true);
        right.info = left.info;

        var mask = stream.read(2);
        this.maskPresent = !!mask;
        
        switch (mask) {
            case MASK_TYPE_USED:
                var len = left.info.groupCount * left.info.maxSFB;
                for (var i = 0; i < len; i++) {
                    ms_used[i] = !!stream.read(1);
                }
                break;
            
            case MASK_TYPE_ALL_0:    
            case MASK_TYPE_ALL_1:
                var val = !!mask;
                for (var i = 0; i < MAX_MS_MASK; i++) {
                    ms_used[i] = val;
                }
                break;
                
            default:
                throw new Error("Reserved ms mask type: " + mask);
        }
    } else {
        for (var i = 0; i < MAX_MS_MASK; i++)
            ms_used[i] = false;
    }
    
    left.decode(stream, config, this.commonWindow);
    right.decode(stream, config, this.commonWindow);
};

module.exports = CPEElement;
