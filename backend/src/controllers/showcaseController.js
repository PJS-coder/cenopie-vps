import Showcase from '../models/Showcase.js';
import SponsoredBanner from '../models/SponsoredBanner.js';
import User from '../models/User.js';

// Get all showcases with pagination and filtering
export const getShowcases = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      featured, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const showcases = await Showcase.find(filter)
      .populate('author', 'name profileImage isVerified')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Showcase.countDocuments(filter);

    res.json({
      success: true,
      showcases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching showcases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch showcases'
    });
  }
};

// Get top showcases (most liked/viewed)
export const getTopShowcases = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const showcases = await Showcase.aggregate([
      { $match: { status: 'published' } },
      {
        $addFields: {
          likeCount: { $size: '$likes' },
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] }, // Likes worth 2 points
              { $multiply: ['$views', 0.1] } // Views worth 0.1 points
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            { $project: { name: 1, profileImage: 1, isVerified: 1 } }
          ]
        }
      },
      { $unwind: '$author' }
    ]);

    res.json({
      success: true,
      showcases
    });
  } catch (error) {
    console.error('Error fetching top showcases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top showcases'
    });
  }
};

// Get posters (static for now, can be made dynamic later)
export const getPosters = async (req, res) => {
  try {
    // Static poster data - can be moved to database later
    const posters = [
      {
        _id: 'poster1',
        title: 'Design Excellence Award',
        description: 'Showcase your best designs and win amazing prizes. Competition ends soon!',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop&crop=center',
        clickUrl: '/showcase/design-award',
        isActive: true
      },
      {
        _id: 'poster2',
        title: 'Developer Spotlight',
        description: 'Featured projects from our amazing developer community. Get inspired!',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&crop=center',
        clickUrl: '/showcase/developer-spotlight',
        isActive: true
      },
      {
        _id: 'poster3',
        title: 'Innovation Challenge',
        description: 'Join our monthly innovation challenge and showcase your creative solutions.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
        clickUrl: '/showcase/innovation-challenge',
        isActive: true
      }
    ];

    res.json({
      success: true,
      posters: posters.filter(poster => poster.isActive)
    });
  } catch (error) {
    console.error('Error fetching posters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posters'
    });
  }
};

// Get sponsored banners
export const getSponsoredBanners = async (req, res) => {
  try {
    const now = new Date();
    
    const banners = await SponsoredBanner.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(3) // Only show top 3 sponsored banners
    .lean();

    // Increment impressions
    if (banners.length > 0) {
      await SponsoredBanner.updateMany(
        { _id: { $in: banners.map(b => b._id) } },
        { $inc: { impressions: 1 } }
      );
    }

    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Error fetching sponsored banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sponsored banners'
    });
  }
};

// Track banner click
export const trackBannerClick = async (req, res) => {
  try {
    const { bannerId } = req.params;

    await SponsoredBanner.findByIdAndUpdate(
      bannerId,
      { $inc: { clicks: 1 } }
    );

    res.json({
      success: true,
      message: 'Click tracked'
    });
  } catch (error) {
    console.error('Error tracking banner click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click'
    });
  }
};

// Get single showcase
export const getShowcase = async (req, res) => {
  try {
    const { id } = req.params;

    const showcase = await Showcase.findById(id)
      .populate('author', 'name profileImage isVerified bio headline')
      .lean();

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: 'Showcase not found'
      });
    }

    // Increment view count
    await Showcase.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json({
      success: true,
      showcase
    });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch showcase'
    });
  }
};

// Create showcase
export const createShowcase = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      category,
      tags,
      projectUrl,
      githubUrl,
      technologies
    } = req.body;

    const showcase = new Showcase({
      title,
      description,
      image,
      category,
      author: req.user.id,
      tags: tags || [],
      projectUrl,
      githubUrl,
      technologies: technologies || []
    });

    await showcase.save();
    await showcase.populate('author', 'name profileImage isVerified');

    res.status(201).json({
      success: true,
      showcase,
      message: 'Showcase created successfully'
    });
  } catch (error) {
    console.error('Error creating showcase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create showcase'
    });
  }
};

// Update showcase
export const updateShowcase = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const showcase = await Showcase.findById(id);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: 'Showcase not found'
      });
    }

    // Check if user owns the showcase
    if (showcase.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this showcase'
      });
    }

    Object.assign(showcase, updates);
    await showcase.save();
    await showcase.populate('author', 'name profileImage isVerified');

    res.json({
      success: true,
      showcase,
      message: 'Showcase updated successfully'
    });
  } catch (error) {
    console.error('Error updating showcase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update showcase'
    });
  }
};

// Delete showcase
export const deleteShowcase = async (req, res) => {
  try {
    const { id } = req.params;

    const showcase = await Showcase.findById(id);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: 'Showcase not found'
      });
    }

    // Check if user owns the showcase or is admin
    if (showcase.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this showcase'
      });
    }

    await Showcase.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Showcase deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting showcase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete showcase'
    });
  }
};

// Like/Unlike showcase
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const showcase = await Showcase.findById(id);

    if (!showcase) {
      return res.status(404).json({
        success: false,
        message: 'Showcase not found'
      });
    }

    const isLiked = showcase.likes.includes(userId);

    if (isLiked) {
      showcase.likes.pull(userId);
    } else {
      showcase.likes.push(userId);
    }

    await showcase.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: showcase.likes.length,
      message: isLiked ? 'Showcase unliked' : 'Showcase liked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// Get user's showcases
export const getUserShowcases = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const showcases = await Showcase.find({ 
      author: userId,
      status: 'published'
    })
      .populate('author', 'name profileImage isVerified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Showcase.countDocuments({ 
      author: userId,
      status: 'published'
    });

    res.json({
      success: true,
      showcases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user showcases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user showcases'
    });
  }
};