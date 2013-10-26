;(function () {
    var byName            = function (player1, player2) { return player1.name < player2.name ? -1 : player1.name > player2.name ? 1 : 0; },
        changeTimer       = function (time) { $$('#question .timer').innerHTML = time.toString().length < 2 ? '0' + time : time; },
        playerAnswerTmpl  = function (player) { return '<li><p class="' + (player.correct ? 'alert alert-success' : 'alert alert-danger') + '">' + player.name + ': ' + player.answer + '</p></li>'; },
        playerFinalTmpl   = function (player) { return '<tr><td>' + player.name + '</td><td>' + player.correct + '</td><td>' + Math.round(player.time / 1000) + '</td></tr>'; },
        render            = function (players) { $$('#start .players').innerHTML = players.map(toLi).join(''); },
        showAnswer        = function (answer) {
                                showScreen('answer');
                                $$('#answer .correct').innerHTML = answer.correct;
                                $$('#answer .answers').innerHTML = answer.answers.sort(byName).map(playerAnswerTmpl).join('');
                            },
        showAnswered      = function (p) { $$('#question .players li[data-player="' + p + '"]').classList.add('answered'); },
        showFinal         = function (players) {
                                showScreen('final');
                                $$('#final .winner').innerHTML = players[0].name;
                                $$('#final .scores').innerHTML = players.map(playerFinalTmpl).join('');
                            },
        showScreen        = function (screen) { $$('body').setAttribute('data-screen', screen); },
        startQuestion     = function (q) {
                                showScreen('question');
                                $$('#question .text').innerHTML = q.text;
                                $$('#question .timer').innerHTML = q.remaining.toString().length < 2 ? '0' + q.remaining : q.remaining;
                                $$('#question .players').innerHTML = q.players.map(function (p) { return '<li data-player="' + p + '">' + p + '</li>'; }).join('');
                            },
        toLi              = function (text) { return '<li>' + text + '</li>'; },
        server            = io.connect('http://quiz.noahfreitas.com/');

    server.on('player:change', render);
    server.on('player:answer', showAnswered);
    server.on('question:start', startQuestion);
    server.on('question:countdown', changeTimer);
    server.on('question:end', showAnswer);
    server.on('game:end', showFinal);

    document.addEventListener('DOMContentLoaded', function() {
        server.emit('board:register');
        $$('#start-game').addEventListener('click', function () { server.emit('game:start'); });
    });
}());
