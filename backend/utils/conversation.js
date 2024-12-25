const { detectCookingRelated } = require('./compromise');
const { getChatCompletion, outputAudioStream } = require('./openai');

let conversationHistory = [
    {
        role: "system",
        content: `
You are a professional chef and culinary researcher tasked with retrieving recipes based on specific names. Your output must adhere to the following rules:

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
    }
];

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
You are a professional chef and culinary researcher tasked with finding recipes using only publicly available, verifiable sources. Your output must adhere to the following strict rules:

1. Use ONLY publicly available recipes from trusted sources, such as reputable websites or cookbooks.
2. The recipe must match the source EXACTLY as it appears. Do not modify, reinterpret, or "inspire" recipes in any way.
3. Provide a direct link to the source or reference the cookbook with page numbers.
4. If no matching recipe exists, analyze the provided ingredients and:
   - Identify why no recipes match (e.g., uncommon combination, missing essential ingredients).
   - Suggest realistic substitutions or additions to improve the feasibility of finding a recipe.
5. If a recipe cannot be provided, clearly state: "No exact recipes found with the given ingredients."

The provided ingredients are: ${ingredientList}.

Format the output as follows:
- Name of Recipe
- Ingredients (with exact measurements)
- Numbered Instructions (exactly as described in the source)
- Source (mandatory, with a direct link or reference)
- Explanation (if no recipe is found)
`;



    // Add to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    let assistantResponse = await getChatCompletion(conversationHistory, prompt);

    // Check for source inclusion
    if (!assistantResponse.toLowerCase().includes("source")) {
        assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    }

    const formattedResponse = formatMarkdownResponse(assistantResponse);



    // Add assistant's response to conversation history
    conversationHistory.push({ role: "assistant", content: formattedResponse });

    return assistantResponse;
}

async function handleItemsSearchPrompt(keyword){
    const prompt = `
    You are a professional chef and culinary researcher tasked with finding recipes based on specific names. Your output must adhere to the following rules:

    1. Use ONLY publicly available recipes from trusted sources, such as reputable websites or cookbooks.
    2. Provide a list of recipes with the specified name or closely related names.
    3. Each recipe in the list must include:
       - Name of the recipe
       - Source (link to the recipe or reference to the cookbook)
    4. Do not generate or "inspire" recipes. Use exact matches from trusted sources.
    5. If you can't find any matching recipies online, say so, or suggest similar ones which are available publicly with verifiable sources.
    The specified recipe name is: "${keyword}".

    Respond with a list of recipe names and their sources.
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

async function handleMorePrompt(keyword){
    const prompt = `More recipies for ${keyword}`  ;
    conversationHistory.push({ role: "user", content: prompt });
    let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    console.log('assistantResponse:', assistantResponse);
    const formattedResponse = formatMarkdownResponse(assistantResponse);
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
};
