const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const db = process.env.MONGO_URI;
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected..');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
