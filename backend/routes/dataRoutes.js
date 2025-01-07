// /routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const {
  pingSearch,
  getAllDocuments,
  createDocument,
  searchIndex,
} = require('../controllers/dataController');

router.get('/ping', pingSearch);
router.get('/all', getAllDocuments);
router.post('/create', createDocument);
router.post('/search', searchIndex);

module.exports = router;
