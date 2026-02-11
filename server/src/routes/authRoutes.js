const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/authMiddleware');

router.post('/register', auth, authorize('ADMIN'), authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
