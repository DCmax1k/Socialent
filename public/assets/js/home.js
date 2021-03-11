const posts = document.querySelectorAll('.post-cont');
const likeBtns = document.querySelectorAll('.like-btn > i');
const likeBtnsText = document.querySelectorAll('.like-btn > p');
const postImgs = document.querySelectorAll('.post-img > img');
const postVideos = document.querySelectorAll('.post-img > video');
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
const authorSpaces = document.querySelectorAll('.author');
const bottomBtns = document.querySelectorAll('.bottom-btns');

// Add prefix to username in author space at top of post
authorSpaces.forEach(async authorSpace => {
  const authorUser = await lookupUsername(authorSpace.getAttribute('data-author-id'));
  const node = document.createElement('span');
  if (authorUser.prefix.title) {
    if (authorUser.rank === 'owner') {
      node.innerHTML = `<p class="prefix owner">[${authorUser.prefix.title}]</p>&nbsp;`;
    } else if (authorUser.rank === 'admin') {
      node.innerHTML = `<p class="prefix admin">[${authorUser.prefix.title}]</p>&nbsp;`;
    } else {
      node.innerHTML = `<p class="prefix">[${authorUser.prefix.title}]</p>&nbsp;`;
    }
  }
  authorSpace.insertBefore(node, authorSpace.childNodes[authorSpace.childNodes.length - 1]);
});

// Admin delete post

// Function
const adminDeletePost = async (postID, admin, user) => {
  try {
    const confirming = confirm('Are you sure you would like to delete this post?');
    if (confirming) {
      const response = await fetch('/home/admindeletepost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postID,
          admin,
          user,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      if (resJSON.status !== 'success') {
        window.location.href = '/login';
      }
      const warning = "Unfortunatly, one of your recent posts have been deleted because it went against our Terms of Use or Privacy Policy!"
      const response1 = await fetch('/home/warn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userID: user,
            adminID: admin,
            warning,
            device: window.navigator.userAgent,
        }),
      });
      const resJSON1 = await response1.json();
      if (resJSON1.status === 'success' && resJSON.status === 'success') {
          posts.forEach(post => {
            if (post.getAttribute('data-post-id') === resJSON.postID) {
              post.parentNode.removeChild(post);
            }
          });
      } else if (resJSON1.status === 'unseccessful') {
          window.location.href = '/login';
      }
    }
    
  } catch(err) {
    console.error(err);
  }
};

// Check rank of user
const checkUserRank = async authorID => {
  try {
    const response = await fetch('/home/checkuserrank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorID,
      }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
      return resJSON.rank;
    }
  } catch(err) {
    console.error(err);
  }
};

bottomBtns.forEach( async bottomBtn => {
  const postID = bottomBtn.getAttribute('data-post-id');
  const authorID = bottomBtn.getAttribute('data-author-id');
  const userRank = await checkUserRank(userID);
  const authorRank = await checkUserRank(authorID);
  if ((authorRank === 'owner' && userRank === 'owner') || (userRank === 'owner' && authorRank === 'admin') || (userRank === 'admin' && authorRank !== 'owner') || (authorRank === 'user' && (userRank === 'owner' || userRank === 'admin'))) {
    const node = document.createElement('div');
    node.classList.add('admin-delete-btn');
    node.innerHTML =
    `
    <i data-post-id="${postID}" class="fas fa-ban"></i>
    `;
    node.addEventListener('click', () => {
      adminDeletePost(postID, userID, authorID);
    });
    bottomBtn.appendChild(node);
  }
});

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

const likePost = async likeBtn => {
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
}

likeBtns.forEach((likeBtn) => {
  likeBtn.addEventListener('click', () => {
    likePost(likeBtn);
  });
});

playBtns.forEach(playBtn => {
  playBtn.addEventListener('dblclick', () => {
    const postID = playBtn.getAttribute('data-post-id');
    likeBtns.forEach(likeBtn => {
      if (likeBtn.getAttribute('data-post-id') === postID) {
        likePost(likeBtn);
      }
    });
  });
});

postImgs.forEach(postImg => {
  postImg.addEventListener('dblclick', () => {
    const postID = postImg.getAttribute('data-post-id');
    likeBtns.forEach(likeBtn => {
      if (likeBtn.getAttribute('data-post-id') === postID) {
        likePost(likeBtn);
      }
    });
  });
})

// Warnings
let currentWarnings = [];

const checkForWarnings = async () => {
  if (!document.hidden) {
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
  
}
checkForWarnings();
setInterval(async () => {
  await checkForWarnings(); 
}, 3000);

const generateWarnings = () => {
  warnAlerts.innerHTML = '';
  currentWarnings.forEach((warning, i) => {
    if (warning.active == true) {
      const node = document.createElement('div');
      node.classList.add('warning');
      node.innerHTML = 
      `
      <i class="warn-icon fas fa-exclamation"></i>
      <h1>${warning.text}</h1>
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

// Load videos
window.addEventListener('load', () => {
  postVideos.forEach(postVideo => {
    postVideo.load();
  });

});