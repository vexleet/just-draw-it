let socket = io();

let pathname = location.pathname.substr(1, location.pathname.length);
let username = '';

let gameIsInProgress = false;

let orderOfPlayers = [];
let playersWhoAlreadyPainted = [];
let currentPlayer = '';

let timer;
let roundSeconds = 10;
let timerElement = document.getElementById('timer');

let usernameForm = document.getElementById('set-username');
let usernameInput = document.getElementById('username');

let playersElement = document.getElementById('players');
let gameWrapper = document.getElementsByClassName('game-wrapper')[0];

let chatForm = document.getElementsByClassName('chat')[0];
let chatInput = document.getElementById('message');

let messagesList = document.getElementById("messages");

let modal = document.getElementById("myModal");

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

function scrollToBottom(e) {
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

    checkIfEnoughPlayers(players);
}

function checkIfEnoughPlayers(players) {
    let numberOfPlayers = Object.keys(players).length;

    if (numberOfPlayers === 1) {
        gameIsInProgress = false;
        modal.style.display = "block";
    }
    else if (numberOfPlayers === 2) {
        modal.style.display = "none";
        socket.emit('start game');
        gameIsInProgress = true;
    }
    else {
        playerJoinedInTheMiddleOfTheGame();
    }
}

function playerJoinedInTheMiddleOfTheGame() {
    if (currentPlayer === '') {
        socket.emit('player joined in the middle of the game');

        socket.on('player joined in the middle of the game', function (data) {
            roundSeconds = data.timer - 1;
            orderOfPlayers = data.orderOfPlayers;
            currentPlayer = data.currentPlayer;

            gameIsInProgress = true;

            let indexOfCurrentPlayer = orderOfPlayers.indexOf(currentPlayer);
            orderOfPlayers.splice(indexOfCurrentPlayer, 1);

            playersWhoAlreadyPainted.push(currentPlayer);

            timer = setInterval(function () {
                roundSeconds -= 1

                timerElement.innerHTML = roundSeconds;

                if (roundSeconds <= 0) {
                    socket.emit('start round');

                    roundSeconds = 10;

                    if (orderOfPlayers.length === 0) {
                        orderOfPlayers = playersWhoAlreadyPainted;
                        playersWhoAlreadyPainted = [];
                    }

                    currentPlayer = orderOfPlayers.shift();
                    playersWhoAlreadyPainted.push(currentPlayer);
                    console.log(orderOfPlayers, false);

                    let node = document.createElement("LI");
                    let textnode = document.createTextNode(`${currentPlayer} is drawing now.`);
                    node.appendChild(textnode);
                    messagesList.appendChild(node);

                    scrollToBottom();
                }
            }, 1000);
        });
    }
}

function startGame() {
    timer = setInterval(function () {
        socket.emit('timer test', roundSeconds);

        roundSeconds -= 1

        timerElement.innerHTML = roundSeconds;

        if (roundSeconds <= 0) {
            socket.emit('start round');

            if (orderOfPlayers.length === 0) {
                orderOfPlayers = playersWhoAlreadyPainted;
                playersWhoAlreadyPainted = [];
            }

            roundSeconds = 10;

            currentPlayer = orderOfPlayers.shift();
            playersWhoAlreadyPainted.push(currentPlayer);
            console.log(playersWhoAlreadyPainted);

            socket.emit('change state of room', { currentPlayer, orderOfPlayers });

            let node = document.createElement("LI");
            let textnode = document.createTextNode(`${currentPlayer} is drawing now.`);
            node.appendChild(textnode);
            messagesList.appendChild(node);

            scrollToBottom();
        }
    }, 1000);

    currentPlayer = orderOfPlayers.shift();
    playersWhoAlreadyPainted.push(currentPlayer);

    socket.emit('change state of room', { currentPlayer, orderOfPlayers });

    let node = document.createElement("LI");
    let textnode = document.createTextNode(`${currentPlayer} is drawing now.`);
    node.appendChild(textnode);
    messagesList.appendChild(node);

    scrollToBottom();
}

socket.on('start game', function (data) {
    orderOfPlayers = data.order;

    startGame();
});

socket.on('update players', function (data) {
    updatePlayers(data.players);
});

socket.on('connection', function (data) {
    let node = document.createElement("LI");
    let textnode = document.createTextNode(`${data.username} has joined the room.`);
    node.appendChild(textnode);
    document.getElementById("messages").appendChild(node);

    if (gameIsInProgress) {
        orderOfPlayers.push(data.username);
        console.log(orderOfPlayers);
        socket.emit('change state of room', { currentPlayer, orderOfPlayers });
    }

    scrollToBottom();
});

socket.on('disconnect', function (data) {
    let node = document.createElement("LI");
    let textnode = document.createTextNode(`${data.username} has left the room.`);
    node.appendChild(textnode);
    document.getElementById("messages").appendChild(node);

    scrollToBottom();
});

socket.on('chat message', function (data) {
    let node = document.createElement("LI");
    let textnode = document.createTextNode(`${data.username}: ${data.message}`);
    node.appendChild(textnode);
    messagesList.appendChild(node);

    scrollToBottom();
});

usernameForm.addEventListener('submit', setNickname);
chatForm.addEventListener('submit', sendMessage);

export { socket };
