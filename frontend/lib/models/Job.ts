import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  status: 'active' | 'paused' | 'closed';
  applicants: number;
  views: number;
  postedAt: string;
  description: string;
  requirements: string[];
  salary: string;
  experience: string;
  benefits: string[];
  companyDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  companyId: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  applicants: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  postedAt: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  salary: { type: String },
  experience: { type: String, required: true },
  benefits: [{ type: String }],
  companyDescription: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes for better query performance
JobSchema.index({ companyId: 1 });
JobSchema.index({ userId: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ createdAt: -1 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
