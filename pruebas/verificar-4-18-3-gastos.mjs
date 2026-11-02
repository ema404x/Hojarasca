// 4.18.3: tres cosas de la Historia que antes no hacían nada.
//   1. «D5 A sin costo»: que la lleve Fermín (D5 = a) le cuesta a Ramón −1, salvo que Fermín ya confíe en vos (lazo +2 o más) AL DECIDIR; la tarjeta lo dice en palabras.
//   2. «Visitar a Ramón» (capítulo 9): hace falta algo rico y se gasta uno.
//   3. «Herminia y los noventa» (capítulo 8): hace falta lo dulce de la torta y se gasta uno.
// Para las tres: sin el regalo la escena no sale (la E sigue siendo la charla de siempre), el tablón y la guía dicen qué llevar, se avisa en pantalla lo que se gastó,
// se gasta UNA sola vez (aunque la escena se repita o la partida se guarde y se cargue) y nunca se traba nada. Sólo Node: las escenas se corren con el director real (escenas.js).
// Al final, mutaciones (cada una en un proceso aparte, sobre una copia de src/ con otro nombre, para que el caché de ESM no mida sólo la primera).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.GASTOS_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const leerSrc = (f) => readFileSync(join(SRC, f), 'utf8');
const imp = (f) => import(pathToFileURL(join(SRC, f)).href);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.GASTOS_CALLADO) console.log('FALLA ' + t); } };

const H = await imp('historia.js');
const D = await imp('historia-disparadores.js');
const DO = await imp('historia-disparadores-optativas.js');
const O = await imp('historia-optativas.js');
const R = await imp('historia-regalos.js');
const EF = await imp('historia-escenas-efectos.js');
const EN = await imp('escenas.js');
const CP = await imp('cocina-pasos.js');
const E3 = await imp('historia-escenas-acto3.js');
const U3 = await imp('historia-escenas-acto3-util.js');
const TO = (await imp('historia-texto-optativas.js')).TEXTO_OPTATIVAS;
const T2 = (await imp('historia-texto-acto2.js')).TEXTO_ACTO2;
const T3 = (await imp('historia-texto-acto3.js')).TEXTO_ACTO3;
const EC9 = (await imp('historia-escenas-acto3-c9.js')).ESCENAS_C9;

const IDX = Object.fromEntries(H.CAPITULOS.map((c, i) => [c.id, i]));
const progresoBase = () => ({ dia: 6, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, economia: { pesos: 1000 }, eventosValle: { hechos: {} }, concursos: { cintas: [] }, historia: H.historiaNueva() });
const armar = (capId, { dec = {}, dia = 6, horas = 10, lazos = {}, vistas = [] } = {}) => {
  const p = progresoBase(); p.dia = dia; p.horas = horas;
  const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = IDX[capId]; h.fase = 'jugando'; h.base = { dia }; h.cerrados = { ramal: dia - 3, cuaderno: dia - 1, nevada: dia - 1 };
  Object.assign(h.decisiones, dec);
  for (const [q, v] of Object.entries(lazos)) h.lazos[q] = v;
  for (const id of vistas) EN.marcarVista(h, id, dia);
  return { p, h };
};
const E = (p, extra = {}) => H.estadoHistoria(p, { estacionNatural: 'otono', estacion: 'otono', lugares: {}, ...extra });
const quien = (h, p, ctx, extra = {}) => D.escenaPendiente(h, E(p, extra), ctx);
const dar = (p, k, c, donde = 'entradas') => { if (donde === 'entradas') p.entradas[k] = { dia: 1, hora: 1, cantidad: c }; else p.cosas[k] = c; };

// ---------------------------------------------------------------- un mundo de mentira y el director real
function mundoFalso() {
  const claves = ['guarda', 'ramon', 'ema', 'ercilia', 'nicanor', 'nelida', 'jefe', 'abuela', 'panadera', 'fermin', 'graciela', 'carpintero', 'tobias', 'belisario', 'nene', 'nena', 'fotografa', 'enfermera', 'martin', 'herrero', 'apicultor', 'tejedora', 'pareja'];
  const actores = {};
  claves.forEach((k, i) => { actores[k] = { x: 30 + i * 3, y: 0, z: -20 - i * 2, meta: null, vel: 1.4, capt: false, visible: true }; });
  const lugares = { refugio: { x: -120, z: 232 }, estacion: { x: 300, z: 90 }, almacen: { x: 60, z: 40 }, galpon: { x: 228, z: -110 }, mirador: { x: -292, z: 36 }, molino: { x: -80, z: 120 }, faro: { x: -200, z: 300 }, muelle: { x: -150, z: 260 }, mallin: { x: 100, z: -200 } };
  const w = {
    actores, hv: 18,
    puedeEmpezar: () => true,
    posicion(ref) {
      if (ref === 'jugador') return { x: 0, y: 0, z: 0 };
      if (typeof ref === 'string') { const a = Object.hasOwn(actores, ref) ? actores[ref] : null; return a ? { x: a.x, y: a.y, z: a.z } : null; }
      if (ref && typeof ref.lugar === 'string') { const l = Object.hasOwn(lugares, ref.lugar) ? lugares[ref.lugar] : null; return l ? { x: l.x + (ref.dx || 0), z: l.z + (ref.dz || 0) } : null; }
      if (ref && ref.frente === 'jugador') return { x: ref.lado || 0, z: -(ref.dist ?? 3) };
      if (ref && typeof ref.frente === 'string' && Object.hasOwn(actores, ref.frente)) { const a = actores[ref.frente]; return { x: a.x + (ref.lado || 0), z: a.z - (ref.dist ?? 3) }; }
      return null;
    },
    suelo: () => 0,
    camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0.3, pitch: -0.1, fov: 70 }),
    horaActual: () => w.hv, hora(h) { w.hv = h; }, clima() {}, sonido() {},
    capturar(k) { if (actores[k]) actores[k].capt = true; },
    soltar(k) { if (actores[k]) actores[k].capt = false; },
    caminar(k, d, o) { if (actores[k]) { actores[k].meta = d; actores[k].vel = o?.vel || 1.4; } },
    ocupado: (k) => !!actores[k]?.meta,
    mirar() {}, posar() {},
    aparecer(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, y: p.y ?? 0, z: p.z, visible: true, meta: null }); },
    desaparecer(k) { if (actores[k]) actores[k].visible = false; },
    teletransportar(k, p) { if (actores[k]) Object.assign(actores[k], { x: p.x, z: p.z, meta: null }); },
    alEmpezar() {}, alTerminar() {},
    simular(dt) {
      for (const a of Object.values(actores)) {
        if (!a.meta) continue;
        const dx = a.meta.x - a.x, dz = a.meta.z - a.z, d = Math.hypot(dx, dz), paso = a.vel * dt;
        if (d <= paso + 0.2) { a.x = a.meta.x; a.z = a.meta.z; a.meta = null; } else { a.x += dx / d * paso; a.z += dz / d * paso; }
      }
    },
  };
  return w;
}
// Corre una escena de punta a punta con los efectos y las condiciones REALES (historia-escenas-efectos.js) sobre la historia `h` y el estado de partida `p`.
// `script`: la opción que se toma en cada elección. Devuelve { lineas, elecciones }.
function correr(escena, h, p, script = []) {
  const mundo = mundoFalso();
  const efectos = {}, condiciones = {};
  const reg = { registrarEfecto: (nombre, f) => { efectos[nombre] = f; }, registrarCondicion: (nombre, f) => { condiciones[nombre] = f; } };
  const ctx = { historia: () => h, dia: () => p.dia, estado: () => E(p), opcionDeEvento: () => undefined };
  EF.registrarEfectosHistoria(reg, ctx);
  EF.registrarEfectosActo1(reg, { ...ctx, dar: () => {}, mundo: () => {}, duende: () => {}, quitar: () => {} }, E3.EFECTOS_ACTO3);
  const dir = EN.crearDirector({ mundo, estado: () => h.escenas, dia: () => p.dia, efectos, condiciones, alTerminar: () => {} });
  const r = dir.registrar(escena);
  const log = { lineas: [], elecciones: [], registro: r.ok };
  if (!r.ok || !dir.disparar(escena.id)) return { ...log, noDisparo: true };
  let ultima = '', i = 0, k = 0;
  while (dir.activa() && i++ < 60000) {
    mundo.simular(0.05);
    dir.actualizar(0.05);
    const d = dir.datos();
    if (d?.eleccion) { const idx = k < script.length ? script[k] : 0; log.elecciones.push(d.eleccion.opciones[idx]?.id); k++; dir.elegir(idx); }
    else if (d?.dialogo && d.fase === 'corriendo' && d.dialogo.completo) {
      const clave = `${d.dialogo.nombre}|${d.dialogo.texto}`;
      if (clave !== ultima) { log.lineas.push(d.dialogo.texto); ultima = clave; }
      dir.avanzar();
    }
  }
  log.termino = !dir.activa();
  return log;
}

