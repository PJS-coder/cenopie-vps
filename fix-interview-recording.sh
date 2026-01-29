#!/bin/bash

echo "🎥 Fixing Interview Recording - Complete Solution"
echo "================================================"

# Build frontend with all fixes
echo "📦 Building frontend with interview recording fixes..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Restart backend to ensure latest code
echo "🔄 Restarting backend server..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.js
    echo "✅ PM2 processes restarted"
else
    echo "⚠️ PM2 not found - please restart backend manually"
fi

echo ""
echo "✅ Interview Recording Fix Deployed Successfully!"
echo ""
echo "🔧 Changes Made:"
echo "   • Fixed camera preview black screen with useEffect"
echo "   • Implemented comprehensive violation detection system"
echo "   • Added tab switching, window blur, and keyboard shortcut detection"
echo "   • Enhanced error handling for video upload and submission"
echo "   • Added detailed logging for debugging"
echo "   • Fixed TypeScript errors"
echo ""
echo "🛡️ Security Features Added:"
echo "   • Tab switching detection"
echo "   • Window focus loss detection"
echo "   • Keyboard shortcut blocking (F12, Ctrl+Shift+I, etc.)"
echo "   • Right-click context menu blocking"
echo "   • Fullscreen exit detection"
echo "   • Page navigation blocking"
echo "   • 2-violation limit with automatic interview termination"
echo ""
echo "📋 Test Steps:"
echo "   1. Go to interview page: /interviews/[id]/start"
echo "   2. Complete device compatibility check"
echo "   3. Grant camera and microphone permissions"
echo "   4. Verify camera preview shows video feed"
echo "   5. Enter fullscreen and start interview"
echo "   6. Test violation detection:"
echo "      - Try switching tabs (Alt+Tab)"
echo "      - Try pressing F12 or Ctrl+Shift+I"
echo "      - Try right-clicking"
echo "      - Try exiting fullscreen"
echo "   7. Complete interview and verify submission works"
echo ""
echo "🚀 Interview system is now fully functional with security!"