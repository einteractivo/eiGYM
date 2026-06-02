
const express = require('express');
const router = express.Router();
const trainerAttendanceController = require('../controllers/trainerAttendanceController');
const { auth } = require('../middlewares/authMiddleware');

router.post('/register', auth, trainerAttendanceController.registerTrainerAttendance);
router.get('/history', auth, trainerAttendanceController.getTrainerAttendances);
router.get('/stats', auth, trainerAttendanceController.getTrainerStats);

module.exports = router;
