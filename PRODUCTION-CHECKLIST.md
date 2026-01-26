# 🚀 Cenopie Production Deployment Checklist

Use this checklist to ensure a successful production deployment.

## ✅ Pre-Deployment Checklist

### Server Preparation
- [ ] Ubuntu 20.04+ VPS with minimum 2GB RAM
- [ ] Root or sudo access configured
- [ ] Domain name pointed to server IP (if using custom domain)
- [ ] SSH key authentication setup
- [ ] Firewall configured (ports 22, 80, 443 open)

### Code Preparation
- [ ] All code committed and pushed to main branch
- [ ] Environment variables configured for production
- [ ] Database connection strings updated
- [ ] JWT secrets generated (minimum 32 characters)
- [ ] Cloudinary credentials configured
- [ ] All console.log statements removed/minimized

## 🔧 Deployment Steps

### 1. Initial Setup
- [ ] Run automated deployment: `sudo ./vps-deploy/deploy.sh`
- [ ] Verify Node.js 18+ installed: `node --version`
- [ ] Verify PM2 installed: `pm2 --version`
- [ ] Verify Nginx installed: `nginx -v`

### 2. Application Configuration
- [ ] Backend environment file configured: `/opt/cenopie/backend/.env.production`
- [ ] Frontend environment file configured: `/opt/cenopie/frontend/.env.production`
- [ ] Database connection tested
- [ ] File upload service (Cloudinary) tested

### 3. Service Management
- [ ] PM2 processes started: `pm2 status`
- [ ] PM2 startup script configured: `pm2 startup`
- [ ] PM2 processes saved: `pm2 save`
- [ ] Applications accessible on localhost:3000 and localhost:4000

### 4. Web Server Configuration
- [ ] Nginx configuration copied and enabled
- [ ] Domain name updated in Nginx config (if applicable)
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`

### 5. SSL Certificate (Optional but Recommended)
- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo certbot --nginx -d yourdomain.com`
- [ ] Auto-renewal configured
- [ ] HTTPS redirect working

## 🧪 Testing Checklist

### Application Testing
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] API endpoints respond correctly
- [ ] File uploads work (if applicable)
- [ ] Real-time features work (Socket.IO)
- [ ] Database operations work

### Performance Testing
- [ ] Page load times acceptable (< 3 seconds)
- [ ] API response times acceptable (< 500ms)
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] No memory leaks detected

### Security Testing
- [ ] HTTPS working (if SSL configured)
- [ ] Security headers present
- [ ] No sensitive data exposed in client
- [ ] Rate limiting working
- [ ] Authentication working properly

## 📊 Monitoring Setup

### Health Monitoring
- [ ] Monitoring script installed: `/usr/local/bin/cenopie-monitor`
- [ ] Monitoring cron job configured (every 5 minutes)
- [ ] Alert email configured (optional)
- [ ] Webhook alerts configured (optional)

### Backup Setup
- [ ] Backup script installed: `/usr/local/bin/cenopie-backup`
- [ ] Daily backup cron job configured
- [ ] Backup directory created: `/opt/backups/cenopie`
- [ ] Test backup and restore process

### Log Management
- [ ] Application logs accessible: `pm2 logs`
- [ ] Nginx logs accessible: `/var/log/nginx/`
- [ ] Log rotation configured
- [ ] Log monitoring setup (optional)

## 🔐 Security Checklist

### Server Security
- [ ] Firewall enabled and configured
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled (recommended)
- [ ] Fail2ban installed and configured
- [ ] Regular security updates scheduled

### Application Security
- [ ] Strong JWT secrets (32+ characters)
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Rate limiting configured

### SSL/TLS Security
- [ ] SSL certificate installed and valid
- [ ] HTTPS redirect configured
- [ ] Security headers configured
- [ ] TLS 1.2+ only
- [ ] HSTS header configured

## 🚀 Go-Live Checklist

### Final Verification
- [ ] All services running: `pm2 status`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Database connected
- [ ] External services working (Cloudinary, etc.)
- [ ] Domain DNS propagated (if using custom domain)

### Performance Check
- [ ] Server resources adequate (< 80% usage)
- [ ] Application responding quickly
- [ ] No errors in logs
- [ ] All features working as expected

### Monitoring Active
- [ ] Health checks running
- [ ] Alerts configured and tested
- [ ] Backup system working
- [ ] Log monitoring active

## 📋 Post-Deployment Tasks

### Immediate (First 24 hours)
- [ ] Monitor application logs for errors
- [ ] Check server resource usage
- [ ] Verify all features working
- [ ] Test backup system
- [ ] Monitor SSL certificate status

### Weekly
- [ ] Review application logs
- [ ] Check server resource trends
- [ ] Verify backup integrity
- [ ] Update system packages
- [ ] Review security logs

### Monthly
- [ ] Performance review and optimization
- [ ] Security audit
- [ ] Backup restoration test
- [ ] SSL certificate renewal check
- [ ] Dependency updates

## 🆘 Emergency Contacts and Procedures

### Key Information
- **Server IP**: `your-server-ip`
- **Domain**: `yourdomain.com`
- **SSH User**: `your-username`
- **Application Path**: `/opt/cenopie`

### Emergency Commands
```bash
# Restart all services
pm2 restart all
sudo systemctl restart nginx

# Check service status
pm2 status
sudo systemctl status nginx

# View recent logs
pm2 logs --lines 50
sudo tail -f /var/log/nginx/error.log

# Emergency stop
pm2 stop all

# Emergency start
pm2 start /opt/cenopie/ecosystem.config.js --env production
```

### Rollback Procedure
```bash
cd /opt/cenopie
git log --oneline -10  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH
cd backend && npm install --production
cd ../frontend && npm install && npm run build:prod
pm2 restart all
```

## 📞 Support Resources

### Documentation
- [Deployment Guide](./DEPLOYMENT.md)
- [VPS Deploy Scripts](./vps-deploy/)
- [Application README](./README.md)

### Useful Commands Reference
```bash
# PM2 Management
pm2 status
pm2 logs
pm2 restart all
pm2 monit

# System Monitoring
htop
df -h
free -h
netstat -tlnp

# Nginx Management
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log

# SSL Management
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## ✅ Deployment Complete!

Once all items in this checklist are completed, your Cenopie application should be successfully deployed and running in production.

**Remember to**:
- Keep this checklist for future deployments
- Document any custom configurations
- Maintain regular backups
- Monitor application health
- Keep dependencies updated

**Your application should now be live at**: `https://yourdomain.com`