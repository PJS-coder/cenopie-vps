# Interview Notifications Implementation

## Overview
Added comprehensive notification system for students when they get selected or rejected in interviews. Students now receive both database notifications and real-time toast notifications when HR admins or companies review their interviews.

## Backend Changes

### 1. Updated Notification Model (`backend/src/models/Notification.js`)
- Added `interview_decision` to notification types enum
- Added `relatedInterview` field to link notifications to specific interviews

### 2. Updated HR Admin Routes (`backend/src/routes/hrAdminRoutes.js`)
- Added notification creation in the interview review endpoint
- Creates appropriate notification messages based on decision (shortlisted/rejected/on-hold)
- Sends real-time Socket.IO notifications to students
- Includes meeting details for shortlisted candidates

### 3. Updated Company Interview Controller (`backend/src/controllers/companyInterviewController.js`)
- Added notification creation when companies review interviews
- Similar notification logic as HR admin but with company-specific messaging
- Populates user data for notification creation

### 4. Updated Notification Controller (`backend/src/controllers/notificationController.js`)
- Added support for filtering notifications by type
- Added population of related interview data
- Enhanced error handling

## Frontend Changes

### 1. Updated NotificationDropdown (`frontend/components/NotificationDropdown.tsx`)
- Added `interview_decision` to notification types
- Added interview icon (AcademicCapIcon) for interview notifications
- Added "Interviews" filter tab in notification dropdown

### 2. Updated Socket Hook (`frontend/hooks/useSocket.ts`)
- Added listener for `interview:decision` socket events
- Triggers notification update events when interview decisions are received
- Logs interview decision events for debugging

### 3. Created InterviewNotificationListener (`frontend/components/InterviewNotificationListener.tsx`)
- Listens for real-time interview decision events
- Shows appropriate toast notifications based on decision type:
  - Success toast for shortlisted (8 seconds)
  - Info toast for rejected (6 seconds)
  - Warning toast for on-hold (6 seconds)

### 4. Updated Main Layout (`frontend/app/layout.tsx`)
- Added InterviewNotificationListener to ensure it's always active
- Positioned within ToastProvider for proper toast functionality

## Notification Messages

### HR Admin Review Messages:
- **Shortlisted**: "Great news! You've been shortlisted for the interview. Check your interview details for the meeting information."
- **Rejected**: "Thank you for your interview. Unfortunately, we won't be moving forward at this time. Keep applying and improving!"
- **On-hold**: "Your interview is currently on hold. We'll update you soon with next steps."

### Company Review Messages:
- **Shortlisted**: "Congratulations! A company has shortlisted you based on your interview performance."
- **Rejected**: "Thank you for your interview. A company has reviewed your performance. Keep improving and applying!"
- **On-hold**: "Your interview is currently on hold by a company. We'll update you with next steps."

## Data Structure

### Notification Data Object:
```javascript
{
  interviewId: ObjectId,
  decision: 'shortlisted' | 'rejected' | 'on-hold',
  rating: Number (1-5),
  comments: String,
  reviewedByCompany: Boolean, // true for company reviews
  // For shortlisted candidates:
  meetingLink: String,
  meetingDate: String,
  meetingTime: String
}
```

### Socket.IO Event:
```javascript
{
  notificationId: ObjectId,
  message: String,
  decision: String,
  interviewId: ObjectId,
  timestamp: Date,
  data: Object // notification data
}
```

## Testing

A test script (`test-interview-notification.js`) was created to verify the notification system works correctly. Run with:
```bash
node test-interview-notification.js
```

## User Experience

1. **Real-time Notifications**: Students receive instant toast notifications when decisions are made
2. **Persistent Notifications**: All notifications are stored in the database and accessible via the notifications page
3. **Visual Indicators**: Interview notifications have distinct icons and styling
4. **Filtering**: Students can filter to see only interview-related notifications
5. **Contextual Information**: Notifications include relevant details like meeting information for shortlisted candidates

## Future Enhancements

1. Email notifications for interview decisions
2. Push notifications for mobile apps
3. Notification preferences (allow users to customize notification types)
4. Interview reminder notifications for shortlisted candidates
5. Follow-up notifications for pending interviews