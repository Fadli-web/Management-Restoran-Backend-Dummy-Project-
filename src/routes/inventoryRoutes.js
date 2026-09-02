const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/inventory', inventoryController.getAllInventory);
router.get('/inventory/:id', inventoryController.getInventoryById);
router.post('/inventory', inventoryController.createInventory);
router.put('/inventory/:id', inventoryController.updateInventory);
router.delete('/inventory/:id', inventoryController.deleteInventory);

module.exports = router;
