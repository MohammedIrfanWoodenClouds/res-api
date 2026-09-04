const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');

async function listSuppliers(req, res) {
  const items = await Supplier.find({ tenantId: req.user.tenantId, isActive: true }).sort({ name: 1 });
  res.json(items);
}

async function createSupplier(req, res) {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const s = await Supplier.create({
    tenantId: req.user.tenantId,
    name,
    phone: phone || '',
    address: address || '',
  });
  res.status(201).json(s);
}

async function updateSupplier(req, res) {
  const s = await Supplier.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  if (req.body.name) s.name = req.body.name;
  if (req.body.phone !== undefined) s.phone = req.body.phone;
  if (req.body.address !== undefined) s.address = req.body.address;
  await s.save();
  res.json(s);
}

async function deleteSupplier(req, res) {
  const s = await Supplier.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  s.isActive = false;
  await s.save();
  res.json({ message: 'Supplier deactivated' });
}

async function listPurchases(req, res) {
  const purchases = await Purchase.find({ tenantId: req.user.tenantId, status: 'ACTIVE' }).sort({
    date: -1,
  });
  res.json(purchases);
}

async function getPurchase(req, res) {
  const purchase = await Purchase.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  const items = await PurchaseItem.find({ tenantId: req.user.tenantId, purchaseId: purchase._id });
  res.json({ purchase, items });
}

async function createPurchase(req, res) {
  const { supplierId, date, invoiceNumber, items, paymentStatus, notes } = req.body;
  if (!supplierId || !date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'supplierId, date and items are required' });
  }
  const supplier = await Supplier.findOne({
    _id: supplierId,
    tenantId: req.user.tenantId,
    isActive: true,
  });
  if (!supplier) return res.status(400).json({ message: 'Invalid supplier' });

  let total = 0;
  const lines = items.map((row) => {
    const qty = Number(row.quantity);
    const rate = Number(row.rate);
    const lineTotal = Math.round((qty * rate + Number.EPSILON) * 100) / 100;
    total += lineTotal;
    return {
      name: row.name,
      quantity: qty,
      unit: row.unit || 'kg',
      rate,
      total: lineTotal,
    };
  });
  total = Math.round((total + Number.EPSILON) * 100) / 100;

  const purchase = await Purchase.create({
    tenantId: req.user.tenantId,
    supplierId: supplier._id,
    supplierName: supplier.name,
    date: new Date(date),
    invoiceNumber: invoiceNumber || '',
    total,
    paymentStatus: paymentStatus || 'Pending',
    notes: notes || '',
  });

  await PurchaseItem.insertMany(
    lines.map((l) => ({
      tenantId: req.user.tenantId,
      purchaseId: purchase._id,
      ...l,
    }))
  );

  res.status(201).json({ purchase, items: lines });
}

async function cancelPurchase(req, res) {
  const purchase = await Purchase.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  if (purchase.status === 'CANCELLED') return res.json(purchase);
  purchase.status = 'CANCELLED';
  purchase.cancelledBy = req.user.userId;
  purchase.cancelledAt = new Date();
  purchase.cancelReason = req.body.cancelReason || '';
  await purchase.save();
  res.json(purchase);
}

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listPurchases,
  getPurchase,
  createPurchase,
  cancelPurchase,
};
