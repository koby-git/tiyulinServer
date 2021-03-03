const mongoose = require('mongoose');
const dotenv = require('dotenv');

require('dotenv').config();

const connectDB = async () => {
  console.log(process.env.MONGO_URI);
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
