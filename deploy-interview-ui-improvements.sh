#!/bin/bash

echo "🎨 Deploying Interview UI Improvements"
echo "====================================="

# Build frontend with improved interview UI
echo "📦 Building frontend with enhanced interview interface..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Restart services if PM2 is available
echo "🔄 Restarting services..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.js
    echo "✅ PM2 processes restarted"
else
    echo "⚠️ PM2 not found - please restart services manually"
fi

echo ""
echo "✅ Interview UI Improvements Deployed Successfully!"
echo ""
echo "🎨 UI Enhancements Made:"
echo "   • Professional gradient background design"
echo "   • Enhanced status bar with better security indicators"
echo "   • Structured question display with clear hierarchy"
echo "   • Improved progress tracking with visual indicators"
echo "   • Better video preview with recording status"
echo "   • Comprehensive side panel with multiple info sections"
echo "   • Question navigation grid for easy tracking"
echo "   • Professional color scheme and typography"
echo "   • Enhanced button designs with hover effects"
echo "   • Better spacing and visual organization"
echo ""
echo "🔧 Key Features:"
echo "   • Question header with domain and progress info"
echo "   • Clear instructions panel for each question"
echo "   • Real-time security status monitoring"
echo "   • Visual progress completion percentage"
echo "   • Question grid navigation (1-10 layout)"
echo "   • Enhanced video preview with guidance"
echo "   • Professional status indicators"
echo ""
echo "📋 Test the New UI:"
echo "   1. Navigate to any interview: /interviews/[id]/start"
echo "   2. Complete device check and setup"
echo "   3. Start interview to see the new interface"
echo "   4. Notice the improved question display"
echo "   5. Check the enhanced side panel information"
echo "   6. Test the progress tracking and navigation"
echo ""
echo "🚀 Interview experience is now more professional and user-friendly!"