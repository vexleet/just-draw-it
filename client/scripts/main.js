window.onload = function () {
    let socket = io();
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789'

    let createRoomButton = document.getElementById('createRoom');
    let joinRoomButton = document.getElementById('joinRoom');

    function createRoom() {
        let randomUrlForRoom = createRoomId();
        location.replace(randomUrlForRoom);
    }

    // function joinRoom() {
    //     location.href = randomUrlForRoom;
    // }

    function createRoomId() {
        let randomRoomId = '';

        for (let i = 0; i < 6; i++) {
            let randomNumber = Math.floor(Math.random() * chars.length);
            randomRoomId += chars[randomNumber];
        }

        return randomRoomId;
    }

    createRoomButton.addEventListener("click", createRoom);
    // joinRoomButton.addEventListener("click", joinRoom);

    socket.on('updatechat', function (msg) {
        console.log(msg);
    });
};