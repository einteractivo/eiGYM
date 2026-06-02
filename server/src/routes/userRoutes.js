const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', authorize(['ADMIN', 'SUPERADMIN']), userController.getAllUsers);
router.post('/', authorize(['ADMIN', 'SUPERADMIN']), userController.createUser);
router.put('/:id', authorize(['ADMIN', 'SUPERADMIN']), userController.updateUser);
router.delete('/:id', authorize(['ADMIN', 'SUPERADMIN']), userController.deleteUser);

module.exports = router;
