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
    console.log(client);
    console.log('Entered here');
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
    return response;
    
  }

async function recipeExists(title, source) {
    const result = await client.search({
        index: INDEX_NAME,
        body: {
            query: {
                bool: {
                    must: [
                        { match: { title } },
                        { match: { source } }
                    ]
                }
            }
        }
    });
    return result.hits.total.value > 0;
}
async function saveResponsesToElasticsearch(recipes) {
// Using bulk insert for efficiency
    const bulkOps = [];

    for (const recipe of recipes) {
        // if (await recipeExists(recipe.title, recipe.source)) {
        //     continue; // Skip duplicates
        // }
        // Prepare each recipe for bulk
        bulkOps.push({ index: { _index: INDEX_NAME }});
        bulkOps.push(recipe);  // The recipe document
    }

    if (bulkOps.length === 0) {
        return [];
    }

    const bulkResponse = await client.bulk({ body: bulkOps });
    if (bulkResponse.errors) {
        console.error("Bulk insert encountered errors:", bulkResponse.items);
    }

    // Refresh index so docs are immediately searchable
    await client.indices.refresh({ index: INDEX_NAME });

    // Return the newly inserted docs, or you could return the full bulk response if you like
    return recipes;
}

router.get('/search', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ error: "Recipe name is required." });
    }

    try {
   
        const esResponse = await searchIndexInES(name, 0, 10);

         // 2. If no hits, fallback
        if (!esResponse.hits.hits.length) {
            console.log("no result found in es", esResponse);
            const openAIRes = await handleItemsSearchPrompt(name);
            const savedResults = await saveResponsesToElasticsearch(recipes);

            return res.json({ source: 'OpenAI', data: openAIRes });
        }

        const topScore = esResponse.hits.hits[0]._score;
        const threshold = 2.0; // tune this
        const topTitle = esResponse.hits.hits[0]._source.title || "";
        console.log("Found something in es: ",esResponse);

         // 4. If top result is below threshold or not relevant, fallback
        if (topScore < threshold || !topTitle.toLowerCase().includes(name.toLowerCase())) {
            const openAIRes = await handleItemsSearchPrompt(name);
            const savedResults = await saveResponsesToElasticsearch(openAIRes);

            return res.json({ source: 'OpenAI', data: openAIRes });
        }

        return res.json({
            source: 'Elasticsearch',
            total: esResponse.hits.total.value,
            results: esResponse.hits.hits.map(hit => ({
              id: hit._id,
              score: hit._score,
              ...hit._source
            }))
          });

        // // Check if Elasticsearch returned any results
        // if (esResponse && esResponse.hits && esResponse.hits.total.value > 0) {
        //     // Elasticsearch has results, return them
        //     return res.json({
        //         total: esResponse.hits.total.value,
        //         results: esResponse.hits.hits.map((hit) => ({
        //             id: hit._id,
        //             score: hit._score,
        //             source: hit._source,
        //             highlights: hit.highlight,
        //         })),
        //     });
        // }
        // If no data found, fetch from OpenAI API
        const response = await handleItemsSearchPrompt(name);

        // Optional: Parse and format the OpenAI response before sending
        // const parsedResponse = parseResponseToJSON(response);
        // return res.json({ data: parsedResponse });

        res.send(response);
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
