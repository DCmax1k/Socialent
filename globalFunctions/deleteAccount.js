const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Post = require('../models/Post');

const deleteUser = async id => {
    try {
        const user = await User.findById(id);

          // Deleting associated posts
          const deleteAllPosts = await Post.deleteMany({ 'author._id': user._id });
          const deleteIdsFromFollowing = await User.updateMany({
            $pull: { following: user._id },
          });

          // Deleting associated conversations
          const allConversations = await Conversation.find();
          const conversations = allConversations.map(conversation => {
              if (conversation.people.includes(user._id)) {
                  return conversation;
              }
          });
          conversations.forEach(async conversation => {
              if (conversation != undefined) {
                var deleteConversation = await Conversation.deleteOne({ _id: conversation._id});
              }
          });

          // Delete user
          const deleteUser = await User.deleteOne({ _id: user._id });
          return 'success';
      } catch (err) {
        console.error(err);
        return 'unseccessful'
      }
}

module.exports = deleteUser;