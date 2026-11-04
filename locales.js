/**
 * locales.js - BazarHub Gestion
 * Resumen de los 3 locales (solo administrador): ventas de hoy y del mes,
 * y si hay caja abierta, lado a lado. Solo lee; no cambia nada.
 */
const _locDatos = { hoy: {}, mes: {}, caja: {}, hora: null };

function _locFechaHoy() {
  const d = new Date();
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
}

function _locSumar(snap) {
  const r = { total: 0, n: 0, ef: 0, tj: 0, tr: 0 };
  snap.forEach(doc => {
    const s = doc.data();
    if (s.anulada) return;
    r.total += s.total || 0;
    r.n++;
    r.ef += montoPorMetodo(s, 'cash');
    r.tj += montoPorMetodo(s, 'card');
    r.tr += montoPorMetodo(s, 'transfer');
  });
  return r;
}

async function _locTraerVentas(id, tipo) {
  const col = 'sales__' + id;
  let snap;
  if (tipo === 'hoy') {
    snap = await db.collection(col).where('date', '==', _locFechaHoy()).get();
  } else {
    const d = new Date();
    const desde = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    snap = await db.collection(col).where('ts', '>=', desde).get();
  }
  return _locSumar(snap);
}

async function _locTraerCaja(id) {
  const snap = await db.collection('cajas__' + id).where('abierta', '==', true).get();
  let c = null;
  snap.forEach(d => { if (!c) c = d.data(); });
  return c;
}

function _locCard(l) {
  const h = _locDatos.hoy[l.id], m = _locDatos.mes[l.id], c = _locDatos.caja[l.id];
  const actual = l.id === BG.local;
  const fila = (txt, val) => '<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span style="color:var(--txt2)">' + txt + '</span><span>' + val + '</span></div>';
  let html = '<div class="sec" style="flex:1;min-width:240px;margin:0' + (actual ? ';border-left:3px solid var(--accent)' : '') + '">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="sec-title" style="margin:0">📍 ' + l.nombre + '</div>';
  html += actual ? '<span style="font-size:11px;color:var(--txt3)">estás acá</span>' : '<button class="btn sm" onclick="BG.cambiarLocal(\'' + l.id + '\')">Ir a este local</button>';
  html += '</div>';
  if (h === undefined) html += '<div style="color:var(--txt3);font-size:13px">Cargando…</div>';
  else if (h === null) html += '<div style="color:var(--red,#c0392b);font-size:13px">No se pudo leer</div>';
  else {
    html += '<div style="font-size:26px;font-weight:700;margin:4px 0">' + formatMoney(h.total) + '</div>';
    html += '<div style="font-size:12px;color:var(--txt3);margin-bottom:8px">ventas de hoy · ' + h.n + (h.n === 1 ? ' venta' : ' ventas') + '</div>';
    html += fila('💵 Efectivo', formatMoney(h.ef)) + fila('💳 Tarjeta', formatMoney(h.tj)) + fila('🏦 Transferencia', formatMoney(h.tr));
  }
  html += '<div style="border-top:1px solid var(--brd);margin:10px 0 6px"></div>';
  if (c === undefined) html += fila('Caja', '—');
  else if (c === null) html += fila('Caja', '🔒 cerrada');
  else html += fila('Caja', '🟢 abierta · ' + (c.cajeroNombre || '—'));
  if (m === undefined) html += fila('Este mes', '<a href="#" onclick="event.preventDefault();verMesLocales()" style="color:var(--txt3)">ver</a>');
  else if (m === null) html += fila('Este mes', 'no se pudo leer');
  else html += fila('Este mes', formatMoney(m.total) + ' · ' + m.n + ' ventas');
  html += '</div>';
  return html;
}

function _locPintar() {
  const el = document.getElementById('locales-cards');
  if (!el) return;
  el.innerHTML = BG.locales.map(_locCard).join('');
  const tot = document.getElementById('locales-total');
  if (tot) {
    let t = 0, n = 0, okTodos = true;
    BG.locales.forEach(l => { const h = _locDatos.hoy[l.id]; if (h) { t += h.total; n += h.n; } else okTodos = false; });
    tot.innerHTML = okTodos
      ? '<div class="card"><div class="card-lbl">Total hoy · los 3 locales</div><div class="card-val g">' + formatMoney(t) + '</div></div><div class="card"><div class="card-lbl">Ventas hoy</div><div class="card-val">' + n + '</div></div>'
      : '';
  }
  const upd = document.getElementById('locales-updated');
  if (upd && _locDatos.hora) upd.textContent = 'Actualizado ' + _locDatos.hora;
}

async function renderLocales() {
  if (!store.currentUser || store.currentUser.role !== 'admin') return;
  _locDatos.hoy = {}; _locDatos.caja = {};
  _locPintar();
  await Promise.all(BG.locales.map(async l => {
    try { _locDatos.hoy[l.id] = await _locTraerVentas(l.id, 'hoy'); } catch (e) { console.warn('resumen hoy', l.id, e); _locDatos.hoy[l.id] = null; }
    try { _locDatos.caja[l.id] = await _locTraerCaja(l.id); } catch (e) { console.warn('resumen caja', l.id, e); _locDatos.caja[l.id] = null; }
    _locPintar();
  }));
  _locDatos.hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  _locPintar();
}

async function verMesLocales() {
  if (!store.currentUser || store.currentUser.role !== 'admin') return;
  await Promise.all(BG.locales.map(async l => {
    try { _locDatos.mes[l.id] = await _locTraerVentas(l.id, 'mes'); } catch (e) { console.warn('resumen mes', l.id, e); _locDatos.mes[l.id] = null; }
  }));
  _locPintar();
}
