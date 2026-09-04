const mongoose = require('mongoose');

const KOT_STATUSES = ['CREATED', 'PREPARING', 'READY', 'CANCELLED'];

const kotSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    kotNumber: { type: String, required: true },
    status: { type: String, enum: KOT_STATUSES, default: 'CREATED' },
    tableName: { type: String, default: '' },
    orderType: { type: String, default: '' },
    items: [
      {
        name: String,
        quantity: Number,
      },
    ],
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

kotSchema.index({ tenantId: 1, kotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Kot', kotSchema);
module.exports.KOT_STATUSES = KOT_STATUSES;
