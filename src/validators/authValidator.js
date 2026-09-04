const Joi = require('joi');

const registerSchema = Joi.object({
    full_name: Joi.string().trim().min(3).max(100).required().messages({
        'string.empty': 'Nama lengkap tidak boleh kosong',
        'string.min': 'Nama lengkap minimal harus 3 karakter',
        'string.max': 'Nama lengkap maksimal 100 karakter',
        'any.required': 'Nama lengkap wajib diisi'
    }),
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email tidak boleh kosong',
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().min(6).max(100).required().messages({
        'string.empty': 'Password tidak boleh kosong',
        'string.min': 'Password minimal harus 6 karakter',
        'any.required': 'Password wajib diisi'
    }),
    role: Joi.string().valid('admin', 'kasir', 'koki').default('kasir').messages({
        'any.only': 'Role harus salah satu dari: admin, kasir, koki'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email tidak boleh kosong',
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password tidak boleh kosong',
        'any.required': 'Password wajib diisi'
    })
});

module.exports = {
    registerSchema,
    loginSchema
};

