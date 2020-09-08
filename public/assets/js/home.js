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
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});
