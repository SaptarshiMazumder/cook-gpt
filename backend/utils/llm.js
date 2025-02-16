require('dotenv').config();
const path = require('path');
const OpenAI = require("openai");
const fs = require('fs');
const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');

// Define Zod schema for the response
const IndexItem = z.object({
    title: z.string(),
    ingredients: z.string(),
    instructions: z.string(),
    preparationTime: z.string(),
    difficulty: z.string(),
    tips: z.string(),
    source: z.string(),
    link: z.string(),
    tags: z.array(z.string()),
});

const IndexItemSchema = z.object({
    items: z.array(IndexItem),
});

const { models } = require('../config/llmConfig');

// Initialize clients
for (const modelName in models) {
    const model = models[modelName];
    if (model.apiKey) {
        model.client = new OpenAI({ apiKey: model.apiKey });
    } else {
        console.warn(`API key for ${modelName} is not set. This model will not be available.`);
    }
}

// Helper function to get chat completion
async function getChatCompletion(conversationHistory, adjustedPrompt, modelName = "openai") {
    const model = models[modelName];
    if (!model.client) {
        throw new Error(`Model ${modelName} is not available.`);
    }

    try {
        const chatCompletion = await model.client.chat.completions.create({
            model: model.modelName,
            messages: conversationHistory.concat({
                role: "assistant",
                content: adjustedPrompt
            }),
            response_format: zodResponseFormat(IndexItemSchema, "items")
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Error fetching chat completion for ${modelName}:`, error);
        throw new Error(`Failed to generate a response using ${modelName}.`);
    }
}

// Helper function to get chat completion without history
async function getChatCompletionWithoutHistory(prompt, modelName = "openai") {
    const model = models[modelName];
    if (!model.client) {
        throw new Error(`Model ${modelName} is not available.`);
    }

    try {
        const chatCompletion = await model.client.chat.completions.create({
            model: model.modelName,
            messages: [
                {
                    role: "system",
                    content: `You are a professional chef providing detailed and accurate responses.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: zodResponseFormat(IndexItemSchema, "items")
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Error fetching chat completion for ${modelName}:`, error);
        throw new Error(`Failed to generate a response using ${modelName}.`);
    }
}

// Audio stream function
async function outputAudioStream(input) {
    const model = models["openai"]; // Audio stream is only available for OpenAI
    if (!model.client) {
        throw new Error(`Model openai is not available.`);
    }
    const speechFile = path.resolve("./speech.mp3");
    const mp3 = await model.client.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: input,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    // Return a readable stream from the saved file
    return fs.createReadStream(speechFile);
}

module.exports = { getChatCompletion, outputAudioStream, getChatCompletionWithoutHistory };
