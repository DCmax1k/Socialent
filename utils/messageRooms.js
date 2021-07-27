const rooms = {};

const getRoomUsers = (roomID) => {
    return rooms[roomID] ?? [];
}

const joinRoom = (roomID, userID) => {
    if (rooms[roomID]) {
        rooms[roomID].push(userID);
    } else {
        rooms[roomID] = [userID];
    }
}

const leaveRoom = (roomID, userID) => {
    if (rooms[roomID]) {
        rooms[roomID] = rooms[roomID].filter((id) => id !== userID);
    } else {
        rooms[roomID] = [];
    }
}

module.exports = {
    getRoomUsers,
    joinRoom,
    leaveRoom
};