// ---------------------------------------------------------------- 1. lo que se lleva de regalo (módulo puro)
{
  ok(Array.isArray(R.PARA_RAMON) && Array.isArray(R.PARA_LA_TORTA), 'las dos listas existen');
  // cada id existe de verdad en el juego (la alacena de la cocina, lo juntado o lo que se cambia): no hay un id inventado
  const existe = (k) => Object.hasOwn(CP.COMIDAS, k) || Object.hasOwn(CP.ALACENA_EXTRA, k) || ['pinon', 'trucha-ahumada', 'frasco-frutilla', 'miel', 'empanadas', 'pan-casero'].includes(k);
  for (const k of R.IDS_REGALO) ok(existe(k), `«${k}» es una cosa que existe en el juego`);
  for (const x of [...R.PARA_RAMON, ...R.PARA_LA_TORTA]) ok(Number.isInteger(x.n) && x.n >= 1 && typeof x.nombre === 'string' && x.nombre.length > 3 && typeof x.corto === 'string', `${x.k}: n, nombre y corto`);
  ok(R.PARA_RAMON.some((x) => x.k === 'trucha-ahumada') && R.PARA_RAMON.some((x) => x.k === 'pinon'), 'para Ramón: trucha ahumada y piñones (lo del guion)');
  ok(R.PARA_LA_TORTA.every((x) => /dulce|mermelada|miel|torta/.test(x.nombre)), 'para la torta sólo lo dulce');
  ok(!R.PARA_LA_TORTA.some((x) => ['pan-casero', 'empanadas', 'harina', 'pinon'].includes(x.k)), 'la torta no se arma con pan, empanadas, harina ni piñones');
  ok(!R.PARA_RAMON.some((x) => x.k === 'harina' || x.k === 'yerba'), 'a Ramón no se le lleva harina ni yerba');
  // contar: lo juntado más las cosas
  const p = progresoBase();
  ok(R.cuentaDe(p, 'miel') === 0, 'sin nada: cero');
  dar(p, 'miel', 2); dar(p, 'miel', 1, 'cosas');
  ok(R.cuentaDe(p, 'miel') === 3, 'lo juntado y las cosas se suman');
  ok(R.cuentaDe(null, 'miel') === 0 && R.cuentaDe({}, 'miel') === 0, 'sin progreso: cero');
  // gastar: primero de lo juntado, después de las cosas, sin pasarse
  ok(R.gastarRegalo(p, 'miel', 1) === 1 && p.entradas.miel.cantidad === 1 && p.cosas.miel === 1, 'gasta de lo juntado primero');
  ok(R.gastarRegalo(p, 'miel', 2) === 2 && p.entradas.miel.cantidad === 0 && !Object.hasOwn(p.cosas, 'miel'), 'y después de las cosas (y la deja limpia)');
  ok(R.gastarRegalo(p, 'miel', 1) === 0, 'sin nada no gasta nada');
  ok(R.gastarRegalo(p, 'pinon', 3) === 0 && R.gastarRegalo(null, 'miel', 1) === 0 && R.gastarRegalo(p, 7, 1) === 0, 'cosas raras: cero');
  // elegir: el primero de la lista que alcanza
  const q = progresoBase();
  ok(R.regaloDeProgreso('ramon', q) === null && R.regaloDeProgreso('herminia', q) === null, 'sin nada: ningún regalo');
  dar(q, 'pinon', 2);
  ok(R.regaloDeProgreso('ramon', q) === null, 'dos piñones no alcanzan (un puñado son tres)');
  dar(q, 'pinon', 3); dar(q, 'trucha-ahumada', 1);
  ok(R.regaloDeProgreso('ramon', q)?.k === 'pinon', 'con piñones y trucha, el más barato primero');
  dar(q, 'pinon', 0);
  ok(R.regaloDeProgreso('ramon', q)?.k === 'trucha-ahumada', 'sin piñones, la trucha');
  ok(R.regaloDeProgreso('herminia', q) === null, 'la trucha no es para la torta');
  dar(q, 'dulce-leche', 1);
  ok(R.regaloDeProgreso('herminia', q)?.k === 'dulce-leche', 'el dulce de leche sí');
  ok(R.regaloDe('nadie', () => 9) === null && R.elegirRegalo(null, () => 9) === null && R.elegirRegalo(R.PARA_RAMON, null) === null, 'quién o lista inexistentes: nada');
  for (const x of R.PARA_RAMON) { const z = progresoBase(); dar(z, x.k, x.n, 'cosas'); ok(R.regaloDeProgreso('ramon', z)?.k === x.k, `Ramón recibe ${x.k} (estando en las cosas)`); }
  for (const x of R.PARA_LA_TORTA) { const z = progresoBase(); dar(z, x.k, x.n); ok(R.regaloDeProgreso('herminia', z)?.k === x.k, `Herminia recibe ${x.k}`); }
  // las pistas en palabras (sin números)
  ok(/pi[ñn]ones/.test(R.QUE_LLEVAR_RAMON) && /trucha ahumada/.test(R.QUE_LLEVAR_RAMON) && !/\d/.test(R.QUE_LLEVAR_RAMON), 'QUE_LLEVAR_RAMON dice piñones y trucha ahumada, sin números');
  ok(/miel/.test(R.QUE_LLEVAR_TORTA) && /mermelada/.test(R.QUE_LLEVAR_TORTA) && !/\d/.test(R.QUE_LLEVAR_TORTA), 'QUE_LLEVAR_TORTA dice miel y mermelada, sin números');
}

