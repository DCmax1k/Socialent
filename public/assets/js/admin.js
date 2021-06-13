const openControls = document.querySelectorAll('.openControls');
const userControls = document.querySelectorAll('.userControls');
const closeUserControls = document.querySelectorAll('.closeUserControls');
const deleteUsers = document.querySelectorAll('.deleteUser');
const warnInputs = document.querySelectorAll('.warnInput');
const warningsLengthNumbers = document.querySelectorAll('.warningsLengthNumber');
const warningsActiveNumbers = document.querySelectorAll('.warningsActiveNumber');
const promoteBtns = document.querySelectorAll('.promoteBtn');
const seeRankFromUsers = document.querySelectorAll('.seeRankFromUser');
const prefixInputs = document.querySelectorAll('.prefixInput');
const prefixTexts = document.querySelectorAll('.prefixText');
const prefixs = document.querySelectorAll('.prefix');
const userContss = document.querySelectorAll('.userCont');


// Set users prefix
prefixInputs.forEach(prefixInput => {
    const dataID = prefixInput.getAttribute('data-user-id');
    prefixInput.addEventListener('keyup', (e) => {
        if (e.key == 'Enter') {
            const newPrefix = e.target.value;
            sendPrefix(dataID, newPrefix);
            prefixTexts.forEach(prefixText => {
                if (prefixText.getAttribute('data-user-id') == dataID) {
                    if (newPrefix) {
                        prefixText.innerText = newPrefix;
                    } else {
                        prefixText.innerText = 'None';
                    }
                    
                };
            });
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
            userContss.forEach(userCont => {
                if (userCont.getAttribute('data-user-id') == dataID) {
                    userCont.classList.add('adminBG');
                };
            });
            seeRankFromUsers.forEach(seeRankFromUser => {
                if (seeRankFromUser.getAttribute('data-user-id') == dataID) {
                    seeRankFromUser.innerText = 'Admin';
                }
            });
            prefixInputs.forEach(prefixInput => {
                if (prefixInput.getAttribute('data-user-id') == dataID  && prefixInput.value == '') {
                    prefixInput.value = 'Admin';
                }
            });
            prefixs.forEach(prefix => {
                if (prefix.getAttribute('data-user-id') == dataID) {
                    prefix.classList.add('admin');
                    if (!prefix.innerText) {
                        prefix.innerText = `[Admin]`;
                    }
                }
            });
        } else if (promoteBtn.classList.contains('demo')) {
            if (promoteBtn.classList.contains('na')) return alert(`You do not have permission to demote ${dataUsername}'s account!`);
            demoteUser(dataID);
            promoteBtn.classList.add('promo');
            promoteBtn.classList.remove('demo');
            promoteBtn.innerText = 'Promote';
            userContss.forEach(userCont => {
                if (userCont.getAttribute('data-user-id') == dataID) {
                    userCont.classList.remove('adminBG');
                };
            });
            seeRankFromUsers.forEach(seeRankFromUser => {
                if (seeRankFromUser.getAttribute('data-user-id') == dataID) {
                    seeRankFromUser.innerText = 'User';
                }
            });
            prefixInputs.forEach(prefixInput => {
                if (prefixInput.getAttribute('data-user-id') == dataID  && prefixInput.value == 'Admin') {
                    prefixInput.value = '';
                }
            });
            prefixs.forEach(prefix => {
                if (prefix.getAttribute('data-user-id') == dataID) {
                    prefix.classList.remove('admin');
                    if (prefix.innerText == '[Admin]') {
                        prefix.innerText = ``;
                    }
                }
            });
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
    const response = await fetch('/admin/warn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: dataID,
            warning,
        }),
    });
    const resJSON = await response.json();
    if (resJSON.status != 'success') {
        alert('An error as occured!');
    }
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

