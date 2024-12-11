const express = require('express');
const cors = require('cors');
const OpenAI = require("openai");
const compromise = require('compromise');
const routes = require('./routes/routes');
const encryptionRoutes = require('./routes/encryption');
const { testEncryption } = require('./controllers/encryption/encryptionController');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes'); // Import routes
require('dotenv').config();
require('./utils/passport'); // Initialize Passport




const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use('/', routes);
app.use('/auth', authRoutes);
app.use('/api', encryptionRoutes);
// const openaiApiKey = process.env.OPENAI_API_KEY;

const PORT = 4000;


app.get('/', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