// ---------------------------------------------------------------- 2. el estado de la partida ve el regalo (y el pan casero del horno)
{
  const { p } = armar('frios');
  ok(E(p).regaloRamon === null && E(p).regaloTorta === null, 'sin nada: sin regalo');
  dar(p, 'trucha-ahumada', 1);
  ok(E(p).regaloRamon === 'trucha-ahumada' && E(p).regaloTorta === null, 'una trucha ahumada: regalo para Ramón, no para la torta');
  dar(p, 'miel', 1, 'cosas');
  ok(E(p).regaloTorta === 'miel', 'la miel (en las cosas) es para la torta');
  const z = armar('mesa').p;
  dar(z, 'pan-casero', 2);
  ok(E(z).pan === 2, 'el pan casero del horno (lo juntado) cuenta para Fermín');
  dar(z, 'pan-casero', 1, 'cosas');
  ok(E(z).pan === 3, 'y el de Rosa (las cosas), también');
}

// ---------------------------------------------------------------- 3. D5 A sin costo (el guion: «desbloquea la opción A de D5 sin penalidad con Ramón si el lazo de Fermín es ≥ +2»)
{
  ok(H.MAJADA_CONFIA === 2, 'la confianza se mide en +2');
  const A = (lazoFermin, { lazoRamon = 0, alElegir = 0 } = {}) => {
    const { h, p } = armar('frios', { lazos: { fermin: lazoFermin, ramon: lazoRamon }, vistas: ['ramon-cama'] });
    const l1 = correr(EC9['fermin-tranquera'], h, p, [alElegir]);
    return { h, p, l1 };
  };
  // la decisión: la escena de la tranquera toma la decisión y anota si Fermín confiaba
  for (const [lz, conf] of [[-2, false], [0, false], [1, false], [2, true], [3, true]]) {
    const { h, l1 } = A(lz);
    ok(l1.termino && h.decisiones.majada === 'a', `lazo ${lz}: la escena de la tranquera decide A`);
    ok(H.majadaSinCosto(h) === conf, `lazo ${lz}: el tema de la confianza ${conf ? 'queda' : 'no queda'} anotado`);
  }
  // el cobro: la escena de la llegada (majada-fermin) resta −1 a Ramón sólo si Fermín no confiaba
  for (const [lz, resta] of [[-2, true], [0, true], [1, true], [2, false], [3, false]]) {
    const { h, p } = A(lz, { lazoRamon: 1 });
    const l2 = correr(EC9['majada-fermin'], h, p, [0]);
    ok(l2.termino, `lazo ${lz}: la escena de la llegada corre entera`);
    ok(h.lazos.ramon === (resta ? 0 : 1), `lazo ${lz}: Ramón ${resta ? 'baja uno' : 'queda como estaba'} (${h.lazos.ramon})`);
    ok(h.lazos.fermin === Math.min(3, lz + 4), `lazo ${lz}: Fermín sube como siempre (${h.lazos.fermin})`);
    ok(h.aplicadas['e:majada-fermin:lazo:ramon:-1'] !== undefined === resta, `lazo ${lz}: el efecto de Ramón ${resta ? 'se anota' : 'no se aplica'}`);
    // repetir la escena no cobra de nuevo
    correr(EC9['majada-fermin'], h, p, [0]);
    ok(h.lazos.ramon === (resta ? 0 : 1), `lazo ${lz}: repetir la escena no vuelve a cobrar`);
  }
  // el lazo de Fermín en el momento de decidir, no el de después: un +3 posterior no borra el cobro, y subir DESPUÉS de decidir no lo evita
  {
    const { h, p } = A(1, { lazoRamon: 1 });
    h.lazos.fermin = 3;   // (mejoró la relación entre la tranquera y la llegada)
    correr(EC9['majada-fermin'], h, p, [0]);
    ok(h.lazos.ramon === 0, 'si Fermín confió DESPUÉS de decidir, A igual cuesta (se mira al decidir)');
  }
  {
    const { h, p } = A(2, { lazoRamon: 1 });
    h.lazos.fermin = 0;   // (se enfrió entre la tranquera y la llegada)
    correr(EC9['majada-fermin'], h, p, [0]);
    ok(h.lazos.ramon === 1, 'si Fermín confiaba AL decidir, A no cuesta aunque después se enfríe');
  }
  // gana la última acción: decidir otra cosa y volver a A mira de nuevo
  {
    const { h } = armar('frios', { lazos: { fermin: 2 } });
    const ef = {}; const cond = {};
    EF.registrarEfectosActo1({ registrarEfecto: (nn, f) => { ef[nn] = f; }, registrarCondicion: () => {} }, { historia: () => h, dia: () => 6 }, ['decision:majada:a', 'decision:majada:b', 'decision:majada:c']);
    ef['decision:majada:a']({}, { escena: 'x' });
    ok(H.majadaSinCosto(h), 'efecto de decisión A con lazo 2: anota');
    ef['decision:majada:a']({}, { escena: 'x' });
    ok(H.majadaSinCosto(h) && h.decisiones.majada === 'a', 'repetir A no lo borra');
    h.lazos.fermin = 0;
    ef['decision:majada:a']({}, { escena: 'x' });
    ok(H.majadaSinCosto(h), 'repetir A (ya decidida) no vuelve a mirar el lazo');
    ef['decision:majada:b']({}, { escena: 'x' });
    ef['decision:majada:a']({}, { escena: 'x' });
    ok(h.decisiones.majada === 'a' && !H.majadaSinCosto(h), 'si cambió de decisión y vuelve a A con Fermín frío, se mira de nuevo: cuesta');
    void cond;
  }
  // las partidas viejas (A ya decidida, sin la marca) siguen igual: cuesta
  {
    const { h, p } = armar('frios', { dec: { majada: 'a' }, lazos: { fermin: 3, ramon: 1 }, vistas: ['ramon-cama', 'fermin-tranquera'] });
    correr(EC9['majada-fermin'], h, p, [0]);
    ok(h.lazos.ramon === 0, 'una partida vieja con A decidida y sin marca: cuesta como antes');
  }
  // B y C no cambian
  {
    const { h, p } = armar('frios', { lazos: { fermin: 3, ramon: 0 }, vistas: ['ramon-cama', 'fermin-tranquera'] });
    correr(EC9['majada-vos'], h, p, [0]);
    ok(h.decisiones.majada === 'b' && h.lazos.ramon === 3 && h.lazos.fermin === 2, 'B: Ramón sube, Fermín baja uno (como antes)');
    ok(!H.majadaSinCosto(h), 'B: sin marca de confianza');
    const c = armar('frios', { lazos: { fermin: 3, ramon: 1 }, vistas: ['ramon-cama', 'fermin-tranquera'] });
    correr(EC9['majada-belisario'], c.h, c.p, [0]);
    ok(c.h.decisiones.majada === 'c' && c.h.lazos.ramon === -2 && c.h.lazos.fermin === 1, 'C: Ramón y Fermín bajan (como antes)');
  }
  // el epílogo sigue levantando a Ramón en la rama A
  {
    const c13 = (await imp('historia-escenas-acto3-c13.js')).ESCENAS_C13;
    const { h, p } = armar('deshielo', { dec: { majada: 'a' }, lazos: { ramon: 0 } });
    correr(c13['majada-fin'], h, p, [0]);
    ok(h.lazos.ramon === 3, 'el epílogo (A) lo levanta: Ramón +3');
  }
  // la tarjeta de la tranquera lo dice en palabras, sin números, según Fermín
  {
    const dicho = (lz) => { const { h, p } = armar('frios', { lazos: { fermin: lz }, vistas: ['ramon-cama'] }); return correr(EC9['fermin-tranquera'], h, p, [0]).lineas.join(' | '); };
    ok(/Ramón lo va a entender/.test(dicho(2)) && !/le va a doler/.test(dicho(2)), 'con Fermín confiado, la escena dice que Ramón lo va a entender');
    ok(/a Ramón le va a doler/.test(dicho(1)) && !/lo va a entender/.test(dicho(1)), 'con Fermín reservado, dice que le va a doler');
    ok(!/\d/.test(dicho(1)) && !/\d/.test(dicho(2)), 'sin números (la escena entera)');
    ok(!/[+−-]\s?\d/.test(dicho(1)) && !/[+−-]\s?\d/.test(dicho(2)), 'ni signos con números');
  }
  {
    const opA = H.DEFINICION_DECISIONES.majada.opciones.find((o) => o.id === 'a');
    ok(typeof opA.palabras === 'function', 'la tarjeta de respaldo: la opción A tiene `palabras`');
    const conf = opA.palabras({ lazos: { fermin: 2 } }), sin = opA.palabras({ lazos: { fermin: 1 } });
    ok(conf !== sin && /entender/.test(conf) && /doler/.test(sin), 'la tarjeta dice una cosa con Fermín confiado y otra sin');
    ok(!/\d/.test(conf + sin + opA.detalle), 'la tarjeta no tiene números');
    ok(H.DEFINICION_DECISIONES.majada.opciones.filter((o) => o.id !== 'a').every((o) => typeof o.palabras !== 'function'), 'B y C no tienen `palabras`');
    // por la tarjeta: tomarDecision anota igual
    const a = armar('frios', { lazos: { fermin: 2 } }), b = armar('frios', { lazos: { fermin: 1 } });
    H.tomarDecision(a.h, 'majada', 'a', E(a.p), 6); H.tomarDecision(b.h, 'majada', 'a', E(b.p), 6);
    ok(H.majadaSinCosto(a.h) && !H.majadaSinCosto(b.h), 'por la tarjeta de respaldo también se mira el lazo al decidir');
    ok(H.tomarDecision(a.h, 'majada', 'c', E(a.p), 6) === null, 'una decisión de la tarjeta es de una sola vez');
    const ui = leerSrc('historia-ui.js');
    ok(/typeof o\.palabras === 'function' \? o\.palabras\(s\)/.test(ui) && /tomarDecision\(h, dec\.id, id, estado\(\), ctx\.progreso\(\)\.dia\)/.test(ui), 'historia-ui.js muestra `palabras` y pasa el día al decidir');
  }
  // el tablón de Fermín dice que hablar sirve
  ok(/majada/i.test(TO.tablon['fermin-habla'].ofrecida) && !/\d/.test(TO.tablon['fermin-habla'].ofrecida), '«Fermín quiere hablar» avisa, en palabras, que sirve para la majada');
  ok(/majada/i.test(T2.capitulos[7].optativas.find((x) => x.id === 'fermin-habla').texto), 'y la guía del capítulo también');
  // la condición está en la convención del acto III y la escena la usa
  ok(U3.CONDICIONES_ACTO3.includes('majada-sin-costo') && U3.CONDICIONES_BOOLEANAS.includes('majada-sin-costo'), 'la condición majada-sin-costo está en la convención');
  ok(JSON.stringify(EC9['majada-fermin']).includes('"majada-sin-costo"'), 'majada-fermin usa la condición');
  ok(JSON.stringify(EC9['majada-vos']).includes('majada-sin-costo') === false && JSON.stringify(EC9['majada-belisario']).includes('majada-sin-costo') === false, 'B y C no la usan');
}

