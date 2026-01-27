# 🚀 Cenopie Production Deployment Guide

Complete guide to deploy Cenopie on Ubuntu VPS with cenopie.com domain.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Public IP with domain pointing to it

### Domain Setup
- Domain: `cenopie.com`
- DNS A Record: `cenopie.com` → Your VPS IP
- DNS A Record: `www.cenopie.com` → Your VPS IP

### Local Requirements
- Git installed
- SSH access to your VPS

## 🔧 Environment Variables Setup

### Backend Environment Files

#### `/var/www/cenopie/backend/.env.production`
```bash
# Production Environment Variables
NODE_ENV=production
PORT=4000

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie

# Redis (optional for production)
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=true

# JWT Secrets (IMPORTANT: Change these for production)
JWT_SECRET=d243036c5c96f4af5fe4647c6f8b8bc900f81c5fb1d93c9a0f4284ddd9a0074314e8851f3093c149ea208b66c5edf362ba07393651deb335a08142c8c8c117bb
JWT_REFRESH_SECRET=4f0059a7c3afdcb9f277560e47b7a41fb3340a8bc65d2a1aa37828e41a9f4c5a88b6e033e5ee333566207505381604b2088a3a454904f718d70ce25024362f63

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=dutmqmbhm
CLOUDINARY_API_KEY=547334685142862
CLOUDINARY_API_SECRET=mVCX-G8H0lKsoTusQdyKwm-t-G8

# Application URLs
CLIENT_ORIGIN=https://cenopie.com
FRONTEND_URL=https://cenopie.com

# Launch Control (Closed Beta Mode)
ALLOW_REGISTRATION=false
LAUNCH_MODE=closed_beta

# Email Service (optional for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Cenopie <noreply@cenopie.com>

# Google OAuth (optional)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Service (optional)
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Frontend Environment Files

#### `/var/www/cenopie/frontend/.env.production`
```bash
# Production Environment Variables for Frontend
NODE_ENV=production

# API Configuration - Use same domain for API calls with /api path
NEXT_PUBLIC_API_URL=https://cenopie.com
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com

# Application URLs
NEXT_PUBLIC_APP_URL=https://cenopie.com
NEXT_PUBLIC_CLIENT_URL=https://cenopie.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false

# Debug Settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_VERBOSE_LOGGING=false
```

## 🚀 Deployment Steps

### Step 1: Prepare Your VPS

1. **Connect to your VPS**:
   ```bash
   ssh your-username@your-vps-ip
   ```

2. **Update system**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Create a non-root user** (if not already done):
   ```bash
   sudo adduser cenopie
   sudo usermod -aG sudo cenopie
   su - cenopie
   ```

### Step 2: Upload Your Code

1. **Clone your repository**:
   ```bash
   sudo mkdir -p /var/www/cenopie
   sudo chown $USER:$USER /var/www/cenopie
   cd /var/www/cenopie
   
   # Upload your code (choose one method):
   
   # Method 1: Git clone (if you have a repository)
   git clone https://github.com/your-username/cenopie.git .
   
   # Method 2: SCP from local machine
   # From your local machine:
   # scp -r ./Cenopie-production-main/* your-username@your-vps-ip:/var/www/cenopie/
   
   # Method 3: Upload via FTP/SFTP client
   ```

2. **Set correct permissions**:
   ```bash
   sudo chown -R $USER:$USER /var/www/cenopie
   chmod +x /var/www/cenopie/deploy-production.sh
   ```

### Step 3: Run Deployment Script

1. **Navigate to project directory**:
   ```bash
   cd /var/www/cenopie
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-production.sh
   ```

   The script will automatically:
   - Install Node.js 18 LTS
   - Install PM2 process manager
   - Install and configure Nginx
   - Install dependencies
   - Build the frontend
   - Configure SSL with Let's Encrypt
   - Start the applications
   - Set up monitoring and logging

### Step 4: Verify Deployment

1. **Check PM2 status**:
   ```bash
   pm2 status
   ```

2. **Check Nginx status**:
   ```bash
   sudo systemctl status nginx
   ```

3. **Check logs**:
   ```bash
   pm2 logs
   # or
   ./monitor.sh
   ```

4. **Test the website**:
   - Visit: https://cenopie.com
   - Check API: https://cenopie.com/api/health

## 🔧 Post-Deployment Configuration

### SSL Certificate Auto-Renewal

The SSL certificate will auto-renew. To test renewal:
```bash
sudo certbot renew --dry-run
```

### Firewall Configuration

The deployment script configures UFW firewall:
```bash
sudo ufw status
```

### Database Backup Setup

Set up automated MongoDB backups:
```bash
# Make backup script executable
chmod +x /var/www/cenopie/scripts/backup-mongodb.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /var/www/cenopie/scripts/backup-mongodb.sh
```

## 📊 Monitoring & Management

### Useful Commands

```bash
# PM2 Management
pm2 status                    # Check application status
pm2 logs                      # View logs
pm2 restart all              # Restart all applications
pm2 reload all               # Reload all applications (zero downtime)
pm2 stop all                 # Stop all applications
pm2 delete all               # Delete all applications

