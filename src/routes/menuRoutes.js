const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/menus', menuController.getAllMenus);
router.get('/menus/:id', menuController.getMenuById);
router.post('/menus', menuController.createMenu);
router.put('/menus/:id', menuController.updateMenu);
router.delete('/menus/:id', menuController.deleteMenu);

module.exports = router;
