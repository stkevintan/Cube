#
#  Original C(++) version by Apple, http://alac.macosforge.org/
#
#  Javascript port by Jens Nockert and Devon Govett of OFMLabs, https://github.com/ofmlabs/alac.js
# 
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

# File: dp_dec.coffee
# Contains: Dynamic Predictor decode routines

class Dplib
    copy = (dst, dstOffset, src, srcOffset, n) ->
        destination = new Uint8Array(dst, dstOffset, n)
        source = new Uint8Array(src, srcOffset, n)
        destination.set(source)
        return dst
    
    @unpc_block: (pc1, out, num, coefs, active, chanbits, denshift) ->
        chanshift = 32 - chanbits
        denhalf = 1 << (denshift - 1)
        
        out[0] = pc1[0];
        
        # just copy if active is 0
        if active is 0
            return copy(out, 0, pc1, 0, num * 4)
        
        # short-circuit if active is 31    
        if active is 31
            prev = out[0]
            
            for i in [1...num] by 1
                del = pc1[i] + prev
                prev = (del << chanshift) >> chanshift
                out[i] = prev
            
            return
        
        for i in [1..active] by 1
            del = pc1[i] + out[i - 1]
            out[i] = (del << chanshift) >> chanshift
        
        lim = active + 1
        
        if active is 4
            # Optimization for active == 4
            [a0, a1, a2, a3] = coefs
            
            for j in [lim...num] by 1
                top = out[j - lim]
                offset = j - 1
                
                b0 = top - out[offset]
                b1 = top - out[offset - 1]
                b2 = top - out[offset - 2]
                b3 = top - out[offset - 3]
                
                sum1 = (denhalf - a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3) >> denshift
                del = del0 = pc1[j]
                sg = (-del >>> 31) | (del >> 31)
                del += top + sum1
                
                out[j] = (del << chanshift) >> chanshift
                
                if sg > 0
                    sgn = (-b3 >>> 31) | (b3 >> 31)
                    a3 -= sgn
                    del0 -= 1 * ((sgn * b3) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b2 >>> 31) | (b2 >> 31)
                    a2 -= sgn
                    del0 -= 2 * ((sgn * b2) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b1 >>> 31) | (b1 >> 31)
                    a1 -= sgn
                    del0 -= 3 * ((sgn * b1) >> denshift)
                    continue if del0 <= 0
                    
                    a0 -= (-b0 >>> 31) | (b0 >> 31)
                    
                else if sg < 0
                    # note: to avoid unnecessary negations, we flip the value of "sgn"
                    sgn = -((-b3 >>> 31) | (b3 >> 31))
                    a3 -= sgn
                    del0 -= 1 * ((sgn * b3) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b2 >>> 31) | (b2 >> 31))
                    a2 -= sgn
                    del0 -= 2 * ((sgn * b2) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b1 >>> 31) | (b1 >> 31))
                    a1 -= sgn
                    del0 -= 3 * ((sgn * b1) >> denshift)
                    continue if del0 >= 0
                    
                    a0 += (-b0 >>> 31) | (b0 >> 31)
                    
            coefs[0] = a0
            coefs[1] = a1
            coefs[2] = a2
            coefs[3] = a3
            
        else if active is 8
            # Optimization for active == 8
            [a0, a1, a2, a3, a4, a5, a6, a7] = coefs
            
            for j in [lim...num] by 1
                top = out[j - lim]
                offset = j - 1
                
                b0 = top - out[offset]
                b1 = top - out[offset - 1]
                b2 = top - out[offset - 2]
                b3 = top - out[offset - 3]
                b4 = top - out[offset - 4]
                b5 = top - out[offset - 5]
                b6 = top - out[offset - 6]
                b7 = top - out[offset - 7]
                
                sum1 = (denhalf - a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3 - a4 * b4 - a5 * b5 - a6 * b6 - a7 * b7) >> denshift
                        
                del = del0 = pc1[j]
                sg = (-del >>> 31) | (del >> 31)
                del += top + sum1
                
                out[j] = (del << chanshift) >> chanshift
                
                if sg > 0
                    sgn = (-b7 >>> 31) | (b7 >> 31)
                    a7 -= sgn
                    del0 -= 1 * ((sgn * b7) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b6 >>> 31) | (b6 >> 31)
                    a6 -= sgn
                    del0 -= 2 * ((sgn * b6) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b5 >>> 31) | (b5 >> 31)
                    a5 -= sgn
                    del0 -= 3 * ((sgn * b5) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b4 >>> 31) | (b4 >> 31)
                    a4 -= sgn
                    del0 -= 4 * ((sgn * b4) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b3 >>> 31) | (b3 >> 31)
                    a3 -= sgn
                    del0 -= 5 * ((sgn * b3) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b2 >>> 31) | (b2 >> 31)
                    a2 -= sgn
                    del0 -= 6 * ((sgn * b2) >> denshift)
                    continue if del0 <= 0
                    
                    sgn = (-b1 >>> 31) | (b1 >> 31)
                    a1 -= sgn
                    del0 -= 7 * ((sgn * b1) >> denshift)
                    continue if del0 <= 0
                    
                    a0 -= (-b0 >>> 31) | (b0 >> 31)
                    
                else if sg < 0
                    # note: to avoid unnecessary negations, we flip the value of "sgn"
                    sgn = -((-b7 >>> 31) | (b7 >> 31))
                    a7 -= sgn
                    del0 -= 1 * ((sgn * b7) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b6 >>> 31) | (b6 >> 31))
                    a6 -= sgn
                    del0 -= 2 * ((sgn * b6) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b5 >>> 31) | (b5 >> 31))
                    a5 -= sgn
                    del0 -= 3 * ((sgn * b5) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b4 >>> 31) | (b4 >> 31))
                    a4 -= sgn
                    del0 -= 4 * ((sgn * b4) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b3 >>> 31) | (b3 >> 31))
                    a3 -= sgn
                    del0 -= 5 * ((sgn * b3) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b2 >>> 31) | (b2 >> 31))
                    a2 -= sgn
                    del0 -= 6 * ((sgn * b2) >> denshift)
                    continue if del0 >= 0
                    
                    sgn = -((-b1 >>> 31) | (b1 >> 31))
                    a1 -= sgn
                    del0 -= 7 * ((sgn * b1) >> denshift)
                    continue if del0 >= 0
                    
                    a0 += (-b0 >>> 31) | (b0 >> 31)
                
            coefs[0] = a0
            coefs[1] = a1
            coefs[2] = a2
            coefs[3] = a3
            coefs[4] = a4
            coefs[5] = a5
            coefs[6] = a6
            coefs[7] = a7
        
        else
            # General case
            for i in [lim...num] by 1
                sum1 = 0
                top = out[i - lim]
                offset = i - 1
            
                for j in [0 ... active] by 1
                    sum1 += coefs[j] * (out[offset - j] - top)
            
                del = del0 = pc1[i]
                sg  = (-del >>> 31) | (del >> 31)
            
                del += top + ((sum1 + denhalf) >> denshift)
                out[i] = (del << chanshift) >> chanshift
            
                if sg > 0
                    for j in [active - 1 .. 0] by -1
                        dd = top - out[offset - j]
                        sgn = (-dd >>> 31) | (dd >> 31)
                    
                        coefs[j] -= sgn
                        del0 -= (active - j) * ((sgn * dd) >> denshift)
                    
                        break if del0 <= 0                    
                
                else if sg < 0
                    for j in [active - 1 .. 0] by -1
                        dd = top - out[offset - j]
                        sgn = (-dd >>> 31) | (dd >> 31)
                    
                        coefs[j] += sgn
                        del0 -= (active - j) * ((-sgn * dd) >> denshift)
                    
                        break if del0 >= 0
                    
        return
        
module.exports = Dplib
