#!/bin/bash

echo "🚀 Quick MIME type fix for static assets..."

# Test nginx configuration first
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx to apply MIME type fixes
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        
        # Clear browser cache recommendation
        echo ""
        echo "🎉 MIME type fix applied!"
        echo ""
        echo "What was fixed:"
        echo "- Added 'include /etc/nginx/mime.types;' to server block"
        echo "- Added explicit Content-Type headers for CSS and JS files"
        echo "- CSS files now served as 'text/css'"
        echo "- JS files now served as 'application/javascript'"
        echo ""
        echo "⚠️  Important: Clear your browser cache or do a hard refresh (Ctrl+F5 / Cmd+Shift+R)"
        echo "to see the changes take effect."
        echo ""
        echo "If issues persist, run './fix-static-assets.sh' for a complete rebuild."
        
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the nginx configuration syntax"
    exit 1
fi