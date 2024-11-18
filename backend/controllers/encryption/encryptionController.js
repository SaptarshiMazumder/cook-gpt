const { encryptWithAES, decryptWithAES } = require('./aes');
const { encryptWithRSA, decryptWithRSA } = require('./rsa');
const crypto = require('crypto');
const axios = require('axios'); 
const { clientPrivateKey, clientPublicKey } = require('../../utils/keys');
const { serverPrivateKey, serverPublicKey } = require('../../utils/keys');


function generateAESKeyAndIV() {
    return {
        key: crypto.randomBytes(32), 
        iv: crypto.randomBytes(16), 
    };
}

async function encryptPayloadForBackend(text, url = 'http://localhost:4000/encryption/decryptPayloadForBackend') {
    try {
        
        const { key: aesKey, iv } = generateAESKeyAndIV();
       
        const encryptedPayload = encryptWithAES(text, aesKey, iv);
        const { data: publicKeyResponse } = await axios.get('http://localhost:4000/encryption/client-public-key');
        const publicKey = publicKeyResponse.clientPublicKey;

        const encryptedAESKey = encryptWithRSA(aesKey, publicKey);
        const encryptedIV = encryptWithRSA(iv, publicKey);
        const response = await axios.post(url, {
            encryptedAESKey,
            encryptedIV,
            payload: encryptedPayload,
        });

        console.log('Server response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in testEncryption:', error.message);
        throw error;
    }
}

function decryptPayloadForBackend(encryptedAESKey, encryptedIV, payload) {
    try {
        const aesKey = decryptWithRSA(encryptedAESKey, clientPrivateKey);
        const iv = decryptWithRSA(encryptedIV, clientPrivateKey);
        const decryptedPayload = decryptWithAES(payload, aesKey, iv);

        return decryptedPayload;
    } catch (error) {
        console.error('Error decrypting payload:', error.message);
        throw error;
    }
}


async function encryptResponseForFrontend(data) {
    let url = 'http://localhost:4000/encryption/decryptResponseForFrontend';
    try {

        // Step 1: Generate AES Key and IV
        const { key: aesKey, iv } = generateAESKeyAndIV();

        // Step 2: Encrypt the payload with AES
        const encryptedPayload = encryptWithAES(data, aesKey, iv);
        const { data: publicKeyResponse } = await axios.get('http://localhost:4000/encryption/server-public-key');
        const publicKey = publicKeyResponse.serverPublicKey;

        // Step 3: Encrypt AES Key and IV with RSA
        const encryptedAESKey = encryptWithRSA(aesKey, publicKey);
        const encryptedIV = encryptWithRSA(iv, publicKey);
        console.log('Encrypted Payload:', encryptedPayload);
        const response = await axios.post(url, {
            encryptedAESKey,
            encryptedIV,
            payload: encryptedPayload,
        });
        // return { encryptedAESKey, encryptedIV, payload: encryptedPayload };
        return response.data;
    } catch (error) {
        console.error('Error encrypting data for frontend:', error.message);
        throw error;
    }
}

 function decryptResponseForFrontend(encryptedAESKey, encryptedIV, payload) {
    try {
        const aesKey = decryptWithRSA(encryptedAESKey, serverPrivateKey);
        const iv = decryptWithRSA(encryptedIV, serverPrivateKey);
        const decryptedPayload = decryptWithAES(payload, aesKey, iv);

        console.log('Decrypted Payload:', decryptedPayload);
        return decryptedPayload;
    } catch (error) {
        console.error('Error fetching or decrypting data:', error.message);
    }
}


module.exports = {
    generateAESKeyAndIV,
    encryptWithAES,
    decryptWithAES,
    encryptWithRSA,
    decryptWithRSA,
    encryptPayloadForBackend,
    decryptPayloadForBackend,
    encryptResponseForFrontend,
    decryptResponseForFrontend,
};
