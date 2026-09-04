const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { authenticate } = require('../middlewares/authMiddleware');

// Endpoint registrasi pengguna baru
router.post('/register', validate(registerSchema), authController.register);

// Endpoint login untuk mendapatkan JWT Token
router.post('/login', validate(loginSchema), authController.login);

// Endpoint mendapatkan profil pengguna aktif (harus membawa token Bearer)
router.get('/me', authenticate, authController.getProfile);

module.exports = router;

