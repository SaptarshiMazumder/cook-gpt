const { detectCookingRelated } = require('./compromise');
const { getChatCompletion, outputAudioStream, getChatCompletionWithoutHistory } = require('./openai');

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
    You are a professional chef and culinary researcher. The user provides an array of ingredients: ${ingredientList}. Your output must adhere to the following rules:

1. Provide up to four (4) **exact and complete** recipes that primarily use these ingredients, referencing only trusted, publicly available sources (e.g., AllRecipes, Food Network, Bon Appétit).
   - If fewer than 4 recipes can be found, explicitly state that fewer were found and return only those that exist.
2. Each recipe must include:
   - "title": Name of the recipe
   - "ingredients": A complete, accurate list of ingredients (with precise measurements) that matches the source’s recipe. Use the user’s ingredients as the core and add only common/minimal items (e.g., salt, oil) if needed.
   - "instructions": The full cooking steps exactly as written in the source, with no summarization or omission.
   - "preparationTime": The stated prep/cook time if available
   - "difficulty": The difficulty level if provided by the source
   - "tips": Any additional notes from the source
   - "source": Name of the source (e.g., "Food Network")
   - "link": The direct URL to the recipe
   - "tags": An array of relevant tags (e.g., "Breakfast", "Vegan", etc.)
3. If no recipe strictly matches the user’s ingredient list, propose minimal additional ingredients or similar recipes. However, do not include “outrageous” additions.
4. If you truly cannot find any recipe, you may return fewer than four or even zero. In that case, explicitly mention that fewer were found.
5. Respond **only** with a valid JSON array in the form:

[
  {
    "title": "Recipe Title",
    "ingredients": ["Ingredient 1", "Ingredient 2", ...],
    "instructions": ["Step 1", "Step 2", ...],
    "preparationTime": "Time string (if any)",
    "difficulty": "Difficulty level (if any)",
    "tips": "Notes or additional tips",
    "source": "Source name",
    "link": "https://...",
    "tags": ["Tag1", "Tag2", ...]
  }
]

6. Do not use triple backticks, Markdown formatting, or any text outside the JSON array. Return only the array itself, with no preamble or postscript.

    `;



    // Add to conversation history
    conversationHistory.push({ role: "user", content: prompt });

    // let assistantResponse = await getChatCompletion(conversationHistory, prompt);
    let assistantResponse = await getChatCompletionWithoutHistory(prompt);

    // // Check for source inclusion
    // if (!assistantResponse.toLowerCase().includes("source")) {
    //     assistantResponse += "\n\n(Note: The source was not explicitly provided in the response. Please validate or request the source.)";
    // }

    // const formattedResponse = formatMarkdownResponse(assistantResponse);



    // // Add assistant's response to conversation history
    // conversationHistory.push({ role: "assistant", content: formattedResponse });

    return assistantResponse;
}

async function handleItemsSearchPrompt(keyword){
    const prompt = `
    You are a professional chef and culinary researcher tasked with finding recipes. Your output must adhere to the following rules:
    
    1. Provide **exact and complete recipes** for "${keyword}" from trusted and publicly available sources (e.g., AllRecipes, Food Network, Bon Appétit).
    2. Ensure that the response includes **exactly 4 recipes**. If fewer than 4 recipes exist, explicitly state that fewer recipes were found and return only the available recipes.
    3. Each recipe must include:
       - Name of the recipe.
       - Complete and accurate list of ingredients with precise measurements.
       - Full cooking instructions as present in the source, with **step-by-step clarity** and no summarization.
       - Preparation time and difficulty level, if available.
       - Additional tips or notes provided in the source.
       - Source name and a link to the recipe.
       - Relevant tags (e.g., cuisine type, category).
    4. **Do not summarize** or omit details. Present the instructions exactly as written in the source.
    5. Respond in this format, adhering to the following structure:
    [
        {
            "title": "Recipe Title",
            "ingredients": ["Ingredient 1", "Ingredient 2", ...],
            "instructions": ["Step 1", "Step 2", ...],
            "preparationTime": "Time string",
            "difficulty": "Difficulty level",
            "tips": "Additional notes or tips",
            "source": "Name of the source",
            "link": "URL to the recipe",
            "tags": ["Tag1", "Tag2", ...]
        }
    ]
    
    Do not use triple backticks, Markdown, or any code fencing. 
    Respond ONLY with the array. Do not include any text before or after the JSON.
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

async function handleMorePrompt(keyword){
    const prompt = `More recipies for ${keyword}, in the exact same format as before`  ;
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
