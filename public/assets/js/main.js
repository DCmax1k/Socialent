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

// REDIRECT to SECRURE site
if (location.protocol === 'http:' && location.host.includes('socialent')) {
    location.href = 'https://socialent-app.herokuapp.com';
}