const domain = 'https://socialent-app.herokuapp.com';

const customAlert = document.getElementById('customAlert')
const customAlertMessage = document.querySelector('#customAlert h1');
const customAlertOk = document.querySelector('#customAlert button');

// Custom alert()
const myAlert = (message) => {
    customAlertMessage.innerText = message;
    customAlert.classList.add('active');
    setTimeout(() => {
        customAlert.childNodes[1].classList.add('active');
    }, 1);
    function removeAlert() {
        customAlert.classList.remove('active'); 
    }
    customAlertOk.addEventListener('click', removeAlert);
    document.addEventListener('keyup', (e) => {
        if (e.keyCode == 13) {
            removeAlert();
        }
    })
}

// Lookup username from ID
const lookupUsername = async (receiverID) => {
    const response = await fetch('/messages/lookupusername', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            receiverID,
        })
    });
    const resJSON = await response.json();
    return resJSON;
}

// REDIRECT to NEW DOMAIN
if (location.host.includes('heroku')) {
    location.host = 'www.socialentapp.com';
}

// Change all @'s to links
// document.body.innerHTML = document.body.innerHTML.replace(/\b@*\b/g, `<a href="/account/USERNAME?k=${userID}" >@USERNAME</a>`);