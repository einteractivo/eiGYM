const express = require('express');
const router = express.Router();
const cashFlowController = require('../controllers/cashFlowController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.post('/open', authorize(['ADMIN', 'RECEPTION']), cashFlowController.openSession);
router.get('/current', cashFlowController.getCurrentSession);
router.put('/close/:id', authorize(['ADMIN', 'RECEPTION']), cashFlowController.closeSession);
router.post('/transaction', cashFlowController.addTransaction);
router.put('/transaction/void/:id', authorize(['ADMIN']), cashFlowController.voidTransaction);
router.delete('/transaction/:id', authorize(['ADMIN']), cashFlowController.deleteTransaction);
router.get('/transactions', cashFlowController.getAllTransactions);
router.get('/history', authorize(['ADMIN']), cashFlowController.getHistory);
router.get('/:id', cashFlowController.getSessionDetails);

module.exports = router;
