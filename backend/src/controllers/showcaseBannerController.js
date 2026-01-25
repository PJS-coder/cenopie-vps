import ShowcaseBanner from '../models/ShowcaseBanner.js';
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get active banners for showcase page
export const getShowcaseBanners = async (req, res) => {
  try {
    const banners = await ShowcaseBanner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      posters: banners // Keep the same format as before
    });
  } catch (error) {
    console.error('Get showcase banners error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch showcase banners' 
    });
  }
};

// Admin: Get all banners
export const getAllShowcaseBanners = async (req, res) => {
  try {
    const banners = await ShowcaseBanner.find()
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Get all showcase banners error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch showcase banners' 
    });
  }
};

// Admin: Upload banner image to Cloudinary
export const uploadShowcaseBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Uploading showcase banner to Cloudinary...');
    
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'showcase-banners',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 200, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    console.log('Cloudinary upload successful:', cloudinaryResult.secure_url);

    // Get the next order number
    const lastBanner = await ShowcaseBanner.findOne().sort({ order: -1 });
    const nextOrder = lastBanner ? lastBanner.order + 1 : 1;

    const banner = new ShowcaseBanner({
      image: cloudinaryResult.secure_url,
      order: nextOrder,
      cloudinaryPublicId: cloudinaryResult.public_id
    });

    await banner.save();

    res.status(201).json({
      success: true,
      banner,
      message: 'Showcase banner uploaded successfully'
    });
  } catch (error) {
    console.error('Upload showcase banner error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload showcase banner'
    });
  }
};

// Admin: Create banner (legacy support)
export const createShowcaseBanner = async (req, res) => {
  try {
    const { image, order } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }

    const banner = new ShowcaseBanner({
      image,
      order: order || 0
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

// Admin: Update banner
export const updateShowcaseBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const banner = await ShowcaseBanner.findByIdAndUpdate(
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

// Admin: Delete banner
export const deleteShowcaseBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await ShowcaseBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: 'Showcase banner not found'
      });
    }

    // Delete from Cloudinary if it has a public ID
    if (banner.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(banner.cloudinaryPublicId);
        console.log('Deleted banner from Cloudinary:', banner.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryError.message);
        // Continue with database deletion even if Cloudinary deletion fails
      }
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

// Admin: Toggle banner status
export const toggleShowcaseBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await ShowcaseBanner.findById(id);
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

export { upload };

export default {
  getShowcaseBanners,
  getAllShowcaseBanners,
  uploadShowcaseBanner,
  createShowcaseBanner,
  updateShowcaseBanner,
  deleteShowcaseBanner,
  toggleShowcaseBannerStatus,
  upload
};