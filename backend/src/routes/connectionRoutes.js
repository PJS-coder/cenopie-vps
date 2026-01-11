import express from 'express';
import { 
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  getConnectionStatus,
  getUserConnections,
  getConnectionRequests
} from '../controllers/connectionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send connection request
router.post('/request', sendConnectionRequest);

// Accept connection request
router.put('/accept/:connectionId', acceptConnectionRequest);

// Decline connection request
router.put('/decline/:connectionId', declineConnectionRequest);

// Cancel connection request (withdraw)
router.delete('/cancel/:connectionId', cancelConnectionRequest);

// Remove connection
router.delete('/remove/:connectionId', removeConnection);

// Get connection status with another user
router.get('/status/:userId', getConnectionStatus);

// Get user's connections
router.get('/user/:userId?', getUserConnections);

// Get connection requests (sent/received)
router.get('/requests', getConnectionRequests);

export default router;
