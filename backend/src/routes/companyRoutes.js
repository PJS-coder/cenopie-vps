import express from 'express';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import News from '../models/News.js';
import { protect as auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all approved companies (public)
router.get('/', async (req, res) => {
  try {
    const { search, industry, size } = req.query;
    let query = { status: 'approved' }; // Only show approved companies

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (industry) {
      query.industry = industry;
    }

    if (size) {
      query.size = size;
    }

    const companies = await Company.find(query)
      .select('-password -businessRegistration -taxId -contactPerson -contactPhone -adminNotes')
      .sort({ createdAt: -1 });
    
    res.json({
      companies: companies.map(company => ({
        id: company._id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        website: company.website,
        headquarters: company.headquarters,
        size: company.size,
        founded: company.founded,
        logo: company.logo,
        coverImage: company.coverImage,
        isVerified: company.isVerified,
        status: company.status,
        createdAt: company.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get public company profile
router.get('/:id/public', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .select('-password -businessRegistration -taxId -contactPerson -contactPhone -adminNotes');
    
    if (!company || company.status !== 'approved') {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      company: {
        id: company._id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        website: company.website,
        headquarters: company.headquarters,
        size: company.size,
        founded: company.founded,
        logo: company.logo,
        coverImage: company.coverImage,
        isVerified: company.isVerified,
        status: company.status,
        createdAt: company.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create company
router.post('/', auth, async (req, res) => {
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

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company name already exists' });
    }

    const company = new Company({
      name,
      description,
      industry,
      website,
      headquarters,
      size,
      founded,
      logo,
      coverImage,
      ownerId: req.user.id,
      isVerified: false,
      isApproved: false
    });

    await company.save();

    res.status(201).json({
      company: {
        id: company._id,
        ...company.toObject()
      }
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
router.put('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user is owner
    if (company.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this company' });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      company: {
        id: updatedCompany._id,
        ...updatedCompany.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company
router.delete('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user is owner
    if (company.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this company' });
    }

    // Delete all jobs associated with this company
    await Job.deleteMany({ companyId: req.params.id });

    // Delete the company
    await Company.findByIdAndDelete(req.params.id);

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// Get company jobs (public)
router.get('/:id/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ 
      companyId: req.params.id,
      status: 'active'
    }).sort({ createdAt: -1 });

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
    res.status(500).json({ error: 'Failed to fetch company jobs' });
  }
});

// Get company news (public)
router.get('/:id/news', async (req, res) => {
  try {
    const news = await News.find({ 
      companyId: req.params.id,
      isPublished: true
    }).sort({ publishedAt: -1 });

    res.json({
      news: news.map(article => ({
        id: article._id,
        title: article.title,
        content: article.content,
        image: article.image,
        publishedAt: article.publishedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching company news:', error);
    res.status(500).json({ error: 'Failed to fetch company news' });
  }
});

export default router;