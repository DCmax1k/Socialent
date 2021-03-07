// const mongoose = require('mongoose');

// const PostSchema = mongoose.Schema({
//   active: {
//     type: Boolean,
//     required: true,
//     default: true,
//   },
//   // ._id .username .profileImg
//   author: {
//     type: Object,
//     required: true,
//   },
//   // url of image
//   url: {
//     type: String,
//     required: true,
//   },
//   urlType: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: false,
//   },
//   // ID of users that liked
//   likes: {
//     type: [String],
//     default: [],
//   },
//   // Each smaller array includes username, comment, date
//   comments: {
//     type: [Array],
//   },
//   date: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model('Post', PostSchema);
