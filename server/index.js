let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let path = require('path');

app.use('/client', express.static(path.join(__dirname, '../client')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/:roomId', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/rooms.html'));
});

let usernames = {};
let rooms = [];

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => (res[key] = obj[key], res), {});

Array.prototype.findIndexOfRoom = (socket) => {
    let indexOfRoom = -1;

    for (let i = 0; i < rooms.length; i++) {
        let room = rooms[i];

        if (room['room'] === socket.room) {
            indexOfRoom = i;
            break;
        }
    }

    return indexOfRoom;
};

io.on('connection', function (socket) {
    socket.on('join room', (data => {
        socket.join(data.idOfRoom, function () {
            socket.username = data.username;
            socket.room = data.idOfRoom;
            usernames[socket.id] = { username: data.username, room: data.idOfRoom };

            let indexOfRoom = rooms.findIndexOfRoom(socket);

            if (indexOfRoom === -1) {
                rooms.push({
                    room: data.idOfRoom, players: 1, timer: 10,
                    currentPlayer: '', orderOfPlayers: [], playersWhoAlreadyPainted: [],
                });
            }
            else {
                rooms[indexOfRoom]['players'] += 1;
            }

            socket.to(data.idOfRoom).emit('connection', { username: socket.username });

            io.in(socket.room)
                .emit('update players', {
                    players: Object.filter(usernames, username => username.room === socket.room)
                });
        });
    }));

    socket.on('check username', function (data) {
        let usersInSameRoom = Object.filter(usernames, username => username.room === data.idOfRoom);
        let keys = Object.keys(usersInSameRoom);

        let isTaken = false;

        if (keys.length > 0) {
            for (let key of keys) {
                if (usersInSameRoom[key]['username'] === data.username) {
                    isTaken = true;
                    break;
                }
            }

            socket.emit('check username', isTaken);
        }
        else {
            socket.emit('check username', isTaken);
        }
    });

    socket.on('join random room', function () {
        if (rooms.length === 0) {
            socket.emit('no rooms available');
            return;
        }

        let randomRoomIndex = Math.floor(Math.random() * rooms.length);
        let randomRoom = rooms[randomRoomIndex]['room'];

        socket.emit('join random room', { room: randomRoom });
    });

    socket.on('start game', function () {
        let allPlayers = [];
        let orderOfPlayers = [];

        let usersInSameRoom = Object.filter(usernames, username => username.room === socket.room);

        const keys = Object.keys(usersInSameRoom);

        for (const key of keys) {
            allPlayers.push(usersInSameRoom[key].username);
        }

        for (let i = 0; i < allPlayers.length; i++) {
            if (orderOfPlayers.indexOf(allPlayers[i]) === -1) {
                orderOfPlayers.push(allPlayers[i]);
            }
        }

        socket.to(socket.room).emit('start game', { order: orderOfPlayers });
        socket.to(socket.room).emit('start game drawing', { order: orderOfPlayers });
    });

    socket.on('timer test', function (timer) {
        let indexOfRoom = rooms.findIndexOfRoom(socket);

        if (rooms[indexOfRoom]['timer'] !== timer) {
            rooms[indexOfRoom]['timer'] = timer;
        }
    });

    socket.on('start round', function () {
        socket.emit('start round');
    });

    socket.on('get socket name', function () {
        socket.emit('receive socket name', socket.username);
    });

    socket.on('change state of room', function (data) {
        let indexOfRoom = rooms.findIndexOfRoom(socket);

        rooms[indexOfRoom]['currentPlayer'] = data.currentPlayer;
        rooms[indexOfRoom]['orderOfPlayers'] = data.orderOfPlayers;
        rooms[indexOfRoom]['playersWhoAlreadyPainted'] = data.playersWhoAlreadyPainted;
    });

    socket.on('player joined in the middle of the game', function () {
        let indexOfRoom = rooms.findIndexOfRoom(socket);

        let currentPlayer = rooms[indexOfRoom]['currentPlayer'];
        let timer = rooms[indexOfRoom]['timer'];
        let orderOfPlayers = rooms[indexOfRoom]['orderOfPlayers'];
        let playersWhoAlreadyPainted = rooms[indexOfRoom]['playersWhoAlreadyPainted'];

        socket.emit('player joined in the middle of the game',
            { currentPlayer, timer, orderOfPlayers, playersWhoAlreadyPainted, username: socket.username });
    });

    socket.on('get current time', function () {
        let indexOfRoom = rooms.findIndexOfRoom(socket);

        let currentTime = rooms[indexOfRoom]['timer'];

        socket.emit('get current time', currentTime);
    });

    socket.on('disconnect', function () {
        let indexOfRoom = rooms.findIndexOfRoom(socket);

        if (indexOfRoom >= 0) {
            rooms[indexOfRoom]['players'] -= 1;

            if (rooms[indexOfRoom]['players'] === 0) {
                rooms.splice(indexOfRoom, 1);
            }
        }

        delete usernames[socket.id];

        io.in(socket.room)
            .emit('update players', {
                players: Object.filter(usernames, username => username.room === socket.room)
            });

        io.in(socket.room).emit('disconnect', { username: socket.username });
    });

    socket.on('chat message', function (msg) {
        socket.to(socket.room).emit('chat message', { username: socket.username, message: msg });
    });

    socket.on('drawing', (data) => io.in(socket.room).emit('drawing', { canvas: data, drawer: socket.username }));
});

http.listen(3000, function () {
    console.log('listening on http://localhost:3000');
});