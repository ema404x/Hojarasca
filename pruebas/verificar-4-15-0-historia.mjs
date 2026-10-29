// 4.15.0 (agente A): la Historia nueva, «El trato del molino»: fundación y acto I. Código y reglas (sin placa); la partida real está en
// pruebas/humo-4-15-0-*.cjs.
//   1. los trece capítulos: títulos, tarjetas, el acto I completo y el «continuará» que no traba
//   2. lo guardado: defaults, saneo a prueba de basura, versión de la historia, vuelta por el guardado
//   3. el vocabulario de objetivos (llegar, hablar, entregar, hora, esperar, estación, escena, decisión, objeto, acompañante, reparar…)
//   4. el recorrido del acto I de punta a punta (con decisión, lazos, ramal y variantes de las tarjetas)
//   5. los disparadores de las escenas y lo que cambia al verlas
//   6. el reinicio de las partidas viejas (con copia aparte y aviso), y que el Relax libre y el Desafío no cambian
//   7. los objetos de historia en el mundo
//   8. los efectos y condiciones con nombre para las escenas
//   9. el enganche con el juego (por texto)
// Al final: mutaciones (se rompe a propósito el código y la prueba tiene que fallar).
import { readFileSync, writeFileSync, rmSync, mkdtempSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const requerir = createRequire(import.meta.url);
let n = 0, fallas = 0;
let callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
  setItem: (k, v) => { almacen.set(k, String(v)); },
  removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() { return almacen.size; },
};
const lienzo = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ getContext: () => lienzo, width: 0, height: 0, style: {} }) };
const THREE = await import('three');

const TITULOS = ['La llave del molinero', 'La bolsa del molinero', 'La mesa larga', 'La señora del ramal', 'La rueda', 'Lo que se pierde, aparece', 'La cosecha', 'El cuaderno de Eusebio', 'Los primeros fríos', 'Golpeá antes de abrir', 'El arco y la honda', 'La noche de la nevada', 'El deshielo'];

const progresoBase = (H) => ({ dia: 1, horas: 18.25, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, historia: H.historiaNueva() });

