import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import News from '../models/News.js';
import { checkRegistrationAllowed } from '../middleware/registrationControl.js';

const router = express.Router();

// Company Registration (protected by registration control)
router.post('/register', checkRegistrationAllowed, async (req, res) => {
  try {
    const {
      email,
      password,
      companyName,
      description,
      industry,
      website,
      headquarters,
      size,
      founded,
      logo,
      coverImage,
      businessRegistration,
      taxId,
      contactPerson,
      contactPhone
    } = req.body;

    // Check if company email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company email already registered' });
    }

    // Check if company name already exists
    const existingName = await Company.findOne({ name: companyName });
    if (existingName) {
      return res.status(400).json({ message: 'Company name already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company
    const company = new Company({
      email,
      password: hashedPassword,
      name: companyName,
      description,
      industry,
      website,
      headquarters,
      size,
      founded,
      logo,
      coverImage,
      businessRegistration,
      taxId,
      contactPerson,
      contactPhone,
      status: 'pending'
    });

    await company.save();

    res.status(201).json({
      message: 'Company registration submitted successfully. You will be notified once approved.',
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        status: company.status
      }
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Company Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find company by email
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token (even for non-approved companies so they can access their status)
    const token = jwt.sign(
      { 
        id: company._id, 
        type: 'company',
        email: company.email,
        status: company.status
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success with company data and status
    res.json({
      token,
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        logo: company.logo,
        isVerified: company.isVerified,
        status: company.status
      }
    });
  } catch (error) {
    console.error('Company login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Company middleware to verify token
const companyAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'company') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const company = await Company.findById(decoded.id);
    if (!company) {
      return res.status(401).json({ message: 'Company not found' });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error('Company auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Company middleware that requires approval
const companyAuthApproved = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'company') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const company = await Company.findById(decoded.id);
    if (!company) {
      return res.status(401).json({ message: 'Company not found' });
    }

    if (company.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Company not approved. Please wait for approval to access this feature.',
        status: company.status
      });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error('Company auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get company profile
router.get('/profile', companyAuth, async (req, res) => {
  try {
    res.json({
      company: {
        id: req.company._id,
        name: req.company.name,
        email: req.company.email,
        description: req.company.description,
        industry: req.company.industry,
        website: req.company.website,
        headquarters: req.company.headquarters,
        size: req.company.size,
        founded: req.company.founded,
        logo: req.company.logo,
        coverImage: req.company.coverImage,
        isVerified: req.company.isVerified,
        status: req.company.status
      }
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company profile
router.put('/profile', companyAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      industry,
      website,
      headquarters,
      size,
      founded,
      logo,
      coverImage
    } = req.body;

    // Check if company name already exists (excluding current company)
    if (name && name !== req.company.name) {
      const existingCompany = await Company.findOne({ 
        name, 
        _id: { $ne: req.company._id } 
      });
      if (existingCompany) {
        return res.status(400).json({ message: 'Company name already exists' });
      }
    }

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      req.company._id,
      {
        name: name || req.company.name,
        description: description || req.company.description,
        industry: industry || req.company.industry,
        website: website || req.company.website,
        headquarters: headquarters || req.company.headquarters,
        size: size || req.company.size,
        founded: founded || req.company.founded,
        logo: logo || req.company.logo,
        coverImage: coverImage || req.company.coverImage
      },
      { new: true }
    );

    res.json({
      company: {
        id: updatedCompany._id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        description: updatedCompany.description,
        industry: updatedCompany.industry,
        website: updatedCompany.website,
        headquarters: updatedCompany.headquarters,
        size: updatedCompany.size,
        founded: updatedCompany.founded,
        logo: updatedCompany.logo,
        coverImage: updatedCompany.coverImage,
        isVerified: updatedCompany.isVerified,
        status: updatedCompany.status
      }
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company stats
router.get('/stats', companyAuthApproved, async (req, res) => {
  try {
    const companyId = req.company._id;

    const [totalJobs, activeJobs, totalApplications, pendingApplications] = await Promise.all([
      Job.countDocuments({ companyId }),
      Job.countDocuments({ companyId, status: 'active' }),
      Application.countDocuments({ companyId }),
      Application.countDocuments({ companyId, status: 'pending' })
    ]);

    res.json({
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company jobs
router.get('/jobs', companyAuthApproved, async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.company._id })
      .sort({ createdAt: -1 });

    res.json({
      jobs: jobs.map(job => ({
        id: job._id,
        title: job.title,
        description: job.description,
        location: job.location,
        type: job.type,
        salary: job.salary,
        status: job.status,
        applicants: job.applicants,
        createdAt: job.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create company job
router.post('/jobs', companyAuthApproved, async (req, res) => {
  try {
    console.log('=== CREATE JOB REQUEST ===');
    console.log('Company:', req.company.name, '(ID:', req.company._id, ')');
    console.log('Request body:', req.body);
    
    const {
      title,
      description,
      requirements,
      benefits,
      location,
      type,
      experience,
      salary
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !type) {
      console.error('Missing required fields:', { title: !!title, description: !!description, location: !!location, type: !!type });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'location', 'type']
      });
    }

    console.log('Creating job object with data:', {
      title,
      description: description?.substring(0, 50) + '...',
      requirements: requirements?.length || 0,
      benefits: benefits?.length || 0,
      location,
      type,
      experience,
      salary,
      companyId: req.company._id,
      status: 'active',
      applicants: 0
    });

    const job = new Job({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      location,
      type,
      experience,
      salary,
      companyId: req.company._id,
      status: 'active',
      applicants: 0
    });

    console.log('Validating job...');
    const validationError = job.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        }))
      });
    }

    console.log('Saving job to database...');
    await job.save();
    console.log('✅ Job saved successfully! ID:', job._id);

    res.status(201).json({
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        location: job.location,
        type: job.type,
        salary: job.salary,
        status: job.status,
        applicants: job.applicants,
        createdAt: job.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating job:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate entry',
        error: 'A job with this information already exists'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      errorType: error.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete company job
router.delete('/jobs/:id', companyAuthApproved, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job belongs to this company
    if (job.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // Delete all applications for this job
    await Application.deleteMany({ jobId: req.params.id });

    // Delete the job
    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company applications
router.get('/applications', companyAuthApproved, async (req, res) => {
  try {
    const applications = await Application.find({ companyId: req.company._id })
      .populate('jobId', 'title')
      .populate('userId', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json({
      applications: applications.map(app => ({
        id: app._id,
        jobId: app.jobId._id,
        jobTitle: app.jobId.title,
        userId: app.userId._id,
        userName: app.userId.name,
        userEmail: app.userId.email,
        userProfileImage: app.userId.profileImage,
        coverLetter: app.coverLetter,
        resume: app.resume,
        status: app.status,
        appliedAt: app.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status
router.put('/applications/:id', companyAuthApproved, async (req, res) => {
  try {
    const { status } = req.body;
    
    const application = await Application.findById(req.params.id)
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if application belongs to this company
    if (application.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    res.json({
      application: {
        id: application._id,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create company news
router.post('/news', companyAuthApproved, async (req, res) => {
  try {
    const { title, content, image, publishNow } = req.body;

    const news = new News({
      title,
      content,
      image,
      companyId: req.company._id,
      publishedAt: publishNow ? new Date() : null,
      isPublished: publishNow
    });

    await news.save();

    res.status(201).json({
      news: {
        id: news._id,
        title: news.title,
        content: news.content,
        image: news.image,
        publishedAt: news.publishedAt,
        isPublished: news.isPublished
      }
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get company news
router.get('/news', companyAuthApproved, async (req, res) => {
  try {
    const news = await News.find({ companyId: req.company._id })
      .sort({ createdAt: -1 });

    res.json({
      news: news.map(article => ({
        id: article._id,
        title: article.title,
        content: article.content,
        image: article.image,
        publishedAt: article.publishedAt,
        isPublished: article.isPublished,
        createdAt: article.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { companyAuth, companyAuthApproved };
export default router;