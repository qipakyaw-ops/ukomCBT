import cbtBookmarkService from '../services/cbtBookmarkService.js';

const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookmarks = await cbtBookmarkService.getBookmarks(userId);
    res.json({ success: true, data: bookmarks.map(b => b.questionId) });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookmarks' });
  }
};

const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.body;
    await cbtBookmarkService.addBookmark(userId, questionId);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ success: false, message: 'Failed to add bookmark' });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.params;
    await cbtBookmarkService.removeBookmark(userId, questionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove bookmark' });
  }
};

export { getBookmarks, addBookmark, removeBookmark };
