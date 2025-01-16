const express = require('express');
const { 
    handleGeneralPrompt, 
    getAudioStream, 
    handleKeywordsPrompt,
    handleItemsSearchPrompt,
    handleMorePrompt,
    handleSpecificQueryPrompt,
 } = require('../utils/conversation');

const router = express.Router();
const path = require('path');
const fs = require('fs'); // Import the fs module

const recipiesList = require('../data/recipies.json')
const recipesFilePath = path.join(__dirname, '../data/recipies.json');


const natural = require("natural");
const client = require('../services/elasticsearch');
const { searchIndex } = require('../controllers/dataController');
const { searchIndexInElasticSearch } = require('../indexing/searchIndex');

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
    const lines = data.split("\n");
    const recipes = [];
    let currentRecipe = {};

    for (const line of lines) {
        // Extract the index and title
        const titleMatch = line.match(/^(\d+)\.\s\*\*(.+?)\*\*/);
        if (titleMatch) {
            // Push the current recipe if it is complete
            if (currentRecipe.title && currentRecipe.url) {
                recipes.push(currentRecipe);
            }
            // Start a new recipe with index and title
            currentRecipe = { 
                index: parseInt(titleMatch[1], 10), 
                title: titleMatch[2], 
                url: null 
            };
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

function parseResponseToJSON(rawText) {
    const recipes = [];
    const recipeSections = rawText.split("###").filter(section => section.trim() !== ""); // Split by recipe headings

    recipeSections.forEach(section => {
        const titleMatch = section.match(/^\s*\d+\.\s*(.+)$/m);
        const sourceMatch = section.match(/- \*\*Source\*\*:\s*\[(.+)\]\((.+)\)/);
        const ingredientsMatch = section.match(/- \*\*Ingredients\*\*:\n([\s\S]*?)(?=\n- \*\*Instructions\*\*:)/);
        const instructionsMatch = section.match(/- \*\*Instructions\*\*:\n([\s\S]*?)(?=\n- \*\*Tips\*\*:|\n- \*\*Source\*\*:)/);
        const tipsMatch = section.match(/- \*\*Tips\*\*:\s*(.+)/);

        recipes.push({
            title: titleMatch ? titleMatch[1].trim() : null,
            source: sourceMatch ? sourceMatch[1].trim() : null,
            link: sourceMatch ? sourceMatch[2].trim() : null,
            ingredients: ingredientsMatch 
                ? ingredientsMatch[1].trim().split("\n").map(item => item.replace(/^\s*-\s*/, '').trim()) 
                : [],
            instructions: instructionsMatch 
                ? instructionsMatch[1].trim().split("\n").map(item => item.replace(/^\s*\d+\.\s*/, '').trim()) 
                : [],
            tips: tipsMatch ? tipsMatch[1].trim() : null,
        });
    });

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
        const response = await handleMorePrompt(prompt);
        // const parsedResponse = parseResultToJSON(response);

        res.send(response)
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

const INDEX_NAME = 'recipies';

async function searchIndexInES (keyword, page, size) {

    const query = {
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: keyword,
                  fields: ["title^3", "description", "ingredients"],
                  fuzziness: "AUTO",
                  type: "most_fields",
                },
              },
              {
                prefix: {
                  title: {
                    value: keyword,
                    boost: 2,
                  },
                },
              },
            ],
          },
        },
        highlight: {
          fields: {
            title: {},
            description: {},
          },
        },
        from: page * size,
        size,
      },
    };
  
    const response = await client.search(query);
    console.log('This is response from elastic search', response);
    return response;
    
  }


