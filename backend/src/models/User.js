import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const educationSchema = new mongoose.Schema({
  college: String,
  degree: String,
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
  current: { type: Boolean, default: false }
});

const experienceSchema = new mongoose.Schema({
  company: String,
  jobTitle: String,
  employmentType: String,
  startDate: Date,
  endDate: Date,
  description: String,
  current: { type: Boolean, default: false }
});

// Simplified skill schema without proficiency
const skillSchema = new mongoose.Schema({
  name: String
});

const certificationSchema = new mongoose.Schema({
  name: String,
  organization: String,
  issueDate: Date,
  expirationDate: Date,
  credentialId: String,
  credentialUrl: String,
  doesNotExpire: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin', 'hr'], default: 'user' },
  headline: String,
  bio: String,
  location: String,
  pronouns: String,
  links: [{ label: String, url: String }],
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [skillSchema],
  certifications: [certificationSchema],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Companies owned by this user
  companies: [{ type: String, ref: 'Company' }],
  // Profile image and banner
  profileImage: String,
  bannerImage: String,
  // Stats fields
  interviewsCompleted: { type: Number, default: 0 },
  applicationsSent: { type: Number, default: 0 },
  profileViews: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  // Verification field
  isVerified: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Add method to generate auth token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

export default mongoose.model('User', userSchema);