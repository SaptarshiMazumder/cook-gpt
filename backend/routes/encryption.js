const express = require('express');
const {
    generateAESKeyAndIV,
    encryptWithAES,
    decryptWithAES,
    encryptWithRSA,
    decryptWithRSA,
    encryptPayloadForBackend,
    decryptPayloadForBackend,
    encryptResponseForFrontend,
    decryptResponseForFrontend,
} = require('../controllers/encryption/encryptionController');
const { clientPrivateKey, clientPublicKey } = require('../utils/keys');
const { serverPrivateKey, serverPublicKey } = require('../utils/keys');

const router = express.Router();

router.get('/client-public-key', (req, res) => {
    res.json({ clientPublicKey });
});

router.get('/server-public-key', (req, res) => {
    res.json({ serverPublicKey });
});

// router.post('/encrypt', (req, res) => {
//     const { data } = req.body;

//     try {
//         const { key: aesKey, iv } = generateAESKeyAndIV();
//         const encryptedPayload = encryptWithAES(data, aesKey, iv);
//         const encryptedAESKey = encryptWithRSA(aesKey, clientPublicKey);
//         const encryptedIV = encryptWithRSA(iv, clientPublicKey);

//         res.json({ encryptedAESKey, encryptedIV, payload: encryptedPayload });
//     } catch (err) {
//         res.status(500).json({ error: 'Encryption failed', details: err.message });
//     }
// });

// router.post('/decrypt', (req, res) => {
//     const { encryptedAESKey, encryptedIV, payload } = req.body;

//     try {
//         const aesKey = decryptWithRSA(encryptedAESKey, clientPrivateKey);
//         const iv = decryptWithRSA(encryptedIV, clientPrivateKey);
//         const decryptedPayload = decryptWithAES(payload, aesKey, iv);

//         res.json({ decryptedPayload });
//     } catch (err) {
//         res.status(500).json({ error: 'Decryption failed', details: err.message });
//     }
// });

router.post('/decryptPayloadForBackend', (req, res) => {
    try {
        const { encryptedAESKey, encryptedIV, payload } = req.body;

        const decryptedPayload = decryptPayloadForBackend(encryptedAESKey, encryptedIV, payload);

        res.json({ decryptedPayload });
    } catch (error) {
        console.error('Error in /decryptPayloadForBackend route:', error.message);
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }
});

router.get('/encryptPayloadForBackend', async (req, res) => {
    const { text } = req.query; 
    if (!text) {
        return res.status(400).json({ error: 'Text parameter is required' });
    }

    try {
        const response = await encryptPayloadForBackend(text);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error in /encryptPayloadForBackend route:', error.message);
        res.status(500).json({ error: 'Encryption test failed', details: error.message });
    }
});

router.get('/encryptResponseForFrontend', async (req, res) => {
    const { data } = req.query;
    if (!data) {
        return res.status(400).json({ error: 'Data parameter is required' });
    }

    try {
        const response = await encryptResponseForFrontend(data);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error in /encryptResponseForFrontend route:', error.message);
        res.status(500).json({ error: 'Encryption failed', details: error.message });
    }
});

router.post('/decryptResponseForFrontend', (req, res) => {
    try {
        const { encryptedAESKey, encryptedIV, payload } = req.body;

        const decryptedPayload = decryptResponseForFrontend(encryptedAESKey, encryptedIV, payload);

        res.json({ decryptedPayload });
    } catch (error) {
        console.error('Error in /decryptResponseForFrontend route:', error.message);
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }
});

module.exports = router;
