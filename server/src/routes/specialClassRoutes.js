const express = require('express');
const router = express.Router();
const specialClassController = require('../controllers/specialClassController');
const { auth } = require('../middlewares/authMiddleware');

router.get('/', auth, specialClassController.getAllSpecialClasses);
router.post('/', auth, specialClassController.createSpecialClass);
router.put('/:id', auth, specialClassController.updateSpecialClass);
router.delete('/:id', auth, specialClassController.deleteSpecialClass);

// Enrollments
router.post('/:id/enroll', auth, specialClassController.enrollMember);
router.put('/:id/enroll/:registrationId/cancel', auth, specialClassController.cancelEnrollment);

module.exports = router;
