import { socket } from './room.js';

(function () {
    let canvas = document.getElementById('myCanvas');
    let colors = document.getElementsByClassName('color');
    let context = canvas.getContext('2d');

    let gameIsInProgress = false;

    let currentPlayer = '';
    let orderOfPlayers = [];
    let playersWhoAlreadyPainted = [];

    let hasEventListener = false;

    let current = {
        color: 'black'
    };
    let drawing = false;

    socket.on('receive socket name', function (socketUsername) {
        if (socketUsername === currentPlayer) {
            hasEventListener = true;

            canvas.addEventListener('mousedown', onMouseDown, false);
            canvas.addEventListener('mouseup', onMouseUp, false);
            canvas.addEventListener('mouseout', onMouseUp, false);
            canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

            //Touch support for mobile devices
            canvas.addEventListener('touchstart', onMouseDown, false);
            canvas.addEventListener('touchend', onMouseUp, false);
            canvas.addEventListener('touchcancel', onMouseUp, false);
            canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
        }
    });

    for (let i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', onColorUpdate, false);
    }

    socket.on('drawing', onDrawingEvent);

    socket.on('start game drawing', function (data) {
        orderOfPlayers = data.order;
        gameIsInProgress = true;

        startGame();
    });

    socket.on('start round', function () {
        if (hasEventListener) {
            canvas.removeEventListener('mousedown', onMouseDown, false);
            canvas.removeEventListener('mouseup', onMouseUp, false);
            canvas.removeEventListener('mouseout', onMouseUp, false);
            canvas.removeEventListener('mousemove', throttle(onMouseMove, 10), false);

            hasEventListener = !hasEventListener;
        }

        clearCanvas();
        startGame();
    });

    socket.on('connection', function (data) {
        if (gameIsInProgress) {
            console.log(data);

            orderOfPlayers.push(data.username);
        }
    });

    socket.on('disconnect', function (data) {
        if (gameIsInProgress) {
            let indexofPlayer = orderOfPlayers.indexOf(data.username);

            orderOfPlayers.splice(indexofPlayer, 1);
        }
    });


    socket.on('player joined in the middle of the game', function (data) {
        if (currentPlayer === '') {
            orderOfPlayers = orderOfPlayers.concat(data.orderOfPlayers);
            currentPlayer = data.currentPlayer;
            playersWhoAlreadyPainted = playersWhoAlreadyPainted.concat(data.playersWhoAlreadyPainted);

            gameIsInProgress = true;
        }
    });

    function startGame() {
        if (orderOfPlayers.length === 0) {
            orderOfPlayers = playersWhoAlreadyPainted;
            playersWhoAlreadyPainted = [];
        }

        currentPlayer = orderOfPlayers.shift();
        playersWhoAlreadyPainted.push(currentPlayer);

        socket.emit('get socket name');
    }

    window.addEventListener('resize', onResize, false);
    onResize();


    function drawLine(x0, y0, x1, y1, color, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();

        if (!emit) { return; }
        let w = canvas.width;
        let h = canvas.height;

        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color
        });
    }

    function onMouseDown(e) {
        drawing = true;
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }

    function onMouseUp(e) {
        if (!drawing) { return; }
        drawing = false;
        drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
    }

    function onMouseMove(e) {
        if (!drawing) { return; }
        drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
        current.x = e.clientX || e.touches[0].clientX;
        current.y = e.clientY || e.touches[0].clientY;
    }

    function onColorUpdate(e) {
        current.color = e.target.className.split(' ')[1];
    }

    // limit the number of events per second
    function throttle(callback, delay) {
        let previousCall = new Date().getTime();
        return function () {
            let time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data) {
        let w = canvas.width;
        let h = canvas.height;
        drawLine(data.canvas.x0 * w, data.canvas.y0 * h, data.canvas.x1 * w, data.canvas.y1 * h, data.canvas.color);
    }

    // make the canvas fill its parent
    function onResize() {
        canvas.width = window.innerWidth - 300;
        canvas.height = window.innerHeight;
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

})();