// const socket = io();
// Join personal room to listen for warns to user
// socket.emit('joinUserRoom', { userID });

const openControls = document.querySelectorAll('.openControls');
const userControls = document.querySelectorAll('.userControls');
const closeUserControls = document.querySelectorAll('.closeUserControls');
const deleteUsers = document.querySelectorAll('.deleteUser');
const changeUserPassss = document.querySelectorAll('.changeUserPass');
const warnInputs = document.querySelectorAll('.warnInput');
const warningsLengthNumbers = document.querySelectorAll('.warningsLengthNumber');
const warningsActiveNumbers = document.querySelectorAll('.warningsActiveNumber');
const promoteBtns = document.querySelectorAll('.promoteBtn');
const seeRankFromUsers = document.querySelectorAll('.seeRankFromUser');
const prefixInputs = document.querySelectorAll('.prefixInput');
const prefixTexts = document.querySelectorAll('.prefixText');
const prefixs = document.querySelectorAll('.prefix');
const userContss = document.querySelectorAll('.userCont');
const searchInput = document.getElementById('searchInput');
const verifiedBtns = document.querySelectorAll('.verifiedCont');
const addonsBtns = document.querySelectorAll('.addon');
const actualNumberOnline = document.getElementById('actualNumberOnline');

socket.on('currentlyOnline', ({usersLength}) => {
    actualNumberOnline.innerText = usersLength;
})

// Verify user
verifiedBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const user = btn.getAttribute('data-user-id');
        const verifyOrUnverify = btn.classList.contains('active') ? 'unverify' : 'verify';
        btn.classList.toggle('active');
        const response = await fetch('/admin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: user,
                verifyOrUnverify,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status !== 'success') {
            myAlert(resJSON.message);
        }
    });
});

// Grant addons
addonsBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const user = btn.getAttribute('data-user-id');
        const granted = btn.classList.contains('active') ? true : false;
        btn.classList.toggle('active');
        const response = await fetch('/admin/grantaddons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: user,
                granted,
            }),
        });
        const resJSON = await response.json();
        if (resJSON.status !== 'success') {
            myAlert(resJSON.message);
        }
    });
});

// Search user
searchInput.addEventListener('keyup', (e) => {
    userContss.forEach(userCont => {
        if (e.target.value) {
            if (userCont.childNodes[3].childNodes[3].childNodes[1].innerText.toLowerCase().includes(e.target.value.toLowerCase()) || userCont.childNodes[3].childNodes[3].childNodes[3].innerText.toLowerCase().includes(e.target.value.toLowerCase())) {
                userCont.style.display = 'block';
            } else {
                userCont.style.display = 'none';
            }
        } else {
            userCont.style.display = 'block';
        }
    })
});

// Set users prefix
prefixInputs.forEach(prefixInput => {
    const dataID = prefixInput.getAttribute('data-user-id');
    prefixInput.addEventListener('keyup', (e) => {
        if (e.key == 'Enter') {
            const newPrefix = e.target.value;
            sendPrefix(dataID, newPrefix);
            const text = Array.from(prefixTexts).find(prefixText => prefixText.getAttribute('data-user-id') == dataID);
            if (newPrefix) {
                text.innerText = newPrefix;
            } else {
                text.innerText = 'None';
            }
            prefixs.forEach(prefix => {
                if (prefix.getAttribute('data-user-id') == dataID) {
                    if (newPrefix) {
                        prefix.innerText = `[${newPrefix}]`;
                    } else {
                        prefix.innerText = '';
                    }
                }
            });
        };
    });
});
const sendPrefix = async (dataID, newPrefix) => {
    const response = await fetch('/admin/setprefix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: dataID,
            newPrefix,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status != 'success') {
        alert('An error as occured!');
    };
};

