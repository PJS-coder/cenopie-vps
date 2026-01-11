import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getIO } from '../socket/index.js';

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientId, message = '' } = req.body;
    const requesterId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to connect to themselves
    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already sent' });
      }
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }
      if (existingConnection.status === 'blocked') {
        return res.status(400).json({ message: 'Cannot send connection request' });
      }
    }

    // Create new connection request
    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
      message: message.trim(),
      status: 'pending'
    });

    await connection.save();
    await connection.populate('requester recipient', 'name email profileImage headline isVerified');

    // Create notification for recipient
    const notification = new Notification({
      user: recipientId,
      type: 'connection_request',
      message: `${req.user.name} sent you a connection request`,
      relatedUser: requesterId,
      data: {
        connectionId: connection._id,
        requesterId: requesterId,
        requesterName: req.user.name,
        requesterImage: req.user.profileImage
      }
    });

    await notification.save();

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('connection:request', {
        connectionId: connection._id,
        requester: {
          _id: requesterId,
          name: req.user.name,
          profileImage: req.user.profileImage,
          headline: req.user.headline,
          isVerified: req.user.isVerified
        },
        message: message.trim(),
        createdAt: connection.createdAt
      });
    }

    res.status(201).json({
      message: 'Connection request sent successfully',
      data: connection
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Failed to send connection request' });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if user is the recipient
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    // Check if request is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is no longer pending' });
    }

    // Update connection status
    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();

    await connection.populate('requester recipient', 'name email profileImage headline isVerified');

    // Create notification for requester
    const notification = new Notification({
      user: connection.requester._id,
      type: 'connection_request',
      message: `${req.user.name} accepted your connection request`,
      relatedUser: userId,
      data: {
        connectionId: connection._id,
        accepterId: userId,
        accepterName: req.user.name,
        accepterImage: req.user.profileImage
      }
    });

    await notification.save();

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      // Notify the requester
      io.to(`user:${connection.requester._id}`).emit('connection:accepted', {
        connectionId: connection._id,
        accepter: {
          _id: userId,
          name: req.user.name,
          profileImage: req.user.profileImage,
          headline: req.user.headline,
          isVerified: req.user.isVerified
        },
        acceptedAt: connection.respondedAt
      });

      // Notify both users about the new connection
      io.to(`user:${connection.requester._id}`).emit('connection:status_update', {
        userId: userId.toString(),
        status: 'accepted'
      });
      
      io.to(`user:${userId}`).emit('connection:status_update', {
        userId: connection.requester._id.toString(),
        status: 'accepted'
      });
    }

    res.json({
      message: 'Connection request accepted',
      data: connection
    });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ message: 'Failed to accept connection request' });
  }
};

export const declineConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if user is the recipient
    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    // Check if request is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is no longer pending' });
    }

    // Update connection status
    connection.status = 'declined';
    connection.respondedAt = new Date();
    await connection.save();

    await connection.populate('requester recipient', 'name email profileImage headline isVerified');

    // Create notification for requester
    const notification = new Notification({
      user: connection.requester._id,
      type: 'connection_request',
      message: `${req.user.name} declined your connection request`,
      relatedUser: userId,
      data: {
        connectionId: connection._id,
        declinerId: userId,
        declinerName: req.user.name,
        declinerImage: req.user.profileImage
      }
    });

    await notification.save();

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${connection.requester._id}`).emit('connection:status_update', {
        userId: userId.toString(),
        status: 'declined'
      });
    }

    res.json({
      message: 'Connection request declined',
      data: connection
    });
  } catch (error) {
    console.error('Error declining connection request:', error);
    res.status(500).json({ message: 'Failed to decline connection request' });
  }
};

export const cancelConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if user is the requester
    if (connection.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    // Check if request is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is no longer pending' });
    }

    // Delete the connection request
    await Connection.findByIdAndDelete(connectionId);

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${connection.recipient}`).emit('connection:status_update', {
        userId: userId.toString(),
        status: 'none'
      });
    }

    res.json({
      message: 'Connection request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling connection request:', error);
    res.status(500).json({ message: 'Failed to cancel connection request' });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Check if user is part of the connection
    const isRequester = connection.requester.toString() === userId.toString();
    const isRecipient = connection.recipient.toString() === userId.toString();
    
    if (!isRequester && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to remove this connection' });
    }

    // Check if connection is accepted
    if (connection.status !== 'accepted') {
      return res.status(400).json({ message: 'Connection is not established' });
    }

    // Delete the connection
    await Connection.findByIdAndDelete(connectionId);

    // Determine the other user
    const otherUserId = isRequester ? connection.recipient : connection.requester;

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${otherUserId}`).emit('connection:status_update', {
        userId: userId.toString(),
        status: 'none'
      });
    }

    res.json({
      message: 'Connection removed successfully'
    });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Failed to remove connection' });
  }
};

export const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const status = await Connection.getConnectionStatus(currentUserId, userId);
    
    // Get connection details if exists
    let connectionDetails = null;
    if (status !== 'none' && status !== 'self') {
      connectionDetails = await Connection.findOne({
        $or: [
          { requester: currentUserId, recipient: userId },
          { requester: userId, recipient: currentUserId }
        ]
      }).populate('requester recipient', 'name email profileImage headline isVerified');
    }

    res.json({
      status,
      connection: connectionDetails
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: 'Failed to get connection status' });
  }
};

export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    const connections = await Connection.getUserConnections(targetUserId, 'accepted');
    
    // Format connections to return the other user's details
    const formattedConnections = connections.map(connection => {
      const isRequester = connection.requester._id.toString() === targetUserId.toString();
      const connectedUser = isRequester ? connection.recipient : connection.requester;
      
      return {
        connectionId: connection._id,
        user: connectedUser,
        connectedAt: connection.respondedAt || connection.createdAt,
        mutualConnections: 0 // Mutual connections calculation would be implemented here
      };
    });

    res.json({
      connections: formattedConnections,
      total: formattedConnections.length
    });
  } catch (error) {
    console.error('Error getting user connections:', error);
    res.status(500).json({ message: 'Failed to get connections' });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    const { type = 'received' } = req.query;
    const userId = req.user._id;

    const requests = await Connection.getConnectionRequests(userId, type);
    
    // Format requests
    const formattedRequests = requests.map(request => {
      const isReceived = type === 'received';
      const otherUser = isReceived ? request.requester : request.recipient;
      
      return {
        connectionId: request._id,
        user: otherUser,
        message: request.message,
        requestedAt: request.createdAt,
        type: isReceived ? 'received' : 'sent'
      };
    });

    res.json({
      requests: formattedRequests,
      total: formattedRequests.length
    });
  } catch (error) {
    console.error('Error getting connection requests:', error);
    res.status(500).json({ message: 'Failed to get connection requests' });
  }
};
