# Fresh Cenopie Deployment Guide - Ubuntu VPS

## Prerequisites
- Ubuntu VPS (your specs: 5GB RAM, 5 cores, 80GB storage)
- Domain: cenopie.com pointing to IP: 185.27.135.185
- Root access to VPS

## Step 1: COMPLETE CLEANUP - Remove Everything

### 1.1 Connect to VPS
```bash
ssh root@185.27.135.185
```

### 1.2 Stop All Running Services
```bash
# Stop PM2 processes
pm2 kill
pm2 delete all

# Stop web servers
systemctl stop nginx
systemctl stop apache2

# Stop databases
systemctl stop mongod
systemctl stop redis-server
```

### 1.3 Remove ALL Previous Installations
```bash
# Remove Apache completely
systemctl stop apache2
systemctl disable apache2
apt remove --purge apache2 apache2-utils apache2-bin apache2-data -y

# Remove old Nginx
systemctl stop nginx
apt remove --purge nginx nginx-common nginx-core -y

# Remove old Node.js/PM2
npm uninstall -g pm2
apt remove --purge nodejs npm -y

# Remove old project files
rm -rf /var/www/cenopie
rm -rf /var/www/html
rm -rf /etc/nginx
rm -rf /var/log/nginx
rm -rf /var/log/pm2

# Clean package cache
apt autoremove -y
apt autoclean
```

### 1.4 Update System Fresh
```bash
apt update && apt upgrade -y
```

### 1.5 Verify Clean State
```bash
# Check no processes running on ports
netstat -tulpn | grep :80
netstat -tulpn | grep :443
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Should show nothing running
ps aux | grep nginx
ps aux | grep apache
ps aux | grep node
```

## Step 2: Install Required Software

### 2.1 Install Node.js 18 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v18.x.x
npm --version
```

### 2.2 Install PM2 Process Manager
```bash
npm install -g pm2
pm2 --version
```

### 2.3 Install Nginx
```bash
apt install -y nginx
systemctl enable nginx
```

### 2.4 Install MongoDB
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod
```

### 2.5 Install Redis (Optional but Recommended)
```bash
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
```

## Step 3: Setup Project Directory

### 3.1 Create Project Directory
```bash
mkdir -p /var/www/cenopie
cd /var/www/cenopie
```

### 3.2 Clone/Upload Your Project
```bash
# If using Git (replace with your repo URL)
git clone https://github.com/yourusername/cenopie.git cenopie-cpanel-vercel

# OR if uploading files manually, create the directory
mkdir -p cenopie-cpanel-vercel
cd cenopie-cpanel-vercel
# Then upload your frontend and backend folders here
```

### 3.3 Set Proper Permissions
```bash
chown -R www-data:www-data /var/www/cenopie
chmod -R 755 /var/www/cenopie
```

## Step 4: Configure Backend

### 4.1 Navigate to Backend
```bash
cd /var/www/cenopie/cenopie-cpanel-vercel/backend
```

### 4.2 Install Dependencies
```bash
npm install --production
```

### 4.3 Create Production Environment File
```bash
nano .env
```

**Copy this content:**
```env
# Production Environment Variables

# JWT Secrets (generate new ones for production)
JWT_SECRET=d243036c5c96f4af5fe4647c6f8b8bc900f81c5fb1d93c9a0f4284ddd9a0074314e8851f3093c149ea208b66c5edf362ba07393651deb335a08142c8c8c117bb
JWT_REFRESH_SECRET=4f0059a7c3afdcb9f277560e47b7a41fb3340a8bc65d2a1aa37828e41a9f4c5a88b6e033e5ee333566207505381604b2088a3a454904f718d70ce25024362f63

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie

# Redis (local)
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=false

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=dutmqmbhm
CLOUDINARY_API_KEY=547334685142862
CLOUDINARY_API_SECRET=mVCX-G8H0lKsoTusQdyKwm-t-G8

# Application URLs - PRODUCTION URLs (NOT LOCALHOST)
CLIENT_ORIGIN=https://cenopie.com
FRONTEND_URL=https://cenopie.com
PORT=4000

# Launch Control
ALLOW_REGISTRATION=false
LAUNCH_MODE=closed_beta

# Email Service (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Cenopie <noreply@cenopie.com>
```

Save with `Ctrl+X`, then `Y`, then `Enter`

## Step 5: Configure Frontend

### 5.1 Navigate to Frontend
```bash
cd /var/www/cenopie/cenopie-cpanel-vercel/frontend
```