// ---------------------------------------------------------------- 4. visitar a Ramón: hace falta algo rico y se gasta uno
// `fake`: el juego de mentira que da `cuanto` y `gastar` sobre el progreso, como historia-ui.js y main.js
const juego = (p) => {
  const avisos = [], gastos = [];
  return { avisos, gastos, ctx: { cuanto: (k) => R.cuentaDe(p, k), gastar: (k, c) => { gastos.push([k, c]); R.gastarRegalo(p, k, c); }, aviso: (t, d) => avisos.push([t, d]) } };
};
const enSanitario = (extra = {}) => armar('frios', { vistas: ['ramon-cama', 'ramon-sanitario'], horas: 11, ...extra });
{
  const hablar = (h, p) => quien(h, p, { modo: 'hablar', clave: 'ramon' });
  // sin nada, la E sobre Ramón NO dispara la visita (es la charla de siempre)
  const { h, p } = enSanitario();
  ok(hablar(h, p) !== 'visita-ramon', 'sin nada rico: la visita no se dispara');
  dar(p, 'harina', 5, 'cosas'); dar(p, 'yerba', 2, 'cosas'); dar(p, 'huevo', 3);
  ok(hablar(h, p) !== 'visita-ramon', 'harina, yerba y huevos no son algo rico');
  dar(p, 'pinon', 2);
  ok(hablar(h, p) !== 'visita-ramon', 'dos piñones no alcanzan');
  dar(p, 'pinon', 3);
  ok(hablar(h, p) === 'visita-ramon', 'con un puñado de piñones se dispara');
  for (const x of R.PARA_RAMON) { const z = enSanitario(); dar(z.p, x.k, x.n); ok(hablar(z.h, z.p) === 'visita-ramon', `con ${x.k} se dispara`); }
  // fuera de su ventana, o antes de ver a Ramón en el sanitario, no
  { const z = armar('frios', { vistas: ['ramon-cama'], horas: 11 }); dar(z.p, 'trucha-ahumada', 1); ok(hablar(z.h, z.p) !== 'visita-ramon', 'antes de que Ramón esté en el sanitario no se dispara'); }
  { const z = armar('mesa', { vistas: ['ramon-cama', 'ramon-sanitario'] }); dar(z.p, 'trucha-ahumada', 1); ok(hablar(z.h, z.p) !== 'visita-ramon', 'ni fuera de su capítulo'); }
}
{
  // el gasto: uno, una sola vez
  const { h, p } = enSanitario();
  dar(p, 'pinon', 7); dar(p, 'trucha-ahumada', 2); dar(p, 'miel', 1);
  EN.marcarVista(h, 'visita-ramon', 6);
  const J = juego(p);
  const hechos = D.aplicarVistas(h, 6, J.ctx);
  ok(hechos.includes('visita-ramon'), 'aplicarVistas aplica la visita');
  ok(J.gastos.length === 1 && J.gastos[0][0] === 'pinon' && J.gastos[0][1] === 3, 'gasta UNO: un puñado de piñones (el primero de la lista que alcanza)');
  ok(p.entradas.pinon.cantidad === 4 && p.entradas['trucha-ahumada'].cantidad === 2 && p.entradas.miel.cantidad === 1, 'y nada más: quedan 4 piñones, las dos truchas y la miel');
  ok(J.avisos.length === 1 && /Le llevaste un puñado de piñones a Ramón/.test(J.avisos[0][0]) && /soborno/.test(J.avisos[0][1]), 'avisa en pantalla qué le llevaste');
  ok(Object.hasOwn(h.aplicadas, 'visita-ramon') && h.temas['ramon:chocolate'] !== undefined, 'queda anotada y el tema de Chocolate (lo de siempre) también');
  ok(h.entregados['ramon:pinon'] !== undefined, 'queda anotado qué se le entregó');
  // aplicar otra vez, repetir la escena, o guardar y cargar: nada más
  D.aplicarVistas(h, 7, J.ctx);
  EN.marcarVista(h, 'visita-ramon', 7); D.aplicarVistas(h, 7, J.ctx);
  const cargada = H.sanearHistoria(JSON.parse(JSON.stringify(h)));
  D.aplicarVistas(cargada, 8, J.ctx);
  ok(J.gastos.length === 1 && p.entradas.pinon.cantidad === 4 && J.avisos.length === 1, 'aplicar de nuevo, repetir la escena o guardar y cargar no gasta de nuevo');
  ok(Object.hasOwn(cargada.aplicadas, 'visita-ramon'), 'lo aplicado sobrevive al guardado');
  // la optativa queda hecha y su premio sigue siendo el de siempre
  const s = E(p);
  O.revisarOptativas(h, s, 6);
  ok(Object.hasOwn(h.optativas, 'visita-ramon'), 'la optativa queda hecha');
}
{
  // sin regalo cuando se aplica (se fue antes): no gasta, no avisa, no traba
  const { h, p } = enSanitario();
  EN.marcarVista(h, 'visita-ramon', 6);
  const J = juego(p);
  D.aplicarVistas(h, 6, J.ctx);
  ok(J.gastos.length === 0 && J.avisos.length === 0, 'sin nada al aplicarse: no gasta ni avisa');
  ok(Object.hasOwn(h.aplicadas, 'visita-ramon'), 'pero queda aplicada (no se vuelve a intentar)');
  O.revisarOptativas(h, E(p), 6);
  ok(Object.hasOwn(h.optativas, 'visita-ramon'), 'y la optativa se cuenta hecha: nunca traba');
  // sin ctx (pruebas viejas, partidas que cargan antes del juego): sin romper
  const z = enSanitario(); EN.marcarVista(z.h, 'visita-ramon', 6);
  let rompe = false; try { D.aplicarVistas(z.h, 6, {}); D.aplicarVistas(z.h, 6); } catch { rompe = true; }
  ok(!rompe && Object.hasOwn(z.h.aplicadas, 'visita-ramon'), 'sin contexto del juego no se rompe');
  // una partida vieja: escena ya vista y ya aplicada: no gasta aunque hoy tengas de todo
  const v = enSanitario(); EN.marcarVista(v.h, 'visita-ramon', 5); v.h.aplicadas['visita-ramon'] = 5; dar(v.p, 'pinon', 9);
  const Jv = juego(v.p); D.aplicarVistas(v.h, 6, Jv.ctx);
  ok(Jv.gastos.length === 0 && v.p.entradas.pinon.cantidad === 9, 'una partida vieja con la visita ya vista no gasta nada');
}
{
  // el gasto sale de las cosas si no hay juntado, y con el pan de Rosa
  const { h, p } = enSanitario();
  dar(p, 'pan-casero', 1, 'cosas'); EN.marcarVista(h, 'visita-ramon', 6);
  const J = juego(p); D.aplicarVistas(h, 6, J.ctx);
  ok(J.gastos[0]?.[0] === 'pan-casero' && !Object.hasOwn(p.cosas, 'pan-casero'), 'un pan casero de las cosas se gasta de ahí');
}

