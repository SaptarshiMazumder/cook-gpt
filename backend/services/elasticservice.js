const client = require('../config/elasticsearch');

const INDEX_NAME = 'recipies';

async function searchKeywordInES (keyword, page, size) {

    const query = {
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: keyword,
                  fields: [
                    "title^3",
                    "tags^2",
                    "description",
                    "ingredients"
                  ],         
                  fuzziness: 1  ,
                  type: "best_fields",
                  operator: "AND"
                },
              },
              {
                prefix: {
                  title: {
                    value: keyword,
                    boost: 1,
                  },
                },
              }
            ],
            minimum_should_match: 1
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

async function searchKeywordsInES(keywords, page = 0, size = 10) {
    const query = {
        index: INDEX_NAME,
        body: {
            query: {
                bool: {
                    must: [
                        // Ensure all specified keywords are present
                        {
                            bool: {
                                must: keywords.map(keyword => ({
                                    match: {
                                        "ingredients": keyword,
                                    },
                                })),
                            },
                        },
                    ],
                    should: [
                        // Boost documents with exact matches for ingredients
                        {
                            terms: {
                                "ingredients.keyword": keywords,
                            },
                        },
                        // Match in other fields (e.g., title, description) with fuzziness
                        {
                            multi_match: {
                                query: keywords.join(" "),
                                fields: ["title^2", "description", "tags^2"],
                                fuzziness: "AUTO",
                                type: "most_fields",
                            },
                        },
                    ],
                    minimum_should_match: 1, // At least one should clause must match
                },
            },
            highlight: {
                fields: {
                    keywords: {},
                    title: {},
                    description: {},
                },
            },
            from: page * size,
            size,
        },
    };

    const response = await client.search(query);
    console.log('Ingredient-based search response:', response);
    return response;
}
async function saveResponsesToElasticsearch(resultsArray) {
    console.log('Recipes Array:', resultsArray);
    const jsonData = JSON.parse(resultsArray);
    const bulkOps = [];

    for (const recipe of jsonData.items) {
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

async function getAllDocumentsFromES() {
  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        match_all: {}
      },
      size: 1000 // Adjust the size as needed to retrieve all documents
    }
  });
  const total = response.hits.total.value;
  const recipes = response.hits.hits.map(hit => ({ id: hit._id, ...hit._source }));
  return response;
  
}

module.exports = { searchKeywordInES, searchKeywordsInES, saveResponsesToElasticsearch, getAllDocumentsFromES };
