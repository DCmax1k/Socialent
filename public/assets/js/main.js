const domain = 'https://socialentapp.com';

const customAlert = document.getElementById('customAlert');
const customAlertMessage = document.querySelector('#customAlert h1');
const customAlertOk = document.querySelector('#customAlert button');

// Service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }

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
        if (e.key == 'Enter') {
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