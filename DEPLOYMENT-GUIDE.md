# 🚀 Cenopie Production Deployment Guide

Complete step-by-step guide to deploy Cenopie on a VPS with production-ready configuration.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores
- **Network**: Public IP address
- **Access**: Root or sudo privileges

### Domain & DNS (Optional but Recommended)
- Domain name (e.g., `yourdomain.com`)
- DNS A record pointing to your server IP
- SSL certificate (Let's Encrypt recommended)

### External Services
- **MongoDB**: Local installation or MongoDB Atlas
- **Cloudinary**: For image/video uploads
- **Email Service**: Gmail, SendGrid, or similar (optional)

## 🎯 Quick Deployment (Recommended)

### Step 1: Prepare Your Server
```bash
# Connect to your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y
```

### Step 2: Clone and Deploy
```bash
# Clone your repository
git clone https://github.com/your-username/cenopie.git
cd cenopie

# Make scripts executable
chmod +x vps-deploy/*.sh

# Clean up any existing deployment (if redeploying)
sudo ./vps-deploy/cleanup-old-deployment.sh

# Run automated deployment
sudo ./vps-deploy/deploy.sh
```

### Step 3: Configure Environment Variables
```bash
# Edit backend environment
sudo nano /opt/cenopie/backend/.env.production

# Edit frontend environment  
sudo nano /opt/cenopie/frontend/.env.production
```

### Step 4: Start Services
```bash
# Check deployment status
./vps-deploy/check-status.sh

# If needed, restart services
sudo -u $USER pm2 restart all
```

## ⚙️ Environment Configuration

### Backend Environment (.env.production)
```env
# Application
NODE_ENV=production
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/cenopie
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/cenopie

# Security
JWT_SECRET=your-super-secure-jwt-secret-change-this
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-change-this
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-change-this

# File Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# URLs
CLIENT_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Features
ALLOW_REGISTRATION=true
LAUNCH_MODE=open

# Redis (Optional)
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=true

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Cenopie <noreply@yourdomain.com>
```

### Frontend Environment (.env.production)
```env
# Application
NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_CLIENT_URL=https://yourdomain.com

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_VERBOSE_LOGGING=false
```

## 🔧 Manual Installation (Advanced)

### Step 1: System Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx ufw fail2ban htop

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### Step 2: Database Setup (Optional - Local MongoDB)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update && sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 3: Application Setup
```bash
# Create application directory
sudo mkdir -p /opt/cenopie
sudo chown $USER:$USER /opt/cenopie

# Clone repository
cd /opt/cenopie
git clone https://github.com/your-username/cenopie.git .

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build
```

### Step 4: Process Management
```bash
# Copy PM2 ecosystem config
cp /opt/cenopie/vps-deploy/ecosystem.config.js /opt/cenopie/

# Start applications
cd /opt/cenopie
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 5: Nginx Configuration
```bash
# Copy Nginx config
sudo cp /opt/cenopie/vps-deploy/nginx.conf /etc/nginx/sites-available/cenopie

# Enable site
sudo ln -s /etc/nginx/sites-available/cenopie /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
sudo crontab -l | grep certbot
```

### Manual SSL Certificate
```bash
# If you have your own SSL certificate
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private-key.key /etc/ssl/private/

# Update Nginx configuration to use your certificates
sudo nano /etc/nginx/sites-available/cenopie
```

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
# Quick status check
./vps-deploy/check-status.sh

# PM2 status
pm2 status
pm2 logs
pm2 monit

# System resources
htop
df -h
free -h
```

### Log Management
```bash
# View application logs
pm2 logs cenopie-backend
pm2 logs cenopie-frontend

# View Nginx logs
sudo tail -f /var/log/nginx/cenopie_access.log
sudo tail -f /var/log/nginx/cenopie_error.log

# View system logs
sudo journalctl -u nginx -f
sudo journalctl -u mongod -f
```

### Performance Monitoring
```bash
# Check port usage
sudo netstat -tlnp | grep -E ':(3000|4000|80|443)'

# Monitor database
mongo cenopie --eval "db.stats()"

# Check disk usage
du -sh /opt/cenopie/*
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
cd /opt/cenopie

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install --production

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services
pm2 restart all
```

### Database Maintenance
```bash
# Backup database
mongodump --db cenopie --out /opt/backups/$(date +%Y%m%d)

# Optimize database (if needed)
node /opt/cenopie/backend/scripts/ultra-db-optimize.js
```

### System Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up logs
sudo journalctl --vacuum-time=30d
pm2 flush

# Check disk space
df -h
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Not Starting
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs

# Restart services
pm2 restart all
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection string in .env.production
```

#### 3. Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Port Already in Use
```bash
# Find process using port
sudo lsof -ti:4000
sudo lsof -ti:3000

# Kill process if needed
sudo kill -9 <process-id>
```

#### 5. Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/cenopie

# Fix permissions
chmod +x /opt/cenopie/vps-deploy/*.sh
```

### Emergency Recovery
```bash
# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Clean restart
pm2 delete all
pm2 start /opt/cenopie/ecosystem.config.js --env production
sudo systemctl start nginx
```

## 🔐 Security Checklist

- [ ] Firewall configured (UFW enabled)
- [ ] SSH key authentication (disable password auth)
- [ ] Regular security updates scheduled
- [ ] Strong passwords/secrets in environment files
- [ ] SSL certificate installed and auto-renewing
- [ ] Database access restricted to localhost
- [ ] Regular backups scheduled
- [ ] Fail2ban configured for SSH protection
- [ ] Nginx security headers enabled
- [ ] File permissions properly set

## 📞 Support & Resources

### Useful Commands Reference
```bash
# Service management
pm2 status                    # Check PM2 processes
pm2 restart all              # Restart all processes
pm2 logs                     # View all logs
sudo systemctl status nginx  # Check Nginx status
sudo nginx -t                # Test Nginx config

# Monitoring
./vps-deploy/check-status.sh  # Quick health check
htop                         # System resources
df -h                        # Disk usage
free -h                      # Memory usage

# Maintenance
git pull origin main         # Update code
pm2 restart all             # Apply updates
sudo certbot renew          # Renew SSL certificates
```

### Log Locations
- **PM2 Logs**: `/opt/cenopie/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `journalctl -u service-name`
- **MongoDB Logs**: `/var/log/mongodb/`

### Configuration Files
- **Backend Env**: `/opt/cenopie/backend/.env.production`
- **Frontend Env**: `/opt/cenopie/frontend/.env.production`
- **Nginx Config**: `/etc/nginx/sites-available/cenopie`
- **PM2 Config**: `/opt/cenopie/ecosystem.config.js`

---

## 🎉 Deployment Complete!

Your Cenopie application should now be running at:
- **HTTP**: `http://your-server-ip`
- **HTTPS**: `https://yourdomain.com` (if SSL configured)

Remember to:
1. Configure your environment variables properly
2. Set up SSL certificates for production
3. Monitor logs regularly
4. Keep the system updated
5. Schedule regular backups

For additional help, check the logs and use the troubleshooting section above.