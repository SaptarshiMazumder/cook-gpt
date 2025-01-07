const client = require('../utils/elastic');
const INDEX_NAME = 'recipes'; // Elasticsearch index name


// Search in Elasticsearch
async function searchIndex(keyword, page, size) {
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
    return {
        total: response.hits.total.value,
        results: response.hits.hits.map((hit) => ({
            id: hit._id,
            score: hit._score,
            source: hit._source,
            highlights: hit.highlight,
        })),
    };
}

module.exports = {searchIndex};