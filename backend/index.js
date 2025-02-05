const express = require('express');
const cors = require('cors');
const OpenAI = require("openai");
const compromise = require('compromise');
const routes = require('./routes/routes');
const encryptionRoutes = require('./routes/encryption');
const recipieRoutes = require('./routes/recipieRoutes');
const { testEncryption } = require('./controllers/encryption/encryptionController');
// const passport = require('passport');
const authRoutes = require('./routes/authRoutes'); // Import routes
const dataRoutes = require('./routes/dataRoutes');
const healthRoutes = require('./routes/healthRoutes');
const elasticClient = require('./utils/elastic');
const { createIndex } = require('./controllers/dataController');
require('dotenv').config();
// require('./utils/passport'); // Initialize Passport




const app = express();
app.use(express.json());
app.use(cors());
// app.use(passport.initialize());

app.use('/', routes);
app.use('/auth', authRoutes);
app.use('/api', encryptionRoutes);
app.use('/recipies', recipieRoutes);
app.use('/index', dataRoutes);
app.use('/health', healthRoutes);
// const openaiApiKey = process.env.OPENAI_API_KEY;

const PORT = 4000;




app.get('/', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});


createIndex();
// Elasticsearch Index Setup


app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // await testElasticConnection();
    // await initializeElasticSearch(); // Initialize Elasticsearch when server starts

});
