// 4.18.4 (A): ayuda para las pruebas de la Historia «por dentro». Un jugador de mentira que juega los trece capítulos con los módulos de verdad
// (historia.js, los disparadores, el director de escenas con los efectos y las condiciones registrados) sobre un mundo generoso: todo lo que el juego
// puede dar existe (cada lugar a mano, la hora y el lugar al azar, los hechos del mundo —talar, construir, cocinar…— en cualquier orden), así que si se
// traba, el atasco es de la historia y no del mundo. También un documento y un juego de mentira para correr la UI de la historia (historia-ui.js).
// Todo sale de `A4184_SRC` (una copia de src/ con una mutación) o, por defecto, de src/.
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();   // (historia-ui.js importa historia-presencia.js, que usa three)
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = process.env.A4184_SRC || join(raiz, 'src');
export const imp = (f) => import(pathToFileURL(join(SRC, f)).href);

export const H = await imp('historia.js');
export const D = await imp('historia-disparadores.js');
export const E = await imp('historia-escenas-efectos.js');
export const ES = await imp('escenas.js');
export const O = await imp('historia-optativas.js');
export const A3D = await imp('historia-disparadores-acto3.js');
export const A2D = await imp('historia-disparadores-acto2.js');
export const UI = await imp('historia-ui.js');
const A1 = await imp('historia-escenas-acto1.js'), A2 = await imp('historia-escenas-acto2.js'), A3 = await imp('historia-escenas-acto3.js');
const AO = await imp('historia-escenas-optativas.js'), AL = await imp('historia-escenas-lazos.js');
export const ESC = { ...A1.ESCENAS_ACTO1, ...A2.ESCENAS_ACTO2, ...A3.ESCENAS_ACTO3, ...AO.ESCENAS_OPTATIVAS, ...AL.ESCENAS_LAZOS };
export const TODOS_EF = [...new Set([...A1.EFECTOS_ACTO1, ...A2.EFECTOS_ACTO2, ...A3.EFECTOS_ACTO3, ...AO.EFECTOS_OPTATIVAS, ...AL.EFECTOS_LAZOS])];

export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// los lugares con nombre que alguien pide (disparadores, objetivos, objetos del mundo)
export function lugaresPedidos() {
  const r = new Set(D.LUGARES_HISTORIA);
  for (const d of Object.values(D.DISPARADORES)) if (d.lugar) r.add(d.lugar[0]);
  for (const c of H.CAPITULOS) for (const o of c.objetivos) {
    const src = String(o.hecho || '') + String(o.cuenta || '');
    for (const m of src.matchAll(/(?:llegar|esperar|acompanantEn)\(\s*(?:'[a-z]+'\s*,\s*)?'([a-z0-9-]+)'/g)) r.add(m[1]);
    for (const m of src.matchAll(/lugares\??\.\[?'([a-z0-9-]+)'\]?/g)) r.add(m[1]);
    for (const m of src.matchAll(/lugares\?\.([a-z0-9]+)/g)) r.add(m[1]);
  }
  for (const o of Object.values(D.OBJETOS)) for (const k of [o.lugar, o.punto, o.hasta]) if (typeof k === 'string') r.add(k);
  return r;
}
export const LISTA_LUGARES = [...lugaresPedidos()];
export const CLAVES_HABLAR = [...new Set([...Object.values(D.DISPARADORES).filter((d) => d.modo === 'hablar').map((d) => d.clave), ...H.VECINOS_HISTORIA])];
const POBLADORES = ['panadera', 'carpintero', 'herrero', 'tejedora', 'apicultor', 'fotografa', 'enfermera', 'martin', 'tobias', 'belisario', 'abuela'];

export function nuevaPartida(opc = {}) {
  const P = {
    dia: 1, horas: 18.25, entradas: {}, cosas: {}, materiales: {}, acopio: {}, encargos: {}, obras: [], huerta: {}, comercio: { entregas: 0 }, cocina: { hechas: {} },
    aldea: { pobladores: [] }, eventosValle: { hechos: {} }, economia: { pesos: 0 }, concursos: { cintas: [] }, visitas: { ultima: 0, cuenta: 0, activa: null, recibidas: 0 },
    peces: {}, talados: [], taladosTotal: 0, cosechasTotal: 0, renovales: [], historia: H.historiaNueva(),
  };
  const X = { terminadas: [], fuego: false, vecinos: true, lugares: {}, estacion: 'verano', estacionNatural: 'verano', sentado: false, conduciendo: false, enKayak: false, enVela: false,
    apuntaArbolVivo: false, visitaActiva: null, coihue: { x: 0, z: 0 }, amor: !!opc.amor, perro: !!opc.perro, cumple: null };
  H.empezarHistoria(P.historia, 1);
  return { P, X };
}

// El mundo de las escenas y el director real, con todos los efectos y condiciones de la historia registrados
export function crear(opc = {}) {
  const { P, X } = opc.P ? { P: opc.P, X: opc.X } : nuevaPartida(opc);
  const rnd = rng(opc.semilla || 1);
  const errores = [];
  const gastos = [];
  const mundo = {
    posicion: () => ({ x: 0, z: 0, y: 0 }), suelo: () => 0, camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 60 }), horaActual: () => P.horas, puedeEmpezar: () => true,
    hora(h, info) { const antes = P.horas; P.horas = ((h % 24) + 24) % 24; const d = Number(info?.delta); const cruzo = Number.isFinite(d) ? d > 0 && P.horas < antes : antes - P.horas > 12; if (cruzo) P.dia++; },
  };
  const dir = ES.crearDirector({ mundo, estado: () => ES.escenasDe(P.historia), dia: () => P.dia, alError: (t) => errores.push(t) });
  for (const e of Object.values(ESC)) { const r = dir.registrar(e); if (!r.ok) errores.push('registro ' + e.id + ' ' + r.errores.join()); }
  const hist = () => P.historia;
  const estado = () => H.estadoHistoria(P, X);
  const ctxEf = { historia: hist, dia: () => P.dia, estado, opcionDeEvento: (id) => P.eventosValle.hechos[id]?.opcion };
  E.registrarEfectosHistoria(dir, ctxEf);
  E.registrarEfectosActo1(dir, { ...ctxEf, dar: (c, n) => { P.cosas[c] = (P.cosas[c] || 0) + n; }, mundo: () => {}, duende: () => {}, quitar: (c, n) => { gastos.push([c, n]); }, nocheReintentar: () => {} }, TODOS_EF);
  return { P, X, rnd, errores, gastos, dir, hist, estado, mundo };
}

