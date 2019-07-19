window.onload = function () {
    let socket = io();

    let pathname = location.pathname.substr(1, location.pathname.length);
    console.log(pathname);
    socket.emit('join room', pathname);

    socket.on('my message', function (msg) {
        console.log(msg);
    });
};