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

let users = [];

io.on('connection', function (socket) {
    socket.on('join room', (data => {
        socket.join(data.idOfRoom, function () {
            socket.username = data.username;
            socket.room = data.idOfRoom;
            users.push(data.username);
            socket.broadcast.to(data.idOfRoom).emit('connection', { username: socket.username });
        });
    }));

    socket.on('disconnect', function () {
        io.in(socket.room).emit('disconnect', { username: socket.username });
    });

    socket.on('chat message', function (msg) {
        socket.broadcast.to(socket.room).emit('chat message', { username: socket.username, message: msg });
    });

    socket.on('is typing', function () {
        socket.broadcast.to(socket.room).emit('is typing', { username: socket.username });
    });

    socket.on('is not typing', function () {
        socket.broadcast.to(socket.room).emit('is not typing', { username: socket.username });
    });

    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
});

http.listen(3000, function () {
    console.log('listening on http://localhost:3000');
});