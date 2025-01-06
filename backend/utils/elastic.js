const { Client } = require('@elastic/elasticsearch');

// Point to the elasticsearch service in the Docker network
const client = new Client({
    node: 'http://localhost:9200', 
});

client.ping({}, (error) => {
    if (error) {
        console.error('Elasticsearch cluster is down!', error);
    } else {
        console.log('Elasticsearch is connected!');
    }
});

console.log('Elasticsearch client created!');
console.log(client);
module.exports = client;
