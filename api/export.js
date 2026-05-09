import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { supabase } from './db.js';
import { authenticateToken, requireAdmin } from './middleware.js';

const router = express.Router();

// Export exam results to Excel
router.get('/exam/:examId/excel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;

    // Get exam info
    const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
    if (!exam) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    // Get sessions with user info
    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*, users(nama, username, kelas, no_peserta)')
      .eq('exam_id', examId)
      .eq('is_submitted', true)
      .order('finished_at', { ascending: true });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal E-Ujian';
    workbook.created = new Date();

    // Sheet 1: Summary
    const sheet = workbook.addWorksheet('Hasil Ujian');

    // Header info
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = `HASIL UJIAN: ${exam.title}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:H2');
    sheet.getCell('A2').value = `Mata Pelajaran: ${exam.mata_pelajaran || '-'} | Durasi: ${exam.durasi} menit | Passing Grade: ${exam.passing_grade}%`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.addRow([]);

    // Column headers
    const headerRow = sheet.addRow([
      'No', 'Nama', 'Username', 'Kelas', 'No. Peserta',
      'Skor', 'Persentase', 'Status', 'Durasi (menit)', 'Pelanggaran', 'Waktu Submit'
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // Data rows
    (sessions || []).forEach((s, i) => {
      const row = sheet.addRow([
        i + 1,
        s.users?.nama || '-',
        s.users?.username || '-',
        s.users?.kelas || '-',
        s.users?.no_peserta || '-',
        `${s.total_score}/${s.max_score}`,
        `${s.percentage}%`,
        s.is_passed ? 'LULUS' : 'TIDAK LULUS',
        Math.round((s.time_spent_seconds || 0) / 60),
        s.violation_count || 0,
        s.finished_at ? new Date(s.finished_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'
      ]);

      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // Color code pass/fail
      const statusCell = row.getCell(8);
      if (s.is_passed) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
      }
    });

    // Auto-width columns
    sheet.columns.forEach(col => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: true }, cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    // Summary row
    sheet.addRow([]);
    const totalSessions = sessions?.length || 0;
    const passedCount = (sessions || []).filter(s => s.is_passed).length;
    const avgPercentage = totalSessions > 0
      ? ((sessions || []).reduce((sum, s) => sum + Number(s.percentage), 0) / totalSessions).toFixed(1)
      : 0;

    sheet.addRow(['', 'Total Peserta:', totalSessions, '', 'Lulus:', passedCount, '', `Rata-rata: ${avgPercentage}%`]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Hasil_Ujian_${exam.title.replace(/\s+/g, '_')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export exam results to PDF
router.get('/exam/:examId/pdf', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { examId } = req.params;

    const { data: exam } = await supabase.from('exams').select('*').eq('id', examId).single();
    if (!exam) return res.status(404).json({ error: 'Ujian tidak ditemukan' });

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*, users(nama, username, kelas, no_peserta)')
      .eq('exam_id', examId)
      .eq('is_submitted', true)
      .order('percentage', { ascending: false });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Hasil_Ujian_${exam.title.replace(/\s+/g, '_')}.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN HASIL UJIAN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).text(exam.title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text(`Mata Pelajaran: ${exam.mata_pelajaran || '-'} | Durasi: ${exam.durasi} menit | Passing Grade: ${exam.passing_grade}%`, { align: 'center' });
    doc.moveDown(0.3);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const startX = 40;
    let y = doc.y;
    const colWidths = [30, 140, 80, 60, 60, 70, 60, 70, 50];
    const headers = ['No', 'Nama', 'Username', 'Kelas', 'Skor', 'Persentase', 'Status', 'Durasi', 'Pelanggaran'];

    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 20).fill('#1e3a5f');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(h, x + 4, y + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    y += 20;

    // Data
    (sessions || []).forEach((s, i) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
      }

      const bgColor = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).fill(bgColor);

      const vals = [
        String(i + 1),
        s.users?.nama || '-',
        s.users?.username || '-',
        s.users?.kelas || '-',
        `${s.total_score}/${s.max_score}`,
        `${s.percentage}%`,
        s.is_passed ? 'LULUS' : 'GAGAL',
        `${Math.round((s.time_spent_seconds || 0) / 60)} mnt`,
        String(s.violation_count || 0)
      ];

      x = startX;
      vals.forEach((v, j) => {
        doc.fillColor(j === 6 ? (s.is_passed ? '#059669' : '#dc2626') : '#1f2937')
          .fontSize(7).font('Helvetica')
          .text(v, x + 4, y + 5, { width: colWidths[j] - 8 });
        x += colWidths[j];
      });
      y += 18;
    });

    // Summary
    y += 20;
    const total = sessions?.length || 0;
    const passed = (sessions || []).filter(s => s.is_passed).length;
    const avg = total > 0 ? ((sessions || []).reduce((sum, s) => sum + Number(s.percentage), 0) / total).toFixed(1) : 0;

    doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold');
    doc.text(`Total Peserta: ${total} | Lulus: ${passed} | Tidak Lulus: ${total - passed} | Rata-rata: ${avg}%`, startX, y);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
