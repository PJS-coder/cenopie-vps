import { v2 as cloudinary } from 'cloudinary';

export function configCloudinary() {
  console.log('Configuring Cloudinary with:');
  console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('- API key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
  console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  return cloudinary;
}