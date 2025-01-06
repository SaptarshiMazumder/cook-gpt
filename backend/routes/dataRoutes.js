// /routes/searchRoutes.js

const express = require('express');
const router = express.Router();
const {
  pingSearch,
  getAllDocuments,
  insertDocument,
} = require('../controllers/dataController');

router.get('/ping', pingSearch);
router.get('/all', getAllDocuments);
router.post('/', insertDocument);

module.exports = router;
