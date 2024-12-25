const express = require('express');
const { 
    handleGeneralPrompt, 
    getAudioStream, 
    handleKeywordsPrompt,
    handleItemsSearchPrompt,
    handleMorePrompt,
 } = require('../utils/conversation');

const router = express.Router();
const path = require('path');
const fs = require('fs'); // Import the fs module

const recipiesList = require('../data/recipies.json')
const recipesFilePath = path.join(__dirname, '../data/recipies.json');


const natural = require("natural");

//Helper functions
// Function to generate tags using TF-IDF
function generateTagsUsingTFIDF(allTexts, targetText) {
    const tfidf = new natural.TfIdf();
    allTexts.forEach(text => tfidf.addDocument(text));

    const tags = [];
    tfidf.listTerms(tfidf.documents.length - 1).slice(0, 5).forEach(item => {
        tags.push(item.term);
    });
    return tags;
}

function parseResultToJSON(data) {
    console.log('Parsing result to JSON...');
    // console.log(data);
    const lines = data.split("\n");
    const recipes = [];
    let currentRecipe = {};

    for (const line of lines) {
        // Extract the title
        const titleMatch = line.match(/^\d+\.\s\*\*(.+?)\*\*/);
        if (titleMatch) {
            if (currentRecipe.title && currentRecipe.url) {
                recipes.push(currentRecipe);
            }
            currentRecipe = { title: titleMatch[1], url: null };
        }

        // Extract the URL
        const urlMatch = line.match(/\[.+?\]\((https?:\/\/[^\s]+)\)/);
        if (urlMatch) {
            currentRecipe.url = urlMatch[1];
        }
    }

    // Add the last recipe if it exists
    if (currentRecipe.title && currentRecipe.url) {
        recipes.push(currentRecipe);
    }
    console.log('Parsed recipes:', recipes);
    return recipes;
}

router.get('/all', async (req, res) =>{
    res.json(recipiesList)
})

// Default prompt route
// Custom prompt route
router.get('/', async (req, res) => {
    let { prompt } = req.query;
    if (!prompt) {
        prompt = "Provide a step-by-step recipe for making French Toast.";
    }

    try {
        const recipe = await handleGeneralPrompt(prompt);
        res.json({ recipe });
    } catch (error) {
        res.status(500).json({ error: error.prompt });
    }
});

router.get('/more', async (req, res) => {
    let { prompt } = req.query;
    console.log(prompt);
    if (!prompt) {
        prompt = "Provide a step-by-step recipe for making French Toast.";
    }
    try {
        const recipes = await handleMorePrompt(prompt);
        res.send(recipes)
        // res.json({ recipe });
    } catch (error) {
        res.status(500).json({ error: error.prompt });
    }
});


router.post('/ingredients', async (req, res) => {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "Ingredients must be provided as a non-empty array." });
    }

    try {
        const recipe = await handleKeywordsPrompt(ingredients);
        res.json({ recipe });
    } catch (error) {
        console.error("Error generating recipe:", error);
        res.status(500).json({ error: "Failed to generate recipe." });
    }
});


// Add a new recipe
router.post('/', async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: "Name and description are required." });
    }

    // Generate tags for the new recipe
    const allDescriptions = recipiesList.map(recipe => recipe.description);
    allDescriptions.push(description); // Add the new description to the corpus
    const tags = generateTagsUsingTFIDF(allDescriptions, description);

    // Create new recipe
    const newRecipe = {
        id: recipiesList.length + 1, // Auto-increment ID
        name,
        description,
        author: "anonymous", // Default author
        tags // Add generated tags
    };

    // Add to in-memory list
    recipiesList.push(newRecipe);

    // Write updated list to JSON file
    fs.writeFile(recipesFilePath, JSON.stringify(recipiesList, null, 2), (err) => {
        if (err) {
            console.error("Error writing to recipes.json:", err);
            return res.status(500).json({ error: "Failed to save recipe." });
        }
        res.status(201).json({ message: "Recipe added successfully.", recipe: newRecipe });
    });
});

router.get('/search', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Recipe name is required." });
    }

    const response = await handleItemsSearchPrompt(name);
    parseResultToJSON(response);
    res.send(response);
    // res.json({ data: JSON.stringify(response) });
    

    
});



router.post('/audio', async (req, res) => {
    try {
        // Get text input from request body
        let { text } = req.body;

        if (!text || text.trim() === "") {
            text = "Hey, sorry, some prompt"; // Default prompt
        }

        const audioStream = await getAudioStream(text);

        // Set headers to serve audio correctly
        res.setHeader('Content-Type', 'audio/mpeg');
        audioStream.pipe(res);
    } catch (error) {
        console.error("Error serving audio stream:", error);
        res.status(500).send("Failed to stream audio.");
    }
});




module.exports = router;
