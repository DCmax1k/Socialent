const currentlyOnline = [];

const signon = (user) => {
    if (!currentlyOnline.includes(user)) {
        currentlyOnline.push(user);
    }
  
}

const signoff = (user) => {
    if (currentlyOnline.includes(user)) {
        currentlyOnline.splice(currentlyOnline.indexOf(user), 1);
    }
    
}

const getUsersOnline = () => {
    return currentlyOnline;
}

module.exports = {
    signon,
    signoff,
    getUsersOnline
};
