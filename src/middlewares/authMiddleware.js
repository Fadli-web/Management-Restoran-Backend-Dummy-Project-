const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_restaurant_jwt_key_2024';

/**
 * Middleware untuk memverifikasi token JWT dari header Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Akses ditolak. Token otentikasi tidak ditemukan. Harap sertakan Bearer token.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role, full_name, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token otentikasi telah kedaluwarsa. Silakan login kembali.'
            });
        }
        return res.status(401).json({
            status: 'error',
            message: 'Token otentikasi tidak valid.'
        });
    }
};

/**
 * Middleware Role-Based Access Control (RBAC)
 * @param {...string} allowedRoles - Daftar role yang diizinkan, misal: 'admin', 'kasir', 'koki'
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Pengguna belum terotentikasi.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `Akses ditolak. Peran '${req.user.role}' tidak memiliki hak akses untuk tindakan ini.`
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};

