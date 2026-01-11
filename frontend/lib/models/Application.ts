import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  id: string;
  jobId: string;
  userId: string;
  companyId: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  resume: string | null;
  coverLetter: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  jobId: { type: String, required: true },
  userId: { type: String, required: true },
  companyId: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  resume: { type: String, default: null },
  coverLetter: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create indexes for better query performance
ApplicationSchema.index({ jobId: 1 });
ApplicationSchema.index({ userId: 1 });
ApplicationSchema.index({ companyId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);