import userScheduleService from '../services/userScheduleService.js';

const getSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const record = await userScheduleService.getSchedule(userId);
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Get user schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user schedule' });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ success: false, message: 'schedule must be a non-empty array' });
    }
    const record = await userScheduleService.upsertSchedule(userId, schedule);
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Update user schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user schedule' });
  }
};

export { getSchedule, updateSchedule };