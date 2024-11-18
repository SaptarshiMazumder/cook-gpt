const OpenAI = require("openai");
require('dotenv').config();

const  openaiApiKey  = process.env.OPENAI_API_KEY;

const client = new OpenAI({
    apiKey: openaiApiKey
});

async function getChatCompletion(conversationHistory, adjustedPrompt) {
    try {
        const chatCompletion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationHistory.concat({
                role: "assistant",
                content: adjustedPrompt
            }),
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching chat completion:", error);
        throw new Error("Failed to generate a response.");
    }
}

module.exports = { getChatCompletion };
