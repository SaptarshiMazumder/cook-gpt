const client = require('../utils/elastic');
// Example index name
const INDEX_NAME = 'test_index';

exports.pingSearch = async (req, res) => {
  try {
    await client.ping();
    return res.json({ message: 'Search service is up and running!' });
  } catch (error) {
    console.error('[searchController] pingSearch error:', error);
    return res.status(500).json({ error: 'Search service is unavailable.' });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      query: { match_all: {} },
      size: 100,
    });
    return res.json({
      docs: response.hits.hits.map(hit => hit._source),
      total: response.hits.total.value,
    });
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.json({ docs: [], total: 0, message: 'Index not found.' });
    }
    console.error('[searchController] getAllDocuments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const doc = req.body;
    const response = await client.index({
      index: INDEX_NAME,
      document: doc,
    });
    await client.indices.refresh({ index: INDEX_NAME });
    return res.json({ message: 'Document inserted.', response });
  } catch (error) {
    console.error('[searchController] createDocument error:', error);
    return res.status(500).json({ error: 'Failed to insert document.' });
  }
};
