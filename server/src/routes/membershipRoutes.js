const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.post('/', authorize(['ADMIN', 'RECEPTION']), membershipController.createMembership);
router.get('/:id', authorize(['ADMIN', 'RECEPTION']), membershipController.getMembershipById);
router.post('/:id/cancel', authorize(['ADMIN', 'RECEPTION']), membershipController.cancelMembership);

module.exports = router;
