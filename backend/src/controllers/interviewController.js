import Interview from '../models/Interview.js';
import InterviewQuestion from '../models/InterviewQuestion.js';

// Create new interview
export const createInterview = async (req, res) => {
  try {
    const { domain, companyId, jobId, applicationId } = req.body;
    
    // Get 10 random questions for the domain
    const questions = await InterviewQuestion.find({ 
      domain, 
      isActive: true 
    })
    .sort({ order: 1 })
    .limit(10);
    
    if (questions.length === 0) {
      return res.status(404).json({ 
        error: 'No questions available for this domain' 
      });
    }
    
    // Create interview
    const interview = new Interview({
      user: req.user._id,
      company: companyId,
      job: jobId,
      application: applicationId,
      domain,
      title: `${domain} Interview`,
      questions: questions.map(q => ({
        question: q.question
      })),
      status: 'scheduled'
    });
    
    await interview.save();
    
    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        domain: interview.domain,
        questionCount: interview.questions.length
      }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
};

// Get user's interviews
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .populate('company', 'companyName logo')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .select('-questions.answer -questions.videoUrl');
    
    res.json({ interviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
};

// Get single interview
export const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('company', 'companyName logo')
    .populate('job', 'title');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

// Start interview
export const startInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    if (interview.status !== 'scheduled') {
      return res.status(400).json({ error: 'Interview already started' });
    }
    
    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();
    
    res.json({ 
      success: true,
      interview: {
        id: interview._id,
        questions: interview.questions.map(q => q.question)
      }
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

// Submit answer
export const submitAnswer = async (req, res) => {
  try {
    const { questionIndex, answer, videoUrl, duration } = req.body;
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    if (questionIndex >= interview.questions.length) {
      return res.status(400).json({ error: 'Invalid question index' });
    }
    
    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].videoUrl = videoUrl;
    interview.questions[questionIndex].duration = duration;
    interview.questions[questionIndex].answeredAt = new Date();
    
    await interview.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

// Complete interview
export const completeInterview = async (req, res) => {
  try {
    const { totalDuration, videoUrl } = req.body;
    
    console.log('=== COMPLETE INTERVIEW ===');
    console.log('Interview ID:', req.params.id);
    console.log('Total Duration:', totalDuration);
    console.log('Video URL:', videoUrl);
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.totalDuration = totalDuration;
    
    // Save the full interview video URL
    if (videoUrl) {
      console.log('Saving video URL to fullRecordingUrl:', videoUrl);
      interview.fullRecordingUrl = videoUrl;
    } else {
      console.warn('No video URL provided!');
    }
    
    // Don't auto-generate AI score - let company review or implement real AI later
    // interview.aiScore and interview.aiAnalysis remain undefined
    
    await interview.save();
    
    res.json({ 
      success: true,
      interview: {
        id: interview._id
      }
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
};

// Delete interview
export const deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    if (interview.status === 'reviewed') {
      return res.status(400).json({ error: 'Cannot delete reviewed interview' });
    }
    
    await interview.deleteOne();
    
    res.json({ success: true, message: 'Interview deleted' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
};

export default {
  createInterview,
  getMyInterviews,
  getInterview,
  startInterview,
  submitAnswer,
  completeInterview,
  deleteInterview
};
