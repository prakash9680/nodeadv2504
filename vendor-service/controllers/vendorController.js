const jwt = require('jsonwebtoken');
const sequelize = require('../../shared/config/database');
const { User, Vendor } = require('../../shared/config/models');
const { cache } = require('../../shared/config/redis');
const { asyncHandler, ConflictError, AuthenticationError, NotFoundError, ValidationError } = require('../../shared/middleware/errorHandler');
const sendResponse = require('../../shared/utils/response');

// Verify vendor
exports.verify = asyncHandler(async (req, res) => {
  const vendor_id = req.params.id;
  const vendor = await Vendor.findByPk(vendor_id);
  if (!vendor) throw new NotFoundError('Vendor');

  await vendor.update({ isVerified: true });

  sendResponse(res, {
    message: 'Vendor Activated'
  });
});

// Get vendor
exports.getVendor = asyncHandler(async (req, res) => {
  const vendor_id = req.params.id;
  const vendor = await Vendor.findByPk(vendor_id);
  if (!vendor) throw new NotFoundError('Vendor');

  sendResponse(res, {
    message: 'Success',
    data: vendor,
  });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const vendor_id = req.params.id;
  const vendor = await Vendor.findByPk(vendor_id);
  if (!vendor) throw new NotFoundError('Vendor');

  await vendor.update({ isVerified: false });

  sendResponse(res, {
    message: 'Vendor Deactivated'
  });
});

exports.listVendors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;

  const cacheKey = `vendors:${req.user.id}:${page}:${limit}:${status || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendResponse(res, { data: cached.vendors, meta: { total: cached.total, page: cached.page, totalPages: cached.totalPages } });

  const where = { userId: req.user.id };
  if (status) where.status = status;
  if (req.user.role === 'admin') delete where.userId;

  const vendor = await Vendor.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const result = { vendors: vendor.rows, total: vendor.count, page, totalPages: Math.ceil(vendor.count / limit) };
  await cache.set(cacheKey, result, 120);
  sendResponse(res, { data: vendor.rows, meta: { total: vendor.count, page, totalPages: Math.ceil(vendor.count / limit) } });
});
