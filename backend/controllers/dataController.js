const client = require('../utils/elastic');
// Example index name
const INDEX_NAME = 'recipies';

exports.pingSearch = async (req, res) => {
  try {
    await client.ping();
    return res.json({ message: 'Search service is up and running!' });
  } catch (error) {
    console.error('[searchController] pingSearch error:', error);
    return res.status(500).json({ error: 'Search service is unavailable.' });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      query: { match_all: {} },
      size: 100,
    });
    return res.json({
      docs: response.hits.hits.map(hit => hit._source),
      total: response.hits.total.value,
    });
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.json({ docs: [], total: 0, message: 'Index not found.' });
    }
    console.error('[searchController] getAllDocuments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
};

// exports.createDocument = async (req, res) => {
//   try {
//     const doc = req.body;
//     const response = await client.index({
//       index: INDEX_NAME,
//       document: doc,
//     });
//     await client.indices.refresh({ index: INDEX_NAME });
//     return res.json({ message: 'Document inserted.', response });
//   } catch (error) {
//     console.error('[searchController] createDocument error:', error);
//     return res.status(500).json({ error: 'Failed to insert document.' });
//   }
// };

exports.createDocument = async (req, res) => {
  try {
    const { title, ingredients, description, source_url, tags } = req.body;

    // Validate required fields
    if (!title || !ingredients || !description || !source_url) {
      return res.status(400).json({
        error: 'Missing required fields: title, ingredients, description, source_url.',
      });
    }

    // Construct the document
    const recipeDoc = {
      title,
      ingredients,
      description,
      source_url,
      tags: tags || [], // Optional tags
      created_at: new Date(), // Timestamp
    };

    // Index the document
    const response = await client.index({
      index: INDEX_NAME, // Ensure INDEX_NAME matches your recipes index
      document: recipeDoc,
    });

    // Refresh the index to make the document immediately searchable
    await client.indices.refresh({ index: INDEX_NAME });

    return res.json({ message: 'Recipe inserted successfully.', response });
  } catch (error) {
    console.error('[recipeController] createRecipe error:', error);
    return res.status(500).json({ error: 'Failed to insert recipe.' });
  }
};

exports.searchIndex = async (req, res) => {
  try {
    const { keyword, page = 0, size = 10 } = req.body; // Keyword, pagination params

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: 'A valid keyword must be provided.' });
    }

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

    return res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlights: hit.highlight,
      })),
    });
  } catch (error) {
    console.error('[searchController] searchRecipes error:', error);
    return res.status(500).json({ error: 'Failed to search recipes.' });
  }
};



exports.createIndex = async (req, res) => {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
        const response = await client.indices.create({
            index: INDEX_NAME,
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        ingredients: { type: 'text' },
                        description: { type: 'text' },
                        source_url: { type: 'keyword' },
                        tags: { type: 'keyword' },
                        created_at: { type: 'date' },
                    },
                },
            },
        });
        console.log('Recipe index created:', response);
    } else {
        console.log('Recipe index already exists.');
    }
} catch (error) {
    console.error('Error creating recipe index:', error);
}
}
