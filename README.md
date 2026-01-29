# Cenopie - Professional Social Network

A modern professional networking platform built with Next.js and Node.js, featuring job applications, company profiles, interviews, and social networking capabilities.

## 🚀 Features

- **User Profiles**: Complete professional profiles with skills, experience, and portfolio
- **Job Board**: Post and apply for jobs with integrated application tracking
- **Company Profiles**: Dedicated company pages with job postings and team information
- **Interview System**: Secure video interview platform with violation detection
- **Social Feed**: Professional networking with posts, comments, and connections
- **Real-time Messaging**: Direct messaging between users and companies
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Showcase Section**: Highlight top talent and achievements

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern UI components
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **Cloudinary** - Media storage and optimization
- **Redis** - Caching and session management
- **Passport.js** - Authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Redis (optional)
- Cloudinary account

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd cenopie-production-main
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Configuration**

Backend (`.env.production`):
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLIENT_ORIGIN=http://localhost:3000
```

Frontend (`.env.production`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. **Start the application**
```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run build
npm start
```

## 🔧 Development

```bash
# Backend development
cd backend
npm run dev

# Frontend development
cd frontend
npm run dev
```

## 📁 Project Structure

```
cenopie-production-main/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middleware
│   │   ├── config/         # Configuration files
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.IO handlers
│   │   └── utils/          # Utility functions
│   └── scripts/            # Database scripts
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   └── styles/           # Global styles
└── scripts/              # Deployment scripts
```

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (User, Company, HR, Admin)
- Interview violation detection system
- Secure file upload with validation
- Rate limiting and CORS protection

## 🚀 Deployment

The application is configured for production deployment with:
- PM2 process management
- Nginx reverse proxy
- SSL/TLS encryption
- MongoDB Atlas integration
- Cloudinary CDN

Use the deployment script:
```bash
./deploy.sh
```

## 📊 Key Features

### Interview System
- Secure fullscreen interview environment
- Real-time violation detection
- Video recording and upload
- Automatic submission on violations
- HR review and scoring system

### Social Networking
- Professional posts and interactions
- Connection requests and networking
- Real-time notifications
- Direct messaging system

### Job Management
- Company job postings
- User applications tracking
- Interview scheduling
- Application status management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for professional networking**