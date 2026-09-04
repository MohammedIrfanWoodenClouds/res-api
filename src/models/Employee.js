const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
