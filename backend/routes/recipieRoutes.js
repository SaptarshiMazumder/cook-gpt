const express = require('express');
const { 
    getAudioStream, 
    
 } = require('../utils/conversation');

const router = express.Router();
const path = require('path');
const fs = require('fs'); // Import the fs module

const recipiesList = require('../data/recipies.json')
const recipesFilePath = path.join(__dirname, '../data/recipies.json');


const natural = require("natural");
const dataController = require('../controllers/dataController'); // Updated import

// Helper functions
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
// ping the elastic client
router.get('/ping', dataController.healthCheck);

//Test route
router.get('/all', async (req, res) =>{
    res.json(recipiesList)
})

router.get('/all-indexed', dataController.listAllDocumentsFromES); // Updated function name
router.get('/', dataController.testAPIWithPrompt);

router.get('/search', dataController.searchDocumentsByName); // Updated function name
router.post('/keywords', dataController.searchDocumentsByIngredients); // Updated function name
router.get('/more-search', dataController.generateMoreDocuments); // Updated function name
router.post('/more-keywords', dataController.generateMoreDocumentsByKeywords); // Updated function name


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



// Obsolete
// router.post('/search/item', async(req, res)=>{

//     const { title, url } = req.body;
//     // Validate input
//     if (!title || !url) {
//         return res.status(400).json({ error: "Both title and url are required." });
//     }

//     const response = await handleSpecificQueryPrompt(title, url);
//     res.send(response);
// })


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
