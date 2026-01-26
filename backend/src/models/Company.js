import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  // Company Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  headquarters: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
    enum: [
      '1-10 employees',
      '11-50 employees', 
      '51-200 employees',
      '201-500 employees',
      '501-1000 employees',
      '1000+ employees'
    ]
  },
  founded: {
    type: String
  },
  logo: {
    type: String
  },
  coverImage: {
    type: String
  },
  
  // Authentication (separate from users)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Verification Information
  businessRegistration: {
    type: String,
    required: true
  },
  taxId: {
    type: String
  },
  contactPerson: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Admin notes
  adminNotes: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search functionality
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ size: 1 });
// companySchema.index({ email: 1 }); // Removed duplicate - email already has unique index
companySchema.index({ status: 1 });

export default mongoose.model('Company', companySchema, 'companies_v2');