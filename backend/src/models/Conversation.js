import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true,
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  avatar: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isMuted: {
      type: Boolean,
      default: false
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageNew'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    allowMediaSharing: {
      type: Boolean,
      default: true
    },
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: {
        type: Number, // in seconds
        default: 86400 // 24 hours
      }
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'participants.user': 1, 'participants.isActive': 1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Method to get other participant in direct conversation
conversationSchema.methods.getOtherParticipant = function(currentUserId) {
  if (this.type !== 'direct') return null;
  
  const otherParticipant = this.participants.find(p => 
    p.user.toString() !== currentUserId.toString() && p.isActive
  );
  
  return otherParticipant ? otherParticipant.user : null;
};

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
};

// Method to get user's role in conversation
conversationSchema.methods.getUserRole = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  return participant ? participant.role : null;
};

// Method to get unread count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (!participant || !this.lastMessage) return 0;
  
  // This will be calculated in the controller using message aggregation
  return 0;
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(user1Id, user2Id) {
  // Check if conversation already exists
  let conversation = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    'participants.isActive': true
  }).populate('participants.user', 'name profileImage isVerified');
  
  if (!conversation) {
    // Create new direct conversation
    conversation = await this.create({
      type: 'direct',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ]
    });
    
    await conversation.populate('participants.user', 'name profileImage isVerified');
  }
  
  return conversation;
};

// Method to update last read timestamp for user
conversationSchema.methods.updateLastRead = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
  
  if (participant) {
    participant.lastReadAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if user can send messages
conversationSchema.methods.canUserSendMessage = function(userId) {
  return this.participants.some(p => 
    p.user.toString() === userId.toString() && p.isActive
  );
};

// Virtual for active participants
conversationSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => p.isActive);
});

// Ensure virtual fields are serialized
conversationSchema.set('toJSON', { virtuals: true });
conversationSchema.set('toObject', { virtuals: true });

export default mongoose.model('Conversation', conversationSchema);