#!/bin/bash

echo "🔧 Comprehensive fix for static asset MIME type issues..."

# Stop services
echo "Stopping services..."
pm2 stop cenopie-frontend || true

# Clean and rebuild Next.js
echo "Cleaning and rebuilding Next.js..."
cd frontend

# Remove build artifacts
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies (in case something is missing)
npm ci

# Build the application
echo "Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Next.js build failed"
    exit 1
fi

cd ..

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    # Start frontend service
    echo "Starting frontend service..."
    pm2 start cenopie-frontend
    
    # Wait a moment for service to start
    sleep 5
    
    # Check service status
    pm2 status
    
    echo "🎉 Static asset fix completed!"
    echo ""
    echo "Changes made:"
    echo "- Rebuilt Next.js application with fresh static assets"
    echo "- Updated nginx configuration with proper MIME types"
    echo "- Restarted services"
    echo ""
    echo "Please test your site now. The MIME type errors should be resolved."
    
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi