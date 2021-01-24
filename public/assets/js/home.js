const posts = document.querySelectorAll('.post-cont');
const likeBtns = document.querySelectorAll('.like-btn > i');
const likeBtnsText = document.querySelectorAll('.like-btn > p');
const logOutBt = document.getElementById('logOutBtn');
const viewCommentsBtns = document.querySelectorAll('.view-comments-btn');
const allCommentsConts = document.querySelectorAll('.all-comments');
const commentsAreas = document.querySelectorAll('.comments-area');
const addCommentInputs = document.querySelectorAll('.add-comment > input');
const submitCommentBtns = document.querySelectorAll('.submit-comment');
const descriptions = document.querySelectorAll('.description');
const shareBtns = document.querySelectorAll('.share-btn > i');
const copyPosts = document.querySelectorAll('.copy-post');
const openDeleteMenus = document.querySelectorAll('.open-delete-post-menu');
const deletePostMenus = document.querySelectorAll('.delete-post-menu');
const deletePosts = document.querySelectorAll('.delete-post');
const playBtns = document.querySelectorAll('.play-btn');
const videos = document.querySelectorAll('.post-img > video');
const warnAlerts = document.getElementById('warnAlerts');
const dismissBtns = document.querySelectorAll('.dismiss-btn')


// Play a video
playBtns.forEach((playBtn) => {
  playBtn.addEventListener('click', () => {
    const postID = playBtn.getAttribute('data-post-id');
    videos.forEach((video) => {
      if (video.getAttribute('data-post-id') === postID) {
        if (video.paused) {
          video.play();
          playBtn.style.opacity = '0';
        } else {
          video.pause();
          playBtn.style.opacity = '1';
        }
      }
    });
  });
});

// Delete post

// Open menu
openDeleteMenus.forEach((openDeleteMenu) => {
  openDeleteMenu.addEventListener('click', () => {
    const postID = openDeleteMenu.getAttribute('data-post-id');
    deletePostMenus.forEach((deletePostMenu) => {
      if (deletePostMenu.getAttribute('data-post-id') === postID) {
        deletePostMenu.classList.toggle('active');
      }
    });
  });
});

// Actual Delete post
deletePosts.forEach((deletePost) => {
  deletePost.addEventListener('click', async () => {
    const postID = deletePost.getAttribute('data-post-id');
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
      posts.forEach((post) => {
        if (post.getAttribute('data-post-id') === postID) {
          videos.forEach((video) => {
            if (video.getAttribute('data-post-id') === postID) {
              if (!video.paused) {
                video.pause();
              }
            }
          });
          post.style.display = 'none';
        }
      });
    } else {
      window.location.href = '/login';
    }
  });
});

// Share post
shareBtns.forEach((shareBtn) => {
  shareBtn.addEventListener('click', () => {
    copyPosts.forEach((copyPost) => {
      if (
        copyPost.getAttribute('data-post-id') ===
        shareBtn.getAttribute('data-post-id')
      ) {
        const postID = copyPost.getAttribute('data-post-id');
        const node = document.createElement('textarea');
        node.value = `${domain}/post/${postID}`;
        document.body.appendChild(node);
        node.select();
        document.execCommand('copy');
        document.body.removeChild(node);
        copyPost.style.display = 'inline-block';
        setTimeout(() => {
          copyPost.style.display = 'none';
        }, 5000);
      }
    });
  });
});

// Develope return values in post description
descriptions.forEach((description) => {
  const username = description.innerHTML.split('&nbsp; ')[0] + '&nbsp; ';
  let descText = description.innerHTML.split('&nbsp; ')[1];
  descText = descText.trim();
  descText = descText.split('');
  descText.pop();
  descText.shift();
  descText = descText.join('');
  descText = descText.replace(/\\n/gi, '<br />');
  const finalHTML = username + descText;
  description.innerHTML = finalHTML;
});

