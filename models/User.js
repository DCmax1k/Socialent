const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  // .email .verified .emailCode
  emailData: {
    type: Object,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  devices: {
    type: [String],
  },
  status: {
    type: String,
    required: true,
    default: 'online',
  },
  rank: {
    type: String,
    default: 'user',
  },
  // url to image
  profileImg: {
    type: String,
    default: 'none',
  },
  description: {
    type: String,
  },
  // String is the ID of following
  following: {
    type: [String],
  },
});

module.exports = mongoose.model('User', UserSchema);
