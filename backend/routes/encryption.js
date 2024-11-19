const express = require('express');
const {
    generateAESKeyAndIV,
    encryptWithAES,
    decryptWithAES,
    encryptWithRSA,
    decryptWithRSA,
    encryptPayloadForServerFromClient,
    decryptPayloadForServer,
    encryptResponseForClientFromServer,
    decryptResponseForClient,
    encryptDecryptClientRequest,
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

router.post('/decryptPayloadForServer', async (req, res) => {
    try {
        const { encryptedAESKey, encryptedIV, payload } = req.body;

        const decryptedPayload = await decryptPayloadForServer(encryptedAESKey, encryptedIV, payload);

        res.json({ decryptedPayload });
    } catch (error) {
        console.error('Error in /decryptPayloadForServer route:', error.message);
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }
});

router.get('/encryptPayloadForServerFromClient', async (req, res) => {
    const { text } = req.query; 
    if (!text) {
        return res.status(400).json({ error: 'Text parameter is required' });
    }

    try {
        const response = await encryptPayloadForServerFromClient(text);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error in /encryptPayloadForServerFromClient route:', error.message);
        res.status(500).json({ error: 'Encryption test failed', details: error.message });
    }
});




router.get('/encryptResponseForClientFromServer', async (req, res) => {
    const { data } = req.query;
    if (!data) {
        return res.status(400).json({ error: 'Data parameter is required' });
    }

    try {
        const response = await encryptResponseForClientFromServer(data);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error in /encryptResponseForClientFromServer route:', error.message);
        res.status(500).json({ error: 'Encryption failed', details: error.message });
    }
});

router.post('/decryptResponseForClient', (req, res) => {
    try {
        const { encryptedAESKey, encryptedIV, payload } = req.body;

        const decryptedPayload = decryptResponseForClient(encryptedAESKey, encryptedIV, payload);

        res.json({ decryptedPayload });
    } catch (error) {
        console.error('Error in /decryptResponseForClient route:', error.message);
        res.status(500).json({ error: 'Decryption failed', details: error.message });
    }
});

router.get('/handleData', async (req, res) => {
    const { text } = req.query; 
    if (!text) {
        return res.status(400).json({ error: 'Text parameter is required' });
    }

    try {
        // Step 1: Encrypt payload for the server
        const { encryptedAESKey, encryptedIV, payload } = await encryptPayloadForServerFromClient(text);

        // Step 2: Decrypt payload on the server
        const decryptedPayload = decryptPayloadForServer(encryptedAESKey, encryptedIV, payload);

        console.log('Decrypted Payload on Server:', decryptedPayload);

        // Step 3: Add server-side modification
        const modifiedPayload = `${decryptedPayload} - After doing some operation, sending it to client`;

        console.log('Modified Payload on Server:', modifiedPayload);

        // Step 4: Encrypt the modified payload for the client
        const encryptedResponseForClient = await encryptResponseForClientFromServer(modifiedPayload);

        // Step 5: Decrypt the response on the client
        const decryptedPayloadForClient = decryptResponseForClient(
            encryptedResponseForClient.encryptedAESKey,
            encryptedResponseForClient.encryptedIV,
            encryptedResponseForClient.payload
        );

        console.log('Decrypted Payload on Client:', decryptedPayloadForClient);

        // Final Response
        res.json({
            success: true,
            originalPayload: text,
            serverDecryptedPayload: decryptedPayload,
            serverModifiedPayload: modifiedPayload,
            clientDecryptedPayload: decryptedPayloadForClient,
        });
    } catch (error) {
        console.error('Error in /encryptPayloadForServerFromClient route:', error.message);
        res.status(500).json({ error: 'Flow test failed', details: error.message });
    }
});


module.exports = router;
