const express = require('express');
const {
    generateAESKeyAndIV,
    encryptWithAES,
    decryptWithAES,
    encryptWithRSA,
    decryptWithRSA,
    // encryptPayloadForServerFromClient,
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

// router.get('/encryptPayloadForServerFromClient', async (req, res) => {
//     const { text } = req.query; 
//     if (!text) {
//         return res.status(400).json({ error: 'Text parameter is required' });
//     }

//     try {
//         const response = await encryptPayloadForServerFromClient(text);
//         res.json({ success: true, response });
//     } catch (error) {
//         console.error('Error in /encryptPayloadForServerFromClient route:', error.message);
//         res.status(500).json({ error: 'Encryption test failed', details: error.message });
//     }
// });




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




module.exports = router;
