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
        if (usernames.hasOwnProperty(data.username)) {
            console.log('user already exists');
            return;
        }

        socket.join(data.idOfRoom, function () {
            socket.username = data.username;
            socket.room = data.idOfRoom;
            usernames[socket.id] = { username: data.username, room: data.idOfRoom };

            let indexOfRoom = rooms.findIndexOfRoom(socket);

            if (indexOfRoom === -1) {
                rooms.push({ room: data.idOfRoom, players: 1 });
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

    socket.on('join random room', function () {
        if (rooms.length === 0) {
            socket.emit('no rooms available');
            return;
        }

        let randomRoomIndex = Math.floor(Math.random() * rooms.length);
        let randomRoom = rooms[randomRoomIndex]['room'];

        socket.emit('join random room', { room: randomRoom });
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

    socket.on('is typing', function () {
        socket.to(socket.room).emit('is typing', { username: socket.username });
    });

    socket.on('is not typing', function () {
        socket.to(socket.room).emit('is not typing', { username: socket.username });
    });

    socket.on('drawing', (data) => socket.to(socket.room).emit('drawing', data));
});

http.listen(3000, function () {
    console.log('listening on http://localhost:3000');
});