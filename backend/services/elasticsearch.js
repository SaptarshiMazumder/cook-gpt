const { Client } = require('@elastic/elasticsearch');
// const { createIndex } = require('../indexing/createIndex');
const nodeUrl = process.env.ELASTIC_URL || 'http://localhost:9200';

// Point to the elasticsearch service in the Docker network
const client = new Client({
    node: nodeUrl,
    sniffOnStart: false,
    sniffOnConnectionFault: false,
    sniffInterval: false,
  });

module.exports = client;
