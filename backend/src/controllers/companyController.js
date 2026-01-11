import Company from '../models/Company.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// @desc    Get all companies or filter by userId
// @route   GET /api/companies
// @access  Public
const getCompanies = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20, search, industry, size } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (userId) {
      // Validate that userId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          error: 'Invalid user ID format'
        });
      }
      try {
        query.userId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid user ID format'
        });
      }
    }
    
    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }
    
    if (size) {
      query.size = size;
    }
    
    // Execute queries in parallel for better performance
    let companies = [];
    let totalCount = 0;
    
    try {
      [companies, totalCount] = await Promise.all([
        Company.find(query)
          .populate({ path: 'userId', select: 'name email' }) // Populate user info for better response
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(), // Use lean() for better performance when not modifying documents
        Company.countDocuments(query)
      ]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Return empty results instead of throwing a 500 error
      companies = [];
      totalCount = 0;
    }
    
    const totalPages = Math.ceil(totalCount / parseInt(limit)) || 0;
    
    res.json({
      companies,
      pagination: {
        currentPage: parseInt(page) || 1,
        totalPages,
        totalCompanies: totalCount || 0,
        hasNextPage: (parseInt(page) || 1) < totalPages,
        hasPrevPage: (parseInt(page) || 1) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      error: 'Failed to fetch companies'
    });
  }
};

// @desc    Get a single company by ID
// @route   GET /api/companies/:id
// @access  Public
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by the custom id field first
    let company = await Company.findOne({ id });
    
    // If not found by custom id and the ID looks like a MongoDB ObjectId, try by _id
    if (!company && mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findById(id);
    }
    
    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }
    
    // Ensure the response includes the ID field properly
    const companyResponse = {
      ...company.toObject(),
      id: company.id
    };
    res.json(companyResponse);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      error: 'Failed to fetch company'
    });
  }
};

