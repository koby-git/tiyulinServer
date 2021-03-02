const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Post = require('../../models/Post');
const Image = require('../../models/Image');
const auth = require('../../middleware/auth');
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();

const multerS3 = require('multer-s3');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
var fs = require('fs');
const crypto = require('crypto');
var path = require('path');
const aws = require('aws-sdk');
const { check, validationResult, body } = require('express-validator');

// aws.config.update({
// secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   region: 'ap-south-1',
// });

const spacesEndpoint = new aws.Endpoint('sfo3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
});
var upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: 'tiyulin-server',
    // metadata: function (req, file, cb) {
    //   cb(null, {
    //     fieldName:
    //       file.fieldname + Date.now() + path.extname(file.originalname),
    //   });
    // },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

//POST post
router.post(
  '/',
  upload.single('image'),
  auth,
  check('title', 'נא הזן כותרת').notEmpty(),
  check('direction', 'נא הזן דרכח הגעה').notEmpty(),
  check('longitude', 'נא הזן כתובת מיקום').notEmpty(),
  check('latitude', 'נא הזן כתובת מיקום').notEmpty(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        title: req.body.title,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
        direction: req.body.direction,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
        img: req.file.location,
        tags: JSON.parse(req.body.tags),
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.log('ppppppppp');
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//PUT like
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (post.likes.some((like) => like.user.toString() == req.user.id)) {
      post.likes = post.likes.filter(
        ({ user }) => user.toString() !== req.user.id
      );
    } else {
      post.likes.unshift({ user: req.user.id });
    }

    await post.save();
    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//PUT unlike
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not yet been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//POST comment
router.put(
  '/comment/:id',
  auth,
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//DELETE comment
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

//GET POSTS
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber); // Make sure to parse the page to number
    const PAGE_SIZE = 100; // Similar to 'limit'
    const skip = (page - 1) * PAGE_SIZE; // For page 1, the skip is: (1 - 1) * 20 => 0 * 20 = 0
    const posts = await Post.find()
      .sort({ date: 'desc' })
      .skip(skip) // Same as before, always use 'skip' first
      .limit(PAGE_SIZE);

    if (!posts) {
      return res.status(400).json({ msg: 'There is no post' });
    }

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//GET post
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id).populate('user', [
      'name',
      'avatar',
    ]);

    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if ((err.kind = 'ObjectId')) return res.status(400).send('Post not found');
    res.status(500).send('Server Error');
  }
});

//DELETE post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (req.user.id !== post.user.toString()) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (!post) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if ((err.kind = 'ObjectId')) return res.status(400).send('Post not found');
    res.status(500).send('Server Error');
  }
});

module.exports = router;
