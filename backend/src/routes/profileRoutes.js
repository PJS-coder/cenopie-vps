import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { 
  updateProfile, 
  getProfile, 
  getProfileById,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addSkill,
  updateSkill,
  deleteSkill,
  addCertification,
  updateCertification,
  deleteCertification
} from '../controllers/profileController.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.use(protect);

// Profile routes
router.route('/')
  .get(getProfile)
  .put(upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), updateProfile);

// Add /me endpoint for current user profile
router.route('/me')
  .get(getProfile)
  .put(upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), updateProfile);

router.route('/:userId')
  .get(getProfileById);

// Education routes - using more specific paths to avoid conflicts
router.route('/education/add')
  .post(addEducation);

router.route('/education/update/:educationId')
  .put(updateEducation);

router.route('/education/delete/:educationId')
  .delete(deleteEducation);

// Experience routes - using more specific paths to avoid conflicts
router.route('/experience/add')
  .post(addExperience);

router.route('/experience/update/:experienceId')
  .put(updateExperience);

router.route('/experience/delete/:experienceId')
  .delete(deleteExperience);

// Skills routes
router.route('/skills/add')
  .post(addSkill);

router.route('/skills/update/:skillId')
  .put(updateSkill);

router.route('/skills/delete/:skillId')
  .delete(deleteSkill);

// Certifications routes
router.route('/certifications/add')
  .post(addCertification);

router.route('/certifications/update/:certificationId')
  .put(updateCertification);

router.route('/certifications/delete/:certificationId')
  .delete(deleteCertification);

export default router;