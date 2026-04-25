const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../../shared/middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login/verify-otp', authController.verifyLoginOtp);
router.post('/logout', authenticate, authController.logout);

router.post('/mfa/enable', authenticate, authController.enableMfa);
router.post('/mfa/verify', authenticate, authController.verifyMfa);
router.post('/mfa/disable', authenticate, authController.disableMfa);

router.get('/profile', authenticate, authController.getProfile);
router.get('/users', authenticate, authorize('admin'), authController.listUsers);

module.exports = router;
