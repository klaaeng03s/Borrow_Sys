const express = require('express');
const { exportPDF } = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/pdf', exportPDF);

module.exports = router;