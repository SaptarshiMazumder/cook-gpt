const { Client } = require('@elastic/elasticsearch');
var elasticsearch = require('elasticsearch');

// const { createIndex } = require('../indexing/createIndex');
const nodeUrl = process.env.ELASTIC_URL || 'http://localhost:9200';
var bonsai_url = 'https://azjze7b2t1:sb8yqyaisn@elastic-test-3952124403.ap-southeast-2.bonsaisearch.net:443';
var client = new elasticsearch.Client({
                            host: bonsai_url,
                            log: 'trace'
                        });
// Point to the elasticsearch service in the Docker network
// const client = new Client({
//     node: nodeUrl,
//     sniffOnStart: false,
//     sniffOnConnectionFault: false,
//     sniffInterval: false,
//   });

module.exports = client;
