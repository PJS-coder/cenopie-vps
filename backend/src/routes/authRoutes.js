import { Router } from 'express';
import { login, register, refreshToken, logout, googleAuth, googleAuthCallback } from '../controllers/authController.js';
import { validate, signupSchema, loginSchema } from '../middlewares/validationMiddleware.js';
import { checkRegistrationAllowed, getRegistrationStatus } from '../middleware/registrationControl.js';

const router = Router();

// Registration status endpoint
router.get('/registration-status', getRegistrationStatus);

// Protected registration route
router.post('/register', checkRegistrationAllowed, validate(signupSchema), register);

// Login remains open
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Google OAuth routes (also protected)
router.get('/google', checkRegistrationAllowed, googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;