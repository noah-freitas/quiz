var $         = function (sel, con) { return [].slice.call((con ? con : document).querySelectorAll(sel)); },
    $$        = function (sel, con) { return $(sel, con)[0]; };
