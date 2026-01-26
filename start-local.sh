#!/bin/bash

# Start Cenopie locally for development and testing
echo "🚀 Starting Cenopie locally..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}⚠️ MongoDB not running. Starting MongoDB...${NC}"
    # Try to start MongoDB (adjust command based on your system)
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo "Please start MongoDB manually"
    fi
fi

# Check if Redis is running (optional)
if ! pgrep -x "redis-server" > /dev/null; then
    echo -e "${YELLOW}⚠️ Redis not running. Starting Redis...${NC}"
    if command -v brew &> /dev/null; then
        brew services start redis
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start redis
    else
        echo "Redis not running - continuing without Redis"
    fi
fi

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
cd ..

# Start backend in background
echo -e "${GREEN}🔧 Starting backend server...${NC}"
cd backend
NODE_ENV=development npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo -e "${GREEN}🎨 Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Cenopie started successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend: http://localhost:4000${NC}"
echo -e "${GREEN}📚 API Docs: http://localhost:4000/api-docs${NC}"
echo "=================================================="
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait