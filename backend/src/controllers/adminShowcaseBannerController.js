import SponsoredBanner from '../models/SponsoredBanner.js';

// Get all showcase banners
export const getAllShowcaseBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.isActive = status === 'active';
    }

    const banners = await SponsoredBanner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SponsoredBanner.countDocuments(query);

    // Get analytics summary
    const analytics = await SponsoredBanner.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
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
    console.error('Get showcase banners error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch showcase banners' 
    });
  }
};

// Get single showcase banner
export const getShowcaseBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await SponsoredBanner.findById(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Get showcase banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch showcase banner'
    });
  }
};

// Create showcase banner
export const createShowcaseBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      buttonText,
      clickUrl,
      backgroundColor,
      textColor,
      priority,
      startDate,
      endDate,
      targetAudience
    } = req.body;

    // Validation
    if (!title || !description || !image || !clickUrl) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, image, and click URL are required'
      });
    }

    const banner = new SponsoredBanner({
      title,
      description,
      image,
      buttonText: buttonText || 'Learn More',
      clickUrl,
      backgroundColor: backgroundColor || '#F59E0B',
      textColor: textColor || '#FFFFFF',
      priority: priority || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      targetAudience: targetAudience || 'all',
      createdBy: req.user?.name || 'Cenopie Team'
    });

    await banner.save();

    res.status(201).json({
      success: true,
      banner,
      message: 'Showcase banner created successfully'
    });
  } catch (error) {
    console.error('Create showcase banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create showcase banner'
    });
  }
};

// Update showcase banner
export const updateShowcaseBanner = async (req, res) => {
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

    const banner = await SponsoredBanner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    res.json({
      success: true,
      banner,
      message: 'Showcase banner updated successfully'
    });
  } catch (error) {
    console.error('Update showcase banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update showcase banner'
    });
  }
};

// Delete showcase banner
export const deleteShowcaseBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await SponsoredBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Showcase banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete showcase banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete showcase banner'
    });
  }
};

// Toggle showcase banner status
export const toggleShowcaseBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await SponsoredBanner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      banner,
      message: `Showcase banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle showcase banner status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle showcase banner status'
    });
  }
};

// Get showcase banner analytics
export const getShowcaseBannerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await SponsoredBanner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    // Calculate CTR (Click Through Rate)
    const ctr = banner.impressions > 0 
      ? ((banner.clicks / banner.impressions) * 100).toFixed(2)
      : 0;

    const analytics = {
      impressions: banner.impressions,
      clicks: banner.clicks,
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
    console.error('Get showcase banner analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch showcase banner analytics'
    });
  }
};

export default {
  getAllShowcaseBanners,
  getShowcaseBanner,
  createShowcaseBanner,
  updateShowcaseBanner,
  deleteShowcaseBanner,
  toggleShowcaseBannerStatus,
  getShowcaseBannerAnalytics
};