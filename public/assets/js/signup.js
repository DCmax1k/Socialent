const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const name = document.getElementById('name');
const charCount = document.getElementById('charCount');
const submit = document.getElementById('submit');
const alertCont = document.getElementById('alertCont');
const alertMsg = document.getElementById('alertMsg');
const inputs = document.querySelectorAll('#formCont input');
const passwordEye = document.getElementById('passwordEye');

// Press enter to submit
email.addEventListener('keyup', (e) => {
  if (e.key == 'Enter') {
    submit.click();
  }
});
name.addEventListener('keyup', (e) => {
  if (e.key == 'Enter') {
    submit.click();
  }
});
username.addEventListener('keyup', (e) => {
  if (e.key == 'Enter') {
    submit.click();
  }
});
password.addEventListener('keyup', (e) => {
  if (e.key == 'Enter') {
    submit.click();
  }
});

// Username count
username.addEventListener('input', () => {
  if (username.value.length > 15) {
    username.value = username.value.slice(0, 15);
  }
  charCount.innerText = `${15 - username.value.length} characters left`;
});

// Password View
let passwordView = false;
passwordEye.addEventListener('click', () => {
  if (passwordView === false) {
    password.type = 'text';
    passwordView = true;
  } else {
    password.type = 'password';
    passwordView = false;
  }
});

// Gets rid of error msg on click of input
inputs.forEach((input) => {
  input.addEventListener('click', () => {
    alertCont.classList.remove('active');
  });
});

// Submit
submit.addEventListener('click', async () => {
  try {
    if (!email.value || !name.value || !username.value || !password.value) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Please fill out all fields!';
      alertCont.classList.add('active');
      return;
    }
    if (!email.value.includes('@') && !email.value.includes('.')) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Please fill out a valid email!';
      alertCont.classList.add('active');
      return;
    }
    if (username.value.length > 15) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Username must be 15 characters or less!';
      alertCont.classList.add('active');
      return;
    }
    if (username.value.includes(' ')) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Username must not include spaces!';
      alertCont.classList.add('active');
      return;
    }
    if (password.value.length < 8) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Password must be at lease 8 characters long!';
      alertCont.classList.add('active');
      return;
    }
    submit.innerText = 'Loading...';
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        name: name.value,
        username: username.value,
        password: password.value,
        device: window.navigator.userAgent,
      }),
    });
    const resJSON = await response.json();
    if (resJSON.response === 'username taken') {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Username taken!';
      alertCont.classList.add('active');
      submit.innerText = 'Submit';
    } else if (resJSON.response === 'account created') {
      window.location.href = `/home`;
    }
  } catch (err) {
    console.log(err);
  }
});