// Post Comment
submitCommentBtns.forEach((submitCommentBtn) => {
  submitCommentBtn.addEventListener('click', () => {
    const postID = submitCommentBtn.getAttribute('data-post-id');
    addCommentInputs.forEach(async (addCommentInput) => {
      try {
        if (addCommentInput.getAttribute('data-post-id') === postID) {
          if (addCommentInput.value) {
            const response = await fetch('/home/addcomment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                postID,
                comment: addCommentInput.value,
                userID,
                date:
                  new Date().getMonth() +
                  1 +
                  '/' +
                  (new Date().getUTCDate() - 1) +
                  '/' +
                  new Date().getFullYear(),
                device: window.navigator.userAgent,
              }),
            });
            const resJSON = await response.json();
            if (resJSON.status === 'successful') {
              addCommentInput.value = '';
              viewCommentsBtns.forEach((viewCommentsBtn) => {
                if (viewCommentsBtn.getAttribute('data-post-id') === postID) {
                  viewCommentsBtn.innerText = `View ${
                    resJSON.length == 1 ? '' : 'all'
                  } ${resJSON.length} comment${resJSON.length == 1 ? '' : 's'}`;
                }
              });
              const hr = document.createElement('hr');
              hr.classList.add('light-hr');
              const node = document.createElement('div');
              node.classList.add('comment');
              node.innerHTML = `
              <b>${resJSON.comment[0]}</b>&nbsp;${resJSON.comment[1]}
              <p class="comment-date">${resJSON.comment[2]}</p>
            `;
              commentsAreas.forEach((commentsArea) => {
                if (commentsArea.getAttribute('data-post-id') === postID) {
                  commentsArea.insertBefore(hr, commentsArea.childNodes[0]);
                  commentsArea.insertBefore(node, commentsArea.childNodes[0]);
                }
              });
            } else {
              window.location.href = '/login';
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
});

// Post comment on press 'ENTER'
addCommentInputs.forEach((addCommentInput) => {
  addCommentInput.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
      submitCommentBtns.forEach((submitCommentBtn) => {
        if (
          submitCommentBtn.getAttribute('data-post-id') ===
          addCommentInput.getAttribute('data-post-id')
        ) {
          submitCommentBtn.click();
        }
      });
    }
  });
});

// View Comments
viewCommentsBtns.forEach((viewCommentsBtn) => {
  viewCommentsBtn.addEventListener('click', () => {
    const postID = viewCommentsBtn.getAttribute('data-post-id');
    allCommentsConts.forEach((allCommentsCont) => {
      if (allCommentsCont.getAttribute('data-post-id') === postID) {
        allCommentsCont.classList.toggle('active');
      }
    });
  });
});

// Like/unlike post
likeBtns.forEach((likeBtn) => {
  likeBtn.addEventListener('click', async () => {
    try {
      const postID = likeBtn.getAttribute('data-post-id');
      if (
        !likeBtn.getAttribute('data-post-liked') ||
        likeBtn.getAttribute('data-post-liked') === 'false'
      ) {
        // Like post
        const response = await fetch('/home/likepost', {
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
        if (resJSON.status === 'liked') {
          likeBtn.style.color = 'red';
          likeBtn.setAttribute('data-post-liked', 'true');
          likeBtnsText.forEach((text) => {
            if (text.getAttribute('data-post-id') === postID) {
              const currentNumLikes = text.innerText.split(' ')[0];
              if (currentNumLikes == 0) {
                text.innerText = parseFloat(currentNumLikes) + 1 + ' Like';
              } else {
                text.innerText = parseFloat(currentNumLikes) + 1 + ' Likes';
              }
            }
          });
        } else {
          window.location.href = '/login';
        }
      } else {
        // Unlike post
        const resp = await fetch('/home/unlikepost', {
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
        const respJSON = await resp.json();
        if (respJSON.status === 'unliked') {
          likeBtn.style.color = '#c4c4c4';
          likeBtn.setAttribute('data-post-liked', 'false');
          likeBtnsText.forEach((text) => {
            if (text.getAttribute('data-post-id') === postID) {
              const currentNumLikes = text.innerText.split(' ')[0];
              if (currentNumLikes == 2) {
                text.innerText = parseFloat(currentNumLikes) - 1 + ' Like';
              } else {
                text.innerText = parseFloat(currentNumLikes) - 1 + ' Likes';
              }
            }
          });
        } else {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});

// Warnings
let currentWarnings = [];

const checkForWarnings = async () => {
  const response = await fetch('/home/checkwarnings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userID,
      device: window.navigator.userAgent,
    }),
  });
  const resJSON = await response.json();
  if (resJSON.status === 'success') {
    if (currentWarnings == resJSON.warnings) {
      return;
    } else {
      currentWarnings = resJSON.warnings;
      generateWarnings();
    }
  }
}
checkForWarnings();
setInterval(async () => {
  await checkForWarnings();
}, 3000);

const generateWarnings = () => {
  warnAlerts.innerHTML = '';
  currentWarnings.forEach((warning, i) => {
    if (warning[1] == true) {
      const node = document.createElement('div');
      node.classList.add('warning');
      node.innerHTML = 
      `
      <i class="warn-icon fas fa-exclamation"></i>
      <h1>${warning[0]}</h1>
      <button class='dismiss-btn' data-warning-index='${i}'>Dismiss</button>
      `;
      giveDisEventListener(node.childNodes[5]);
      warnAlerts.appendChild(node);
    }
  })
}

// Give dismiss btn event listener
const giveDisEventListener = dismissBtn => {
  dismissBtn.addEventListener('click', async () => {
    dismissBtn.style.display = 'none';
    const response = await fetch('/home/dismisswarn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userID,
        device: window.navigator.userAgent,
        index: dismissBtn.getAttribute('data-warning-index'),

      }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
      await checkForWarnings();
    } else {
      window.location.href = '/login';
    }
  });
};

  

