const { validationResult } = require('express-validator');
const db = require('../config/db');

// GET /api/items
const getItems = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;

    // ✅ ป้องกัน NaN
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // ✅ Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await db.execute(countQuery, params);
    const total = countRows[0].total;

    // ✅ Pagination (ไม่ใช้ ?)
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // 🔍 debug (ลบออกทีหลังได้)
    // console.log(query);
    // console.log(params);

    const [items] = await db.execute(query, params);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id
const getItemById = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/items (Admin only)
const createItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, category, quantity, description } = req.body;

    const qty = parseInt(quantity) || 0;
    const status = qty > 0 ? 'available' : 'unavailable';

    const [result] = await db.execute(
      'INSERT INTO items (name, category, quantity, available_quantity, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, qty, qty, description || '', status]
    );

    const [newItem] = await db.execute('SELECT * FROM items WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Item created successfully.',
      data: newItem[0],
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/items/:id (Admin only)
const updateItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, category, quantity, description, status } = req.body;

    const [existing] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const item = existing[0];

    const borrowed = item.quantity - item.available_quantity;
    const newQuantity = quantity !== undefined ? parseInt(quantity) : item.quantity;
    const newAvailable = Math.max(0, newQuantity - borrowed);
    const newStatus = newAvailable > 0 ? 'available' : 'unavailable';

    await db.execute(
      'UPDATE items SET name=?, category=?, quantity=?, available_quantity=?, description=?, status=? WHERE id=?',
      [
        name || item.name,
        category || item.category,
        newQuantity,
        newAvailable,
        description !== undefined ? description : item.description,
        status || newStatus,
        req.params.id,
      ]
    );

    const [updated] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Item updated successfully.',
      data: updated[0],
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id (Admin only)
const deleteItem = async (req, res, next) => {
  try {
    const [existing] = await db.execute('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // เช็คว่ามีคนยืมอยู่มั้ย
    const [activeBorrows] = await db.execute(
      "SELECT id FROM borrow_records WHERE item_id = ? AND status = 'borrowed'",
      [req.params.id]
    );

    if (activeBorrows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with active borrows.',
      });
    }

    await db.execute('DELETE FROM items WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/items/categories
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT DISTINCT category FROM items ORDER BY category'
    );

    res.json({
      success: true,
      data: rows.map((r) => r.category),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getCategories,
};