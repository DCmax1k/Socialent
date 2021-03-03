const username = document.getElementById('username');
const password = document.getElementById('password');
const submit = document.getElementById('submit');
const inputs = document.querySelectorAll('#formCont input');
const passwordEye = document.getElementById('passwordEye');
const alertCont = document.getElementById('alertCont');
const alertMsg = document.getElementById('alertMsg');

// Press enter to submit
username.addEventListener('keyup', (e) => {
  if (e.keyCode == 13 || e.which == 13) {
    submit.click();
  }
});
password.addEventListener('keyup', (e) => {
  if (e.keyCode == 13 || e.which == 13) {
    submit.click();
  }
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

// Fetch Login request
submit.addEventListener('click', async () => {
  try {
    if (!username.value || !password.value) {
      alertMsg.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Please fill out all fields!';
      alertCont.classList.add('active');
    } else {
      submit.innerText = 'Loading...';
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
          device: window.navigator.userAgent,
        }),
      });
      const resJSON = await response.json();
      console.log(resJSON)
      submit.innerText = 'Submit';
      if (resJSON.response === 'wrong username') {
        alertMsg.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> No user with that username!';
        alertCont.classList.add('active');
        password.value = '';
      } else if (resJSON.response === 'wrong password') {
        alertMsg.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Incorrect password!';
        alertCont.classList.add('active');
        password.value = '';
      } else if (resJSON.response === 'logged in') {
        window.location.href = `/home?k=${resJSON.id}`;
        console.log('logged in');
      }
    }
  } catch (err) {
    console.error(err);
  }
});
