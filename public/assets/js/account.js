const accountUsername = window.location.href.split('/')[4].split('?')[0];
const navBarProfilePic = document.querySelector('#profileBtn > img');
const loginBtn = document.getElementById('loginBtn');
const changeNameInput = document.getElementById('changeNameInput');
const changeEmailInput = document.getElementById('changeEmailInput');
const selectName = document.getElementById('selectName');
const selectEmail = document.getElementById('selectEmail');
const submitName = document.getElementById('submitName');
const submitEmail = document.getElementById('submitEmail');
const submitChangePassword = document.getElementById('submitChangePassword');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const verifyEmailBtn = document.getElementById('verifyEmailBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileCont = document.getElementById('editProfileCont');
const closeEditProfileCont = document.getElementById('closeEditProfileCont');
const followBtn = document.getElementById('followBtn');
const updateBio = document.getElementById('updateBio');
const bio = document.getElementById('bio');
const description = document.getElementById('description');
const deleteAccount = document.getElementById('deleteAccount');
const changeImg = document.getElementById('changeImg');
const changeImgFile = document.getElementById('changeImgFile');
const profileImg = document.querySelector('#profile > #imgPlace > img');
const imgPlace = document.getElementById('imgPlace');
const changeImgText = document.getElementById('changeImg');
const setUsersPrefix = document.getElementById('setUsersPrefix');
const setUsersPrefixInput = document.getElementById('setUsersPrefixInput');
const prefix = document.querySelector('.prefix');
const postVideos = document.querySelectorAll('.imgHolder > video');
const showFollowers = document.getElementById('showFollowers');
const showFollowing = document.getElementById('showFollowing');
const followers = document.getElementById('followers');
const following = document.getElementById('following');

let showingFollowers = false;
let showingFollowing = false;

followers.addEventListener('click', () => {
  if (showingFollowers) {
    showFollowers.classList.remove('active');
    showingFollowers = false;
  } else {
    showFollowers.classList.add('active');
    showingFollowers = true;
    showFollowing.classList.remove('active');
    showingFollowing = false;
  }
  
});
following.addEventListener('click', () => {
  if (showingFollowing) {
    showFollowing.classList.remove('active');
    showingFollowing = false;
  } else {
    showFollowing.classList.add('active');
    showingFollowing = true;
    showFollowers.classList.remove('active');
    showingFollowers = false;
  }
});

// Follow
if (followBtn) {
  followBtn.addEventListener('click', async () => {
    const response = await fetch('/account/followprofile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userID,
        accountID: followBtn.getAttribute('data-account-id'),
        device: window.navigator.userAgent,
      }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'success') {
      if (resJSON.which === 'now following') {
        followBtn.innerText = 'Following';
      } else if (resJSON.which === 'not following') {
        followBtn.innerText = 'Follow';
      }
    }
  });
}


// Set return values
function fixDescription() {
  let descText = description.innerText.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
  descText = descText.trim();
  descText = descText.split('');
  descText.pop();
  descText.shift();
  descText = descText.join('');
  descText = descText.replace(/\\n/gi, '<br />');
  descText = descText.replace(/\\/gi, '');
  description.innerHTML = descText;
}
fixDescription();