# Nginx Management
sudo systemctl status nginx   # Check Nginx status
sudo systemctl restart nginx  # Restart Nginx
sudo nginx -t                 # Test Nginx configuration

# System Monitoring
./monitor.sh                  # Run monitoring script
htop                         # System resource usage
df -h                        # Disk usage
free -h                      # Memory usage

# Log Files
tail -f /var/www/cenopie/logs/backend-combined.log
tail -f /var/www/cenopie/logs/frontend-combined.log
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

1. **Application Metrics**:
   ```bash
   pm2 monit  # Real-time monitoring
   ```

2. **Server Metrics**:
   ```bash
   # Install htop for better monitoring
   sudo apt install htop
   htop
   ```

## 🔄 Updates & Maintenance

### Updating the Application

1. **Pull latest changes**:
   ```bash
   cd /var/www/cenopie
   git pull origin main
   ```

2. **Update dependencies**:
   ```bash
   cd backend && npm ci --only=production
   cd ../frontend && npm ci --only=production
   ```

3. **Rebuild frontend**:
   ```bash
   cd frontend && npm run build
   ```

4. **Restart applications**:
   ```bash
   pm2 restart all
   ```

### Environment Variables Update

1. **Edit production environment files**:
   ```bash
   nano /var/www/cenopie/backend/.env.production
   nano /var/www/cenopie/frontend/.env.production
   ```

2. **Restart applications**:
   ```bash
   pm2 restart all
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Port 4000 already in use**:
   ```bash
   sudo lsof -ti:4000
   sudo kill -9 <PID>
   ```

2. **Nginx configuration test fails**:
   ```bash
   sudo nginx -t
   # Fix the configuration and test again
   ```

3. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

4. **Application not starting**:
   ```bash
   pm2 logs
   # Check the error logs for details
   ```

5. **Database connection issues**:
   ```bash
   # Check MongoDB Atlas connection
   # Verify IP whitelist includes your VPS IP
   ```

### Log Locations

- **Application Logs**: `/var/www/cenopie/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`
- **PM2 Logs**: `~/.pm2/logs/`

## 🔐 Security Considerations

### Firewall Rules
```bash
sudo ufw status
# Should show:
# 22/tcp (SSH)
# 80/tcp (HTTP)
# 443/tcp (HTTPS)
```

### SSL Security
- SSL certificates auto-renew via Certbot
- HTTPS redirect is configured
- Security headers are set in Nginx

### Application Security
- JWT secrets should be unique for production
- Database credentials should be secure
- API rate limiting is configured
- File upload limits are set

## 📞 Support

If you encounter issues:

1. **Check logs**: `pm2 logs` and `./monitor.sh`
2. **Verify configuration**: Environment variables and Nginx config
3. **Check system resources**: Memory, disk space, CPU usage
4. **Review firewall**: Ensure ports 80 and 443 are open

## 🎉 Success!

Your Cenopie application should now be running at:
- **Website**: https://cenopie.com
- **API Health**: https://cenopie.com/api/health

The deployment includes:
- ✅ Production-optimized Node.js applications
- ✅ SSL certificate with auto-renewal
- ✅ Nginx reverse proxy with security headers
- ✅ PM2 process management with clustering
- ✅ Log rotation and monitoring
- ✅ Firewall configuration
- ✅ Automated backups (if configured)

Your social networking platform is now live and ready for users! 🚀