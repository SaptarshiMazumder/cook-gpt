async function createIndex(client) {
    try {
      const response = await client.indices.create({
        index: 'test_index', // name your index
        body: {
          // Optionally define mappings (schema) here
          mappings: {
            properties: {
              title: { type: 'text' },
              content: { type: 'text' },
            },
          },
        },
      });
      console.log('Index created:', response);
    } catch (error) {
      if (error?.meta?.body?.error?.type === 'resource_already_exists_exception') {
        console.log('Index already exists. Skipping creation.');
      } else {
        console.error('Error creating index:', error);
      }
    }
  }

module.exports = { createIndex };