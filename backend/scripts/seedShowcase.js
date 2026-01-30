import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Showcase from '../src/models/Showcase.js';
import SponsoredBanner from '../src/models/SponsoredBanner.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedShowcaseData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find a user to be the author (or create one)
    let user = await User.findOne({ email: 'pjs89079@gmail.com' });
    if (!user) {
      console.log('❌ User not found. Please create a user first.');
      return;
    }

    // Clear existing data
    await Showcase.deleteMany({});
    await SponsoredBanner.deleteMany({});
    console.log('🗑️ Cleared existing showcase data');

    // Sample showcases
    const showcases = [
      {
        title: "Spheres",
        description: "Rediscover social media & networking with a fresh perspective on digital connections. A modern social platform built with React and Node.js.",
        image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center",
        category: "Web Development",
        author: user._id,
        tags: ["React", "Node.js", "Social Media", "Networking"],
        projectUrl: "https://spheres-demo.com",
        githubUrl: "https://github.com/example/spheres",
        technologies: ["React", "Node.js", "MongoDB", "Socket.io"],
        views: 1250,
        likes: []
      },
      {
        title: "FinAI: Connect you...",
        description: "Your Smart Money Coach. Don't just track your expenses, understand them with AI-powered insights. Machine learning meets personal finance.",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=center",
        category: "AI/ML",
        author: user._id,
        tags: ["AI", "Finance", "Machine Learning", "React Native"],
        projectUrl: "https://finai-demo.com",
        githubUrl: "https://github.com/example/finai",
        technologies: ["Python", "TensorFlow", "React Native", "FastAPI"],
        views: 980,
        likes: []
      },
      {
        title: "Pennywise",
        description: "Your new PET (Personal Expense Tracker) - Track your spending habits and achieve financial freedom with beautiful visualizations.",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=center",
        category: "Mobile App",
        author: user._id,
        tags: ["Flutter", "Finance", "Mobile", "Expense Tracking"],
        projectUrl: "https://pennywise-app.com",
        githubUrl: "https://github.com/example/pennywise",
        technologies: ["Flutter", "Dart", "Firebase", "Chart.js"],
        views: 756,
        likes: []
      },
      {
        title: "Figurably",
        description: "Smart financial planning and budgeting made simple for everyone. Intuitive interface with powerful analytics and forecasting.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center",
        category: "Web Development",
        author: user._id,
        tags: ["Vue.js", "Finance", "Planning", "Analytics"],
        projectUrl: "https://figurably.com",
        githubUrl: "https://github.com/example/figurably",
        technologies: ["Vue.js", "Express", "PostgreSQL", "D3.js"],
        views: 642,
        likes: []
      },
      {
        title: "EcoTracker",
        description: "Monitor your carbon footprint and make sustainable choices. Gamified approach to environmental consciousness.",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop&crop=center",
        category: "Mobile App",
        author: user._id,
        tags: ["React Native", "Environment", "Sustainability", "Gamification"],
        projectUrl: "https://ecotracker-app.com",
        githubUrl: "https://github.com/example/ecotracker",
        technologies: ["React Native", "Node.js", "MongoDB", "Maps API"],
        views: 523,
        likes: []
      },
      {
        title: "CodeCollab",
        description: "Real-time collaborative code editor with video chat. Perfect for pair programming and code reviews.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&crop=center",
        category: "Web Development",
        author: user._id,
        tags: ["WebRTC", "Collaboration", "Code Editor", "Real-time"],
        projectUrl: "https://codecollab.dev",
        githubUrl: "https://github.com/example/codecollab",
        technologies: ["React", "WebRTC", "Socket.io", "Monaco Editor"],
        views: 892,
        likes: []
      },
      {
        title: "MindfulMoments",
        description: "Meditation and mindfulness app with personalized sessions. AI-powered mood tracking and recommendations.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center",
        category: "Mobile App",
        author: user._id,
        tags: ["Flutter", "Wellness", "AI", "Meditation"],
        projectUrl: "https://mindfulmoments.app",
        githubUrl: "https://github.com/example/mindfulmoments",
        technologies: ["Flutter", "Python", "TensorFlow", "Firebase"],
        views: 445,
        likes: []
      },
      {
        title: "DataViz Pro",
        description: "Advanced data visualization platform for business intelligence. Interactive dashboards and real-time analytics.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center",
        category: "Data Science",
        author: user._id,
        tags: ["D3.js", "Analytics", "Business Intelligence", "Dashboards"],
        projectUrl: "https://datavizpro.com",
        githubUrl: "https://github.com/example/datavizpro",
        technologies: ["React", "D3.js", "Python", "PostgreSQL"],
        views: 678,
        likes: []
      },
      {
        title: "GameHub",
        description: "Multiplayer gaming platform with real-time matchmaking. Built with Unity and custom networking solution.",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop&crop=center",
        category: "Game Development",
        author: user._id,
        tags: ["Unity", "C#", "Multiplayer", "Gaming"],
        projectUrl: "https://gamehub.gg",
        githubUrl: "https://github.com/example/gamehub",
        technologies: ["Unity", "C#", "Photon", "Mirror Networking"],
        views: 1123,
        likes: []
      },
      {
        title: "DesignSystem Pro",
        description: "Comprehensive design system and component library. Streamline your design-to-development workflow.",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center",
        category: "UI/UX Design",
        author: user._id,
        tags: ["Design System", "Components", "Figma", "Storybook"],
        projectUrl: "https://designsystem.pro",
        githubUrl: "https://github.com/example/designsystem",
        technologies: ["React", "Storybook", "Figma API", "TypeScript"],
        views: 834,
        likes: []
      }
    ];

    // Create showcases
    const createdShowcases = await Showcase.insertMany(showcases);
    console.log(`✅ Created ${createdShowcases.length} showcases`);

    // Sample sponsored banners
    const banners = [
      {
        title: "Master Full-Stack Development",
        description: "Join our comprehensive bootcamp and become a full-stack developer in 6 months. Get job placement assistance!",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&crop=center",
        company: {
          name: "TechBootcamp Pro",
          logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop&crop=center",
          website: "https://techbootcamp.pro"
        },
        clickUrl: "https://techbootcamp.pro/fullstack-course",
        priority: 10,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        targetAudience: {
          categories: ["Web Development", "Mobile App"],
          locations: ["India", "Remote"]
        }
      },
      {
        title: "AI/ML Career Accelerator",
        description: "Transform your career with our AI/ML specialization program. Learn from industry experts and work on real projects.",
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop&crop=center",
        company: {
          name: "AI Academy",
          logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&h=100&fit=crop&crop=center",
          website: "https://aiacademy.com"
        },
        clickUrl: "https://aiacademy.com/ml-program",
        priority: 9,
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        targetAudience: {
          categories: ["AI/ML", "Data Science"],
          locations: ["Global"]
        }
      },
      {
        title: "Design Excellence Workshop",
        description: "Elevate your UI/UX skills with our intensive design workshop. Portfolio review and mentorship included.",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop&crop=center",
        company: {
          name: "Design Masters",
          logo: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=100&h=100&fit=crop&crop=center",
          website: "https://designmasters.io"
        },
        clickUrl: "https://designmasters.io/workshop",
        priority: 8,
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        targetAudience: {
          categories: ["UI/UX Design"],
          locations: ["India", "Remote"]
        }
      }
    ];

    // Create sponsored banners
    const createdBanners = await SponsoredBanner.insertMany(banners);
    console.log(`✅ Created ${createdBanners.length} sponsored banners`);

    console.log('🎉 Showcase data seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding showcase data:', error);
    process.exit(1);
  }
};

// Run the script
seedShowcaseData();