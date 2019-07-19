window.onload = function () {
    let socket = io();

    let pathname = location.pathname.substr(1, location.pathname.length);
    let username = '';

    let usernameForm = document.getElementById('set-username');
    let usernameInput = document.getElementById('username');

    let chatWrapper = document.getElementsByClassName('chat-wrapper')[0];

    let chatForm = document.getElementsByClassName('chat')[0];
    let chatInput = document.getElementById('message');

    let messagesList = document.getElementById("messages");

    function setNickname(e) {
        e.preventDefault();
        username = usernameInput.value;

        usernameForm.style.display = "none";
        chatWrapper.style.display = "block";

        socket.emit('join room', { idOfRoom: pathname, username });
    }

    function sendMessage(e) {
        e.preventDefault();

        let message = chatInput.value;

        if (message.length >= 1) {
            let node = document.createElement("LI");
            let textnode = document.createTextNode(`${username}: ${message}`);
            node.appendChild(textnode);
            messagesList.appendChild(node);

            socket.emit('chat message', message);
        }

        chatInput.value = "";
    }

    function checkIfTyping() {
        if (chatInput.value >= 1) {
            socket.emit('is typing');
        }
        else {
            socket.emit('is not typing');
        }
    }

    // socket.on('connection', function (nickname, users) {
    //     let node = document.createElement("LI");
    //     let textnode = document.createTextNode(`${nickname} has joined the room.`);
    //     node.appendChild(textnode);
    //     document.getElementById("messages").appendChild(node);
    // });

    // socket.on('disconnect', function (nickname) {
    //     let node = document.createElement("LI");
    //     let textnode = document.createTextNode(`${nickname} has left the room.`);
    //     node.appendChild(textnode);
    //     document.getElementById("messages").appendChild(node);
    // });

    socket.on('chat message', function (data) {
        let node = document.createElement("LI");
        let textnode = document.createTextNode(`${data.username}: ${data.message}`);
        node.appendChild(textnode);
        messagesList.appendChild(node);
    });

    // socket.on('is typing', function (message) {
    //     let node = document.createElement("LI");
    //     let textnode = document.createTextNode(message);
    //     node.appendChild(textnode);
    //     messagesList.appendChild(node);

    //     socket.emit('chat message', message);
    // }

    usernameForm.addEventListener('submit', setNickname);
    chatForm.addEventListener('submit', sendMessage);
    chatInput.addEventListener('keydown', checkIfTyping);
};