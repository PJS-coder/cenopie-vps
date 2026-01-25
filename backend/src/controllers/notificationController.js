import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { type } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    if (type) {
      query.type = type;
    }
    
    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('relatedUser', 'name headline profileImage isVerified')
      .populate('relatedInterview', 'status hrReview');
      
    res.json(items);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
};