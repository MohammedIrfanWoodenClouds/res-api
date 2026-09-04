const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
