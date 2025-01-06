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
async function testConnection() {
    try {
        const info = await client.info();
        console.log('Elasticsearch Info:', info);
    } catch (error) {
        console.error('Elasticsearch connection failed:', error);
    }
}


testConnection()
    .then(res => console.log('Test Connection Result:', res))
    .catch(error => console.error('Error testing connection:', error));

const INDEX_NAME = 'test_index'; // change as needed


// async function viewAllDocs() {
//     try {
//         const response = await client.search({
//         index: INDEX_NAME,
//         query: { match_all: {} },
//         size: 100, // up to 100 docs
//         });
//         console.log('All docs:', response);
//         console.log(`Documents in "${INDEX_NAME}":`, response.hits.hits);
//     } catch (error) {
//         // If index doesn’t exist yet, you’ll see a 404
//         if (error.meta && error.meta.statusCode === 404) {
//         console.log(`Index "${INDEX_NAME}" not found (no docs yet).`);
//         } else {
//         console.error('Error viewing all docs:', error);
//         }
//     }
// }
// async function insertDoc() {
//     try {
//       const doc = {
//         title: 'Beef Wellington',
//         description: 'A classic beef dish wrapped in puff pastry.',
//         tags: ['beef', 'holiday', 'pastry'],
//       };
  
//       const response = await client.index({
//         index: INDEX_NAME,
//         document: doc,
//       });
//       console.log('Document inserted:', response);
//     } catch (error) {
//       console.error('Error inserting document:', error);
//     }
//   }

// (async () => {
//     try {
//     // 1. Show all docs (should be empty or show existing docs)
//     console.log(`\n1) Viewing all docs in "${INDEX_NAME}"...`);
//     await viewAllDocs();

//     // // 2. Insert a new document
//     // console.log(`\n2) Inserting a document into "${INDEX_NAME}"...`);
//     // await insertDoc();

//     // // Refresh the index so the doc is immediately searchable
//     // await client.indices.refresh({ index: INDEX_NAME });

//     // // 3. Show all docs again (should now include the new doc)
//     // console.log(`\n3) Viewing all docs in "${INDEX_NAME}" after insertion...`);
//     // await viewAllDocs();

      
//     } catch (error) {
//       console.error('Error in main flow:', error);
//     }
//   })();
      


console.log('Elasticsearch client created!');
// console.log(client);

module.exports = client;
