const bcrypt = require('bcryptjs');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const ExpenseCategory = require('../models/ExpenseCategory');
const { DEFAULT_EXPENSE_CATEGORIES } = require('../models/ExpenseCategory');

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base, id) {
  let slug = slugify(base) || 'restaurant';
  let n = 1;
  while (await Restaurant.exists({ _id: { $ne: id }, slug })) {
    slug = `${slugify(base) || 'restaurant'}-${++n}`;
  }
  return slug;
}

async function seedExpenseCategories(tenantId) {
  const docs = DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
    tenantId,
    name,
    isActive: true,
  }));
  await ExpenseCategory.insertMany(docs);
}

async function list(req, res) {
  res.json(await Restaurant.find().sort({ createdAt: -1 }));
}

async function create(req, res) {
  const { name, email, phone, address, slug, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }
  const normalized = email.trim().toLowerCase();
  if (await User.exists({ email: normalized })) {
    return res.status(409).json({ message: 'Email already exists' });
  }
  const restaurant = await Restaurant.create({
    name,
    email: normalized,
    phone,
    address,
    slug: await uniqueSlug(slug || name),
  });
  try {
    await User.create({
      email: normalized,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'RESTAURANT',
      tenantId: restaurant._id,
    });
    await seedExpenseCategories(restaurant._id);
  } catch (e) {
    await Restaurant.findByIdAndDelete(restaurant._id);
    throw e;
  }
  res.status(201).json(restaurant);
}

async function update(req, res) {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurant not found' });
  const { name, email, phone, address, slug } = req.body;
  if (name) r.name = name;
  if (email) r.email = email.trim().toLowerCase();
  if (phone !== undefined) r.phone = phone;
  if (address !== undefined) r.address = address;
  if (slug) r.slug = await uniqueSlug(slug, r._id);
  await r.save();
  if (email) {
    await User.updateOne(
      { tenantId: r._id, role: 'RESTAURANT' },
      { $set: { email: r.email } }
    );
  }
  res.json(r);
}

async function toggle(req, res) {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurant not found' });
  r.isActive = !r.isActive;
  await r.save();
  await User.updateMany({ tenantId: r._id }, { $set: { isActive: r.isActive } });
  res.json(r);
}

async function resetLogin(req, res) {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurant not found' });
  const { email, password } = req.body;
  if (!password) return res.status(400).json({ message: 'New password is required' });
  const user = await User.findOne({ tenantId: r._id, role: 'RESTAURANT' });
  if (!user) return res.status(404).json({ message: 'Restaurant login not found' });
  if (email) {
    const e = email.trim().toLowerCase();
    const conflict = await User.findOne({ email: e, _id: { $ne: user._id } });
    if (conflict) return res.status(409).json({ message: 'Email already exists' });
    user.email = e;
    r.email = e;
    await r.save();
  }
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();
  res.json({ message: 'Login reset successfully' });
}

async function remove(req, res) {
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Restaurant not found' });

  const tenantId = r._id;
  const models = [
    require('../models/MenuCategory'),
    require('../models/MenuItem'),
    require('../models/Table'),
    require('../models/Order'),
    require('../models/OrderItem'),
    require('../models/Kot'),
    require('../models/Invoice'),
    require('../models/Payment'),
    require('../models/Supplier'),
    require('../models/Purchase'),
    require('../models/PurchaseItem'),
    require('../models/Employee'),
    require('../models/SalaryPayment'),
    require('../models/ExpenseCategory'),
    require('../models/Expense'),
    require('../models/Counter'),
  ];

  await Promise.all(models.map((Model) => Model.deleteMany({ tenantId })));
  await User.deleteMany({ tenantId });
  await Restaurant.findByIdAndDelete(tenantId);

  res.json({ message: 'Restaurant deleted' });
}

module.exports = { list, create, update, toggle, resetLogin, remove };
