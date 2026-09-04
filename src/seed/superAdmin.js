require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  const email = String(process.env.SUPER_ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  const password = String(process.env.SUPER_ADMIN_PASSWORD || '');
  if (!email || !password) {
    console.warn('Super admin seed skipped: SUPER_ADMIN_EMAIL/PASSWORD missing');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN') {
      console.warn('Configured super-admin email belongs to another role');
      return;
    }
    existing.passwordHash = await bcrypt.hash(password, 12);
    existing.isActive = true;
    await existing.save();
    console.log(`Super admin password synced from .env: ${email}`);
    return;
  }

  await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'SUPER_ADMIN',
    tenantId: null,
  });
  console.log(`Super admin seeded: ${email}`);
}

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_billing';
  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to ${mongoose.connection.name}`);
  await seed();

  const admin = await User.findOne({ role: 'SUPER_ADMIN' }).select('email role isActive');
  console.log('Super admin in DB:', admin ? `${admin.email} (active=${admin.isActive})` : 'NONE');
  await mongoose.disconnect();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Seed failed:', e.message);
      process.exit(1);
    });
}

module.exports = seed;
