import express from 'express';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import Application from '../models/Application.js';
import SavedJob from '../models/SavedJob.js';
import { protect as auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { search, location, type, companyId, page = 1, limit = 20 } = req.query;
    let query = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    if (companyId) {
      query.companyId = companyId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobs = await Job.find(query)
      .populate('companyId', 'name logo isVerified description industry headquarters size founded website')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs: jobs.map(job => ({
        id: job._id,
        ...job.toObject(),
        company: job.companyId || {
          id: null,
          name: 'Unknown Company',
          logo: null,
          isVerified: false
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get user's saved jobs
router.get('/saved', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const savedJobs = await SavedJob.find({ userId })
      .populate({
        path: 'jobId',
        populate: {
          path: 'companyId',
          select: 'name logo isVerified description industry headquarters size founded website'
        }
      })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SavedJob.countDocuments({ userId });

    // Filter out saved jobs where the job has been deleted
    const validSavedJobs = savedJobs.filter(savedJob => savedJob.jobId);

    res.json({
      savedJobs: validSavedJobs.map(savedJob => ({
        id: savedJob._id,
        savedAt: savedJob.savedAt,
        job: {
          id: savedJob.jobId._id,
          ...savedJob.jobId.toObject(),
          company: savedJob.jobId.companyId || {
            id: null,
            name: 'Unknown Company',
            logo: null,
            isVerified: false
          }
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
});

// Check if job is saved by user
router.get('/:id/saved', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const savedJob = await SavedJob.findOne({ userId, jobId });
    
    res.json({ saved: !!savedJob });
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
});

// Get job applications (for job owners)
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, check if user has applied
    if (userId) {
      const application = await Application.findOne({ 
        jobId: req.params.id, 
        userId: userId 
      });
      
      return res.json({ hasApplied: !!application });
    }

    // Otherwise, get all applications for the job (only for job owner)
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view applications' });
    }

    const applications = await Application.find({ jobId: req.params.id })
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(app => ({
        id: app._id,
        ...app.toObject(),
        user: app.userId
      }))
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Save/Unsave job
router.post('/:id/save', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already saved
    const existingSavedJob = await SavedJob.findOne({ userId, jobId });
    
    if (existingSavedJob) {
      // Unsave the job
      await SavedJob.findByIdAndDelete(existingSavedJob._id);
      return res.json({ message: 'Job removed from saved items', saved: false });
    } else {
      // Save the job
      const savedJob = new SavedJob({ userId, jobId });
      await savedJob.save();
      return res.json({ message: 'Job saved successfully', saved: true });
    }
  } catch (error) {
    console.error('Error saving/unsaving job:', error);
    res.status(500).json({ error: 'Failed to save/unsave job' });
  }
});

// Get job by ID (This should be last among the GET routes with :id parameter)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo isVerified description industry headquarters size founded website');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      job: {
        id: job._id,
        ...job.toObject(),
        company: job.companyId || {
          id: null,
          name: 'Unknown Company',
          logo: null,
          isVerified: false
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      type,
      experience,
      salary,
      companyId
    } = req.body;

    // Verify company exists and user is owner
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to post jobs for this company' });
    }

    const job = new Job({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      location,
      type,
      experience,
      salary,
      companyId,
      ownerId: req.user.id,
      status: 'active',
      applicants: 0
    });

    await job.save();

    const populatedJob = await Job.findById(job._id)
      .populate('companyId', 'name logo isVerified description industry headquarters size founded website');

    res.status(201).json({
      job: {
        id: populatedJob._id,
        ...populatedJob.toObject(),
        company: populatedJob.companyId
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is owner
    if (job.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('companyId', 'name logo isVerified description industry headquarters size founded website');

    res.json({
      job: {
        id: updatedJob._id,
        ...updatedJob.toObject(),
        company: updatedJob.companyId
      }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is owner
    if (job.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    // Delete all applications for this job
    await Application.deleteMany({ jobId: req.params.id });

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get job applications (for job owners)
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId is provided, check if user has applied
    if (userId) {
      const application = await Application.findOne({ 
        jobId: req.params.id, 
        userId: userId 
      });
      
      return res.json({ hasApplied: !!application });
    }

    // Otherwise, get all applications for the job (only for job owner)
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view applications' });
    }

    const applications = await Application.find({ jobId: req.params.id })
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(app => ({
        id: app._id,
        ...app.toObject(),
        user: app.userId
      }))
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

export default router;