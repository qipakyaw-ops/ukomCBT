const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class StudyScheduleClient {
  async getSchedule() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/users/me/schedule`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get study schedule');
    return data.data;
  }

  async updateSchedule(schedule) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/users/me/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ schedule }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update study schedule');
    return data.data;
  }
}

export default new StudyScheduleClient();