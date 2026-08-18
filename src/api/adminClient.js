const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AdminClient {
  async getDashboard() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load admin dashboard');
    return data.data;
  }

  async getReports(period = 'all') {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/reports?period=${period}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load reports');
    return data.data;
  }

  async exportReportsCsv(period = 'all') {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/admin/reports/export?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to export CSV');
    return response.text();
  }
}

export default new AdminClient();