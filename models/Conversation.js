// const mongoose = require('mongoose');

// const ConversationSchema = mongoose.Schema({
//     // [id of one person, id of second person]
//     people: {
//         type: [String],
//         required: true,
//     },
//     // [[_id of sender, value of text, (text, img), Date.now(), 'unread' ], [Another message]]
//     messages: {
//         type: [Object],
//         required: false,
//     },
//     dateActive: {
//         type: Number,
//         required: true,
//         default: Date.now,
//     }
// });

// module.exports = mongoose.model('Conversation', ConversationSchema);