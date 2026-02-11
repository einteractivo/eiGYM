const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { auth, authorize } = require('../middlewares/authMiddleware');

router.use(auth);

router.get('/', memberController.getAllMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', authorize(['ADMIN', 'RECEPTION']), memberController.createMember);
router.put('/:id', authorize(['ADMIN', 'RECEPTION']), memberController.updateMember);
router.delete('/:id', authorize('ADMIN'), memberController.deleteMember);

module.exports = router;
