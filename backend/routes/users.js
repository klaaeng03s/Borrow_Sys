const express = require('express');
const { getUsers, deleteUser } = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorizeAdmin);
router.get('/', getUsers);
router.delete('/:id', deleteUser);

module.exports = router;
