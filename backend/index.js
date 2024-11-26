const express = require('express');
const cors = require('cors');
const OpenAI = require("openai");
const compromise = require('compromise');
const routes = require('./routes/routes');
const encryptionRoutes = require('./routes/encryption');
const { testEncryption } = require('./controllers/encryption/encryptionController');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes'); // Import routes
require('dotenv').config();
require('./utils/passport'); // Initialize Passport




const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use('/', routes);
app.use('/auth', authRoutes);
app.use('/encryption', encryptionRoutes);
// const openaiApiKey = process.env.OPENAI_API_KEY;

const PORT = 4000;
// const client = new OpenAI({
//     apiKey: openaiApiKey
// });

// // Store conversation context
// let conversationHistory = [
//     {
//         role: "system",
//         content: `
//         You are a professional chef specializing in detailed, step-by-step recipes. Each recipe must include:
//         1. A full list of ingredients with exact measurements.
//         2. Numbered instructions for each step in the cooking process.
//         3. Optional tips to improve the dish or avoid common mistakes.
//         Use only trusted culinary sources, and relate all answers to cooking even if the query seems unrelated.
//         `
//     }
// ];

// function detectCookingRelated(prompt) {
//     // Perform basic text analysis
//     const doc = compromise(prompt);
//     const nouns = doc.nouns().out('array');

//     // Cooking-related keywords
//     const cookingKeywords = [
//         "recipe", "cook", "bake", "fry", "grill", "boil", "roast", "ingredients",
//         "dish", "meal", "food", "flavor", "chef", "cuisine", "kitchen"
//     ];

//     // Check for matches
//     return nouns.some(noun => cookingKeywords.includes(noun.toLowerCase()));
// }


// async function getChatCompletion(prompt) {
//     try {
//         // Check if the prompt is related to cooking
//         let adjustedPrompt = prompt;
//         const isCookingRelated = detectCookingRelated(prompt);

//         if (!isCookingRelated) {
//             adjustedPrompt = `
//                 The user has asked a question unrelated to cooking. Respond humorously or creatively from the perspective of a professional chef and relate the answer to cooking.
//                 Original Question: "${prompt}"
//             `;
//         }

//         // Add the user query to the conversation history
//         conversationHistory.push({ role: "user", content: prompt });

//         // Add the adjusted prompt (if unrelated) to the API request
//         const chatCompletion = await client.chat.completions.create({
//             model: "gpt-4o-mini",
//             messages: conversationHistory.concat({
//                 role: "assistant",
//                 content: adjustedPrompt
//             }),
//         });

//         const assistantResponse = chatCompletion.choices[0].message.content;

//         // Add the assistant's response to the conversation history
//         conversationHistory.push({ role: "assistant", content: assistantResponse });

//         console.log(assistantResponse);
//         return assistantResponse;

//     } catch (error) {
//         console.error("Error fetching chat completion:", error);
//         throw new Error("Failed to generate a response.");
//     }
// }

app.get('/', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// app.get('/', async (req, res) => {
//     const prompt = req.query.prompt || "Provide a step-by-step recipe for making Tiramisu.";
    
//     try {
//         const recipe = await getChatCompletion(prompt);
//         res.json({ recipe });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// app.get('/prompt', async (req, res) => {
//     console.log("Request query:")
//     console.log(req.query);
//     let { message } = req.query;
//     if(message == null || message == undefined) {
//         message = "Provide a step-by-step recipe for making Tiramisu."
//     }
//     // const prompt = req.query.prompt || "Provide a step-by-step recipe for making Tiramisu.";
    
//     try {
//         const recipe = await getChatCompletion(message);
//         res.json({ recipe });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
