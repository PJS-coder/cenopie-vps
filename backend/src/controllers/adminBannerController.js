import Banner from '../models/Banner.js';

// Get all banners with analytics
export const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, position } = req.query;
    
    const query = {};
    if (status) {
      query.isActive = status === 'active';
    }
    if (position) {
      query.position = position;
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(query);

    // Get analytics summary
    const analytics = await Banner.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clickCount' },
          activeBanners: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveBanners: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      banners,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      analytics: analytics[0] || {
        totalImpressions: 0,
        totalClicks: 0,
        activeBanners: 0,
        inactiveBanners: 0
      }
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch banners' 
    });
  }
};

// Get single banner
export const getBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banner'
    });
  }
};

// Create banner
export const createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      link,
      buttonText,
      position,
      startDate,
      endDate,
      priority,
      targetAudience
    } = req.body;

    // Validation
    if (!title || !image) {
      return res.status(400).json({
        success: false,
        error: 'Title and image are required'
      });
    }

    const banner = new Banner({
      title,
      description,
      image,
      link,
      buttonText: buttonText || 'Learn More',
      position: position || 'top',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      priority: priority || 0,
      targetAudience: targetAudience || 'all',
      createdBy: req.user?.name || 'Cenopie Team'
    });

    await banner.save();

    res.status(201).json({
      success: true,
      banner,
      message: 'Banner created successfully'
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create banner'
    });
  }
};

// Update banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    res.json({
      success: true,
      banner,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update banner'
    });
  }
};

// Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete banner'
    });
  }
};

// Toggle banner status
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      banner,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle banner status'
    });
  }
};

// Get banner analytics
export const getBannerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    // Calculate CTR (Click Through Rate)
    const ctr = banner.impressions > 0 
      ? ((banner.clickCount / banner.impressions) * 100).toFixed(2)
      : 0;

    const analytics = {
      impressions: banner.impressions,
      clicks: banner.clickCount,
      ctr: `${ctr}%`,
      isActive: banner.isActive,
      createdAt: banner.createdAt,
      lastUpdated: banner.updatedAt
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get banner analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banner analytics'
    });
  }
};

export default {
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  getBannerAnalytics
};