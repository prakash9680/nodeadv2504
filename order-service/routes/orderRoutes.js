const express = require('express');
const os = require('os');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../../shared/middleware/auth');

router.use(authenticate);

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/audit-log', orderController.auditLog);

module.exports = router;
