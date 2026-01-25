import mongoose from 'mongoose';
import Banner from '../src/models/Banner.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleBanners = [
  {
    title: 'Showcase Your Best Work',
    description: 'Join thousands of developers showcasing their amazing projects. Get discovered by top companies!',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop&crop=center',
    link: '/showcase',
    buttonText: 'Start Showcasing',
    position: 'top',
    priority: 10,
    targetAudience: 'all',
    isActive: true
  },
  {
    title: 'Developer Competition 2024',
    description: 'Win amazing prizes in our annual developer competition. Submit your best projects now!',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=400&fit=crop&crop=center',
    link: '/showcase/competition',
    buttonText: 'Join Competition',
    position: 'middle',
    priority: 8,
    targetAudience: 'users',
    isActive: true,
    endDate: new Date('2024-12-31')
  },
  {
    title: 'Featured Projects',
    description: 'Discover the most innovative projects from our community. Get inspired and learn new techniques.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop&crop=center',
    link: '/showcase/featured',
    buttonText: 'Explore Projects',
    position: 'bottom',
    priority: 5,
    targetAudience: 'all',
    isActive: true
  }
];

async function seedBanners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing banners
    await Banner.deleteMany({});
    console.log('Cleared existing banners');

    // Insert sample banners
    const banners = await Banner.insertMany(sampleBanners);
    console.log(`Created ${banners.length} sample banners`);

    console.log('Banner seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding banners:', error);
    process.exit(1);
  }
}

seedBanners();