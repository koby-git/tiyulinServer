const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jtw = require('jsonwebtoken');
const config = require('config');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const aws = require('aws-sdk');
var path = require('path');
const multer = require('multer');

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  region: 'ap-south-1',
});

const s3 = new aws.S3({});

var upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: 'tiyulim-bucket',
    // metadata: function (req, file, cb) {
    //   cb(null, {
    //     fieldName:
    //       file.fieldname + Date.now() + path.extname(file.originalname),
    //   });
    // },
    key: function (req, file, cb) {
      cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
    },
  }),
});

//UPDATE AVATAR
router.post('/avatar', auth, upload.single('image'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { avatar: req.file.location } },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/', async (req, res) => {
  try {
    const user = await User.find().select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/usersByIds', async (req, res) => {
  try {
    const user = await User.find().select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [
    check('name', 'Name is require').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User is already exist' }] });
      }

      const avatar = `http:${gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      })}`;

      user = new User({ name, email, avatar, password });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jtw.sign(
        payload,
        process.env.JWT_SECRET,
        {
          //3600 recomnede
          //this is for test
          expiresIn: 3600,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
