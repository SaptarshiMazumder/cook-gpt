const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

const router = express.Router();

// Google login route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route
router.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        // Generate JWT after successful Google login
        const token = jwt.sign(
            { id: req.user.id, email: req.user.emails[0].value },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    }
);

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:4000/auth/oauth2callback`
);

// Route: Generate Google Login URL
router.get('/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
    });
    console.log(authUrl);
    res.json({ url: authUrl });
});

router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing' });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const appJWT = jwt.sign(
            { id: payload.sub, email: payload.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send JavaScript to post the message
        res.send(`
            <script>
                window.opener.postMessage({ token: '${appJWT}' }, 'http://localhost:3000');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Error during OAuth2 callback:', error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});


router.post('/validate-token', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
});

// Protect a test route
router.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Access Denied');

    const token = authHeader.split(' ')[1];
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ message: 'Protected data', user: verified });
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
});

module.exports = router;
