const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    // [username of one person, username of second person]
    people: {
        type: [String],
        required: true,
    },
    // [[_id of sender, value of text, date?]]
    messages: {
        type: [Array],
        required: false,
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema);