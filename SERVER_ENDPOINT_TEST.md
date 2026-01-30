# Server Endpoint Testing

Run these commands on your server to test the upload endpoint:

## 1. Test Upload Endpoint (should return 401, not 404)
```bash
curl -X POST http://localhost:4000/api/upload/interview-video
```

## 2. Test Upload Test Endpoint
```bash
curl -X GET http://localhost:4000/api/upload/test
```

## 3. Test with Authentication Header (will still fail without file, but should not be 404)
```bash
curl -X POST http://localhost:4000/api/upload/interview-video \
  -H "Authorization: Bearer fake-token"
```

## 4. Check if PM2 processes are running
```bash
pm2 list
```

## 5. Check backend logs
```bash
pm2 logs backend
```

## Expected Results:
- ✅ `/api/upload/interview-video` → 401 Unauthorized (not 404)
- ✅ `/api/upload/test` → 200 OK with "Upload route is working!"
- ❌ If getting 404, the upload routes aren't loaded properly

## If Getting 404 Errors:
The upload routes might not be properly registered. Check:
1. Is the backend server running the latest code?
2. Are there any startup errors in the logs?
3. Does the uploadRoutes.js file exist in the deployed code?