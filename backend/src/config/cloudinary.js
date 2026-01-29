import { v2 as cloudinary } from 'cloudinary';

export function configCloudinary() {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const IS_DISABLED = process.env.CLOUDINARY_DISABLED === 'true';
  
  if (IS_DISABLED) {
    if (!IS_PRODUCTION) {
      console.log('⚠️  Cloudinary is disabled - file uploads will not work');
    }
    return null;
  }
  
  if (!IS_PRODUCTION) {
    console.log('Configuring Cloudinary with:');
    console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('- API key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
    console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
  }
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  return cloudinary;
}