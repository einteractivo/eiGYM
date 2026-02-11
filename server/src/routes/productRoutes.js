const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', authorize(['ADMIN', 'SUPERADMIN']), productController.createProduct);
router.put('/:id', authorize(['ADMIN', 'SUPERADMIN']), productController.updateProduct);
router.delete('/:id', authorize(['ADMIN', 'SUPERADMIN']), productController.deleteProduct);

module.exports = router;
