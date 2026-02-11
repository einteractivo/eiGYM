const express = require('express');
const router = express.Router();
const gymClassController = require('../controllers/gymClassController');

router.get('/', gymClassController.getAllClasses);
router.post('/', gymClassController.createClass);
router.put('/:id', gymClassController.updateClass);
router.delete('/:id', gymClassController.deleteClass);

module.exports = router;
