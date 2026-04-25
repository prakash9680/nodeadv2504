const sequelize = require("../../shared/config/database");
const {
  Order,
  User,
  Product,
  OrderProduct,
  OrderAddress,
  Vendor,
  AuditLog,
} = require("../../shared/config/models");
const {
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFromS3,
} = require("../../shared/config/s3");
const { publish } = require("../../shared/config/queue");
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
} = require("../../shared/middleware/errorHandler");
const sendResponse = require("../../shared/utils/response");

exports.create = asyncHandler(async (req, res) => {
  const { ship_address, bill_address, items } = req.body;
  const order = await Order.create({
    userId: req.user.id,
    totalPrice: 0,
  });
  var totalPrice = 0;
  var products = [];
  for (const element of items) {
    var product = await Product.findOne({ id: element.product_id });
    var vendor = await Vendor.findOne({ id: product.vendorId });
    totalPrice = totalPrice + product.price * element.quantity;
    var product = await OrderProduct.create({
      orderId: order.id,
      productId: element.product_id,
      vendorName: vendor.storeName,
      productTitle: product.title,
      unitPrice: product.price,
      quantity: element.quantity,
      totalPrice: product.price * element.quantity,
    });
    products.push(product);
  }
  order.update({ totalPrice: totalPrice });
  var shipAddress;
  var billAddress;
  if (ship_address) {
    shipAddress = await OrderAddress.create({
      orderId: order.id,
      recName: ship_address.recipient,
      number: ship_address.number,
      address: ship_address.address,
      city: ship_address.city,
      state: ship_address.state,
      postalCode: ship_address.postal_code,
      Country: ship_address.country,
      addressType: "shipping",
    });
  }
  if (bill_address) {
    billAddress = await OrderAddress.create({
      orderId: order.id,
      recName: bill_address.recipient,
      number: bill_address.number,
      address: bill_address.address,
      city: bill_address.city,
      state: bill_address.state,
      postalCode: bill_address.postal_code,
      Country: bill_address.country,
      addressType: "billing",
    });
  }

  await AuditLog.create({
    userId: req.user.id,
    action: "Order Placed",
    enitytId: order.id,
    enitytType: "Order",
    metadata: "",
  });
  sendResponse(res, {
    statusCode: 202,
    message: "Order Placed",
    data: {
      order: order,
      products: products,
      ship_address: shipAddress,
      bill_address: billAddress,
    },
  });
});

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;

  const where = { userId: req.user.id };

  const order = await Order.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  const result = {
    orders: order.rows,
    total: order.count,
    page,
    totalPages: Math.ceil(order.count / limit),
  };
  sendResponse(res, {
    data: order.rows,
    meta: {
      total: order.count,
      page,
      totalPages: Math.ceil(order.count / limit),
    },
  });
});

exports.auditLog = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;

  const where = { userId: req.user.id };

  const audit = await AuditLog.findAndCountAll({
    where,
    audit: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  const result = {
    audits: audit.rows,
    total: audit.count,
    page,
    totalPages: Math.ceil(audit.count / limit),
  };
  sendResponse(res, {
    data: audit.rows,
    meta: {
      total: audit.count,
      page,
      totalPages: Math.ceil(audit.count / limit),
    },
  });
});
