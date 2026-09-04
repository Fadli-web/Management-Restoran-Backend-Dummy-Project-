const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/authValidator');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Middleware untuk menangani upload gambar opsional pada multipart/form-data
const handleOptionalAvatar = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Format atau ukuran file avatar tidak valid'
            });
        }
        next();
    });
};

// Endpoint registrasi pengguna baru
router.post('/register', validate(registerSchema), authController.register);

// Endpoint login untuk mendapatkan JWT Token
router.post('/login', validate(loginSchema), authController.login);

// Endpoint mendapatkan profil pengguna aktif (harus membawa token Bearer)
router.get('/me', authenticate, authController.getProfile);

// Endpoint memperbarui profil pengguna aktif (Nama, Email, Password, dan Foto Avatar)
router.put('/profile', authenticate, handleOptionalAvatar, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;

