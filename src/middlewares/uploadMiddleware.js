const multer = require('multer');
const path = require('path');

// Gunakan memoryStorage agar file tersedia sebagai Buffer di req.file.buffer
// Ini diperlukan agar bisa di-upload ke Supabase Storage (cloud) dan tidak bergantung
// pada file system Vercel yang bersifat ephemeral (/tmp hilang setelah cold start)
const storage = multer.memoryStorage();

// Filter tipe file gambar
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|gif/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExtensions.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Hanya berkas gambar (JPG, JPEG, PNG, WEBP, GIF) yang diizinkan!'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    fileFilter
});

module.exports = upload;
