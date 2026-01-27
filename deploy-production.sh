#!/bin/bash

# Cenopie Production Deployment Script with Cloudflare SSL
# This script deploys the Cenopie application to production with clean setup

set -e  # Exit on any error

echo "🚀 Starting Cenopie Clean Production Deployment with Cloudflare SSL..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/cenopie-vps"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_CONFIG="/etc/nginx/sites-available/cenopie.com"
DOMAIN="cenopie.com"
SSL_DIR="/etc/ssl/cloudflare"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root. Please run as cenopie user with sudo privileges."
    exit 1
fi

# Step 1: Clean up existing processes
print_step "1. Cleaning up existing processes..."
pm2 kill || print_warning "No PM2 processes to kill"
sudo pkill -9 node || print_warning "No node processes to kill"
sudo systemctl stop nginx || print_warning "Nginx already stopped"

# Step 2: Clean up old configurations
print_step "2. Cleaning up old configurations..."
sudo rm -f /etc/nginx/sites-enabled/cenopie*
sudo rm -f /etc/nginx/sites-available/cenopie*
sudo rm -rf /etc/letsencrypt || print_warning "No Let's Encrypt certificates to remove"

# Step 3: Update code from repository
print_step "3. Updating code from repository..."
cd "$PROJECT_DIR"
git fetch origin
git reset --hard origin/main
git clean -fd

# Step 4: Install Backend Dependencies
print_step "4. Installing backend dependencies..."
cd "$BACKEND_DIR"
rm -rf node_modules package-lock.json
npm install

# Step 5: Install Frontend Dependencies and Build
print_step "5. Installing frontend dependencies and building..."
cd "$FRONTEND_DIR"
rm -rf node_modules package-lock.json .next
npm install
npm run build

# Step 6: Set up environment files
print_step "6. Setting up environment files..."
cd "$BACKEND_DIR"
if [ ! -f .env.production ]; then
    cp .env.example .env.production
    print_warning "Created .env.production from template. Please update with production values."
fi

cd "$FRONTEND_DIR"
if [ ! -f .env.production ]; then
    cp .env.local.example .env.production
    print_warning "Created frontend .env.production from template. Please update with production values."
fi

# Step 7: Set up Cloudflare SSL directory
print_step "7. Setting up Cloudflare SSL directory..."
sudo mkdir -p "$SSL_DIR"
sudo chown root:root "$SSL_DIR"
sudo chmod 755 "$SSL_DIR"

if [ ! -f "$SSL_DIR/cenopie.com.pem" ] || [ ! -f "$SSL_DIR/cenopie.com.key" ]; then
    print_warning "Cloudflare SSL certificates not found!"
    print_warning "Please add your Cloudflare Origin certificates:"
    print_warning "1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server"
    print_warning "2. Create certificate and save to:"
    print_warning "   Certificate: sudo nano $SSL_DIR/cenopie.com.pem"
    print_warning "   Private Key: sudo nano $SSL_DIR/cenopie.com.key"
    print_warning "3. Set permissions: sudo chmod 600 $SSL_DIR/cenopie.com.key"
    print_warning "4. Set permissions: sudo chmod 644 $SSL_DIR/cenopie.com.pem"
fi

# Step 8: Create Cloudflare-optimized nginx configuration
print_step "8. Creating Cloudflare-optimized nginx configuration..."
sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
# Cloudflare-optimized Nginx configuration for Cenopie

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream servers
upstream frontend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
}

upstream backend {
    server 127.0.0.1:4000 max_fails=3 fail_timeout=30s;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name cenopie.com www.cenopie.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server with Cloudflare Origin SSL
server {
    listen 443 ssl http2;
    server_name cenopie.com www.cenopie.com;
    
    # Cloudflare Origin SSL certificates
    ssl_certificate /etc/ssl/cloudflare/cenopie.com.pem;
    ssl_certificate_key /etc/ssl/cloudflare/cenopie.com.key;
    
    # SSL optimization
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Trust Cloudflare IPs
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Client settings
    client_max_body_size 10M;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Login with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO WebSocket connections
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
    
    # Health check
    location /health {
        proxy_pass http://backend/api/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
sudo nginx -t

# Step 9: Set proper permissions
print_step "9. Setting proper permissions..."
sudo chown -R cenopie:cenopie "$PROJECT_DIR"
sudo chmod -R 755 "$PROJECT_DIR"

# Step 10: Start services
print_step "10. Starting services..."

# Start backend
cd "$BACKEND_DIR"
NODE_ENV=production pm2 start src/server.js --name "cenopie-backend"

# Start frontend
cd "$FRONTEND_DIR"
NODE_ENV=production pm2 start npm --name "cenopie-frontend" -- run start

# Save PM2 configuration
pm2 save
pm2 startup

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 11: Health checks
print_step "11. Performing health checks..."
sleep 10

# Check backend
if curl -f -s http://localhost:4000/api/health > /dev/null; then
    print_status "✅ Backend health check passed"
else
    print_error "❌ Backend health check failed"
    pm2 logs cenopie-backend --lines 10
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    print_status "✅ Frontend health check passed"
else
    print_error "❌ Frontend health check failed"
    pm2 logs cenopie-frontend --lines 10
fi

# Check nginx
if curl -f -s http://localhost > /dev/null; then
    print_status "✅ Nginx health check passed"
else
    print_error "❌ Nginx health check failed"
    sudo systemctl status nginx
fi

# Final status
print_step "12. Deployment Summary"
print_status "🎉 Cenopie Clean Deployment Completed!"
print_status ""
print_status "Application Status:"
pm2 status
print_status ""
print_status "Services:"
print_status "Frontend: https://$DOMAIN"
print_status "Backend API: https://$DOMAIN/api"
print_status "Health Check: https://$DOMAIN/health"

echo ""
print_warning "⚠️  IMPORTANT: Complete these steps in Cloudflare Dashboard:"
print_warning "1. DNS → Set A records to Proxied (🟠 orange cloud)"
print_warning "2. SSL/TLS → Overview → Set to 'Full (strict)'"
print_warning "3. SSL/TLS → Edge Certificates → Enable 'Always Use HTTPS'"
print_warning ""
print_warning "📋 Next Steps:"
print_warning "1. Add Cloudflare Origin certificates to $SSL_DIR/"
print_warning "2. Update environment variables in .env.production files"
print_warning "3. Test HTTPS: curl -I https://$DOMAIN"
print_warning "4. Monitor logs: pm2 logs"