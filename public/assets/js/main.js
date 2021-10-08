const domain = 'https://socialentapp.com';

const customAlert = document.getElementById('customAlert');
const customAlertMessage = document.querySelector('#customAlert h1');
const customAlertOk = document.querySelector('#customAlert button');

// Service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}

const subscribe = async () => {
    let errorMessage = '';
    const sw = await navigator.serviceWorker.ready;
    const push = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BMYNc0LpoUTcG2Qwg9tHgXDDrPGqYovkmEKDcHeJ_CQZA5X7P_UE5jZrYBsEDK_JgrMMCvE0RhjDvQPzKN-JPI0',
    }).catch(e => {errorMessage = e;});
    if (errorMessage) return 'denied';
    // Subscribe to push
    const response = await fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sub: push,
        }),
    });
    const data = await response.json();
    if (data.success) return 'success'; 
    else return 'error';
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

// Custom install PWA prompt
let deferredPrompt;

const installApp = () => {
    hideInstallPromotion();
    deferredPrompt.prompt();
    const { outcome } = deferredPrompt.userChoice;
    console.log(outcome);
    deferredPrompt = null;
}

const showInstallPromotion = () => {
    const node = document.createElement('div');
    node.id = 'installPromotion';
    node.classList.add('swipe-up');
    node.classList.add('b-back');
    node.addEventListener('click', installApp);
    node.style = `
        position: fixed;
        bottom: -40px;
        left: 10px;
        width: fit-content;
        height: 30px;
        z-index: 9999;
        border-radius: 9999px;
        padding: 6px 10px;
        font-family: sans-serif;
        font-size: 15px;
        color: white;
        cursor: pointer;
    `;
    node.innerHTML = `
        Install App
    `;
    document.body.appendChild(node);
}

hideInstallPromotion = () => {
    const node = document.getElementById('installPromotion');
    node.style = '-100px';
    setTimeout(() => {
        node.remove();
    }, 300);
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});
