import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const updateProfile = async (req, res) => {
  try {
    
    let { 
      name, 
      headline, 
      bio, 
      location, 
      pronouns, 
      links,
      education,
      experience,
      skills,
      interviewsCompleted,
      applicationsSent,
      profileViews,
      successRate
    } = req.body;

    // Parse education and experience if they are strings (from FormData)
    if (typeof education === 'string') {
      try {
        education = JSON.parse(education);
      } catch (e) {
        education = undefined;
      }
    }
    
    if (typeof experience === 'string') {
      try {
        experience = JSON.parse(experience);
        
        // Convert date strings to Date objects
        if (Array.isArray(experience)) {
          experience = experience.map(exp => {
            if (exp.startDate && typeof exp.startDate === 'string') {
              exp.startDate = new Date(exp.startDate);
            }
            if (exp.endDate && typeof exp.endDate === 'string') {
              exp.endDate = new Date(exp.endDate);
            }
            return exp;
          });
        }
      } catch (e) {
        experience = undefined;
      }
    }
    
    // Parse skills if they are strings (from FormData)
    if (typeof skills === 'string') {
      try {
        skills = JSON.parse(skills);
      } catch (e) {
        skills = undefined;
      }
    }

    // Parse links if they are strings (from FormData)
    if (typeof links === 'string') {
      try {
        links = JSON.parse(links);
      } catch (e) {
        links = undefined;
      }
    }

    // Update user profile
    const updateData = {};
    
    if (name) updateData.name = name;
    if (headline) updateData.headline = headline;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (pronouns !== undefined) updateData.pronouns = pronouns;
    if (links) updateData.links = links;
    
    // Ensure education is properly formatted
    if (education !== undefined) {
      if (Array.isArray(education)) {
        updateData.education = education;
      } else if (education !== null) {
        // If it's an object, wrap it in an array
        updateData.education = [education];
      } else {
        updateData.education = [];
      }
    }
    
    // Ensure experience is properly formatted
    if (experience !== undefined) {
      if (Array.isArray(experience)) {
        updateData.experience = experience;
      } else if (experience !== null) {
        // If it's an object, wrap it in an array
        updateData.experience = [experience];
      } else {
        updateData.experience = [];
      }
    }
    
    // Ensure skills is properly formatted
    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        updateData.skills = skills;
      } else if (skills !== null) {
        // If it's an object, wrap it in an array
        updateData.skills = [skills];
      } else {
        updateData.skills = [];
      }
    }
    
    if (interviewsCompleted !== undefined) updateData.interviewsCompleted = parseInt(interviewsCompleted);
    if (applicationsSent !== undefined) updateData.applicationsSent = parseInt(applicationsSent);
    if (profileViews !== undefined) updateData.profileViews = parseInt(profileViews);
    if (successRate !== undefined) updateData.successRate = parseInt(successRate);

    // Handle profile image upload
    if (req.files && req.files.profileImage) {
      try {
        const profileImageBuffer = req.files.profileImage[0].buffer;
        const profileImageResult = await uploadToCloudinary(profileImageBuffer, {
          folder: 'profiles',
          transformation: [
            { width: 300, height: 300, crop: 'fill' }
          ]
        });
        updateData.profileImage = profileImageResult.secure_url;
      } catch (uploadError) {
        console.error('Profile image upload error:', uploadError);
      }
    }

    // Handle banner image upload
    if (req.files && req.files.bannerImage) {
      try {
        const bannerImageBuffer = req.files.bannerImage[0].buffer;
        const bannerImageResult = await uploadToCloudinary(bannerImageBuffer, {
          folder: 'banners',
          transformation: [
            { width: 1200, height: 300, crop: 'fill' }
          ]
        });
        updateData.bannerImage = bannerImageResult.secure_url;
      } catch (uploadError) {
        console.error('Banner image upload error:', uploadError);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      _id: updatedUser._id,
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      headline: updatedUser.headline,
      bio: updatedUser.bio,
      location: updatedUser.location,
      pronouns: updatedUser.pronouns,
      links: updatedUser.links,
      education: updatedUser.education,
      experience: updatedUser.experience,
      skills: updatedUser.skills,
      certifications: updatedUser.certifications,
      profileImage: updatedUser.profileImage,
      bannerImage: updatedUser.bannerImage,
      interviewsCompleted: updatedUser.interviewsCompleted,
      applicationsSent: updatedUser.applicationsSent,
      profileViews: updatedUser.profileViews,
      successRate: updatedUser.successRate,
      followers: updatedUser.followers,
      following: updatedUser.following,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt
    };
    
    // Ensure we're sending a proper JSON response with correct headers
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Profile update error:', error);
    // Make sure we always send a JSON response
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate real stats from database
    const userId = user._id;
    
    // Import Interview model dynamically to avoid circular dependency
    const { default: Interview } = await import('../models/Interview.js');
    
    // Get interview stats
    const interviews = await Interview.find({ user: userId });
    const totalInterviews = interviews.length;
    const selectedInterviews = interviews.filter(i => i.hrReview.decision === 'shortlisted').length;
    const rejectedInterviews = interviews.filter(i => i.hrReview.decision === 'rejected').length;
    
    // Calculate average score from completed interviews
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    let averageScore = 0;
    
    if (completedInterviews.length > 0) {
      // Only calculate score if interviews have actual aiScore field
      const interviewsWithScores = completedInterviews.filter(i => i.aiScore !== undefined && i.aiScore !== null);
      if (interviewsWithScores.length > 0) {
        averageScore = Math.round(
          interviewsWithScores.reduce((acc, interview) => acc + interview.aiScore, 0) / interviewsWithScores.length
        );
      }
    }
    
    const userData = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      pronouns: user.pronouns,
      links: user.links,
      education: user.education,
      experience: user.experience,
      skills: user.skills,
      certifications: user.certifications,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      totalInterviews: totalInterviews,
      selectedInterviews: selectedInterviews,
      rejectedInterviews: rejectedInterviews,
      averageScore: averageScore,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate real stats from database for the viewed user
    const { default: Interview } = await import('../models/Interview.js');
    
    // Get interview stats for the viewed user
    const interviews = await Interview.find({ user: userId });
    const totalInterviews = interviews.length;
    const selectedInterviews = interviews.filter(i => i.hrReview.decision === 'shortlisted').length;
    const rejectedInterviews = interviews.filter(i => i.hrReview.decision === 'rejected').length;
    
    // Calculate average score from completed interviews
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    let averageScore = 0;
    
    if (completedInterviews.length > 0) {
      // Only calculate score if interviews have actual aiScore field
      const interviewsWithScores = completedInterviews.filter(i => i.aiScore !== undefined && i.aiScore !== null);
      if (interviewsWithScores.length > 0) {
        averageScore = Math.round(
          interviewsWithScores.reduce((acc, interview) => acc + interview.aiScore, 0) / interviewsWithScores.length
        );
      }
    }
    
    // Import Connection model dynamically to avoid circular dependency
    const Connection = (await import('../models/Connection.js')).default;
    
    // Get connection status between current user and profile user
    let connectionStatus = 'none';
    let connectionId = null;
    
    if (currentUserId.toString() === userId.toString()) {
      connectionStatus = 'self';
    } else {
      const connection = await Connection.findOne({
        $or: [
          { requester: currentUserId, recipient: userId },
          { requester: userId, recipient: currentUserId }
        ]
      });
      
      if (connection) {
        connectionId = connection._id;
        if (connection.status === 'accepted') {
          connectionStatus = 'accepted';
        } else if (connection.status === 'pending') {
          // Determine if current user sent or received the request
          if (connection.requester.toString() === currentUserId.toString()) {
            connectionStatus = 'pending_sent';
          } else {
            connectionStatus = 'pending_received';
          }
        }
      }
    }
    
    const userData = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      pronouns: user.pronouns,
      links: user.links,
      education: user.education,
      experience: user.experience,
      skills: user.skills,
      certifications: user.certifications,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      totalInterviews: totalInterviews,
      selectedInterviews: selectedInterviews,
      rejectedInterviews: rejectedInterviews,
      averageScore: averageScore,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      connectionStatus: connectionStatus,
      connectionId: connectionId
    };
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new education entry
export const addEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const newEducation = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.education.push(newEducation);
    await user.save();

    res.json({ user: { education: user.education } });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an education entry
