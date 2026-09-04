const Joi = require('joi');

const createInventorySchema = Joi.object({
    item_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Nama bahan baku (item_name) tidak boleh kosong',
        'string.min': 'Nama bahan baku minimal harus 2 karakter',
        'any.required': 'Nama bahan baku (item_name) wajib diisi'
    }),
    quantity: Joi.number().min(0).required().messages({
        'number.base': 'Jumlah bahan (quantity) harus berupa angka',
        'number.min': 'Jumlah bahan tidak boleh bernilai negatif',
        'any.required': 'Jumlah bahan (quantity) wajib diisi'
    }),
    unit: Joi.string().trim().min(1).max(20).required().messages({
        'string.empty': 'Satuan bahan (unit) tidak boleh kosong',
        'any.required': 'Satuan bahan (unit) wajib diisi (contoh: kg, gram, pcs, liter)'
    })
});

const updateInventorySchema = Joi.object({
    item_name: Joi.string().trim().min(2).max(100).messages({
        'string.empty': 'Nama bahan baku (item_name) tidak boleh kosong',
        'string.min': 'Nama bahan baku minimal harus 2 karakter'
    }),
    quantity: Joi.number().min(0).messages({
        'number.base': 'Jumlah bahan (quantity) harus berupa angka',
        'number.min': 'Jumlah bahan tidak boleh bernilai negatif'
    }),
    unit: Joi.string().trim().min(1).max(20).messages({
        'string.empty': 'Satuan bahan (unit) tidak boleh kosong'
    })
}).min(1).messages({
    'object.min': 'Setidaknya harus ada satu data yang diperbarui'
});

module.exports = {
    createInventorySchema,
    updateInventorySchema
};

