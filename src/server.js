// Imports
var express = require('express'),
    http    = require('http'),
    app     = express(),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server);

// Config
var ansPause   = 10000,
    numRounds  = 7,
    qDuration  = 20,
    qPath      = '../data/javascript-trivia.json';

// State
var board      = null,
    players    = [],
    questions  = [],
    round      = null,
    rounds     = [];

// Functions
var doRound       = function (number) {
                        var q = questions.shift();
                        round = {
                            choices       : q.choices,
                            correctAnswer : q.correct,
                            number        : number + 1,
                            playerAnswers : [],
                            question      : q.text,
                            remaining     : qDuration,
                            time          : currentTime()
                        };
                        rounds.push(round);
                        io.sockets.emit('question:start', { text: round.question, choices: round.choices, remaining: round.remaining, players: players.map(function (p) { return p.name; }).sort() });
                        round.timer = setInterval(doTimer.bind(null, number, round), 1000);
                    },
    doTimer       = function (number, round) {
                        round.remaining -= 1;
                        if (round.remaining === 0 || round.playerAnswers.length === players.length) {
                            clearInterval(round.timer);
                            io.sockets.emit('question:end', { correct: round.correctAnswer, answers: round.playerAnswers });
                            if (number === numRounds) {
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
                                }, ansPause);
                            } else {
                                setTimeout(doRound.bind(null, number + 1), ansPause);
                            }
                        } else {
                            io.sockets.emit('question:countdown', round.remaining);
                        }
                    },
    getPlayer     = function (name) { return players.filter(function (player) { return player.name === name; })[0]; },
    loadQuestions = function () { questions = require(qPath).sort(shuffle).slice(0, numRounds + 1).map(function (q) { q.choices = q.choices.sort(shuffle); return q; }); },
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
                        players.push({ name: name, time: 0, correct: 0 });
                        io.sockets.emit('player:change', playerNames());
                    },
    resetPlayers  = function () { players = players.map(function (player) { player.time = 0; player.correct = 0; return player; })},
    shuffle       = function () { return Math.random() < 0.5 ? -1 : 1; },
    startGame     = function () { loadQuestions(); resetPlayers(); rounds = []; doRound(0); },
    currentTime   = function () { return (new Date).getTime(); };

app.use(express.static(__dirname + '/public'));

server.listen('9876');

io.sockets.on('connection', function (socket) {
    socket.on('board:register' , registerBoard.bind(null, socket));
    socket.on('player:register', registerPlayer.bind(null, socket));
    socket.on('disconnect', function () { delete socket; });
});
