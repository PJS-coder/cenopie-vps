# Cenopie JavaScript Loading Issues - Troubleshooting Guide

## Problem Summary
Your Next.js application is failing to load JavaScript chunks with these errors:
- 404 errors for layout and page chunks
- MIME type errors (files served as `text/plain` instead of `application/javascript`)
- ChunkLoadError preventing the app from loading

## Root Causes Identified

1. **Incorrect PM2 Configuration**: Using standalone output mode incorrectly
2. **Nginx Static File Serving**: Not serving Next.js static files directly from filesystem
3. **MIME Type Issues**: Nginx not setting correct Content-Type headers for JS files

## Immediate Fix Steps

### Step 1: Update Configuration Files
The following files have been updated in your repository:
- `ecosystem.config.js` - Fixed frontend PM2 configuration
- `nginx.conf` - Added proper static file serving and MIME types
- `frontend/next.config.js` - Removed problematic standalone output

### Step 2: Run the Fix Script
On your production server, run:
```bash
cd /var/www/cenopie-vps
./fix-deployment.sh
```

This script will:
- Stop existing PM2 processes
- Clear port conflicts
- Rebuild the frontend properly
- Update nginx configuration
- Restart services with correct settings

## Manual Fix (Alternative)

If you prefer to fix manually:

### 1. Stop Services and Clear Ports
```bash
pm2 stop all
pm2 delete all
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
```

### 2. Rebuild Frontend
```bash
cd /var/www/cenopie-vps/frontend
rm -rf .next node_modules/.cache
npm ci
npm run build:prod
```

### 3. Update Nginx Configuration
```bash
# Backup current config
cp /etc/nginx/sites-available/cenopie.com /etc/nginx/sites-available/cenopie.com.backup

# Copy new config
cp /var/www/cenopie-vps/nginx.conf /etc/nginx/sites-available/cenopie.com

# Test and reload
nginx -t
systemctl reload nginx
```

### 4. Start Services
```bash
cd /var/www/cenopie-vps
pm2 start ecosystem.config.js
pm2 save
```

## Key Changes Made

### 1. PM2 Configuration (`ecosystem.config.js`)
**Before:**
```javascript
script: 'server.js',
cwd: '/var/www/cenopie-vps/frontend/.next/standalone',
instances: 2,
exec_mode: 'cluster'
```

**After:**
```javascript
script: 'npm',
args: 'run start:prod',
cwd: '/var/www/cenopie-vps/frontend',
instances: 1,
exec_mode: 'fork'
```

### 2. Nginx Configuration (`nginx.conf`)
**Added:**
- Direct filesystem serving for `/_next/static/` files
- Proper Content-Type headers for JavaScript files
- Fallback to proxy for dynamic content

### 3. Next.js Configuration (`frontend/next.config.js`)
**Removed:**
```javascript
output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
```

## Verification Steps

After applying the fix, verify:

### 1. Check PM2 Status
```bash
pm2 status
```
Should show both services as "online" with low restart counts.

### 2. Test Static File Serving
```bash
curl -I https://cenopie.com/_next/static/chunks/webpack-[hash].js
```
Should return `Content-Type: application/javascript`

### 3. Check Browser Console
- No 404 errors for chunk files
- No MIME type errors
- Application loads successfully

### 4. Monitor Logs
```bash
pm2 logs --lines 50
```
Should show no chunk loading errors.

## Common Issues and Solutions

### Issue: Still Getting 404 Errors
**Solution:** Ensure nginx has read permissions to the frontend directory:
```bash
chown -R www-data:www-data /var/www/cenopie-vps/frontend/.next
chmod -R 755 /var/www/cenopie-vps/frontend/.next
```

### Issue: MIME Type Still Wrong
**Solution:** Check nginx MIME types configuration:
```bash
nginx -T | grep "include.*mime.types"
```

### Issue: PM2 Process Keeps Restarting
**Solution:** Check logs for specific errors:
```bash
pm2 logs cenopie-frontend --lines 100
```

## Prevention

To prevent this issue in the future:

1. **Always test builds locally** before deploying
2. **Use consistent Node.js versions** between development and production
3. **Monitor PM2 logs** after deployments
4. **Test static file serving** after nginx changes

## Support Commands

```bash
# Check what's using ports
netstat -tlnp | grep -E ':(3001|4000)'

# Test nginx configuration
nginx -t

# Reload nginx without restart
systemctl reload nginx

# Check PM2 process details
pm2 show cenopie-frontend

# Monitor real-time logs
pm2 logs --lines 0 --raw | grep -E '(ERROR|error|404|MIME)'
```

## Success Indicators

✅ PM2 status shows "online" for both services  
✅ No 404 errors in browser console  
✅ JavaScript files load with correct MIME type  
✅ Application renders properly  
✅ No ChunkLoadError messages  
✅ Static assets load from `/_next/static/` path  

If you continue to experience issues after following this guide, check the PM2 logs and nginx error logs for specific error messages.