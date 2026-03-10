// routes/scanRoutes.js
const express = require('express');
const router = express.Router();
const { performScan } = require('../controllers/scanController');

// POST request to trigger a scan
router.post('/', performScan);

module.exports = router;