window.onload = function () {
    let socket = io();
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let createRoomButton = document.getElementById('createRoom');
    let joinRoomButton = document.getElementById('joinRoom');

    let modal = document.getElementById("myModal");
    let span = document.getElementsByClassName("close")[0];

    function createRoom() {
        let randomUrlForRoom = createRoomId();
        location.replace(randomUrlForRoom);
    }

    function joinRoom() {
        socket.emit('join random room');
    }

    socket.on('join random room', function (data) {
        location.replace(data.room);
    });

    socket.on('no rooms available', function () {
        modal.style.display = "block";
    });

    function createRoomId() {
        let randomRoomId = '';

        for (let i = 0; i < 6; i++) {
            let randomNumber = Math.floor(Math.random() * chars.length);
            randomRoomId += chars[randomNumber];
        }

        return randomRoomId;
    }

    createRoomButton.addEventListener("click", createRoom);
    joinRoomButton.addEventListener("click", joinRoom);

    span.addEventListener("click", function () {
        modal.style.display = "none";
    })

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
};