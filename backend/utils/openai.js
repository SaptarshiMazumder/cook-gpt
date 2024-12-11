const OpenAI = require("openai");
require('dotenv').config();
const path = require('path');
const  openaiApiKey  = process.env.OPENAI_API_KEY;
const fs = require('fs');
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

async function outputAudioStream(input) {
    const speechFile = path.resolve("./speech.mp3");
    const mp3 = await client.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        // input: "Today is a wonderful day to build something people love!",
        input: input,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    // Return a readable stream from the saved file
    return fs.createReadStream(speechFile);
}

async function getAudioStream() {
    return await outputAudioStream();
}

module.exports = { getChatCompletion, outputAudioStream };
