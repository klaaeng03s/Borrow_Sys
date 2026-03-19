const express = require('express');
const { body } = require('express-validator');
const { getItems, getItemById, createItem, updateItem, deleteItem, getCategories } = require('../controllers/itemController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/', getItems);
router.get('/:id', getItemById);

router.post('/', authorizeAdmin, [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
], createItem);

router.put('/:id', authorizeAdmin, [
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
], updateItem);

router.delete('/:id', authorizeAdmin, deleteItem);

module.exports = router;
