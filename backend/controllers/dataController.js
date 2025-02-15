const client = require('../config/elasticsearch');
const elasticservice = require('../services/elasticservice');
const { handleKeywordPrompt, handleKeywordMorePrompt, handleKeywordsMorePrompt, handleKeywordsPrompt, handleGeneralPrompt } = require('../utils/conversation');
const { deduplicateBySourceKeepLatest } = require('../utils/dataUtils');

const DATA_INDEX_NAME = 'data'; // More generic index name

exports.healthCheck = async (req, res) => {
  try {
    await client.ping();
    return res.json({ message: 'Search service is up and running!' });
  } catch (error) {
    console.error('[dataController] healthCheck error:', error); // More generic controller name
    return res.status(500).json({ error: 'Search service is unavailable.' });
  }
};



exports.initIndex = async (req, res) => {
  try {
const exists = await client.indices.exists({ index: DATA_INDEX_NAME }); // Use generic index name
    if (!exists) {
        const response = await client.indices.create({
            index: DATA_INDEX_NAME,
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        ingredients: { type: 'text' },
                        description: { type: 'text' },
                        source_url: { type: 'keyword' },
                        tags: { type: 'keyword' },
                        created_at: { type: 'date' }
                    }
                }
            }
        });
console.log('Data index created:', response);
    } else {
        console.log('Data index already exists.');
    }
} catch (error) {
    console.error('Error creating data index:', error);
}
}

exports.testAPIWithPrompt = async (req, res) =>{
  let { prompt } = req.query;
    if (!prompt) {
        prompt = "Provide a step-by-step recipe for making French Toast.";
    }

    try {
        console.log("Test prompt ");
        const result = await handleGeneralPrompt(prompt);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.prompt });
    }
} 

exports.searchDocumentsByName = async (req, res) => {
    const { name } = req.query;
    try {
        const esResponse = await elasticservice.searchKeywordInES(name, 0, 10);
         // 2. If no hits, fallback
        if (!esResponse.hits.hits.length) {
            const openAIRes = await handleKeywordPrompt(name);
            await elasticservice.saveResponsesToElasticsearch(openAIRes);
            return res.send(openAIRes);
        }
        // 3) Filter out hits with _score < 1.0
        const filteredHits = esResponse.hits.hits
        .filter(hit => hit._score >= 0.2);
        console.log('Hits with good score:', filteredHits);
        return res.json({
            total: filteredHits.length,
            results: filteredHits.map(hit => ({
                id: hit._id,
                score: hit._score,
                ...hit._source
            }))
        });
    } catch (error) {
        console.error('[dataController] searchDocumentsByName error:', error);
        res.status(500).json({ error: 'Failed to search data' });
    }
};

exports.searchDocumentsByIngredients = async (req, res) => {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "Ingredients must be provided as a non-empty array." });
    }

    try {
         // 1) Call OpenAI API first to get AI-based recipes
        const openAIRes = await handleKeywordsPrompt(ingredients);
         // 2) (Optional) Save the AI results to Elasticsearch
        //    This ensures they're indexed for future queries
        await elasticservice.saveResponsesToElasticsearch(openAIRes);
        const esResponse = await elasticservice.searchKeywordsInES(ingredients);

        if (!esResponse.hits.hits.length) {
            return res.send(openAIRes);
        }
        const aires = JSON.parse(openAIRes);
        const esHits = esResponse.hits.hits.map((hit) => ({
            id: hit._id,
            score: hit._score,
            ...hit._source
          }));
        const combinedResults = [aires, ...esHits];
         // 4) Deduplicate, keeping newest item for each source
        const uniqueLatest = deduplicateBySourceKeepLatest(combinedResults);
        return res.json({
            total: uniqueLatest.length,
            results: uniqueLatest,
        });
    } catch (error) {
        console.error("Error generating data:", error);
        res.status(500).json({ error: "Failed to generate data." });
    }
};

exports.listAllDocumentsFromES = async (req, res) =>{
  const response = await elasticservice.getAllDocumentsFromES();
      return res.json({
          total: response.hits.total.value,
          data:  response.hits.hits.map(hit => ({ id: hit._id, ...hit._source }))
    
      }); 
};

exports.generateMoreDocuments = async (req, res) =>{
 let { prompt } = req.query;
    console.log(prompt);
    try{
        if (!prompt) {
            prompt = "Provide a step-by-step recipe for making French Toast.";
        }
        
        const response = await handleKeywordMorePrompt(prompt);
        // const parsedResponse = parseResultToJSON(response);
await elasticservice.saveResponsesToElasticsearch(response);

          return res.send(response);
      }
      catch(error){
          res.status(500).json({ error: error });
      }
};

exports.generateMoreDocumentsByKeywords = async (req, res)=>{
  const { ingredients } = req.body;
      // console.log(prompt);
      try{
          // if (!prompt) {
          //     prompt = "Provide a step-by-step recipe for making French Toast.";
          // }
          
          const response = await handleKeywordsMorePrompt(ingredients);

          return res.send(response);
      }
      catch(error){
          res.status(500).json({ error: error });
      }
};
