#!/bin/bash

# Cenopie Deployment Fix Script
# Fixes the JavaScript chunk loading and MIME type issues

set -e

echo "🔧 Fixing Cenopie deployment issues..."

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

# Clean and rebuild frontend
print_status "Cleaning and rebuilding frontend..."
cd frontend
rm -rf .next node_modules/.cache
npm ci --production=false
npm run build:prod
print_success "Frontend rebuilt successfully"

cd ..

# Create log directories
print_status "Creating log directories..."
mkdir -p /var/log/pm2
chmod 755 /var/log/pm2

# Update nginx configuration (backup first)
print_status "Updating nginx configuration..."
if [ -f "/etc/nginx/sites-available/cenopie.com" ]; then
    cp /etc/nginx/sites-available/cenopie.com /etc/nginx/sites-available/cenopie.com.backup.$(date +%Y%m%d_%H%M%S)
    cp nginx.conf /etc/nginx/sites-available/cenopie.com
    nginx -t && systemctl reload nginx
    print_success "Nginx configuration updated and reloaded"
else
    print_warning "Nginx config not found at expected location. Please manually copy nginx.conf"
fi

# Start services with updated configuration
print_status "Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save

print_success "Services started successfully!"

# Wait a moment for services to initialize
sleep 5

# Check status
print_status "Checking service status..."
pm2 status

# Test the application
print_status "Testing application endpoints..."
sleep 3

# Test backend health
if curl -f -s http://localhost:4000/api/health > /dev/null; then
    print_success "Backend is responding ✓"
else
    print_warning "Backend health check failed"
fi

# Test frontend
if curl -f -s http://localhost:3001 > /dev/null; then
    print_success "Frontend is responding ✓"
else
    print_warning "Frontend health check failed"
fi

print_success "🎉 Deployment fix completed!"
print_status "Next steps:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Monitor for a few minutes: pm2 monit"
echo "3. Test your site: https://cenopie.com"
echo ""
print_warning "If issues persist, check the logs:"
echo "  pm2 logs cenopie-frontend --lines 50"
echo "  pm2 logs cenopie-backend --lines 50"