# Common Local Development Issues & Fixes

## 1. MongoDB Connection Issues
```bash
# Install MongoDB locally (macOS)
brew install mongodb-community
brew services start mongodb-community

# Install MongoDB locally (Ubuntu)
sudo apt install mongodb
sudo systemctl start mongodb
```

## 2. Redis Connection Issues
```bash
# Install Redis locally (macOS)
brew install redis
brew services start redis

# Install Redis locally (Ubuntu)
sudo apt install redis-server
sudo systemctl start redis
```

## 3. Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

## 4. Socket.IO Connection Issues
- Check that backend is running on port 5000
- Check that NEXT_PUBLIC_API_URL is set to http://localhost:5000
- Check browser console for detailed error messages

## 5. Missing Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## 6. Environment Variables
- Make sure .env.local files exist in both backend and frontend
- Check that MongoDB and Redis URLs are correct for your local setup

## 7. CORS Issues
- Backend should allow http://localhost:3000 in CORS origins
- Check browser network tab for CORS errors

## 8. Build Issues
```bash
# Clean and rebuild frontend
cd frontend
rm -rf .next node_modules/.cache
npm run build
```