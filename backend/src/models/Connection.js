import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
    index: true
  },
  message: {
    type: String,
    maxlength: 300,
    default: ''
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, { 
  timestamps: true,
  // Ensure unique connection between two users
  index: [
    { requester: 1, recipient: 1 },
    { recipient: 1, requester: 1 }
  ]
});

// Compound index to prevent duplicate connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Static method to get connection status between two users
connectionSchema.statics.getConnectionStatus = async function(userId1, userId2) {
  if (userId1.toString() === userId2.toString()) {
    return 'self';
  }
  
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });
  
  if (!connection) return 'none';
  
  // If the current user is the requester and status is pending
  if (connection.requester.toString() === userId1.toString() && connection.status === 'pending') {
    return 'pending_sent';
  }
  
  // If the current user is the recipient and status is pending
  if (connection.recipient.toString() === userId1.toString() && connection.status === 'pending') {
    return 'pending_received';
  }
  
  return connection.status;
};

// Static method to get user's connections
connectionSchema.statics.getUserConnections = async function(userId, status = 'accepted') {
  return await this.find({
    $or: [
      { requester: userId, status },
      { recipient: userId, status }
    ]
  }).populate('requester recipient', 'name email profileImage headline isVerified');
};

// Static method to get connection requests for a user
connectionSchema.statics.getConnectionRequests = async function(userId, type = 'received') {
  const query = type === 'received' 
    ? { recipient: userId, status: 'pending' }
    : { requester: userId, status: 'pending' };
    
  return await this.find(query)
    .populate('requester recipient', 'name email profileImage headline isVerified')
    .sort({ createdAt: -1 });
};

export default mongoose.model('Connection', connectionSchema);