export function aplicar(S) {
  const { P } = S;
  return D.aplicarVistas(S.hist(), P.dia, { eventos: P.eventosValle?.hechos, dar: (c, n) => { P.cosas[c] = (P.cosas[c] || 0) + n; }, tieneCaballo: () => !!P.cosas.caballo, gastar: () => {}, pagar: () => {}, regalo: () => 'yerba', cuanto: (k) => (P.entradas[k]?.cantidad || 0) + (P.cosas[k] || 0), cobrar: () => {}, aviso: () => {} });
}

// Corre una escena entera con las elecciones que da `eligeCon(i, n)` (por defecto al azar), a veces saltándola
export function correrEscena(S, id, opc = {}) {
  const { dir, rnd } = S;
  if (!dir.disparar(id, opc)) return false;
  const saltar = opc.saltar ?? (rnd() < 0.25);
  const elige = opc.elige || ((n) => Math.floor(rnd() * n));
  let t = 0;
  for (let i = 0; i < 20000 && dir.activa(); i++) {
    dir.actualizar(0.1);
    const d = dir.datos();
    if (d?.eleccion) { dir.elegir(elige(d.eleccion.opciones.length, d.eleccion.opciones)); continue; }
    if (d?.dialogo) { dir.acelerar(true); dir.avanzar(); }
    if (saltar && ++t === 4) { dir.pedirSaltar(); dir.pedirSaltar(); }
  }
  if (dir.activa()) S.errores.push('la escena no termino: ' + id);
  aplicar(S);
  return true;
}

// Juega la historia de punta a punta. Devuelve { fin, capitulos, atascado, S }.
export function jugar(semilla, opc = {}) {
  const S = crear({ semilla, ...opc });
  const { P, X, rnd, dir } = S;
  const h = S.hist();
  const r = (n) => Math.floor(rnd() * n);
  const termin = (id, x = 0, z = 0) => { if (!X.terminadas.some((o) => o.id === id)) X.terminadas.push({ id, x, z }); };
  const sumar = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
  const evento = (id, opcion = 'ayudar') => { P.eventosValle.hechos[id] = { dia: P.dia, opcion }; };
  const HECHOS = [
    () => { P.entradas.refugio = { cantidad: 1 }; }, () => { X.fuego = true; }, () => { P.entradas['planta' + Object.keys(P.entradas).length] = { cantidad: 1 }; },
    () => { P.cosas.hacha = true; }, () => { P.entradas.viaje = { cantidad: 1 }; }, () => { P.taladosTotal++; },
    () => termin('banco-trabajo'), () => termin('galponcito'), () => termin('molino-agua'), () => termin('estufa-hierro'),
    () => { X.terminadas = X.terminadas.filter((o) => o.id !== 'aserradero'); X.terminadas.push({ id: 'aserradero', x: rnd() < 0.5 ? 0 : 60, z: 0 }); },
    () => { termin('mesa-campo', 5, 5); X.terminadas.push({ id: 'banco', x: 6, z: 5 }, { id: 'banco', x: 4, z: 5 }); },
    () => { P.obras = [{ plano: 'lenera', lenera: { secos: 8 } }]; }, () => { P.cosas.manta = true; },
    () => { P.visitas.recibidas++; }, () => evento('tobillo', ['ayudar', 'seguir'][r(2)]), () => evento('derrumbe', ['ayudar', 'seguir'][r(2)]), () => evento('puente', ['arreglar', 'cartel', 'nada'][r(3)]), () => evento('oveja', ['perro', 'buscar'][r(2)]),
    () => { X.conduciendo = true; }, () => { P.comercio.entregas++; }, () => { P.huerta['c' + r(9)] = {}; }, () => { P.cosechasTotal++; },
    () => { h.molido = Math.min(9999, h.molido + 1 + r(5)); }, () => { sumar(P.cocina.hechas, 'pan', 1); }, () => { sumar(P.cosas, 'harina', 1 + r(5)); }, () => { sumar(P.materiales, 'piedra', 5); },
    () => { sumar(P.materiales, 'tabla', 3); }, () => { sumar(P.materiales, 'lana', 1); }, () => { P.economia.pesos += 300; }, () => { sumar(P.cosas, 'yerba', 2); },
    () => { P.entradas.pluma = { cantidad: (P.entradas.pluma?.cantidad || 0) + 1 }; }, () => { P.entradas.canto = { cantidad: (P.entradas.canto?.cantidad || 0) + 3 }; },
    () => { P.cosas.caballo = true; }, () => { const c = POBLADORES[r(POBLADORES.length)]; if (!P.aldea.pobladores.some((x) => x.clave === c)) P.aldea.pobladores.push({ clave: c }); },
    () => { X.enKayak = rnd() < 0.5; }, () => { X.sentado = rnd() < 0.5; }, () => { X.visitaActiva = [null, 'nicanor', 'ramon'][r(3)]; }, () => { X.apuntaArbolVivo = rnd() < 0.5; },
    () => { P.encargos['e' + r(5)] = ['pedido', 'hecho'][r(2)]; }, () => { H.marcarObjeto(h, ['foto-movida', 'frasco-masa-madre'][r(2)], P.dia); H.marcarTema(h, 'obj', ['foto-movida', 'llavecita'][r(2)], P.dia); },
    () => { P.entradas['pan-casero'] = { cantidad: 2 }; P.entradas.pinon = { cantidad: 3 }; P.entradas.miel = { cantidad: 1 }; }, () => { P.cosas['llave-79'] = true; },
    () => { H.marcarTema(h, 'mundo', ['coihue-talado', 'cantos-veta', 'tropa-mulas', 'fogon-leyenda', 'pinones-en-tocon', 'cuchara-en-techo', 'puertita-a-la-noche'][r(7)], P.dia); },
    () => { H.marcarTema(h, 'arreo', ['galpon-esquila', 'puesto-paso', 'oveja-ramon', 'corral-ramon'][r(4)], P.dia); }, () => { H.sumarBlanco(h, ['paso', 'esquila'][r(2)]); },
    () => { H.marcarTema(h, 'majada', 'dia' + P.dia, P.dia); },
    () => { P.concursos.cintas = [{ id: 'dulce', puesto: 1 }]; }, () => { X.cumple = rnd() < 0.5 ? { quien: 'ercilia' } : null; },
    () => { P.cosas['tabla-coihue'] = 6; },
  ];
  const lugaresAzar = () => { X.lugares = {}; for (const l of LISTA_LUGARES) X.lugares[l] = 999; const n = 1 + r(3); for (let i = 0; i < n; i++) X.lugares[LISTA_LUGARES[r(LISTA_LUGARES.length)]] = r(20); };
  const natural = () => ['verano', 'otono', 'invierno'][Math.min(2, H.capituloActual(h).acto - 1)];
  const tiempo = (dh) => { P.horas += dh; while (P.horas >= 24) { P.horas -= 24; P.dia++; } };
  const reporte = { semilla, capitulos: 0, atascado: null };
  let pasosCap = 0, capAnterior = -1;
  for (let paso = 0; paso < 80000; paso++) {
    if (h.fase === 'fin') { reporte.fin = true; break; }
    if (h.capitulo !== capAnterior) { capAnterior = h.capitulo; pasosCap = 0; reporte.capitulos++; }
    if (++pasosCap > (opc.tope || 9000)) { reporte.atascado = { cap: H.capituloActual(h).id, fase: h.fase, pendientes: H.capituloActual(h).objetivos.filter((o) => h.hechos[`${H.capituloActual(h).id}:${o.id}`] === undefined).map((o) => o.id) }; break; }
    if (rnd() < 0.5) tiempo(0.25 + rnd() * 3);
    if (opc.alPaso) opc.alPaso(h, P, paso);   // 4.23.0 (B): un gancho para mirar la partida paso a paso (los logros: cuándo se cumple cada uno)
    lugaresAzar(); X.estacionNatural = natural();
    X.estacion = H.estacionForzada(h, H.estadoHistoria(P, X)) || X.estacionNatural;
    if (rnd() < 0.35) HECHOS[r(HECHOS.length)]();
    X.conduciendo = X.conduciendo && rnd() < 0.5;
    let s = H.estadoHistoria(P, X);
    H.revisarHistoria(h, s); H.revisarNoche(h); aplicar(S);
    s = H.estadoHistoria(P, X);
    O.revisarOptativas(h, s, P.dia);
    if (h.fase === 'intro') { if (!H.puertaDeEstacion(h, s)) H.arrancarCapitulo(h, s); continue; }
    if (h.fase === 'outro') { const rc = H.cerrarCapitulo(h, P.dia); if (rc && !rc.fin) D.alCerrarCapitulo(h, rc.capitulo.id, P.dia); continue; }
    if (dir.activa()) continue;
    if (H.capituloActual(h).id === 'nevada' && h.duendes.noche === 'pendiente' && h.escenas.vistas['noche-espera'] && rnd() < 0.3) { h.duendes.noche = rnd() < 0.6 ? 'ganada' : 'perdida'; continue; }
    const dec = H.decisionPendiente(h, s);
    if (dec && rnd() < 0.5) { const ops = dec.opciones.filter((o) => !o.requiere || o.requiere(s)); const eg = opc.decide ? opc.decide(dec.id, ops.map((o) => o.id)) : null; H.tomarDecision(h, dec.id, (ops.find((o) => o.id === eg) || ops[r(ops.length)]).id, s, P.dia); continue; }   // (4.23.0: `opc.decide` elige a propósito)
    const modo = r(4);
    let id = null;
    if (modo === 0) id = D.escenaPendiente(h, s, { modo: 'auto', apuntaArbolVivo: s.apuntaArbolVivo, visitaActiva: s.visitaActiva });
    else if (modo === 1) { const clave = CLAVES_HABLAR[r(CLAVES_HABLAR.length)]; if (H.VECINOS_HISTORIA.includes(clave)) H.anotarCharla(h, clave); id = D.escenaPendiente(h, s, { modo: 'hablar', clave }); }
    else if (modo === 3) { if (Number(s.lugares['refugio-puerta']) <= 4) id = D.escenaPendiente(h, s, { modo: 'interaccion', clave: 'puerta-refugio' }); }
    else {
      const vis = D.objetosVisibles(h, s);
      if (vis.length) {
        const oid = vis[r(vis.length)];
        const a = D.accionDeObjeto(oid, h, s);
        if (a) {
          if (a.tipo === 'marca') { H.marcarObjeto(h, a.marca, P.dia); if (a.raro) H.anotarRaro(h, a.raro, P.dia); if (a.limpiaAcompanante) h.acompanante = null; }
          else if (a.tipo === 'reparar') H.sumarReparacion(h, a.id, a.n);
          else if (a.tipo === 'pagina') { const n = A2D.proximaPagina(s); if (n) { if (dir.hay('cuaderno-' + n)) { H.marcarTema(h, 'cuaderno', String(n), P.dia); correrEscena(S, 'cuaderno-' + n); } else A2D.leerPagina(h, s, P.dia); } }
          else if (a.tipo === 'cuidar') H.marcarTema(h, 'majada', 'dia' + P.dia, P.dia);
          else if (a.tipo === 'bolsa') { if (a.accion === 'llenar') A3D.llenarBolsa(h, P.dia); }
          else if (a.tipo === 'escena') id = D.escenaPendiente(h, s, { modo: 'interaccion', clave: oid });
        }
      }
    }
    if (id) {
      if (!dir.hay(id)) { ES.marcarVista(h, id, P.dia); aplicar(S); }
      else correrEscena(S, id, opc.escena || {});   // (4.23.0: `opc.escena` = { elige, saltar } para jugar a propósito)
    }
  }
  reporte.errores = S.errores;
  reporte.S = S;
  return reporte;
}

