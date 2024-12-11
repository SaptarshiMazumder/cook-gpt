const { aesEncrypt, aesDecrypt } = require('./aes');
const { rsaEncrypt, rsaDecrypt } = require('./rsa');
const crypto = require('crypto');
const axios = require('axios'); 
const { clientPrivateKey } = require('../../utils/keys');
const { serverPrivateKey } = require('../../utils/keys');
const CryptoJS = require('crypto-js');



function generateAESKeyAndIV() {
    return {
        key: CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64), // 256-bit AES key
        iv: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64), // 16-byte IV
    };
}

/**
 * Decrypts an encrypted payload received by the server using RSA to decrypt the AES key and IV,
 * followed by AES decryption of the payload. The decrypted payload is then modified and encrypted
 * for the client before being returned.
 * 
 * @param {string} encryptedAESKey - The AES key encrypted with the client's RSA public key.
 * @param {string} encryptedIV - The initialization vector (IV) encrypted with the client's RSA public key.
 * @param {string} payload - The payload encrypted with AES.
 * @returns {Promise<string>} The encrypted response for the client after processing the decrypted payload.
 * @throws {Error} If decryption fails at any step.
 */
async function decryptPayloadForServer(encryptedAESKey, encryptedIV, payload) {
    console.log('Reached server, now trying to decrypt...');
    try {
        console.log('------------------------------------------');
        console.log('Encrypted AES Key:', encryptedAESKey);
        console.log('Encrypted IV:', encryptedIV);
        console.log('Payload:', payload);
        console.log('------------------------------------------');

        const aesKey = rsaDecrypt(encryptedAESKey, clientPrivateKey);
        const iv = rsaDecrypt(encryptedIV, clientPrivateKey);
        const decryptedPayload = aesDecrypt(payload, aesKey, iv);
        
        //Do something with the data here ->
        const modifiedPayload = `${decryptedPayload} - Performed some operation on the backend and sent to client`;
        console.log('Modified Payload:', modifiedPayload);

        const encryptedDecryptedResponseForClient = await encryptForClient(modifiedPayload);
        
        return encryptedDecryptedResponseForClient;
        // return decryptedPayload;
    } catch (error) {
        console.error('Error decrypting payload:', error.message);
        throw error;
    }
}


async function encryptForClient(data) {
    // let url = 'http://localhost:4000/encryption/decryptServerResponse';
    try {

        // Step 1: Generate AES Key and IV
        const { key: aesKey, iv } = generateAESKeyAndIV();

        // Step 2: Encrypt the payload with AES
        const encryptedPayload = aesEncrypt(data, aesKey, iv);
        const { data: publicKeyResponse } = await axios.get('http://localhost:4000/encryption/server-public-key');
        const publicKey = publicKeyResponse.serverPublicKey;

        // Step 3: Encrypt AES Key and IV with RSA
        const encryptedAESKey = rsaEncrypt(aesKey, publicKey);
        const encryptedIV = rsaEncrypt(iv, publicKey);
        console.log('Encrypted Payload:', encryptedPayload);

        // Step 5: Send back the encrypted response
        return {
            encryptedAESKey,
            encryptedIV,
            payload: encryptedPayload,
        };
        const response = await axios.post(url, {
            encryptedAESKey,
            encryptedIV,
            payload: encryptedPayload,
        });
        // // return { encryptedAESKey, encryptedIV, payload: encryptedPayload };
        return response.data;
    } catch (error) {
        console.error('Error encrypting data for client:', error.message);
        throw error;
    }
}

// /**
//  * Decrypts response from server. The response is encrypted with AES key and IV which are encrypted with server's public RSA key.
//  * @param {string} encryptedAESKey - AES key encrypted with server's public RSA key
//  * @param {string} encryptedIV - IV encrypted with server's public RSA key
//  * @param {string} payload - Encrypted payload
//  * @returns {Promise<string>} Decrypted payload
//  */
//  function decryptServerResponse(encryptedAESKey, encryptedIV, payload) {
//     console.log('Entered here');
//     try {
//         const aesKey = rsaDecrypt(encryptedAESKey, serverPrivateKey);
//         const iv = rsaDecrypt(encryptedIV, serverPrivateKey);
//         const decryptedPayload = aesDecrypt(payload, aesKey, iv);

//         console.log('Decrypted Payload:', decryptedPayload);
//         return decryptedPayload;
//     } catch (error) {
//         console.error('Error fetching or decrypting data:', error.message);
//     }
// }




module.exports = {
    generateAESKeyAndIV,
    aesEncrypt,
    aesDecrypt,
    rsaEncrypt,
    rsaDecrypt,
    decryptPayloadForServer,
    encryptForClient,
    // decryptServerResponse,
};
