/**
 * Created by kevin on 15-7-19.
 */

var crypto = require('crypto');
var bi = require('./BigInt');

function RSAKeyPair(encryptionExponent, decryptionExponent, modulus) {
    this.radix = 16;
    this.e = bi.newInstance(encryptionExponent, this.radix);
    this.d = bi.newInstance(decryptionExponent, this.radix);
    this.m = bi.newInstance(modulus, 16);
    this.hex = bi.newInstance(this.m, this.radix);
    this.chunkSize = 2 * bi.highIndex(this.m);
}


function encryptedString(key, s) {
    var a = new Array();
    var sl = s.length;
    for (var i = 0; i < sl; i++) {
        a[i] = s.charCodeAt(i);
    }
    while (a.length % key.chunkSize != 0) a[i++] = 0;
    var al = a.length, result = '', j, k, block;
    for (i = 0; i < al; i += key.chunkSize) {
        block = bi.newInstance();
        for (j = 0, k = i; k < i + key.chunkSize; ++j) {
            block.digits[j] = a[k++];
            block.digits[j] += a[k++] << 8;
        }
        var crypt = key.hex.powMod(block, key.e);
        var text = crypt.toString(key.radix == 16 ? 'hex' : '');
        result += text + ' ';
    }
    return result.substring(0, result.length - 1);
}

//function decryptedString(key, s) {
//    var blocks = s.split(" ");
//    var result = "";
//    var i, j, block;
//    for (i = 0; i < blocks.length; ++i) {
//        var b = bi.newInstance(blocks[i], key.radix);
//        block = key.hex.powMod(bi, key.d);
//        for (j = 0; j <= b.highIndex(block); ++j) {
//            result += String.fromCharCode(block.digits[j] & 255, block.digits[j] >> 8)
//        }
//    }
//    if (result.charCodeAt(result.length - 1) == 0) {
//        result = result.substring(0, result.length - 1)
//    }
//    return result
//}

function aesEncrypt(text, secKey) {
    var cipher = crypto.createCipheriv('AES-128-CBC', secKey, '0102030405060708');
    return cipher.update(text, 'utf-8', 'base64') + cipher.final('base64');
}

/**
 * RSA Encryption algorithm.
 * @param text {string} - raw data to encrypt
 * @param exponent {string} - public exponent
 * @param modulus {string} - modulus
 * @returns {string} - encrypted data: text^pubKey%modulus
 */
function rsaEncrypt(text, exponent, modulus) {
    var keys = new RSAKeyPair(exponent, "", modulus);
    var encText = encryptedString(keys, text);
    return encText;
}

function createSecretKey(size) {
    var keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var key = "";
    for (var i = 0; i < size; i++) {
        var pos = Math.random() * keys.length;
        pos = Math.floor(pos);
        key = key + keys.charAt(pos)
    }
    return key;
}

var Crypto = (function () {
    var _modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
    var _nonce = '0CoJUm6Qyw8W8jud';
    var _pubKey = '010001';
    var _pem = '-----BEGIN RSA PUBLIC KEY-----\n' +
        'MIGJAoGBAOC1CfYlnfhkLbw1ZikBR33yJnfsFStf9orOYVu3tyUVKzqxeodq6opa\n' +
        'p20uQXYp7E7jQfVhNfzPaVKAEE4DEuy9qSVXyThwEUr2ydBcT38MNoW3pGvuJVky\n' +
        'V1zOELQk2BPP5IddPoIEe5fd71J0HVRrjiidxpNbPs4EYtsKIrjnAgMBAAE=\n' +
        'OWRjNjkzNWIzZWNlMDQ2MmRiMGEyMmI4ZTcCBjAxMDAwMQ==\n' +
        '-----END RSA PUBLIC KEY-----';
    var ret = {};
    ret.MD5 = function (text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }
    ret.aesRsaEncrypt = function (text, pubKey, modulus, nonce) {
        modulus = modulus || _modulus;
        nonce = nonce || _nonce;
        pubKey = pubKey || _pubKey;
        var result = {};
        var secKey = createSecretKey(16);
        result.encText = aesEncrypt(text, nonce);
        console.log('encText1', result.encText);
        result.encText = aesEncrypt(result.encText, secKey);
        console.log('encText2', result.encText);
        result.encSecKey = rsaEncrypt(secKey, pubKey, modulus);
        console.log('encSecKey', result.encSecKey);
        return result;
    }
    return ret;
})();
module.exports = Crypto;
//mm.aesRsaEncrypt('{"phone":"000000","password":"670b14728ad9902aecba32e22fa4f6bd","rememberLogin":"true"}');