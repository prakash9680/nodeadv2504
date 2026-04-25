const User = require('../../auth-service/models/User');
const Document = require('../../document-service/models/Document');
const Notification = require('../../notification-service/models/Notification');
const Vendor = require('../../vendor-service/models/Vendor');
const Product = require('../../product-service/models/Product');
const Order = require('../../order-service/models/Order');
const OrderProduct = require('../../order-service/models/OrderProduct');
const OrderAddress = require('../../order-service/models/OrderAddress');
const AuditLog = require('../../order-service/models/AuditLog');

// Associations (Joins)
User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Document.hasMany(Notification, { foreignKey: 'document_id', as: 'notifications' });
Notification.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });


module.exports = { User, Document, Notification, Vendor , Product, OrderAddress, OrderProduct, Order, AuditLog};
