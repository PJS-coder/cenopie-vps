import Post from '../models/Post.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';
import redisClient from '../config/redis.js';

// Helper function to create notifications
const createNotification = async (userId, type, message, relatedUser, relatedPost, link) => {
  try {
    // Don't create notifications for actions on one's own posts
    if (userId.toString() === relatedUser.toString()) {
      return;
    }
    
    await Notification.create({
      user: userId,
      type,
      message,
      relatedUser,
      relatedPost,
      link
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to check if two users are connected
const checkConnectionStatus = async (currentUserId, targetUserId) => {
  try {
    // Users are always connected to themselves
    if (currentUserId.toString() === targetUserId.toString()) {
      return true;
    }
    
    // Check if there's an accepted connection between the users
    const connection = await Connection.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUserId },
        { requester: targetUserId, recipient: currentUserId }
      ],
      status: 'accepted'
    });
    
    return !!connection;
  } catch (error) {
    console.error('Error checking connection status:', error);
    return false;
  }
};

export const createPost = async (req, res) => {
  try {
    // Determine media type based on provided data
    let mediaType = 'article'; // Default to article if only text
    if (req.body.image) {
      // Check if it's a video URL (simplified check)
      if (req.body.image.includes('.mp4') || req.body.image.includes('.webm') || req.body.image.includes('.ogg') || 
          req.body.image.includes('.mov') || req.body.image.includes('.avi') || req.body.image.includes('.wmv')) {
        mediaType = 'video';
      } else {
        mediaType = 'image';
      }
    }
    
    // If mediaType is explicitly provided, use it
    if (req.body.mediaType) {
      mediaType = req.body.mediaType;
    }
    
    const post = await Post.create({ 
      author: req.user._id, 
      content: req.body.content,
      image: req.body.image, // URL to the image or video
      mediaType: mediaType
    });
    
    // Populate author details including profile image and verification status
    await post.populate('author', 'name headline profileImage isVerified');
    
    // For a newly created post, the author is always connected to themselves
    const isAuthorConnected = true;
    
    // Format the response to match what the frontend expects
    const formattedPost = {
      id: post._id,
      author: post.author?.name || 'Unknown User',
      role: post.author?.headline || 'User',
      content: post.content,
      likes: post.likes.length,
      comments: post.comments.length,
      commentDetails: [], // New posts have no comments initially
      shares: 0, // We don't have shares yet
      timestamp: formatTimeAgo(post.createdAt),
      image: post.image || null,
      mediaType: post.mediaType || 'article',
      isConnected: isAuthorConnected, // The author is always connected to their own posts
      authorId: post.author._id, // Add author ID for delete functionality
      profileImage: post.author?.profileImage || null, // Add profile image
      isLiked: true, // The author of a post automatically likes it
      isVerified: post.author?.isVerified || false // Add verification status
    };
    
    // Invalidate feed cache for all users (simplified approach)
    // In a production environment, you might want to be more selective
    if (redisClient && redisClient.isOpen) {
      try {
        const keys = await redisClient.keys('feed:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    res.status(201).json({
      data: formattedPost
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name headline profileImage isVerified')
      .populate('comments.author', 'name profileImage isVerified');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    const isAuthorConnected = await checkConnectionStatus(req.user._id, post.author._id);
    
    // Format post for frontend
    const formattedPost = {
      ...post.toObject(),
      id: post._id,
      author: post.author?.name || 'Unknown User',
      role: post.author?.headline || 'User',
      content: post.content,
      likes: post.likes.length,
      comments: post.comments.length,
      commentDetails: post.comments.map(comment => ({
        id: comment._id,
        author: comment.author?.name || 'Unknown User',
        authorId: comment.author?._id || null, // Add authorId
        profileImage: comment.author?.profileImage || null,
        text: comment.text,
        createdAt: formatTimeAgo(comment.createdAt),
        isVerified: comment.author?.isVerified || false // Add verification status
      })),
      shares: 0, // We don't have shares yet
      timestamp: formatTimeAgo(post.createdAt),
      image: post.image || null,
      mediaType: post.mediaType || 'article',
      isConnected: isAuthorConnected, // Set based on actual connection status
      profileImage: post.author?.profileImage || null, // Add profile image
      isLiked: post.likes.includes(req.user._id), // Add isLiked property
      isVerified: post.author?.isVerified || false // Add verification status
    };
    
    res.json({
      data: formattedPost
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    console.log('=== LIKE POST BACKEND START ===');
    console.log('Post ID:', req.params.postId);
    console.log('User ID:', req.user._id);
    
    // First, find the post to check if the user has already liked it
    const post = await Post.findById(req.params.postId);
    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log('Post found, current likes:', post.likes);
    
    let updatedPost;
    let wasLiked = false;
    
    // Check if the user has already liked the post
    const isCurrentlyLiked = (post.likes || []).includes(req.user._id);
    console.log('Is currently liked:', isCurrentlyLiked);
    
    if (isCurrentlyLiked) {
      // If already liked, remove the like (unlike)
      console.log('Removing like...');
      updatedPost = await Post.findByIdAndUpdate(
        req.params.postId, 
        { $pull: { likes: req.user._id } }, 
        { new: true }
      ).populate('author', 'name headline profileImage isVerified')
       .populate('comments.author', 'name profileImage isVerified');
    } else {
      // If not liked, add the like
      console.log('Adding like...');
      updatedPost = await Post.findByIdAndUpdate(
        req.params.postId, 
        { $addToSet: { likes: req.user._id } }, 
        { new: true }
      ).populate('author', 'name headline profileImage isVerified')
       .populate('comments.author', 'name profileImage isVerified');
      wasLiked = true;
    }
    
    console.log('Updated post likes:', updatedPost?.likes);
    
    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create notification for the post author if it's a like action
    if (wasLiked) {
      // Get the user who liked the post
      const likingUser = await User.findById(req.user._id);
      if (likingUser && post.author.toString() !== req.user._id.toString()) {
        const message = `${likingUser.name} liked your post`;
        await createNotification(
          post.author,
          'like',
          message,
          req.user._id,
          post._id,
          `/feed?post=${post._id}`
        );
      }
    }
    
    // Invalidate feed cache for all users (similar to deletePost)
    if (redisClient && redisClient.isOpen) {
      try {
        // Get all keys that match the feed pattern
        const keys = await redisClient.keys('feed:*');
        console.log('Found cache keys to delete:', keys);
        
        // Delete all feed cache keys
        if (keys.length > 0) {
          const result = await redisClient.del(keys);
          console.log('Cache deletion result:', result);
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    const isAuthorConnected = await checkConnectionStatus(req.user._id, updatedPost.author._id);
    
    // Format the response to match what the frontend expects
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id,
      likes: (updatedPost.likes || []).length,
      comments: (updatedPost.comments || []).length,
      commentDetails: (updatedPost.comments || []).map(comment => ({
        id: comment._id,
        author: comment.author?.name || 'Unknown User',
        authorId: comment.author?._id || null, // Add authorId
        profileImage: comment.author?.profileImage || null,
        text: comment.text,
        createdAt: formatTimeAgo(comment.createdAt),
        isVerified: comment.author?.isVerified || false // Add verification status
      })),
      shares: 0, // We don't have shares yet
      timestamp: formatTimeAgo(updatedPost.createdAt),
      isConnected: isAuthorConnected, // Set based on actual connection status
      authorId: updatedPost.author._id, // Add author ID for delete functionality
      profileImage: updatedPost.author.profileImage || null, // Add profile image
      isLiked: (updatedPost.likes || []).includes(req.user._id), // Add isLiked property
      isVerified: updatedPost.author?.isVerified || false // Add verification status
    };
    
    console.log('Sending response:', formattedPost);
    console.log('=== LIKE POST BACKEND SUCCESS ===');
    
    res.json({
      data: formattedPost
    });
  } catch (error) {
    console.error('=== LIKE POST BACKEND ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

export const commentPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: { author: req.user._id, text: req.body.text } } },
      { new: true }
    ).populate('author', 'name headline profileImage isVerified')
     .populate('comments.author', 'name profileImage isVerified');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create notification for the post author
    const commentingUser = await User.findById(req.user._id);
    if (commentingUser && post.author.toString() !== req.user._id.toString()) {
      const message = `${commentingUser.name} commented on your post`;
      await createNotification(
        post.author,
        'comment',
        message,
        req.user._id,
        post._id,
        `/feed?post=${post._id}`
      );
    }
    
    // Invalidate feed cache for all users (similar to deletePost)
    if (redisClient && redisClient.isOpen) {
      try {
        // Get all keys that match the feed pattern
        const keys = await redisClient.keys('feed:*');
        console.log('Found cache keys to delete:', keys);
        
        // Delete all feed cache keys
        if (keys.length > 0) {
          const result = await redisClient.del(keys);
          console.log('Cache deletion result:', result);
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    const isAuthorConnected = false; // No connection system
    
    // Format the response to match what the frontend expects
    const formattedPost = {
      ...post.toObject(),
      id: post._id,
      likes: post.likes.length,
      comments: post.comments.length,
      commentDetails: post.comments.map(comment => ({
        id: comment._id,
        author: comment.author?.name || 'Unknown User',
        authorId: comment.author?._id || null, // Add authorId
        profileImage: comment.author?.profileImage || null,
        text: comment.text,
        createdAt: formatTimeAgo(comment.createdAt),
        isVerified: comment.author?.isVerified || false // Add verification status
      })),
      shares: 0, // We don't have shares yet
      timestamp: formatTimeAgo(post.createdAt),
      isConnected: isAuthorConnected, // Set based on actual connection status
      authorId: post.author._id, // Add author ID for delete functionality
      profileImage: post.author.profileImage || null, // Add profile image
      isLiked: post.likes.includes(req.user._id), // Add isLiked property
      isVerified: post.author?.isVerified || false // Add verification status
    };
    
    res.json({
      data: formattedPost
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    console.log('Attempting to delete post:', req.params.postId);
    console.log('User ID from token:', req.user._id);
    
    // First, let's find the post to check if it exists
    const post = await Post.findById(req.params.postId);
    if (!post) {
      console.log('Post not found with ID:', req.params.postId);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log('Post found:', post);
    console.log('Post author ID:', post.author);
    console.log('User ID from token:', req.user._id);
    
    // Check if the user is authorized to delete this post
    if (post.author.toString() !== req.user._id.toString()) {
      console.log('User not authorized to delete this post');
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }
    
    // If authorized, delete the post
    await Post.findByIdAndDelete(req.params.postId);
    
    // Invalidate feed cache for all users more effectively
    if (redisClient && redisClient.isOpen) {
      try {
        // Get all keys that match the feed pattern
        const keys = await redisClient.keys('feed:*');
        console.log('Found cache keys to delete:', keys);
        
        // Delete all feed cache keys
        if (keys.length > 0) {
          const result = await redisClient.del(keys);
          console.log('Cache deletion result:', result);
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: error.message });
  }
};

export const feed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If filter is 'following', get connected users first
    if (req.query.filter === 'following') {
      const connections = await Connection.find({
        $or: [
          { requester: req.user._id, status: 'accepted' },
          { recipient: req.user._id, status: 'accepted' }
        ]
      }).select('requester recipient').lean();
      
      const connectedUserIds = connections.map(conn => {
        return conn.requester.toString() === req.user._id.toString() 
          ? conn.recipient 
          : conn.requester;
      });
      
      connectedUserIds.push(req.user._id);
      query = { 'author': { $in: connectedUserIds } };
    }
    
    // OPTIMIZED: Get posts with minimal data, NO comment population
    const posts = await Post.find(query)
      .select('author content createdAt likes comments image mediaType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name headline profileImage isVerified')
      .lean();
    
    // OPTIMIZED: Single query for all connection statuses
    const authorIds = [...new Set(posts.map(post => post.author._id.toString()))];
    
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id, recipient: { $in: authorIds }, status: 'accepted' },
        { recipient: req.user._id, requester: { $in: authorIds }, status: 'accepted' }
      ]
    }).select('requester recipient').lean();
    
    const connectedUserIds = new Set([
      ...connections.map(conn => conn.requester.toString()),
      ...connections.map(conn => conn.recipient.toString()),
      req.user._id.toString()
    ]);
    
    // OPTIMIZED: Format posts without expensive operations
    const formattedPosts = posts.map((post) => ({
      id: post._id,
      author: post.author.name,
      role: post.author.headline || 'User',
      content: post.content,
      likes: post.likes.length,
      comments: post.comments.length,
      commentDetails: [], // Don't load comments upfront - load on demand
      shares: 0,
      timestamp: formatTimeAgo(post.createdAt),
      image: post.image || null,
      mediaType: post.mediaType || 'article',
      isConnected: connectedUserIds.has(post.author._id.toString()),
      authorId: post.author._id,
      profileImage: post.author.profileImage || null,
      isLiked: post.likes.some(like => like.toString() === req.user._id.toString()),
      isVerified: post.author.isVerified || false,
      isRepost: false,
      originalPost: null
    }));
    
    res.json({
      data: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: formattedPosts.length === limit
      }
    });
  } catch (error) {
    console.error('Error in feed function:', error);
    res.status(500).json({ message: error.message });
  }
};
export const repostPost = async (req, res) => {
  try {
    const { postId: originalPostId } = req.params;
    const { repostComment } = req.body;
    
    // Find the original post
    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }
    
    // Check if the user is trying to repost their own post
    if (originalPost.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot repost your own post' });
    }
    
    // Check if user has already reposted this post
    const existingRepost = await Post.findOne({
      author: req.user._id,
      originalPost: originalPostId
    });
    
    if (existingRepost) {
      return res.status(400).json({ message: 'You have already reposted this post' });
    }
    
    // Create a new repost
    const repost = await Post.create({
      author: req.user._id,
      content: repostComment || originalPost.content || '', // Use comment if provided, otherwise original content
      originalPost: originalPostId,
      // Copy image and mediaType from original post
      image: originalPost.image,
      mediaType: originalPost.mediaType
    });
    
    // Add the current user to the original post's reposts array
    await Post.findByIdAndUpdate(originalPostId, {
      $addToSet: { reposts: req.user._id }
    });
    
    // Create notification for the original post author
    const repostingUser = await User.findById(req.user._id);
    if (repostingUser) {
      const message = `${repostingUser.name} reposted your post`;
      await createNotification(
        originalPost.author,
        'repost',
        message,
        req.user._id,
        originalPost._id,
        `/feed?post=${originalPost._id}`
      );
    }
    
    // Populate necessary data
    await repost.populate('author', 'name headline profileImage isVerified');
    await repost.populate({
      path: 'originalPost',
      populate: [
        { path: 'author', select: 'name headline profileImage isVerified' },
        { path: 'comments.author', select: 'name profileImage isVerified' }
      ]
    });
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    const isAuthorConnected = await checkConnectionStatus(req.user._id, repost.author._id);
    const isOriginalAuthorConnected = await checkConnectionStatus(req.user._id, repost.originalPost.author._id);
    
    // Format the response
    const formattedRepost = {
      id: repost._id,
      author: repost.author?.name || 'Unknown User',
      role: repost.author?.headline || 'User',
      content: repost.content,
      likes: repost.likes.length,
      comments: repost.comments.length,
      commentDetails: [], // New reposts have no comments initially
      shares: repost.reposts.length,
      timestamp: formatTimeAgo(repost.createdAt),
      image: repost.image || null,
      mediaType: repost.mediaType || 'article',
      isConnected: isAuthorConnected,
      authorId: repost.author._id,
      profileImage: repost.author?.profileImage || null,
      isLiked: true, // The author of a repost automatically likes it
      isVerified: repost.author?.isVerified || false,
      isRepost: true,
      originalPost: repost.originalPost ? {
        id: repost.originalPost._id,
        author: repost.originalPost.author?.name || 'Unknown User',
        role: repost.originalPost.author?.headline || 'User',
        content: repost.originalPost.content,
        likes: repost.originalPost.likes.length,
        comments: repost.originalPost.comments.length,
        commentDetails: repost.originalPost.comments.map(comment => ({
          id: comment._id,
          author: comment.author?.name || 'Unknown User',
          authorId: comment.author?._id || null,
          profileImage: comment.author?.profileImage || null,
          text: comment.text,
          createdAt: formatTimeAgo(comment.createdAt),
          isVerified: comment.author?.isVerified || false
        })) || [],
        shares: repost.originalPost.reposts.length,
        timestamp: formatTimeAgo(repost.originalPost.createdAt),
        image: repost.originalPost.image || null,
        mediaType: repost.originalPost.mediaType || 'article',
        authorId: repost.originalPost.author._id,
        profileImage: repost.originalPost.author?.profileImage || null,
        isConnected: isOriginalAuthorConnected,
        isLiked: repost.originalPost.likes.includes(req.user._id),
        isVerified: repost.originalPost.author?.isVerified || false
      } : null
    };
    
    res.status(201).json({
      data: formattedRepost
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    console.log('=== DELETE COMMENT DEBUG INFO ===');
    console.log('Full req.params:', req.params);
    console.log('postId from params:', postId);
    console.log('commentId from params:', commentId);
    console.log('req.user._id:', req.user._id);
    
    // Find the post and check if the comment exists
    console.log('Attempting to find post with ID:', postId);
    const post = await Post.findById(postId);
    console.log('Post lookup result:', post ? 'Found' : 'Not found');
    
    if (!post) {
      console.log('Post not found with ID:', postId);
      return res.status(404).json({ 
        message: 'Post not found',
        debug: {
          requestedPostId: postId,
          userId: req.user._id
        }
      });
    }
    
    console.log('Post found:', post._id);
    console.log('Number of comments in post:', post.comments.length);
    console.log('Comments:', post.comments.map(c => ({ id: c._id.toString(), author: c.author.toString() })));
    
    // Find the comment index - try multiple matching approaches
    let commentIndex = -1;
    let foundComment = null;
    
    for (let i = 0; i < post.comments.length; i++) {
      const comment = post.comments[i];
      const commentIdStr = comment._id.toString();
      
      // Exact match
      if (commentIdStr === commentId) {
        commentIndex = i;
        foundComment = comment;
        console.log(`Exact match found at index ${i}`);
        break;
      }
      
      // Partial match (in case of ID formatting issues)
      if (commentIdStr.includes(commentId) || commentId.includes(commentIdStr)) {
        commentIndex = i;
        foundComment = comment;
        console.log(`Partial match found at index ${i}`);
        break;
      }
    }
    
    console.log('Comment index found:', commentIndex);
    
    if (commentIndex === -1) {
      console.log('Comment not found with ID:', commentId);
      return res.status(404).json({ 
        message: 'Comment not found',
        debug: {
          requestedId: commentId,
          availableComments: post.comments.map(c => c._id.toString())
        }
      });
    }
    
    // Get the comment to check authorization
    const comment = foundComment || post.comments[commentIndex];
    
    // Check if the user is authorized to delete this comment
    // Either the post author or the comment author can delete the comment
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    
    console.log('Authorization check:');
    console.log('- Post author:', post.author.toString());
    console.log('- Current user:', req.user._id.toString());
    console.log('- Comment author:', comment.author.toString());
    console.log('- Is post author:', isPostAuthor);
    console.log('- Is comment author:', isCommentAuthor);
    
    if (!isPostAuthor && !isCommentAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }
    
    // Remove the comment using pull method
    post.comments.pull(comment._id); // Use the actual comment ID from the database
    await post.save();
    
    // Invalidate feed cache for all users (similar to deletePost)
    if (redisClient && redisClient.isOpen) {
      try {
        // Get all keys that match the feed pattern
        const keys = await redisClient.keys('feed:*');
        console.log('Found cache keys to delete:', keys);
        
        // Delete all feed cache keys
        if (keys.length > 0) {
          const result = await redisClient.del(keys);
          console.log('Cache deletion result:', result);
          // Add a small delay to ensure cache invalidation has completed
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.log('No cache keys found to delete');
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    // Repopulate the post to get updated data
    await post.populate('author', 'name headline profileImage isVerified');
    await post.populate('comments.author', 'name profileImage isVerified');
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    const isAuthorConnected = await checkConnectionStatus(req.user._id, post.author._id);
    
    // Format the response to match what the frontend expects
    const formattedPost = {
      ...post.toObject(),
      id: post._id,
      likes: post.likes.length,
      comments: post.comments.length,
      commentDetails: post.comments.map(comment => ({
        id: comment._id,
        author: comment.author?.name || 'Unknown User',
        authorId: comment.author?._id || null, // Add authorId
        profileImage: comment.author?.profileImage || null,
        text: comment.text,
        createdAt: formatTimeAgo(comment.createdAt),
        isVerified: comment.author?.isVerified || false // Add verification status
      })),
      shares: 0, // We don't have shares yet
      timestamp: formatTimeAgo(post.createdAt),
      isConnected: isAuthorConnected, // Set based on actual connection status
      authorId: post.author._id, // Add author ID for delete functionality
      profileImage: post.author.profileImage || null, // Add profile image
      isLiked: post.likes.includes(req.user._id), // Add isLiked property
      isVerified: post.author?.isVerified || false // Add verification status
    };
    
    res.json({
      data: formattedPost
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  
  return Math.floor(seconds) + 's ago';
}

// New function to get posts by user ID
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Get the current user to check connections
    const currentUser = await User.findById(req.user._id);
    // Get both original posts and reposts by the user
    const posts = await Post.find({ 
      author: userId
    })
      .sort({ createdAt: -1 })
      .populate('author', 'name headline profileImage isVerified')
      .populate('comments.author', 'name profileImage isVerified')
      .populate({
        path: 'originalPost',
        populate: [
          { path: 'author', select: 'name headline profileImage isVerified' },
          { path: 'comments.author', select: 'name profileImage isVerified' }
        ]
      });
    
    // Format posts for frontend
    const formattedPosts = await Promise.all(posts.map(async (post) => {
      const isAuthorConnected = await checkConnectionStatus(req.user._id, post.author._id);
      
      // Check if this is a repost
      const isRepost = !!post.originalPost;
      
      // Format the post based on whether it's a repost or original post
      const formattedPost = {
        ...post.toObject(),
        id: post._id,
        author: post.author?.name || 'Unknown User',
        role: post.author?.headline || 'User',
        content: post.content,
        likes: post.likes.length,
        comments: post.comments.length,
        commentDetails: post.comments.map(comment => ({
          id: comment._id,
          author: comment.author?.name || 'Unknown User',
          authorId: comment.author?._id || null,
          profileImage: comment.author?.profileImage || null,
          text: comment.text,
          createdAt: formatTimeAgo(comment.createdAt),
          isVerified: comment.author?.isVerified || false
        })),
        shares: post.reposts?.length || 0,
        timestamp: formatTimeAgo(post.createdAt),
        image: post.image || null,
        mediaType: post.mediaType || 'article',
        isConnected: isAuthorConnected,
        authorId: post.author._id,
        profileImage: post.author.profileImage || null,
        isLiked: post.likes.includes(req.user._id),
        isVerified: post.author?.isVerified || false,
        // Add repost information if this is a repost
        isRepost: isRepost,
        originalPost: isRepost ? {
          id: post.originalPost._id,
          author: post.originalPost.author?.name || 'Unknown User',
          role: post.originalPost.author?.headline || 'User',
          content: post.originalPost.content,
          likes: post.originalPost.likes.length,
          comments: post.originalPost.comments.length,
          commentDetails: post.originalPost.comments.map(comment => ({
            id: comment._id,
            author: comment.author?.name || 'Unknown User',
            authorId: comment.author?._id || null,
            profileImage: comment.author?.profileImage || null,
            text: comment.text,
            createdAt: formatTimeAgo(comment.createdAt),
            isVerified: comment.author?.isVerified || false
          })) || [],
          shares: post.originalPost.reposts?.length || 0,
          timestamp: formatTimeAgo(post.originalPost.createdAt),
          image: post.originalPost.image || null,
          mediaType: post.originalPost.mediaType || 'article',
          authorId: post.originalPost.author?._id || null,
          profileImage: post.originalPost.author?.profileImage || null,
          isConnected: await checkConnectionStatus(req.user._id, post.originalPost.author?._id),
          isLiked: post.originalPost.likes.includes(req.user._id),
          isVerified: post.originalPost.author?.isVerified || false
        } : null
      };
      
      return formattedPost;
    }));
    
    res.json({
      data: formattedPosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
