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
}
