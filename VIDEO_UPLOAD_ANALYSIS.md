# Interview Video Upload Capacity Analysis - Updated for 12 Minutes

## Current Configuration

### Upload Limits
- **Maximum File Size**: 200MB (209,715,200 bytes)
- **Timeout**: 5 minutes (300 seconds)
- **Format**: WebM (optimized for web)
- **Interview Duration**: 12 minutes

## Video Duration vs File Size Analysis

### WebM Video Recording Quality Settings
The interview system uses these MediaRecorder settings:
- **Video Codec**: VP9 (with VP8 fallback)
- **Audio Codec**: Opus
- **Video Bitrate**: 1 Mbps (1,000,000 bits/second)
- **Audio Bitrate**: 128 kbps (128,000 bits/second)

### File Size Calculations

**Total Bitrate**: 1,128,000 bits/second (1.128 Mbps)

| Duration | Estimated File Size | Within 200MB Limit? |
|----------|-------------------|-------------------|
| 1 minute | ~8.5 MB | ✅ Yes |
| 2 minutes | ~17 MB | ✅ Yes |
| 5 minutes | ~42 MB | ✅ Yes |
| 10 minutes | ~85 MB | ✅ Yes |
| **12 minutes** | **~102 MB** | ✅ **Yes** |
| 15 minutes | ~127 MB | ✅ Yes |
| 20 minutes | ~170 MB | ✅ Yes |
| 23 minutes | ~195 MB | ✅ Yes (close to limit) |
| 25 minutes | ~212 MB | ❌ No (exceeds limit) |

## 12-Minute Video Analysis

### File Size for 12-Minute Interview
- **Estimated Size**: ~102 MB
- **Actual Range**: 85-120 MB (depending on content complexity)
- **Safety Margin**: 98 MB remaining (well within limits)

### Upload Time Estimates for 102MB Video

| Internet Speed | Upload Time |
|---------------|-------------|
| 10 Mbps | ~82 seconds (1.4 minutes) |
| 25 Mbps | ~33 seconds |
| 50 Mbps | ~16 seconds |
| 100 Mbps | ~8 seconds |

**Average Upload Time for 12-minute video**: **35-75 seconds**

## Current System Capacity

### Maximum Interview Duration
- **Theoretical Maximum**: ~23 minutes (195 MB)
- **Recommended Maximum**: ~20 minutes (170 MB) - safe buffer
- **Current Setting**: 12 minutes (102 MB) - very safe

### Performance Characteristics

**Advantages of Current Setup**:
- ✅ 12-minute videos upload quickly (35-75 seconds)
- ✅ Good safety margin (98 MB unused capacity)
- ✅ Reliable upload success rate
- ✅ Good video quality at 1 Mbps

### Upload Speed Factors**:
- User's internet upload speed
- Cloudinary server load
- Video content complexity (affects compression)
- **Asynchronous Processing**: Large videos (12+ minutes) use async processing for reliability

## Recommendations

### For 12-Minute Interviews
- **Status**: ✅ **Fully Supported**
- **File Size**: ~102 MB (51% of limit used)
- **Upload Time**: 35-75 seconds average
- **Success Rate**: Very high
- **Processing**: Asynchronous (eager_async=true) for reliability

### If You Want Longer Videos
- **15 minutes**: Safe (127 MB)
- **20 minutes**: Safe (170 MB)
- **25+ minutes**: Would need limit increase

### To Increase Capacity (if needed)
```env
# Increase to 400MB for ~45-minute videos
VIDEO_UPLOAD_LIMIT=419430400

# Or 600MB for ~70-minute videos  
VIDEO_UPLOAD_LIMIT=629145600
```

## Real-World Performance

### Typical Upload Times (12-minute video)
- **Fast Connection (50+ Mbps)**: 20-35 seconds
- **Medium Connection (25 Mbps)**: 35-55 seconds
- **Slow Connection (10 Mbps)**: 75-105 seconds
- **Very Slow Connection (5 Mbps)**: 2.5-3.5 minutes

### Success Rate Factors
- ✅ File size well under limit
- ✅ 5-minute timeout is sufficient
- ✅ WebM format is optimized
- ✅ Cloudinary handles video well

## Conclusion

**Your 12-minute interview videos are fully supported:**
- 📁 File size: ~102 MB (well under 200 MB limit)
- ⏱️ Upload time: 35-75 seconds average
- ✅ Success rate: Very high
- 🔒 Safe margin: 98 MB unused capacity
- ⚡ **Async Processing**: Uses `eager_async=true` for reliable large video handling

The current configuration is optimal for 12-minute interviews with fast, reliable uploads and asynchronous processing for better stability.