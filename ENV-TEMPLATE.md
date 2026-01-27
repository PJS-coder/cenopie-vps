# 🔧 Environment Variables Template

This file contains all the environment variables needed for Cenopie deployment.

## 🚨 Important: Registration Control

**Registration is currently DISABLED by default** (`ALLOW_REGISTRATION=false`). This means:
- ✅ Existing users can log in
- ❌ New users cannot register
- 🔒 Platform is in closed beta mode

To enable registration later, change `ALLOW_REGISTRATION=false` to `ALLOW_REGISTRATION=true` in your environment files.

## 📁 File Structure

```
/var/www/cenopie-vps/
├── backend/
│   ├── .env.production      # Production backend config
│   ├── .env.local          # Development backend config
│   └── .env.example        # Template for developers
└── frontend/
    ├── .env.production     # Production frontend config
    ├── .env.local         # Development frontend config
    └── .env.local.example # Template for developers
```

## 🖥️ Backend Environment Variables

### Production: `backend/.env.production`

```bash
# Production Environment Variables
NODE_ENV=production
PORT=4000

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie

# Redis (optional for production)
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=true

# JWT Secrets (IMPORTANT: Change these for production)
JWT_SECRET=d243036c5c96f4af5fe4647c6f8b8bc900f81c5fb1d93c9a0f4284ddd9a0074314e8851f3093c149ea208b66c5edf362ba07393651deb335a08142c8c8c117bb
JWT_REFRESH_SECRET=4f0059a7c3afdcb9f277560e47b7a41fb3340a8bc65d2a1aa37828e41a9f4c5a88b6e033e5ee333566207505381604b2088a3a454904f718d70ce25024362f63

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=dutmqmbhm
CLOUDINARY_API_KEY=547334685142862
CLOUDINARY_API_SECRET=mVCX-G8H0lKsoTusQdyKwm-t-G8

# Application URLs
CLIENT_ORIGIN=https://cenopie.com
FRONTEND_URL=https://cenopie.com

# Launch Control (Closed Beta Mode)
ALLOW_REGISTRATION=false
LAUNCH_MODE=closed_beta

# Email Service (optional for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Cenopie <noreply@cenopie.com>

# Google OAuth (optional)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Service (optional)
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Development: `backend/.env.local`

```bash
# Local Development Environment Variables
NODE_ENV=development
PORT=4000

# Database (MongoDB Atlas - using your existing connection)
MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie

# JWT Secrets (using your existing ones for development)
JWT_SECRET=d243036c5c96f4af5fe4647c6f8b8bc900f81c5fb1d93c9a0f4284ddd9a0074314e8851f3093c149ea208b66c5edf362ba07393651deb335a08142c8c8c117bb
JWT_REFRESH_SECRET=4f0059a7c3afdcb9f277560e47b7a41fb3340a8bc65d2a1aa37828e41a9f4c5a88b6e033e5ee333566207505381604b2088a3a454904f718d70ce25024362f63

# Cloudinary (using your existing configuration)
CLOUDINARY_CLOUD_NAME=dutmqmbhm
CLOUDINARY_API_KEY=547334685142862
CLOUDINARY_API_SECRET=mVCX-G8H0lKsoTusQdyKwm-t-G8

# Application URLs - Local development
CLIENT_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Redis (disabled for local development)
REDIS_DISABLED=true

# Launch Control (Closed Beta Mode - Registration disabled by default)
ALLOW_REGISTRATION=false
LAUNCH_MODE=closed_beta
```

## 🌐 Frontend Environment Variables

### Production: `frontend/.env.production`

```bash
# Production Environment Variables for Frontend
NODE_ENV=production

# API Configuration - Use same domain for API calls with /api path
NEXT_PUBLIC_API_URL=https://cenopie.com
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com

# Application URLs
NEXT_PUBLIC_APP_URL=https://cenopie.com
NEXT_PUBLIC_CLIENT_URL=https://cenopie.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false

# Debug Settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_VERBOSE_LOGGING=false
```

### Development: `frontend/.env.local`

```bash
# Development Environment Variables for Frontend
NODE_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false

# Debug Settings (useful for development)
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_VERBOSE_LOGGING=true
```

## 🔐 Security Notes

### JWT Secrets
- **Current secrets are for development only**
- **Generate new secrets for production** using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### Database Security
- MongoDB Atlas connection is already configured
- IP whitelist should include your VPS IP address
- Database user has appropriate permissions

### Cloudinary Configuration
- Current configuration is set up for your account
- API keys are production-ready
- File upload limits are configured in the application

## 🌍 Environment Loading Order

### Backend (server.js)
1. If `NODE_ENV=production` → loads `.env.production`
2. Otherwise → loads `.env.local`
3. Falls back to `.env` (removed to avoid conflicts)

### Frontend (Next.js)
1. If `NODE_ENV=production` → loads `.env.production`
2. Otherwise → loads `.env.local`
3. Falls back to `.env.local.example` for reference

## 🔄 Switching Environments

### For Development
```bash
# Backend will use .env.local
# Frontend will use .env.local
npm run dev
```

### For Production
```bash
# Backend will use .env.production
# Frontend will use .env.production
NODE_ENV=production npm start
```

## ✅ Environment Validation

### Required Variables Check

**Backend Required:**
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication
- `JWT_REFRESH_SECRET` - Token refresh
- `CLOUDINARY_*` - File uploads
- `CLIENT_ORIGIN` - CORS configuration

**Frontend Required:**
- `NEXT_PUBLIC_API_URL` - API endpoint
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket connection

### Testing Environment Variables

```bash
# Test backend environment
cd backend
node -e "require('dotenv').config({path: '.env.production'}); console.log('MongoDB:', !!process.env.MONGODB_URI); console.log('JWT:', !!process.env.JWT_SECRET);"

# Test frontend environment
cd frontend
node -e "require('dotenv').config({path: '.env.production'}); console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);"
```

## 🚨 Important Notes

1. **Never commit `.env.local` or `.env.production` to version control**
2. **Always use `.env.example` files as templates**
3. **Keep production secrets secure and unique**
4. **Regularly rotate JWT secrets and API keys**
5. **Monitor environment variable usage in logs**

## 📞 Troubleshooting

### Common Issues

1. **API calls failing**: Check `NEXT_PUBLIC_API_URL` format (no `/api` suffix)
2. **Database connection errors**: Verify MongoDB Atlas IP whitelist
3. **File upload issues**: Check Cloudinary credentials
4. **CORS errors**: Verify `CLIENT_ORIGIN` matches frontend URL
5. **Socket.IO connection issues**: Check `NEXT_PUBLIC_SOCKET_URL`

### Debug Commands

```bash
# Check which environment file is loaded
echo $NODE_ENV

# View current environment variables (be careful with secrets)
printenv | grep -E "(NEXT_PUBLIC_|MONGODB_|JWT_)"

# Test API connectivity
curl https://cenopie.com/api/health
```