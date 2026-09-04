const Joi = require('joi');

const orderItemSchema = Joi.object({
    menu_id: Joi.alternatives().try(
        Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }),
        Joi.string(),
        Joi.number()
    ).required().messages({
        'string.empty': 'menu_id tidak boleh kosong',
        'any.required': 'menu_id wajib diisi untuk setiap item'
    }),
    qty: Joi.number().integer().min(1).required().messages({
        'number.base': 'qty harus berupa angka',
        'number.integer': 'qty harus berupa bilangan bulat',
        'number.min': 'qty minimal harus 1',
        'any.required': 'qty wajib diisi'
    })
});

const createOrderSchema = Joi.object({
    customer_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Nama pelanggan (customer_name) tidak boleh kosong',
        'string.min': 'Nama pelanggan minimal harus 2 karakter',
        'any.required': 'Nama pelanggan wajib diisi'
    }),
    items: Joi.array().items(orderItemSchema).min(1).required().messages({
        'array.base': 'items harus berupa daftar array produk yang dipesan',
        'array.min': 'Pesanan harus memiliki minimal 1 item',
        'any.required': 'Daftar item pesanan wajib diisi'
    }),
    total_price: Joi.number().min(0).optional().messages({
        'number.base': 'total_price harus berupa angka',
        'number.min': 'total_price tidak boleh negatif'
    }),
    status: Joi.string().valid('pending', 'cooking', 'ready', 'completed', 'cancelled').default('pending').messages({
        'any.only': 'Status pesanan harus salah satu dari: pending, cooking, ready, completed, cancelled'
    })
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'cooking', 'ready', 'completed', 'cancelled').required().messages({
        'string.empty': 'Status tidak boleh kosong',
        'any.only': 'Status harus salah satu dari: pending, cooking, ready, completed, cancelled',
        'any.required': 'Status wajib diisi'
    })
});

module.exports = {
    createOrderSchema,
    updateOrderStatusSchema
};

