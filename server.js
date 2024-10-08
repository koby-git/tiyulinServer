const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const path = require('path');

const app = express();

//Connect Database
connectDB();

//Init Middleware
app.use(express.json({ extended: false }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));

if (process.env.NODE_ENV === 'production') {
  // app.use(express.static('client/build'));
  // app.get('*', (req, res) => {
  //   res.sendFile(path.resolve(_dirname, 'client', 'build', 'index.html'));
  // });
}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
