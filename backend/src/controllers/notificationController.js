import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const items = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('relatedUser', 'name headline profileImage isVerified');
  res.json(items);
};

export const markRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
};