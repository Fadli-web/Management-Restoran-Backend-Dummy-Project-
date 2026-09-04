const Joi = require('joi');

const createMenuSchema = Joi.object({
    name: Joi.string().trim().min(2).max(150).required().messages({
        'string.empty': 'Nama menu tidak boleh kosong',
        'string.min': 'Nama menu minimal harus 2 karakter',
        'any.required': 'Nama menu wajib diisi'
    }),
    description: Joi.string().trim().allow('', null).default(''),
    price: Joi.number().min(0).required().messages({
        'number.base': 'Harga menu harus berupa angka',
        'number.min': 'Harga menu tidak boleh bernilai negatif',
        'any.required': 'Harga menu wajib diisi'
    }),
    is_available: Joi.boolean().default(true).messages({
        'boolean.base': 'Status ketersediaan (is_available) harus bernilai boolean (true/false)'
    })
});

const updateMenuSchema = Joi.object({
    name: Joi.string().trim().min(2).max(150).messages({
        'string.empty': 'Nama menu tidak boleh kosong',
        'string.min': 'Nama menu minimal harus 2 karakter'
    }),
    description: Joi.string().trim().allow('', null),
    price: Joi.number().min(0).messages({
        'number.base': 'Harga menu harus berupa angka',
        'number.min': 'Harga menu tidak boleh bernilai negatif'
    }),
    is_available: Joi.boolean().messages({
        'boolean.base': 'Status ketersediaan (is_available) harus bernilai boolean (true/false)'
    })
}).min(1).messages({
    'object.min': 'Setidaknya harus ada satu data yang diperbarui'
});

const addIngredientSchema = Joi.object({
    inventory_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required().messages({
        'string.empty': 'ID bahan baku (inventory_id) tidak boleh kosong',
        'string.guid': 'Format inventory_id harus berupa UUID yang valid',
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