// ---------------------------------------------------------------- la UI de la historia con un documento de mentira
function el(tag = 'div') {
  const e = {
    tag, children: [], style: {}, dataset: {}, _cl: new Set(), innerHTML: '', textContent: '', offsetTop: 0, offsetHeight: 0, parentNode: null,
    classList: { add(...c) { c.forEach((x) => e._cl.add(x)); }, remove(...c) { c.forEach((x) => e._cl.delete(x)); }, toggle(c, v) { if (v === undefined ? !e._cl.has(c) : v) e._cl.add(c); else e._cl.delete(c); }, contains: (c) => e._cl.has(c) },
    addEventListener() {}, appendChild(c) { e.children.push(c); c.parentNode = e; return c; }, querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, after() {}, before() {}, closest: () => null, focus() {}, contains: () => false, remove() {},
  };
  return e;
}
export const documentoFalso = () => ({ createElement: (t) => el(t), getElementById: () => null, body: el('body'), head: el('head'), addEventListener() {}, querySelector: () => null, activeElement: null });

// `opc`: { P, X (una partida), relaxTipo }. Devuelve { S, P, X, valle, ajustes, notas, guardados, getModo, dir }.
export function crearJuego(opc = {}) {
  const S = crear({ semilla: opc.semilla || 1, amor: opc.amor, perro: opc.perro, P: opc.P, X: opc.X });
  const { P, X, dir } = S;
  const ajustes = { relaxTipo: opc.relaxTipo || 'historia', modo: 'relax', romance: true };
  let modo = 'jugando';
  const notas = [], guardados = [];
  const nm = { _a: false, _o: null, _t: 0, activa() { return this._a; }, preparar() {}, pausar() {}, hud() { return null; }, practicar() { return 0; }, iniciar(o) { this._a = true; this._o = o; this._t = 0; return true; }, abandonar() { if (this._a) { this._a = false; this._o.alTerminar({ motivo: 'abandono', gano: false }); } }, actualizar(dt) { if (!this._a) return; this._t += dt; if (this._t > 2) { this._a = false; this._o.alTerminar({ gano: S.rnd() < 0.5, modo: this._o.modo, motivo: 'puerta' }); } } };
  const ctx = {
    documento: documentoFalso(), esDesafio: false, nota: (t, s) => notas.push([t, s]), guardar: () => guardados.push(JSON.stringify(P.historia)), sumarMaterial() {}, traducir() {},
    presencia: { pedirGalpon() {}, cercaDelGalpon: () => false }, alActivarHistoria() {}, noche: nm, creditos() { notas.push(['creditos']); }, teclaVisible: (t) => t, sinAzar: () => true,
    progreso: () => P, ajustes: () => ajustes, guardarAjustes() {}, modo: () => modo, pausar: () => { modo = 'valle'; }, reanudar: () => { modo = 'jugando'; },
    libre: () => true, enVehiculo: () => false, extra: () => X,
    escenas: () => ({ activa: () => dir.activa(), hay: (id) => dir.hay(id), disparar: (id, o) => dir.disparar(id, o) }),
    objetos: { mostrar() {} }, permitirVehiculo() {}, puedeEscena: () => true, enAgua: () => false, colocar() {}, levantar() {}, gastarTabla: () => true, comenzarEnEstacion() {},
    refrescarBarra() {}, cobrar: (pr) => { notas.push(['cobrar', JSON.stringify(pr)]); }, encargosLista: () => [], pagar: () => true, darMaterial() {}, darEntrada() {}, tienePerro: () => !!X.perro, puntoDe: () => null, jugadorAlGalpon() {},
    darCosa: (c, n) => { P.cosas[c] = (P.cosas[c] || 0) + n; }, gastar: (c, n) => { P.cosas[c] = Math.max(0, (P.cosas[c] || 0) - n); }, diario() {}, sonido: () => ({ anotar() {}, juntar() {} }),
    pronostico: () => null, lluvia: () => 0, helarHuerta() {}, taparHuerta() {}, obras: () => null, altura: () => 0, sincronizarObras() {}, devolverContenido() {}, alDecidirDuendes() {},
  };
  const valle = UI.crearValleUi(ctx);
  return { S, P, X, valle, ctx, ajustes, notas, guardados, getModo: () => modo, dir };
}
