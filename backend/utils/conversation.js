const { detectCookingRelated } = require('./compromise');
const { getChatCompletion, outputAudioStream } = require('./openai');

let conversationHistory = [
    {
        role: "system",
        content: `
        You are a professional chef specializing in detailed, step-by-step recipes. Each recipe must include:
        1. A full list of ingredients with exact measurements.
        2. Numbered instructions for each step in the cooking process.
        3. Optional tips to improve the dish or avoid common mistakes.
        4. The exact source or reference where the recipe is derived from, including the website, cookbook, or professional culinary source.
        Use only trusted culinary sources, and relate all answers to cooking even if the query seems unrelated.
        `
    }
];

async function handleUserPrompt(prompt) {
    const isCookingRelated = detectCookingRelated(prompt);
    let adjustedPrompt = prompt;

    if (!isCookingRelated) {
        adjustedPrompt = `
            The user has asked a question unrelated to cooking. Respond humorously or creatively from the perspective of a professional chef and relate the answer to cooking.
            Original Question: "${prompt}"
        `;
    }

    // Add user query to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    let assistantResponse = await getChatCompletion(conversationHistory, adjustedPrompt);

    // Check if the response includes a source for cooking-related prompts
    if (isCookingRelated && !assistantResponse.toLowerCase().includes("source")) {
        assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    }

    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: assistantResponse });

    return assistantResponse;
}

async function getAudioStream(input){
    return await outputAudioStream(input);
}

module.exports = { handleUserPrompt, getAudioStream };