async function saveResponsesToElasticsearch(recipesArray) {
    const jsonData = JSON.parse(recipesArray);
    const bulkOps = [];

    for (const recipe of jsonData) {
      // OPTIONAL: Validate required fields
      console.log(recipe);
      console.log('--------------------');
      if (
        !recipe.title ||
        !recipe.ingredients ||
        !recipe.instructions ||
        !recipe.source
      ) {
        console.warn(`Skipping recipe due to missing required fields: ${recipe.title || 'No title'}`);
        continue;
      }
  
      // Build the recipe doc (can add timestamps if needed)
      const recipeDoc = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        preparationTime: recipe.preparationTime || "",
        difficulty: recipe.difficulty || "",
        tips: recipe.tips || "",
        source: recipe.source,
        link: recipe.link || "",
        tags: recipe.tags || [],
        created_at: new Date().toISOString()
      };
  
      // Bulk indexing format: action line, then document line
      bulkOps.push({ index: { _index: INDEX_NAME } });
      bulkOps.push(recipeDoc);
    }
  
    if (bulkOps.length === 0) {
      console.log("No valid recipes to index.");
      return;
    }
  
    try {
      // Perform bulk insert
      const bulkResponse = await client.bulk({ body: bulkOps });
  
      // Check for errors in bulk response
      if (bulkResponse.errors) {
        // Inspect and log each item to see which documents failed
        console.error("Bulk insert encountered errors:", bulkResponse.items);
      } else {
        console.log("Bulk insert successful!");
      }
  
      // Refresh the index so new docs are searchable immediately
      await client.indices.refresh({ index: INDEX_NAME });
      console.log("Index refreshed. Documents are searchable now.");
    } catch (error) {
      console.error("Error performing bulk insert:", error);
    }
  
}

router.get('/search', async (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: "Recipe name is required." });
    }
    try {
        const esResponse = await searchIndexInES(name, 0, 10);
        // const esResponse = await searchIndexInElasticSearch(client, name, 0, 10);

         // 2. If no hits, fallback
        if (!esResponse.hits.hits.length) {
            // console.log("no result found in es", esResponse);
            const openAIRes = await handleItemsSearchPrompt(name);
            await saveResponsesToElasticsearch(openAIRes);
            return res.send(openAIRes);
            // return res.json({ source: 'OpenAI', data: openAIRes });
        }

        // 3) Check top 1 and top 2 results for relevance
        const hits = esResponse.hits.hits;
        console.log('Found hits in ES: \n', hits);

        const topHit = hits[0];
        const topScore = topHit._score || 0;
        const topTitle = (topHit._source.title || "").toLowerCase();

        // Basic word-by-word check to ensure all user query words appear in topTitle
        // e.g., "egg toast" -> ["egg", "toast"]
        const queryWords = name.toLowerCase().split(/\s+/).filter(Boolean);
        const allWordsInTitle = queryWords.every(word => topTitle.includes(word));
        
        // This is our "good enough" condition:
        // - topScore >= 0.5 (could be 0.8, 1.0, etc.)
        // - topTitle includes all user query words
        // const isTopHitGoodEnough = (topScore >= 0.5) && allWordsInTitle;
        const isTopHitGoodEnough = allWordsInTitle;

        
        // If no data found, fetch from OpenAI API
        if (!isTopHitGoodEnough) {
            console.log("Falling back to OpenAI. Score or title check failed.", {
                topScore,
                allWordsInTitle
              });        
            // Fallback to OpenAI
            const openAIRes = await handleItemsSearchPrompt(name);
            await saveResponsesToElasticsearch(openAIRes);
        
            return res.send(openAIRes);
        }

        return res.json({
            total: esResponse.hits.total.value,
            results: hits.map(hit => ({
                id: hit._id,
                score: hit._score,
                ...hit._source
            }))
            });

    } catch (error) {
        console.error('Error in /search:', error);
        res.status(500).json({ error: 'Failed to process search request.' });
    }
});


router.post('/search/item', async(req, res)=>{

    const { title, url } = req.body;
    // Validate input
    if (!title || !url) {
        return res.status(400).json({ error: "Both title and url are required." });
    }

    const response = await handleSpecificQueryPrompt(title, url);
    res.send(response);
})


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
