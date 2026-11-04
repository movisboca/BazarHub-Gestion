/* aislar.js - BazarHub Gestion (v2)
 * Define los 3 locales y cual esta activo en este aparato. Se carga ANTES que el
 * resto. Los datos guardados en el navegador que son propios de cada local
 * (cola de ventas pendientes, copia local, borradores) se guardan con el
 * nombre del local al final, asi nunca se mezclan. */
(function () {
  try {
    var LOCALES = [
      { id: 'mg', nombre: 'Monte Grande' },
      { id: 'ro', nombre: 'Rosario' },
      { id: 'lf', nombre: 'Laferrere' }
    ];
    var S = Storage.prototype, g = S.getItem, s = S.setItem, r = S.removeItem;
    var SEL = 'bgestion_local_sel';
    var sel = null;
    try { sel = g.call(window.localStorage, SEL); } catch (e) {}
    var valido = false;
    for (var i = 0; i < LOCALES.length; i++) if (LOCALES[i].id === sel) valido = true;
    var local = valido ? sel : LOCALES[0].id;

    function nombreDe(id) {
      for (var j = 0; j < LOCALES.length; j++) if (LOCALES[j].id === id) return LOCALES[j].nombre;
      return id;
    }
    function fijarLocal(id) {
      for (var j = 0; j < LOCALES.length; j++) {
        if (LOCALES[j].id === id) {
          try { s.call(window.localStorage, SEL, id); } catch (e) {}
          try { window.location.reload(); } catch (e2) {}
          return true;
        }
      }
      return false;
    }
    window.BG = { locales: LOCALES, local: local, nombre: nombreDe, fijarLocal: fijarLocal, cambiarLocal: fijarLocal };

    var PROPIAS = { bazarhub_offline_queue: 1, bazarhub_offline_data: 1, bazarhub_drafts: 1 };
    function k(x) { return (typeof x === 'string' && PROPIAS[x]) ? x + '__' + local : x; }
    S.getItem = function (a) { return g.call(this, this === window.localStorage ? k(a) : a); };
    S.setItem = function (a, b) { return s.call(this, this === window.localStorage ? k(a) : a, b); };
    S.removeItem = function (a) { return r.call(this, this === window.localStorage ? k(a) : a); };

    function kdb(n) { return n === 'bazarhub_sync' ? n + '__' + local : n; }
    var o = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (n, ver) { n = kdb(n); return ver === undefined ? o.call(this, n) : o.call(this, n, ver); };
    var d = IDBFactory.prototype.deleteDatabase;
    IDBFactory.prototype.deleteDatabase = function (n) { return d.call(this, kdb(n)); };
  } catch (e) {}
})();
