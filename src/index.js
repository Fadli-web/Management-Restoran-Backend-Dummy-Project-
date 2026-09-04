const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);

app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API Manajemen Restoran V2 (Inventory, Menu, Orders, Auth, Stock-Deduct) Berjalan Lancar!',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me'
            },
            menus: {
                list: 'GET /api/menus',
                detail: 'GET /api/menus/:id',
                create: 'POST /api/menus (Admin)',
                update: 'PUT /api/menus/:id (Admin)',
                delete: 'DELETE /api/menus/:id (Admin)',
                recipe: 'GET|POST|DELETE /api/menus/:id/ingredients'
            },
            inventory: {
                list: 'GET /api/inventory',
                detail: 'GET /api/inventory/:id',
                create: 'POST /api/inventory (Admin)',
                update: 'PUT /api/inventory/:id (Admin/Koki)',
                delete: 'DELETE /api/inventory/:id (Admin)'
            },
            orders: {
                list: 'GET /api/orders',
                detail: 'GET /api/orders/:id',
                create: 'POST /api/orders (Kasir/Admin - Auto Stock Deduct)',
                update_status: 'PUT /api/orders/:id/status (Kasir/Koki/Admin)'
            }
        }
    });
});

// Middleware 404 Not Found
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan.`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Terjadi kesalahan internal pada server'
    });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Untuk serverless deployment (Vercel) & unit testing
module.exports = app;