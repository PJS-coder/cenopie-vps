import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  id: string;
  userId: string;
  type: 'startup' | 'small' | 'medium-large' | 'enterprise';
  name: string;
  website: string;
  industry: string;
  size: string;
  businessType: string;
  logo: string | null;
  coverImage: string | null;
  description: string;
  founded: string;
  headquarters: string;
  employees: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['startup', 'small', 'medium-large', 'enterprise'] 
  },
  name: { type: String, required: true },
  website: { type: String, required: true },
  industry: { type: String, required: true },
  size: { type: String, required: true },
  businessType: { type: String, required: true },
  logo: { type: String, default: null },
  coverImage: { type: String, default: null },
  description: { type: String, required: true },
  founded: { type: String, required: true },
  headquarters: { type: String, required: true },
  employees: { type: String },
  isApproved: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Create indexes for better query performance
CompanySchema.index({ userId: 1 });
CompanySchema.index({ isApproved: 1 });
CompanySchema.index({ isVerified: 1 });
CompanySchema.index({ name: 1 });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
