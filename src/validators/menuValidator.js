const Joi = require('joi');

const createMenuSchema = Joi.object({
    name: Joi.string().trim().min(2).max(150).required().messages({
        'string.empty': 'Nama menu tidak boleh kosong',
        'string.min': 'Nama menu minimal harus 2 karakter',
        'any.required': 'Nama menu wajib diisi'
    }),
    description: Joi.string().trim().allow('', null).default(''),
    price: Joi.alternatives().try(
        Joi.number().min(0),
        Joi.string().pattern(/^\d+(\.\d+)?$/)
    ).required().messages({
        'number.base': 'Harga menu harus berupa angka',
        'number.min': 'Harga menu tidak boleh bernilai negatif',
        'any.required': 'Harga menu wajib diisi'
    }),
    is_available: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false', '1', '0')
    ).default(true),
    image_url: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
    gambar: Joi.string().allow('', null).optional(),
    foto: Joi.string().allow('', null).optional(),
    category: Joi.string().valid('makanan', 'minuman', 'snack').default('makanan').optional(),
    nama: Joi.string().allow('', null).optional(),
    nama_menu: Joi.string().allow('', null).optional(),
    harga: Joi.any().optional(),
    deskripsi: Joi.any().optional()
});

const updateMenuSchema = Joi.object({
    name: Joi.string().trim().min(2).max(150).messages({
        'string.empty': 'Nama menu tidak boleh kosong',
        'string.min': 'Nama menu minimal harus 2 karakter'
    }),
    description: Joi.string().trim().allow('', null),
    price: Joi.alternatives().try(
        Joi.number().min(0),
        Joi.string().pattern(/^\d+(\.\d+)?$/)
    ).messages({
        'number.base': 'Harga menu harus berupa angka',
        'number.min': 'Harga menu tidak boleh bernilai negatif'
    }),
    is_available: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false', '1', '0')
    ),
    image_url: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
    gambar: Joi.string().allow('', null).optional(),
    foto: Joi.string().allow('', null).optional(),
    category: Joi.string().valid('makanan', 'minuman', 'snack').default('makanan').optional(),
    nama: Joi.string().allow('', null).optional(),
    nama_menu: Joi.string().allow('', null).optional(),
    harga: Joi.any().optional(),
    deskripsi: Joi.any().optional()
}).min(1).messages({
    'object.min': 'Setidaknya harus ada satu data yang diperbarui'
});

const addIngredientSchema = Joi.object({
    inventory_id: Joi.string().required().messages({
        'string.empty': 'ID bahan baku (inventory_id) tidak boleh kosong',
        'any.required': 'ID bahan baku (inventory_id) wajib diisi'
    }),
    quantity_needed: Joi.number().positive().required().messages({
        'number.base': 'Jumlah bahan yang dibutuhkan (quantity_needed) harus berupa angka',
        'number.positive': 'Jumlah bahan yang dibutuhkan harus lebih besar dari 0',
        'any.required': 'Jumlah bahan yang dibutuhkan (quantity_needed) wajib diisi'
    })
});

module.exports = {
    createMenuSchema,
    updateMenuSchema,
    addIngredientSchema
};

