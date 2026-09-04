const mongoose = require('mongoose');

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const ORDER_TYPES = ['DINE_IN', 'TAKEAWAY'];

const orderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderNumber: { type: String, required: true },
    orderType: { type: String, enum: ORDER_TYPES, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'NEW' },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    tableName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    notes: { type: String, default: '' },
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    kotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kot', default: null },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.ORDER_TYPES = ORDER_TYPES;
