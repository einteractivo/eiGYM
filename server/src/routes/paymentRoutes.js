const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', authorize(['ADMIN', 'RECEPTION']), paymentController.getAllPayments);
router.post('/', authorize(['ADMIN', 'RECEPTION']), paymentController.createPayment);
router.put('/:id/void', authorize(['ADMIN', 'RECEPTION']), paymentController.voidPayment);
router.delete('/:id', authorize(['ADMIN', 'RECEPTION']), paymentController.deletePayment);

module.exports = router;
