const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class CbtSessionClient {
  async getSubmittedSessions() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get sessions');
    return data.data;
  }

  async createSession(sessionData) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create session');
    return data.data;
  }

  async updateSession(id, updates) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update session');
    return data.data;
  }

  async getSession(id) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-sessions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get session');
    return data.data;
  }
}

export default new CbtSessionClient();
