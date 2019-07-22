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

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => (res[key] = obj[key], res), {});


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

            socket.to(data.idOfRoom)
                .emit('connection',
                    {
                        username: socket.username,
                        players: Object.filter(usernames, username => username.room === socket.room)
                    });

            io.in(socket.room)
                .emit('update players',
                    { players: Object.filter(usernames, username => username.room === socket.room) });
        });
    }));

    socket.on('disconnect', function () {
        delete usernames[socket.id];

        io.in(socket.room).emit('update players', { players: usernames });
        io.in(socket.room)
            .emit('disconnect',
                {
                    username: socket.username,
                    players: Object.filter(usernames, username => username.room === socket.room)
                });
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