// If account is the user
if (editProfileBtn) {
  // Edit Profile

  // the textarea one
  function fixBio() {
    let descText = bio.value.replace(/</ig, '&lt;').replace(/>/ig, '&gt;').replace(/\//ig, '&#47;');
    descText = descText.trim();
    descText = descText.split('');
    descText.pop();
    descText.shift();
    descText = descText.join('');
    descText = descText.replace(/\\n/gi, '&#10;');
    descText = descText.replace(/\\/gi, '');
    bio.innerHTML = descText;
  }
  fixBio();


  // Change profile pic
  changeImg.addEventListener('click', () => {
    changeImgFile.click();
  });

  // Comment out so the optimized account profile pic is uploaded
  // changeImgFile.addEventListener('change', async () => {
  //   if (changeImgFile.value) {
  //     const fileData = changeImgFile.files[0];
  //     const data = new FormData();
  //     data.append('file', fileData);
  //     data.append('upload_preset', 'thepreset');
  //     data.append('cloud_name', 'thecloudname');

  //     try {
  //       const response = await fetch(
  //         'https://api.cloudinary.com/v1_1/thecloudname/image/upload',
  //         {
  //           method: 'POST',
  //           body: data,
  //         }
  //       );
  //       const resJSON = await response.json();
  //       const imgURL = resJSON.secure_url;

  //       const newResponse = await fetch('/account/changeimg', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           imgURL,
  //           userID,
  //           device: window.navigator.userAgent,
  //         }),
  //       });

  //       const newResJSON = await newResponse.json();
  //       if (newResJSON.status === 'success') {
  //         profileImg.src = imgURL;
  //       }
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // });

  changeImgFile.addEventListener('change', () => {
    try {
      if (changeImgFile.value) {
        const file = changeImgFile.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          // Lower size and qualtiy of image
          const image = new Image();
          image.src = e.target.result;
          image.onload = async (e) => {
            const canvas = document.createElement('canvas');
            const MAX_SIDE_LENGTH = 200;
            let scaleSize;
            let ctx;
            if (image.height - image.width >= 0) {
              scaleSize = MAX_SIDE_LENGTH / e.target.width;
              canvas.width = MAX_SIDE_LENGTH;
              canvas.height = MAX_SIDE_LENGTH;
              const newHeight = e.target.height * scaleSize;
              ctx = canvas.getContext('2d');
              ctx.drawImage(e.target, 0, canvas.height/2 - newHeight/2, canvas.width, newHeight);
            } else {
              scaleSize = MAX_SIDE_LENGTH / e.target.height;
              canvas.width = MAX_SIDE_LENGTH;
              canvas.height = MAX_SIDE_LENGTH;
              const newWidth = e.target.width * scaleSize;
              ctx = canvas.getContext('2d');
              ctx.drawImage(e.target, canvas.width/2 - newWidth/2, 0, newWidth, canvas.height);  
            }
            
            const imgURL = ctx.canvas.toDataURL('image/jpeg');
            profileImg.src = imgURL;
            navBarProfilePic.src = imgURL;
            imgPlace.classList.add('active');
            changeImgText.innerText = 'Loading...';

            // Send url to DB
            const newResponse = await fetch('/account/changeimg', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imgURL,
                userID,
                device: window.navigator.userAgent,
              }),
            });
    
            const newResJSON = await newResponse.json();
            if (newResJSON.status === 'success') {
              imgPlace.classList.remove('active');
              changeImgText.innerText = 'Change image';
            }
          }
          
        }
      }
    } catch(err) {
      console.error(err);
    }
    
  })

  // Delete Account
  deleteAccount.addEventListener('click', async () => {
    const confirmation = confirm(
      'Are you sure you would like to delete your account? All data and posts will be deleted!'
    );
    if (confirmation) {
      const response = await fetch('/account/deleteaccount', {
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
        window.location.href = '/';
      } else {
        window.location.href = '/login';
      }
    }
  });

  // Update Description
  updateBio.addEventListener('click', async () => {
    updateBio.innerText = 'Loading...';
    const response = await fetch('/account/editprofile/updatebio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bio: bio.value,
        userID,
        device: window.navigator.userAgent,
      }),
    });
    const resJSON = await response.json();
    if (resJSON.status === 'successful') {
      description.innerText = JSON.stringify(resJSON.bio);
      fixDescription();
      updateBio.innerText = 'Update';
    }
  });
  // Verify Email
  // Check if email is verified
  const checkEmailVerification = async () => {
    const response = await fetch(
      '/account/editprofile/verifyemail/checkverification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID,
        }),
      }
    );
    const resJSON = await response.json();
    if (resJSON.verified) {
      verifyEmailBtn.style.visibility = 'hidden';
      verifyEmailBtn.style.pointerEvents = 'none';
    }
  };

  checkEmailVerification();

  verifyEmailBtn.addEventListener('click', async () => {
    verifyEmailBtn.innerText = 'Loading...';
    const response = await fetch('/account/editprofile/verifyemail', {
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
    if ((resJSON.status = 'sent email')) {
      verifyEmailBtn.innerText = `An email has been sent to ${resJSON.email}!`;
    }
  });

  // Change Password

  currentPassword.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
      submitChangePassword.click();
    }
  });
  newPassword.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
      submitChangePassword.click();
    }
  });
  submitChangePassword.addEventListener('click', async () => {
    if (newPassword.value.length >= 8 && currentPassword.value) {
      document.querySelector('#changePasswordCont > h1').innerHTML =
        'Loading... <i id="submitChangePassword" class="fas fa-location-arrow"></i>';
      const response = await fetch('/account/editprofile/changepassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
          device: window.navigator.userAgent,
          userID,
        }),
      });
      const resJSON = await response.json();
      document.querySelector('#changePasswordCont > h1').innerHTML =
        'Change Password <i id="submitChangePassword" class="fas fa-location-arrow"></i>';
      if (resJSON.status === 'success') {
        currentPassword.style.border = '1px solid green';
        newPassword.style.border = '1px solid green';
      } else if (resJSON.status === 'incorrect password') {
        currentPassword.style.border = '1px solid red';
        newPassword.style.border = '1px solid #BBE1FA';
      }
    }
  });

  // Edit profile name/email inputs
  selectName.addEventListener('click', () => {
    changeNameInput.select();
  });

  selectEmail.addEventListener('click', () => {
    changeEmailInput.select();
  });

  let nameChanged = false;
  changeNameInput.addEventListener('input', () => {
    selectName.style.display = 'none';
    submitName.style.display = 'inline-block';
    nameChanged = true;
  });

  let emailChanged = false;
  changeEmailInput.addEventListener('input', () => {
    selectEmail.style.display = 'none';
    submitEmail.style.display = 'inline-block';
    emailChanged = true;
  });

  // Event listener of keyup on ENTER key
  changeNameInput.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
      if (nameChanged) {
        submitName.click();
      }
    }
  });

  changeEmailInput.addEventListener('keyup', (e) => {
    if (e.keyCode == 13 || e.which == 13) {
      if (emailChanged) {
        submitEmail.click();
      }
    }
  });

  // Change name
  submitName.addEventListener('click', async () => {
    if (changeNameInput.value) {
      const nameValue = changeNameInput.value;
      changeNameInput.value = 'Loading...';
      const response = await fetch('/account/editprofile/changename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID,
          name: nameValue,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      changeNameInput.value = nameValue;
      if ((resJSON.status = 'success')) {
        submitName.style.color = 'green';
      }
    } else {
      submitName.style.color = 'red';
    }
  });

  // Change email
  submitEmail.addEventListener('click', async () => {
    if (changeEmailInput.value && changeEmailInput.value.includes('@')) {
      const emailValue = changeEmailInput.value;
      changeEmailInput.value = 'Loading...';
      const response = await fetch('/account/editprofile/changeemail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID,
          email: emailValue,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      changeEmailInput.value = emailValue;
      if ((resJSON.status = 'success')) {
        submitEmail.style.color = 'green';
        verifyEmailBtn.style.visibility = 'visible';
        verifyEmailBtn.style.pointerEvents = 'all';
        verifyEmailBtn.innerText = 'Verify Email';
      }
    } else {
      submitEmail.style.color = 'red';
    }
  });

  

}

const openPost = (postID) => {
  if (typeof userID === 'undefined') {
    window.location.href = `/post/${postID}`;
  } else {
    window.location.href = `/post/${postID}?k=${userID}`;
  }
};

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    window.location.href = '/login';
  });
}

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => {
    editProfileCont.style.transition =
      'transform 0.5s cubic-bezier(0.75, -0.28, 0.26, 1.39)';
    editProfileCont.classList.add('active');
  });
}

