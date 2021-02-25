const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    // [username of one person, username of second person]
    people: {
        type: [String],
        required: true,
    },
    // [[_id of sender, value of text, type: (text, img), time: Date.now()]]
    messages: {
        type: [Array],
        required: false,
    },
    dateActive: {
        type: Number,
        required: true,
        default: 1614216311084,
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema);