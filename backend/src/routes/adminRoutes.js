import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';

import Application from '../models/Application.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import Connection from '../models/Connection.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all companies for admin review
router.get('/companies', protect, admin, async (req, res) => {
  try {
    const companies = await Company.find({})
      .sort({ createdAt: -1 });

    res.json({
      companies: companies.map(company => ({
        id: company._id,
        name: company.name,
        email: company.email,
        description: company.description,
        industry: company.industry,
        website: company.website,
        headquarters: company.headquarters,
        size: company.size,
        founded: company.founded,
        logo: company.logo,
        businessRegistration: company.businessRegistration,
        taxId: company.taxId,
        contactPerson: company.contactPerson,
        contactPhone: company.contactPhone,
        status: company.status,
        adminNotes: company.adminNotes,
        isVerified: company.isVerified || false,
        isBlacklisted: company.isBlacklisted || false,
        blacklistReason: company.blacklistReason || '',
        blacklistedAt: company.blacklistedAt,
        approvedAt: company.approvedAt,
        approvedBy: company.approvedBy,
        createdAt: company.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching companies for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company status (approve/reject)
router.put('/companies/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, adminNotes, isVerified } = req.body;
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.status = status;
    company.adminNotes = adminNotes;
    
    // Handle verification if provided
    if (typeof isVerified === 'boolean') {
      company.isVerified = isVerified;
    }
    
    if (status === 'approved') {
      company.approvedAt = new Date();
      company.approvedBy = req.user.id;
    }

    await company.save();

    res.json({
      company: {
        id: company._id,
        status: company.status,
        adminNotes: company.adminNotes,
        isVerified: company.isVerified,
        approvedAt: company.approvedAt
      }
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company verification status
router.put('/companies/:id/verify', protect, admin, async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.isVerified = isVerified;
    await company.save();

    res.json({
      company: {
        id: company._id,
        isVerified: company.isVerified
      }
    });
  } catch (error) {
    console.error('Error updating company verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Blacklist company
router.put('/companies/:id/blacklist', protect, admin, async (req, res) => {
  try {
    const { isBlacklisted, blacklistReason } = req.body;
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.isBlacklisted = isBlacklisted;
    company.blacklistReason = blacklistReason || '';
    company.blacklistedAt = isBlacklisted ? new Date() : null;
    company.blacklistedBy = isBlacklisted ? req.user.id : null;
    
    // If blacklisting, also remove verification and set status to rejected
    if (isBlacklisted) {
      company.isVerified = false;
      company.status = 'rejected';
    }
    
    await company.save();

    res.json({
      company: {
        id: company._id,
        isBlacklisted: company.isBlacklisted,
        blacklistReason: company.blacklistReason,
        isVerified: company.isVerified,
        status: company.status
      }
    });
  } catch (error) {
    console.error('Error blacklisting company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE ALL DATA - Use with extreme caution!
router.delete('/delete-all-data', protect, admin, async (req, res) => {
  try {
    console.log('🗑️ Starting database cleanup...');
    
    // Delete all collections in order (to handle dependencies)
    const deletionResults = {};
    
    // Delete Applications first (references users and jobs)
    const applicationsDeleted = await Application.deleteMany({});
    deletionResults.applications = applicationsDeleted.deletedCount;
    console.log(`✅ Deleted ${applicationsDeleted.deletedCount} applications`);
    
    // Delete Jobs (references companies)
    const jobsDeleted = await Job.deleteMany({});
    deletionResults.jobs = jobsDeleted.deletedCount;
    console.log(`✅ Deleted ${jobsDeleted.deletedCount} jobs`);
    
    // Delete Companies
    const companiesDeleted = await Company.deleteMany({});
    deletionResults.companies = companiesDeleted.deletedCount;
    console.log(`✅ Deleted ${companiesDeleted.deletedCount} companies`);
    
    // Delete Messages
    const messagesDeleted = await ChatMessage.deleteMany({});
    deletionResults.messages = messagesDeleted.deletedCount;
    console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);
    
    // Delete Notifications
    const notificationsDeleted = await Notification.deleteMany({});
    deletionResults.notifications = notificationsDeleted.deletedCount;
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
    
    // Delete Connections
    const connectionsDeleted = await Connection.deleteMany({});
    deletionResults.connections = connectionsDeleted.deletedCount;
    console.log(`✅ Deleted ${connectionsDeleted.deletedCount} connections`);
    
    // Delete Posts
    const postsDeleted = await Post.deleteMany({});
    deletionResults.posts = postsDeleted.deletedCount;
    console.log(`✅ Deleted ${postsDeleted.deletedCount} posts`);
    
    // Delete Users last
    const usersDeleted = await User.deleteMany({});
    deletionResults.users = usersDeleted.deletedCount;
    console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
    
    console.log('🎉 Database cleanup completed successfully!');
    
    res.status(200).json({
      success: true,
      message: 'All data deleted successfully',
      deletionResults
    });
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting data',
      error: error.message
    });
  }
});

// DELETE USERS ONLY
router.delete('/delete-users', protect, admin, async (req, res) => {
  try {
    console.log('🗑️ Deleting all users...');
    
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users`);
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting users',
      error: error.message
    });
  }
});

// DELETE POSTS ONLY
router.delete('/delete-posts', protect, admin, async (req, res) => {
  try {
    console.log('🗑️ Deleting all posts...');
    
    const result = await Post.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} posts`);
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} posts`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error deleting posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting posts',
      error: error.message
    });
  }
});

// DELETE COMPANIES ONLY
router.delete('/delete-companies', protect, admin, async (req, res) => {
  try {
    console.log('🗑️ Deleting all companies...');
    
    const result = await Company.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} companies`);
    
    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} companies`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error deleting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting companies',
      error: error.message
    });
  }
});

// GET DATABASE STATS
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      posts: await Post.countDocuments(),
      companies: await Company.countDocuments(),
      jobs: await Job.countDocuments(),
      applications: await Application.countDocuments(),
      connections: await Connection.countDocuments(),
      messages: await ChatMessage.countDocuments(),
      notifications: await Notification.countDocuments()
    };
    
    res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting database stats',
      error: error.message
    });
  }
});

// VERIFY ADMIN STATUS
router.get('/verify-admin', protect, admin, async (req, res) => {
  try {
    // If middleware passes, user is admin
    res.status(200).json({
      success: true,
      isAdmin: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('❌ Error verifying admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin status'
    });
  }
});

// MAKE USER ADMIN
router.post('/make-admin', protect, admin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    // Check if already admin
    if (user.role === 'admin' || user.isAdmin === true) {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }
    
    // Promote to admin
    user.role = 'admin';
    user.isAdmin = true;
    await user.save();
    
    console.log(`✅ User ${email} promoted to admin by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: `User ${email} has been promoted to admin successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error promoting user to admin',
      error: error.message
    });
  }
});

// MAKE USER HR
router.post('/make-hr', protect, admin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    // Check if already HR or admin
    if (user.role === 'hr') {
      return res.status(400).json({
        success: false,
        message: 'User is already an HR'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is an admin. Admins already have HR access.'
      });
    }
    
    // Promote to HR
    user.role = 'hr';
    await user.save();
    
    console.log(`✅ User ${email} promoted to HR by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: `User ${email} has been promoted to HR successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error making user HR:', error);
    res.status(500).json({
      success: false,
      message: 'Error promoting user to HR',
      error: error.message
    });
  }
});

// REMOVE HR ROLE
router.post('/remove-hr', protect, admin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    // Check if user is HR
    if (user.role !== 'hr') {
      return res.status(400).json({
        success: false,
        message: 'User is not an HR'
      });
    }
    
    // Remove HR role
    user.role = 'user';
    await user.save();
    
    console.log(`✅ HR role removed from ${email} by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: `HR role removed from ${email} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error removing HR role:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing HR role',
      error: error.message
    });
  }
});

// GET ALL HR USERS
router.get('/hr-users', protect, admin, async (req, res) => {
  try {
    const hrUsers = await User.find({ role: 'hr' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      hrUsers
    });
    
  } catch (error) {
    console.error('❌ Error fetching HR users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HR users',
      error: error.message
    });
  }
});

// BLACKLIST USER
router.put('/users/:id/blacklist', protect, admin, async (req, res) => {
  try {
    const { isBlacklisted, blacklistReason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlacklisted = isBlacklisted;
    user.blacklistReason = blacklistReason || '';
    user.blacklistedAt = isBlacklisted ? new Date() : null;
    user.blacklistedBy = isBlacklisted ? req.user.id : null;
    
    // If blacklisting, also remove verification
    if (isBlacklisted) {
      user.isVerified = false;
    }
    
    await user.save();

    res.json({
      user: {
        id: user._id,
        isBlacklisted: user.isBlacklisted,
        blacklistReason: user.blacklistReason,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Error blacklisting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;