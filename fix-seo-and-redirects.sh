#!/bin/bash

echo "🔧 Fixing SEO and Redirect Issues..."
echo "===================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Test current redirects
print_info "Step 1: Testing current redirects..."
echo "Testing www.cenopie.com redirect:"
curl -I https://www.cenopie.com 2>/dev/null | grep -E "(HTTP|Location)"

# Step 2: Rebuild frontend to ensure meta tags are applied
print_info "Step 2: Rebuilding frontend with SEO optimizations..."
cd /var/www/cenopie-vps/frontend

# Clear cache
rm -rf .next
print_status "Next.js cache cleared"

# Rebuild
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend rebuilt with SEO meta tags"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Step 3: Restart services
print_info "Step 3: Restarting services..."
cd /var/www/cenopie-vps
pm2 restart all
sudo systemctl reload nginx

print_status "Services restarted"

# Step 4: Test SEO
print_info "Step 4: Testing SEO..."
echo "Testing meta tags:"
curl -s https://cenopie.com | grep -E "(title|description|og:)" | head -5

echo ""
print_status "SEO and redirect fixes applied!"
print_info "Test your site: https://cenopie.com"
print_info "Test www redirect: https://www.cenopie.com"