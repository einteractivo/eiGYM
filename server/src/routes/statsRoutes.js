const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/dashboard', authorize('ADMIN'), statsController.getDashboardStats);
router.get('/daily-report', authorize('ADMIN', 'RECEPTION'), statsController.getDailyReport);

module.exports = router;
