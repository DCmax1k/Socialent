const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();

const deleteUser = async id => {
    try {
        // const user = await User.findById(id);
        const user = (await db.collection('users').where('_id', '==', id).get()).docs[0].data();

          // Deleting associated posts
          // const deleteAllPosts = await Post.deleteMany({ 'author._id': user._id });
          // const deleteIdsFromFollowing = await User.updateMany({
          //   $pull: { following: user._id },
          // });
          const deleteAllPosts = (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(async doc => {
            try {
              const deleteDoc = await doc.ref.delete();
            } catch(err) {
              console.error(err);
            }
          });
          const usersWithFollwoingIds = (await db.collection('users').where('following', 'array-contains', user._id).get()).docs.forEach(async doc => {
            const followingArray = doc.data().following;
            const pos = followingArray.indexOf(user._id);
            followingArray.splice(pos, 1);
            const deleteIdFromFollowing = await doc.ref.update('following', followingArray);
          });

          // Deleting associated conversations
          // const allConversations = await Conversation.find();
          // const conversations = allConversations.map(conversation => {
          //     if (conversation.people.includes(user._id)) {
          //         return conversation;
          //     }
          // });
          // conversations.forEach(async conversation => {
          //     if (conversation != undefined) {
          //       var deleteConversation = await Conversation.deleteOne({ _id: conversation._id});
          //     }
          // });
          const allConversationsIncludingUser = (await db.collection('conversations').where('people', 'array-contains', user._id).get()).docs.forEach(async doc => {
            try {
              const deleteConversation = await doc.ref.delete();
            } catch(err) {
              console.error(err);
            }
          });

          // Delete user
          // const deleteUser = await User.deleteOne({ _id: user._id });
          const deleteUser = await ( await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.delete();
          return 'success';
      } catch (err) {
        console.error(err);
        return 'unseccessful'
      }
}

module.exports = deleteUser;