import Job from '../models/Job.js';
import Company from '../models/Company.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Get all jobs with company data
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, location, type, companyId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build match conditions
    const matchConditions = {
      status: 'active'
    };
    
    // Add company ID filter if provided
    if (companyId) {
      matchConditions.companyId = companyId;
    }
    
    // Add search filters if provided
    if (search) {
      matchConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (location) {
      matchConditions.location = { $regex: location, $options: 'i' };
    }
    
    if (type) {
      matchConditions.type = type;
    }
    
    // Use aggregation pipeline for efficient join and pagination
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'companies',
          let: { companyId: '$companyId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$id', '$$companyId']
                }
              }
            }
          ],
          as: 'companyData'
        }
      },
      {
        $match: {
          'companyData.0': { $exists: true } // Only jobs with valid company data
        }
      },
      {
        $addFields: {
          companyData: { $arrayElemAt: ['$companyData', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];
    
    // Execute aggregation
    const [jobs, totalCount] = await Promise.all([
      Job.aggregate(pipeline),
      Job.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'companies',
            let: { companyId: '$companyId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$companyId']
                  }
                }
              }
            ],
            as: 'companyData'
          }
        },
        {
          $match: {
            'companyData.0': { $exists: true }
          }
        },
        { $count: 'total' }
      ])
    ]);
    
    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalJobs: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs', 
      details: error.message 
    });
  }
};

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find the job and populate company data
    const job = await Job.aggregate([
      { $match: { id: jobId } },
      {
        $lookup: {
          from: 'companies',
          let: { companyId: '$companyId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$id', '$$companyId']
                }
              }
            }
          ],
          as: 'companyData'
        }
      },
      {
        $addFields: {
          companyData: { $arrayElemAt: ['$companyData', 0] }
        }
      }
    ]);
    
    if (!job || job.length === 0) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    res.json(job[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job'
    });
  }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    
    // Generate ID if not provided
    if (!jobData.id) {
      jobData.id = uuidv4();
    }
    
    // Validate required fields
    const requiredFields = ['companyId', 'title', 'department', 'location', 'type', 'description', 'requirements', 'experience', 'benefits', 'companyDescription'];
    const missingFields = requiredFields.filter(field => !jobData[field] || (Array.isArray(jobData[field]) && jobData[field].length === 0));
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Check if company exists
    const company = await Company.findOne({ id: jobData.companyId });
    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }
    
    // Verify that the authenticated user owns this company
    if (company.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'You can only create jobs for your own company'
      });
    }
    
    // Set userId from authenticated user
    jobData.userId = req.user._id;
    
    // Set default values
    jobData.status = 'active';
    jobData.applicants = 0;
    jobData.views = 0;
    jobData.postedAt = new Date().toISOString();
    
    // Create new job
    const job = new Job(jobData);
    await job.save();
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Job with this ID already exists'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create job'
    });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find and delete the job
    const deletedJob = await Job.findOneAndDelete({ id: jobId });
    
    if (!deletedJob) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    res.json({
      message: 'Job deleted successfully',
      job: deletedJob
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      error: 'Failed to delete job'
    });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateData = req.body;
    
    // Find and update the job
    const updatedJob = await Job.findOneAndUpdate(
      { id: jobId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedJob) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      error: 'Failed to update job'
    });
  }
};

export { getJobs, getJobById, createJob, deleteJob, updateJob };