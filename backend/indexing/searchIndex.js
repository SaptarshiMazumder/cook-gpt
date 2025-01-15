const client = require('../services/elasticsearch');
const INDEX_NAME = 'recipes'; // Elasticsearch index name


// Search in Elasticsearch
async function searchIndexInElasticSearch (keyword, page, size) {
    // console.log('client:', client);
    // return;
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

module.exports = {searchIndexInElasticSearch};