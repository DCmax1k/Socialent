let loggedIn = false;
if (window.location.href.split('=').length !== 1) {
  loggedIn = true;
}

const commentsCont = document.getElementById('commentsCont');
const shareBtn = document.querySelector('#shareBtn > i');
const postID = shareBtn.getAttribute('data-post-id');
const playBtn = document.getElementById('playBtn');
const video = document.getElementById('video');

const authorSpace = document.getElementById('username');

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
  authorSpace.insertBefore(node, authorSpace.childNodes[authorSpace.childNodes.length - 2]);
}
addPrefix();

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
}

// Share Btn
shareBtn.addEventListener('click', () => {
  const node = document.createElement('textarea');
  node.value = `${domain}/post/${postID}`;
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
if (loggedIn) {
  const likeBtn = document.querySelector('#likeBtn > i');
  const likeBtnText = document.querySelector('#likeBtn > p');
  const commentInput = document.getElementById('commentInput');
  const submitComment = document.getElementById('submitComment');
  const openDeleteMenu = document.querySelector('.open-delete-post-menu');
  const deletePostMenu = document.querySelector('.delete-post-menu');
  const deletePost = document.querySelector('.delete-post');

  // Delete post
  openDeleteMenu.addEventListener('click', () => {
    deletePostMenu.classList.toggle('active');
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

  // Post comment
  commentInput.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
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
    if (loggedIn) {
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
