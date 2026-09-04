const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const orderService = require('../services/orderService');

async function resolveActiveRestaurant(slug) {
  return Restaurant.findOne({ slug: String(slug).toLowerCase(), isActive: true });
}

async function getPublicMenu(req, res) {
  const restaurant = await resolveActiveRestaurant(req.params.slug);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  const tenantId = restaurant._id;
  const [categories, items, tables] = await Promise.all([
    MenuCategory.find({ tenantId, isActive: true }).sort({ sortOrder: 1, name: 1 }),
    MenuItem.find({ tenantId, isActive: true, isAvailable: true }).sort({ name: 1 }),
    Table.find({ tenantId, isActive: true }).sort({ name: 1 }),
  ]);
  res.json({
    restaurant: {
      id: restaurant._id,
      name: restaurant.name,
      slug: restaurant.slug,
      logo: restaurant.logo,
      phone: restaurant.phone,
      address: restaurant.address,
    },
    categories,
    items,
    tables,
  });
}

async function placePublicOrder(req, res) {
  const restaurant = await resolveActiveRestaurant(req.params.slug);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  // Never trust client tenantId — derive exclusively from slug
  const bundle = await orderService.createPublicOrder(restaurant._id, {
    items: req.body.items,
    orderType: req.body.orderType,
    tableId: req.body.tableId,
    customerName: req.body.customerName,
    customerPhone: req.body.customerPhone,
    notes: req.body.notes,
  });
  res.status(201).json(bundle);
}

async function trackPublicOrder(req, res) {
  const restaurant = await resolveActiveRestaurant(req.params.slug);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

  const orderNumber = String(req.params.orderNumber || '').trim();
  if (!orderNumber) return res.status(400).json({ message: 'Order number is required' });

  const Order = require('../models/Order');
  const OrderItem = require('../models/OrderItem');
  const order = await Order.findOne({
    tenantId: restaurant._id,
    orderNumber,
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Optional phone check if provided (extra safety, not required)
  const phone = String(req.query.phone || '').trim();
  if (phone && order.customerPhone && order.customerPhone !== phone) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const items = await OrderItem.find({ tenantId: restaurant._id, orderId: order._id });
  res.json({
    restaurant: {
      name: restaurant.name,
      phone: restaurant.phone,
    },
    order,
    items,
  });
}

module.exports = { getPublicMenu, placePublicOrder, trackPublicOrder };
