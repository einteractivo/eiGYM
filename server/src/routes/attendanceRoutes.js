const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', attendanceController.getAttendances);
router.get('/ranking', attendanceController.getRanking);
router.get('/by-class', attendanceController.getAttendanceByClass);
router.post('/register', attendanceController.registerAttendance);

module.exports = router;
