#!/bin/bash

echo "🎯 Deploying Product & Management Interview System"
echo "================================================"

# Seed the database with 100 Product & Management questions
echo "📚 Seeding Product & Management questions..."
cd backend
node scripts/seed-product-management-questions.js

if [ $? -eq 0 ]; then
    echo "✅ Questions seeded successfully"
else
    echo "❌ Question seeding failed"
    exit 1
fi

cd ..

# Build frontend with enhanced interview UI
echo "📦 Building frontend with enhanced interview system..."
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
echo "✅ Product & Management Interview System Deployed Successfully!"
echo ""
echo "🎯 System Features:"
echo "   • 100 comprehensive Product & Management questions"
echo "   • 6 specialized domains with balanced question distribution"
echo "   • Random question selection (10 out of 100 per interview)"
echo "   • Question shuffling for each interview session"
echo "   • Enhanced UI with category and difficulty indicators"
echo ""
echo "📊 Question Distribution:"
echo "   • Product Strategy: 20 questions"
echo "   • Sales & Marketing: 15 questions"
echo "   • Operations & Supply Chain: 15 questions"
echo "   • Finance & HR Basics: 10 questions"
echo "   • Behavioral & Situational: 20 questions"
echo "   • Leadership & Critical Thinking: 20 questions"
echo ""
echo "🔧 Technical Implementation:"
echo "   • Smart shuffling algorithm ensures variety"
echo "   • Balanced difficulty distribution (Easy/Medium/Hard)"
echo "   • Category-based question organization"
echo "   • Enhanced interview UI with professional design"
echo "   • Real-time progress tracking and question navigation"
echo ""
echo "📋 How to Test:"
echo "   1. Create a new interview with domain 'Product Strategy'"
echo "   2. Notice 10 random questions are selected from 20 available"
echo "   3. Each interview will have different question combinations"
echo "   4. UI shows question category and difficulty level"
echo "   5. Questions cover all aspects of Product & Management"
echo ""
echo "🎨 UI Enhancements:"
echo "   • Question category display (e.g., 'Strategic Thinking')"
echo "   • Difficulty badges (Easy/Medium/Hard with color coding)"
echo "   • Professional gradient design"
echo "   • Enhanced progress tracking"
echo "   • Better visual hierarchy"
echo ""
echo "🚀 The interview system now provides comprehensive Product & Management assessment!"