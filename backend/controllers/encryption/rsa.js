const crypto = require('crypto');

// Encrypt data with RSA public key
function encryptWithRSA(data, publicKey) {
    return crypto.publicEncrypt(publicKey, data).toString('base64');
}

// Decrypt data with RSA private key
function decryptWithRSA(encryptedData, privateKey) {
    return crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
}

module.exports = { encryptWithRSA, decryptWithRSA };
