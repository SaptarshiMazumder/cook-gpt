const express = require('express');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();




const app = express();
app.use(cors());


const PORT = 4000;
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    throw new Error('Missing OpenAI API Key in environment variables');
}
const client = new OpenAI({
    apiKey: openaiApiKey
});

async function getChatCompletion(prompt) {
    try {
        const chatCompletion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
    You are a professional chef specializing in detailed, step-by-step recipes. Each recipe must include:
    1. A full list of ingredients with exact measurements.
    2. Numbered instructions for each step in the cooking process.
    3. Optional tips to improve the dish or avoid common mistakes.
    Use only trusted culinary sources, and mention the source where applicable.
`,
                },

                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        console.log(chatCompletion.choices[0].message.content);
        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error("Error fetching chat completion:", error);
    }
}

// app.get('/', (req, res) => {
//     res.json({ message: 'Hello from the backend!' });
// });

app.get('/', async (req, res) => {
    const prompt = req.query.prompt || "Provide a step-by-step recipe for making Tiramisu.";
    
    try {
        const recipe = await getChatCompletion(prompt);
        res.json({ recipe });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
