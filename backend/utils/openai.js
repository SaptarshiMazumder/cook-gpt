const OpenAI = require("openai");
require('dotenv').config();
const path = require('path');
const  openaiApiKey  = process.env.OPENAI_API_KEY;
const fs = require('fs');
const client = new OpenAI({
    apiKey: openaiApiKey
});
const {zodResponseFormat} = require('openai/helpers/zod');
const {z} = require('zod');
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

// const IndexItemArray = z.array(IndexItem);
// Define Zod schema for the response, which wraps the array in an object
const IndexItemSchema = z.object({
    items: z.array(IndexItem),
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
        // console.log("Conversation History:", conversationHistory);
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching chat completion:", error);
        throw new Error("Failed to generate a response.");
    }
}

async function getChatCompletionWithoutHistory(prompt) {
    try {
        const chatCompletion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a professional chef providing
                     detailed and accurate responses.`
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

// async function outputAudioStream(input) {
//     const mp3Stream = client.audio.speech.createStream({
//         model: "tts-1",
//         voice: "nova",
//         input: input,
//     });

//     return mp3Stream; // Return the streaming audio data directly
// }

async function getAudioStream() {
    return await outputAudioStream();
}

module.exports = { getChatCompletion, outputAudioStream, getChatCompletionWithoutHistory };
