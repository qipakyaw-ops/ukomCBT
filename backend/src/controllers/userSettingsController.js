import userSettingsService from '../services/userSettingsService.js';

const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await userSettingsService.getSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionGoal, scoreGoal } = req.body;

    const sessionGoalNum = Number(sessionGoal);
    const scoreGoalNum = Number(scoreGoal);

    if (!Number.isInteger(sessionGoalNum) || sessionGoalNum < 1) {
      return res.status(400).json({ success: false, message: 'sessionGoal must be a positive integer' });
    }
    if (!Number.isInteger(scoreGoalNum) || scoreGoalNum < 1) {
      return res.status(400).json({ success: false, message: 'scoreGoal must be a positive integer' });
    }

    const settings = await userSettingsService.upsertSettings(userId, sessionGoalNum, scoreGoalNum);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user settings' });
  }
};

export { getSettings, updateSettings };