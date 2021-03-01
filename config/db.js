const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // let gfs;

    // conn.once('open', () => {
    // Init stream
    // gfs = Grid(conn.db, mongoose.mongo);
    // gfs.collection('uploads');
    // });

    console.log('MongoDB Connected..');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
