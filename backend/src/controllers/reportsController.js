import reportsService from '../services/reportsService.js';

const getReport = async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const data = await reportsService.getReport(period);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

const exportCsv = async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const rows = await reportsService.getStudentExport(period);
    const header = ['Student', 'Email', 'Type', 'SubmittedAt', 'Score', 'Status'];
    const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header.join(','), ...rows.map((r) => header.map((h) => escapeCsv(r[h])).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan_performa_student.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

export { getReport, exportCsv };