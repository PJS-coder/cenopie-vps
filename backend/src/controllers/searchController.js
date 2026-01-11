import User from '../models/User.js';
import Company from '../models/Company.js';
import { v4 as uuidv4 } from 'uuid';

// Search users and companies
export const search = async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchQuery = q.trim();
    
    // Search users
    if (!type || type === 'users' || type === 'all') {
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { headline: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .select('_id name headline profileImage isVerified')
      .limit(20);
      
      const formattedUsers = users.map(user => ({
        id: user._id,
        type: 'user',
        name: user.name,
        headline: user.headline || '',
        profileImage: user.profileImage,
        isVerified: user.isVerified || false
      }));
      
      // Search companies in the dedicated Company collection
      const companies = await Company.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { industry: { $regex: searchQuery, $options: 'i' } }
        ],
        status: 'approved' // Only show approved companies
      })
      .select('id name description isVerified logo')
      .limit(20);
      
      const formattedCompanies = companies.map(company => ({
        id: company.id,
        type: 'company',
        name: company.name,
        headline: company.description || 'Company',
        profileImage: company.logo || null,
        isVerified: company.isVerified || false
      }));
      
      // Combine users and companies
      const results = [...formattedUsers, ...formattedCompanies].slice(0, 20);
      
      return res.json({
        data: results
      });
    }
    
    // Search specifically for companies
    if (type === 'companies') {
      const companies = await Company.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { industry: { $regex: searchQuery, $options: 'i' } }
        ],
        status: 'approved' // Only show approved companies
      })
      .select('id name description isVerified logo')
      .limit(20);
      
      const formattedCompanies = companies.map(company => ({
        id: company.id,
        type: 'company',
        name: company.name,
        headline: company.description || 'Company',
        profileImage: company.logo || null,
        isVerified: company.isVerified || false
      }));
      
      return res.json({
        data: formattedCompanies.slice(0, 20)
      });
    }
    
    // Default response
    res.json({
      data: []
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};