const express = require('express');
const { body } = require('express-validator');
const { getBorrows, getBorrowById, borrowItem, returnItem, updateBorrow, deleteBorrow, getStats } = require('../controllers/borrowController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/' , getBorrows);
router.get('/:id', getBorrowById);

router.post('/', [
  body('item_id').isInt().withMessage('Valid item ID required'),
  body('quantity_borrowed').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('borrow_date').isDate().withMessage('Valid borrow date required'),
  body('expected_return_date').optional().isDate(),
], borrowItem);

router.put('/:id/return', returnItem);
router.put('/:id', authorizeAdmin, updateBorrow);
router.delete('/:id', authorizeAdmin, deleteBorrow);

module.exports = router;
