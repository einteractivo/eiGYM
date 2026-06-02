const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { auth, authorize } = require('../middlewares/authMiddleware');

// ⚠️ PUBLIC: No requiere autenticación (logo, nombre del gym, etc.)
router.get('/public', settingController.getPublicSettings);

// Todas las demás rutas requieren token
router.use(auth);

router.get('/', authorize(['SUPERADMIN', 'ADMIN']), settingController.getSettings);
router.post('/', authorize(['SUPERADMIN', 'ADMIN']), settingController.updateSettings);
router.post('/logo', authorize(['SUPERADMIN', 'ADMIN']), settingController.uploadLogo);
router.get('/license', settingController.getLicenseStatus);

module.exports = router;
