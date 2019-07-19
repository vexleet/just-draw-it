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


io.on('connection', function (socket) {
    socket.on('join room', (idOfRoom => {
        socket.join(idOfRoom, function () {
            socket.broadcast.to(idOfRoom).emit('my message', 'pesho has joined');
        });
    }));

    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
});

http.listen(3000, function () {
    console.log('listening on http://localhost:3000');
});