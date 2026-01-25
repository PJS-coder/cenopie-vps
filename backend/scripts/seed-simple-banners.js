import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShowcaseBanner from '../src/models/ShowcaseBanner.js';

dotenv.config();

const sampleBanners = [
  {
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    order: 1,
    isActive: true
  },
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
    order: 2,
    isActive: true
  },
  {
    image: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=800&h=400&fit=crop',
    order: 3,
    isActive: true
  }
];

const seedSimpleBanners = async () => {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing showcase banners...');
    await ShowcaseBanner.deleteMany({});

    console.log('🌱 Seeding simple showcase banners...');
    const banners = await ShowcaseBanner.insertMany(sampleBanners);
    
    console.log(`✅ Successfully seeded ${banners.length} showcase banners:`);
    banners.forEach((banner, index) => {
      console.log(`   ${index + 1}. Order: ${banner.order}, Active: ${banner.isActive}`);
    });

    console.log('🎉 Simple banner seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding simple banners:', error);
    process.exit(1);
  }
};

seedSimpleBanners();