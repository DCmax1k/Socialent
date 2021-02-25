const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    // [username of one person, username of second person]
    people: {
        type: [String],
        required: true,
    },
    // [[_id of sender, value of text, (text, img), Date.now(), 'unread' ], [Another message]]
    messages: {
        type: [Array],
        required: false,
    },
    dateActive: {
        type: Number,
        required: true,
        default: Date.now,
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema);