const { detectCookingRelated } = require('./compromise');
const { getChatCompletion, outputAudioStream, getChatCompletionWithoutHistory } = require('./openai');
const prompts = require('./prompts');
let conversationHistory = [
    {
        role: "system",
        content: `
        You are a professional chef`
    }
];

function outputConversationHistory() {
    console.log('conversation History: \n', conversationHistory);
    return conversationHistory;
}

function formatMarkdownResponse(response) {
    return response
        .replace(/\\n\\n###/g, "\n\n###") // Fix markdown headers
        .replace(/\\n\\n/g, "<br /><br />") // Replace double newlines with two <br /> tags
        .replace(/\\n/g, "<br />"); // Replace single newlines with a single <br /> tag
}


async function handleGeneralPrompt(keyword) {
    const isCookingRelated = detectCookingRelated(keyword);
    let adjustedPrompt = keyword;

    let prompt = prompts.GENERAL_PROMPT.replace('\${keyword}', keyword);

    if (!isCookingRelated) {
        adjustedPrompt = `
            The user has asked a question unrelated to cooking. Respond humorously or creatively from the perspective of a professional chef and relate the answer to cooking.
            Original Question: "${prompt}"
        `;
    }

    // Add user query to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    let assistantResponse = await getChatCompletion(conversationHistory, prompt);

    // Check if the response includes a source for cooking-related prompts
    if (isCookingRelated && !assistantResponse.toLowerCase().includes("source")) {
        assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    }

    const formattedResponse = formatMarkdownResponse(assistantResponse);

    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: formattedResponse });

    return assistantResponse;
}



async function handleKeywordPrompt(keyword){
    // const prompt = `
    // You are a professional chef. Your output must follow the rules:
    
    // 1. Provide **exact and complete recipes** for "${keyword}" from trusted and publicly available sources (e.g., AllRecipes, Food Network, Bon Appétit).
    // 2. Ensure that the response includes **exactly 4 recipes**. If fewer than 4 recipes exist, explicitly state that fewer recipes were found and return only the available recipes.  
    // 3. **Do not summarize** or omit details. Present the instructions exactly as written in the source.
    // Do not use triple backticks, Markdown, or any code fencing. 
    // `;
    
    let prompt = prompts.KEYWORD_PROMPT.replace('${keyword}', keyword);


    conversationHistory.push({ role: "user", content: prompt });
    // let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    let assistantResponse = await getChatCompletionWithoutHistory(prompt);

    // if (!assistantResponse.toLowerCase().includes("source")) {
    //     assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    // }
    // const formattedResponse = formatMarkdownResponse(assistantResponse);

    console.log('openai Response:', assistantResponse);


    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: assistantResponse });

    return assistantResponse;

    
}

async function handleKeywordMorePrompt(keyword){
    console.log('Current conversation History: \n', conversationHistory);
    console.log('---------------------------------------------------');
    // Check if the history contains only the initial system message
    if (conversationHistory.length === 1 && conversationHistory[0].role === "system") {
        const prompt = prompts.KEYWORD_MORE_PROMPT.replace('\${keyword}', keyword);
        // Add the initial prompt
        conversationHistory.push({ role: "user", content: prompt });
        let assistantResponse = await getChatCompletion(conversationHistory, prompt);
        console.log('assistantResponse:', assistantResponse);
        conversationHistory.push({ role: "assistant", content: assistantResponse });
        return assistantResponse;
    }

    const prompt = prompts.MORE_PROMPT.replace('\${keyword}', keyword);
    conversationHistory.push({ role: "user", content: prompt });
    let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    console.log('assistantResponse:', assistantResponse);
    conversationHistory.push({ role: "assistant", content: assistantResponse });
    return assistantResponse;

}

async function handleMorePrompt(keyword){
    const prompt = prompts.MORE_PROMPT.replace('\${query}', query);
    conversationHistory.push({ role: "user", content: prompt });
    let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    console.log('assistantResponse:', assistantResponse);
    conversationHistory.push({ role: "assistant", content: assistantResponse });
    return assistantResponse;

}

async function handleKeywordsPrompt(keywords) {
    const keywordsList = keywords.join(", ");
    const prompt = prompts.KEYWORDS_PROMPT.replace('\${keywordsList}', keywordsList);



    // Add to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    // let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    let assistantResponse = await getChatCompletionWithoutHistory(prompt);

   
    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: assistantResponse });
    outputConversationHistory();
    return assistantResponse;
}


async function handleKeywordsMorePrompt(keywords){
    const keywordsList = keywords.join(", ");

    console.log('Current conversation History: \n', conversationHistory);
    console.log('---------------------------------------------------');
    // Check if the history contains only the initial system message
    if (conversationHistory.length === 1 && conversationHistory[0].role === "system") {
        const prompt = prompts.KEYWORDS_MORE_PROMPT.replace('\${keywordsList}', keywordsList);
        // Add the initial prompt
        conversationHistory.push({ role: "user", content: prompt });
        let assistantResponse = await getChatCompletion(conversationHistory, prompt);
        console.log('assistantResponse:', assistantResponse);
        conversationHistory.push({ role: "assistant", content: assistantResponse });
        return assistantResponse;
    }

    const prompt = prompts.MORE_PROMPT.replace('\${keyword}', keywords);
    conversationHistory.push({ role: "user", content: prompt });
    let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    console.log('assistantResponse:', assistantResponse);
    conversationHistory.push({ role: "assistant", content: assistantResponse });
    return assistantResponse;

}


//Obsolete
// async function handleSpecificQueryPrompt(title, url){
//     const prompt = `
// You are a professional chef and culinary researcher tasked with retrieving an exact recipe from a specified source. The rules are as follows:

// 1. Use ONLY the provided URL to retrieve the recipe. Do not generate or "inspire" recipes.
//     Rephrase and rewrite the recipe in your own words, but don't change the content.
// 2. Include the recipe exactly as it appears in the source, with:
//    - Name of the recipe
//    - Full list of ingredients with exact measurements
//    - Numbered instructions for each step in the cooking process
//    - Any additional tips or notes provided in the source
// 3. Provide the reference link at the end of the response.

// The recipe title is: "${title}".
// The recipe source URL is: ${url}.

// Respond with the full recipe and reference the provided URL.
// `;

// conversationHistory.push({ role: "user", content: prompt });
// let assistantResponse = await getChatCompletion(conversationHistory, prompt);
// if (!assistantResponse.toLowerCase().includes("source")) {
//     assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
// }
// const formattedResponse = formatMarkdownResponse(assistantResponse);

// console.log('formattedResponse:', formattedResponse);
//  // Add assistant's response to conversation history
//  conversationHistory.push({ role: "assistant", content: formattedResponse });

//  return assistantResponse;

// }

async function getAudioStream(input){
    return await outputAudioStream(input);
}

module.exports = { 
    handleGeneralPrompt, 
    getAudioStream, 
    handleKeywordsPrompt ,
    handleKeywordPrompt,
    handleMorePrompt,
    // handleSpecificQueryPrompt,
    handleKeywordMorePrompt,
    handleKeywordsMorePrompt,
};