// ---------------------------------------------------------------- 5. Herminia y los noventa: la torta
const enCuaderno = (extra = {}) => armar('cuaderno', { horas: 11, ...extra });
{
  const hablar = (h, p) => quien(h, p, { modo: 'hablar', clave: 'abuela' });
  const { h, p } = enCuaderno();
  ok(hablar(h, p) !== 'herminia-noventa', 'sin nada dulce: no se dispara');
  dar(p, 'pan-casero', 3); dar(p, 'empanadas', 4); dar(p, 'harina', 6, 'cosas'); dar(p, 'trucha-ahumada', 2); dar(p, 'pinon', 9); dar(p, 'huevo', 4);
  ok(hablar(h, p) !== 'herminia-noventa', 'pan, empanadas, harina, trucha, piñones y huevos no hacen una torta');
  dar(p, 'miel', 1);
  ok(hablar(h, p) === 'herminia-noventa', 'con un frasco de miel se dispara');
  for (const x of R.PARA_LA_TORTA) { const z = enCuaderno(); dar(z.p, x.k, x.n); ok(hablar(z.h, z.p) === 'herminia-noventa', `con ${x.k} se dispara`); }
  { const z = armar('rueda', { horas: 11 }); dar(z.p, 'miel', 1); ok(hablar(z.h, z.p) !== 'herminia-noventa', 'fuera del capítulo 8 no se dispara'); }
}
{
  const { h, p } = enCuaderno();
  dar(p, 'miel', 2); dar(p, 'dulce-leche', 1); dar(p, 'pinon', 9);
  EN.marcarVista(h, 'herminia-noventa', 6);
  const J = juego(p);
  D.aplicarVistas(h, 6, J.ctx);
  ok(J.gastos.length === 1 && J.gastos[0][0] === 'miel' && J.gastos[0][1] === 1, 'gasta UNO (un frasco de miel)');
  ok(p.entradas.miel.cantidad === 1 && p.entradas['dulce-leche'].cantidad === 1 && p.entradas.pinon.cantidad === 9, 'y nada más');
  ok(J.avisos.length === 1 && /Le llevaste un frasco de miel a Herminia/.test(J.avisos[0][0]) && /torta/.test(J.avisos[0][1]), 'avisa qué le llevaste');
  D.aplicarVistas(h, 7, J.ctx); EN.marcarVista(h, 'herminia-noventa', 7); D.aplicarVistas(h, 7, J.ctx);
  D.aplicarVistas(H.sanearHistoria(JSON.parse(JSON.stringify(h))), 8, J.ctx);
  ok(J.gastos.length === 1 && p.entradas.miel.cantidad === 1, 'repetida, o guardada y cargada: no gasta de nuevo');
  O.revisarOptativas(h, E(p), 6);
  ok(Object.hasOwn(h.optativas, 'noventa'), 'la optativa queda hecha');
  const z = enCuaderno(); EN.marcarVista(z.h, 'herminia-noventa', 6); const Jz = juego(z.p); D.aplicarVistas(z.h, 6, Jz.ctx);
  ok(Jz.gastos.length === 0 && Jz.avisos.length === 0 && Object.hasOwn(z.h.aplicadas, 'herminia-noventa'), 'sin nada al aplicarse: no gasta ni avisa y no traba');
  const v = enCuaderno(); EN.marcarVista(v.h, 'herminia-noventa', 5); v.h.aplicadas['herminia-noventa'] = 5; dar(v.p, 'miel', 3);
  const Jv = juego(v.p); D.aplicarVistas(v.h, 6, Jv.ctx);
  ok(Jv.gastos.length === 0, 'partida vieja con los noventa ya vistos: no gasta');
}

