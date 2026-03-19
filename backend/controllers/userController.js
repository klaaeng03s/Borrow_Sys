const db = require('../config/db');

// GET /api/users (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // ✅ COUNT (ไม่ใช้ replace)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const total = countRows[0].total;

    // ✅ DATA (แก้ LIMIT/OFFSET)
    const dataQuery = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [users] = await db.execute(dataQuery, params);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error(err); // debug
    next(err);
  }
};

// DELETE /api/users/:id (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [rows] = await db.execute('SELECT id FROM users WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'User deleted.' });

  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, deleteUser };