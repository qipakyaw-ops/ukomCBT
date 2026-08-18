const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class UserSettingsClient {
  async getSettings() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/users/me/settings`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get user settings');
    return data.data;
  }

  async updateSettings(sessionGoal, scoreGoal) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/users/me/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionGoal, scoreGoal }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update user settings');
    return data.data;
  }
}

export default new UserSettingsClient();