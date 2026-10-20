// 4.5: la consola de códigos (Ctrl+Mayús+C), como la de Los Sims: se escribe un código, Enter lo ejecuta. Este es el MOTOR: la tabla de
// códigos, el parseo, el autocompletado, el historial y la validación (módulo puro: sin DOM ni three; se prueba en Node). La pantalla
// está en `trucos-pantalla.js`, el enganche con el juego en `trucos-juego.js` y todos los textos en `trucos-textos.js`.
//
// Regla de oro: los códigos NO dejan rastro. No tocan lo ganado, el libro de movimientos, los contadores ni los logros. Lo único que se
// guarda en la partida es una marca chica (`progreso.trucos.entradas`) con las anotaciones del cuaderno que se completaron con el código,
// para que los logros no las cuenten (ver `vistaParaLogros`). Lo del jugador (velocidad, salto, vuelo, frío) y el reloj congelado viven
// en memoria y se apagan al reiniciar.
//
// El motor no conoce el juego: todo lo que necesita se lo pasa `m` (el «mundo»):
//   m.desafio (bool) · m.progreso() · m.ajustes() · m.jugador() (el estado del jugador) · m.reloj ({ congelado }) · m.limite (hasta dónde se camina)
//   m.lugares() → [{ clave, nombre, x, z, y?, yaw? }] · m.ir(x, z, yaw, y) · m.depositos() → [obras terminadas que son almacén] · m.rehacerObra(o)
//   m.alCambiarClima() · m.alCambiarEstacion() · m.refrescar() · m.guardar() · m.limpiar() · m.salir()
// Todos opcionales menos progreso/ajustes/jugador (las pruebas arman un mundo de mentira).
import { MAX_PESOS, hayEconomia, pesosDe } from './economia.js';
import { ALMACENES, sanearAlmacen, libreDe, guardar as guardarEnAlmacen } from './almacen.js';
import { UMBRALES, NIVEL_MAX, ORDEN_OFICIOS, OFICIOS, esOficio } from './oficios.js';
import { CAPITULOS, historiaNueva } from './historia.js';
import { PERSONAS_VECINDAD, NIVELES_AMISTAD, nombreCorto, sumarAmistadDe, nivelDe as nivelDeAmistad, esPersonaVecindad } from './vecindad.js';
import { ENTRADAS, ENTRADA, SECCIONES } from './cuaderno.js';
import { R, AYUDA, GRUPOS, NOMBRE_ESTACION, NOMBRE_CLIMA, pesos } from './trucos-textos.js';

// ------------------------------------------------------------------ límites
export const MAX_MATERIAL = 9999;
export const MAX_DIA = 9999;
export const VELOCIDAD_RANGO = [0.25, 6];
export const SALTO_RANGO = [1, 6];
export const HISTORIAL_MAX = 50;
export const LINEA_MAX = 120;

// ------------------------------------------------------------------ texto
// «Otoño», «OTOÑO» y «otono» son lo mismo
export function normalizar(t) {
  return String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
export function partir(linea) {
  const t = String(linea ?? '').slice(0, LINEA_MAX).trim();
  return t ? t.split(/\s+/) : [];
}

// Un número que escribió el jugador. `signo`: acepta «+500» y «-200» (sumar y restar). Nunca tira: devuelve { ok, valor, rel } o
// { ok: false, error } con error = 'falta' | 'noEsNumero' | 'demasiado' | 'fueraDeRango'.
export function leerNumero(txt, { min = 0, max = MAX_MATERIAL, entero = true, signo = false } = {}) {
  let t = String(txt ?? '').trim();
  if (!t) return { ok: false, error: 'falta' };
  let rel = 0;
  if (signo && /^[+\-−]/.test(t)) { rel = t[0] === '+' ? 1 : -1; t = t.slice(1).trim(); }
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  else t = t.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false, error: 'noEsNumero' };
  if (t.length > 12) return { ok: false, error: 'demasiado' };
  const v = Number(t);
  if (!Number.isFinite(v)) return { ok: false, error: 'noEsNumero' };
  if (entero && !Number.isInteger(v)) return { ok: false, error: 'noEsNumero' };
  if (!rel && (v < min || v > max)) return { ok: false, error: 'fueraDeRango' };
  return { ok: true, valor: v, rel };
}
const acotar = (v, min, max) => Math.max(min, Math.min(max, v));
// El valor final: fijo, o el actual más o menos lo escrito (siempre dentro de [min, max])
function aplicar(actual, lec, min, max) {
  const base = Number.isFinite(Number(actual)) ? Number(actual) : 0;
  return acotar(lec.rel ? base + lec.rel * lec.valor : lec.valor, min, max);
}
// El mensaje de un número mal escrito
function errorNumero(lec, txt, uso, min, max, unidad) {
  if (lec.error === 'falta') return R.faltaNumero(uso);
  if (lec.error === 'demasiado') return R.demasiado(txt);
  if (lec.error === 'fueraDeRango') return R.fueraDeRango(txt, min, max, unidad);
  return R.noEsNumero(txt, uso);
}
const ok = (texto, extra = {}) => ({ ok: true, texto, ...extra });
const no = (texto, extra = {}) => ({ ok: false, texto, ...extra });
const unico = (args) => (args.length > 1 ? no(R.sobra(args.slice(1).join(' '))) : null);
const relax = (m, que) => (m.desafio ? no(R.soloRelax(que)) : null);
const progresoDe = (m) => { const p = m.progreso?.(); return p && typeof p === 'object' ? p : null; };