// ---------------------------------------------------------------- 6. el tablón «De paso» y la guía dicen qué llevar
{
  const panel = (h, p) => O.optativasDelPanel(h, E(p));
  const sinRamon = enSanitario(), conRamon = enSanitario();
  dar(conRamon.p, 'trucha-ahumada', 1);
  const a = panel(sinRamon.h, sinRamon.p).find((x) => x.id === 'visita-ramon'), b = panel(conRamon.h, conRamon.p).find((x) => x.id === 'visita-ramon');
  ok(a && /te falta algo rico/.test(a.texto) && /pi[ñn]ones/.test(a.texto) && /trucha ahumada/.test(a.texto), 'tablón de Ramón sin nada: «te falta algo rico» y qué llevar');
  ok(b && /llevale una trucha ahumada al puesto sanitario/.test(b.texto), 'con la trucha: dice qué llevarle');
  ok(/algo rico/.test(a.pista) && /pi[ñn]ones/.test(a.pista) && /trucha ahumada/.test(a.pista), 'la pista (la guía) de Ramón dice qué llevar');
  const sinH = enCuaderno(), conH = enCuaderno();
  dar(conH.p, 'dulce-leche', 1);
  const c = panel(sinH.h, sinH.p).find((x) => x.id === 'noventa'), d = panel(conH.h, conH.p).find((x) => x.id === 'noventa');
  ok(c && /te falta algo dulce para la torta/.test(c.texto) && /miel/.test(c.texto) && /mermelada/.test(c.texto), 'tablón de Herminia sin nada: «te falta algo dulce para la torta» y qué llevar');
  ok(d && /llevale un frasco de dulce de leche a Herminia para la torta/.test(d.texto), 'con el dulce de leche: dice qué llevarle');
  ok(/dulce/.test(c.pista) && /miel/.test(c.pista) && /mermelada/.test(c.pista), 'la pista de Herminia dice qué llevar');
  for (const t of [a.texto, b.texto, a.pista, c.texto, d.texto, c.pista]) ok(!/\d/.test(t), `sin números: «${t.slice(0, 40)}…»`);
  // los textos de los capítulos (la guía) también
  const t8 = T2.capitulos[8].optativas.find((x) => x.id === 'noventa').texto, t9 = T3.capitulos[9].optativas.find((x) => x.id === 'visita-ramon').texto;
  ok(/dulce/.test(t8) && /miel/.test(t8) && !/llevale una torta$/.test(t8), 'la guía del capítulo 8 dice qué llevar');
  ok(/algo rico/.test(t9) && /pi[ñn]ones/.test(t9) && /trucha ahumada/.test(t9), 'la guía del capítulo 9 dice qué llevar');
  ok(/pi[ñn]ones/.test(TO.tablon['visita-ramon'].ofrecida) && /trucha ahumada/.test(TO.tablon['visita-ramon'].ofrecida), 'el tablón de B (Ramón) dice qué llevar');
  ok(/dulce/.test(TO.tablon.noventa.ofrecida) && /miel/.test(TO.tablon.noventa.ofrecida), 'el tablón de B (Herminia) dice qué llevar');
  // nunca traban: ninguna es objetivo de un capítulo
  ok(H.CAPITULOS.every((cap) => cap.objetivos.every((x) => !['visita-ramon', 'noventa', 'fermin-habla'].includes(x.id))), 'ninguna de las tres es objetivo de un capítulo');
  // en castellano, sin inglés ni cosas sagradas
  const todo = [a.texto, c.texto, a.pista, c.pista, t8, t9, TO.tablon['fermin-habla'].ofrecida, R.QUE_LLEVAR_RAMON, R.QUE_LLEVAR_TORTA, ...R.PARA_RAMON.map((x) => x.nombre), ...R.PARA_LA_TORTA.map((x) => x.nombre), H.PALABRAS_MAJADA_CONFIA, H.PALABRAS_MAJADA_NO_CONFIA].join(' ');
  ok(!/\b(the|and|with|you|your|of|for|please|thanks)\b/i.test(todo), 'sin inglés');
  ok(!/\b(dios|santo|santa|virgen|ángel|cruz|oración|iglesia|misa|bendic\p{L}*)\b/iu.test(todo), 'sin palabras religiosas');
}

