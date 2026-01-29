import Interview from '../models/Interview.js';
import InterviewQuestion from '../models/InterviewQuestion.js';

// Create new interview
export const createInterview = async (req, res) => {
  try {
    const { domain, companyId, jobId, applicationId } = req.body;
    
    // Get all questions for the domain
    const allQuestions = await InterviewQuestion.find({ 
      domain, 
      isActive: true 
    });
    
    if (allQuestions.length === 0) {
      return res.status(404).json({ 
        error: 'No questions available for this domain' 
      });
    }
    
    // Shuffle and select 10 random questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(10, shuffledQuestions.length));
    
    // Create interview with shuffled questions
    const interview = new Interview({
      user: req.user._id,
      company: companyId,
      job: jobId,
      application: applicationId,
      domain,
      title: `${domain} Interview`,
      questions: selectedQuestions.map(q => ({
        question: q.question,
        category: q.category,
        difficulty: q.difficulty
      })),
      status: 'scheduled'
    });
    
    await interview.save();
    
    console.log(`✅ Created interview with ${selectedQuestions.length} shuffled questions for domain: ${domain}`);
    
    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        domain: interview.domain,
        questionCount: interview.questions.length,
        questions: interview.questions.map((q, index) => ({
          index: index + 1,
          category: q.category,
          difficulty: q.difficulty
        }))
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
    const { totalDuration, videoUrl, securityViolations, violationCount, forcedSubmission, submissionReason } = req.body;
    
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
    
    if (videoUrl) {
      interview.fullRecordingUrl = videoUrl;
    }
    
    if (securityViolations && Array.isArray(securityViolations)) {
      interview.securityViolations = securityViolations;
    }
    
    if (typeof violationCount === 'number') {
      interview.violationCount = violationCount;
    }
    
    if (typeof forcedSubmission === 'boolean') {
      interview.forcedSubmission = forcedSubmission;
    }
    
    if (submissionReason) {
      interview.submissionReason = submissionReason;
    }
    
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
