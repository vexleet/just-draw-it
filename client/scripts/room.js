let socket = io();

window.onload = function () {
    let pathname = location.pathname.substr(1, location.pathname.length);
    let username = '';
    let isTyping = false;

    let usernameForm = document.getElementById('set-username');
    let usernameInput = document.getElementById('username');

    let playersElement = document.getElementById('players');
    let gameWrapper = document.getElementsByClassName('game-wrapper')[0];

    let chatForm = document.getElementsByClassName('chat')[0];
    let chatInput = document.getElementById('message');

    let messagesList = document.getElementById("messages");

    function setNickname(e) {
        e.preventDefault();
        username = usernameInput.value;

        usernameForm.style.display = "none";
        gameWrapper.style.display = "flex";

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

        scrollToBottom();
        chatInput.value = "";
    }

    function checkIfTyping() {
        if (chatInput.value.length >= 1 && !isTyping) {
            isTyping = true;
            socket.emit('is typing');
        }
        else if (chatInput.value.length === 0 && isTyping) {
            isTyping = false;
            socket.emit('is not typing');
        }
    }

    function scrollToBottom() {
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function updatePlayers(players) {
        while (playersElement.firstChild) {
            playersElement.removeChild(playersElement.firstChild);
        }

        const keys = Object.keys(players);

        for (const key of keys) {
            let node = document.createElement("LI");
            let textnode = document.createTextNode(players[key].username);
            node.appendChild(textnode);
            playersElement.appendChild(node);
        }
    }

    socket.on('update players', function (data) {
        updatePlayers(data.players);
    });

    socket.on('connection', function (data) {
        let node = document.createElement("LI");
        let textnode = document.createTextNode(`${data.username} has joined the room.`);
        node.appendChild(textnode);
        document.getElementById("messages").appendChild(node);

        scrollToBottom();
    });

    socket.on('disconnect', function (data) {
        let node = document.createElement("LI");
        let textnode = document.createTextNode(`${data.username} has left the room.`);
        node.appendChild(textnode);
        document.getElementById("messages").appendChild(node);

        scrollToBottom();
        updatePlayers(data.players);
    });

    socket.on('chat message', function (data) {
        let node = document.createElement("LI");
        let textnode = document.createTextNode(`${data.username}: ${data.message}`);
        node.appendChild(textnode);
        messagesList.appendChild(node);

        scrollToBottom();
    });

    socket.on('is typing', function (data) {
        let node = document.createElement("LI");
        node.classList.add(data.username);
        let textnode = document.createTextNode(`${data.username} is typing`);
        node.appendChild(textnode);
        messagesList.appendChild(node);

        scrollToBottom();
    });

    socket.on('is not typing', function (data) {
        let element = document.getElementsByClassName(data.username)[0];
        element.remove();
    });

    usernameForm.addEventListener('submit', setNickname);
    chatForm.addEventListener('submit', sendMessage);
    chatInput.addEventListener('keyup', checkIfTyping);
};
export { socket };
