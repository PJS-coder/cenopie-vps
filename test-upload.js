// Simple test to check if the upload endpoint is working
import fs from 'fs';

// Create a simple test image (1x1 pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

fs.writeFileSync('test.png', testImageBuffer);
console.log('Test image created: test.png');

// Test the upload endpoint
const testUpload = async () => {
  try {
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;
    
    const form = new FormData();
    form.append('image', fs.createReadStream('test.png'), {
      filename: 'test.png',
      contentType: 'image/png'
    });

    console.log('Testing upload endpoint...');
    const response = await fetch('http://localhost:4000/api/showcase-banners/admin/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_token'
      },
      body: form
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    // Clean up
    fs.unlinkSync('test.png');
  } catch (error) {
    console.error('Test error:', error);
  }
};

testUpload();