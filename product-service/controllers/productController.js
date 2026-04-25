const jwt = require("jsonwebtoken");
const sequelize = require("../../shared/config/database");
const { cache } = require('../../shared/config/redis');
const { User, Product, Vendor } = require("../../shared/config/models");
const {
  asyncHandler,
  ConflictError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
} = require("../../shared/middleware/errorHandler");
const sendResponse = require("../../shared/utils/response");

// Verify vendor
exports.create = asyncHandler(async (req, res) => {
  const { title, category, description, is_active, price, stock_quantity } =
    req.body;
  const existing = await Vendor.findOne({ where: { userId: req.user.id } });
  if (!existing) throw new NotFoundError("Vendor");
  if (!existing.isVerified) {
      sendResponse(res, {
        statusCode: 500,
        message: "Vendor not verified"
      });
  }
  const product = await Product.create({
    title: title,
    category: category,
    vendorId: existing.id,
    description: description,
    isActive: is_active,
    price: price,
    stockQuantity: stock_quantity,
  });

  sendResponse(res, {
    statusCode: 201,
    message: "Product Created",
    data: product,
  });
});

exports.productList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const existing = await Vendor.findOne({ where: { userId: req.user.id } });
  if (!existing) throw new NotFoundError("Vendor");
  if (!existing.isVerified) {
      sendResponse(res, {
        statusCode: 500,
        message: "Vendor not verified"
      });
  }
  const where = { vendorId: existing.id, isActive: true };
  
  const products = await Product.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  const result = {
    documents: products.rows,
    total: products.count,
    page,
    totalPages: Math.ceil(products.count / limit),
  };
  sendResponse(res, {
    data: products.rows,
    meta: {
      total: products.count,
      page,
      totalPages: Math.ceil(products.count / limit),
    },
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findOne({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError("Product");
  sendResponse(res, {
    message: 'Product Details',
    data: existing,
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const existing = await Product.findOne({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError("Product");
  await existing.destroy();
  sendResponse(res, {
    message: 'deleted',
  });
});