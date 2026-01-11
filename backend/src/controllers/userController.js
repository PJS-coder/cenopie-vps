import User from '../models/User.js';

export const getProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const updates = (({ name, headline, bio, location, links }) => ({ name, headline, bio, location, links }))(req.body);
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json(user);
};

export const follow = async (req, res) => {
  const targetId = req.params.id;
  if (String(req.user._id) === targetId) return res.status(400).json({ message: 'Cannot follow self' });
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });
  await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.user._id } });
  res.json({ ok: true });
};

export const unfollow = async (req, res) => {
  const targetId = req.params.id;
  await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetId } });
  await User.findByIdAndUpdate(targetId, { $pull: { followers: req.user._id } });
  res.json({ ok: true });
};

// Get suggested users for "People You May Know" section
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get the current user 
    const currentUser = await User.findById(currentUserId)
      .select('following');
    
    // Get IDs of current user's following
    const followingUserIds = currentUser.following.map(follow => follow._id.toString());
    
    // Combine all IDs to exclude (self, following)
    const excludeIds = [
      currentUserId.toString(),
      ...followingUserIds
    ];
    
    // Find users who are not in the exclude list
    // Limit to 5 users and sort by createdAt descending (newest first)
    const suggestedUsers = await User.find({
      _id: { $nin: excludeIds }
    })
    .select('_id name headline profileImage experience isVerified')
    .limit(5)
    .sort({ createdAt: -1 });
    
    // Format the response
    const formattedUsers = suggestedUsers.map(user => {
      // Get current company from experience
      let currentCompany = '';
      if (user.experience && user.experience.length > 0) {
        const currentExp = user.experience.find(exp => exp.current);
        if (currentExp) {
          currentCompany = currentExp.company;
        } else {
          // If no current job, use the most recent one
          currentCompany = user.experience[0].company;
        }
      }
      
      return {
        id: user._id,
        name: user.name,
        role: user.headline || 'Professional',
        company: currentCompany,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        connected: false // These are suggested users, so not yet connected
      };
    });
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify/unverify a user
// @route   PUT /api/users/:id/verify
// @access  Private/Admin
export const verifyUser = async (req, res) => {
  try {
    const { isVerified } = req.body;
    
    // Find and update the user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};