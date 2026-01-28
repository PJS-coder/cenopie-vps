#!/bin/bash

echo "🚀 Deploying Optimized Cenopie to VPS"
echo "====================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Build Frontend with Optimizations
print_info "Step 1: Building optimized frontend..."
cd frontend
npm run build
print_status "Frontend built successfully"

# 2. Stop current services
print_info "Step 2: Stopping current services..."
pm2 stop all
print_status "Services stopped"

# 3. Update configurations
print_info "Step 3: Updating configurations..."

# Copy optimized configs (you'll need to do this on your VPS)
print_warning "On your VPS, run these commands:"
echo ""
echo "# Copy optimized nginx config"
echo "sudo cp nginx.conf /etc/nginx/sites-available/cenopie.com"
echo "sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "# Copy optimized PM2 config"
echo "cp ecosystem.config.js /var/www/cenopie-vps/"
echo ""
echo "# Copy optimized backend env"
echo "cp backend/.env.production /var/www/cenopie-vps/backend/"
echo ""
echo "# Run performance optimization script"
echo "./optimize-vps-performance.sh"
echo ""

# 4. Start optimized services
print_info "Step 4: Starting optimized services..."
pm2 start ecosystem.config.js --env production
pm2 save
print_status "Services started with optimizations"

# 5. Show status
print_info "Step 5: Checking status..."
pm2 status

echo ""
print_status "Deployment complete!"
echo ""
print_info "Performance improvements:"
echo "• Cluster mode with multiple instances"
echo "• Redis caching enabled"
echo "• Nginx with advanced caching"
echo "• Database connection pooling"
echo "• Optimized build configuration"
echo ""
print_warning "Next steps on VPS:"
echo "1. Run: ./optimize-vps-performance.sh"
echo "2. Monitor: ./monitor-performance.sh"
echo "3. Test performance improvements"
echo ""