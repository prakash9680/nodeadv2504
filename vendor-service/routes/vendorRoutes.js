const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../../shared/middleware/auth');

router.get('/', authenticate, authorize('admin'), vendorController.listVendors);
router.get('/:id', authenticate, vendorController.getVendor);
router.get('/:id/verify', authenticate, authorize('admin'), vendorController.verify);
router.get('/:id/deactivate', authenticate, authorize('admin'), vendorController.deactivate);

module.exports = router;
