#!/bin/bash

# Cenopie API Connection Fix Script
# Fixes the "Failed to fetch" errors in production

set -e

echo "🔧 Fixing Cenopie API connection issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Kill any processes using our ports
print_status "Clearing ports 3001 and 4000..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
sleep 2

# Create production environment files
print_status "Creating production environment files..."

# Backend production environment
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=4000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dutmqmbhm
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (Optional)
EMAIL_FROM=noreply@cenopie.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis Configuration (Disabled for now)
REDIS_DISABLED=true
REDIS_URL=redis://localhost:6379

# Performance Settings
TRUST_PROXY=1
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
COMPRESSION_LEVEL=6
BODY_JSON_LIMIT=10mb
BODY_URLENCODED_LIMIT=10mb

# Security
CORS_ORIGIN=https://cenopie.com,https://www.cenopie.com
EOF

# Frontend production environment
cat > frontend/.env.production << 'EOF'
NODE_ENV=production

# API Configuration - Production URLs
NEXT_PUBLIC_API_URL=https://cenopie.com
NEXT_PUBLIC_APP_URL=https://cenopie.com
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dutmqmbhm

# Production Settings
NEXT_PUBLIC_SHOW_BETA=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Analytics (add your actual IDs)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
EOF

# Frontend local production environment
cat > frontend/.env.local << 'EOF'
NODE_ENV=production

# API Configuration - Use production domain
NEXT_PUBLIC_API_URL=https://cenopie.com
NEXT_PUBLIC_APP_URL=https://cenopie.com
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dutmqmbhm

# Production Settings
NEXT_PUBLIC_SHOW_BETA=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
EOF

print_success "Environment files created"

# Copy production environment to main environment files
print_status "Setting up environment files..."
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env.local

# Install dependencies and rebuild
print_status "Installing backend dependencies..."
cd backend
npm ci --production=false

print_status "Installing frontend dependencies..."
cd ../frontend
npm ci --production=false

# Clean and rebuild frontend
print_status "Cleaning and rebuilding frontend with API URL fixes..."
rm -rf .next node_modules/.cache
npm run build:prod
print_success "Frontend rebuilt with API URL fixes"

cd ..

# Test backend connection
print_status "Testing backend configuration..."
cd backend
timeout 10s node -e "
require('dotenv').config({ path: '.env' });
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('REDIS_DISABLED:', process.env.REDIS_DISABLED);
" || print_warning "Backend environment test timed out"

cd ..

# Start services with updated configuration
print_status "Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save

print_success "Services started successfully!"

# Wait for services to initialize
sleep 10

# Test API endpoints
print_status "Testing API endpoints..."

# Test backend health
if curl -f -s http://localhost:4000/api/health > /dev/null; then
    print_success "Backend API is responding ✓"
else
    print_warning "Backend API health check failed"
fi

# Test frontend
if curl -f -s http://localhost:3001 > /dev/null; then
    print_success "Frontend is responding ✓"
else
    print_warning "Frontend health check failed"
fi

# Test specific API endpoints that were failing
print_status "Testing specific API endpoints..."

# Test upload endpoint
if curl -f -s -H "Content-Type: application/json" http://localhost:4000/api/upload/test > /dev/null; then
    print_success "Upload API endpoint is accessible ✓"
else
    print_warning "Upload API endpoint test failed"
fi

# Check PM2 status
print_status "Checking service status..."
pm2 status

print_success "🎉 API connection fix completed!"
print_status "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Test your site: https://cenopie.com"
echo "3. Try the interview video upload feature"
echo ""
print_warning "If API calls still fail, check:"
echo "  - Browser console for specific error messages"
echo "  - PM2 logs: pm2 logs cenopie-backend --lines 50"
echo "  - Network tab in browser dev tools"
echo "  - CORS errors in backend logs"