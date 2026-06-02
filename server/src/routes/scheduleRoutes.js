const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { auth } = require('../middlewares/authMiddleware');

router.get('/', auth, scheduleController.getAllSchedules);
router.get('/trainers', auth, scheduleController.getTrainers);
router.post('/', auth, scheduleController.createSchedule);
router.put('/:id', auth, scheduleController.updateSchedule);
router.delete('/:id', auth, scheduleController.deleteSchedule);

module.exports = router;
