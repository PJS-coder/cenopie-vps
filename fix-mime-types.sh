#!/bin/bash

echo "🔧 Fixing MIME type issues for Next.js static assets..."

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        
        # Check if Next.js is running
        echo "Checking Next.js frontend status..."
        if pgrep -f "next" > /dev/null; then
            echo "✅ Next.js is running"
        else
            echo "⚠️  Next.js is not running, starting it..."
            cd frontend
            npm run build
            pm2 restart frontend || npm run start &
            cd ..
        fi
        
        echo "🎉 MIME type fix applied successfully!"
        echo ""
        echo "The following changes were made:"
        echo "- Added proper MIME type configuration to nginx"
        echo "- CSS files will now be served as 'text/css'"
        echo "- JS files will now be served as 'application/javascript'"
        echo "- Other static assets have proper MIME types"
        echo ""
        echo "Please test your site now. The MIME type errors should be resolved."
        
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration and try again"
    exit 1
fi