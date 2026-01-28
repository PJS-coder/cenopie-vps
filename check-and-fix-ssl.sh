#!/bin/bash

echo "🔍 Checking for existing SSL certificates..."

# Check if certificates already exist
if [ -d "/etc/letsencrypt/live/cenopie.com" ]; then
    echo "✅ Found existing SSL certificates!"
    
    # Check certificate validity
    echo "📅 Certificate expiry:"
    openssl x509 -in /etc/letsencrypt/live/cenopie.com/fullchain.pem -text -noout | grep -A2 "Validity"
    
    echo ""
    echo "🔧 Updating Nginx to use existing SSL certificates..."
    
    # Create full HTTPS configuration using existing certificates
    cat > /etc/nginx/sites-available/cenopie.com << 'EOF'
# Full HTTPS Configuration for Cenopie using existing certificates

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream servers
upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name cenopie.com www.cenopie.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://cenopie.com$request_uri;
    }
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    server_name www.cenopie.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/cenopie.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cenopie.com/privkey.pem;
    
    return 301 https://cenopie.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name cenopie.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/cenopie.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cenopie.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Compression
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
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
    
    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
    
    # Next.js static files
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }
    
    # All other requests to frontend
    location / {
        proxy_pass http://frontend;
    }
}
EOF
    
    # Test and reload nginx
    nginx -t
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        echo "✅ Nginx reloaded with HTTPS configuration"
        
        # Test HTTPS
        echo ""
        echo "🧪 Testing HTTPS access..."
        sleep 2
        curl -s -I https://cenopie.com | head -2
        
        echo ""
        echo "🎉 HTTPS is now working!"
        echo "Your site is accessible at: https://cenopie.com"
        
    else
        echo "❌ Nginx configuration error"
    fi
    
else
    echo "❌ No existing SSL certificates found"
    echo ""
    echo "🔧 Since you hit the rate limit, let's set up Cloudflare SSL mode:"
    echo ""
    echo "OPTION 1 - Use Cloudflare 'Flexible' SSL:"
    echo "1. Go to Cloudflare Dashboard → SSL/TLS → Overview"
    echo "2. Set SSL mode to 'Flexible'"
    echo "3. Your site will work with HTTPS via Cloudflare"
    echo ""
    echo "OPTION 2 - Wait for rate limit (recommended):"
    echo "Rate limit resets after 7 days. You can generate new certificates after:"
    echo "2026-01-27 17:23:15 UTC"
    echo ""
    echo "OPTION 3 - Use HTTP for now:"
    echo "Your site is working at: http://cenopie.com"
    echo "Cloudflare will show 521 error for HTTPS until SSL is configured"
    
    # Test HTTP access
    echo ""
    echo "🧪 Testing HTTP access:"
    curl -s -I http://cenopie.com | head -2
fi