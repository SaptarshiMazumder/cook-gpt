const crypto = require('crypto');
const forge = require('node-forge');
// Encrypt data with RSA public key
// function rsaEncrypt(data, publicKey) {
//     // return crypto.publicEncrypt(publicKey, data).toString('base64');
//     return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');

// }

function rsaEncrypt(data, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(data, 'RSAES-PKCS1-V1_5'); // Padding scheme
    return forge.util.encode64(encrypted); // Base64-encode the encrypted data
}

// Decrypt data with RSA private key
// function rsaDecrypt(encryptedData, privateKey) {
//     return crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
// }

function rsaDecrypt(encryptedData, privateKeyPem) {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encryptedBytes = forge.util.decode64(encryptedData); // Decode Base64
    const decrypted = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5'); // Padding scheme
    return decrypted; // Return decrypted data as a string
}

module.exports = { rsaEncrypt, rsaDecrypt };
