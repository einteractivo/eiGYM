const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlanById);
router.post('/', authorize('ADMIN'), planController.createPlan);
router.put('/:id', authorize('ADMIN'), planController.updatePlan);
router.delete('/:id', authorize('ADMIN'), planController.deletePlan);

module.exports = router;
