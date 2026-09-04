const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Di Vercel serverless environment, file system bersifat read-only kecuali direktori /tmp
const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '../../uploads');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn('Peringatan: Tidak dapat membuat direktori uploads:', err.message);
}

// Konfigurasi penyimpanan disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `img-${uniqueSuffix}${ext}`);
    }
});

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

