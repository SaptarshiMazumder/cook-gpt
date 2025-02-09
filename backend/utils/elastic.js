// const { Client } = require('@elastic/elasticsearch');
// // const { createIndex } = require('../indexing/createIndex');
// const nodeUrl = process.env.ELASTIC_URL || 'http://localhost:9200';

// // Point to the elasticsearch service in the Docker network
// const client = new Client({
//     node: nodeUrl,
//     sniffOnStart: false,
//     sniffOnConnectionFault: false,
//     sniffInterval: false,
//   });
const client = require('../services/elasticsearch');
async function testConnection() {
    console.log('Testing Elasticsearch connection');
    try {
        const info = await client.info();
        // console.log('Elasticsearch Info:', info);
    } catch (error) {
        console.error('Elasticsearch connection failed:', error);
    }
}


testConnection()
    .then(res => console.log('Test Connection Result:', res))
    .catch(error => console.error('Error testing connection:', error));

const INDEX_NAME = 'test_index'; // change as needed

   


console.log('Elasticsearch client created!');
// console.log(client);

// module.exports = client;
