const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
