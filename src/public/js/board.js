;(function () {
    var changeTimer       = function (time) { $$('#question .timer').innerHTML = time; },
        render            = function (players) { $$('#start .players').innerHTML = players.map(toLi).join(''); },
        showAnswer        = function (answer) {
                                showScreen('answer');
                                $$('#answer .correct').innerHTML = answer.correct;
                                $$('#answer .answers').innerHTML = answer.answers.map(function (player) {
                                    return '<li class="' + (player.correct ? 'correct' : 'incorrect') + '">' + player.name + ': ' + player.answer + '</li>';
                                }).join('');
                            },
        showFinal         = function (players) {
                                showScreen('final');
                                $$('#final .winner').innerHTML = players[0].name;
                                $$('#final .scores').innerHTML = players.map(function (player) {
                                    return '<tr><td>' + player.name + '</td><td>' + player.correct + '</td><td>' + Math.round(player.time / 1000) + '</td></tr>';
                                }).join('');
                            },
        showScreen        = function (screen) { $$('body').setAttribute('data-screen', screen); },
        startQuestion     = function (q) {
                                showScreen('question');
                                $$('#question .text').innerHTML = q.text;
                                $$('#question .timer').innerHTML = q.remaining;
                            },
        toLi              = function (text) { return '<li>' + text + '</li>'; },
        server            = io.connect('http://quiz.noahfreitas.com/');

    server.on('player:change', render);
    server.on('question:start', startQuestion);
    server.on('question:countdown', changeTimer);
    server.on('question:end', showAnswer);
    server.on('game:end', showFinal);

    document.addEventListener('DOMContentLoaded', function() {
        server.emit('board:register');
        $$('#start-game').addEventListener('click', function () { server.emit('game:start'); });
    });
}());
