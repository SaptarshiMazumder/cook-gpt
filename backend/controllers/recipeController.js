const elasticservice = require('../services/elasticservice');
const { handleItemsSearchPrompt } = require('../utils/conversation');
const { deduplicateBySourceKeepLatest } = require('../utils/recipeUtils');

exports.searchRecipes = async (req, res) => {
    const { name } = req.query;
    try {
        const esResponse = await elasticservice.searchKeywordInES(name, 0, 10);
         // 2. If no hits, fallback
        if (!esResponse.hits.hits.length) {
            const openAIRes = await handleItemsSearchPrompt(name);
            await elasticservice.saveResponsesToElasticsearch(openAIRes); // Use elasticservice here
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
        console.error('Error in recipeController.searchRecipes:', error);
        res.status(500).json({ error: 'Failed to search recipes' });
    }
};

exports.searchRecipesByKeywords = async (req, res) => {
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
        console.error("Error generating recipe:", error);
        res.status(500).json({ error: "Failed to generate recipe." });
    }
};
