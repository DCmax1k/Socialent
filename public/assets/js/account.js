const accountUsername = window.location.href.split('/')[4].split('?')[0];
const navBarProfilePic = document.querySelector('#profileBtn > img');
const loginBtn = document.getElementById('loginBtn');
const changeNameInput = document.getElementById('changeNameInput');
const changeUserInput = document.getElementById('changeUserInput');
const changeEmailInput = document.getElementById('changeEmailInput');
const selectName = document.getElementById('selectName');
const selectEmail = document.getElementById('selectEmail');
const selectUser = document.getElementById('selectUser');
const submitName = document.getElementById('submitName');
const submitEmail = document.getElementById('submitEmail');
const submitUser = document.getElementById('submitUser');
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
const lastOnlineDiv = document.getElementById('lastOnlineDiv');
const openTokens = document.querySelector('#editProfileCont > .heading > h4');


followers.addEventListener('click', () => {
  showFollowers.focus();
  
});
following.addEventListener('click', () => {
  showFollowing.focus();
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
  changeImgFile.addEventListener('change', async () => {
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
            const MAX_SIDE_LENGTH = 1080;
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

            // Convert dataURI to blob
            const byteString = atob(imgURL.split(',')[1]);

            // separate out the mime component
            const mimeString = imgURL.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            const ab = new ArrayBuffer(byteString.length);

            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            // give blob file name
            const blob =  new Blob([ab], {
              type: mimeString,
            });

            // Send url to DB
            let formData = new FormData()
            formData.append('file', blob);
            formData.append('filename', file.name);

            const options = {
                method: 'POST',

                body: formData,
            }
            const res = await fetch('/account/changeimg', options);
            const newResJSON = await res.json();
    
            if (newResJSON.status === 'success') {
              imgPlace.classList.remove('active');
              changeImgText.innerText = 'Change image';
            }
          }
          
        }

        // changeImgText.innerText = 'Loading...';

        // let formData = new FormData()
        // formData.append('file', file)

        // const options = {
        //     method: 'POST',

        //     body: formData,
        // }
        // const res = await fetch('/account/changeimg', options);
        // const resJSON = await res.json();
        // if (resJSON.status === 'success') {
        //   profileImg.src = resJSON.imgURL;
        //   navBarProfilePic.src = resJSON.imgURL;
        //   changeImgText.innerText = 'Change image';
        // }
      }
    } catch(err) {
      console.error(err);
    }
    
  })

  // Open tokens sidebar
  openTokens.addEventListener('click', () => {
    sidebar.classList.add('active');
  });

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
    if (e.key == 'Enter') {
      submitChangePassword.click();
    }
  });
  newPassword.addEventListener('keyup', (e) => {
    if (e.key == 'Enter') {
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
  let userChanged = false;
  changeUserInput.addEventListener('input', () => {
    selectUser.style.display = 'none';
    submitUser.style.display = 'inline-block';
    userChanged = true;
  });

  let emailChanged = false;
  changeEmailInput.addEventListener('input', () => {
    selectEmail.style.display = 'none';
    submitEmail.style.display = 'inline-block';
    emailChanged = true;
  });

  // Event listener of keyup on ENTER key
  changeNameInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter') {
      if (nameChanged) {
        submitName.click();
      }
    }
  });

  changeUserInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter') {
      if (userChanged) {
        submitUser.click();
      }
    }
  });

  changeEmailInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter' ) {
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
      if ((resJSON.status == 'success')) {
        submitName.style.color = 'green';
      }
    } else {
      submitName.style.color = 'red';
    }
  });
    // Change Username
    submitUser.addEventListener('click', async () => {
      if (changeUserInput.value) {
        const userValue = changeUserInput.value;
        changeUserInput.value = 'Loading...';
        const response = await fetch('/account/editprofile/changeuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID,
            username: userValue,
            device: window.navigator.userAgent,
          }),
        });
        const resJSON = await response.json();
        changeUserInput.value = userValue;
        if ((resJSON.response == 'account created')) {
          submitUser.style.color = 'green';
          window.location.href = `/account/${resJSON.username}`
        } else if (resJSON.response == 'username taken') {
          submitUser.style.color = 'red';
          myAlert('Username taken!');
        } else {
          submitUser.style.color = 'red';
          myalert('An error as occured');
        }
      } else {
        submitUser.style.color = 'red';
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
  window.location.href = `/post/${postID}`;
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

// Load videos
window.addEventListener('load', () => {
  postVideos.forEach(postVideo => {
    postVideo.load();
  });

});