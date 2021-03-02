const jwt = require('jsonwebtoken');
const config = require('config');

//Tiyulim server
module.exports = function (req, res, next) {
  //New
  const { authorization } = req.headers;

  //Old authorization was token
  if (!authorization) {
    return res.status(401).json({ msg: 'No token,authorization denied' });
  }

  try {
    //New
    const token = authorization.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
