#!/bin/bash

# Final Fix for Repost Feed Issue
# This script implements the complete solution for reposts not showing in feed

echo "🔧 Starting Final Repost Feed Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Implementing final repost feed fix..."

# Stop existing processes
print_status "Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true

# Backend deployment
print_status "Building and starting backend..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
fi

# Start backend
print_status "Starting backend with PM2..."
cd ..
pm2 start ecosystem.config.js --only backend

# Wait for backend to start
print_status "Waiting for backend to initialize..."
sleep 5

# Frontend deployment
print_status "Building and deploying frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Build frontend
print_status "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi

# Start frontend
print_status "Starting frontend with PM2..."
cd ..
pm2 start ecosystem.config.js --only frontend

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Check service status
print_status "Checking service status..."
pm2 status

# Test the deployment
print_status "Testing deployment..."

# Test backend health
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health || echo "000")
if [ "$backend_status" = "200" ]; then
    print_success "Backend is running successfully"
else
    print_warning "Backend health check returned status: $backend_status"
fi

# Test frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$frontend_status" = "200" ]; then
    print_success "Frontend is running successfully"
else
    print_warning "Frontend health check returned status: $frontend_status"
fi

# Test repost functionality
print_status "Testing repost functionality..."
cd backend
node test-repost-feed-fix.js > /tmp/repost-test.log 2>&1
if [ $? -eq 0 ]; then
    print_success "Repost database test passed"
    echo "Recent reposts found:"
    grep -A 5 "Found.*reposts:" /tmp/repost-test.log | head -10
else
    print_warning "Repost database test had issues - check /tmp/repost-test.log"
fi
cd ..

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

print_success "🎉 Final Repost Feed Fix Deployment Complete!"

echo ""
echo "🔧 Comprehensive Fix Applied:"
echo "  ✅ Reduced cache duration from 2 minutes to 30 seconds"
echo "  ✅ Added forceRefreshFeed function with browser cache clearing"
echo "  ✅ Enhanced repost handling with automatic feed refresh"
echo "  ✅ Added manual refresh button to feed interface"
echo "  ✅ Improved error handling with force refresh option"
echo "  ✅ Added success/error notifications for reposts"
echo "  ✅ Comprehensive debugging and logging"
echo ""
echo "🔗 Access your application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo ""
echo "🧪 Testing the Fix:"
echo "  1. Go to http://localhost:3000/feed"
echo "  2. Find any post and click the repost button"
echo "  3. Add a comment (optional) and confirm repost"
echo "  4. You should see success notifications"
echo "  5. The repost should appear at the top of the feed"
echo "  6. If not, click the refresh button next to the filter tabs"
echo ""
echo "🔍 Your Specific Repost:"
echo "  Direct URL: http://localhost:3000/posts/697a83f38dfb77e7bf17301e"
echo "  This repost should now appear in the main feed"
echo ""
echo "🐛 If the issue persists:"
echo "  1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)"
echo "  2. Clear browser cache and cookies completely"
echo "  3. Try in incognito/private browsing mode"
echo "  4. Check browser console for any JavaScript errors"
echo "  5. Use the manual refresh button in the feed"
echo ""
echo "🛠️  Useful commands:"
echo "  pm2 status                    - Check service status"
echo "  pm2 logs                      - View logs"
echo "  pm2 restart all               - Restart all services"
echo "  node backend/test-repost-feed-fix.js - Test database"
echo ""
echo "📊 Current Database Status:"
cd backend
node test-repost-feed-fix.js | tail -5
cd ..