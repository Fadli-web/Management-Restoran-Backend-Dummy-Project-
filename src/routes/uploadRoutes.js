const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/upload', authenticate, (req, res, next) => {
    // Menangani baik field 'image' maupun 'file'
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Gagal mengunggah berkas'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Tidak ada berkas yang diunggah. Gunakan field form-data bernama "image".'
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(201).json({
            status: 'success',
            message: 'Berkas gambar berhasil diunggah',
            data: {
                filename: req.file.filename,
                url: fileUrl,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    });
});

module.exports = router;

