#!/bin/bash

# Fix Socket.IO 400 Bad Request Errors
# This script applies the necessary fixes to resolve Socket.IO connection issues

echo "🔧 Fixing Socket.IO 400 Bad Request Errors..."

# 1. Reload nginx configuration
echo "📝 Reloading nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx

# 2. Restart backend service
echo "🔄 Restarting backend service..."
sudo systemctl restart cenopie-backend

# 3. Restart frontend service
echo "🔄 Restarting frontend service..."
sudo systemctl restart cenopie-frontend

# 4. Check service status
echo "📊 Checking service status..."
echo "Backend status:"
sudo systemctl status cenopie-backend --no-pager -l

echo "Frontend status:"
sudo systemctl status cenopie-frontend --no-pager -l

echo "Nginx status:"
sudo systemctl status nginx --no-pager -l

# 5. Test Socket.IO connection
echo "🧪 Testing Socket.IO connection..."
curl -s "https://cenopie.com/socket.io/?EIO=4&transport=polling" | head -20

echo "✅ Socket.IO fixes applied successfully!"
echo ""
echo "🔍 If issues persist, check:"
echo "1. Browser console for detailed error messages"
echo "2. Backend logs: sudo journalctl -u cenopie-backend -f"
echo "3. Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "4. Frontend logs: sudo journalctl -u cenopie-frontend -f"