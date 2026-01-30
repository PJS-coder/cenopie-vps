# Server Error Fix Guide - 525 & 413 Errors

## Current Issues
1. **525 SSL Handshake Failed** - Server SSL/TLS configuration issue
2. **413 Payload Too Large** - Upload size limits not properly configured

## Quick Fixes Applied (Frontend)

### ✅ Enhanced Error Handling
- Better error messages for 525, 413, 502, 503 errors
- Network error detection and user-friendly messages
- Retry logic for temporary server issues

### ✅ Upload Improvements
- Specific handling for 413 errors with guidance
- SSL error detection and reporting
- Better timeout handling

## Server-Side Fixes Needed

### 1. Fix 525 SSL Handshake Error

**Cause**: SSL/TLS configuration issue on the server

**Solutions**:

#### Option A: Cloudflare SSL Settings
If using Cloudflare:
```bash
# Set SSL/TLS encryption mode to "Full" or "Full (strict)"
# In Cloudflare Dashboard:
# SSL/TLS → Overview → Set to "Full" or "Full (strict)"
```

#### Option B: Server SSL Certificate
```bash
# Check SSL certificate validity
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew Let's Encrypt certificate if expired
sudo certbot renew

# Restart web server
sudo systemctl restart nginx
# or
sudo systemctl restart apache2
```

#### Option C: Nginx SSL Configuration
```nginx
# Add to your nginx server block
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 2. Fix 413 Payload Too Large Error

**Cause**: Server upload limits too small for video files

**Solutions**:

#### Nginx Configuration
Add to your server block:
```nginx
# For video uploads specifically
location /api/upload/interview-video {
    client_max_body_size 200m;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_pass http://your_backend;
}

# For general uploads
location /api/upload/ {
    client_max_body_size 50m;
    client_body_timeout 120s;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    proxy_pass http://your_backend;
}
```

#### Apache Configuration
Add to your virtual host:
```apache
# For video uploads
<Location "/api/upload/interview-video">
    LimitRequestBody 209715200  # 200MB
    TimeOut 300
</Location>

# For general uploads
<Location "/api/upload/">
    LimitRequestBody 52428800   # 50MB
    TimeOut 120
</Location>
```

#### Backend Environment Variables
Ensure these are set:
```bash
VIDEO_UPLOAD_LIMIT=209715200    # 200MB
GENERAL_UPLOAD_LIMIT=52428800   # 50MB
```

## Testing the Fixes

### 1. Test SSL Configuration
```bash
# Test SSL handshake
curl -I https://your-domain.com/api/health

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 2. Test Upload Limits
```bash
# Test with a large file (adjust path)
curl -X POST -F "video=@large-video-file.mp4" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/upload/interview-video
```

## Monitoring

### Check Server Logs
```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Apache error logs
sudo tail -f /var/log/apache2/error.log

# Application logs
sudo journalctl -u your-app-service -f
```

### Common Log Patterns
- **525 Error**: "SSL_do_handshake() failed"
- **413 Error**: "client intended to send too large body"

## Emergency Workarounds

### 1. Temporary SSL Bypass (Development Only)
```javascript
// In frontend .env.local (NEVER in production)
NEXT_PUBLIC_API_URL=http://your-domain.com:4000
```

### 2. Reduce Upload Limits Temporarily
```bash
# In backend .env
VIDEO_UPLOAD_LIMIT=10485760     # 10MB
GENERAL_UPLOAD_LIMIT=5242880    # 5MB
```

## Verification Checklist

- [ ] SSL certificate is valid and not expired
- [ ] Nginx/Apache upload limits configured
- [ ] Backend environment variables set
- [ ] Server restarted after configuration changes
- [ ] Test upload with large file succeeds
- [ ] SSL handshake test passes
- [ ] Error logs show no SSL or upload errors

## Contact Support

If issues persist after trying these fixes:
1. Provide server error logs
2. Include SSL certificate details
3. Share current nginx/Apache configuration
4. Specify hosting provider and setup details