/**
 * Middleware untuk validasi request menggunakan Joi schema
 * @param {import('joi').ObjectSchema} schema - Schema Joi
 * @param {'body' | 'params' | 'query'} property - Properti req yang ingin divalidasi
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,  // kumpulkan semua error sekaligus
            stripUnknown: true, // buang field tidak sah yang tidak ada dalam schema
            errors: {
                wrap: {
                    label: ''
                }
            }
        });

        if (error) {
            const errorDetails = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                status: 'error',
                message: 'Validasi input gagal',
                errors: errorDetails
            });
        }

        // Terapkan data yang sudah bersih & terkonversi ke req
        req[property] = value;
        next();
    };
};

module.exports = validate;

