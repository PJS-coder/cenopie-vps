# Cenopie - Social Networking Platform

A modern social networking platform built with Next.js, Node.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas connection
- npm or yarn

### Local Development

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start servers
cd backend && npm start
cd frontend && npm run dev
```

### Production Deployment

```bash
# Deploy all services
./deploy.sh

# Or deploy specific fixes
./fix-repost-feed-final.sh
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Production: https://cenopie.com

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Socket.IO, JWT, Redis
- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript
- **Infrastructure**: PM2, Nginx, Cloudinary, MongoDB Atlas

## 📱 Features

- User authentication and profiles
- Real-time messaging with Socket.IO
- Social feed with posts, reposts, and comments
- Job board and applications
- Company profiles and management
- File uploads with Cloudinary
- Advanced search functionality
- Mobile-responsive design
- Interview scheduling system
- Notification system

## 🔧 Recent Improvements

See [RECENT_IMPROVEMENTS.md](./RECENT_IMPROVEMENTS.md) for detailed information about:
- Repost feed fixes
- Mobile responsiveness enhancements
- Performance optimizations
- SEO improvements

## 🚀 Production Environment

- **Domain**: https://cenopie.com
- **Capacity**: 5,000-15,000 concurrent users
- **Database**: MongoDB Atlas with optimized indexes
- **Caching**: Redis for sessions and feed caching
- **CDN**: Cloudinary for media storage
- **Process Manager**: PM2 for service management

## 📊 System Management

```bash
# Check service status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor performance
./monitor-performance.sh
```

## 🐛 Troubleshooting

Common issues and solutions are documented in [RECENT_IMPROVEMENTS.md](./RECENT_IMPROVEMENTS.md#troubleshooting).

## 📝 Documentation

- [Recent Improvements](./RECENT_IMPROVEMENTS.md) - Latest fixes and enhancements
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment instructions