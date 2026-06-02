
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middlewares/authMiddleware');

router.get('/detailed', auth, reportController.getDetailedReport);

module.exports = router;
