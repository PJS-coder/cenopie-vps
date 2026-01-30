#!/bin/bash

# Start both frontend and backend for development
echo "🚀 Starting Cenopie Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "📡 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "📡 Backend: http://localhost:4000"
echo "🌐 Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait