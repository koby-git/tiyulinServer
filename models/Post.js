const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
  },
});

const commentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
  },
  text: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const PostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
  },
  title: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  direction: {
    type: String,
    required: true,
  },
  location: {
    longitude: String,
    latitude: String,
  },
  waze: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  likes: [likeSchema],
  comments: [commentSchema],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('post', PostSchema);
