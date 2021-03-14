const email = document.getElementById('email');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const codeCont = document.getElementById('codeCont');
const code = document.getElementById('code');
const submitCodeBtn = document.getElementById('submitCodeBtn');
const password = document.getElementById('password');
const passwordCont = document.getElementById('passwordCont');
const confirmPassword = document.getElementById('confirmPassword');
const submitPasswordBtn = document.getElementById('submitPasswordBtn');

let acceptedEmail;
let digitCode;

email.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        sendEmail(e.target.value)
    }
});
sendCodeBtn.addEventListener('click', () => {
    sendEmail(email.value);
});
const sendEmail = async (value) => {
    try {
        sendCodeBtn.innerText = 'Loading...';
        const response = await fetch('/forgotpassword/sendemail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: value,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            code.select();
            acceptedEmail = value;
            sendCodeBtn.innerText = 'Email Sent! - Resend';
            codeCont.style.display = 'flex';
            submitCodeBtn.style.display = 'block';
        } else {
            email.blur();
            myAlert(resJSON.status);
            sendCodeBtn.innerText = 'Send Code!';
        }
    } catch(err) {
        console.error(err);
    }
}

code.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        submitCode(e.target.value);
    }
});
submitCodeBtn.addEventListener('click', () => {
    submitCode(code.value);
})
const submitCode = async (value) => {
    try {
        submitCodeBtn.innerText = 'Verifying...';
        const response = await fetch('/forgotpassword/verifycode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: acceptedEmail,
                code: value,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            code.blur();
            digitCode = value;
            submitCodeBtn.innerText = 'Successfully Verified!';
            passwordCont.style.display = 'flex';
            password.style.display = 'block';
            confirmPassword.style.display = 'block';
            submitPasswordBtn.style.display = 'block';
        } else {
            code.blur();
            myAlert(resJSON.status);
            submitCodeBtn.innerText = 'Submit';
        }
    } catch(err) {
        console.error(err);
    }
}
password.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        if (e.target.value.length < 8) {
            myAlert('Password must be at least 8 characters long!');
        } else {
           confirmPassword.select(); 
        }
    }
});
confirmPassword.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        if (password.value === confirmPassword.value) {
            resetPassword(password.value, confirmPassword.value);
        } else {
            confirmPassword.blur();
            setTimeout(() => {myAlert('Passwords must match!')}, 1)
        }
    }
});
submitPasswordBtn.addEventListener('click', () => {
    if (password.value === confirmPassword.value) {
        resetPassword(password.value, confirmPassword.value);
    } else {
        myAlert('Passwords must match!');
    }
})
const resetPassword = async (pass, conPass) => {
    try {
        submitPasswordBtn.innerText = 'Loading...';
        const response = await fetch('/forgotpassword/resetpassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: acceptedEmail,
                code: digitCode,
                password: pass,
                confirmPassword: conPass,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status === 'success') {
            password.blur();
            confirmPassword.blur();
            submitPasswordBtn.innerText = 'Successfully changed password!';
        } else {
            password.blur();
            confirmPassword.blur();
            myAlert(resJSON.status);
            submitPasswordBtn.innerText = 'Submit';

        }
    } catch(err) {
        console.error(err);
    }
}

