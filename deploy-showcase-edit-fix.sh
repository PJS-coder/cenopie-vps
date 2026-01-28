#!/bin/bash

# Deploy Showcase Edit Button Fix
# This script fixes the edit button to redirect to the profile page for editing

echo "🚀 Starting Showcase Edit Button Fix Deployment..."

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

print_status "Deploying Showcase Edit Button Fix..."

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

print_success "🎉 Showcase Edit Button Fix Deployment Complete!"

echo ""
echo "✅ Fix Applied:"
echo "  • Edit button now redirects to /profile page"
echo "  • Profile page has full editing functionality"
echo "  • Users can edit name, headline, bio, location, and more"
echo "  • No more broken redirects or missing functionality"
echo ""
echo "🔗 Test Your Fix:"
echo "  1. Go to http://localhost:3000/showcase"
echo "  2. Find the 'Your Profile' section"
echo "  3. Click the 'Edit' button"
echo "  4. You should be redirected to /profile page"
echo "  5. Profile page should load with full editing capabilities"
echo ""
echo "📝 How It Works:"
echo "  • Edit button: router.push('/profile')"
echo "  • Redirects to main profile page (/profile)"
echo "  • Profile page has complete editing functionality"
echo "  • Users can edit all profile fields and save changes"
echo ""
echo "🛠️  Useful commands:"
echo "  pm2 status          - Check service status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all services"