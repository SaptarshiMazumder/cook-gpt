// /routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const {
  pingSearch,
  getAllDocuments,
  createDocument,
} = require('../controllers/dataController');

router.get('/ping', pingSearch);
router.get('/all', getAllDocuments);
router.post('/create', createDocument);

module.exports = router;
