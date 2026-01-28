#!/usr/bin/env node

// Debug script to trace why repost 697a83f38dfb77e7bf17301e is not showing in feed

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env.production' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define Post schema
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  image: String,
  mediaType: { type: String, enum: ['image', 'video', 'article'], default: 'article' }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  headline: String,
  profileImage: String,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const debugRepostFeed = async () => {
  try {
    await connectDB();
    
    const repostId = '697a83f38dfb77e7bf17301e';
    
    console.log('\n🔍 DEBUGGING REPOST FEED ISSUE');
    console.log('================================');
    console.log(`Target Repost ID: ${repostId}`);
    
    // 1. Check if the specific repost exists
    console.log('\n1. Checking specific repost...');
    const specificRepost = await Post.findById(repostId)
      .populate('author', 'name email')
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name email'
        }
      });
    
    if (!specificRepost) {
      console.log('❌ Repost not found in database!');
      return;
    }
    
    console.log('✅ Repost found:');
    console.log(`   ID: ${specificRepost._id}`);
    console.log(`   Author: ${specificRepost.author?.name || 'Unknown'}`);
    console.log(`   Content: "${specificRepost.content}"`);
    console.log(`   Has originalPost: ${!!specificRepost.originalPost}`);
    console.log(`   Created: ${specificRepost.createdAt}`);
    
    if (specificRepost.originalPost) {
      console.log(`   Original Post ID: ${specificRepost.originalPost._id}`);
      console.log(`   Original Author: ${specificRepost.originalPost.author?.name || 'Unknown'}`);
    }
    
    // 2. Simulate the exact feed query from the API
    console.log('\n2. Simulating feed API query...');
    
    const feedQuery = {};
    const feedPosts = await Post.find(feedQuery)
      .select('author content createdAt likes comments reposts image mediaType originalPost')
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name headline profileImage isVerified')
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name headline profileImage isVerified'
        }
      })
      .lean();
    
    console.log(`Found ${feedPosts.length} posts in feed query`);
    
    // 3. Check if our repost is in the results
    const repostInFeed = feedPosts.find(post => post._id.toString() === repostId);
    
    if (repostInFeed) {
      console.log('✅ Repost IS in feed query results');
      console.log('   Position in feed:', feedPosts.findIndex(post => post._id.toString() === repostId) + 1);
    } else {
      console.log('❌ Repost is NOT in feed query results');
      console.log('   This indicates a query or sorting issue');
    }
    
    // 4. Check the feed query with different sorting
    console.log('\n3. Testing different sorting methods...');
    
    const feedPostsById = await Post.find(feedQuery)
      .sort({ _id: -1 })
      .limit(20)
      .lean();
    
    const repostInFeedById = feedPostsById.find(post => post._id.toString() === repostId);
    console.log(`Sort by _id: ${repostInFeedById ? 'FOUND' : 'NOT FOUND'}`);
    
    const feedPostsByCreated = await Post.find(feedQuery)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const repostInFeedByCreated = feedPostsByCreated.find(post => post._id.toString() === repostId);
    console.log(`Sort by createdAt: ${repostInFeedByCreated ? 'FOUND' : 'NOT FOUND'}`);
    
    // 5. Check if there are any query filters that might exclude it
    console.log('\n4. Checking for potential exclusion reasons...');
    
    // Check if author exists
    if (!specificRepost.author) {
      console.log('❌ Repost has no author - this could cause exclusion');
    } else {
      console.log('✅ Repost has valid author');
    }
    
    // Check if originalPost exists (for reposts)
    if (specificRepost.originalPost && !specificRepost.originalPost._id) {
      console.log('❌ Repost references missing originalPost - this could cause exclusion');
    } else if (specificRepost.originalPost) {
      console.log('✅ Repost has valid originalPost reference');
    }
    
    // 6. Test the exact feed formatting logic
    console.log('\n5. Testing feed formatting logic...');
    
    const testPost = specificRepost.toObject ? specificRepost.toObject() : specificRepost;
    const isRepost = !!testPost.originalPost;
    
    console.log(`   isRepost calculation: ${isRepost}`);
    console.log(`   originalPost exists: ${!!testPost.originalPost}`);
    
    if (isRepost && testPost.originalPost) {
      console.log('✅ Repost should be formatted correctly');
    } else if (isRepost && !testPost.originalPost) {
      console.log('❌ Repost flag is true but originalPost is missing');
    }
    
    // 7. Check recent posts to see position
    console.log('\n6. Checking recent posts chronologically...');
    
    const recentPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id author content createdAt originalPost')
      .populate('author', 'name')
      .lean();
    
    console.log('Recent posts (newest first):');
    recentPosts.forEach((post, index) => {
      const isThisRepost = post._id.toString() === repostId;
      const marker = isThisRepost ? '👉' : '  ';
      const type = post.originalPost ? 'REPOST' : 'POST';
      console.log(`${marker} ${index + 1}. ${type} ${post._id} by ${post.author?.name || 'Unknown'} at ${post.createdAt}`);
    });
    
    // 8. Final diagnosis
    console.log('\n7. DIAGNOSIS');
    console.log('=============');
    
    if (!repostInFeed) {
      console.log('🔍 ISSUE IDENTIFIED: Repost exists but not returned by feed query');
      console.log('   Possible causes:');
      console.log('   1. Query limit is too small (currently 20)');
      console.log('   2. Sorting issue with createdAt vs _id');
      console.log('   3. Population/lean() affecting results');
      console.log('   4. Database index issues');
      
      // Check if it's a limit issue
      const allPosts = await Post.find({}).sort({ createdAt: -1 }).lean();
      const repostPosition = allPosts.findIndex(post => post._id.toString() === repostId);
      console.log(`   Repost position in ALL posts: ${repostPosition + 1} of ${allPosts.length}`);
      
      if (repostPosition >= 20) {
        console.log('   ❌ FOUND THE ISSUE: Repost is beyond the 20-post limit!');
        console.log('   🔧 SOLUTION: Increase limit or check why newer posts are pushing it down');
      }
    } else {
      console.log('✅ Repost is correctly returned by feed query');
      console.log('   The issue might be in frontend processing or display logic');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the debug
debugRepostFeed();