# 🚀 Cenopie Production Deployment Checklist

## Pre-Deployment Setup

### 1. **VPS Server Setup**
- [ ] Connect to your VPS via SSH
- [ ] Run server setup: `sudo ./setup-server.sh`
- [ ] Verify all services are running
- [ ] Create cenopie user and set permissions

### 2. **Domain Configuration**
- [ ] Point DNS A records to your VPS IP:
  - `cenopie.com` → Your VPS IP
  - `www.cenopie.com` → Your VPS IP  
  - `api.cenopie.com` → Your VPS IP
- [ ] Wait for DNS propagation (can take up to 24 hours)
- [ ] Verify DNS with: `nslookup cenopie.com`

### 3. **Upload Application Code**
```bash
# On your local machine
rsync -avz --exclude node_modules --exclude .git . cenopie@your-vps-ip:/var/www/cenopie/
```

### 4. **Environment Variables**
- [ ] Update `backend/.env.production` with real values:
  - [ ] MongoDB connection string
  - [ ] JWT secrets (generate strong secrets)
  - [ ] Email SMTP settings
  - [ ] Cloudinary credentials
  - [ ] Redis password (if any)
- [ ] Update `frontend/.env.production` with real values:
  - [ ] Analytics IDs
  - [ ] Sentry DSN
  - [ ] Cloudinary cloud name

## Deployment Steps

### 1. **Initial Deployment**
```bash
# On your VPS as cenopie user
cd /var/www/cenopie
./deploy.sh
```

### 2. **SSL Certificate Setup**
```bash
# On your VPS as root
sudo ./setup-ssl.sh
```

### 3. **Verify Deployment**
- [ ] Check PM2 status: `pm2 status`
- [ ] Check application logs: `pm2 logs`
- [ ] Test frontend: `curl -I https://cenopie.com`
- [ ] Test backend: `curl -I https://api.cenopie.com/api/health`

## Post-Deployment Configuration

### 1. **Database Setup**
```bash
# Connect to MongoDB and create admin user
mongosh
use cenopie_production
db.createUser({
  user: "cenopie_admin",
  pwd: "your-secure-password",
  roles: ["readWrite"]
})
```

### 2. **Security Hardening**
- [ ] Change default SSH port
- [ ] Disable root SSH login
- [ ] Set up SSH key authentication
- [ ] Configure fail2ban rules
- [ ] Update firewall rules if needed

### 3. **Monitoring Setup**
- [ ] Set up log monitoring
- [ ] Configure backup verification
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry)

### 4. **Performance Optimization**
- [ ] Enable Nginx gzip compression
- [ ] Configure browser caching
- [ ] Set up CDN (optional)
- [ ] Optimize database indexes

## Testing Checklist

### 1. **Frontend Testing**
- [ ] Homepage loads: https://cenopie.com
- [ ] User registration works
- [ ] User login works
- [ ] Profile pages load
- [ ] Feed functionality works
- [ ] Messaging system works
- [ ] File uploads work

### 2. **Backend Testing**
- [ ] API health check: https://api.cenopie.com/api/health
- [ ] Authentication endpoints work
- [ ] Database connections work
- [ ] Redis connections work
- [ ] Email sending works
- [ ] File upload to Cloudinary works

### 3. **Performance Testing**
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] WebSocket connections work
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## Maintenance Setup

### 1. **Automated Backups**
- [ ] Database backups running daily
- [ ] Application file backups
- [ ] Backup retention policy (7 days)
- [ ] Test backup restoration

### 2. **Log Management**
- [ ] Log rotation configured
- [ ] Log monitoring alerts
- [ ] Error log analysis

### 3. **Updates & Patches**
- [ ] System update schedule
- [ ] Application update process
- [ ] Security patch management

## Troubleshooting Commands

```bash
# Check system status
cenopie-status.sh

# Check PM2 applications
pm2 status
pm2 logs
pm2 restart all

# Check services
systemctl status nginx
systemctl status mongod
systemctl status redis-server

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/cenopie/*.log

# Check disk space
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn
```

## Emergency Procedures

### 1. **Application Down**
```bash
pm2 restart all
systemctl restart nginx
```

### 2. **Database Issues**
```bash
systemctl restart mongod
mongosh --eval "db.runCommand({ping: 1})"
```

### 3. **High Memory Usage**
```bash
pm2 restart all
systemctl restart redis-server
```

### 4. **SSL Certificate Issues**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Success Criteria

- [ ] ✅ Website accessible at https://cenopie.com
- [ ] ✅ API accessible at https://api.cenopie.com
- [ ] ✅ SSL certificates valid and auto-renewing
- [ ] ✅ All core features working
- [ ] ✅ Performance metrics within targets
- [ ] ✅ Monitoring and alerts configured
- [ ] ✅ Backup and recovery tested
- [ ] ✅ Security measures in place

## Support Information

**Server Details:**
- OS: Ubuntu 20.04+ LTS
- Node.js: 20.x LTS
- MongoDB: 7.0
- Redis: Latest
- Nginx: Latest
- PM2: Latest

**Key Directories:**
- Application: `/var/www/cenopie`
- Logs: `/var/log/cenopie`
- Backups: `/var/backups/cenopie`
- Nginx Config: `/etc/nginx/sites-available/cenopie.com`
- SSL Certificates: `/etc/letsencrypt/live/cenopie.com/`

---

🎉 **Congratulations!** Your Cenopie application is now running in production!