if (closeEditProfileCont) {
  closeEditProfileCont.addEventListener('click', () => {
    editProfileCont.classList.remove('active');
  });
}

// If logged in
if (editProfileBtn || followBtn) {
 
// Set users prefix
  if (setUsersPrefix) {
    setUsersPrefixInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' ) {
        submitSetUsersPrefix();
      }
    });

    const submitSetUsersPrefix = async () => {
      const usersPrefix = setUsersPrefixInput.value;
      const response = await fetch('/account/setusersprefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID,
          accountUsername,
          usersPrefix,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      if (resJSON.status === 'not admin') {
        window.location.href = '/login';
      } else if (resJSON.status === 'fail') {
        setUsersPrefixInput.blur();
        myAlert('Failed setting prefix');
      } else if (resJSON.status === 'success') {
        setUsersPrefixInput.blur();
        if (document.querySelector('.prefix')) {
          if (resJSON.prefix) {
            document.querySelector('.prefix').innerText = `[${resJSON.prefix}]`;
          } else {
            document.querySelector('.prefix').innerText = '';
          }
        } else {
          // Create prefix div, then set prefix value
          // <p class="prefix">[<%= account.prefix.title %>]</p>
          const node = document.createElement('p');
          node.classList.add('prefix');
          if (resJSON.usersRank === 'owner') {
            node.classList.add('owner');
          } else if (resJSON.usersRank === 'admin') {
            node.classList.add('admin');
          }
          if (resJSON.prefix) {
            node.innerText = `[${resJSON.prefix}]`;
          } else {
            node.innerText = '';
          }
          document.querySelector('#nameAndBio > h1').insertBefore(node, document.querySelector('#nameAndBio > h1').childNodes[0]);
        }
        myAlert('Successfully set')
      }
    }  
  }
  
 
}

// Load videos
window.addEventListener('load', () => {
  postVideos.forEach(postVideo => {
    postVideo.load();
  });

});