// Promote/Demote user
promoteBtns.forEach(promoteBtn => {
    promoteBtn.addEventListener('click', () => {
        const dataID = promoteBtn.getAttribute('data-user-id');
        const dataUsername = promoteBtn.getAttribute('data-user-username');
        if (promoteBtn.classList.contains('promo')) {
            if (promoteBtn.classList.contains('na')) return alert(`You do not have permission to promote ${dataUsername}'s account!`);
            promoteUser(dataID);
            promoteBtn.classList.add('demo');
            promoteBtn.classList.remove('promo');
            promoteBtn.innerText = 'Demote';
            Array.from(userContss).find(userCont => userCont.getAttribute('data-user-id') == dataID).classList.add('adminBG');
            Array.from(seeRankFromUsers).find(seeRankFromUser => seeRankFromUser.getAttribute('data-user-id') == dataID).innerText = 'Admin';
            const preInput = Array.from(prefixInputs).find(prefixInput => prefixInput.getAttribute('data-user-id') == dataID);
            if (preInput.value == '') preInput.value = 'Admin';
            const pre = Array.from(prefixs).find(prefix => prefix.getAttribute('data-user-id') == dataID);
            pre.classList.add('admin');
            if (!pre.innerText) pre.innerText = '[Admin]';
        } else if (promoteBtn.classList.contains('demo')) {
            if (promoteBtn.classList.contains('na')) return alert(`You do not have permission to demote ${dataUsername}'s account!`);
            demoteUser(dataID);
            promoteBtn.classList.add('promo');
            promoteBtn.classList.remove('demo');
            promoteBtn.innerText = 'Promote';
            Array.from(userContss).find(userCont => userCont.getAttribute('data-user-id') == dataID).classList.remove('adminBG');
            Array.from(seeRankFromUsers).find(seeRankFromUser => seeRankFromUser.getAttribute('data-user-id') == dataID).innerText = 'User';
            const preInput = Array.from(prefixInputs).find(prefixInput => prefixInput.getAttribute('data-user-id') == dataID);
            if (preInput.value == 'Admin') preInput.value = '';
            const pre = Array.from(prefixs).find(prefix => prefix.getAttribute('data-user-id') == dataID);
            pre.classList.remove('admin');
            if (pre.innerText == '[Admin]') pre.innerText = '';
        }
    });
});
const promoteUser = async dataID => {
    const response = await fetch('/admin/promo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: dataID,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status != 'success') {
        alert('An error as occured!');
    }
};
const demoteUser = async dataID => {
    const response = await fetch('/admin/demo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: dataID,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status != 'success') {
        alert('An error as occured!');
    }
};

// Warn user
warnInputs.forEach(warnInput => {
    const dataID = warnInput.getAttribute('data-user-id');
    warnInput.addEventListener('keyup', (e) => {
        if (e.key == 'Enter') {
            const warning = e.target.value;
            sendWarning(dataID, warning);

            e.target.value = '';
            warningsLengthNumbers.forEach(warningsLengthNumber => {
                if (warningsLengthNumber.getAttribute('data-user-id') == dataID) {
                    warningsLengthNumber.innerText = parseInt(warningsLengthNumber.innerText) + 1;
                }
            });
            warningsActiveNumbers.forEach(warningsActiveNumber => {
                if (warningsActiveNumber.getAttribute('data-user-id') == dataID) {
                    warningsActiveNumber.innerText = parseInt(warningsActiveNumber.innerText) + 1;
                }
            });
        }
    });
});
const sendWarning = async (dataID, warning) => {
    socket.emit('warnUser', { adminID: userID, userID: dataID, warning,});
}

// Delete User
deleteUsers.forEach(deleteUser => {
    const dataID = deleteUser.getAttribute('data-user-id');
    const dataUsername = deleteUser.getAttribute('data-user-username');
    deleteUser.addEventListener('click', async () => {
        if (!deleteUser.classList.contains('na')) {
            const confirmation = confirm(`Are you sure you would like to delete ${dataUsername}'s account?`)
            if (confirmation) {
                const response = await fetch('/admin/deleteuser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: dataID,
                    }),
                });
            }
        } else {
            alert('You are not allowed to delete this account!');
        }
    });
});

// Change users password
changeUserPassss.forEach(changeUserPass => {
    const dataID = changeUserPass.getAttribute('data-user-id');
    const dataUsername = changeUserPass.getAttribute('data-user-username');
    changeUserPass.addEventListener('click', async () => {
        if (!changeUserPass.classList.contains('na')) {
            const newPass = prompt(`Enter the new password for ${dataUsername}'s account:`);
            if (newPass) {
                const response = await fetch('/admin/changeuserpass', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: dataID,
                        newPass,
                    }),
                });
                const resJSON = await response.json();
                if (resJSON.status != 'success') {
                    alert('An error as occured!');
                } else if (resJSON.status == 'success') {
                    alert('Password successfully changed to - ' + newPass + ' -');
                }

            }

        }
    })
})

// Open/close controls
openControls.forEach(openControl => {
    const dataID = openControl.getAttribute('data-user-id');
    openControl.addEventListener('click', () => {
        userControls.forEach(userControl => {
            if (userControl.getAttribute('data-user-id') == dataID) {
                userControl.classList.toggle('active');
            }
        });
    });
});
closeUserControls.forEach(closeControl => {
    const dataID = closeControl.getAttribute('data-user-id');
    closeControl.addEventListener('click', () => {
        userControls.forEach(userControl => {
            if (userControl.getAttribute('data-user-id') == dataID) {
                userControl.classList.toggle('active');
            }
        });
    });
});

