const firebase_admin = require('firebase-admin');
const db = firebase_admin.firestore();
const { getStorage, ref, deleteObject } = require('firebase/storage');
const storage = getStorage();

const deleteUser = async id => {
    try {
        // const user = await User.findById(id);
        const user = (await db.collection('users').where('_id', '==', id).get()).docs[0].data();

          // Delete all posts
          // First delete all posts images in storage
          (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(post => {
            if (post.data().url.includes('firebase')) {
              // Find file name
              const splitVersion = post.url.split('%2F');
              const fileName = splitVersion[2].slice(0, splitVersion[2].length - 10);
              const postsRef = ref(storage, `posts/${user._id}`);
              const imageRef = ref(postsRef, fileName);
      
              deleteObject(imageRef);
            }
          });
          (await db.collection('posts').where('author._id', '==', user._id).get()).docs.forEach(doc => {
            try {
              doc.ref.delete();
            } catch(err) {
              console.error(err);
            }
          });

          // Delete users id from everyones following list
          (await db.collection('users').where('following', 'array-contains', user._id).get()).docs.forEach(async doc => {
            const followingArray = doc.data().following;
            const pos = followingArray.indexOf(user._id);
            followingArray.splice(pos, 1);
            const deleteIdFromFollowing = await doc.ref.update('following', followingArray);
          });

          // Delete conversaions with them in it when its only them and one other.
          (await db.collection('conversations').where('people', 'array-contains', user._id).get()).docs.forEach(doc => {
            try {
              if (doc.data().people.length === 2) {
                // First delete the images from storage in the chat
                doc.data().messages.forEach(message => {
                  if (message.type == 'img' && message.value.includes('firebase')) {
                      // Find file name
                      const splitVersion = message.value.split('%2F');
                      const fileName = splitVersion[2].slice(0, splitVersion[2].length - 10);
                      const messagesRef = ref(storage, `messageImages/${user._id}`);
                      const imageRef = ref(messagesRef, fileName);
                
                      deleteObject(imageRef);
                  }
                });

                doc.ref.delete();
                
              } else {
                const people = doc.data().people;
                doc.ref.update('people', people.filter(id => id !== user._id));
              }
            } catch(err) {
              console.error(err);
            }
          });

          // Delete user
          // First delete users profile image in storage
          if (user.profileImage.includes('firebase')) {
            // Find file name
            const splitVersion = post.url.split('%2F');
            const fileName = splitVersion[2].slice(0, splitVersion[2].length - 10);
            const postsRef = ref(storage, `profileImgs/${user._id}`);
            const imageRef = ref(postsRef, fileName);
    
            deleteObject(imageRef);
          }
          const deleteUser = await ( await db.collection('users').where('_id', '==', user._id).get()).docs[0].ref.delete();
          return 'success';
      } catch (err) {
        console.error(err);
        return 'unseccessful'
      }
}

module.exports = deleteUser;