import { v2 as cloudinary } from 'cloudinary';

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer to upload
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} - The upload result from Cloudinary
 */
export async function uploadToCloudinary(buffer, options = {}) {
  // Check if Cloudinary is properly configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
      process.env.CLOUDINARY_API_KEY === 'your_api_key' ||
      process.env.CLOUDINARY_API_SECRET === 'your_api_secret') {
    throw new Error('Cloudinary is not properly configured. Please set up your Cloudinary credentials in the environment variables.');
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      timeout: 60000, // 60 seconds timeout
      ...options
    };
    
    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`File upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      })
      .end(buffer);
  });
}

/**
 * Deletes a file from Cloudinary by public ID
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - The deletion result from Cloudinary
 */
export async function deleteFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
  });
}