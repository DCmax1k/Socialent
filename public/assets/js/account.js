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

// Set return values
function fixDescription() {
  let descText = description.innerText;
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

// the textarea one
function fixBio() {
  let descText = bio.value;
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

if (editProfileCont) {
  // Edit Profile

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
      if (resJSON.status === 'successful') {
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
  window.location.href = `/post/${postID}?k=${userID}`;
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
