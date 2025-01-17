const { detectCookingRelated } = require('./compromise');
const { getChatCompletion, outputAudioStream, getChatCompletionWithoutHistory } = require('./openai');

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

    let prompt = `You are a professional chef and culinary researcher tasked with retrieving a recipie for ${keyword}. Your output must adhere to the following rules:

1. Use ONLY publicly available recipes from trusted sources, such as reputable websites or cookbooks.
2. The recipe must match the source EXACTLY as it appears. Do not modify, reinterpret, or "inspire" recipes in any way.
3. Include a direct link to the recipe or reference the cookbook with page numbers, if applicable.
4. If no recipe exists with the specified name, explain why it cannot be found and suggest similar recipes that are publicly available with verifiable sources.

Each recipe must include:
- A full list of ingredients with exact measurements.
- Numbered instructions for each step in the cooking process.
- Optional tips to improve the dish or avoid common mistakes.
- The exact source or reference where the recipe is derived from, including the website, cookbook, or professional culinary source.

Use only trusted culinary sources, and relate all answers to cooking. Never generate hypothetical or AI-created recipes.

`

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

async function handleKeywordsPrompt(ingredients) {
    const ingredientList = ingredients.join(", ");
    const prompt = `
    You are a professional chef. User provides an array of ingredients: ${ingredientList}. Your output must follow the rules:
1. Provide at least 4 **exact and complete** recipes that primarily use these ingredients, referencing only trusted, publicly available sources (e.g., AllRecipes, Food Network, Bon Appétit).
   - If fewer than 4 recipes can be found, explicitly state that fewer were found and return only those that exist.
2. If no recipe strictly matches the user’s ingredient list, propose minimal additional ingredients or similar recipes. However, do not include “outrageous” additions.
3. If you truly cannot find any recipe, you may return fewer than four or even zero. In that case, explicitly mention that fewer were found.
4. **Identify any ingredients that are not edible or are hazardous**. 
   - Provide a short explanation for why these items are not suitable for cooking.
5.  Do not use triple backticks, Markdown, or any code fencing. 
    `;



    // Add to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    // let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    let assistantResponse = await getChatCompletionWithoutHistory(prompt);

   
    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: assistantResponse });
    outputConversationHistory();
    return assistantResponse;
}

async function handleItemsSearchPrompt(keyword){
    const prompt = `
    You are a professional chef. Your output must follow the rules:
    
    1. Provide **exact and complete recipes** for "${keyword}" from trusted and publicly available sources (e.g., AllRecipes, Food Network, Bon Appétit).
    2. Ensure that the response includes **exactly 4 recipes**. If fewer than 4 recipes exist, explicitly state that fewer recipes were found and return only the available recipes.  
    3. **Do not summarize** or omit details. Present the instructions exactly as written in the source.
    Do not use triple backticks, Markdown, or any code fencing. 
    `;
    


    conversationHistory.push({ role: "user", content: prompt });
    // let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    let assistantResponse = await getChatCompletionWithoutHistory(prompt);

    // if (!assistantResponse.toLowerCase().includes("source")) {
    //     assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    // }
    // const formattedResponse = formatMarkdownResponse(assistantResponse);

    console.log('openai Response:', assistantResponse);


    // Add assistant's response to conversation history
    // conversationHistory.push({ role: "assistant", content: formattedResponse });

    return assistantResponse;

    
}

async function handleMorePrompt(query){
    const prompt = `4 More recipies for ${query}, follow the same rules as before`  ;
    conversationHistory.push({ role: "user", content: prompt });
    let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    console.log('assistantResponse:', assistantResponse);
    const formattedResponse = formatMarkdownResponse(assistantResponse);
    conversationHistory.push({ role: "assistant", content: formattedResponse });
    return assistantResponse;

}

async function handleSpecificQueryPrompt(title, url){
    const prompt = `
You are a professional chef and culinary researcher tasked with retrieving an exact recipe from a specified source. The rules are as follows:

1. Use ONLY the provided URL to retrieve the recipe. Do not generate or "inspire" recipes.
    Rephrase and rewrite the recipe in your own words, but don't change the content.
2. Include the recipe exactly as it appears in the source, with:
   - Name of the recipe
   - Full list of ingredients with exact measurements
   - Numbered instructions for each step in the cooking process
   - Any additional tips or notes provided in the source
3. Provide the reference link at the end of the response.

The recipe title is: "${title}".
The recipe source URL is: ${url}.

Respond with the full recipe and reference the provided URL.
`;

conversationHistory.push({ role: "user", content: prompt });
let assistantResponse = await getChatCompletion(conversationHistory, prompt);
if (!assistantResponse.toLowerCase().includes("source")) {
    assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
}
const formattedResponse = formatMarkdownResponse(assistantResponse);

console.log('formattedResponse:', formattedResponse);
 // Add assistant's response to conversation history
 conversationHistory.push({ role: "assistant", content: formattedResponse });

 return assistantResponse;

}

async function getAudioStream(input){
    return await outputAudioStream(input);
}

module.exports = { 
    handleGeneralPrompt, 
    getAudioStream, 
    handleKeywordsPrompt ,
    handleItemsSearchPrompt,
    handleMorePrompt,
    handleSpecificQueryPrompt,
};
