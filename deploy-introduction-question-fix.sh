#!/bin/bash

echo "👋 Deploying Introduction Question Fix"
echo "====================================="

# Build frontend with introduction question enhancements
echo "📦 Building frontend with introduction question logic..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# Restart services
echo "🔄 Restarting services..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.js
    echo "✅ PM2 processes restarted"
else
    echo "⚠️ PM2 not found - please restart services manually"
fi

echo ""
echo "✅ Introduction Question Fix Deployed Successfully!"
echo ""
echo "👋 Key Changes Made:"
echo "   • First question is ALWAYS introduction and experience"
echo "   • Remaining 9 questions are randomly selected from the pool"
echo "   • Introduction question has special green styling"
echo "   • Different instructions for introduction vs technical questions"
echo "   • Question navigation shows 'I' for introduction question"
echo "   • Enhanced visual distinction between question types"
echo ""
echo "🎯 Interview Structure Now:"
echo "   1. Introduction & Experience (Fixed - Always First)"
echo "   2-10. Technical Questions (Random from domain pool)"
echo ""
echo "🎨 UI Enhancements:"
echo "   • Green badge for introduction question"
echo "   • Blue badge for technical questions"
echo "   • Tailored instructions for each question type"
echo "   • Special 'I' marker in question navigation grid"
echo "   • Color-coded progress tracking"
echo ""
echo "📋 Introduction Question:"
echo "   'Please introduce yourself and walk me through your"
echo "   educational background, relevant experience, and what"
echo "   interests you about this role and our company.'"
echo ""
echo "✨ Benefits:"
echo "   • Consistent interview experience for all candidates"
echo "   • Proper introduction allows candidates to settle in"
echo "   • HR gets standardized introduction from everyone"
echo "   • Technical questions remain varied and challenging"
echo ""
echo "🚀 Every interview now starts with a proper introduction!"