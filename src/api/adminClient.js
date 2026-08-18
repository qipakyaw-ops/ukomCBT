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
}

export default new AdminClient();