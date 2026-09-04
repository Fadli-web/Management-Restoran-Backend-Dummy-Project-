const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { createInventorySchema, updateInventorySchema } = require('../validators/inventoryValidator');

// 1. Melihat inventaris dapat diakses oleh Admin, Kasir, dan Koki
router.get('/inventory', authenticate, authorize('admin', 'kasir', 'koki'), inventoryController.getAllInventory);
router.get('/inventory/:id', authenticate, authorize('admin', 'kasir', 'koki'), inventoryController.getInventoryById);

// 2. Menambah & menghapus bahan baku hanya oleh Admin
router.post('/inventory', authenticate, authorize('admin'), validate(createInventorySchema), inventoryController.createInventory);
router.delete('/inventory/:id', authenticate, authorize('admin'), inventoryController.deleteInventory);

// 3. Update data/penyesuaian stok dapat dilakukan oleh Admin dan Koki
router.put('/inventory/:id', authenticate, authorize('admin', 'koki'), validate(updateInventorySchema), inventoryController.updateInventory);

module.exports = router;
