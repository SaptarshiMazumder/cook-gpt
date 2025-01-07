const client = require('../utils/elastic');

async function createIndex() {
  try {
      const exists = await client.indices.exists({ index: 'recipes' });
      if (!exists) {
          const response = await client.indices.create({
              index: 'recipes',
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

module.exports = { createIndex };
