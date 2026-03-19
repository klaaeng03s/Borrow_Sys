const PDFDocument = require('pdfkit');
const db = require('../config/db');

const exportPDF = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { status, from, to } = req.query;

    let query = `
      SELECT br.*, u.name as borrower_name, u.email as borrower_email,
              i.name as item_name, i.category as item_category
      FROM borrows_records br
      JOIN users u ON br.user_id = u.id
      JOIN items i ON br.item_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin) {
      query += ' AND br.user_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND br.status = ?';
      params.push(status);
    }

    if (from) {
      query += ' AND br.borrow_date >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND br.borrow_date <= ?';
      params.push(to);
    }
    
    query += ' ORDER BY br.created_at DESC';

    const [records] = await db.execute(query, params);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=borrow_report.pdf');
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e');
    doc.fillColor('#e8c547').fontSize(22).font('Helvetica-Bold').text('BORROWING & RETURN REPORT', 50, 28);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, 50, 56);

    doc.moveDown(3);
    doc.fillColor('#1a1a2e');

    const borrowed = records.filter(r => r.status === 'borrowed').length;
    const returned = records.filter(r => r.status === 'returned').length;

    doc.fontSize(12).font('Helvetica-Bold').text('Summary', 50, 100);
    doc.moveTo(50, 115).lineTo(545, 115).stroke('#e8c547');
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(`Total Records: ${records.length}   |   Active Borrows: ${borrowed}   |   Returned: ${returned}`, 50, 120);

    // ---- Table Header ----
    const tableTop = 150;
    const cols = [50, 80, 200, 300, 390, 470];
    const headers = ['#', 'Item', 'Borrower', 'Borrow Date', 'Return Date', 'Status'];

    doc.rect(50, tableTop, 495, 22).fill('#1a1a2e');
    doc.fillColor('#e8c547').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, cols[i] + 3, tableTop + 7));

    // ---- Rows ----
    doc.fillColor('#1a1a2e').font('Helvetica').fontSize(9);
    let y = tableTop + 22;

    records.forEach((r, idx) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      const bg = idx % 2 === 0 ? '#f8f8f0' : '#ffffff';
      doc.rect(50, y, 495, 20).fill(bg);

      const statusColor = r.status === 'returned' ? '#27ae60' : r.status === 'overdue' ? '#e74c3c' : '#e67e22';
      doc.fillColor('#333333');
      doc.text(String(idx + 1), cols[0] + 3, y + 6);
      doc.text(r.item_name?.substring(0, 15) || '', cols[1] + 3, y + 6);
      doc.text(r.borrower_name?.substring(0, 15) || '', cols[2] + 3, y + 6);
      doc.text(r.borrow_date ? new Date(r.borrow_date).toLocaleDateString() : '-', cols[3] + 3, y + 6);
      doc.text(r.actual_return_date ? new Date(r.actual_return_date).toLocaleDateString() : (r.expected_return_date ? new Date(r.expected_return_date).toLocaleDateString() : '-'), cols[4] + 3, y + 6);
      doc.fillColor(statusColor).text(r.status.toUpperCase(), cols[5] + 3, y + 6);
      doc.fillColor('#333333');
      y += 20;
    });

    // ---- Footer ----
    doc.moveTo(50, y + 10).lineTo(545, y + 10).stroke('#e8c547');
    doc.fillColor('#888888').fontSize(8)
      .text('Borrowing & Return System — Confidential Report', 50, y + 15, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { exportPDF };
