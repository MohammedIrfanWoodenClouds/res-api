const mongoose = require('mongoose');
async function connectDB(){
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_billing');
  console.log('MongoDB connected');
}
module.exports = connectDB;
