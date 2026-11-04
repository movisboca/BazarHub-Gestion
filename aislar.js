/* aislar.js - BazarHub Gestion
 * Esta copia del sistema vive en el mismo sitio web (github.io) que otra copia.
 * Para que no compartan datos guardados en el navegador, a todo lo que empieza
 * con "bazarhub" se le cambia el prefijo por "bgestion". Se carga ANTES que el
 * resto de los scripts. */
(function () {
  try {
    var VIEJO = 'bazarhub', NUEVO = 'bgestion';
    function k(x) { return (typeof x === 'string' && x.indexOf(VIEJO) === 0) ? NUEVO + x.slice(VIEJO.length) : x; }
    var S = Storage.prototype, g = S.getItem, s = S.setItem, r = S.removeItem;
    S.getItem = function (a) { return g.call(this, this === window.localStorage ? k(a) : a); };
    S.setItem = function (a, b) { return s.call(this, this === window.localStorage ? k(a) : a, b); };
    S.removeItem = function (a) { return r.call(this, this === window.localStorage ? k(a) : a); };
    var o = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (n, ver) { n = k(n); return ver === undefined ? o.call(this, n) : o.call(this, n, ver); };
    var d = IDBFactory.prototype.deleteDatabase;
    IDBFactory.prototype.deleteDatabase = function (n) { return d.call(this, k(n)); };
  } catch (e) {}
})();