// ------------------------------------------------------------------ dinero y materiales
function cmdPlata(args, m) {
  const p = progresoDe(m);
  if (m.desafio) return no(R.plataDesafio);
  if (!p || !hayEconomia(p)) return no(R.noHayPartida);
  const sobra = unico(args); if (sobra) return sobra;
  const lec = leerNumero(args[0], { min: 0, max: MAX_PESOS, signo: true });
  if (!lec.ok) return no(errorNumero(lec, args[0], AYUDA.plata.uso, 0, MAX_PESOS, ' pesos'));
  p.economia.pesos = Math.floor(aplicar(pesosDe(p), lec, 0, MAX_PESOS));
  m.refrescar?.();
  return ok(R.plata(p.economia.pesos));
}

const MATERIALES_RELAX = ['tronco', 'tabla', 'piedra', 'lana'];
const MATERIALES_DESAFIO = ['tronco', 'tabla', 'piedra'];
const PLURAL = { tronco: 'troncos', tabla: 'tablas', piedra: 'piedras', lana: 'vellones de lana' };
function fijarMaterial(p, k, lec) {
  p.materiales = p.materiales && typeof p.materiales === 'object' ? p.materiales : {};
  const n = Math.floor(aplicar(p.materiales[k], lec, 0, MAX_MATERIAL));
  if (n > 0) p.materiales[k] = n; else delete p.materiales[k];
  return n;
}
function cmdMaterial(clave) {
  return (args, m) => {
    const p = progresoDe(m); if (!p) return no(R.noHayPartida);
    if (clave === 'lana' && m.desafio) return no(R.lanaDesafio);
    const sobra = unico(args); if (sobra) return sobra;
    const uso = AYUDA[clave === 'tronco' ? 'troncos' : clave === 'tabla' ? 'tablas' : clave === 'piedra' ? 'piedras' : 'lana'].uso;
    const lec = leerNumero(args[0], { min: 0, max: MAX_MATERIAL, signo: true });
    if (!lec.ok) return no(errorNumero(lec, args[0], uso, 0, MAX_MATERIAL));
    const n = fijarMaterial(p, clave, lec);
    m.refrescar?.();
    return ok(R.material(PLURAL[clave], n));
  };
}
function cmdMateriales(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const sobra = unico(args); if (sobra) return sobra;
  const lec = leerNumero(args[0], { min: 0, max: MAX_MATERIAL, signo: true });
  if (!lec.ok) return no(errorNumero(lec, args[0], AYUDA.materiales.uso, 0, MAX_MATERIAL));
  for (const k of m.desafio ? MATERIALES_DESAFIO : MATERIALES_RELAX) fijarMaterial(p, k, lec);
  m.refrescar?.();
  return ok(lec.rel ? R.materialesRel(lec.rel, lec.valor) : (m.desafio ? R.materialesDesafio(lec.valor) : R.materiales(lec.valor)));
}

// Llena los almacenes que hay construidos. `m.depositos()` da los `datos` de cada obra (con `.plano` y `.almacen`).
function cmdDepositos(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const sobra = unico(args); if (sobra) return sobra;
  let llenos = 0;
  for (const o of m.depositos?.() || []) {
    const id = o?.plano?.id, datos = o?.datos;
    const A = ALMACENES[id];
    if (!A || !datos || A.tipo === 'herramienta') continue;
    const a = sanearAlmacen(datos.almacen, id);
    datos.almacen = a;
    for (const k of A.guarda) { const libre = libreDe(id, a, k); if (libre > 0) guardarEnAlmacen(id, a, k, libre); }
    m.rehacerObra?.(o);
    llenos++;
  }
  m.refrescar?.();
  return llenos ? ok(R.depositos(llenos)) : no(R.depositos(0));
}

const HERRAMIENTAS = ['hacha', 'pico', 'tijera', 'mosca', 'farol', 'botas'];
const NOMBRE_HERRAMIENTA = { hacha: 'el hacha', pico: 'el pico', tijera: 'la tijera', mosca: 'la mosca de pescar', farol: 'el farol', botas: 'las botas de goma' };
function cmdHerramientas(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  if (m.desafio) return no(R.soloRelax('Las herramientas sueltas'));
  const sobra = unico(args); if (sobra) return sobra;
  p.cosas = p.cosas && typeof p.cosas === 'object' ? p.cosas : {};
  const dadas = [];
  for (const k of HERRAMIENTAS) if (!(Number(p.cosas[k]) > 0)) { p.cosas[k] = 1; dadas.push(NOMBRE_HERRAMIENTA[k]); }
  m.refrescar?.();
  return ok(R.herramientas(dadas));
}

