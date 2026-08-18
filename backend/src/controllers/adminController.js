import adminService from '../services/adminService.js';

const getDashboard = async (req, res) => {
  try {
    const [stats, recentStudents, categoryDistribution] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentStudents(5),
      adminService.getCategoryDistribution(),
    ]);
    res.json({ success: true, data: { ...stats, recentStudents, categoryDistribution } });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin dashboard data' });
  }
};

export { getDashboard };