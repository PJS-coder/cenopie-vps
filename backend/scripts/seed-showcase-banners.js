import mongoose from 'mongoose';
import SponsoredBanner from '../src/models/SponsoredBanner.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleShowcaseBanners = [
  {
    title: 'Design Excellence Award',
    description: 'Showcase your best designs and win amazing prizes. Competition ends soon!',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=300&fit=crop&crop=center',
    buttonText: 'Join Competition',
    clickUrl: '/showcase/design-award',
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    priority: 10,
    targetAudience: 'all',
    isActive: true
  },
  {
    title: 'Developer Spotlight',
    description: 'Featured projects from our amazing developer community. Get inspired and learn new techniques!',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=300&fit=crop&crop=center',
    buttonText: 'Explore Projects',
    clickUrl: '/showcase/featured',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    priority: 8,
    targetAudience: 'users',
    isActive: true
  },
  {
    title: 'Innovation Challenge 2024',
    description: 'Join our monthly innovation challenge and showcase your creative solutions. Win cash prizes!',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&crop=center',
    buttonText: 'Start Building',
    clickUrl: '/showcase/innovation-challenge',
    backgroundColor: '#10B981',
    textColor: '#FFFFFF',
    priority: 9,
    targetAudience: 'all',
    isActive: true,
    endDate: new Date('2024-12-31')
  },
  {
    title: 'Company Showcase',
    description: 'Discover innovative projects from top companies. See what industry leaders are building.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=300&fit=crop&crop=center',
    buttonText: 'View Companies',
    clickUrl: '/showcase/companies',
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF',
    priority: 6,
    targetAudience: 'companies',
    isActive: true
  }
];

async function seedShowcaseBanners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing showcase banners
    await SponsoredBanner.deleteMany({});
    console.log('Cleared existing showcase banners');

    // Insert sample showcase banners
    const banners = await SponsoredBanner.insertMany(sampleShowcaseBanners);
    console.log(`Created ${banners.length} sample showcase banners`);

    console.log('Showcase banner seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding showcase banners:', error);
    process.exit(1);
  }
}

seedShowcaseBanners();