import express from 'express';
import Interview from '../models/Interview.js';
import Notification from '../models/Notification.js';
import { protect, hr } from '../middlewares/authMiddleware.js';
import { getIO } from '../socket/index.js';

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

    // Create notification for the student
    let notificationMessage = '';
    let notificationData = {
      interviewId: interview._id,
      decision,
      rating,
      comments
    };

    if (decision === 'shortlisted') {
      notificationMessage = `Great news! You've been shortlisted for the interview. Check your interview details for the meeting information.`;
      notificationData.meetingLink = meetingLink;
      notificationData.meetingDate = meetingDate;
      notificationData.meetingTime = meetingTime;
    } else if (decision === 'rejected') {
      notificationMessage = `Thank you for your interview. Unfortunately, we won't be moving forward at this time. Keep applying and improving!`;
    } else if (decision === 'on-hold') {
      notificationMessage = `Your interview is currently on hold. We'll update you soon with next steps.`;
    }

    if (notificationMessage && interview.user) {
      // Create notification in database
      const notification = new Notification({
        user: interview.user._id,
        type: 'interview_decision',
        message: notificationMessage,
        relatedInterview: interview._id,
        data: notificationData
      });

      await notification.save();

      // Send real-time notification via Socket.IO for notification count update
      const io = getIO();
      if (io) {
        io.to(`user:${interview.user._id}`).emit('notification:update', {
          type: 'interview_decision',
          count: 1
        });
      }
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
