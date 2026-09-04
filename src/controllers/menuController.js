const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});

async function getProfile(req, res) {
  const restaurant = await Restaurant.findById(req.user.tenantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
}

async function updateProfile(req, res) {
  const restaurant = await Restaurant.findById(req.user.tenantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  const { name, phone, address } = req.body;
  if (name) restaurant.name = name;
  if (phone !== undefined) restaurant.phone = phone;
  if (address !== undefined) restaurant.address = address;
  if (req.file) restaurant.logo = `/uploads/${req.file.filename}`;
  await restaurant.save();
  res.json(restaurant);
}

async function listCategories(req, res) {
  const items = await MenuCategory.find({ tenantId: req.user.tenantId, isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
  res.json(items);
}

async function createCategory(req, res) {
  const { name, sortOrder } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const cat = await MenuCategory.create({
    tenantId: req.user.tenantId,
    name,
    sortOrder: sortOrder || 0,
  });
  res.status(201).json(cat);
}

async function updateCategory(req, res) {
  const cat = await MenuCategory.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  if (req.body.name) cat.name = req.body.name;
  if (req.body.sortOrder !== undefined) cat.sortOrder = req.body.sortOrder;
  await cat.save();
  res.json(cat);
}

async function deleteCategory(req, res) {
  const cat = await MenuCategory.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  cat.isActive = false;
  await cat.save();
  res.json({ message: 'Category deactivated' });
}

async function listItems(req, res) {
  const q = { tenantId: req.user.tenantId, isActive: true };
  if (req.query.categoryId) q.categoryId = req.query.categoryId;
  const items = await MenuItem.find(q).sort({ name: 1 });
  res.json(items);
}

async function createItem(req, res) {
  const { name, categoryId, description, price, taxPercent, isAvailable } = req.body;
  if (!name || !categoryId || price === undefined) {
    return res.status(400).json({ message: 'name, categoryId and price are required' });
  }
  const cat = await MenuCategory.findOne({ _id: categoryId, tenantId: req.user.tenantId, isActive: true });
  if (!cat) return res.status(400).json({ message: 'Invalid category' });
  const item = await MenuItem.create({
    tenantId: req.user.tenantId,
    categoryId,
    name,
    description: description || '',
    price: Number(price),
    taxPercent: Number(taxPercent || 0),
    image: req.file ? `/uploads/${req.file.filename}` : '',
    isAvailable: isAvailable === undefined ? true : isAvailable === true || isAvailable === 'true',
  });
  res.status(201).json(item);
}

async function updateItem(req, res) {
  const item = await MenuItem.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  const { name, categoryId, description, price, taxPercent, isAvailable } = req.body;
  if (name) item.name = name;
  if (categoryId) {
    const cat = await MenuCategory.findOne({ _id: categoryId, tenantId: req.user.tenantId, isActive: true });
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    item.categoryId = categoryId;
  }
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = Number(price);
  if (taxPercent !== undefined) item.taxPercent = Number(taxPercent);
  if (isAvailable !== undefined) item.isAvailable = isAvailable === true || isAvailable === 'true';
  if (req.file) item.image = `/uploads/${req.file.filename}`;
  await item.save();
  res.json(item);
}

async function deleteItem(req, res) {
  const item = await MenuItem.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  item.isActive = false;
  item.isAvailable = false;
  await item.save();
  res.json({ message: 'Item deactivated' });
}

async function listTables(req, res) {
  const items = await Table.find({ tenantId: req.user.tenantId, isActive: true }).sort({ name: 1 });
  res.json(items);
}

async function createTable(req, res) {
  const { name, capacity } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const table = await Table.create({
    tenantId: req.user.tenantId,
    name,
    capacity: capacity || 4,
  });
  res.status(201).json(table);
}

async function updateTable(req, res) {
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!table) return res.status(404).json({ message: 'Table not found' });
  if (req.body.name) table.name = req.body.name;
  if (req.body.capacity !== undefined) table.capacity = req.body.capacity;
  await table.save();
  res.json(table);
}

async function deleteTable(req, res) {
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!table) return res.status(404).json({ message: 'Table not found' });
  table.isActive = false;
  await table.save();
  res.json({ message: 'Table deactivated' });
}

module.exports = {
  upload,
  getProfile,
  updateProfile,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  listTables,
  createTable,
  updateTable,
  deleteTable,
};
