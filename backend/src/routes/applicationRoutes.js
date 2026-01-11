import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Interview from '../models/Interview.js';
import InterviewQuestion from '../models/InterviewQuestion.js';
import { protect as auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get user's applications
router.get('/', auth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('jobId', 'title location type salary status')
      .populate('companyId', 'name logo isVerified')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(app => ({
        id: app._id,
        ...app.toObject(),
        job: app.jobId,
        company: app.companyId
      }))
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, companyId, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ error: 'Job is not accepting applications' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      jobId,
      userId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({
      jobId,
      companyId,
      userId: req.user.id,
      coverLetter: coverLetter || '',
      status: 'pending'
    });

    await application.save();

    // Increment job applicants count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

    const populatedApplication = await Application.findById(application._id)
      .populate('jobId', 'title location type salary status')
      .populate('companyId', 'name logo isVerified');

    res.status(201).json({
      application: {
        id: populatedApplication._id,
        ...populatedApplication.toObject(),
        job: populatedApplication.jobId,
        company: populatedApplication.companyId
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application status (for company owners)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const application = await Application.findById(req.params.id)
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user is the job owner
    if (application.jobId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    res.json({
      application: {
        id: application._id,
        ...application.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application (withdraw)
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user owns the application
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this application' });
    }

    // Decrement job applicants count
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicants: -1 } });

    await Application.findByIdAndDelete(req.params.id);

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Schedule interview for application
router.post('/:id/interview', auth, async (req, res) => {
  try {
    const { domain, roundName } = req.body;
    const applicationId = req.params.id;

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('companyId');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the application belongs to the user
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get questions for the domain
    const questionDocs = await InterviewQuestion.find({
      domain,
      isActive: true
    }).sort({ order: 1 }).limit(10);

    if (questionDocs.length === 0) {
      return res.status(404).json({ 
        error: 'No questions available for this domain. Please contact admin.' 
      });
    }

    const questions = questionDocs.map(q => ({ question: q.question }));

    // Create interview
    const interview = new Interview({
      user: req.user._id,
      company: application.companyId._id,
      job: application.jobId._id,
      jobApplication: application._id,
      domain,
      round: 1,
      roundName: roundName || 'Technical Round 1',
      questions,
      status: 'scheduled'
    });

    await interview.save();

    // Update application status
    application.status = 'interview-scheduled';
    await application.save();

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview: {
        id: interview._id,
        domain,
        roundName: interview.roundName,
        questionsCount: questions.length
      }
    });

  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

export default router;