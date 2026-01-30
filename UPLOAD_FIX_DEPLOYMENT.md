# 413 "Payload Too Large" Error Fix - Deployment Guide

## Problem
Interview video uploads are failing with a 413 "Payload Too Large" error when videos exceed the server's upload limits.

## Solution Overview
The fix involves configuring both the backend application and the reverse proxy (nginx/Apache) to handle larger file uploads.

## Backend Changes Made

### 1. Environment Variables Added
```bash
# Upload Configuration (in bytes)
VIDEO_UPLOAD_LIMIT=209715200    # 200MB for interview videos
GENERAL_UPLOAD_LIMIT=52428800   # 50MB for general uploads
```

### 2. Enhanced Error Handling
- Better error messages with specific file size limits
- Configurable limits via environment variables
- Improved debugging information

## Deployment Steps

### Step 1: Deploy Code Changes
The backend code changes are already committed and will be deployed automatically.

### Step 2: Configure Reverse Proxy

#### For nginx (Most Common)

1. **Find your nginx site configuration:**
   ```bash
   # Common locations:
   /etc/nginx/sites-available/cenopie.com
   /etc/nginx/conf.d/cenopie.conf
   ```

2. **Add these location blocks to your server configuration:**
   ```nginx
   # Video upload endpoint with larger body size limit
   location /api/upload/interview-video {
       client_max_body_size 200m;
       client_body_timeout 300s;
       proxy_read_timeout 300s;
       proxy_send_timeout 300s;
       proxy_pass http://your_backend_upstream;
   }
   
   # General upload endpoints with moderate limits  
   location /api/upload/ {
       client_max_body_size 50m;
       client_body_timeout 120s;
       proxy_read_timeout 120s;
       proxy_send_timeout 120s;
       proxy_pass http://your_backend_upstream;
   }
   ```

3. **Test and reload nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### For Apache

Add to your virtual host configuration:
```apache
# Increase upload limits
<Location "/api/upload/interview-video">
    LimitRequestBody 209715200  # 200MB
</Location>

<Location "/api/upload/">
    LimitRequestBody 52428800   # 50MB
</Location>
```

### Step 3: Environment Configuration

#### Production Environment
Ensure these variables are set in your production environment:
```bash
VIDEO_UPLOAD_LIMIT=209715200    # 200MB
GENERAL_UPLOAD_LIMIT=52428800   # 50MB
```

#### Development/Testing Environment
For testing with smaller limits:
```bash
VIDEO_UPLOAD_LIMIT=10485760     # 10MB for testing
GENERAL_UPLOAD_LIMIT=5242880    # 5MB for testing
```

## Verification

### Test the Fix
1. **Check backend logs** for upload size information
2. **Test with a large video file** (>10MB but <200MB)
3. **Verify error messages** are user-friendly

### Expected Behavior
- ✅ Videos up to 200MB should upload successfully
- ✅ Clear error messages for oversized files
- ✅ Proper timeout handling for large uploads

## Troubleshooting

### If 413 Errors Persist

1. **Check nginx/Apache logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/apache2/error.log
   ```

2. **Verify configuration:**
   ```bash
   # For nginx
   sudo nginx -t
   
   # For Apache
   sudo apache2ctl configtest
   ```

3. **Test without reverse proxy:**
   ```bash
   # Temporarily bypass nginx/Apache
   curl -X POST -F "video=@test-video.mp4" http://localhost:4000/api/upload/interview-video
   ```

### Common Issues

1. **Multiple nginx configurations:** Check for conflicting `client_max_body_size` directives
2. **Load balancer limits:** Cloud providers may have additional upload limits
3. **Cloudinary timeouts:** Large uploads may timeout during cloud processing

## Monitoring

### Log Messages to Watch For
```
Large request body: X bytes from IP
Content-Length exceeds XMB limit: Y
File successfully received: {...}
Cloudinary upload success: {...}
```

### Performance Impact
- Large uploads will consume more memory temporarily
- Network bandwidth usage will increase
- Consider implementing upload progress indicators

## Rollback Plan

If issues occur, you can quickly reduce limits:
```bash
# Emergency rollback - reduce to 10MB
export VIDEO_UPLOAD_LIMIT=10485760
export GENERAL_UPLOAD_LIMIT=10485760
```

Then restart the backend service.