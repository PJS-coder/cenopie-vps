import Banner from '../models/Banner.js';

// Get active banners for showcase page
export const getActiveBanners = async (req, res) => {
  try {
    const { position, audience = 'all' } = req.query;
    
    const now = new Date();
    const query = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    };

    if (position) {
      query.position = position;
    }

    if (audience !== 'all') {
      query.targetAudience = { $in: [audience, 'all'] };
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    // Increment impressions
    if (banners.length > 0) {
      await Banner.updateMany(
        { _id: { $in: banners.map(b => b._id) } },
        { $inc: { impressions: 1 } }
      );
    }

    res.json({ banners });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

// Track banner click
export const trackBannerClick = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Banner.findByIdAndUpdate(id, {
      $inc: { clickCount: 1 }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};

// Admin: Get all banners
export const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.isActive = status === 'active';
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(query);

    res.json({
      banners,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

// Admin: Create banner
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

    const banner = new Banner({
      title,
      description,
      image,
      link,
      buttonText,
      position,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      priority: priority || 0,
      targetAudience: targetAudience || 'all'
    });

    await banner.save();

    res.status(201).json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
};

// Admin: Update banner
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

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
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
};

// Admin: Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};

// Admin: Toggle banner status
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({ error: 'Failed to toggle banner status' });
  }
};

export default {
  getActiveBanners,
  trackBannerClick,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
};