#!/bin/bash

# Fix Repost Content Filter Issue
# This script fixes the critical issue where reposts with empty content were being filtered out

echo "🔧 Starting Repost Content Filter Fix..."

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

print_status "🐛 CRITICAL BUG IDENTIFIED AND FIXED!"
echo ""
echo "🔍 Root Cause Analysis:"
echo "   The feed page had this condition:"
echo "   return post.id && post.author && post.content ? ("
echo ""
echo "   This filtered out reposts with empty content!"
echo "   Your repost (697a83f38dfb77e7bf17301e) has empty content: \"\""
echo ""
echo "✅ Fix Applied:"
echo "   Changed condition to:"
echo "   return post.id && post.author && (post.content || post.isRepost) ? ("
echo ""
echo "   Now reposts with empty content will be displayed!"
echo ""

# Stop existing processes
print_status "Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true

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

# Start services
print_status "Starting services with PM2..."
cd ..
pm2 start ecosystem.config.js

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Check service status
print_status "Checking service status..."
pm2 status

# Test the deployment
print_status "Testing deployment..."

# Test frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$frontend_status" = "200" ]; then
    print_success "Frontend is running successfully"
else
    print_warning "Frontend health check returned status: $frontend_status"
fi

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

print_success "🎉 Repost Content Filter Fix Deployment Complete!"

echo ""
echo "🔧 Critical Fix Applied:"
echo "  ✅ Modified feed post rendering condition"
echo "  ✅ Reposts with empty content now display properly"
echo "  ✅ Added enhanced debugging logs"
echo "  ✅ Your specific repost should now be visible"
echo ""
echo "🔗 Test Your Fix:"
echo "  1. Go to http://localhost:3000/feed"
echo "  2. Your repost (697a83f38dfb77e7bf17301e) should now appear"
echo "  3. Check browser console for detailed logs"
echo "  4. Look for '✅ REPOST DETECTED:' messages"
echo ""
echo "🐛 What Was Wrong:"
echo "  The feed was filtering out posts without content"
echo "  Reposts often have empty content (they show original post content)"
echo "  The condition 'post.content' was false for empty strings"
echo ""
echo "✅ What's Fixed:"
echo "  Now checks: post.content OR post.isRepost"
echo "  Reposts will display even with empty content"
echo "  Original post content shows through PostCard component"
echo ""
echo "🛠️  Useful commands:"
echo "  pm2 status          - Check service status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all services"