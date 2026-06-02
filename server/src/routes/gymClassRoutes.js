const express = require('express');
const router = express.Router();
const gymClassController = require('../controllers/gymClassController');
const { auth } = require('../middlewares/authMiddleware');

router.get('/', auth, gymClassController.getAllClasses);
router.post('/', auth, gymClassController.createClass);
router.put('/:id', auth, gymClassController.updateClass);
router.delete('/:id', auth, gymClassController.deleteClass);

module.exports = router;
