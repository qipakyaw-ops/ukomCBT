const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class CbtBookmarkClient {
  async getBookmarks() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-bookmarks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get bookmarks');
    return data.data;
  }

  async addBookmark(questionId) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId }),
    });
    if (!response.ok) throw new Error('Failed to add bookmark');
  }

  async removeBookmark(questionId) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/cbt-bookmarks/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to remove bookmark');
  }
}

export default new CbtBookmarkClient();
