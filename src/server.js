// Imports
var express = require('express'),
    http    = require('http'),
    app     = express(),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server);

// State
var board      = null,
    players    = [],
    round      = null,
    rounds     = [];

// Functions
var doRound       = function (number) {
                        round = {
                            choices       : ['1', '2', '3', '4'],
                            correctAnswer : String(Math.floor(Math.random() * 4) + 1),
                            number        : number + 1,
                            playerAnswers : [],
                            question      : 'What is your favorite number?',
                            remaining     : 5,
                            time          : currentTime()
                        };
                        rounds.push(round);
                        io.sockets.emit('question:start', { text: round.question, choices: round.choices, remaining: round.remaining, players: players.map(function (p) { return p.name; }).sort() });
                        round.timer = setInterval(doTimer.bind(null, number, round), 1000);
                    },
    doTimer       = function (number, round) {
                        round.remaining -= 1;
                        if (round.remaining === 0) {
                            clearInterval(round.timer);
                            io.sockets.emit('question:end', { correct: round.correctAnswer, answers: round.playerAnswers });
                            if (number === 4) {
                                setTimeout(function () {
                                    io.sockets.emit('game:end', players.map(function (p) {
                                        return {
                                            correct : p.correct,
                                            name    : p.name,
                                            time    : p.time
                                        };
                                    }).sort(function (a, b) {
                                        if (a.correct > b.correct) {
                                            return -1;
                                        } else if (a.correct < b.correct) {
                                            return 1;
                                        } else {
                                            if (a.time < b.time) return -1;
                                            else                 return 1;
                                        }
                                    }));
                                }, 1500);
                            } else {
                                setTimeout(doRound.bind(null, number + 1), 1500);
                            }
                        } else {
                            io.sockets.emit('question:countdown', round.remaining);
                        }
                    },
    getPlayer     = function (name) { return players.filter(function (player) { return player.name === name; })[0]; },
    playerNames   = function () { return players.map(function (player) { return player.name; }).sort(); },
    registerBoard = function (socket) {
                        board = socket;
                        socket.on('game:start', startGame);
                        socket.emit('player:change', playerNames());
                    },
    registerPlayer= function (socket, name) {
                        socket.set('player:name', name);
                        socket.on('answer', function (ans) { socket.get('player:name', function (err, name) {
                            var correct = ans === round.correctAnswer,
                                player  = getPlayer(name),
                                time    = currentTime() - round.time;

                            if (correct) player.correct += 1;
                            player.time += time;
                            round.playerAnswers.push({ name: name, answer: ans, correct: ans === round.correctAnswer, time: time });
                            io.sockets.emit('player:answer', name);
                        }); });
                        socket.on('disconnect', function () { socket.get('player:name', function (err, name) {
                            players = players.filter(function (player) { return player.name !== name; });
                            io.sockets.emit('player:change', playerNames());
                        }); });
                        players.push({ name: name, socket: socket, time: 0, correct: 0 });
                        io.sockets.emit('player:change', playerNames());
                    },
    startGame     = function () { rounds = []; doRound(0); },
    currentTime   = function () { return (new Date).getTime(); };

app.use(express.static(__dirname + '/public'));

server.listen('9876');

io.sockets.on('connection', function (socket) {
    socket.on('board:register' , registerBoard.bind(null, socket));
    socket.on('player:register', registerPlayer.bind(null, socket));
});
