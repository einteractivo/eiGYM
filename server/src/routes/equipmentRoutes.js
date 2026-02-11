const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', authorize(['ADMIN', 'SUPERADMIN']), equipmentController.createEquipment);
router.put('/:id', authorize(['ADMIN', 'SUPERADMIN']), equipmentController.updateEquipment);
router.delete('/:id', authorize(['ADMIN', 'SUPERADMIN']), equipmentController.deleteEquipment);

module.exports = router;
