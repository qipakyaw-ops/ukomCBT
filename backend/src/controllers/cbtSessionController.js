import cbtSessionService from '../services/cbtSessionService.js';

const createSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const sessionData = req.body;
    console.log('DEBUG_CREATE_SESSION: Received body:', JSON.stringify(sessionData));
    
    // Ensure essential fields exist, or handle defaults
    const newSession = await cbtSessionService.createSession(userId, {
        type: sessionData.type || 'practice',
        status: sessionData.status || 'in_progress',
        config: sessionData.config || {},
        questionIds: sessionData.questionIds || [],
        answers: sessionData.answers || {},
        flaggedQuestionIds: sessionData.flaggedQuestionIds || [],
        currentQuestionIndex: sessionData.currentQuestionIndex || 0,
        startTime: new Date(sessionData.startTime || new Date()),
    });
    console.log('DEBUG_CREATE_SESSION: Created session:', newSession.id);

    res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
};

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { result, ...updates } = req.body;

    const updatedSession = await cbtSessionService.updateSession(id, userId, updates);
    res.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Failed to update session' });
  }
};

const getSubmittedSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await cbtSessionService.getSubmittedSessionsByUser(userId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get submitted sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sessions' });
  }
};

const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const session = await cbtSessionService.getSessionById(id, userId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, message: 'Failed to get session' });
  }
};

export { createSession, updateSession, getSession, getSubmittedSessions };