// ------------------------------------------------------------------ tiempo y clima
const dosDigitos = (n) => String(n).padStart(2, '0');
// «18», «18:30», «6.5», «6,5»: horas del día (0 a 23:59)
export function leerHora(txt) {
  const t = String(txt ?? '').trim();
  if (!t) return { ok: false, error: 'falta' };
  let h, mi = 0;
  let r = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  if (r) { h = Number(r[1]); mi = Number(r[2]); }
  else if ((r = /^(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(t))) { h = Number(r[1]); mi = r[2] ? Math.round(Number(`0.${r[2]}`) * 60) : 0; if (mi === 60) { mi = 0; h += 1; } }
  else return { ok: false, error: 'noEsNumero' };
  if (!Number.isInteger(h) || h < 0 || h > 23 || mi < 0 || mi > 59) return { ok: false, error: 'fueraDeRango' };
  return { ok: true, h, mi, horas: h + mi / 60 };
}
function ponerHora(horas, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  if (m.desafio) return no(R.horaDesafio);
  if (m.ajustes?.()?.duracion === 'reloj' && !m.reloj?.congelado) return no(R.horaDeReloj);
  p.horas = horas;
  const h = Math.floor(horas), mi = Math.round((horas - h) * 60);
  m.refrescar?.();
  return ok(R.hora(mi === 60 ? h + 1 : h, mi === 60 ? 0 : mi));
}
function cmdHora(args, m) {
  const sobra = unico(args); if (sobra) return sobra;
  const lec = leerHora(args[0]);
  if (!lec.ok) return no(lec.error === 'falta' ? R.faltaNumero(AYUDA.hora.uso) : lec.error === 'fueraDeRango' ? R.fueraDeRango(args[0], 0, 23, ' h') : R.noEsNumero(args[0], AYUDA.hora.uso));
  return ponerHora(lec.horas, m);
}
const atajoHora = (horas) => (args, m) => { const sobra = unico(args); return sobra || ponerHora(horas, m); };

function cmdDia(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const d = relax(m, 'El día'); if (d) return d;
  const sobra = unico(args); if (sobra) return sobra;
  const hoy = Math.max(1, Math.floor(Number(p.dia) || 1));
  const lec = leerNumero(args[0], { min: 1, max: MAX_DIA, signo: true });
  if (!lec.ok) return no(errorNumero(lec, args[0], AYUDA.dia.uso, 1, MAX_DIA));
  const destino = Math.floor(aplicar(hoy, lec, 1, MAX_DIA));
  if (destino < hoy) return no(R.diaAtras(hoy));
  if (destino === hoy) return ok(R.diaIgual(hoy));
  p.dia = destino;
  m.refrescar?.();
  return ok(R.dia(destino));
}

const ESTACIONES = { verano: 'verano', otono: 'otono', invierno: 'invierno', auto: 'auto', automatica: 'auto', automatico: 'auto' };
function cmdEstacion(args, m) {
  const a = m.ajustes?.(); if (!a) return no(R.noHayPartida);
  const d = relax(m, 'La estación'); if (d) return d;
  const sobra = unico(args); if (sobra) return sobra;
  if (!args[0]) return no(R.estacionNo(''));
  const k = Object.hasOwn(ESTACIONES, normalizar(args[0])) ? ESTACIONES[normalizar(args[0])] : null;
  if (!k) return no(R.estacionNo(args[0]));
  a.estacion = k;
  m.alCambiarEstacion?.();
  return ok(k === 'auto' ? R.estacionAuto : R.estacion(NOMBRE_ESTACION[k]));
}
const CLIMAS = { despejado: 'despejado', sol: 'despejado', lluvia: 'lluvioso', lluvioso: 'lluvioso', variable: 'variable', normal: 'variable', auto: 'variable' };
function cmdClima(args, m) {
  const a = m.ajustes?.(); if (!a) return no(R.noHayPartida);
  const d = relax(m, 'El clima'); if (d) return d;
  const sobra = unico(args); if (sobra) return sobra;
  if (!args[0]) return no(R.climaNo(''));
  const k = Object.hasOwn(CLIMAS, normalizar(args[0])) ? CLIMAS[normalizar(args[0])] : null;
  if (!k) return no(R.climaNo(args[0]));
  a.clima = k;
  m.alCambiarClima?.();
  return ok(R.clima(NOMBRE_CLIMA[k]));
}
function cmdCongelar(args, m) {
  const d = relax(m, 'El reloj'); if (d) return d;
  if (!m.reloj) return no(R.noHayPartida);
  if (m.reloj.congelado) return ok(R.yaCongelado);
  m.reloj.congelado = true;
  return ok(R.congelado);
}
function cmdDescongelar(args, m) {
  if (!m.reloj) return no(R.noHayPartida);
  if (!m.reloj.congelado) return ok(R.yaAndaba);
  m.reloj.congelado = false;
  return ok(R.descongelado);
}

// ------------------------------------------------------------------ jugador y lugares
// «velocidad 3» / «velocidad normal»: un número con decimales entre `rango`
function cmdMultiplicador(clave, campo, rango, texto) {
  return (args, m) => {
    const js = m.jugador?.(); if (!js) return no(R.noHayPartida);
    const sobra = unico(args); if (sobra) return sobra;
    const arg = args[0];
    if (!arg) return no(R.faltaNumero(AYUDA[clave].uso));
    let x;
    if (normalizar(arg) === 'normal' || normalizar(arg) === 'nada' || normalizar(arg) === 'apagar') x = 1;
    else {
      const lec = leerNumero(arg, { min: rango[0], max: rango[1], entero: false });
      if (!lec.ok) return no(lec.error === 'fueraDeRango' ? `«${arg}» no vale: tiene que estar entre ${String(rango[0]).replace('.', ',')} y ${rango[1]}` : errorNumero(lec, arg, AYUDA[clave].uso, rango[0], rango[1]));
      x = Math.round(lec.valor * 100) / 100;
    }
    if (x === 1) delete js[campo]; else js[campo] = x;
    return ok(texto(x));
  };
}
const sobreVehiculo = (js) => !!(js.montado || js.enKayak || js.enTren || js.enCable || js.enSulky);
function cmdVolar(args, m) {
  const js = m.jugador?.(); if (!js) return no(R.noHayPartida);
  const sobra = unico(args); if (sobra) return sobra;
  const a = normalizar(args[0] || '');
  let quiere = !js.trucoVuelo;
  if (['si', 'prender', 'prendido', 'on'].includes(a)) quiere = true;
  else if (['no', 'apagar', 'apagado', 'off'].includes(a)) quiere = false;
  if (quiere) {
    if (sobreVehiculo(js)) return no(R.volarNoPuedo);
    js.trucoVuelo = true;
    return ok(R.volarSi);
  }
  delete js.trucoVuelo;
  return ok(R.volarNo);
}
function cmdFrio(args, m) {
  const js = m.jugador?.(); if (!js) return no(R.noHayPartida);
  const sobra = unico(args); if (sobra) return sobra;
  if (js.trucoSinFrio) { delete js.trucoSinFrio; return ok(R.frioNo); }
  js.trucoSinFrio = true;
  js.entumecido = 0;
  return ok(R.frioSi);
}

const lugaresDe = (m) => (m.lugares?.() || []).filter((l) => l && typeof l.clave === 'string' && Number.isFinite(Number(l.x)) && Number.isFinite(Number(l.z)));
function cmdIr(args, m) {
  const js = m.jugador?.(); if (!js) return no(R.noHayPartida);
  const lugares = lugaresDe(m);
  if (!args.length) return ok(R.irLista(lugares.map((l) => l.clave)));
  const limite = Number(m.limite) > 0 ? Number(m.limite) : 468;
  let destino = null;
  // dos números: un punto del mapa
  if (args.length === 2 && /^[+\-−]?[\d.,]+$/.test(args[0]) && /^[+\-−]?[\d.,]+$/.test(args[1])) {
    const num = (t) => { const s = t.replace('−', '-').replace(',', '.'); const v = Number(s); return Number.isFinite(v) && s.length <= 12 ? v : NaN; };
    const x = num(args[0]), z = num(args[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return no(R.noEsNumero(args.join(' '), 'ir 120 -80'));
    if (Math.abs(x) > limite - 1 || Math.abs(z) > limite - 1) return no(R.irFuera(limite - 1));
    destino = { x, z, punto: true };
  } else {
    const q = normalizar(args.join(' ').replace(/^(el|la|los|las|a|al)\s+/i, ''));
    const exacto = lugares.find((l) => normalizar(l.clave) === q || normalizar(l.nombre) === q);
    if (exacto) destino = exacto;
    else {
      const cand = lugares.filter((l) => normalizar(l.clave).startsWith(q) || normalizar(l.nombre).includes(q) || normalizar(l.clave).includes(q));
      if (cand.length === 1) destino = cand[0];
      else if (cand.length > 1) return no(R.irAmbiguo(args.join(' '), cand.slice(0, 6).map((l) => l.clave)));
      else return no(R.irNo(args.join(' ')));
    }
  }
  if (js.enKayak || js.enTren || js.enCable || js.enSulky || js.sentado) return no(R.irNoPuedo);
  m.ir?.(Number(destino.x), Number(destino.z), destino.yaw, destino.y);
  return ok(destino.punto ? R.irPunto(destino.x, destino.z) : R.irOk(destino.nombre || destino.clave));
}
function cmdDonde(args, m) {
  const js = m.jugador?.(); if (!js?.pos) return no(R.noHayPartida);
  let cerca = null, metros = 0;
  for (const l of lugaresDe(m)) {
    const d = Math.hypot(Number(l.x) - js.pos.x, Number(l.z) - js.pos.z);
    if (!cerca || d < metros) { cerca = l; metros = d; }
  }
  return ok(R.donde(js.pos.x, js.pos.z, cerca ? cerca.nombre || cerca.clave : '', Math.round(metros)));
}

// ------------------------------------------------------------------ desbloquear y completar
function cmdPlanos(args, m) {
  return m.desafio ? no(R.planosDesafio) : ok(R.planosRelax);
}
function leerOficio(txt) {
  const q = normalizar(txt);
  return ORDEN_OFICIOS.find((id) => normalizar(id) === q || normalizar(OFICIOS[id].nombre) === q || normalizar(id).startsWith(q)) || null;
}
function cmdOficios(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  p.oficios = p.oficios && typeof p.oficios === 'object' ? p.oficios : { version: 1, xp: {}, resto: { obra: {}, cosecha: 0 }, metros: 0, acreditado: true };
  p.oficios.xp = p.oficios.xp && typeof p.oficios.xp === 'object' ? p.oficios.xp : {};
  p.oficios.acreditado = true;
  const a = normalizar(args[0] || '');
  if (!a) return no(R.faltaNumero(AYUDA.oficios.uso));
  if (['maximo', 'todos', 'max'].includes(a)) {
    const sobra = unico(args); if (sobra) return sobra;
    for (const id of ORDEN_OFICIOS) p.oficios.xp[id] = UMBRALES[NIVEL_MAX];
    return ok(R.oficiosTodos);
  }
  if (['cero', 'nada', 'borrar'].includes(a)) {
    const sobra = unico(args); if (sobra) return sobra;
    p.oficios.xp = {};
    return ok(R.oficiosCero);
  }
  const id = leerOficio(args[0]);
  if (!id || !esOficio(id)) return no(R.oficioNo(args[0]));
  if (args.length > 2) return no(R.sobra(args.slice(2).join(' ')));
  const lec = leerNumero(args[1], { min: 0, max: NIVEL_MAX });
  if (!lec.ok) return no(errorNumero(lec, args[1], AYUDA.oficios.uso, 0, NIVEL_MAX));
  if (lec.valor > 0) p.oficios.xp[id] = UMBRALES[lec.valor]; else delete p.oficios.xp[id];
  return ok(R.oficio(OFICIOS[id].nombre, lec.valor));
}

function diaDe(p) { return Math.max(1, Math.floor(Number(p?.dia) || 1)); }
function cmdHistoria(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const d = relax(m, 'La historia'); if (d) return d;
  if (!p.historia || typeof p.historia !== 'object' || Array.isArray(p.historia)) p.historia = historiaNueva();
  const h = p.historia, dia = diaDe(p), n = CAPITULOS.length;
  const a = normalizar(args[0] || '');
  const marcar = (c, hecho) => { for (const o of c.objetivos) { const k = `${c.id}:${o.id}`; if (hecho) h.hechos[k] = h.hechos[k] || dia; else delete h.hechos[k]; } if (hecho) h.cerrados[c.id] = h.cerrados[c.id] || dia; else { delete h.cerrados[c.id]; delete h.momentos[c.id]; } };
  h.hechos = h.hechos && typeof h.hechos === 'object' ? h.hechos : {};
  h.cerrados = h.cerrados && typeof h.cerrados === 'object' ? h.cerrados : {};
  h.momentos = h.momentos && typeof h.momentos === 'object' ? h.momentos : {};
  if (a === 'capitulo' || a === 'cap') {
    if (args.length > 2) return no(R.sobra(args.slice(2).join(' ')));
    const lec = leerNumero(args[1], { min: 1, max: n });
    if (!lec.ok) return no(errorNumero(lec, args[1], AYUDA.historia.uso, 1, n));
    const idx = lec.valor - 1;
    CAPITULOS.forEach((c, i) => marcar(c, i < idx));
    h.activa = true; h.empezada = h.empezada || dia; h.terminada = 0; h.capitulo = idx; h.fase = 'intro'; h.base = {};
    return ok(R.historiaCapitulo(lec.valor, CAPITULOS[idx].titulo || CAPITULOS[idx].nombre || ''));
  }
  if (a === 'completar' || a === 'terminar' || a === 'fin') {
    const sobra = unico(args); if (sobra) return sobra;
    CAPITULOS.forEach((c) => marcar(c, true));
    h.activa = true; h.empezada = h.empezada || dia; h.terminada = h.terminada || dia; h.capitulo = n - 1; h.fase = 'fin'; h.base = {};
    return ok(R.historiaCompleta);
  }
  if (a === 'reiniciar' || a === 'empezar') {
    const sobra = unico(args); if (sobra) return sobra;
    CAPITULOS.forEach((c) => marcar(c, false));
    h.activa = true; h.empezada = h.empezada || dia; h.terminada = 0; h.capitulo = 0; h.fase = 'intro'; h.base = {};
    return ok(R.historiaReiniciada);
  }
  return no(R.historiaUso(n));
}

const NIVELES = { conocido: 0, amigo: 1, amiga: 1, compadre: 2, comadre: 2 };
function leerPersona(txt) {
  const q = normalizar(txt);
  if (!q) return null;
  const exacto = PERSONAS_VECINDAD.find((k) => normalizar(k) === q || normalizar(nombreCorto(k) || '') === q);
  if (exacto) return exacto;
  const cand = PERSONAS_VECINDAD.filter((k) => normalizar(k).startsWith(q) || normalizar(nombreCorto(k) || '').startsWith(q));
  return cand.length === 1 ? cand[0] : null;
}
function cmdAmigos(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const d = relax(m, 'La amistad con los vecinos'); if (d) return d;
  if (!args.length) return no(R.faltaNumero(AYUDA.amigos.uso));
  if (args.length > 2) return no(R.sobra(args.slice(2).join(' ')));
  let nivel = 2, nombreNivel = 'compadres';
  if (args[1]) {
    const q = normalizar(args[1]);
    if (!Object.hasOwn(NIVELES, q)) return no(R.nivelNo(args[1]));
    nivel = NIVELES[q];
  }
  const nombres = ['conocidos', 'amigos', 'compadres'];
  nombreNivel = nombres[nivel];
  const todos = normalizar(args[0]) === 'todos' || normalizar(args[0]) === 'todas';
  const quienes = todos ? PERSONAS_VECINDAD.slice() : [leerPersona(args[0])];
  if (!todos && !quienes[0]) return no(R.amigoNo(args[0]));
  const dia = diaDe(p);
  let cambiaron = 0;
  for (const k of quienes) {
    if (!esPersonaVecindad(k)) continue;
    if (NIVELES_AMISTAD.indexOf(nivelDeAmistad(k, p)) >= nivel && nivel > 0) continue;
    if (nivel === 0) { sumarAmistadDe(p, k, 0, dia); cambiaron++; continue; }
    // de a diez puntos (lo máximo que suma una vez), hasta llegar al nivel; sin pasarse de las vueltas por si algo lo frena
    for (let i = 0; i < 30 && NIVELES_AMISTAD.indexOf(nivelDeAmistad(k, p)) < nivel; i++) sumarAmistadDe(p, k, 10, dia);
    if (NIVELES_AMISTAD.indexOf(nivelDeAmistad(k, p)) >= nivel) cambiaron++;
  }
  return cambiaron ? ok(R.amigos(cambiaron, nombreNivel.replace(/s$/, todos || cambiaron > 1 ? 's' : ''))) : ok(R.amigosNinguno(nombreNivel.replace(/s$/, '')));
}

function cmdCuaderno(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const d = relax(m, 'El cuaderno'); if (d) return d;
  const a = normalizar(args[0] || '');
  if (a !== 'completo' && a !== 'completar' && a !== 'todo') return no(R.faltaNumero(AYUDA.cuaderno.uso));
  if (args.length > 2) return no(R.sobra(args.slice(2).join(' ')));
  let seccion = null;
  if (args[1]) {
    const q = normalizar(args[1]);
    seccion = SECCIONES.find((s) => normalizar(s.id) === q || normalizar(s.nombre).startsWith(q))?.id || null;
    if (!seccion) return no(R.cuadernoSeccion(args[1]));
  }
  p.entradas = p.entradas && typeof p.entradas === 'object' ? p.entradas : {};
  const marca = p.trucos && typeof p.trucos === 'object' ? p.trucos : (p.trucos = {});
  const anotadas = new Set(Array.isArray(marca.entradas) ? marca.entradas : []);
  let nuevas = 0;
  for (const e of ENTRADAS) {
    if (seccion && e.seccion !== seccion) continue;
    if (p.entradas[e.id]) continue;
    p.entradas[e.id] = { dia: diaDe(p), hora: Number.isFinite(Number(p.horas)) ? Number(p.horas) : 12, cantidad: 0 };
    anotadas.add(e.id);
    nuevas++;
  }
  marca.entradas = [...anotadas];
  m.refrescar?.();
  return ok(R.cuaderno(nuevas));
}

// La marca de la partida: sólo qué anotaciones del cuaderno se completaron con el código. Se sanea al guardar y cargar.
export function sanearMarcaTrucos(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const lista = (Array.isArray(v.entradas) ? v.entradas : []).filter((id) => typeof id === 'string' && Object.hasOwn(ENTRADA, id));
  const unicas = [...new Set(lista)];
  return unicas.length ? { entradas: unicas } : undefined;
}
// La partida como la ven los logros: sin las anotaciones que puso un código. No copia nada si no hubo códigos.
export function vistaParaLogros(p) {
  const ids = p?.trucos?.entradas;
  if (!Array.isArray(ids) || !ids.length || !p.entradas) return p;
  const fuera = new Set(ids);
  const entradas = {};
  for (const [k, v] of Object.entries(p.entradas)) if (!fuera.has(k)) entradas[k] = v;
  return { ...p, entradas };
}

// ------------------------------------------------------------------ la consola
function cmdAyuda(args, m) {
  if (args[0]) {
    const c = buscarComando(args[0]);
    if (!c.cmd) return no(R.noEntendi(args[0], c.parecidos));
    return ok(R.ayudaUno(AYUDA[c.cmd.nombre].uso, AYUDA[c.cmd.nombre].detalle));
  }
  const lineas = [R.ayudaTitulo];
  for (const g of Object.keys(GRUPOS)) {
    lineas.push(`— ${GRUPOS[g]} —`);
    for (const c of COMANDOS) if (c.grupo === g) lineas.push(`${AYUDA[c.nombre].uso} · ${AYUDA[c.nombre].linea}`);
  }
  return ok(lineas.join('\n'), { lineas });
}
function cmdEstado(args, m) {
  const p = progresoDe(m); if (!p) return no(R.noHayPartida);
  const h = Number.isFinite(Number(p.horas)) ? Number(p.horas) : 12;
  const hh = Math.floor(h), mi = Math.min(59, Math.floor((h - hh) * 60));
  let lugar = '';
  const js = m.jugador?.();
  if (js?.pos) { let mejor = null, dm = 0; for (const l of lugaresDe(m)) { const d = Math.hypot(Number(l.x) - js.pos.x, Number(l.z) - js.pos.z); if (!mejor || d < dm) { mejor = l; dm = d; } } if (mejor) lugar = `cerca de ${mejor.nombre || mejor.clave}`; }
  return ok(R.estado(diaDe(p), `${hh}:${dosDigitos(mi)}`, !m.desafio && hayEconomia(p) ? pesos(pesosDe(p)) : '', lugar));
}
function cmdGuardar(args, m) { if (!m.guardar) return no(R.noHayPartida); m.guardar(); return ok(R.guardado); }
function cmdLimpiar(args, m) { m.limpiar?.(); return ok(R.limpia, { limpiar: true }); }
function cmdSalir(args, m) { m.salir?.(); return ok(R.salio, { cerrar: true }); }

// ------------------------------------------------------------------ la tabla de códigos
const arg = (lista) => () => lista;
const nombresOficios = () => ['maximo', 'cero', ...ORDEN_ORD()];
const ORDEN_ORD = () => ORDEN_OFICIOS.slice();
export const COMANDOS = [
  { nombre: 'plata', alias: ['pesos', 'dinero'], grupo: 'dinero', correr: cmdPlata },
  { nombre: 'materiales', alias: [], grupo: 'dinero', correr: cmdMateriales },
  { nombre: 'troncos', alias: ['tronco'], grupo: 'dinero', correr: cmdMaterial('tronco') },
  { nombre: 'tablas', alias: ['tabla'], grupo: 'dinero', correr: cmdMaterial('tabla') },
  { nombre: 'piedras', alias: ['piedra'], grupo: 'dinero', correr: cmdMaterial('piedra') },
  { nombre: 'lana', alias: ['vellones'], grupo: 'dinero', correr: cmdMaterial('lana') },
  { nombre: 'depositos', alias: ['deposito', 'llenar'], grupo: 'dinero', correr: cmdDepositos },
  { nombre: 'herramientas', alias: ['herramienta'], grupo: 'dinero', correr: cmdHerramientas },

  { nombre: 'hora', alias: [], grupo: 'tiempo', correr: cmdHora },
  { nombre: 'amanecer', alias: [], grupo: 'tiempo', correr: atajoHora(6.5) },
  { nombre: 'mediodia', alias: [], grupo: 'tiempo', correr: atajoHora(12) },
  { nombre: 'atardecer', alias: [], grupo: 'tiempo', correr: atajoHora(19) },
  { nombre: 'medianoche', alias: [], grupo: 'tiempo', correr: atajoHora(0) },
  { nombre: 'dia', alias: [], grupo: 'tiempo', correr: cmdDia },
  { nombre: 'estacion', alias: [], grupo: 'tiempo', correr: cmdEstacion, sugerir: arg(['verano', 'otoño', 'invierno', 'auto']) },
  { nombre: 'clima', alias: [], grupo: 'tiempo', correr: cmdClima, sugerir: arg(['despejado', 'lluvia', 'variable']) },
  { nombre: 'congelar', alias: ['frenar'], grupo: 'tiempo', correr: cmdCongelar },
  { nombre: 'descongelar', alias: ['soltar'], grupo: 'tiempo', correr: cmdDescongelar },

  { nombre: 'velocidad', alias: [], grupo: 'jugador', correr: cmdMultiplicador('velocidad', 'trucoVel', VELOCIDAD_RANGO, R.velocidad), sugerir: arg(['normal', '2', '3', '4']) },
  { nombre: 'salto', alias: [], grupo: 'jugador', correr: cmdMultiplicador('salto', 'trucoSalto', SALTO_RANGO, R.salto), sugerir: arg(['normal', '2', '3', '4']) },
  { nombre: 'volar', alias: ['vuelo'], grupo: 'jugador', correr: cmdVolar },
  { nombre: 'frio', alias: [], grupo: 'jugador', correr: cmdFrio },
  { nombre: 'ir', alias: ['teletransportar', 'tp'], grupo: 'jugador', correr: cmdIr, sugerir: (i, previos, m) => (i === 0 ? lugaresDe(m).map((l) => l.clave) : []) },
  { nombre: 'donde', alias: ['posicion'], grupo: 'jugador', correr: cmdDonde },

  { nombre: 'planos', alias: [], grupo: 'desbloquear', correr: cmdPlanos, sugerir: arg(['todos']) },
  { nombre: 'oficios', alias: ['oficio'], grupo: 'desbloquear', correr: cmdOficios, sugerir: (i) => (i === 0 ? nombresOficios() : i === 1 ? ['0', '1', '2', '3', '4', '5'] : []) },
  { nombre: 'historia', alias: [], grupo: 'desbloquear', correr: cmdHistoria, sugerir: (i, previos) => (i === 0 ? ['capitulo', 'completar', 'reiniciar'] : i === 1 && normalizar(previos[0]) === 'capitulo' ? CAPITULOS.map((_, k) => String(k + 1)) : []) },
  { nombre: 'amigos', alias: ['amistad'], grupo: 'desbloquear', correr: cmdAmigos, sugerir: (i) => (i === 0 ? ['todos', ...PERSONAS_VECINDAD.map((k) => normalizar(k))] : i === 1 ? ['amigo', 'compadre'] : []) },
  { nombre: 'cuaderno', alias: [], grupo: 'desbloquear', correr: cmdCuaderno, sugerir: (i) => (i === 0 ? ['completo'] : i === 1 ? SECCIONES.map((s) => s.id) : []) },

  { nombre: 'ayuda', alias: ['?', 'comandos', 'codigos'], grupo: 'consola', correr: cmdAyuda, sugerir: (i) => (i === 0 ? COMANDOS.map((c) => c.nombre) : []) },
  { nombre: 'estado', alias: ['resumen'], grupo: 'consola', correr: cmdEstado },
  { nombre: 'guardar', alias: [], grupo: 'consola', correr: cmdGuardar },
  { nombre: 'limpiar', alias: ['borrar'], grupo: 'consola', correr: cmdLimpiar },
  { nombre: 'salir', alias: ['cerrar', 'chau'], grupo: 'consola', correr: cmdSalir },
];

// ------------------------------------------------------------------ buscar y ejecutar
const todosLosNombres = () => COMANDOS.flatMap((c) => [c.nombre, ...c.alias].map((n) => ({ n: normalizar(n), cmd: c })));
// Un nombre exacto (o alias), o el único que empiece así. `parecidos`: lo más cercano para el mensaje de «no entendí».
export function buscarComando(txt) {
  const q = normalizar(txt);
  if (!q) return { cmd: null, parecidos: [] };
  const nombres = todosLosNombres();
  const exacto = nombres.find((x) => x.n === q);
  if (exacto) return { cmd: exacto.cmd, parecidos: [] };
  const empiezan = [...new Set(nombres.filter((x) => x.n.startsWith(q)).map((x) => x.cmd.nombre))];
  if (empiezan.length === 1) return { cmd: COMANDOS.find((c) => c.nombre === empiezan[0]), parecidos: [] };
  if (empiezan.length > 1) return { cmd: null, ambiguo: true, parecidos: empiezan.slice(0, 6) };
  const contienen = [...new Set(nombres.filter((x) => x.n.includes(q)).map((x) => x.cmd.nombre))];
  return { cmd: null, parecidos: contienen.slice(0, 3) };
}

// Ejecuta una línea escrita. Nunca tira: siempre devuelve { ok, texto, lineas? , cerrar?, limpiar? }
export function ejecutar(linea, m) {
  const partes = partir(linea);
  if (!partes.length) return no(R.vacia, { vacia: true });
  const b = buscarComando(partes[0]);
  if (!b.cmd) return no(b.ambiguo ? R.ambiguo(partes[0], b.parecidos) : R.noEntendi(partes.slice(0, 3).join(' '), b.parecidos));
  try {
    const r = b.cmd.correr(partes.slice(1), m);
    return r && typeof r.texto === 'string' ? r : no(R.noEntendi(partes[0], []));
  } catch (err) {
    return no('No pude hacerlo y dejé todo como estaba. Probá de nuevo o escribí «ayuda»');
  }
}

// ------------------------------------------------------------------ autocompletado
// Las sugerencias para lo que se está escribiendo: [{ completa, etiqueta, ayuda }]. `completa` es la línea entera ya completada.
export function sugerir(linea, m) {
  const texto = String(linea ?? '').slice(0, LINEA_MAX);
  if (!texto.trim()) return [];
  const partes = partir(texto);
  const terminaEnEspacio = /\s$/.test(texto);
  if (partes.length === 1 && !terminaEnEspacio) {
    const q = normalizar(partes[0]);
    const vistos = new Set(), salida = [];
    for (const g of Object.keys(GRUPOS)) for (const c of COMANDOS) {
      if (c.grupo !== g || vistos.has(c.nombre)) continue;
      if ([c.nombre, ...c.alias].some((n) => normalizar(n).startsWith(q))) { vistos.add(c.nombre); salida.push({ completa: c.nombre + (AYUDA[c.nombre].uso.includes(' ') ? ' ' : ''), etiqueta: c.nombre, ayuda: AYUDA[c.nombre].linea }); }
    }
    return salida;
  }
  const b = buscarComando(partes[0]);
  if (!b.cmd || !b.cmd.sugerir) return [];
  const previos = terminaEnEspacio ? partes.slice(1) : partes.slice(1, -1);
  const parcial = terminaEnEspacio ? '' : partes[partes.length - 1];
  const i = previos.length;
  let valores = [];
  try { valores = b.cmd.sugerir(i, previos, m) || []; } catch { valores = []; }
  const q = normalizar(parcial);
  const base = [b.cmd.nombre, ...previos].join(' ');
  return [...new Set(valores)].filter((v) => normalizar(v).startsWith(q) && normalizar(v) !== q).slice(0, 12).map((v) => ({ completa: `${base} ${v}`, etiqueta: v, ayuda: '' }));
}
const prefijoComun = (lista) => lista.reduce((a, b) => { let i = 0; while (i < a.length && i < b.length && a[i].toLowerCase() === b[i].toLowerCase()) i++; return a.slice(0, i); });
// Tab: la primera vez completa lo que tienen en común las sugerencias (o la primera si ya no hay más); las siguientes dan vuelta por ellas.
// `base` es la línea tal como estaba antes del primer Tab; `vuelta` cuántos Tab seguidos van (0 la primera).
export function completar(base, m, vuelta = 0) {
  const opciones = sugerir(base, m);
  if (!opciones.length) return { linea: base, opciones, indice: -1 };
  if (opciones.length === 1) return { linea: opciones[0].completa, opciones, indice: 0 };
  const comun = prefijoComun(opciones.map((o) => o.completa));
  const extiende = comun.length > base.trimStart().length;
  if (vuelta === 0 && extiende) return { linea: comun, opciones, indice: -1 };
  const k = (extiende ? vuelta - 1 : vuelta) % opciones.length;
  return { linea: opciones[k].completa, opciones, indice: k };
}

// ------------------------------------------------------------------ historial (flechas arriba y abajo)
export function crearHistorial(max = HISTORIAL_MAX) {
  const lista = [];
  let cursor = 0, borrador = '';
  return {
    agregar(linea) {
      const t = String(linea ?? '').trim().slice(0, LINEA_MAX);
      if (t && lista[lista.length - 1] !== t) lista.push(t);
      while (lista.length > max) lista.shift();
      cursor = lista.length; borrador = '';
    },
    // flecha arriba: lo anterior (guarda lo que estabas escribiendo la primera vez)
    anterior(actual = '') {
      if (!lista.length) return actual;
      if (cursor >= lista.length) borrador = String(actual ?? '');
      cursor = Math.max(0, cursor - 1);
      return lista[cursor];
    },
    // flecha abajo: lo siguiente; al pasar el último vuelve a lo que estabas escribiendo
    siguiente(actual = '') {
      if (cursor >= lista.length) return actual;
      cursor++;
      return cursor >= lista.length ? borrador : lista[cursor];
    },
    reiniciar() { cursor = lista.length; borrador = ''; },
    lista: () => lista.slice(),
  };
}
