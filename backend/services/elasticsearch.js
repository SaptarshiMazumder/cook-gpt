// const { Client } = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');

// const { createIndex } = require('../indexing/createIndex');
const nodeUrl = process.env.ELASTIC_URL || 'http://localhost:9200';
const nodeURLOpenSearch = 'https://search-cookgpt-es-acksfhjn5tlhno2ijxtxhm6exi.aos.us-east-1.on.aws/';

// Point to the elasticsearch service in the Docker network
// const client = new Client({
//     node: nodeUrl,
//     sniffOnStart: false,
//     sniffOnConnectionFault: false,
//     sniffInterval: false,
//   });

  // const client = new Client({
  //   node: nodeURLOpenSearch,
  //   sniffOnStart: false,
  //   sniffOnConnectionFault: false,
  //   sniffInterval: false,
  // });

  const client = new Client({
  node: nodeURLOpenSearch,
  auth: {
    username: 'ackermanhisashi', 
    password: 'Cristiano@2021', 
  },
  sniffOnStart: false,
  sniffOnConnectionFault: false,
  sniffInterval: false,
});


module.exports = client;
