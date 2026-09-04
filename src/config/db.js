const dns = require('dns');
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_billing';

  // Windows/ISP DNS often fails Node's SRV lookup for mongodb+srv://
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      dns.setDefaultResultOrder('ipv4first');
    } catch (_) {
      // ignore if platform does not support
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}

module.exports = connectDB;
