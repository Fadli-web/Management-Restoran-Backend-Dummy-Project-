const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/orderValidator');

// 1. Melihat pesanan (Admin, Kasir, dan Koki)
router.get('/orders', authenticate, authorize('admin', 'kasir', 'koki'), orderController.getAllOrders);
router.get('/orders/:id', authenticate, authorize('admin', 'kasir', 'koki'), orderController.getOrderById);

// 2. Membuat pesanan baru (Admin dan Kasir)
router.post('/orders', authenticate, authorize('admin', 'kasir'), validate(createOrderSchema), orderController.createOrder);

// 3. Mengupdate status pesanan (Admin, Kasir, dan Koki)
// Koki dapat mengubah status ke 'cooking' atau 'ready', Kasir dapat mengubah ke 'completed' atau 'cancelled'
router.put('/orders/:id/status', authenticate, authorize('admin', 'kasir', 'koki'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