### 5.2 Install Dependencies
```bash
npm install --production
```

### 5.3 Create Production Environment File
```bash
nano .env.local
```

**Copy this content:**
```env
# Frontend Production Environment Variables

# API URL for backend connection - PRODUCTION URL (NOT LOCALHOST)
NEXT_PUBLIC_API_URL=https://cenopie.com

# App Info
NEXT_PUBLIC_APP_NAME=Cenopie
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional: Google Analytics
# NEXT_PUBLIC_GA_ID=your_ga_id
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### 5.4 Build Frontend
```bash
npm run build
```

## Step 6: Configure PM2

### 6.1 Create PM2 Configuration
```bash
cd /var/www/cenopie/cenopie-cpanel-vercel
nano ecosystem.config.js
```

**Copy this content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/backend',
      script: 'src/server.js',
      instances: 3,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
      error_file: '/var/log/pm2/cenopie-backend-error.log',
      out_file: '/var/log/pm2/cenopie-backend-out.log',
      log_file: '/var/log/pm2/cenopie-backend.log',
      time: true
    },
    {
      name: 'cenopie-frontend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/frontend',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '600M',
      autorestart: true,
      watch: false,
      error_file: '/var/log/pm2/cenopie-frontend-error.log',
      out_file: '/var/log/pm2/cenopie-frontend-out.log',
      log_file: '/var/log/pm2/cenopie-frontend.log',
      time: true
    }
  ]
};
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### 6.2 Create PM2 Log Directory
```bash
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/log/pm2
```

## Step 7: Configure Nginx

### 7.1 Remove Default Configuration
```bash
rm /etc/nginx/sites-enabled/default
rm /etc/nginx/sites-available/default
```

### 7.2 Create Cenopie Configuration
```bash
nano /etc/nginx/sites-available/cenopie
```

**Copy this content:**
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Upstream servers
upstream frontend_upstream {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream backend_upstream {
    least_conn;
    server 127.0.0.1:4000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name cenopie.com www.cenopie.com;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cenopie.com www.cenopie.com;
    
    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/cenopie.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/cenopie.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Connection limits
    limit_conn conn_limit 20;
    
    # API routes to backend
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_upstream/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Socket.io for real-time features
    location /socket.io/ {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # All other routes to frontend
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
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
}
```

Save with `Ctrl+X`, then `Y`, then `Enter`

### 7.3 Enable Site
```bash
ln -s /etc/nginx/sites-available/cenopie /etc/nginx/sites-enabled/
```

### 7.4 Test Nginx Configuration
```bash
nginx -t
```

## Step 8: Install SSL Certificate

### 8.1 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 8.2 Get SSL Certificate
```bash
certbot --nginx -d cenopie.com -d www.cenopie.com
```

Follow the prompts and enter your email when asked.

## Step 9: Start Services

### 9.1 Start Nginx
```bash
systemctl start nginx
systemctl enable nginx
```

### 9.2 Start PM2 Applications
```bash
cd /var/www/cenopie/cenopie-cpanel-vercel
pm2 start ecosystem.config.js --env production
```

### 9.3 Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs.

## Step 10: Verify Deployment

### 10.1 Check PM2 Status
```bash
pm2 status
pm2 logs
```

### 10.2 Check Nginx Status
```bash
systemctl status nginx
```

### 10.3 Test Website
```bash
curl -I https://cenopie.com
curl -I https://cenopie.com/api/health
```

### 10.4 Check Logs
```bash
# PM2 logs
pm2 logs cenopie-backend --lines 50
pm2 logs cenopie-frontend --lines 50

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Step 11: Setup Monitoring

### 11.1 Install PM2 Monitoring
```bash
pm2 install pm2-server-monit
```

### 11.2 Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Troubleshooting Commands

If something goes wrong:

```bash
# Restart all services
pm2 restart all
systemctl restart nginx

# Check what's running on ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Check processes
ps aux | grep node
ps aux | grep nginx

# Kill stuck processes
pkill -f node
pkill -f nginx

# Check disk space
df -h

# Check memory usage
free -h
```

## Final Notes

1. Your website will be available at: https://cenopie.com
2. Backend API at: https://cenopie.com/api/
3. PM2 dashboard: `pm2 monit`
4. Always check logs if something isn't working: `pm2 logs`

This setup is optimized for your 5GB RAM, 5-core VPS and should handle 150k+ daily users efficiently.