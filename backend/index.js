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

// const openaiApiKey = process.env.OPENAI_API_KEY;

const PORT = 4000;

const elasticClient = require('./utils/elastic');


app.get('/', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});



// Elasticsearch Index Setup
const initializeElasticSearch = async () => {
    try {
        // Check if the index exists
        const exists = await elasticClient.indices.exists({ index: 'recipes' });

        if (!exists) {
            console.log('Creating the "recipes" index...');
            await elasticClient.indices.create({
                index: 'recipes',
                body: {
                    mappings: {
                        properties: {
                            title: { type: 'text' },
                            tags: { type: 'text' },
                            description: { type: 'text' },
                            ingredients: { type: 'text' },
                        },
                    },
                },
            });

            console.log('"recipes" index created successfully.');

            // Add sample data
            const recipes = [
                {
                    id: 1,
                    title: 'Beef Wellington',
                    tags: ['beef', 'holiday', 'pastry'],
                    description: 'A classic beef dish wrapped in puff pastry.',
                    ingredients: ['beef tenderloin', 'puff pastry', 'mushrooms', 'eggs'],
                },
                {
                    id: 2,
                    title: 'Beef Stew',
                    tags: ['beef', 'stew', 'hearty meals'],
                    description: 'A rich and flavorful beef stew with carrots and potatoes.',
                    ingredients: ['beef', 'carrots', 'potatoes', 'onion'],
                },
            ];

            console.log('Indexing sample recipes...');
            for (const recipe of recipes) {
                await elasticClient.index({
                    index: 'recipes',
                    id: recipe.id,
                    document: recipe,
                });
            }

            console.log('Sample recipes indexed successfully.');
        } else {
            console.log('The "recipes" index already exists. Skipping initialization.');
        }
    } catch (error) {
        console.error('Error initializing Elasticsearch:', error);
    }
};


app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // await testElasticConnection();
    // await initializeElasticSearch(); // Initialize Elasticsearch when server starts

});
