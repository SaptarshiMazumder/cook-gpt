const client = require('../utils/elastic');

async function createIndex() {
    try {
        const response = await client.indices.create({
            index: 'recipes',
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        tags: { type: 'text' },
                        description: { type: 'text' },
                        ingredients: { type: 'text' },
                    },
                },
            },
        });
        console.log('Index created:', response);
    } catch (error) {
        if (error.meta.body.error.type === 'resource_already_exists_exception') {
            console.log('Index already exists');
        } else {
            console.error('Error creating index:', error);
        }
    }
}
export default createIndex;