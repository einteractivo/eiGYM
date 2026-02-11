const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', authorize(['ADMIN', 'SUPERADMIN', 'RECEPTION']), saleController.getAllSales);
router.get('/:id', authorize(['ADMIN', 'SUPERADMIN', 'RECEPTION']), saleController.getSaleById);
router.post('/', authorize(['ADMIN', 'SUPERADMIN', 'RECEPTION']), saleController.createSale);

module.exports = router;
