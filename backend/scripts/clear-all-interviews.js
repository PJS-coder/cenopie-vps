#!/usr/bin/env node

/**
 * Clear All Interviews Script
 * This script deletes all interviews from the database
 * Use with caution - this action cannot be undone!
 */

import mongoose from 'mongoose';
import Interview from '../src/models/Interview.js';
import { configCloudinary } from '../src/config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
configCloudinary();

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

async function clearAllInterviews() {
  try {
    log.info('🗑️  Starting interview cleanup process...');
    
    // Connect to MongoDB
    log.info('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('✅ Connected to MongoDB');
    
    // Get all interviews first to check for video URLs
    log.info('🔍 Finding all interviews...');
    const interviews = await Interview.find({});
    log.info(`📋 Found ${interviews.length} interviews to delete`);
    
    if (interviews.length === 0) {
      log.warning('No interviews found to delete');
      await mongoose.disconnect();
      return;
    }
    
    // Count interviews by status
    const statusCounts = {};
    const videoUrls = [];
    
    interviews.forEach(interview => {
      const status = interview.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (interview.fullRecordingUrl) {
        videoUrls.push(interview.fullRecordingUrl);
      }
    });
    
    log.info('📊 Interview breakdown by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      log.info(`  • ${status}: ${count}`);
    });
    
    log.info(`🎥 Found ${videoUrls.length} interviews with video recordings`);
    
    // Ask for confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirm = await new Promise((resolve) => {
      rl.question(`${colors.yellow}⚠️  Are you sure you want to delete ALL ${interviews.length} interviews? This cannot be undone! (yes/no): ${colors.reset}`, resolve);
    });
    
    rl.close();
    
    if (confirm.toLowerCase() !== 'yes') {
      log.warning('Operation cancelled by user');
      await mongoose.disconnect();
      return;
    }
    
    // Delete video recordings from Cloudinary first
    if (videoUrls.length > 0) {
      log.info('🗑️  Deleting video recordings from Cloudinary...');
      let deletedVideos = 0;
      let failedVideos = 0;
      
      for (const videoUrl of videoUrls) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = videoUrl.split('/');
          const fileWithExtension = urlParts[urlParts.length - 1];
          const publicId = `interview-videos/${fileWithExtension.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          deletedVideos++;
          
          if (deletedVideos % 10 === 0) {
            log.info(`  Deleted ${deletedVideos}/${videoUrls.length} videos...`);
          }
        } catch (error) {
          failedVideos++;
          log.warning(`  Failed to delete video: ${error.message}`);
        }
      }
      
      log.success(`✅ Deleted ${deletedVideos} videos from Cloudinary`);
      if (failedVideos > 0) {
        log.warning(`⚠️  Failed to delete ${failedVideos} videos`);
      }
    }
    
    // Delete all interviews from database
    log.info('🗑️  Deleting all interviews from database...');
    const deleteResult = await Interview.deleteMany({});
    
    log.success(`✅ Successfully deleted ${deleteResult.deletedCount} interviews from database`);
    
    // Verify deletion
    const remainingCount = await Interview.countDocuments({});
    if (remainingCount === 0) {
      log.success('🎉 All interviews have been successfully deleted!');
    } else {
      log.warning(`⚠️  ${remainingCount} interviews still remain in database`);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    log.success('📊 Disconnected from MongoDB');
    
    log.info('');
    log.success('🎉 Interview cleanup completed successfully!');
    log.info('📋 Summary:');
    log.info(`  • Database interviews deleted: ${deleteResult.deletedCount}`);
    log.info(`  • Cloudinary videos deleted: ${videoUrls.length > 0 ? deletedVideos : 0}`);
    log.info('  • Database is now clean and ready for new interviews');
    
  } catch (error) {
    log.error('❌ Error during interview cleanup:');
    log.error(error.message);
    
    if (error.stack) {
      console.log('\nStack trace:');
      console.log(error.stack);
    }
    
    // Ensure we disconnect even on error
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      log.error('Failed to disconnect from MongoDB:', disconnectError.message);
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log.warning('\n🛑 Process interrupted by user');
  try {
    await mongoose.disconnect();
    log.info('📊 Disconnected from MongoDB');
  } catch (error) {
    log.error('Error disconnecting:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.warning('\n🛑 Process terminated');
  try {
    await mongoose.disconnect();
    log.info('📊 Disconnected from MongoDB');
  } catch (error) {
    log.error('Error disconnecting:', error.message);
  }
  process.exit(0);
});

// Run the cleanup
clearAllInterviews();