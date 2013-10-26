;(function () {
    var bodyClass = function (activate) { document.body.classList[activate ? 'add' : 'remove']('active'); },
        login     = function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        var name = $$('#name').value;
                        if (name) {
                            server.emit('player:register', name);
                            document.body.innerHTML = '<p>Waiting for game to start...</p>';
                        }
                    },
        render    = function (q) {
                        bodyClass(true);
                        document.body.innerHTML = q.choices.map(function (ans) { return '<button class=answer>' + ans + '</button>'; }).join('');
                        wireAns();
                    },
        sendEvent = function (e) {
                        if (document.body.className.indexOf('active') === -1) return;
                        bodyClass(false);
                        e.target.classList.add('selected');
                        server.emit('answer', e.target.textContent);
                    },
        wireAns   = function () { $('.answer').forEach(function (but) { but.addEventListener('click', sendEvent, false); }); },
        server    = io.connect('http://quiz.noahfreitas.com/');

    server.on('question:start', render);
    server.on('question:end', bodyClass.bind(null, false));

    document.addEventListener('DOMContentLoaded', function () {
        $$('#login').addEventListener('submit', login);
        $$('#join').addEventListener('click', login);
    });
}());
