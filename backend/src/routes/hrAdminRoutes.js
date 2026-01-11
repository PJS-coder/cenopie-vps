import express from 'express';
import Interview from '../models/Interview.js';
import { protect, hr } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all interviews
router.get('/interviews', protect, hr, async (req, res) => {
  try {
    const { decision } = req.query;
    
    // Show both completed and reviewed interviews
    const query = { status: { $in: ['completed', 'reviewed'] } };
    if (decision) query['hrReview.decision'] = decision;
    
    const interviews = await Interview.find(query)
      .populate('user', 'name email profilePicture headline')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    
    // Filter out interviews where user data is null (user might have been deleted)
    const validInterviews = interviews.filter(interview => interview.user !== null);
    
    res.json({ interviews: validInterviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get interview statistics
router.get('/interviews/stats', protect, hr, async (req, res) => {
  try {
    // Include both completed and reviewed interviews in stats
    const matchQuery = { status: { $in: ['completed', 'reviewed'] } };
    
    const stats = await Interview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$hrReview.decision',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusStats = await Interview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({ 
      decisionStats: stats,
      statusStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get single interview
router.get('/interviews/:id', protect, hr, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Allow viewing both completed and reviewed interviews
    const interview = await Interview.findOne({
      _id: id,
      status: { $in: ['completed', 'reviewed'] }
    })
    .populate('user', 'name email profilePicture headline bio skills')
    .populate('job', 'title description');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Review interview
router.post('/interviews/:id/review', protect, hr, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, rating, comments, meetingLink, meetingDate, meetingTime } = req.body;
    
    // Validate meeting details for shortlisted candidates
    if (decision === 'shortlisted') {
      if (!meetingLink) {
        return res.status(400).json({ error: 'Meeting link is required for shortlisted candidates' });
      }
      if (!meetingDate) {
        return res.status(400).json({ error: 'Meeting date is required for shortlisted candidates' });
      }
      if (!meetingTime) {
        return res.status(400).json({ error: 'Meeting time is required for shortlisted candidates' });
      }
    }
    
    // Allow reviewing both completed and already reviewed interviews (for updates)
    const interview = await Interview.findOne({
      _id: id,
      status: { $in: ['completed', 'reviewed'] }
    }).populate('user', 'name email');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    interview.hrReview = {
      reviewedBy: null, // HR admin (not a specific company)
      reviewedAt: new Date(),
      decision,
      rating,
      comments,
      meetingLink: decision === 'shortlisted' ? meetingLink : undefined,
      meetingDate: decision === 'shortlisted' ? meetingDate : undefined,
      meetingTime: decision === 'shortlisted' ? meetingTime : undefined
    };
    interview.status = 'reviewed';
    
    await interview.save();
    
    // TODO: Send email notification to candidate with meeting details if shortlisted
    if (decision === 'shortlisted' && meetingLink && interview.user) {
      console.log(`📧 TODO: Send email to ${interview.user.email}`);
      console.log(`   Subject: Congratulations! You've been shortlisted for HR Interview`);
      console.log(`   Meeting Link: ${meetingLink}`);
      console.log(`   Date: ${meetingDate}`);
      console.log(`   Time: ${meetingTime}`);
      // Implement email sending here
    }
    
    res.json({ 
      success: true,
      message: 'Interview reviewed successfully'
    });
  } catch (error) {
    console.error('Review interview error:', error);
    res.status(500).json({ error: 'Failed to review interview' });
  }
});

export default router;
