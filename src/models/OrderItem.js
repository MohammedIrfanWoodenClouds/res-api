const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0 },
    lineSubtotal: { type: Number, required: true },
    lineTax: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrderItem', orderItemSchema);