// ---------------------------------------------------------------- 7. el juego: gasta de verdad lo que dice la escena (main.js y historia-ui.js)
{
  const main = leerSrc('main.js'), ui = leerSrc('historia-ui.js');
  ok(/import \{ IDS_REGALO, gastarRegalo \} from '\.\/historia-regalos\.js';/.test(main), 'main.js importa gastarRegalo');
  ok(/if \(IDS_REGALO\.includes\(cosa\)\) \{ gastarRegalo\(progreso, cosa, n\);/.test(main), 'gastarCosaHistoria gasta los regalos de lo juntado y de las cosas');
  ok(/cuanto: \(k\) => cuentaDe\(p, k\)/.test(ui) && /aviso: \(titulo, detalle\) => ctx\.nota\(titulo, detalle, true\)/.test(ui), 'historia-ui.js cuenta lo juntado y las cosas y avisa en pantalla');
  ok(/import \{ cuentaDe \} from '\.\/historia-regalos\.js';/.test(ui), 'historia-ui.js importa cuentaDe');
  // los imports del módulo nuevo son de una línea y sin comentario al final (el empaquetador los lee así)
  for (const [f, t] of [['main.js', main], ['historia-ui.js', ui], ['historia.js', leerSrc('historia.js')], ['historia-optativas.js', leerSrc('historia-optativas.js')], ['historia-disparadores-optativas.js', leerSrc('historia-disparadores-optativas.js')]])
    for (const l of t.split('\n').filter((x) => /^import .*historia-regalos/.test(x))) ok(/;\s*$/.test(l), `${f}: el import de historia-regalos termina en «;»`);
  ok(!/^export (const|let|var) \w+\s*=[^;\n]*,\s*\w+\s*=/m.test(leerSrc('historia-regalos.js')), 'historia-regalos.js: un export por línea');
  ok(!/^import /m.test(leerSrc('historia-regalos.js')), 'historia-regalos.js: puro, sin imports');
  // el pan de Fermín gasta primero lo juntado (el pan del horno)
  const p = progresoBase(); dar(p, 'pan-casero', 1); dar(p, 'pan-casero', 1, 'cosas');
  ok(R.gastarRegalo(p, 'pan-casero', 1) === 1 && p.entradas['pan-casero'].cantidad === 0 && p.cosas['pan-casero'] === 1, 'el pan casero del horno se gasta antes que el de Rosa');
}

// ---------------------------------------------------------------- 8. lo que no cambió
{
  const { h, p } = armar('mesa', { vistas: ['fermin-galpon'] });
  dar(p, 'pan-casero', 1);
  ok(quien(h, p, { modo: 'hablar', clave: 'fermin' }) === 'pan-fermin', 'el pan de Fermín: con pan del horno se dispara (antes sólo con el de las cosas)');
  const J = juego(p); EN.marcarVista(h, 'pan-fermin', 6); D.aplicarVistas(h, 6, J.ctx);
  ok(J.gastos.length === 1 && J.gastos[0][0] === 'pan-casero', 'y gasta ese pan (una sola vez)');
  ok(Object.hasOwn(DO.EFECTOS_ESCENA_OPTATIVAS, 'pan-fermin') && Object.hasOwn(DO.EFECTOS_ESCENA_OPTATIVAS, 'tablas-tito'), 'siguen los de Fermín y Tito');
  ok(Object.hasOwn(DO.NOTAS_ESCENA_OPTATIVAS, 'pan-fermin') && !Object.hasOwn(DO.NOTAS_ESCENA_OPTATIVAS, 'visita-ramon'), 'la nota de pantalla de Ramón es la de la mecánica (con lo que llevaste), no una fija');
}

// ---------------------------------------------------------------- 9. mutaciones (cada una en un proceso aparte, sobre una copia de src/ con otro nombre)
const MUT = [
  ['historia.js', "  if (!ferminConfia(h)) return false;\n", "", 'A nunca cuesta: no se mira el lazo de Fermín al decidir'],
  ['historia.js', "export const MAJADA_CONFIA = 2;", "export const MAJADA_CONFIA = 1;", 'la confianza se mide en +1'],
  ['historia.js', "if (!h || ahora !== 'a' || antes === 'a') return false;", "if (!h || ahora !== 'a') return false;", 'repetir A vuelve a mirar el lazo'],
  ['historia.js', "  if (h.temas && typeof h.temas === 'object' && !Array.isArray(h.temas)) delete h.temas[TEMA_MAJADA_CONFIA];\n", "", 'cambiar de decisión y volver a A conserva la marca vieja'],
  ['historia.js', "if (id === 'majada') alDecidirMajada(h, d[id], o.id, dia);", "", 'la tarjeta de respaldo no mira el lazo al decidir'],
  ['historia-escenas-efectos.js', "if (p.d === 'majada') alDecidirMajada(h, h.decisiones[p.d], p.v, ctx.dia()); ", "", 'la escena de la tranquera no mira el lazo al decidir'],
  ['historia-escenas-efectos.js', "return !!h && majadaSinCosto(h); });", "return false; });", 'la condición majada-sin-costo nunca se cumple'],
  ['historia-escenas-acto3-c9.js', "con(efecto('lazo:ramon:-1'), no(siMajadaSinCosto()))", "efecto('lazo:ramon:-1')", 'A cuesta siempre'],
  ['historia-escenas-acto3-c9.js', "con(efecto('lazo:ramon:-1'), no(siMajadaSinCosto()))", "con(efecto('lazo:ramon:-1'), siMajadaSinCosto())", 'A cuesta al revés'],
  ['historia-escenas-acto3-c9.js', "    efecto('lazo:fermin:3'),\n    con(efecto('lazo:ramon:-1'), no(siMajadaSinCosto())),", "    efecto('lazo:fermin:3'),", 'A nunca cuesta, ni sin confianza'],
  ['historia-escenas-acto3-c9.js', "con(narra('Fermín ya no te mira con reserva: sabés que no se la lleva para irse. Si la lleva él, Ramón lo va a entender.'), siLazo('fermin', 2)),", "", 'la tranquera no dice nada de la confianza'],
  ['historia.js', "(Number(s?.lazos?.fermin) || 0) >= MAJADA_CONFIA ? PALABRAS_MAJADA_CONFIA : PALABRAS_MAJADA_NO_CONFIA", "PALABRAS_MAJADA_NO_CONFIA", 'la tarjeta no distingue si Fermín confía'],
  ['historia.js', "'Lo ayudás a arrearla al galpón de esquila. Ramón dice «no me la devuelvas flaca».', lazos: { fermin: 1 }, palabras: (s) => palabrasMajadaA(s), ", "'Lo ayudás a arrearla al galpón de esquila. Ramón dice «no me la devuelvas flaca».', lazos: { fermin: 1 }, ", 'la tarjeta de respaldo no dice nada en palabras'],
  ['historia-disparadores-acto3.js', "requiere: ['ramon-sanitario'], cond: (s) => !!s.regaloRamon }", "requiere: ['ramon-sanitario'] }", 'la visita sale sin llevar nada'],
  ['historia-disparadores-acto2.js', "clave: 'abuela', cond: (s) => !!s.regaloTorta }", "clave: 'abuela' }", 'los noventa salen sin torta'],
  ['historia-disparadores-optativas.js', "  ctx?.gastar?.(r.k, r.n);\n", "", 'no se gasta nada al llevar el regalo'],
  ['historia-disparadores-optativas.js', "  ctx?.gastar?.(r.k, r.n);\n", "  ctx?.gastar?.(r.k, r.n * 2);\n", 'se gasta el doble'],
  ['historia-disparadores-optativas.js', "  ctx?.aviso?.(titulo(r), detalle);\n", "", 'no se avisa en pantalla lo que se gastó'],
  ['historia-disparadores-optativas.js', "'visita-ramon': (h, dia, ctx) => { marcarTema(h, 'ramon', 'chocolate', dia); llevarRegalo(", "'visita-ramon': (h, dia, ctx) => { llevarRegalo(", 'la visita pierde el tema de Chocolate'],
  ['historia-disparadores-optativas.js', "'herminia-noventa': (h, dia, ctx) => { llevarRegalo(h, 'herminia',", "'herminia-noventa': (h, dia, ctx) => { llevarRegalo(h, 'ramon',", 'Herminia recibe lo de Ramón'],
  ['historia-disparadores.js', "if (Object.hasOwn(h.aplicadas, id)) continue;", "", 'lo aplicado se aplica dos veces (se gasta de nuevo)'],
  ['historia-regalos.js', "export const cuentaDe = (p, k) => n(p?.entradas?.[k]?.cantidad) + n(p?.cosas?.[k]);", "export const cuentaDe = (p, k) => n(p?.cosas?.[k]);", 'sólo se cuentan las cosas, no lo juntado'],
  ['historia-regalos.js', "for (const x of lista) if (n(cuanto(x.k)) >= x.n) return x;", "for (const x of lista) if (n(cuanto(x.k)) >= 1) return x;", 'un piñón alcanza para el puñado'],
  ['historia-regalos.js', "  { k: 'trucha-ahumada', n: 1, nombre: 'una trucha ahumada', corto: 'trucha ahumada' },\n  { k: 'pan-casero', n: 1, nombre: 'un pan casero', corto: 'pan casero' },", "  { k: 'pan-casero', n: 1, nombre: 'un pan casero', corto: 'pan casero' },", 'la trucha ahumada no sirve para Ramón'],
  ['historia-regalos.js', "export const PARA_LA_TORTA = [\n", "export const PARA_LA_TORTA = [\n  { k: 'pan-casero', n: 1, nombre: 'un pan casero', corto: 'pan casero' },\n", 'el pan casero hace de torta'],
  ['historia-regalos.js', "  if (e && falta > 0) { const q = Math.min(falta, n(e.cantidad)); e.cantidad = Math.max(0, (Number(e.cantidad) || 0) - q); falta -= q; }\n", "", 'no se gasta lo juntado'],
  ['historia.js', "pan: Math.min(9999, cuentaDe(p, 'pan-casero'))", "pan: ent(p?.cosas?.['pan-casero'], 9999)", 'el pan del horno no cuenta para Fermín'],
  ['historia.js', "regaloRamon: regaloDeProgreso('ramon', p)?.k || null,", "regaloRamon: null,", 'el estado nunca ve un regalo para Ramón'],
  ['historia-optativas.js', "`te falta algo rico para llevarle: ${QUE_LLEVAR_RAMON} o un plato de tu cocina`", "'hay algo para llevar'", 'el tablón de Ramón no dice qué llevar'],
  ['historia-optativas.js', "`te falta algo dulce para la torta: ${QUE_LLEVAR_TORTA}`", "'hay algo para llevar'", 'el tablón de Herminia no dice qué llevar'],
  ['historia-texto-optativas.js', "Llevale algo rico: piñones, una trucha ahumada, pan casero, miel o un plato de tu cocina.", "Llevale algo rico.", 'la pista de Ramón no dice qué llevar'],
  ['historia-texto-optativas.js', "llevale algo dulce para hacerla, un frasco de dulce de leche, de mermelada o de frutilla, o miel.", "llevale algo.", 'la pista de Herminia no dice qué llevar'],
  ['historia-texto-acto3.js', "con algo rico: piñones, una trucha ahumada, pan casero, miel o un plato de tu cocina'", "con algo rico'", 'la guía del capítulo 9 no dice qué llevar'],
  ['historia-texto-acto2.js', "llevale algo dulce para la torta (un frasco de dulce de leche, de mermelada o de frutilla, o miel)'", "llevale una torta'", 'la guía del capítulo 8 sigue pidiendo una torta que no existe'],
  ['historia-texto-optativas.js', "Si te gana la confianza, más adelante lo de la majada de Ramón va a doler menos.", "", 'Fermín quiere hablar no avisa que sirve'],
  ['historia-ui.js', "cuanto: (k) => cuentaDe(p, k), ", "cuanto: (k) => Number(p.cosas?.[k]) || 0, ", 'el juego sólo cuenta las cosas'],
  ['historia-ui.js', "aviso: (titulo, detalle) => ctx.nota(titulo, detalle, true) ", "", 'el juego no muestra el aviso'],
  ['historia-ui.js', "typeof o.palabras === 'function' ? o.palabras(s) : ''", "''", 'la tarjeta no muestra las palabras'],
  ['main.js', "if (IDS_REGALO.includes(cosa)) { gastarRegalo(progreso, cosa, n); refrescarBarra(true); return; }", "", 'main.js no gasta los regalos'],
];
let atrapadas = 0;
if (!process.env.GASTOS_SRC) {
  const tmp = mkdtempSync(join(tmpdir(), 'gastos4183-'));
  try {
    for (const [arch, de, a, que] of MUT) {
      const orig = leer(`src/${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, GASTOS_SRC: dir, GASTOS_CALLADO: '1' }, encoding: 'utf8' });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
  // el documento de los cambios existe y habla de las tres cosas y de lo que se decidió
  const cambios = existsSync(join(raiz, 'CAMBIOS_4_18_3.md')) ? leer('CAMBIOS_4_18_3.md') : '';
  ok(cambios.length > 1500 && /majada-sin-costo/.test(cambios) && /torta/.test(cambios) && /Visitar a Ramón|visitar a Ramón/.test(cambios), 'CAMBIOS_4_18_3.md documenta las tres cosas y la condición nueva');
  ok(!/scratch/i.test(cambios), 'los cambios no mencionan lo que no se menciona');
}

if (!process.env.GASTOS_SRC) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.18.3 gastos de la Historia · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
