const commentsCont = document.getElementById('commentsCont');
const shareBtn = document.querySelector('#shareBtn > i');
const postID = shareBtn.getAttribute('data-post-id');
const playBtn = document.getElementById('playBtn');
const video = document.getElementById('video');
const authorSpace = document.getElementById('username');
const descText = document.querySelector('.descText');

// Add prefix to username in author space at top of post
const addPrefix = async () => {
  const authorUser = await lookupUsername(authorSpace.getAttribute('data-author-id'));
  const node = document.createElement('p');
  if (authorUser.prefix.title) {
    if (authorUser.rank === 'owner') {
      node.classList.add('prefix', 'owner');
      node.style.marginLeft = '5px';
      node.innerHTML = `[${authorUser.prefix.title.split('')[0]}]`;
    } else if (authorUser.rank === 'admin') {
      node.classList.add('prefix', 'admin');
      node.style.marginLeft = '5px';
      node.innerHTML = `[${authorUser.prefix.title.split('')[0]}]`;
    } else {
      node.classList.add('prefix');
      node.style.marginLeft = '5px';
      node.innerHTML = `[${authorUser.prefix.title.split('')[0]}]`;
    }
  }
  authorSpace.insertBefore(node, authorSpace.children[1]);
}
addPrefix();

const fixDesc = () => {
  let desc = descText.innerText;
  desc = desc.trim();
  desc = desc.split('');
  desc.pop();
  desc.shift();
  desc = desc.join('');
  desc = desc.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;').replace(/\\n/gi, '<br />');
  descText.innerHTML = desc;
};
fixDesc();

// Play video
if (playBtn && video) {
  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playBtn.style.opacity = '0';
    } else {
      video.pause();
      playBtn.style.opacity = '1';
    }
  });

  // Load videos
  window.addEventListener('load', () => {
    video.load();
  });
}

// Share Btn
shareBtn.addEventListener('click', () => {
  const node = document.createElement('textarea');
  node.value = `${window.location.host}/post/${postID}`;
  document.body.appendChild(node);
  node.select();
  document.execCommand('copy');
  document.body.removeChild(node);
  document.querySelector('#shareBtn > p').style.display = 'inline-block';
  setTimeout(() => {
    document.querySelector('#shareBtn > p').style.display = 'none';
  }, 5000);
});

// If logged in
if (userID) {
  const likeBtn = document.querySelector('#likeBtn > i');
  const likeBtnText = document.querySelector('#likeBtn > p');
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');
  


  // Post comment
  commentInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter') {
      submitComment.click();
    }
  });
  submitComment.addEventListener('click', async (req, res) => {
    if (commentInput.value) {
      const response = await fetch('/post/addcomment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: commentInput.value,
          postID,
          device: window.navigator.userAgent,
          userID,
          date:
            new Date().getMonth() +
            1 +
            '/' +
            (new Date().getUTCDate() - 1) +
            '/' +
            new Date().getFullYear(),
        }),
      });
      const resJSON = await response.json();
      if (resJSON.status === 'successful') {
        const node = document.createElement('div');
        node.classList.add('comment');
        node.innerHTML = `
        <p><b>${resJSON.username}</b> ${resJSON.comment}</p>
        <span>${resJSON.date}</span>
        `;
        commentsCont.insertBefore(node, commentsCont.childNodes[0]);
        commentInput.value = '';
      } else {
        window.location.href = '/login';
      }
    }
  });

  // Like/unlike post
  likeBtn.addEventListener('click', async () => {
    if (userID) {
      if (likeBtn.getAttribute('data-post-liked') == 'false') {
        const response = await fetch('/post/likepost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID,
            postID,
            device: window.navigator.userAgent,
          }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'offline') {
          window.location.href = '/login';
        } else if (resJSON.status === 'liked') {
          likeBtn.style.color = 'red';
          likeBtnText.innerText = `${resJSON.likesAmount + 1} Like${
            resJSON.likesAmount + 1 === 1 ? '' : 's'
          }`;
          likeBtn.setAttribute('data-post-liked', 'true');
        }
      } else {
        const response = await fetch('/post/unlikepost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID,
            postID,
            device: window.navigator.userAgent,
          }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'offline') {
          window.location.href = '/login';
        } else if (resJSON.status === 'unliked') {
          likeBtn.style.color = '#c4c4c4';
          likeBtnText.innerText = `${resJSON.likesAmount - 1} Like${
            resJSON.likesAmount - 1 === 1 ? '' : 's'
          }`;
          likeBtn.setAttribute('data-post-liked', 'false');
        }
      }
    }
  });
}

// If logged in and post is the authors 
if (userID === document.getElementById('username').getAttribute('data-author-id')) {
  const openDeleteMenu = document.querySelector('.open-delete-post-menu');
  const deletePostMenu = document.querySelector('.delete-post-menu');
  const deletePost = document.querySelector('.delete-post');
  const editDescriptionBody = document.getElementById('editDescriptionBody');
  const editDescriptionTextarea = document.getElementById('editDescriptionTextarea');
  const editDescCancel = document.getElementById('editDescCancel');
  const editDescSubmit = document.getElementById('editDescSubmit');
  const editPost = document.querySelector('.edit-post');


    // Delete post
    openDeleteMenu.addEventListener('click', () => {
      deletePostMenu.focus();
    });

    deletePost.addEventListener('click', async () => {
      deletePost.innerText = 'Loading...';
      const response = await fetch('/home/deletepost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postID,
          userID,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      if (resJSON.status === 'successful') {
        window.location.href = `/account/${resJSON.username}?k=${resJSON._id}`;
      } else {
        window.location.href = '/login';
      }
    });

    // Actual edit description

  editPost.addEventListener('click', () => {
    const postID = editPost.getAttribute('data-post-id');
    editDescriptionBody.setAttribute('data-post-id', postID);
    editDescriptionBody.classList.add('active');
    editDescriptionTextarea.innerHTML = descText.innerHTML.replace(/<br>/ig, '&#10;').replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;')
    deletePostMenu.classList.remove('active');
  });


  editDescCancel.addEventListener('click', () => {
    editDescriptionBody.classList.remove('active');
    editDescriptionBody.setAttribute('data-post-id', '');
  })

  editDescSubmit.addEventListener('click', async () => {
    editDescSubmit.innertext = 'Loading...';
    const postID = editDescriptionBody.getAttribute('data-post-id')
    if (postID) {
      descText.innerText = editDescriptionTextarea.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;').replace(/\\n/gi, '<br />');
      try {

        const response = await fetch('/home/editdesc', {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID,
            postID,
            desc: editDescriptionTextarea.value,
            device: window.navigator.userAgent,
          }),
        });
        const resJSON = await response.json();
        editDescSubmit.innertext = 'Submit';
        if (resJSON.status !== 'success') {
          myAlert(resJSON.status);
        } else {
          editDescriptionBody.classList.remove('active');
          editDescriptionBody.setAttribute('data-post-id', '');
        }
      } catch(err) {
        console.error(err);
      }
    } else {
      myAlert('Error... Please refresh the page and try again!')
    }
  });
}