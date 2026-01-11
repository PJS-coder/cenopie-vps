import Interview from '../models/Interview.js';

// Get all interviews (test rounds - not company-specific)
export const getCompanyInterviews = async (req, res) => {
  try {
    const { status, decision } = req.query;
    
    // Show all completed test interviews (not linked to any specific company)
    const query = { 
      status: 'completed'  // Only show completed interviews
    };
    
    if (decision) query['hrReview.decision'] = decision;
    
    const interviews = await Interview.find(query)
      .populate('user', 'name email profilePicture headline')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    
    // Filter out interviews where user data is null (user might have been deleted)
    const validInterviews = interviews.filter(interview => interview.user !== null);
    
    res.json({ interviews: validInterviews });
  } catch (error) {
    console.error('Get company interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
};

// Get interview statistics
export const getInterviewStats = async (req, res) => {
  try {
    // Stats for all completed test interviews
    const matchQuery = { status: 'completed' };
    
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
};

// Get single interview details
export const getInterviewDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Any company can view any completed test interview
    const interview = await Interview.findOne({
      _id: id,
      status: 'completed'
    })
    .populate('user', 'name email profilePicture headline bio skills')
    .populate('job', 'title description')
    .populate('application');
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({ interview });
  } catch (error) {
    console.error('Get interview details error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

// Review interview
export const reviewInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, rating, comments } = req.body;
    const companyId = req.company._id;
    
    // Any company can review any completed test interview
    const interview = await Interview.findOne({
      _id: id,
      status: 'completed'
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    interview.hrReview = {
      reviewedBy: companyId,
      reviewedAt: new Date(),
      decision,
      rating,
      comments
    };
    interview.status = 'reviewed';
    
    await interview.save();
    
    // Update application status if linked
    if (interview.application) {
      const Application = (await import('../models/Application.js')).default;
      await Application.findByIdAndUpdate(interview.application, {
        status: decision === 'shortlisted' ? 'shortlisted' : 
                decision === 'rejected' ? 'rejected' : 'reviewed'
      });
    }
    
    res.json({ 
      success: true,
      message: 'Interview reviewed successfully'
    });
  } catch (error) {
    console.error('Review interview error:', error);
    res.status(500).json({ error: 'Failed to review interview' });
  }
};

export default {
  getCompanyInterviews,
  getInterviewStats,
  getInterviewDetails,
  reviewInterview
};
