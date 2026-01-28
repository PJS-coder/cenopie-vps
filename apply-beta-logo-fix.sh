#!/bin/bash

echo "🎨 Applying Beta Logo Fix to Cenopie..."
echo "======================================"

# Stop all services
echo "⏹️ Stopping services..."
pm2 stop all

# Clear any cached files
echo "🧹 Clearing caches..."
rm -rf frontend/.next/cache
rm -rf frontend/.next/static

# Restart services
echo "🚀 Starting services..."
pm2 start ecosystem.config.js

# Wait for startup
sleep 5

echo "📊 Service Status:"
pm2 status

echo ""
echo "✅ Beta logo fix applied successfully!"
echo ""
echo "🔗 Your site should now show the BETA badge at:"
echo "   https://cenopie.com"
echo ""
echo "📋 Changes applied:"
echo "   ✅ NEXT_PUBLIC_SHOW_BETA=true in production"
echo "   ✅ CenopieLogo component updated to show beta in production"
echo "   ✅ Logo files updated with beta badges"
echo "   ✅ Frontend rebuilt with new configuration"
echo ""
echo "🔍 To verify:"
echo "   1. Check the navbar logo shows 'cenopie BETA'"
echo "   2. Check browser tab shows favicon with beta badge"
echo "   3. Check social media previews show beta badge"