// Todo el chequeo vive en una función: se corre con el código de verdad y con cada mutación
async function chequear(arch = '', sufijo = '') {
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', arch === f && sufijo ? f.replace('.js', `${sufijo}.js`) : f)).href);
  const H = await imp('historia.js');
  const D = await imp('historia-disparadores.js');
  const R = await imp('historia-reinicio.js');
  const X = await imp('historia-escenas-efectos.js');
  const O = await imp('historia-objetos.js');
  const A2D = await imp('historia-disparadores-acto2.js');
  const A3D = await imp('historia-disparadores-acto3.js');
  const EN = await import('../src/escenas.js');
  const G = await import('../src/guardado.js');
  const f0 = fallas;

  // ---------------------------------------------------------------- 1. los trece capítulos
  {
    ok(H.CAPITULOS.length === 13, `trece capítulos (${H.CAPITULOS.length})`);
    igual(H.CAPITULOS.map((c) => c.titulo), TITULOS, 'los títulos del guion, en orden');
    ok(new Set(H.CAPITULOS.map((c) => c.id)).size === 13, 'ids únicos');
    igual(H.CAPITULOS.map((c) => c.acto), [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3], 'tres actos');
    for (const c of H.CAPITULOS) {
      ok(c.intro.length >= 1 && c.outro.length >= 1, `${c.id}: tarjeta de entrada y de cierre`);
      ok(c.premio && c.premio.texto && (c.premio.materiales || c.premio.cuenta || c.premio.ramitas || c.premio.cosas || c.premioVar), `${c.id}: premio concreto`);
      for (const k of Object.keys(c.premio.materiales || {})) ok(['tronco', 'tabla', 'piedra', 'lana'].includes(k), `${c.id}: material ${k}`);
      for (const t of [...c.intro, ...c.outro, ...(c.outroVar || []).flatMap((v) => Object.values(v.lineas))]) ok(!/[ÃÂ]/.test(t), `${c.id}: sin mojibake`);
      for (const o of c.objetivos) ok(typeof o.hecho === 'function' || typeof o.cuenta === 'function', `${c.id}:${o.id} se mide`);
      ok(new Set(c.objetivos.map((o) => o.id)).size === c.objetivos.length, `${c.id}: objetivos únicos`);
      if (c.momento) ok(c.objetivos.some((o) => o.delMomento), `${c.id}: un objetivo espera su momento`);
    }
    // 4.16.0: el acto I y el II están completos; del 9 al 13, un «continuará»
    for (let i = 0; i < 13; i++) ok(H.CAPITULOS[i].objetivos.length >= 4 && !H.esContinuara(H.CAPITULOS[i]), `capítulo ${i + 1}: objetivos de verdad`);   // 4.17.0: ya no queda ningún continuará
    igual(H.CAPITULOS[0].objetivos.map((o) => o.id), ['refugio', 'puerta', 'fuego', 'anotar', 'noche', 'canto'], 'los seis objetivos del capítulo 1');
    ok(H.CAPITULOS[1].decisiones?.[0]?.id === 'bolsa', 'la decisión de la bolsa cuelga del capítulo 2');
    ok(H.CAPITULOS[2].momento.evento === 'tobillo' && H.CAPITULOS[3].momento.evento === 'derrumbe', 'los momentos: el tobillo de Nicanor y el derrumbe');
    ok(H.CAPITULOS[0].intro.join(' ').includes('Preguntar por Ercilia') && H.CAPITULOS[12].outro.join(' ').includes('Tomate tu tiempo'), 'textos del guion en las puntas');
    ok(H.VECINOS_HISTORIA.includes('fermin') && H.VECINOS_HISTORIA.length === 5, 'Fermín se suma a los que se conocen');
    // 4.17.0: ningún capítulo es un «continuará»: el 9 espera sus objetivos de verdad
    { const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.capitulo = 8; h.fase = 'jugando'; h.base = { dia: 5 }; const p = progresoBase(H); p.dia = 6; ok(!H.revisarHistoria(h, H.estadoHistoria(p, {})).completo, 'el capítulo 9 no pasa solo con una noche'); }
    ok(H.hayPresencia({ activa: true, fase: 'jugando', capitulo: 5 }) && !H.hayPresencia({ activa: true, fase: 'jugando', capitulo: 0 }), 'los duendes de lejos, del capítulo 6 en adelante (los indicios del acto II)');
  }

  // ---------------------------------------------------------------- 2. lo guardado
  {
    const h = H.historiaNueva();
    ok(h.version === 2 && h.ramal === 0 && h.molido === 0 && h.acompanante === null && h.raro.length === 0, 'defaults de la historia nueva');
    igual(h.lazos, { ramon: 0, ema: 0, ercilia: 0, guarda: 0, fermin: 0, graciela: 0 }, 'lazos en cero');
    igual(h.decisiones, { bolsa: null, coihue: null, molienda: null, cuaderno: null, majada: null, duendes: null }, 'decisiones sin tomar');
    igual(h.prestado, { herrero: false, apicultor: false, maquinista: false, guarda: false, tobias: false, zaino: false }, 'nada prestado');
    ok(h.duendes.deuda === 0 && h.duendes.perdon === false && h.duendes.convidado === 0 && h.duendes.trato === null, 'los duendes: trato, deuda, perdón y convidado');
    ok(h.noche.estado === 'pendiente' && h.escenas.vistas && h.escenas.elecciones, 'lo de la noche (4.13.0) y las escenas (4.14.0) siguen con su forma');
    igual(H.sanearHistoria(JSON.parse(JSON.stringify(h))), h, 'ida y vuelta por JSON');
    const s1 = H.sanearHistoria({ activa: true, capitulo: 3, fase: 'jugando', empezada: 2, ramal: 7 });
    igual(H.sanearHistoria(JSON.parse(JSON.stringify(s1))), s1, 'sanear dos veces da lo mismo');
    // basura
    const b = H.sanearHistoria({
      activa: 'sí', capitulo: 99, fase: 'volando', version: 'x',
      lazos: { ramon: 99, ema: -9, ercilia: 'mucho', constructor: 3, __proto__: { x: 1 }, guarda: 1.9 },
      decisiones: { bolsa: 'z', coihue: 'b', toString: 'a', majada: 7 },
      ramal: -4, fletes: 99, entregasVistas: 'n', molido: 1e12,
      prestado: { herrero: 'sí', tobias: true, constructor: true },
      raro: [{ id: 'ronda-ramitas', dia: 3 }, { id: 'ronda-ramitas', dia: 4 }, { id: 'inventado', dia: 1 }, 5, null, { id: '__proto__', dia: 1 }, { id: 'hacha-tocon', dia: 'n' }],
      temas: { 'ramon:alero': 3, __proto__: 1, constructor: 2, 'a b': 1, [`x${'y'.repeat(80)}`]: 1 },
      objetos: { 'canto-blanco': 2, hasOwnProperty: 1 }, entregados: 5, reparaciones: { alero: 99, constructor: 2 }, aplicadas: { 'nota-eusebio': 2, valueOf: 3 },
      acompanante: 'cualquiera', avisoReinicio: 1, copiaPrevia: '../../x',
      duendes: { trato: 'x', deuda: -3, perdon: 'sí', convidado: 1e9 },
    });
    ok(b.activa === false && b.capitulo === 12 && b.fase === 'intro', 'activa, capítulo y fase con basura');
    ok(b.version === 1, 'una historia con una versión que no es número: la de antes');
    igual(b.lazos, { ramon: 3, ema: -2, ercilia: 0, guarda: 1, fermin: 0, graciela: 0 }, 'lazos acotados a −2…+3');
    igual(b.decisiones, { bolsa: null, coihue: 'b', molienda: null, cuaderno: null, majada: null, duendes: null }, 'decisiones sólo a, b o c');
    ok(b.ramal === 0 && b.fletes === 8 && b.entregasVistas === 0 && b.molido === 9999, 'ramal, fletes y molido acotados');
    igual(b.prestado, { herrero: false, apicultor: false, maquinista: false, guarda: false, tobias: true, zaino: false }, 'prestado sólo con true');
    igual(b.raro, [{ id: 'ronda-ramitas', dia: 3 }, { id: 'hacha-tocon', dia: 0 }].map((x) => ({ ...x, dia: Math.max(1, x.dia) })), 'lo raro: sin repetidos ni inventados');
    igual(Object.keys(b.temas), ['ramon:alero'], 'temas sin claves peligrosas ni largas');
    igual(Object.keys(b.objetos), ['canto-blanco'], 'objetos sin claves peligrosas');
    ok(Object.keys(b.entregados).length === 0 && b.reparaciones.alero === 99 && !Object.hasOwn(b.reparaciones, 'constructor'), 'reparaciones');
    igual(Object.keys(b.aplicadas), ['nota-eusebio'], 'aplicadas sin claves peligrosas');
    ok(b.acompanante === null && b.avisoReinicio === false && b.copiaPrevia === '', 'acompañante, aviso y copia con basura');
    ok(b.duendes.trato === null && b.duendes.deuda === 0 && b.duendes.perdon === false && b.duendes.convidado === 99, 'duendes con basura');
    ok(Object.getPrototypeOf(b.lazos) === Object.prototype && !Object.hasOwn(b.temas, '__proto__') && b.temas.polluted === undefined, 'sin contaminar prototipos');
    for (const malo of [null, undefined, 'x', 5, [], true]) igual(H.sanearHistoria(malo), H.historiaNueva(), `sanear ${JSON.stringify(malo)}`);
    // la versión: sin versión y con rastro de la historia vieja, es la 1; sin rastro (nunca la jugó), la nueva
    ok(H.sanearHistoria({ activa: true, capitulo: 3 }).version === 1 && H.sanearHistoria({ empezada: 4 }).version === 1 && H.sanearHistoria({ hechos: { 'llegada:fuego': 2 } }).version === 1, 'sin versión y con rastro: historia vieja (1)');
    ok(H.sanearHistoria({ hablados: { ramon: true } }).version === 2 && H.sanearHistoria({ version: 2, activa: true }).version === 2, 'sin rastro, o ya con versión: la 2');
    ok(H.sanearHistoria({ hechos: { 'llegada:fuego': 2, 'llave:fuego': 3 } }).hechos['llave:fuego'] === 3 && !Object.hasOwn(H.sanearHistoria({ hechos: { 'llegada:fuego': 2 } }).hechos, 'llegada:fuego'), 'los hechos viejos de ocho capítulos se descartan');
    // la vuelta por el guardado
    G.usarModoGuardado('relax', 1);
    const p = G.progresoNuevo();
    p.pos = { x: 1, z: 2 };
    p.historia = H.historiaNueva(); H.empezarHistoria(p.historia, 1);
    H.cambiarLazo(p.historia, 'ramon', 2); H.marcarObjeto(p.historia, 'canto-blanco', 2); H.anotarRaro(p.historia, 'ronda-ramitas', 2); H.sumarRamal(p.historia, 3); p.historia.decisiones.bolsa = 'a'; p.historia.acompanante = 'graciela';
    ok(G.guardarProgreso(p), 'se guarda');
    igual(G.cargarProgreso().historia, p.historia, 'la historia nueva vuelve igual del guardado');
    almacen.set('hojarasca-v1', JSON.stringify({ dia: 9, horas: 10, entradas: {}, pos: { x: 0, z: 0 }, historia: { activa: true, capitulo: 5, fase: 'jugando', empezada: 2, hechos: { 'molino:molino': 8 } } }));
    const vieja = G.cargarProgreso();
    ok(vieja.historia.version === 1 && R.historiaVieja(vieja) && vieja.historia.activa === true, 'una partida de ocho capítulos carga como historia vieja');
    almacen.clear();
  }

  // ---------------------------------------------------------------- 3. el vocabulario de objetivos
  {
    const p = progresoBase(H);
    const e = (extra = {}) => H.estadoHistoria(p, extra);
    ok(H.llegar('refugio', 12)(e({ lugares: { refugio: 11.9 } })) && !H.llegar('refugio', 12)(e({ lugares: { refugio: 12.1 } })) && !H.llegar('refugio', 12)(e({})) && !H.llegar('refugio', 12)(e({ lugares: { refugio: NaN } })), 'llegar(lugar, radio)');
    ok(!H.hablar('ramon', 'alero')(e()) && H.hablar('ramon', 'alero')((H.marcarTema(p.historia, 'ramon', 'alero', 2), e())), 'hablar(quién, tema) con la marca');
    ok(!H.entregar('panadera', 'bolsa-eusebio')(e()) && H.entregar('panadera', 'bolsa-eusebio')((H.marcarEntrega(p.historia, 'panadera', 'bolsa-eusebio', 2), e())), 'entregar(quién, cosa)');
    p.horas = 9.5;
    ok(H.hora(9, 11)(e()) && !H.hora(10, 11)(e()), 'hora(desde, hasta)');
    p.horas = 1; ok(H.hora(22, 4)(e()) && !H.hora(4, 22)(e()), 'la hora cruza la medianoche');
    p.horas = 23.5; ok(H.hora(22, 4)(e()), 'y de este lado también');
    p.horas = 10;
    ok(H.esperar('estacion', 9, 11, 20)(e({ lugares: { estacion: 5 } })) && !H.esperar('estacion', 9, 11, 20)(e({ lugares: { estacion: 50 } })) && !H.esperar('estacion', 12, 14, 20)(e({ lugares: { estacion: 5 } })), 'esperar(lugar, desde, hasta)');
    // la puerta de estación: espera la estación y no más de 2 días desde que empezó el capítulo
    ok(!H.estacion('otono')(e({ estacion: 'verano' }), { dia: 4 }) && H.estacion('otono')(e({ estacion: 'otono' }), { dia: 4 }) && H.estacion('otono')(e({ estacion: 'invierno' }), { dia: 4 }), 'estacion(e): la estación o una posterior');
    p.dia = 5; ok(!H.estacion('otono')(e({ estacion: 'verano' }), { dia: 4 }), 'un día de espera: todavía no');
    p.dia = 6; ok(H.estacion('otono')(e({ estacion: 'verano' }), { dia: 4 }), 'a los 2 días la historia no espera más');
    p.dia = 1;
    ok(!H.escena('nota-eusebio')(e()) && H.escena('nota-eusebio')((EN.marcarVista(p.historia, 'nota-eusebio', 1), e())), 'escena(id)');
    ok(!H.decision('bolsa')(e()) && H.decision('bolsa')((p.historia.decisiones.bolsa = 'c', e())), 'decision(D)');
    ok(!H.objeto('puertita')(e()) && H.objeto('puertita')((H.marcarObjeto(p.historia, 'puertita', 1), e())), 'objeto(id)');
    ok(!H.acompanante('graciela')(e()) && H.acompanante('graciela')((p.historia.acompanante = 'graciela', e())) && H.acompanante('graciela')(e({ acompanante: 'graciela' })), 'acompanante(quién)');
    ok(!H.reparar('alero', 4)(e()) && (H.sumarReparacion(p.historia, 'alero', 4), H.sumarReparacion(p.historia, 'alero', 4), H.sumarReparacion(p.historia, 'alero', 4), !H.reparar('alero', 4)(e())) && (H.sumarReparacion(p.historia, 'alero', 4), H.reparar('alero', 4)(e())), 'reparar(id, n)');
    ok(H.sumarReparacion(p.historia, 'alero', 4) === 4, 'una reparación no pasa de su tope');
    p.historia.ramal = 6; p.historia.molido = 3;
    ok(H.ramalDe(6)(e()) && !H.ramalDe(7)(e()) && H.molido(3)(e()) && !H.molido(4)(e()), 'los contadores: ramal y molido');
    // esperar sentado acelera el reloj, sólo si el capítulo espera una hora
    const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.fase = 'jugando';
    const sa = { ...e({ sentado: true }) };
    ok(H.aceleracionDeEspera(h, sa) === 1, 'sin nada que esperar, el reloj va normal');
    h.capitulo = 3; h.base = { dia: 1 };
    const cap4 = H.CAPITULOS[3];
    cap4.objetivos[0].espera = true;
    ok(H.aceleracionDeEspera(h, sa) === H.ACELERACION_ESPERA && H.aceleracionDeEspera(h, { ...sa, sentado: false }) === 1, 'sentado y esperando: el reloj corre más rápido');
    delete cap4.objetivos[0].espera;
  }

  // ---------------------------------------------------------------- 4. el recorrido del acto I
  {
    const p = progresoBase(H);
    const h = p.historia;
    const dia = () => p.dia;
    const e = (extra = {}) => H.estadoHistoria(p, extra);
    const ver = (...ids) => { for (const id of ids) EN.marcarVista(h, id, dia()); };
    const tilda = (extra = {}) => H.revisarHistoria(h, e(extra));
    ok(H.empezarHistoria(h, 1) === true && h.fase === 'intro' && h.version === 2, 'empieza la historia');
    ok(H.arrancarCapitulo(h, e()), 'la tarjeta de entrada arranca el capítulo');
    // ---- capítulo 1
    ok(tilda().nuevos.length === 0, 'al empezar no hay nada hecho');
    p.entradas.refugio = { dia: 1 };
    igual(tilda({ lugares: {} }).nuevos.map((o) => o.id), ['refugio'], 'llegar al refugio');
    ver('nota-eusebio'); igual(tilda().nuevos.map((o) => o.id), ['puerta'], 'abrir la puerta con la llave: la escena de la nota');
    igual(tilda({ fuego: true }).nuevos.map((o) => o.id), ['fuego'], 'el fuego');
    ok(tilda().nuevos.length === 0, 'una sola anotación no alcanza');
    p.entradas.coihue = {};
    igual(tilda().nuevos.map((o) => o.id), ['anotar'], 'anotar dos cosas');
    ok(H.panelHistoria(h, e()).objetivos.find((o) => o.id === 'noche').texto.includes('primera noche'), 'el panel lleva el texto');
    p.dia = 2; p.horas = 7;
    igual(tilda().nuevos.map((o) => o.id), ['noche'], 'la primera noche');
    ok(!H.panelHistoria(h, e()).ramal, 'sin barra del ramal todavía');
    H.marcarObjeto(h, 'canto-blanco', 2);
    const r1 = tilda();
    ok(r1.completo && h.fase === 'outro', 'el canto blanco cierra el capítulo 1');
    igual(H.lineasCarta(H.CAPITULOS[0], h, 'outro'), H.CAPITULOS[0].outro, 'la tarjeta de cierre del capítulo 1 es la del guion');
    const c1 = H.cerrarCapitulo(h, 2);
    ok(c1.capitulo.id === 'llave' && c1.premio.ramitas === 6 && h.capitulo === 1 && h.fase === 'intro', 'cierra el capítulo 1 con su premio');
    ok(H.cerrarCapitulo(h, 2) === null, 'no se cobra dos veces');
    // ---- capítulo 2
    H.arrancarCapitulo(h, e());
    const alIni = H.panelHistoria(h, e()).objetivos.map((o) => o.id);
    ok(!alIni.includes('cumplir') && alIni.length === 7, 'el cumplimiento de la bolsa no se ve hasta decidir');
    ok(H.decisionPendiente(h, e()) === null, 'la decisión espera a la escena de la bolsa en el alero');
    ver('ramon-tranquera'); H.marcarTema(h, 'ramon', 'alero', 2);
    igual(tilda().nuevos.map((o) => o.id), ['ramon'], 'hablar con Ramón (el tema del alero)');
    p.entradas.viaje = {}; p.cosas.hacha = 1; p.talados = [1]; p.dia = 2;
    igual(tilda({ terminadas: [{ id: 'banco-trabajo', x: 0, z: 0 }] }).nuevos.map((o) => o.id), ['viaje', 'hacha', 'talar', 'banco'], 'trochita, hacha, árbol y banco');
    const noTabla = H.estadoHistoria(p, {});
    ok(H.panelHistoria(h, noTabla).objetivos.find((o) => o.id === 'alero').texto.endsWith('(0/4)'), 'el alero cuenta de a una tabla');
    for (let i = 0; i < 3; i++) H.sumarReparacion(h, 'alero', 4);
    ok(tilda().nuevos.length === 0 && H.decisionPendiente(h, e()) === null, 'tres tablas no alcanzan');
    H.sumarReparacion(h, 'alero', 4); ver('bolsa-alero');
    igual(tilda().nuevos.map((o) => o.id), ['alero'], 'el alero, con la cuarta tabla');
    const dec = H.decisionPendiente(h, e());
    ok(dec && dec.id === 'bolsa' && dec.opciones.length === 3, 'sale la decisión de la bolsa');
    ok(H.tomarDecision(h, 'bolsa', 'b', e()) === null && h.decisiones.bolsa === null, 'llevársela a Rosa no se puede si Rosa todavía no llegó a la aldea');
    p.aldea.pobladores = [{ clave: 'panadera' }];
    igual(H.estadoHistoria(p, {}).pobladores.has('panadera'), true, 'el estado sabe quién llegó a la aldea');
    // se elige la raíz del coihue (A): Ramón +1
    const op = H.tomarDecision(h, 'bolsa', 'a', e());
    ok(op && op.id === 'a' && h.decisiones.bolsa === 'a' && h.lazos.ramon === 1, 'A: convidar a la raíz; Ramón +1');
    ok(H.tomarDecision(h, 'bolsa', 'c', e()) === null && h.decisiones.bolsa === 'a', 'una decisión se toma una sola vez');
    ok(H.decisionPendiente(h, e()) === null, 'y ya no sale la tarjeta');
    ok(H.tomarDecision(h, 'inventada', 'a', e()) === null && H.tomarDecision(h, 'coihue', 'z', e()) === null, 'decisiones y opciones que no existen');
    igual(tilda().nuevos.map((o) => o.id), ['bolsa'], 'la decisión se tilda');
    ok(H.panelHistoria(h, e()).objetivos.some((o) => o.id === 'cumplir' && o.texto.includes('raíz del coihue')), 'aparece lo que hay que cumplir, según lo elegido');
    ok(!r2cerro(), 'el capítulo sigue hasta cumplir la decisión');
    function r2cerro() { return h.fase === 'outro'; }
    ver('bolsa-coihue');
    ok(tilda().completo && h.fase === 'outro', 'dejar la bolsa cierra el capítulo 2');
    const l2 = H.lineasCarta(H.CAPITULOS[1], h, 'outro');
    ok(l2.length === 2 && l2[1].includes('se rió bajito'), 'la tarjeta de cierre cambia una línea según la decisión (A)');
    const hb = { ...h, decisiones: { ...h.decisiones, bolsa: 'b' } }, hc = { ...h, decisiones: { ...h.decisiones, bolsa: 'c' } };
    ok(H.lineasCarta(H.CAPITULOS[1], hb, 'outro')[1].includes('pan') && H.lineasCarta(H.CAPITULOS[1], hc, 'outro')[1].includes('Josefina pasó dos veces') && H.lineasCarta(H.CAPITULOS[1], { decisiones: {} }, 'outro').length === 1, 'y la de B, la de C y la sin decisión');
    D.alCerrarCapitulo(h, 'bolsa', 3);
    ok(h.raro.length === 0, 'al cerrar el capítulo 2 no se anota nada de más (lo raro lo anotan las escenas)');
    H.cerrarCapitulo(h, 3);
    // ---- capítulo 3
    H.arrancarCapitulo(h, e());
    p.dia = 3;
    h.hablados = { ramon: true, nicanor: true, ema: true, ercilia: true };
    ok(H.panelHistoria(h, e()).objetivos[0].texto.includes('(4/5)'), 'cuatro de los cinco vecinos');
    h.hablados.fermin = true;
    ver('placa-herminia', 'fermin-galpon');
    p.eventosValle = { hechos: { tobillo: { dia: 3 } } };
    p.visitas = { cuenta: 1, activa: null }; p.visitas.recibidas = 1;
    const t3 = tilda({ terminadas: [{ id: 'mesa-campo', x: 0, z: 0 }, { id: 'silla-campo', x: 1, z: 0 }, { id: 'banco', x: -1, z: 0.5 }] });
    ok(t3.nuevos.map((o) => o.id).includes('hablar') && t3.nuevos.map((o) => o.id).includes('placa') && t3.nuevos.map((o) => o.id).includes('mesa') && t3.nuevos.map((o) => o.id).includes('nicanor'), 'conocer a los cinco, la placa, la mesa y Nicanor');
    ok(H.momentoPendiente(h, e()) === null, 'el tobillo ya pasó');
    // ---- la visita a la mesa (se cuenta aparte) y el cierre del capítulo
    if (h.fase !== 'outro') { p.visitas.cuenta = 2; }
    // ---- el momento del capítulo 3 sin pasar
    const hm = H.historiaNueva(); H.empezarHistoria(hm, 1); hm.capitulo = 2; hm.fase = 'jugando';
    ok(H.momentoPendiente(hm, H.estadoHistoria(progresoBase(H), {})) === 'tobillo' && H.momentoPendiente(hm, { ...H.estadoHistoria(progresoBase(H), {}), vecinos: false }) === null, 'Nicanor se lastima pronto; sin vecinos, no');
    // ---- capítulo 4 (a partir de acá se arma un camino limpio)
    const hh = H.historiaNueva(); H.empezarHistoria(hh, 1); hh.capitulo = 3; hh.fase = 'intro';
    const q = progresoBase(H); q.historia = hh; q.dia = 4;
    const e4 = (extra = {}) => H.estadoHistoria(q, extra);
    q.comercio.entregas = 5;
    H.arrancarCapitulo(hh, e4());
    ok(H.panelHistoria(hh, e4()).ramal && H.panelHistoria(hh, e4()).ramal.estado === 'en duda' && H.panelHistoria(hh, e4()).ramal.valor === 0, 'desde el capítulo 4 aparece la barra del ramal');
    EN.marcarVista(hh, 'anden-graciela', 4);
    D.aplicarVistas(hh, 4, {});
    ok(hh.acompanante === 'graciela', 'recibir a Graciela: viaja con vos');
    igual(H.revisarHistoria(hh, e4({ lugares: { aldea: 30 } })).nuevos.map((o) => o.id), ['anden', 'aldea'], 'el andén y llevarla a la aldea');
    H.revisarHistoria(hh, e4({})); H.revisarHistoria(hh, e4({}));
    ok(hh.ramal === 0 && hh.entregasVistas === 5, 'las entregas anteriores al capítulo 4 no cuentan para el ramal');
    q.comercio.entregas = 8; H.revisarHistoria(hh, e4({}));
    ok(hh.ramal === 3 && hh.fletes === 3, 'cada flete entregado suma al ramal');
    q.comercio.entregas = 30; H.revisarHistoria(hh, e4({}));
    ok(hh.fletes === 8 && hh.ramal === 8, 'los fletes suman hasta 8');
    ok(H.estadoRamal(hh) === 'a prueba' && H.estadoRamal({ ramal: 10 }) === 'salvado' && H.estadoRamal({ ramal: 5 }) === 'en duda', 'el ramal en palabras: salvado, a prueba, en duda');
    q.eventosValle = { hechos: { derrumbe: { dia: 4, opcion: 'ayudar' } } };
    EN.marcarVista(hh, 'derrumbe-puertita', 4);
    D.aplicarVistas(hh, 4, { eventos: q.eventosValle.hechos });
    ok(hh.lazos.graciela === 0, 'ayudar en el derrumbe: Graciela contenta (lo raro y los lazos de la escena los dan sus efectos)');
    const po = H.panelHistoria(hh, e4({ conduciendo: true })).objetivos;
    ok(po.find((o) => o.id === 'anden').hecho && po.find((o) => o.id === 'aldea').hecho && !po.find((o) => o.id === 'puertita').hecho, 'los hechos del panel hasta ahora');
    H.sumarRamal(hh, 2); D.alCerrarCapitulo(hh, 'ramal', 5);
    ok(hh.acompanante === null, 'al cerrar el capítulo Graciela se queda en el hospedaje');
    // ---- 4.17.0: del 9 al 13 el recorrido de punta a punta está en verificar-4-17-0-historia-a.mjs; acá, que una historia terminada vuelve terminada
    { const hf = H.historiaNueva(); H.empezarHistoria(hf, 1); hf.capitulo = 12; hf.fase = 'outro'; H.cerrarCapitulo(hf, 9); const z = progresoBase(H); z.historia = hf;
      ok(hf.fase === 'fin' && hf.terminada > 0, 'el último capítulo cierra la historia');
      ok(H.panelHistoria(hf, H.estadoHistoria(z, {})) === null && /Terminaste la historia/.test(H.resumenHistoria(hf)), 'terminada: sin panel y con su resumen');
      igual(H.sanearHistoria(JSON.parse(JSON.stringify(hf))).fase, 'fin', 'terminada vuelve terminada'); }
  }

  // ---------------------------------------------------------------- lazos, palabras, ramal, raro
  {
    const h = H.historiaNueva();
    ok(H.cambiarLazo(h, 'ramon', 1) === 1 && H.cambiarLazo(h, 'ramon', 9) === 2 && h.lazos.ramon === 3, 'los lazos suben hasta +3');
    ok(H.cambiarLazo(h, 'ema', -9) === -2 && h.lazos.ema === -2, 'y bajan hasta −2');
    ok(H.cambiarLazo(h, 'nicanor', 1) === 0 && H.cambiarLazo(h, '__proto__', 1) === 0 && H.cambiarLazo(h, 'ramon', 'x') === 0, 'sólo los que tienen lazo, sólo números');
    igual([-2, -1, 0, 1, 2, 3].map(H.palabraLazo), ['frío', 'tirante', 'conocido', 'de confianza', 'de confianza', 'de la casa'], 'los lazos en palabras');
    ok(H.lazosEnPalabras(H.historiaNueva()).length === 0, 'sin conocer a nadie, sin lazos que mostrar');
    const g = H.historiaNueva(); g.hablados.ramon = true; H.cambiarLazo(g, 'ema', 2);
    igual(H.lazosEnPalabras(g).map((l) => `${l.nombre}:${l.palabra}`), ['Don Ramón:conocido', 'Josefina:de confianza'], 'sólo los que conocés, sin números');
    ok(H.anotarRaro(g, 'ronda-ramitas', 2) && !H.anotarRaro(g, 'ronda-ramitas', 3) && !H.anotarRaro(g, 'inventado', 3) && g.raro.length === 1, 'el cuaderno de lo raro anota una vez cada indicio, con su fecha');
    ok(H.textoRaro('algo-cruzo').includes('zorro con gorro') && H.textoRaro('x') === '', 'el texto de lo raro');
    ok(!H.marcarTema(g, '__proto__', 'x', 1) && H.marcarTema(g, 'ramon', 'alero', 1) && !H.marcarTema(g, 'ramon', 'alero', 2), 'los temas se marcan una vez');
    const s0 = H.historiaNueva(); s0.activa = true; s0.capitulo = 2;
    ok(H.sumarFletes(s0, { entregas: 9 }) === 0, 'antes del capítulo 4 no cuenta ningún flete');
  }

  // ---------------------------------------------------------------- 5. los disparadores de las escenas
  {
    const base = () => { const p = progresoBase(H); const h = p.historia; H.empezarHistoria(h, 1); h.fase = 'jugando'; h.base = { dia: 1 }; return { p, h }; };
    const quien = (h, p, extra, ctx) => D.escenaPendiente(h, H.estadoHistoria(p, extra), ctx);
    // cada una de las 21 escenas tiene su disparador, y cada disparador una escena conocida
    const ids1 = D.ESCENAS_ACTO1_IDS;
    ok(ids1.length === 21 && new Set(ids1).size === 21, 'son 21 escenas');
    const ids = [...ids1, ...A2D.ESCENAS_ACTO2_IDS, ...A3D.ESCENAS_ACTO3_IDS];   // (4.16.0: y las del acto II)
    const conDisp = new Set(Object.entries(D.DISPARADORES).map(([k, d]) => d.escena || k));
    for (const id of ids1) ok(conDisp.has(id), `${id}: tiene su disparador`);
    for (const id of conDisp) ok(ids.includes(id), `${id}: el disparador es de una escena conocida`);
    for (const [k, d] of Object.entries(D.DISPARADORES)) {
      for (const cc of [].concat(d.cap)) ok(Object.hasOwn(H.CAPITULO, cc), `${k}: el capítulo existe`);   // 4.17.0: una lista de capítulos
      for (const cc of [].concat(d.cap)) ok(H.CAPITULOS.indexOf(H.CAPITULO[cc]) < 13, `${k}: es de un capítulo de la historia`);
      ok(['auto', 'hablar', 'interaccion'].includes(d.modo), `${k}: modo`);
      if (d.modo !== 'auto') ok(typeof d.clave === 'string', `${k}: la clave`);
      for (const r of d.requiere || []) ok(ids.includes(r), `${k}: requiere una escena conocida`);
    }
    for (const id of Object.keys(D.EFECTOS_ESCENA)) ok(ids.includes(id), `${id}: el efecto es de una escena conocida`);
    // los capítulos 1: una a una
    {
      const { p, h } = base();
      ok(quien(h, p, {}) === 'trochita-boleto', 'apenas empieza: el boleto en la trochita');
      EN.marcarVista(h, 'trochita-boleto', 1);
      ok(quien(h, p, {}) === 'estacion-llegada', 'y la llegada a la estación');
      EN.marcarVista(h, 'estacion-llegada', 1);
      ok(quien(h, p, {}) === null, 'después no hay nada hasta el sendero');
      ok(quien(h, p, { lugares: { sendero: 10 } }) === 'algo-cruza', 'algo cruza en el sendero al atardecer (18:15)');
      p.horas = 10; ok(quien(h, p, { lugares: { sendero: 10 } }) === null, 'de día no');
      p.horas = 18.25; ok(quien(h, p, { lugares: { sendero: 40 } }) === null, 'lejos del sendero no');
      EN.marcarVista(h, 'algo-cruza', 1);
      ok(quien(h, p, {}) === null && quien(h, p, {}, { modo: 'interaccion', clave: 'puerta-refugio' }) === 'nota-eusebio', 'la nota de Eusebio se lee con la E en la puerta');
      ok(quien(h, p, {}, { modo: 'interaccion', clave: 'otra-cosa' }) === null && quien(h, p, {}, { modo: 'hablar', clave: 'puerta-refugio' }) === null, 'ni con otra cosa ni de otro modo');
      ok(D.avisoPuerta(h, H.estadoHistoria(p, {})) === 'Abrir con la llave de Eusebio', 'el aviso de la puerta');
      EN.marcarVista(h, 'nota-eusebio', 1);
      ok(D.avisoPuerta(h, H.estadoHistoria(p, {})) === null, 'y después ya no');
      p.horas = 7; p.dia = 1;
      ok(quien(h, p, { lugares: { 'refugio-puerta': 5 } }) === null, 'la ronda de ramitas pide haber dormido (otro día)');
      p.dia = 2;
      ok(quien(h, p, { lugares: { 'refugio-puerta': 5 } }) === 'ronda-umbral', 'la ronda de ramitas, al despertar (cerca de la puerta, donde está la ronda)');
      p.horas = 15; ok(quien(h, p, { lugares: { refugio: 5 } }) === null, 'a la mañana, no a la tarde');
    }
    // capítulo 2
    {
      const { p, h } = base(); h.capitulo = 1; h.base = { dia: 2 }; p.dia = 2; p.horas = 8;
      ok(quien(h, p, { lugares: { refugio: 12 } }) === 'ramon-tranquera', 'Ramón pasa con la majada a la mañana, frente al refugio');
      ok(quien(h, p, { lugares: { refugio: 120 } }) === null, 'si no estás, no');
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === 'ramon-tranquera', 'o le hablás en cualquier parte (nunca traba)');
      p.horas = 20; ok(quien(h, p, {}, { modo: 'hablar', clave: 'ramon' }) === 'ramon-tranquera', 'a cualquier hora');
      EN.marcarVista(h, 'ramon-tranquera', 2);
      ok(quien(h, p, { lugares: { ramos: 4 } }) === 'almacen-ercilia' && quien(h, p, {}, { modo: 'hablar', clave: 'ercilia' }) === 'almacen-ercilia', 'el almacén de Ercilia, entrando o hablándole');
      ok(quien(h, p, {}, { apuntaArbolVivo: true }) === null, 'sin hacha, «Ese no» no sale');
      p.cosas.hacha = 1;
      ok(quien(h, p, {}, {}) === null, 'con el hacha pero sin apuntar a un árbol vivo, tampoco');
      ok(quien(h, p, {}, { apuntaArbolVivo: true }) === 'ese-no-josefina', 'con el hacha apuntando a un árbol vivo: Josefina dice «Ese no»');
      for (const x of ['almacen-ercilia', 'ese-no-josefina']) EN.marcarVista(h, x, 2);
      ok(quien(h, p, { lugares: { refugio: 5 } }) === null, 'hasta que el alero no tenga cuatro tablas, no hay bolsa');
      for (let i = 0; i < 4; i++) H.sumarReparacion(h, 'alero', 4);
      ok(quien(h, p, { lugares: { refugio: 5 } }) === 'bolsa-alero', 'la bolsa aparece al cambiar la cuarta tabla');
      EN.marcarVista(h, 'bolsa-alero', 2);
      h.decisiones.bolsa = 'a';
      ok(quien(h, p, {}, { modo: 'interaccion', clave: 'raiz-coihue' }) === 'bolsa-coihue' && quien(h, p, {}, { modo: 'hablar', clave: 'panadera' }) === null && quien(h, p, {}, { modo: 'hablar', clave: 'ema' }) === null, 'A: sólo la raíz del coihue');
      h.decisiones.bolsa = 'b';
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'panadera' }) === 'bolsa-rosa' && quien(h, p, {}, { modo: 'interaccion', clave: 'raiz-coihue' }) === null, 'B: Rosa');
      h.decisiones.bolsa = 'c';
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'ema' }) === 'bolsa-josefina' && quien(h, p, {}, { modo: 'hablar', clave: 'panadera' }) === null, 'C: Josefina');
    }
    // capítulo 3
    {
      const { p, h } = base(); h.capitulo = 2; h.base = { dia: 3 }; p.dia = 3; p.horas = 9;
      ok(quien(h, p, { lugares: { 'tocon-hacha': 8 } }) === 'hacha-tocon', 'el hacha clavada en el tocón, a la mañana (al acercarte al tocón)');
      EN.marcarVista(h, 'hacha-tocon', 3);
      ok(quien(h, p, { lugares: { plaza: 6 } }) === 'placa-herminia', 'la placa del duende en la plaza');
      EN.marcarVista(h, 'placa-herminia', 3);
      p.horas = 16.5;
      ok(quien(h, p, {}, {}) === null, 'sin visita en la mesa, nada');
      ok(quien(h, p, {}, { visitaActiva: 'nicanor' }) === 'mesa-visita-nicanor', 'la mesa con Nicanor');
      ok(quien(h, p, {}, { visitaActiva: 'ramon' }) === 'mesa-visita-ramon', 'la mesa con Ramón');
      p.horas = 11; ok(quien(h, p, {}, { visitaActiva: 'ramon' }) === null, 'de mañana no');
      // 4.17.1: (las mutaciones «los fletes desde el capítulo 1» y «las escenas en cualquier orden» no tenían quién las atrape)
      { const hf = H.historiaNueva(); H.empezarHistoria(hf, 1); hf.fase = 'jugando'; hf.capitulo = 2; hf.entregasVistas = 0; ok(H.sumarFletes(hf, { entregas: 4 }) === 0 && hf.fletes === 0 && hf.ramal === 0, 'en el capítulo 3 los fletes todavía no cuentan para el ramal'); }
      { const r = base(); r.h.capitulo = 1; r.h.base = { dia: 2 }; r.p.dia = 2; r.p.horas = 10; ok(quien(r.h, r.p, { lugares: { ramos: 5 } }) === null, 'una escena que pide otra antes (el almacén, tras Ramón en la tranquera) no sale sola'); }
      ok(quien(h, p, {}, { modo: 'hablar', clave: 'fermin' }) === 'fermin-galpon', 'Fermín, en el galpón de esquila');
    }
    // capítulo 4
    {
      const { p, h } = base(); h.capitulo = 3; h.base = { dia: 4 }; p.dia = 4; p.horas = 10;
      ok(quien(h, p, { lugares: { estacion: 12 } }) === 'anden-graciela', 'Graciela baja en la estación');
      p.horas = 7; ok(quien(h, p, { lugares: { estacion: 12 } }) === null, 'a las 7 todavía no');
      p.horas = 10; ok(quien(h, p, { lugares: { estacion: 90 } }) === null, 'lejos de la estación no');
      EN.marcarVista(h, 'anden-graciela', 4);
      ok(quien(h, p, { conduciendo: true }) === 'cabina-elsa', 'manejar con Elsa');
      EN.marcarVista(h, 'cabina-elsa', 4);
      h.acompanante = 'graciela';
      ok(quien(h, p, { lugares: { 'casa-te': 5 } }) === 'te-graciela', 'el té con Graciela');
      h.acompanante = null;
      ok(quien(h, p, { lugares: { 'casa-te': 5 } }) === null, 'sin llevarla, no');
      p.eventosValle = { hechos: { derrumbe: { dia: 4, opcion: 'seguir' } } };
      ok(quien(h, p, {}) === 'derrumbe-puertita', 'después del derrumbe, la puertita');
      ok(D.aplicarVistas({ ...h, escenas: { vistas: { 'te-graciela': 4 }, elecciones: {} }, aplicadas: {}, lazos: { ...h.lazos }, raro: [], temas: {} }, 4, {}).length === 1, 'se aplica lo de la escena del té');
    }
    // fuera de la historia nada sale
    {
      const { p, h } = base();
      h.activa = false; ok(quien(h, p, {}) === null, 'en pausa no sale nada');
      h.activa = true; h.fase = 'intro'; ok(quien(h, p, {}) === null, 'con la tarjeta de entrada, tampoco');
      h.fase = 'jugando'; h.capitulo = 5; ok(quien(h, p, {}) === null, 'en el continuará, nada del acto I');
      ok(D.escenaPendiente(null, H.estadoHistoria(p, {}), {}) === null && D.escenaPendiente(h, null, {}) === null, 'sin historia o sin estado, nada');
    }
    // los efectos de ver una escena: una sola vez, también si se salteó
    {
      const { p, h } = base();
      EN.marcarVista(h, 'ramon-tranquera', 2); EN.marcarVista(h, 'algo-cruza', 2); EN.marcarVista(h, 'bolsa-coihue', 3); EN.marcarVista(h, 'te-graciela', 4); EN.marcarVista(h, 'nota-eusebio', 1); EN.marcarVista(h, 'bolsa-alero', 2); EN.marcarVista(h, 'anden-graciela', 4);
      const a1 = D.aplicarVistas(h, 4, {});
      ok(a1.length === 6, `se aplican las seis que dejan algo de este lado (${a1.length})`);
      ok(h.temas['ramon:alero'] && h.entregados['raiz:bolsa-eusebio'] && h.duendes.convidado === 1 && h.temas['graciela:abuelo'] && h.objetos.nota && h.objetos['bolsa-eusebio'] && h.acompanante === 'graciela', 'cada una deja lo suyo');
      ok(D.aplicarVistas(h, 5, {}).length === 0 && h.duendes.convidado === 1, 'la segunda vez no cuenta de nuevo');
    }
  }

  // ---------------------------------------------------------------- 6. el reinicio de las partidas viejas
  {
    const vieja = () => ({ dia: 9, horas: 10, pos: { x: 3, z: 4 }, entradas: { refugio: { dia: 1 } }, materiales: { tabla: 5 }, obras: [{ plano: 'banco-trabajo', x: 0, z: 0 }], personal: { color: 'rojo' }, desafios: { f1: { dia: 2, hora: 3 } }, fotos: 4, ranura: 2, historia: { activa: true, capitulo: 5, fase: 'jugando', empezada: 2 } });
    const H1 = (p) => H.sanearHistoria(p.historia);
    ok(R.REINICIAR_HISTORIAS_VIEJAS === true, 'el reinicio está prendido (decisión del usuario)');
    const p = vieja(); p.historia = H1(p);
    ok(R.historiaVieja(p) && R.debeReiniciar(p, 'relax'), 'una partida de ocho capítulos en curso se reinicia');
    ok(!R.debeReiniciar(p, 'desafio'), 'el Desafío no se toca');
    const libre = vieja(); libre.historia.activa = false; libre.historia = H1(libre);
    ok(R.historiaVieja(libre) && !R.debeReiniciar(libre, 'relax'), 'una historia vieja en pausa (Relax libre) no se reinicia: sólo se limpia la historia');
    const sinHistoria = vieja(); delete sinHistoria.historia;
    ok(!R.historiaVieja(sinHistoria) && !R.debeReiniciar(sinHistoria, 'relax') && !R.debeReiniciar(null, 'relax') && !R.debeReiniciar({ historia: 'x' }, 'relax'), 'el Relax libre sin historia no cambia jamás');
    const nueva = { ...vieja(), historia: H.sanearHistoria({ activa: true, version: 2, capitulo: 1, empezada: 3 }) };
    ok(!R.historiaVieja(nueva) && !R.debeReiniciar(nueva, 'relax'), 'una historia de la versión 2 no se vuelve a reiniciar');
    const hv = vieja(); hv.historia = H.sanearHistoria({ activa: true, hechos: { 'molino:molino': 3 } });
    ok(R.debeReiniciar(hv, 'relax'), 'con los hechos de la historia vieja y sin versión: se reinicia');
    // la partida nueva
    const base = G.progresoNuevo();
    const r = R.reiniciarPartida(vieja(), base, 'copia-previa-historia-4.15.0-p2-20261028-1200.json');
    ok(r.dia === 1 && !r.pos && r.obras.length === 0 && Object.keys(r.entradas).length === 0 && (r.materiales.tabla || 0) === 0, 'todo vuelve a empezar: día, lugar, obras, anotaciones y mochila');
    ok(r.personal.color === 'rojo' && r.desafios.f1 && r.fotos === 4 && r.ranura === 2, 'se conserva cómo sos y el álbum');
    ok(r.historia.activa && r.historia.empezada === 1 && r.historia.version === 2 && r.historia.capitulo === 0 && r.historia.fase === 'intro' && r.historia.avisoReinicio === true, 'la historia arranca de cero, en curso, con el aviso');
    ok(base.historia === undefined && !Object.hasOwn(base, 'pos') === false, 'no toca la partida nueva de partida');
    const t = R.tarjetaAviso(r.historia);
    ok(t.titulo === 'La historia cambió' && t.texto.some((x) => x.includes('copia-previa-historia-4.15.0-p2-20261028-1200.json')) && t.texto.some((x) => x.includes('no se tocaron')), 'la tarjeta de aviso dice dónde quedó la copia');
    ok(R.tarjetaAviso({}).texto.length === 3, 'sin nombre de copia, el aviso sigue');
    igual(H.sanearHistoria(JSON.parse(JSON.stringify(r.historia))).copiaPrevia, 'copia-previa-historia-4.15.0-p2-20261028-1200.json', 'el nombre de la copia viaja con la partida');
    // sin copia no se reinicia: sólo la historia
    const lim = R.limpiarHistoria(vieja());
    ok(lim.dia === 9 && lim.obras.length === 1 && lim.historia.version === 2 && lim.historia.activa === false && lim.historia.capitulo === 0, 'limpiar la historia no toca el mundo');
    // la copia
    ok(/^copia-previa-historia-4\.15\.0-p2-20261028-1530\.json$/.test(R.nombreCopia(2, Date.UTC(2026, 9, 28, 15, 30))) && /^copia-previa-historia-4\.15\.0-p1-/.test(R.nombreCopia(0, NaN)), 'el nombre de la copia');
    ok(R.textoCopia({ a: 1 }) === '{"a":1}' && R.textoCopia(((o) => { o.o = o; return o; })({})) === null, 'el texto de la copia (y una partida rota no tira)');
    const C = requerir('../copias-main.cjs');
    const dir = mkdtempSync(join(tmpdir(), 'hoj-copias-'));
    try {
      const nombre = R.nombreCopia(1, Date.UTC(2026, 9, 28, 12, 0));
      ok(C.escribirCopia(dir, 'hojarasca', nombre, '{"x":1}') === nombre, 'la copia se escribe');
      ok(C.escribirCopia(dir, 'hojarasca', nombre, '{"x":2}').endsWith('-2.json') && readdirSync(join(dir, 'partidas', 'hojarasca', 'copias')).length === 2, 'nunca pisa una copia que ya está');
      ok(readFileSync(join(dir, 'partidas', 'hojarasca', 'copias', nombre), 'utf8') === '{"x":1}', 'y la primera queda intacta');
      ok(C.escribirCopia(dir, '../afuera', nombre, 'x') === null && C.escribirCopia(dir, 'hojarasca', '../../mala.json', 'x') === null && C.escribirCopia(dir, 'hojarasca', 'otra.json', 'x') === null && C.escribirCopia(dir, 'hojarasca', nombre, '') === null, 'rutas y nombres raros no pasan');
      ok(!existsSync(join(dir, 'afuera')), 'nada fuera de la carpeta');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }

  // ---------------------------------------------------------------- 7. los objetos de historia en el mundo
  {
    const p = progresoBase(H); const h = p.historia; H.empezarHistoria(h, 1); h.fase = 'jugando';
    const e = (x = {}) => H.estadoHistoria(p, x);
    const vis = () => D.objetosVisibles(h, e()).sort();
    igual(vis(), ['alero', 'puertitas-raiz'], 'al empezar: el alero roto y las puertitas del coihue (el resto espera a la historia)');
    EN.marcarVista(h, 'nota-eusebio', 1);
    ok(vis().includes('nota-mesa'), 'la nota de Eusebio, después de abrir la puerta');
    ok(D.accionDeObjeto('nota-mesa', h, e()).tipo === 'nota' && D.accionDeObjeto('nota-mesa', h, e()).aviso === 'Releer la nota de Eusebio', 'releer la nota');
    ok(!vis().includes('canto-blanco') && D.accionDeObjeto('canto-blanco', h, e()) === null, 'el canto blanco todavía no está');
    EN.marcarVista(h, 'ronda-umbral', 2);
    ok(vis().includes('canto-blanco') && vis().includes('ronda'), 'la ronda de ramitas y el canto blanco al despertar');
    const ac = D.accionDeObjeto('canto-blanco', h, e());
    ok(ac.tipo === 'marca' && ac.marca === 'canto-blanco' && ac.nota[0] === 'Un canto blanco', 'el canto blanco se levanta con la E');
    H.marcarObjeto(h, 'canto-blanco', 2);
    ok(!vis().includes('canto-blanco') && !vis().includes('ronda'), 'levantado, desaparece del umbral');
    ok(D.accionDeObjeto('alero', h, e()).tipo === 'reparar' && D.accionDeObjeto('alero', h, e()).aviso.includes('(1 de 4)') && D.accionDeObjeto('alero', h, e()).aviso.includes('1 tabla'), 'el alero cuesta una tabla por vez');
    for (let i = 0; i < 4; i++) H.sumarReparacion(h, 'alero', 4);
    ok(!vis().includes('alero') && D.accionDeObjeto('alero', h, e()) === null, 'con cuatro tablas, el alero está arreglado');
    EN.marcarVista(h, 'bolsa-alero', 2);
    ok(vis().includes('bolsa-eusebio') && D.accionDeObjeto('bolsa-eusebio', h, e()).nota[1].includes('Para la raíz del coihue grande'), 'la bolsa de Eusebio y su nota');
    h.decisiones.bolsa = 'a';
    ok(!vis().includes('bolsa-eusebio') && vis().includes('raiz-coihue') && D.accionDeObjeto('raiz-coihue', h, e()).tipo === 'escena', 'decidido A: la raíz del coihue');
    EN.marcarVista(h, 'bolsa-coihue', 3);
    ok(!vis().includes('raiz-coihue'), 'y después ya no');
    h.capitulo = 2;
    ok(vis().includes('hacha-tocon') && D.accionDeObjeto('hacha-tocon', h, e()) === null, 'el hacha en el tocón se ve en el capítulo 3 y no se toca');
    h.capitulo = 3;
    ok(!vis().includes('puertita'), 'la puertita todavía no');
    EN.marcarVista(h, 'derrumbe-puertita', 4);
    ok(vis().includes('puertita') && D.accionDeObjeto('puertita', h, e()).marca === 'puertita', 'la puertita se guarda en la repisa');
    H.marcarObjeto(h, 'puertita', 4);
    ok(!vis().includes('puertita'), 'guardada, desaparece');
    ok(D.objetosVisibles({ activa: false }, e()).length === 0 && D.accionDeObjeto('constructor', h, e()) === null && D.accionDeObjeto('__proto__', h, e()) === null, 'en pausa o con un id raro, nada');
    // dónde van
    const ref = { x: 100, z: 200, rot: 0 };
    ok(Math.abs(O.aMundoRefugio(ref, 0, 3).z - 203) < 1e-9 && Math.abs(O.aMundoRefugio(ref, 2, 0).x - 102) < 1e-9, 'sin giro: x a la derecha, z hacia la puerta');
    const q = O.aMundoRefugio({ ...ref, rot: Math.PI / 2 }, 0, 3);
    ok(Math.abs(q.x - 103) < 1e-9 && Math.abs(q.z - 200) < 1e-9, 'girado un cuarto: la puerta mira a +x');
    const agua = (x, z) => Math.abs(x - 140) < 3 && z > 100;
    const a = O.puntoDeArroyo(ref, agua, 8, 300);
    ok(a && Math.abs(a.x - 140) < 12, 'el arroyo más cercano');
    ok(O.puntoDeArroyo(ref, () => false, 8, 100) === null, 'sin agua cerca, nada');
    const arboles = [{ especie: 'lenga', x: 140, z: 150, esc: 9 }, { especie: 'coihue', x: 130, z: 160, esc: 2 }, { especie: 'coihue', x: 140, z: 170, esc: 5, r: 1 }, { especie: 'coihue', x: 400, z: 400, esc: 9 }];
    ok(O.coihueGrande(arboles, { x: 138, z: 150 }, 45).esc === 5 && O.coihueGrande(arboles, { x: 0, z: 0 }, 20) === null, 'el coihue más grande de los de cerca');
    const mv = O.molinoViejo(ref, agua, arboles);
    ok(mv && mv.arbol.esc === 5 && Math.hypot(mv.raiz.x - 140, mv.raiz.z - 170) >= 1.2, 'el molino viejo y la raíz del coihue grande');
    ok(O.molinoViejo(ref, () => false, arboles) === null && O.molinoViejo(ref, agua, []).arbol === null, 'sin arroyo, nada; sin coihue, la orilla');
    const d = O.distanciasA({ x: 0, z: 0 }, { a: { x: 3, z: 4 }, b: null, c: { x: NaN, z: 1 } }, {});
    ok(d.a === 5 && !Object.hasOwn(d, 'b') && !Object.hasOwn(d, 'c'), 'las distancias a los lugares con nombre');
    ok(O.objetoCercano({ x: 0, z: 0 }, ['x', 'y'], { x: { x: 1, z: 0 }, y: { x: 5, z: 0 } }, () => true) === 'x' && O.objetoCercano({ x: 0, z: 0 }, ['y'], { y: { x: 5, z: 0 } }, () => true) === null && O.objetoCercano({ x: 0, z: 0 }, ['x'], { x: { x: 1, z: 0 } }, () => false) === null, 'el objeto más cercano dentro del alcance y con algo que hacer');
    // las mallas: el material de siempre, sin luces ni shaders propios
    const escena = new THREE.Group();
    const T = { altura: () => 5 };
    const mundo = O.crearObjetosHistoria({ T, escena, refugio: () => ({ x: 10, z: 10, rot: 0.3 }), molino: () => ({ raiz: { x: 50, z: 50 } }) });
    ok(Object.keys(mundo.mallas).length >= 6 && Object.keys(OBJETOS_CON_MALLA()).every((k) => mundo.mallas[k]), 'cada objeto con forma tiene su malla');
    function OBJETOS_CON_MALLA() { const o = {}; for (const k of ['ronda', 'canto-blanco', 'bolsa-eusebio', 'alero', 'puertita', 'hacha-tocon', 'raiz-coihue']) o[k] = 1; return o; }
    ok(!mundo.mallas['nota-mesa'] && mundo.posiciones['nota-mesa'], 'la nota de la mesa no tiene malla pero sí lugar');
    const mats = new Set(Object.values(mundo.mallas).map((m) => m.material));
    ok(mats.size === 1 && [...mats][0].isMeshLambertMaterial && [...mats][0].vertexColors === true, 'un solo material, el de las estructuras (Lambert con color por vértice)');
    let luces = 0; escena.traverse((o) => { if (o.isLight) luces++; });
    ok(luces === 0, 'ninguna luz nueva');
    mundo.mostrar(['canto-blanco']);
    ok(mundo.mallas['canto-blanco'].visible && !mundo.mallas.ronda.visible && !mundo.mallas.alero.visible, 'se ve sólo lo que dice la historia');
    mundo.mostrar([]); ok(Object.values(mundo.mallas).every((m) => !m.visible), 'y nada si no hay historia');
    const pr = mundo.mallas['raiz-coihue'].position;
    ok(Math.abs(pr.x - 50) < 1e-9 && Math.abs(pr.z - 50) < 1e-9 && pr.y === 5, 'la raíz queda donde la dejó el mapa');
    const sinMolino = O.crearObjetosHistoria({ T, escena: new THREE.Group(), refugio: () => ({ x: 10, z: 10, rot: 0 }), molino: () => null });
    ok(!sinMolino.mallas['raiz-coihue'], 'sin molino viejo, sin raíz (no rompe)');
  }

  // ---------------------------------------------------------------- 8. los efectos y condiciones con nombre
  {
    const efectos = {}, conds = {};
    const reg = { registrarEfecto: (k, f) => { efectos[k] = f; }, registrarCondicion: (k, f) => { conds[k] = f; } };
    const h = H.historiaNueva(); h.activa = true;
    let diaX = 3, opcion = 'ayudar';
    X.registrarEfectosHistoria(reg, { historia: () => h, dia: () => diaX, estado: () => H.estadoHistoria({ dia: 4, eventosValle: { hechos: { derrumbe: { dia: 4 } } } }, {}), opcionDeEvento: () => opcion });
    for (const k of ['lazo', 'raro', 'objeto', 'dar-objeto', 'tema', 'entrega', 'ramal', 'acompanante']) ok(typeof efectos[k] === 'function', `efecto ${k}`);
    for (const k of ['decision', 'lazo', 'ramal', 'evento', 'derrumbe-ayudo', 'acompanante']) ok(typeof conds[k] === 'function', `condición ${k}`);
    efectos.lazo({ quien: 'ramon', n: 1 }, { escena: 'x' }); efectos.lazo({ quien: 'ramon', n: 1 }, { escena: 'x' });
    ok(h.lazos.ramon === 1, 'un lazo pedido dos veces por la misma escena cuenta una');
    efectos.lazo({ quien: 'ramon', n: 1 }, { escena: 'y' });
    ok(h.lazos.ramon === 2, 'en otra escena, otro lazo');
    efectos.lazo({ quien: 'nadie', n: 1 }, { escena: 'z' }); efectos.lazo(null, null);
    ok(h.lazos.ramon === 2, 'con basura no pasa nada');
    efectos.raro({ id: 'ronda-ramitas' }); efectos.raro({ id: 'ronda-ramitas' }); ok(h.raro.length === 1, 'lo raro, una vez');
    efectos['dar-objeto']({ id: 'puertita' }); ok(h.objetos.puertita === 3, 'dar un objeto');
    efectos.tema({ quien: 'ema', tema: 'abuelo' }); efectos.entrega({ quien: 'ema', cosa: 'bolsa' }); ok(h.temas['ema:abuelo'] && h.entregados['ema:bolsa'], 'tema y entrega');
    efectos.ramal({ n: 2 }, { escena: 'a' }); efectos.ramal({ n: 2 }, { escena: 'a' }); ok(h.ramal === 2, 'el ramal, una vez por escena');
    efectos.acompanante({ quien: 'graciela' }); ok(h.acompanante === 'graciela', 'acompañante'); efectos.acompanante({ quien: 'cualquiera' }); ok(h.acompanante === null, 'y se suelta');
    h.decisiones.bolsa = 'a';
    ok(conds.decision({ args: { id: 'bolsa', es: 'a' } }) && !conds.decision({ args: { id: 'bolsa', es: 'b' } }) && !conds.decision({}), 'condición de decisión');
    ok(conds.lazo({ args: { quien: 'ramon', min: 2 } }) && !conds.lazo({ args: { quien: 'ramon', min: 3 } }), 'condición de lazo');
    ok(conds.ramal({ args: { min: 2 } }) && !conds.ramal({ args: { min: 3 } }), 'condición de ramal');
    ok(conds.evento({ args: { id: 'derrumbe' } }) && !conds.evento({ args: { id: 'tobillo' } }) && conds.evento({ args: { id: 'derrumbe', opcion: 'ayudar' } }) && !conds.evento({ args: { id: 'derrumbe', opcion: 'seguir' } }), 'condición de evento y su opción');
    ok(conds['derrumbe-ayudo']() && (opcion = 'seguir', !conds['derrumbe-ayudo']()), 'ayudar en el derrumbe');
    // un registro real del director de escenas
    const dir = EN.crearDirector({ mundo: {}, estado: () => h.escenas, dia: () => 1 });
    X.registrarEfectosHistoria(dir, { historia: () => h, dia: () => 1, estado: () => null });
    const r = dir.registrar({ id: 'prueba-efectos', pasos: [{ tipo: 'efecto', nombre: 'lazo', args: { quien: 'fermin', n: 1 } }, { tipo: 'dialogo', quien: 'jugador', lineas: ['Hola'] }] });
    ok(r.ok, `una escena que usa los efectos con nombre se registra (${r.errores})`);
  }

  // ---------------------------------------------------------------- 8a. los efectos de las escenas de B (lazo:ema:2, decision:bolsa:a…)
  {
    const A1 = await import('../src/historia-escenas-acto1.js');
    const efectos = {}, conds = {}, llamados = [];
    const h = H.historiaNueva(); h.activa = true;
    X.registrarEfectosHistoria({ registrarEfecto: (k, f) => { efectos[k] = f; }, registrarCondicion: (k, f) => { conds[k] = f; } }, { historia: () => h, dia: () => 5, estado: () => H.estadoHistoria({ dia: 5, eventosValle: { hechos: { tobillo: { dia: 4 } } } }, {}) });
    X.registrarEfectosActo1({ registrarEfecto: (k, f) => { efectos[k] = f; } }, { historia: () => h, dia: () => 5, dar: (c, n) => llamados.push(['dar', c, n]), mundo: (id) => llamados.push(['mundo', id]), duende: (id, args) => llamados.push(['duende', id, args.tipo]) }, A1.EFECTOS_ACTO1);
    for (const nombre of A1.EFECTOS_ACTO1) ok(typeof efectos[nombre] === 'function', 'registrado: ' + nombre);
    efectos['lazo:ema:2']({}, { escena: 's' }); efectos['lazo:ema:2']({}, { escena: 's' });
    ok(h.lazos.ema === 2, 'lazo:ema:2 una sola vez por escena');
    efectos['lazo:rosa:1']({}, { escena: 's' }); ok(h.lazos.ema === 2, 'un secundario sin lazo se ignora');
    efectos['decision:bolsa:b'](); ok(h.decisiones.bolsa === 'b', 'decision:bolsa:b');
    efectos['decision:bolsa:c'](); ok(h.decisiones.bolsa === 'c', 'la última acción manda');
    efectos['ramal:2']({}, { escena: 's' }); efectos['ramal:2']({}, { escena: 's' }); ok(h.ramal === 2, 'ramal:2 una vez');
    efectos['raro:ronda-ramitas'](); ok(h.raro.length === 1, 'raro con el id de B');
    efectos['hablado:fermin'](); ok(h.hablados.fermin === true, 'hablado:fermin cuenta para conocer a los vecinos');
    efectos['objeto:puertita'](); efectos['entrega:bolsa-eusebio']();
    ok(h.temas['obj:puertita'] && h.entregados['obj:bolsa-eusebio'] && !h.objetos.puertita, 'objeto y entrega se anotan sin tocar los objetos del mundo');
    efectos['dar:pan-casero:3']({}, { escena: 's' }); efectos['dar:pan-casero:3']({}, { escena: 's' });
    efectos['mundo:ronda-ramitas']({}, { escena: 's' }); efectos['duende:pillo-cruza']({ tipo: 'rastreador' });
    ok(JSON.stringify(llamados) === JSON.stringify([['dar', 'pan-casero', 3], ['mundo', 'ronda-ramitas'], ['duende', 'pillo-cruza', 'rastreador']]), 'dar (una vez), mundo y duende llegan a main');
    h.decisiones.bolsa = null;
    ok(conds.decision({ args: { d: 'bolsa', es: 'ninguna' } }) && !conds.decision({ args: { d: 'bolsa', es: 'a' } }), 'condición decision con «ninguna» (la de B)');
    h.decisiones.bolsa = 'a'; ok(conds.decision({ args: { d: 'bolsa', es: 'a' } }), 'y con la elegida');
    ok(conds.lazo({ args: { quien: 'ema', min: 2 } }) && !conds.lazo({ args: { quien: 'ema', max: 1 } }) && conds.evento({ args: { id: 'tobillo' } }), 'condiciones lazo (min y max) y evento');
    // las escenas de B corren con el director y dejan lo que dicen
    const dir = EN.crearDirector({ mundo: { puedeEmpezar: () => true }, estado: () => h.escenas, dia: () => 5 });
    X.registrarEfectosHistoria(dir, { historia: () => h, dia: () => 5, estado: () => null });
    X.registrarEfectosActo1(dir, { historia: () => h, dia: () => 5 }, A1.EFECTOS_ACTO1);
    const reg = Object.values(A1.ESCENAS_ACTO1).map((e) => dir.registrar(e).ok);
    ok(reg.length === 21 && reg.every(Boolean), 'las 21 escenas de B se registran en el director');
    ok(Object.values(A1.ESCENAS_ACTO1).every((e) => dir.efectosFaltantes(e.id).length === 0), 'y ninguna pide un efecto sin registrar');
    for (const id of D.ESCENAS_ACTO1_IDS) ok(Object.hasOwn(A1.ESCENAS_ACTO1, id), id + ': existe en el archivo de B');
    for (const e of Object.values(A1.ESCENAS_ACTO1)) for (const c of (await import('../src/historia-escenas-util.js')).condicionesDe(e)) ok(typeof conds[c] === 'function', 'condición registrada: ' + c);
  }

  // ---------------------------------------------------------------- 8b. Graciela Pugh, la persona nueva
  {
    const GR = await imp('historia-graciela.js');
    const AS = await import('../src/gente-ropa.js');
    const h = H.historiaNueva(); H.empezarHistoria(h, 1); h.fase = 'jugando';
    ok(!GR.debeExistir(h) && !GR.debeVerse(h), 'en el capítulo 1 Graciela no existe');
    h.capitulo = 2; ok(!GR.debeExistir(h), 'en el capítulo 3 tampoco');   // 4.17.1: (la mutación «Graciela en el capítulo 3» no tenía quién la atrape)
    h.capitulo = 0;
    h.capitulo = 3;
    ok(GR.debeExistir(h) && !GR.debeVerse(h), 'en el capítulo 4 existe (llega en la trochita) pero no se ve hasta bajar');
    EN.marcarVista(h, 'anden-graciela', 4);
    ok(GR.debeVerse(h), 'bajó del tren: se ve');
    h.fase = 'outro'; ok(GR.debeExistir(h), 'hasta cerrar el capítulo se queda');
    h.capitulo = 4; h.fase = 'jugando'; ok(!GR.debeExistir(h) && !GR.debeVerse(h), 'cerrado el capítulo, se queda en el hospedaje (sale del mundo)');
    ok(!GR.debeExistir({ ...h, activa: false, capitulo: 3 }) && !GR.debeExistir(null), 'en pausa, o sin historia, no');
    // el controlador, con una gente de mentira
    const quitados = [], armados = [];
    const gente = { armarPobladorDeAPoco: (def) => { armados.push(def); let pasos = 0; const t = { npc: null, avanzar: () => { pasos++; if (pasos < 3) return false; t.npc = { pos: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, g: { rotation: { y: 0 } }, dormido: false, camino: [{ x: 1 }] }; return true; } }; return t; }, quitar: (n) => quitados.push(n) };
    const hh = H.historiaNueva(); H.empezarHistoria(hh, 1); hh.fase = 'jugando'; hh.capitulo = 3;
    let escena = false, ms = 3;
    const m = GR.crearGracielaMundo({ gente: () => gente, historia: () => hh, anden: () => ({ x: 10, z: 20, mira: { x: 10, z: 30 } }), altura: () => 7, tomada: () => escena, ms: () => ms });
    ms = 0; m.actualizar(); ok(armados.length === 0, 'sin cupo de tiempo no se arma nada');
    ms = 3; m.actualizar(); m.actualizar(); ok(armados.length === 1 && m.npc() === null && m.armando(), 'se arma de a poco (unos cuadros)');
    m.actualizar();
    const g = m.npc();
    ok(g && g.dormido === true && g.camino.length === 0, 'armada, espera dormida (sin verse) hasta que baje del tren');
    ok(armados[0].clave === 'graciela' && armados[0].mano === 'planilla' && /ingeniera/.test(armados[0].oficio) && armados[0].pos.x === 10, 'con su nombre, su oficio y la tablilla en la mano');
    EN.marcarVista(hh, 'anden-graciela', 4);
    escena = true; m.actualizar(); ok(g.dormido === true, 'si una escena la tiene, no se toca');
    escena = false; m.actualizar();
    ok(g.dormido === false && g.pos.x === 10 && g.pos.z === 20 && g.pos.y === 7 && Math.abs(g.g.rotation.y) < 1e-9, 'bajó del tren: aparece en el andén, mirando a la vía');
    g.pos.x = 99; m.actualizar(); ok(g.pos.x === 99, 'y ahí se queda (no se la reubica cada cuadro)');
    hh.capitulo = 4; m.actualizar();
    ok(quitados.length === 1 && quitados[0] === g && m.npc() === null, 'al cerrar el capítulo, sale del mundo');
    m.actualizar(); ok(armados.length === 1, 'y no se vuelve a armar');
    ok(GR.crearGracielaMundo({ gente: () => ({}), historia: () => hh }).actualizar() === undefined, 'sin la gente armada no rompe');
    // su ropa y su lugar entre los personajes de las escenas
    const a = AS.ASPECTO.graciela;
    ok(a && a.mujer && a.R.rodete && a.R.campera === 'larga' && a.colores.abrigo === '#6a6d72' && !a.R.trenza, 'su ropa: sobretodo gris y rodete (en gente-ropa.js)');
    ok(EN.PERSONAJES_BASE.graciela.clave === 'graciela' && EN.PERSONAJES_BASE.fermin.clave === 'fermin' && EN.PERSONAJES_BASE.graciela.nombre === 'Graciela', 'las escenas conocen a Graciela y a Fermín');
    const Pu = leer('src/historia-graciela.js');
    ok(!/from 'three'|document\.|window\./.test(Pu) && Pu.includes("import { capituloActual } from './historia.js';"), 'el módulo no toca three ni el DOM');
    ok(leer('src/main.js').includes("gracielaDeHistoria()?.actualizar();") && leer('src/main.js').includes("import { crearGracielaMundo } from './historia-graciela.js';"), 'enganchada en main.js');
  }

  // ---------------------------------------------------------------- 9. el enganche con el juego (por texto)
  {
    for (const f of ['src/historia.js', 'src/historia-disparadores.js', 'src/historia-reinicio.js', 'src/historia-escenas-efectos.js']) {
      const t = leer(f);
      ok(!/from 'three'|document\.|window\./.test(t), `${f} es puro`);
      for (const m of t.matchAll(/^export\s+(?:const|function)\s+([^\s(=,]+)/gm)) ok(!/ñ/i.test(m[1]), `${f}: ${m[1]} sin eñe`);
    }
    for (const f of ['src/historia.js', 'src/historia-ui.js', 'src/historia-disparadores.js', 'src/historia-reinicio.js', 'src/historia-escenas-efectos.js', 'src/historia-objetos.js', 'src/historia-escenas-acto1.js']) {
      for (const m of leer(f).matchAll(/^import .+$/gm)) ok(/^import (?:\{ [^}]+ \}|\* as THREE) from '(?:\.\/[a-z0-9-]+\.js|three)';$/.test(m[0]), `${f}: import en una línea (${m[0]})`);
      ok(!/\r/.test(leer(f)), `${f}: fines de línea LF`);
      ok(!/ (?:the|you|your|with|and|of) /i.test(leer(f).split('\n').filter((l) => /^\s*(?:'|\{ id:)/.test(l) && /«|»|[áéíóú]/.test(l)).join('\n')), `${f}: los textos van en castellano`);
    }
    const main = leer('src/main.js');
    for (const frag of [
      "import { ESCENAS_ACTO1, EFECTOS_ACTO1 } from './historia-escenas-acto1.js';",
      "import { debeReiniciar, historiaVieja, reiniciarPartida, limpiarHistoria, nombreCopia, textoCopia } from './historia-reinicio.js';",
      'if (progreso && !esDesafio && historiaVieja(progreso)) {',
      'if (debeReiniciar(progreso, \'relax\')) {',
      'registrarEfectosHistoria(escenasMundo,',
      'for (const e of [...Object.values(ESCENAS_ACTO1), ...Object.values(ESCENAS_ACTO2), ...Object.values(ESCENAS_ACTO3)])',
      "if (!desafio && valle?.alHablarCon?.(npc.clave)) return;",
      'valle?.hablo(npc.clave);',
      'historiaPuerta: () => historiaPuertaCerca(),',
      '!escenasMundo?.activa(),   // (4.15.0: ni una tarjeta encima de una escena)',
      'lugares: distanciasHistoria()',
      'comenzarEnEstacion: () => comenzarEnLaEstacion()',
      'valle.aplicarEscenas(valle.historia())',
    ]) ok(main.includes(frag), `main.js: ${frag.slice(0, 70)}`);
    ok(main.indexOf('historiaVieja(progreso)') < main.indexOf('const origenGuardado'), 'el reinicio corre antes de armar nada con la partida');
    ok(/guardarCopiaPrevia\(progreso\);\s*\n\s*if \(copia\) \{ progreso = reiniciarPartida\(/.test(main), 'primero la copia, después el reinicio; sin copia no se reinicia');
    const inter = leer('src/interacciones.js');
    ok(inter.includes("id: 'historia-puerta'") && inter.includes("id: 'historia-objeto'") && inter.indexOf("id: 'historia-objeto'") > inter.indexOf("id: 'vecino'") && inter.indexOf("id: 'historia-objeto'") < inter.indexOf("id: 'empleo'"), 'las interacciones, después del vecino y antes del resto');
    ok(leer('preload.cjs').includes("ipcRenderer.sendSync('copia-escribir'") && leer('main.cjs').includes("require('./copias-main.cjs').registrarCopias(") && JSON.parse(leer('package.json')).build.files.includes('copias-main.cjs'), 'la copia previa: preload, main y paquete');
    const ui = leer('src/historia-ui.js');
    for (const frag of ['mostrarAvisoReinicio(h)', 'decisionPendiente(h, s)', 'lanzarEscena(h, s, { modo: \'auto\' })', 'aplicarEscenas(h)', 'objetosVisibles(h, s)', 'lazosEnPalabras(h)', 'ramal-', 'COMIENZO.horas', 'marcarVista(h, id, ctx.progreso().dia)']) ok(ui.includes(frag.replace('ramal-', 'class="ramal"')), `historia-ui.js: ${frag}`);
    ok(ui.includes('trece capítulos') && !/Ocho cap/.test(ui), 'la portada habla de los trece capítulos');
    ok(ui.includes('(ctx.progreso().pos || historia().avisoReinicio)) ctx.ajustes().relaxTipo'), 'la partida reiniciada se abre en modo Historia aunque la portada estuviera en Libre');
    const acto = leer('src/historia-escenas-acto1.js');
    ok(/export const ESCENAS_ACTO1 = /.test(acto), 'el archivo de las escenas del acto I exporta ESCENAS_ACTO1');
    const E1 = await import('../src/historia-escenas-acto1.js');
    ok(E1.ESCENAS_ACTO1 && typeof E1.ESCENAS_ACTO1 === 'object', 'y es un objeto id → escena');
    for (const [id, esc] of Object.entries(E1.ESCENAS_ACTO1)) {
      ok(esc.id === id && D.ESCENAS_ACTO1_IDS.includes(id), `${id}: id de escena conocido`);
      const v = EN.validarEscena(esc);
      ok(v.ok, `${id}: escena bien armada (${(v.errores || []).join('; ')})`);
    }
    ok(!/\bshader|ShaderMaterial|PointLight|SpotLight\b/.test(leer('src/historia-objetos.js').replace(/\/\/.*$/gm, '')), 'los objetos no tocan shaders ni luces');
  }
  return fallas - f0;
}

const base = await chequear();
ok(base === 0, 'el código de verdad pasa todo');

// ---------------------------------------------------------------- mutaciones
// Se rompe una cosa a la vez y se vuelve a correr todo: tiene que fallar.
const MUT = [
  ['historia.js', 'export const LAZO_MIN = -2, LAZO_MAX = 3;', 'export const LAZO_MIN = -2, LAZO_MAX = 9;', 'el lazo sin techo'],
  ['historia.js', "h.lazos[k] = Math.max(LAZO_MIN, Math.min(LAZO_MAX, Math.trunc(Number(obj(v.lazos)[k]) || 0)));", "h.lazos[k] = Math.trunc(Number(obj(v.lazos)[k]) || 0);", 'el saneo deja pasar cualquier lazo'],
  ['historia.js', "h.decisiones[d] = x === 'a' || x === 'b' || x === 'c' ? x : null;", "h.decisiones[d] = x ?? null;", 'el saneo acepta cualquier decisión'],
  ['historia.js', "(conRastro ? 1 : VERSION_HISTORIA)", "VERSION_HISTORIA", 'sin versión y con rastro ya no es vieja'],
  ['historia.js', "export const llegar = (lugar, radio = 12) => (s) => Number(s.lugares?.[lugar]) <= radio;", "export const llegar = (lugar, radio = 12) => (s) => Number(s.lugares?.[lugar]) <= radio * 10;", 'llegar sin respetar el radio'],
  ['historia.js', "(s) => (s.reparaciones[id] || 0) >= n;", "(s) => (s.reparaciones[id] || 0) >= 1;", 'reparar se da por hecho con una'],
  ['historia.js', "const enHora = (h, a, b) => { const x = ((Number(h) % 24) + 24) % 24; return a <= b ? x >= a && x < b : x >= a || x < b; };", "const enHora = (h, a, b) => { const x = ((Number(h) % 24) + 24) % 24; return x >= a && x < b; };", 'la hora no cruza la medianoche'],
  ['historia.js', "|| (Number(b?.dia) > 0 && s.dia - b.dia >= tope);", "|| false;", 'la estación espera para siempre'],
  ['historia.js', "  if (d[id] != null) return null;   // una sola vez", "", 'una decisión se puede tomar dos veces'],
  ['historia.js', "  if (o.requiere && s && !o.requiere(s)) return null;", "", 'Rosa se elige sin haber llegado'],
  ['historia.js', "  const cabe = Math.max(0, RAMAL_MAX_FLETES - ent(h.fletes, 99));", "  const cabe = 99;", 'los fletes suman sin tope'],
  ['historia.js', "  if (!h?.activa || (h.capitulo || 0) < 3) return 0;   // desde el capítulo 4", "  if (!h?.activa) return 0;", 'los fletes cuentan desde el capítulo 1'],
  ['historia.js', "  if ((h.capitulo || 0) >= 3) panel.ramal", "  if ((h.capitulo || 0) >= 0) panel.ramal", 'la barra del ramal desde el principio'],
  ['historia.js', "  if (h.raro.some((x) => x.id === id)) return false;", "", 'lo raro se anota repetido'],
  ['historia.js', "export const CAPITULOS_CON_PRESENCIA = ['perdido', 'cosecha', 'cuaderno'];", "export const CAPITULOS_CON_PRESENCIA = ['llave', 'perdido', 'cosecha', 'cuaderno'];", 'duendes de lejos desde el capítulo 1'],
  ['historia-disparadores.js', "    if (d.despues && !(s.dia > (Number(h.base?.dia) || 1))) continue;\n", "", 'la ronda de ramitas sin dormir'],
  ['historia-disparadores.js', "cond: (s) => s.decisiones.bolsa === 'b' }", "cond: (s) => true }", 'Rosa sale aunque no la hayas elegido'],
  ['historia-disparadores.js', "    if (Object.hasOwn(h.aplicadas, id)) continue;\n", "", 'los efectos de una escena se cuentan dos veces'],
  ['historia-disparadores.js', "    if (d.requiere && !d.requiere.every((x) => s.escenas.has(x))) continue;\n", "", 'las escenas salen en cualquier orden'],
  ['historia-reinicio.js', "return REINICIAR_HISTORIAS_VIEJAS && modo === 'relax' && historiaVieja(p) && p.historia.activa === true;", "return REINICIAR_HISTORIAS_VIEJAS && historiaVieja(p) && p.historia.activa === true;", 'el Desafío también se reinicia'],
  ['historia-reinicio.js', "return REINICIAR_HISTORIAS_VIEJAS && modo === 'relax' && historiaVieja(p) && p.historia.activa === true;", "return REINICIAR_HISTORIAS_VIEJAS && modo === 'relax' && historiaVieja(p);", 'la historia vieja en pausa también se reinicia'],
  ['historia-reinicio.js', "if (v.personal !== undefined) p.personal = v.personal;", "", 'el reinicio pierde cómo sos'],
  ['historia-reinicio.js', "h.activa = true; h.empezada = 1; h.avisoReinicio = true;", "h.activa = true; h.empezada = 1; h.avisoReinicio = false;", 'sin tarjeta de aviso'],
  ['historia-reinicio.js', "export const REINICIAR_HISTORIAS_VIEJAS = true;", "export const REINICIAR_HISTORIAS_VIEJAS = false;", 'el reinicio apagado'],
  ['historia-graciela.js', "export const debeVerse = (h) => debeExistir(h) && !!h.escenas?.vistas && Object.hasOwn(h.escenas.vistas, ESCENA_ANDEN);", 'export const debeVerse = (h) => debeExistir(h);', 'Graciela se ve antes de bajar del tren'],
  ['historia-graciela.js', 'if (ctx.tomada?.()) return;', '', 'Graciela se reubica aunque una escena la tenga'],
  ['historia-graciela.js', "export const CAPITULOS_GRACIELA = ['ramal'];", "export const CAPITULOS_GRACIELA = ['ramal', 'mesa'];", 'Graciela en el capítulo 3'],
  ['historia-objetos.js', "if (a.especie !== 'coihue') continue;", "if (a.especie === 'coihue') continue;", 'el coihue grande no es coihue'],
  ['historia-objetos.js', "const radio = Object.hasOwn(OBJETOS, id) && (OBJETOS[id].forma === 'raiz' || OBJETOS[id].lugar === 'molino-viejo') ? 3.4 : RADIO_OBJETO;", "const radio = 100;", 'el objeto se alcanza desde cualquier lado'],
  ['historia-escenas-efectos.js', "if (h && PERSONAS_LAZO.includes(a?.quien) && una(h, clave('lazo', c?.escena, a.quien, a.n))) cambiarLazo(h, a.quien, a.n);", "if (h && PERSONAS_LAZO.includes(a?.quien)) cambiarLazo(h, a.quien, a.n);", 'los efectos de lazo no son idempotentes'],
];
let atrapadas = 0, iMut = 0;
for (const [archivo, de, a, que] of MUT) {
  const orig = leer(`src/${archivo}`);
  if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
  const sufijo = `.mut${++iMut}`;   // 4.17.1: un archivo por mutación (ESM guarda el módulo por URL: con el mismo nombre se volvía a medir la primera)
  const dest = join(raiz, 'src', archivo.replace('.js', `${sufijo}.js`));
  writeFileSync(dest, orig.replace(de, () => a));
  const antes = fallas, antesN = n;
  callado = true;
  try {
    const r = await chequear(archivo, sufijo);
    if (r > 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
  } catch { atrapadas++; }
  finally { rmSync(dest, { force: true }); callado = false; }
  fallas = antes; n = antesN;
}
ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);

console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.15.0 Historia nueva (fundación y acto I) · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
