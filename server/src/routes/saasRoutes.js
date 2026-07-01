const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saasController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);
router.use(authorize('SUPERADMIN'));

router.get('/gyms', saasController.getGyms);
router.post('/gyms', saasController.createGym);
router.put('/gyms/:id', saasController.updateGym);
router.delete('/gyms/:id', saasController.deleteGym);
router.post('/users', saasController.createGymUser);
router.put('/users/:id', saasController.updateGymUser);
router.delete('/users/:id', saasController.deleteGymUser);

// Registrations
router.get('/registrations', saasController.getRegistrations);
router.put('/registrations/:id/status', saasController.updateRegistrationStatus);
router.delete('/registrations/:id', saasController.deleteRegistration);

// SaaS Users (Global)
router.get('/saas-users', saasController.getSaasUsers);
router.post('/saas-users', saasController.createSaasUser);
router.put('/saas-users/:id', saasController.updateSaasUser);

// SaaS Settings (Global)
router.get('/settings', saasController.getSaasSettings);
router.post('/settings', saasController.updateSaasSettings);

module.exports = router;
