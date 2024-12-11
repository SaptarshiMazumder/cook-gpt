const express = require('express');
const { handleUserPrompt, getAudioStream } = require('../utils/conversation');

const router = express.Router();

// Default prompt route
router.get('/', async (req, res) => {
    const prompt = req.query.prompt || "Provide a step-by-step recipe for making Tiramisu.";
    try {
        const recipe = await handleUserPrompt(prompt);
        res.json({ recipe });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Custom prompt route
router.get('/prompt', async (req, res) => {
    let { message } = req.query;
    if (!message) {
        message = "Provide a step-by-step recipe for making Tiramisu.";
    }

    try {
        const recipe = await handleUserPrompt(message);
        res.json({ recipe });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/audio', async (req, res) => {
    try {
        // Get text input from request body
        let { text } = req.body;

        if (!text || text.trim() === "") {
            text = "Hey, sorry, some message"; // Default message
        }

        const audioStream = await getAudioStream(text);

        // Set headers to serve audio correctly
        res.setHeader('Content-Type', 'audio/mpeg');
        audioStream.pipe(res);
    } catch (error) {
        console.error("Error serving audio stream:", error);
        res.status(500).send("Failed to stream audio.");
    }
});

// router.post('/audio', async (req, res) => {
//     try {
//         let { text } = req.body;

//         if (!text || text.trim() === "") {
//             text = "Hey, sorry, some message"; // Default message
//         }

//         console.log(`Generating audio for text: "${text}"`);

//         // Generate and stream audio in chunks
//         res.setHeader('Content-Type', 'audio/mpeg');
//         const audioStream = await getAudioStream(text);

//         // Pipe the streaming response directly to the client
//         audioStream.pipe(res);

//         audioStream.on('end', () => {
//             console.log('Audio streaming completed.');
//         });

//         audioStream.on('error', (error) => {
//             console.error('Error while streaming audio:', error);
//             res.status(500).send('Error streaming audio.');
//         });
//     } catch (error) {
//         console.error('Error generating audio:', error);
//         res.status(500).send('Error generating audio.');
//     }
// });


module.exports = router;
