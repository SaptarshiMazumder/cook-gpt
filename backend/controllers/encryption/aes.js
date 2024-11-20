const crypto = require('crypto');
const CryptoJS = require('crypto-js');


// function aesEncrypt(data, key, iv) {
//     const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
//     let encrypted = cipher.update(data, 'utf8', 'base64');
//     encrypted += cipher.final('base64');
//     return encrypted;
// }

function aesEncrypt(data, key, iv) {
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Base64.parse(key), {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString(); // Return Base64-encoded string
}

// function aesDecrypt(encryptedData, key, iv) {
//     const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
//     let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// }

function aesDecrypt(encryptedData, key, iv) {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Base64.parse(key), {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8); // Convert decrypted bytes to UTF-8 string
}

module.exports = { aesEncrypt, aesDecrypt };
