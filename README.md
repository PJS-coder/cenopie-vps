# Cenopie - Professional Networking Platform

A modern professional networking platform built with Next.js and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Environment Setup

Create `.env` files:

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/canopie
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:3000
PORT=4000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Running the Application

**Option 1: Using Scripts**
```bash
# Terminal 1 - Backend
./start-backend-local.sh

# Terminal 2 - Frontend  
./start-frontend-local.sh
```

**Option 2: Manual**
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

**Option 3: Production Deployment**

For production deployment, you can deploy directly to your hosting provider (cPanel, VPS, etc.) by:

1. Building the frontend: `npm run build` in the frontend directory
2. Uploading the built files to your web server
3. Setting up your Node.js backend with proper environment variables
4. Configuring your database connection

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Check Status
```bash
./check-status.sh
```

Access the app at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Features

### Backend
- User authentication (JWT)
- Posts with likes and comments
- Real-time updates (Socket.IO)
- File uploads (Cloudinary)
- Rate limiting and security

### Frontend
- Next.js 13+ with App Router
- Tailwind CSS styling
- Real-time notifications
- Responsive design
- Image optimization

## API Endpoints

### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts/feed` - Get user feed
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/comment` - Comment on a post

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Development

### Create Admin User
```bash
cd backend && node create-admin.js
```

### Project Structure
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── middlewares/   # Custom middleware
└── ...

frontend/
├── app/              # Next.js pages
├── components/       # React components
├── lib/             # Utilities and API
└── ...
```