// @desc    Create a new company
// @route   POST /api/companies
// @access  Private
const createCompany = async (req, res) => {
  try {
    const companyData = req.body;
    
    // Use the authenticated user's ID instead of relying on the request body
    companyData.userId = req.user._id;
    
    // Generate ID if not provided
    if (!companyData.id) {
      companyData.id = uuidv4();
    }
    
    // Validate required fields (excluding userId since it's set from auth)
    const requiredFields = ['name', 'type', 'website', 'industry', 'size', 'businessType', 'description', 'founded', 'headquarters'];
    const missingFields = requiredFields.filter(field => !companyData[field] || companyData[field].trim() === '');
    
    // Separately check userId (which is an ObjectId, not a string)
    if (!companyData.userId) {
      missingFields.push('userId');
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate enum values
    const validTypes = ['startup', 'small', 'medium-large', 'enterprise'];
    if (!validTypes.includes(companyData.type)) {
      return res.status(400).json({
        error: `Invalid company type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Check if company with this ID already exists
    const existingCompany = await Company.findOne({ id: companyData.id });
    if (existingCompany) {
      return res.status(409).json({
        error: 'Company with this ID already exists'
      });
    }
    
    // Create new company
    const company = new Company(companyData);
    await company.save();
    
    // Add company ID to user's companies array
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { companies: company.id } },
      { new: true, useFindAndModify: false }
    );
    
    console.log('Company created successfully:', company.name, 'ID:', company.id);
    // Ensure the response includes the ID field properly
    const companyResponse = {
      ...company.toObject(),
      id: company.id
    };
    res.status(201).json(companyResponse);
  } catch (error) {
    console.error('Error creating company:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        error: `Company with this ${field} already exists`
      });
    }
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      error: 'Failed to create company',
      details: error.message
    });
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Private
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyData = req.body;
    
    // For updates, we only need to ensure we have the ID in the URL
    if (!id) {
      return res.status(400).json({
        error: 'Company ID is required'
      });
    }
    
    // Remove the id field from update data to avoid trying to change it
    const { id: _, ...updateData } = companyData;
    
    // Log the update data for debugging
    console.log('Updating company with data:', updateData);
    
    // Update company - only update provided fields
    const updatedCompany = await Company.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true, runValidators: false } // Disable validators for partial updates
    );
    
    if (!updatedCompany) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Company with this ID already exists'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update company'
    });
  }
};

// @desc    Delete a company and all its jobs
// @route   DELETE /api/companies/:id
// @access  Private
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the company first to get the userId
    const company = await Company.findOne({ id });
    
    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }
    
    // Delete all jobs associated with this company
    await Job.deleteMany({ companyId: id });
    
    // Delete the company
    await Company.deleteOne({ id });
    
    // Remove company ID from user's companies array
    await User.findByIdAndUpdate(
      company.userId,
      { $pull: { companies: id } },
      { new: true, useFindAndModify: false }
    );
    
    console.log('Company deleted successfully:', company.name, 'ID:', id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      error: 'Failed to delete company',
      details: error.message
    });
  }
};

// @desc    Get jobs for a specific company
// @route   GET /api/companies/:id/jobs
// @access  Public
const getCompanyJobs = async (req, res) => {
  try {
    const { id: companyId } = req.params;
    
    // Fetch jobs for this company
    const jobs = await Job.find({ companyId });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch company jobs'
    });
  }
};

// @desc    Get companies by IDs
// @route   POST /api/companies/by-ids
// @access  Public
const getCompaniesByIds = async (req, res) => {
  try {
    const { companyIds } = req.body;
    
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        error: 'Company IDs array is required'
      });
    }
    
    // Fetch companies by their IDs
    const companies = await Company.find({ id: { $in: companyIds } });
    
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies by IDs:', error);
    res.status(500).json({
      error: 'Failed to fetch companies'
    });
  }
};

// @desc    Create a job for a specific company
// @route   POST /api/companies/:id/jobs
// @access  Private
const createCompanyJob = async (req, res) => {
  try {
    const { id } = req.params;
    const jobData = req.body;
    
    // Check if company exists
    const company = await Company.findOne({ id });
    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }
    
    // Generate ID if not provided
    if (!jobData.id) {
      jobData.id = uuidv4();
    }
    
    // Verify that the authenticated user owns this company
    if (company.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'You can only create jobs for your own company'
      });
    }
    
    // Set companyId and userId
    jobData.companyId = id;
    jobData.userId = req.user._id;
    
    // Validate required fields
    const requiredFields = ['title', 'department', 'location', 'type', 'description', 'requirements', 'experience', 'benefits', 'companyDescription'];
    const missingFields = requiredFields.filter(field => !jobData[field] || (Array.isArray(jobData[field]) && jobData[field].length === 0));
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
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
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        error: `Job with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      error: 'Failed to create job',
      details: error.message
    });
  }
};

// @desc    Approve a company
// @route   PUT /api/companies/:id/approve
// @access  Private/Admin
const approveCompany = async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    // Log the incoming request for debugging
    console.log('Approving company with ID:', req.params.id);
    console.log('Verification status:', isVerified);
    
    let company;
    
    // First try to find by the custom id field
    company = await Company.findOne({ id: req.params.id });
    
    // If not found by custom id and the ID looks like a MongoDB ObjectId, try by _id
    if (!company && mongoose.Types.ObjectId.isValid(req.params.id)) {
      company = await Company.findOne({ _id: req.params.id });
    }
    
    if (!company) {
      console.log('Company not found with ID:', req.params.id);
      return res.status(404).json({
        error: 'Company not found',
        id: req.params.id
      });
    }
    
    // Update the company
    company.isApproved = true;
    company.isVerified = isVerified || false;
    company.updatedAt = new Date();
    
    await company.save();
    
    console.log('Company approved successfully:', company.name);
    // Ensure the response includes the ID field properly
    const companyResponse = {
      ...company.toObject(),
      id: company.id
    };
    res.json(companyResponse);
  } catch (error) {
    console.error('Error approving company:', error);
    res.status(500).json({
      error: 'Failed to approve company',
      details: error.message
    });
  }
};

// @desc    Reject a company (delete it)
// @route   DELETE /api/companies/:id/approve
// @access  Private/Admin
const rejectCompany = async (req, res) => {
  try {
    console.log('Rejecting company with ID:', req.params.id);
    
    let company;
    
    // First try to find by the custom id field
    company = await Company.findOne({ id: req.params.id });
    
    // If not found by custom id and the ID looks like a MongoDB ObjectId, try by _id
    if (!company && mongoose.Types.ObjectId.isValid(req.params.id)) {
      company = await Company.findOne({ _id: req.params.id });
    }
    
    if (!company) {
      console.log('Company not found for rejection with ID:', req.params.id);
      return res.status(404).json({
        error: 'Company not found',
        id: req.params.id
      });
    }
    
    // Delete the company
    await Company.deleteOne({ _id: company._id });
    
    // Remove company ID from user's companies array
    await User.findByIdAndUpdate(
      company.userId,
      { $pull: { companies: company.id } },
      { new: true, useFindAndModify: false }
    );
    
    console.log('Company rejected successfully:', company.name);
    res.json({ message: 'Company rejected and removed' });
  } catch (error) {
    console.error('Error rejecting company:', error);
    res.status(500).json({
      error: 'Failed to reject company',
      details: error.message
    });
  }
};

export { 
  getCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompany, 
  deleteCompany,
  getCompanyJobs,
  getCompaniesByIds,
  approveCompany,
  rejectCompany
};