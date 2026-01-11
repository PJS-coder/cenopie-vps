import mongoose from 'mongoose';
import crypto from 'crypto';

// Message status enum
const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// Message type enum
const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video',
  LOCATION: 'location'
};

// Attachment schema
const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(MESSAGE_TYPE),
    required: true
  },
  url: {
    type: String,
    required: true
  },
  filename: String,
  size: Number,
  mimeType: String,
  thumbnail: String, // For images/videos
  duration: Number, // For audio/video
  width: Number, // For images/videos
  height: Number // For images/videos
});

// Message schema
const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(MESSAGE_TYPE),
    default: MESSAGE_TYPE.TEXT
  },
  content: {
    type: String,
    trim: true,
    maxlength: 4000 // Increased limit for longer messages
  },
  encryptedContent: {
    type: String // For encrypted messages
  },
  attachments: [attachmentSchema],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageNew'
  },
  status: {
    type: String,
    enum: Object.values(MESSAGE_STATUS),
    default: MESSAGE_STATUS.SENT
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], // Users who deleted this message for themselves
  metadata: {
    clientId: String, // For deduplication
    platform: String, // web, mobile, etc.
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ 'deliveredTo.user': 1 });
messageSchema.index({ content: 'text' }); // Full-text search
messageSchema.index({ 'metadata.clientId': 1 }); // For deduplication
messageSchema.index({ deleted: 1, createdAt: -1 });

// Compound indexes for common queries
messageSchema.index({ conversationId: 1, deleted: 1, createdAt: -1 });
messageSchema.index({ sender: 1, conversationId: 1, createdAt: -1 });

// Virtual for checking if message is read by specific user
messageSchema.virtual('isReadBy').get(function() {
  return (userId) => {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});

// Virtual for checking if message is delivered to specific user
messageSchema.virtual('isDeliveredTo').get(function() {
  return (userId) => {
    return this.deliveredTo.some(delivery => delivery.user.toString() === userId.toString());
  };
});

// Encryption methods
messageSchema.methods.encryptContent = function(content) {
  if (!content) return;
  
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY || 'default-key-32-chars-long-please', 'utf8');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from(this._id.toString()));
  
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  this.encryptedContent = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  this.content = undefined; // Remove plain text
};

messageSchema.methods.decryptContent = function() {
  if (!this.encryptedContent) return this.content;
  
  try {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY || 'default-key-32-chars-long-please', 'utf8');
    
    const parts = this.encryptedContent.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from(this._id.toString()));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted message - decryption failed]';
  }
};

// Mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  return this.save();
};

// Mark message as delivered to user
messageSchema.methods.markAsDelivered = function(userId) {
  const alreadyDelivered = this.deliveredTo.some(delivery => delivery.user.toString() === userId.toString());
  if (!alreadyDelivered) {
    this.deliveredTo.push({ user: userId, deliveredAt: new Date() });
  }
  return this.save();
};

// Add reaction to message
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji, createdAt: new Date() });
  return this.save();
};

// Remove reaction from message
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
  return this.save();
};

// Soft delete message
messageSchema.methods.softDelete = function(userId = null) {
  if (userId) {
    // Delete for specific user only
    if (!this.deletedFor.includes(userId)) {
      this.deletedFor.push(userId);
    }
  } else {
    // Delete for everyone
    this.deleted = true;
    this.deletedAt = new Date();
  }
  return this.save();
};

// Static method to find messages for user (excluding deleted)
messageSchema.statics.findForUser = function(userId, query = {}) {
  return this.find({
    ...query,
    $or: [
      { deleted: false },
      { deleted: true, deletedFor: { $ne: userId } }
    ]
  });
};

// Static method for full-text search
messageSchema.statics.searchMessages = function(conversationId, searchTerm, userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({
    conversationId,
    $text: { $search: searchTerm },
    $or: [
      { deleted: false },
      { deleted: true, deletedFor: { $ne: userId } }
    ]
  })
  .populate('sender', 'name profileImage isVerified')
  .populate('replyTo', 'content sender')
  .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Pre-save middleware for encryption
messageSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content && process.env.ENABLE_MESSAGE_ENCRYPTION === 'true') {
    this.encryptContent(this.content);
  }
  next();
});

// Post-find middleware for decryption
messageSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  if (!docs) return;
  
  const decrypt = (doc) => {
    if (doc.encryptedContent && process.env.ENABLE_MESSAGE_ENCRYPTION === 'true') {
      doc.content = doc.decryptContent();
    }
  };
  
  if (Array.isArray(docs)) {
    docs.forEach(decrypt);
  } else {
    decrypt(docs);
  }
});

export { MESSAGE_STATUS, MESSAGE_TYPE };
export default mongoose.model('MessageNew', messageSchema);