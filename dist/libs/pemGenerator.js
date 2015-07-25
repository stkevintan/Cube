/**
 * Created by kevin on 15-7-25.
 */

//http://stackoverflow.com/questions/18835132/xml-to-pem-in-node-js
function rsaPublicKeyPem(modulus, exponent, encoding) {
    var modulus_hex, exponent_hex;
    if (encoding === 'base64') {
        modulus = new Buffer(modulus, 'base64');
        exponent = new Buffer(exponent, 'base64');
        modulus_hex = modulus.toString('hex')
        exponent_hex = exponent.toString('hex')
    } else {
        modulus_hex = new Buffer(modulus,'hex').toString('hex');
        exponent_hex = new Buffer(exponent,'hex').toString('hex');
    }
    modulus_hex = prepadSigned(modulus_hex)
    exponent_hex = prepadSigned(exponent_hex)

    var modlen = modulus_hex.length / 2
    var explen = exponent_hex.length / 2

    var encoded_modlen = encodeLengthHex(modlen)
    var encoded_explen = encodeLengthHex(explen)
    var encoded_pubkey = '30' +
        encodeLengthHex(
            modlen +
            explen +
            encoded_modlen.length / 2 +
            encoded_explen.length / 2 + 2
        ) +
        '02' + encoded_modlen + modulus_hex +
        '02' + encoded_explen + exponent_hex;

    var der_b64 = new Buffer(encoded_pubkey, 'hex').toString('base64');

    var pem = '-----BEGIN RSA PUBLIC KEY-----\n'
        + der_b64.match(/.{1,64}/g).join('\n')
        + '\n-----END RSA PUBLIC KEY-----\n';

    return pem
}

function prepadSigned(hexStr) {
    var msb = hexStr[0]
    if (msb < '0' || msb > '7') {
        return '00' + hexStr;
    } else {
        return hexStr;
    }
}

function toHex(number) {
    var nstr = number.toString(16);
    if (nstr.length % 2) return '0' + nstr;
    return nstr;
}

// encode ASN.1 DER length field
// if <=127, short form
// if >=128, long form
function encodeLengthHex(n) {
    if (n <= 127) return toHex(n)
    else {
        var n_hex = toHex(n)
        var length_of_length_byte = 128 + n_hex.length / 2 // 0x80+numbytes
        return toHex(length_of_length_byte) + n_hex
    }
}

var _modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
var _pubKey = '010001';
console.log(rsaPublicKeyPem(_modulus, _pubKey, 'hex'));