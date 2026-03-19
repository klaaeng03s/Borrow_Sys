const { validationResult } = require('express-validator');
const db = require('../config/db');

const getBorrows = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const isAdmin = req.user.role === 'admin';

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['1=1'];
    const params = [];

    if (!isAdmin) {
      conditions.push('br.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('br.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(u.name LIKE ? OR i.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // ✅ COUNT
    const countQuery = `
      SELECT COUNT(*) as total
      FROM borrow_records br
      JOIN users u ON br.user_id = u.id
      JOIN items i ON br.item_id = i.id
      WHERE ${whereClause}
    `;

    const [countRows] = await db.execute(countQuery, params);
    const total = countRows[0].total;

    // ✅ DATA (แก้ตรงนี้)
    const dataQuery = `
      SELECT br.*, u.name as borrower_name, u.email as borrower_email,
             i.name as item_name, i.category as item_category
      FROM borrow_records br
      JOIN users u ON br.user_id = u.id
      JOIN items i ON br.item_id = i.id
      WHERE ${whereClause}
      ORDER BY br.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [records] = await db.execute(dataQuery, params);

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });

  } catch (err) {
    console.error(err); // 🔥 debug
    next(err);
  }
};

const getBorrowById = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT br.*, u.name as borrower_name, u.email as borrower_email, i.name as item_name, i.category as item_category FROM borrow_records br JOIN users u ON br.user_id = u.id JOIN items i ON br.item_id = i.id WHERE br.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
    const record = rows[0];
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const borrowItem = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    await conn.beginTransaction();
    const { item_id, quantity_borrowed = 1, borrow_date, expected_return_date, notes } = req.body;
    const [itemRows] = await conn.execute('SELECT * FROM items WHERE id = ? FOR UPDATE', [item_id]);
    if (itemRows.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Item not found.' }); }
    const item = itemRows[0];
    if (item.available_quantity < quantity_borrowed) { await conn.rollback(); return res.status(400).json({ success: false, message: `Only ${item.available_quantity} unit(s) available.` }); }
    const newAvailable = item.available_quantity - quantity_borrowed;
    const newStatus = newAvailable === 0 ? 'borrowed' : 'available';
    await conn.execute('UPDATE items SET available_quantity = ?, status = ? WHERE id = ?', [newAvailable, newStatus, item_id]);
    const [result] = await conn.execute(
      `INSERT INTO borrow_records (user_id, item_id, quantity_borrowed, borrow_date, expected_return_date, status, notes) VALUES (?, ?, ?, ?, ?, 'borrowed', ?)`,
      [req.user.id, item_id, quantity_borrowed, borrow_date, expected_return_date || null, notes || null]
    );
    await conn.commit();
    const [newRecord] = await db.execute(`SELECT br.*, u.name as borrower_name, i.name as item_name FROM borrow_records br JOIN users u ON br.user_id = u.id JOIN items i ON br.item_id = i.id WHERE br.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, message: 'Item borrowed successfully.', data: newRecord[0] });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

const returnItem = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [recordRows] = await conn.execute("SELECT * FROM borrow_records WHERE id = ? AND status = 'borrowed' FOR UPDATE", [req.params.id]);
    if (recordRows.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Active borrow record not found.' }); }
    const record = recordRows[0];
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) { await conn.rollback(); return res.status(403).json({ success: false, message: 'Access denied.' }); }
    const returnDate = req.body.actual_return_date || new Date().toISOString().split('T')[0];
    await conn.execute("UPDATE borrow_records SET status = 'returned', actual_return_date = ? WHERE id = ?", [returnDate, req.params.id]);
    const [itemRows] = await conn.execute('SELECT * FROM items WHERE id = ? FOR UPDATE', [record.item_id]);
    const item = itemRows[0];
    await conn.execute("UPDATE items SET available_quantity = ?, status = 'available' WHERE id = ?", [item.available_quantity + record.quantity_borrowed, record.item_id]);
    await conn.commit();
    res.json({ success: true, message: 'Item returned successfully.' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

const updateBorrow = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM borrow_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
    const { expected_return_date, notes, status } = req.body;
    const record = rows[0];
    await db.execute('UPDATE borrow_records SET expected_return_date=?, notes=?, status=? WHERE id=?',
      [expected_return_date || record.expected_return_date, notes !== undefined ? notes : record.notes, status || record.status, req.params.id]);
    res.json({ success: true, message: 'Record updated successfully.' });
  } catch (err) { next(err); }
};

const deleteBorrow = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM borrow_records WHERE id = ? FOR UPDATE', [req.params.id]);
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Record not found.' }); }
    const record = rows[0];
    if (record.status === 'borrowed') {
      await conn.execute("UPDATE items SET available_quantity = available_quantity + ?, status = 'available' WHERE id = ?", [record.quantity_borrowed, record.item_id]);
    }
    await conn.execute('DELETE FROM borrow_records WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
};

const getStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const [[totalItems]] = await db.execute('SELECT COUNT(*) as count FROM items');
    const [[availableItems]] = await db.execute("SELECT COUNT(*) as count FROM items WHERE status = 'available'");
    let activeBorrows, returnedBorrows;
    if (isAdmin) {
      [[activeBorrows]] = await db.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'");
      [[returnedBorrows]] = await db.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'returned'");
    } else {
      [[activeBorrows]] = await db.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed' AND user_id = ?", [req.user.id]);
      [[returnedBorrows]] = await db.execute("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'returned' AND user_id = ?", [req.user.id]);
    }
    const [[totalUsers]] = isAdmin ? await db.execute('SELECT COUNT(*) as count FROM users') : [[{ count: 0 }]];
    res.json({ success: true, data: { totalItems: totalItems.count, availableItems: availableItems.count, activeBorrows: activeBorrows.count, returnedBorrows: returnedBorrows.count, totalUsers: totalUsers.count } });
  } catch (err) { next(err); }
};

module.exports = { getBorrows, getBorrowById, borrowItem, returnItem, updateBorrow, deleteBorrow, getStats };