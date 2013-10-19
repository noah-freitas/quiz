;(function () {
    var bodyClass = function (activate) { document.body.classList[activate ? 'add' : 'remove']('active'); },
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
    server.emit('player:register', prompt('Name:'));
}());