export const updateEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { educationId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const educationIndex = user.education.findIndex(edu => edu._id.toString() === educationId);
    
    if (educationIndex === -1) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    user.education[educationIndex] = { ...user.education[educationIndex], ...updateData };
    await user.save();

    res.json({ user: { education: user.education } });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an education entry
export const deleteEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { educationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.education = user.education.filter(edu => edu._id.toString() !== educationId);
    await user.save();

    res.json({ user: { education: user.education } });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new experience entry
export const addExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const newExperience = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.experience.push(newExperience);
    await user.save();

    res.json({ user: { experience: user.experience } });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an experience entry
export const updateExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { experienceId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const experienceIndex = user.experience.findIndex(exp => exp._id.toString() === experienceId);
    
    if (experienceIndex === -1) {
      return res.status(404).json({ message: 'Experience entry not found' });
    }

    user.experience[experienceIndex] = { ...user.experience[experienceIndex], ...updateData };
    await user.save();

    res.json({ user: { experience: user.experience } });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an experience entry
export const deleteExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { experienceId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.experience = user.experience.filter(exp => exp._id.toString() !== experienceId);
    await user.save();

    res.json({ user: { experience: user.experience } });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new skill
export const addSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const newSkill = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skills.push(newSkill);
    await user.save();

    res.json({ user: { skills: user.skills } });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a skill
export const updateSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skillIndex = user.skills.findIndex(skill => skill._id.toString() === skillId);
    if (skillIndex === -1) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    user.skills[skillIndex] = { ...user.skills[skillIndex], ...updateData };
    await user.save();

    res.json({ user: { skills: user.skills } });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a skill
export const deleteSkill = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skillId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.skills = user.skills.filter(skill => skill._id.toString() !== skillId);
    await user.save();

    res.json({ user: { skills: user.skills } });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new certification
export const addCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const newCertification = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize certifications array if it doesn't exist
    if (!user.certifications) {
      user.certifications = [];
    }

    user.certifications.push(newCertification);
    await user.save();

    res.json({ user: { certifications: user.certifications } });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a certification
export const updateCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { certificationId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.certifications) {
      return res.status(404).json({ message: 'No certifications found' });
    }

    const certificationIndex = user.certifications.findIndex(cert => cert._id.toString() === certificationId);
    if (certificationIndex === -1) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    user.certifications[certificationIndex] = { ...user.certifications[certificationIndex], ...updateData };
    await user.save();

    res.json({ user: { certifications: user.certifications } });
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a certification
export const deleteCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { certificationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.certifications) {
      return res.status(404).json({ message: 'No certifications found' });
    }

    user.certifications = user.certifications.filter(cert => cert._id.toString() !== certificationId);
    await user.save();

    res.json({ user: { certifications: user.certifications } });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};