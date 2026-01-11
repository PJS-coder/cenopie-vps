import mongoose from 'mongoose';

export interface IUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  headline?: string;
  location?: string;
  isVerified?: boolean;
  joinedAt: Date;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  headline: {
    type: String,
    maxlength: 100,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  joinedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better query performance
UserSchema.index({ isVerified: 1, createdAt: -1 });
UserSchema.index({ email: 1, isVerified: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
