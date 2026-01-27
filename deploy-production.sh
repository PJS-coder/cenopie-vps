#!/bin/bash

# Cenopie Production Deployment Script for Ubuntu VPS
# Domain: cenopie.com
# Version: 2.0

set -e  # Exit on any error

echo "🚀 Starting Cenopie Production Deployment..."
echo "📅 $(date)"
echo "🌐 Target Domain: cenopie.com"
echo "🖥️  Target Directory: /var/www/cenopie"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   echo "💡 Run as: ./deploy-production.sh"
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "📥 Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 18+ LTS
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js $(node --version) installed"
else
    echo "✅ Node.js $(node --version) already installed"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "📥 Installing Nginx..."
    sudo apt install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Create application directory
APP_DIR="/var/www/cenopie"
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    echo "✅ Directory created: $APP_DIR"
fi

# Navigate to application directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --only=production
echo "✅ Backend dependencies installed"

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --only=production
echo "✅ Frontend dependencies installed"

# Build frontend for production
echo "🔨 Building frontend for production..."
npm run build
echo "✅ Frontend build completed"

# Create logs directory
cd $APP_DIR
mkdir -p logs
echo "✅ Logs directory created"

# Create PM2 ecosystem configuration
echo "⚙️ Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/cenopie',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/cenopie/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
echo "✅ PM2 configuration created"

# Create Nginx configuration with rate limiting and security
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/cenopie.com > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream servers for load balancing
upstream frontend {
    server 127.0.0.1:3000;
}

upstream backend {
    server 127.0.0.1:4000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name cenopie.com www.cenopie.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name cenopie.com www.cenopie.com;
    
    # SSL configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/cenopie.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cenopie.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
    
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
    
    # Client max body size for file uploads
    client_max_body_size 10M;
    
    # Frontend (Next.js)
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
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }
    
    # Backend API with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO
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
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
}
EOF

# Enable the site and disable default
sudo ln -sf /etc/nginx/sites-available/cenopie.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "📥 Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
sudo certbot --nginx -d cenopie.com -d www.cenopie.com --non-interactive --agree-tos --email admin@cenopie.com

# Start applications with PM2
echo "🚀 Starting applications..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Restart and enable Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/cenopie > /dev/null << 'EOF'
/var/www/cenopie/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash
# Cenopie monitoring script

echo "=== Cenopie System Status ==="
echo "Date: $(date)"
echo ""

echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

echo ""
echo "=== Disk Usage ==="
df -h

echo ""
echo "=== Memory Usage ==="
free -h

echo ""
echo "=== Recent Logs ==="
echo "Backend logs (last 10 lines):"
tail -n 10 /var/www/cenopie/logs/backend-combined.log

echo ""
echo "Frontend logs (last 10 lines):"
tail -n 10 /var/www/cenopie/logs/frontend-combined.log
EOF

chmod +x monitor.sh

echo ""
echo "✅ Cenopie production deployment completed successfully!"
echo ""
echo "🌐 Your website is now available at: https://cenopie.com"
echo ""
echo "📊 Useful commands:"
echo "  - Check status: pm2 status"
echo "  - View logs: pm2 logs"
echo "  - Restart apps: pm2 restart all"
echo "  - Monitor system: ./monitor.sh"
echo "  - Nginx status: sudo systemctl status nginx"
echo ""
echo "📝 Log files are located in: /var/www/cenopie/logs/"
echo "⚙️ PM2 configuration: /var/www/cenopie/ecosystem.config.js"
echo "🌐 Nginx configuration: /etc/nginx/sites-available/cenopie.com"
echo ""
echo "🔒 SSL certificate will auto-renew via Certbot"
echo "🔥 Firewall is configured to allow HTTP, HTTPS, and SSH"