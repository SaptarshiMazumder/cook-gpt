import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import axios from 'axios';


const API_BASE_URL = 'http://localhost:4000';

function generateAESKeyAndIV() {
    return {
        key: CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64), // 256-bit AES key
        iv: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64), // 16-byte IV
    };
}


// Encryption Functions
// AES Encryption
function encryptWithAES(data, key, iv) {
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Base64.parse(key), {
        iv: CryptoJS.enc.Base64.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString(); // Return Base64-encoded encrypted data
}

// RSA Encryption
function encryptWithRSA(data, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(data, 'RSAES-PKCS1-V1_5');
    return forge.util.encode64(encrypted); // Return Base64-encoded encrypted data
}


// Function to encrypt data for the server
export async function encryptForServer(text) {
    try {
        // Step 1: Generate AES Key and IV
        const { key: aesKey, iv } = generateAESKeyAndIV();

        // Step 2: Encrypt the payload with AES
        const encryptedPayload = encryptWithAES(text, aesKey, iv);

        // Step 3: Get the server's public RSA key
        const { data: publicKeyResponse } = await axios.get(`${API_BASE_URL}/encryption/client-public-key`);
        const publicKey = publicKeyResponse.clientPublicKey;
        // Step 4: Encrypt the AES Key and IV with RSA
        const encryptedAESKey = encryptWithRSA(aesKey, publicKey);
        const encryptedIV = encryptWithRSA(iv, publicKey);

        // Step 5: Send encrypted data to the server
        const response = await axios.post(`${API_BASE_URL}/encryption/decryptPayloadForServer`, {
            encryptedAESKey,
            encryptedIV,
            payload: encryptedPayload,
        });
        console.log('Server Response:', response.data);

        return response.data; // Server's response
    } catch (error) {
        console.error('Error encrypting data for server:', error.message);
        throw error;
    }
}



//Decryption Functions
// RSA Decrypt Function
export function decryptWithRSA(encryptedData, privateKey) {
    try{
        if (!encryptedData || typeof encryptedData !== 'string') {
            throw new Error('Invalid input: encryptedData must be a Base64-encoded string');
        }
    
        const decrypt = new JSEncrypt();
        decrypt.setPrivateKey(privateKey);
    
        const decrypted = decrypt.decrypt(encryptedData);
       
        console.log('Decrypted Data:', decrypted);
        return decrypted;
    }
    catch(error){
        console.error('Error decrypting with RSA:', error.message);
    }
    
}

// AES Decrypt Function
export function decryptWithAES(encryptedData, aesKey, iv) {
    if (!encryptedData || !aesKey || !iv) {
        throw new Error('Invalid input: All parameters (encryptedData, aesKey, iv) are required');
    }

    const keyBytes = CryptoJS.enc.Base64.parse(aesKey);
    const ivBytes = CryptoJS.enc.Base64.parse(iv);

    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) {
            throw new Error('AES decryption failed');
        }

        return result;
    } catch (error) {
        console.error('Error decrypting with AES:', error.message);
        throw new Error('AES decryption failed');
    }
}

// Combine RSA and AES Decryption
export function decryptResponseForClient(encryptedAESKey, encryptedIV, encryptedPayload, privateKey) {
    console.log('encryptedAESKey:', encryptedAESKey);
    console.log('encryptedIV:', encryptedIV);
    console.log('encryptedPayload:', encryptedPayload);
    // console.log('privateKey:', privateKey);
    if (!encryptedAESKey || !encryptedIV || !encryptedPayload || !privateKey) {
        throw new Error('Invalid input: All parameters are required for decryption');
    }

    try {
        const aesKey = decryptWithRSA(encryptedAESKey, privateKey);
        const iv = decryptWithRSA(encryptedIV, privateKey);
        const decryptedPayload = decryptWithAES(encryptedPayload, aesKey, iv);

        console.log('Decrypted Payload:', decryptedPayload);
        return decryptedPayload;
    } catch (error) {
        console.error('Error decrypting server response:', error.message);
        throw new Error('Failed to decrypt server response');
    }
}
