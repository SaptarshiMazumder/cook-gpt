const express = require('express');
const { handleUserPrompt } = require('../utils/conversation');

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

module.exports = router;
