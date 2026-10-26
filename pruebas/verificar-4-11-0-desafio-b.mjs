// 4.11.0 (rama desafio-b): «Otra vuelta» se lleva todo lo del guardián y lo elegido al empezar (E2), y las órdenes a los vecinos y los
// refuerzos de la noche silenciosa persisten (C11 / B11c). Cada regla tiene su mutación a propósito: se rompe el código (en un archivo
// temporal, o sobre el texto) y la comprobación de esa regla tiene que fallar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const SRC = new URL('../src/', import.meta.url);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const igual = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };

const datos = new Map();
globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };

const R = await import('../src/desafio-reglas.js');
const V0 = await import('../src/desafio-vuelta-nueva.js');
const { sanearHabilidades, puntoPorNoche, nivelDe } = await import('../src/desafio-habilidades.js');
const { bonoDe, bonoAplicado } = await import('../src/desafio-bonos.js');
const { efectosDe, metaDePartida } = await import('../src/desafio-meta.js');
const { nivelEstudio, danoContraTipo } = await import('../src/desafio-bestiario-premia.js');
const { vistosNuevos } = await import('../src/desafio-trofeos.js');
const { sanearOrdenes, sanearPuestosAliados, ordenDe, siguienteOrden } = await import('../src/desafio-ordenes.js');
const { enUnaLinea } = await import('./ayuda-codigo.mjs');

// ---------------------------------------------------------------- la partida que termina (campaña ganada con todo lo ganado)
function campanaGanada() {
  const meta = metaDePartida({ modo: 'pesadilla', ventajas: ['salud', 'perro'], reglas: ['sinReparar', 'nochesLargas'] });
  Object.assign(meta, { aplicado: true, semillaDada: true, limpias: 6, lugaresCaidos: 2, final: 'aldea' });
  const d = R.sanearDesafio({
    victoria: true, nido: { caido: true }, noches: 24, oleadas: 24, abatidos: 900, vuelta: 1, semilla: 'COIHUE-4821', planos: ['escudo', 'faro'], pistolaEncontrada: true,
    habilidades: { puntos: 3, noche: 24, niveles: { pulso: 2, corazon: 1, pies: 3 } },
    bestiario: { rastreador: { vistos: 80, abatidos: 70, dia: 12, lados: { rio: 5, monte: 9 } }, jefe: { vistos: 4, abatidos: 4, dia: 20 } },
    crece: { trofeos: { casco: 5, hongo: 10, pina: 20 }, vistos: { jefe: 20, pina: true, corona: false, raiz: false }, perro: { noches: 9 } },
    meta,
    ordenes: { ramon: 'seguime', ema: 'puesto' }, puestosAliados: { ema: { x: 10, z: 12 } },
    companeros: ['ramon', 'ema'], flechas: 50, emplastos: 3,
  });
  // los bonos que tenía la partida de antes: los de las habilidades (recalculados al sanear) más los de otros orígenes
  d.bonos.origen.trofeo = { saludMax: 5, recarga: 0.06 };
  d.bonos.origen.ventaja = { saludMax: 15 };
  d.bonos.origen.defensa = { reparar: 0.1 };
  return { cosas: { hacha: 1, lanza: 1, farol: 1 }, dia: 31, materiales: { tronco: 90 }, obras: [{ plano: 'empalizada' }], desafio: d };
}
const base = () => ({ dia: 1, materiales: { tronco: 6, tabla: 6, piedra: 6 }, obras: [], cosas: { hacha: 1 }, desafio: R.desafioNuevo() });

// ---------------------------------------------------------------- las comprobaciones de «Otra vuelta» (sobre un módulo `V`)
const vuelta = {
  habilidades(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    igual(nueva.habilidades.niveles, { pulso: 2, corazon: 1, pies: 3 }, 'los niveles de las habilidades viajan');
    ok(nueva.habilidades.puntos === 3, 'y los puntos sin gastar');
  },
  puntosNuevos(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    ok(nueva.habilidades.noche === 0, 'la última noche que dio punto vuelve a cero');
    ok(puntoPorNoche(nueva, 1) === true && nueva.habilidades.puntos === 4, 'la noche 1 de la vuelta nueva da su punto (con la noche 24 anotada no daría ninguno hasta la 25)');
  },
  bonosHabilidad(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    // pulso 2: dano 0,12 y alcance 0,10; corazón 1: saludMax 10; pies 3: correr 0,13
    ok(bonoDe(nueva, 'dano') === 0.12 && bonoDe(nueva, 'alcance') === 0.1 && bonoDe(nueva, 'saludMax') === 10 && bonoDe(nueva, 'correr') === 0.13, 'los bonos del origen «habilidad» se rehacen desde los niveles');
  },
  bonosOrigenes(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    for (const o of ['trofeo', 'ventaja', 'defensa']) ok(!Object.hasOwn(nueva.bonos.origen, o), `el origen «${o}» no viaja: se recalcula con el tablero en pie, el arranque y las obras de la vuelta nueva`);
    ok(bonoDe(nueva, 'recarga') === 0 && bonoDe(nueva, 'reparar') === 0, 'sin tablero ni defensas no hay bonos de ellos');
  },
  salud(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    ok(nueva.salud === 110, 'se arranca con la salud máxima de las habilidades (100 + 10), no con 100');
  },
  bestiario(V) {
    const viejo = campanaGanada();
    const nueva = V.nuevaVuelta(viejo, base()).desafio;
    igual(nueva.bestiario, viejo.desafio.bestiario, 'el bestiario entero viaja (vistos, abatidos y lados)');
    ok(nivelEstudio(nueva.bestiario, 'rastreador') === 3 && nivelEstudio(nueva.bestiario, 'jefe') === 3, 'los estudios quedan hechos (el del mandamás con sus 1/2/4)');
    ok(danoContraTipo(nueva.bestiario, 'rastreador') > 1, 'y el +5 % de daño del tercer estudio sigue');
    ok(nueva.bestiario !== viejo.desafio.bestiario, 'es una copia: no comparte el objeto con la partida vieja');
  },
  trofeos(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    igual(nueva.crece.trofeos, { casco: 5, hongo: 10, pina: 20 }, 'los trofeos ganados viajan (quedan guardados hasta que armes un tablero)');
  },
  trofeosLimpios(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    igual(nueva.crece.vistos, vistosNuevos(), 'lo «ya mirado» se limpia: un trofeo que se hubiera perdido se puede volver a ganar');
    ok(nueva.crece.perro.noches === 0, 'el perro curtido es de la partida: arranca sin curtir');
  },
  reglas(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    ok(nueva.meta.modo === 'pesadilla', 'el modo');
    igual(nueva.meta.ventajas, ['salud', 'perro'], 'las ventajas');
    igual(nueva.meta.reglas, ['sinReparar', 'nochesLargas'], 'y las reglas');
    const e = efectosDe(nueva.meta);
    ok(e.cantidad === 1.3 && e.sinReparar && e.nochesLargas && e.perro === 1.5, 'y tienen su efecto en el juego (efectosDe)');
  },
  reglasPartidaNueva(V) {
    const viejo = campanaGanada();
    const nueva = V.nuevaVuelta(viejo, base()).desafio;
    const m = nueva.meta;
    ok(m.aplicado === false, 'el arranque de las ventajas se vuelve a dar (la partida es nueva)');
    ok(m.semillaDada === false && m.limpias === 0 && m.lugaresCaidos === 0 && m.final === null, 'las noches limpias, los lugares caídos y el final son de la partida: arrancan de cero');
    ok(/^[a-z0-9]{6,24}$/.test(m.id) && m.id !== viejo.desafio.meta.id, 'y la vuelta tiene su propio número de partida (su propia semilla del Coihue al terminar)');
    ok(m.mult === viejo.desafio.meta.mult, 'el multiplicador de puntos es el mismo');
  },
  deLaPartida(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    ok(nueva.oleadas === 0 && nueva.noches === 0 && nueva.abatidos === 0 && nueva.victoria === false && nueva.nido === null, 'la noche, los abatidos y el final arrancan de cero');
    igual(nueva.ordenes, {}, 'las órdenes a los vecinos son de la partida');
    igual(nueva.puestosAliados, {}, 'los puestos marcados también');
    igual(nueva.companeros, [], 'los vecinos que se sumaron a la base, también');
    ok(nueva.flechas === 0 && nueva.emplastos === R.desafioNuevo().emplastos, 'los recursos son los de una partida nueva');
    ok(nueva.vuelta === 2 && nueva.semilla === 'COIHUE-4821', 'la vuelta sube y el código de partida sigue');
  },
  noTocaLaVieja(V) {
    const viejo = campanaGanada();
    const antes = JSON.stringify(viejo);
    const nueva = V.nuevaVuelta(viejo, base());
    ok(JSON.stringify(viejo) === antes, 'la partida vieja no se toca');
    nueva.desafio.habilidades.niveles.pulso = 3; nueva.desafio.crece.trofeos.casco = 99; nueva.desafio.meta.ventajas.push('x'); nueva.desafio.bestiario.rastreador.abatidos = 1;
    ok(JSON.stringify(viejo) === antes, 'ni cambiando la nueva (nada compartido)');
  },
  partidaVieja(V) {
    // una campaña de antes de la 4.10: sin habilidades, sin bestiario, sin trofeos ni meta
    const vieja = { cosas: { hacha: 1, lanza: 1 }, desafio: { victoria: true, nido: { caido: true }, planos: ['escudo'], vuelta: 0 } };
    const nueva = V.nuevaVuelta(vieja, base()).desafio;
    igual(nueva.habilidades, { puntos: 0, noche: 0, niveles: {} }, 'sin habilidades: arranca sin puntos');
    igual(nueva.bestiario, {}, 'sin bestiario');
    igual(nueva.crece.trofeos, {}, 'sin trofeos');
    ok(nueva.meta.modo === 'normal' && nueva.meta.ventajas.length === 0 && nueva.meta.reglas.length === 0, 'sin meta: campaña normal, sin ventajas ni reglas');
    ok(nueva.salud === 100 && nueva.vuelta === 1, 'y la salud de siempre');
    // roto: valores raros no rompen
    const rota = V.nuevaVuelta({ desafio: { victoria: true, nido: { caido: true }, habilidades: 'x', bestiario: 7, crece: [], meta: { modo: 'sinfin', ventajas: 'raro' } } }, base()).desafio;
    ok(rota.meta.modo === 'normal' && nivelDe(rota.habilidades, 'pulso') === 0, 'datos rotos: se limpian');
  },
  cadena(V) {
    // la vuelta 3 se lleva lo mismo que la 2
    const v2 = V.nuevaVuelta(campanaGanada(), base());
    v2.desafio.victoria = true; v2.desafio.nido = { caido: true };
    const v3 = V.nuevaVuelta(v2, base()).desafio;
    ok(v3.vuelta === 3 && v3.habilidades.puntos === 3 && v3.meta.modo === 'pesadilla' && v3.crece.trofeos.casco === 5, 'otra vuelta más: sigue todo');
  },
  sobreviveAlGuardado(V) {
    const nueva = V.nuevaVuelta(campanaGanada(), base()).desafio;
    const vuelto = R.sanearDesafio(JSON.parse(JSON.stringify(nueva)));
    igual(vuelto.habilidades, nueva.habilidades, 'las habilidades sobreviven al guardado');
    igual(vuelto.bestiario, nueva.bestiario, 'el bestiario también');
    igual(vuelto.crece.trofeos, nueva.crece.trofeos, 'los trofeos también');
    igual(vuelto.meta, nueva.meta, 'y las reglas');
    ok(bonoDe(vuelto, 'dano') === 0.12 && vuelto.salud === 110, 'los bonos y la salud, también');
  },
};

// ---------------------------------------------------------------- 1. «Otra vuelta» con el código de ahora
for (const [nombre, f] of Object.entries(vuelta)) f(V0);

// guardar y abrir de verdad (la partida entera, por guardado.js)
{
  const G = await import('../src/guardado.js?v4110b=' + Date.now());
  G.usarModoGuardado?.('desafio');
  const nueva = V0.nuevaVuelta(campanaGanada(), G.progresoNuevo());
  ok(G.guardarProgreso(nueva) === true, 'la vuelta nueva se guarda');
  const abierta = G.cargarProgreso();
  ok(abierta.desafio.vuelta === 2 && abierta.desafio.habilidades.puntos === 3 && abierta.desafio.meta.reglas.length === 2 && abierta.desafio.crece.trofeos.pina === 20
    && abierta.desafio.bestiario.rastreador.abatidos === 70, 'al abrir la partida de la vuelta nueva, todo sigue ahí');
  ok(abierta.dia === 1 && abierta.obras.length === 0 && abierta.desafio.oleadas === 0, 'y lo de la partida arrancó de cero');
}

// ---------------------------------------------------------------- 2. el cableado en main.js
const cableadoMain = {
  textoDelAviso(main) {
    const l = main.split('\n').find((x) => x.includes('Otra vuelta: vuelve a empezar'));
    ok(l && /habilidades/.test(l) && /bestiario/.test(l) && /trofeos/.test(l) && /reglas/.test(l), 'el aviso de «Otra vuelta» dice que se lleva habilidades, bestiario, trofeos y reglas');
  },
  noPideLasReglas(main) {
    ok(enUnaLinea(main, ['pantallaNueva.abrir()', '!(progreso.desafio?.vuelta > 0)']), 'la vuelta no vuelve a pasar por la pantalla de «Nueva partida»');
  },
  daElArranque(main) {
    ok(enUnaLinea(main, ['progreso.desafio?.vuelta > 0', 'progreso.desafio.meta']) && main.includes('metaJuego.aplicarInicio();'), 'al entrar a la vuelta se da el arranque de las ventajas elegidas');
  },
};
const main = leer('src/main.js');
for (const f of Object.values(cableadoMain)) f(main);

// ---------------------------------------------------------------- 3. refuerzos de la noche silenciosa (B11c)
const refuerzos = {
  silenciosa(R2) {
    igual(R2.refuerzosDeLaNoche(['rastreador', 'bruto', 'rastreador', 'saltador'], 'silenciosa'), ['tirador', 'tirador', 'tirador', 'tirador'], 'en la noche silenciosa los refuerzos son tiradores, de la misma cantidad');
    igual(R2.refuerzosDeLaNoche(['enjambre', 'curandero', 'bruto'], 'silenciosa'), ['tirador'], 'sin enjambre ni curandero (la silenciosa no los trae)');
    ok(R2.refuerzosDeLaNoche([], 'silenciosa').length === 1, 'nunca queda vacío');
  },
  otras(R2) {
    const lista = ['rastreador', 'bruto', 'enjambre'];
    for (const e of [null, undefined, 'roja', 'eclipse', 'apagon', 'niebla', 'lunallena', 'constructor', '__proto__', 7]) ok(R2.refuerzosDeLaNoche(lista, e) === lista, `con ${String(e)} la lista queda igual`);
    ok(R2.esSoloTiradores('silenciosa') && !R2.esSoloTiradores('roja') && !R2.esSoloTiradores('constructor'), 'sólo la silenciosa es de puros tiradores');
  },
};
for (const f of Object.values(refuerzos)) f(R);
const cableadoDesafio = {
  giro(src) {
    ok(enUnaLinea(src, ['const tipos = refuerzosDeLaNoche(', 'd.especial)']), 'los refuerzos del giro pasan por la noche especial');
    ok(enUnaLinea(src, ['!esSoloTiradores(d.especial)', "'curandero'"]), 'y el giro no trae curandero en la silenciosa');
  },
  deMadrugada(src) {
    ok(enUnaLinea(src, ['empezarOleada(refuerzosDeLaNoche(refuerzo.slice(', 'd.especial), false)']), 'los refuerzos de la 1:30 también');
  },
};
const desafioSrc = leer('src/desafio.js');
for (const f of Object.values(cableadoDesafio)) f(desafioSrc);

// ---------------------------------------------------------------- 4. órdenes y puestos persisten (C11)
// Una orden se queda hasta que el jugador la cambie (o toque la campana): se guarda en la partida, sobrevive a guardar y abrir, y
// nada la reinicia al anochecer ni al amanecer.
{
  const d = R.sanearDesafio(null);
  d.ordenes.ramon = siguienteOrden('ramon', ordenDe(d.ordenes, 'ramon'));
  d.ordenes.anselmo = 'seguime'; d.ordenes.ema = 'puesto';
  d.puestosAliados.ema = { x: 20, z: -30 };
  const abierta = R.sanearDesafio(JSON.parse(JSON.stringify(d)));
  igual(abierta.ordenes, d.ordenes, 'las órdenes sobreviven a guardar y abrir');
  igual(abierta.puestosAliados, { ema: { x: 20, z: -30 } }, 'y los puestos marcados');
  ok(ordenDe(abierta.ordenes, 'anselmo') === 'seguime' && ordenDe(abierta.ordenes, 'ema') === 'puesto', 'cada uno sigue con la suya');
  // una partida de antes (sin órdenes, o con basura) carga limpia, con la orden de siempre
  const antes = R.sanearDesafio({ oleadas: 5 });
  igual(antes.ordenes, {}, 'una partida de antes carga sin órdenes');
  igual(antes.puestosAliados, {}, 'ni puestos');
  ok(ordenDe(antes.ordenes, 'ramon') === 'reparar' && ordenDe(antes.ordenes, 'ema') === 'base' && ordenDe(antes.ordenes, 'anselmo') === 'puesto', 'y cada uno hace lo de siempre');
  igual(sanearOrdenes({ ramon: 'volar', anselmo: 7, constructor: 'x', __proto__: 'x' }), {}, 'una orden que no existe se descarta');
  igual(sanearPuestosAliados({ ema: { x: 1e9, z: 0 }, ramon: { x: 'a', z: 1 }, constructor: { x: 1, z: 1 } }), {}, 'un puesto raro se descarta');
}
// nada reinicia las órdenes: sólo las escriben el vecino al ordenar, el cuerno y la campana (y el saneo / la partida nueva)
const archivosSrc = fs.readdirSync(SRC).filter((f) => f.endsWith('.js') && !f.startsWith('idioma-en')).map((f) => [f, fs.readFileSync(new URL(f, SRC), 'utf8')]);
const sinReinicios = (archivos) => {
  const permitidos = new Set(['desafio-reglas.js', 'desafio-ordenes.js', 'desafio-aliados.js', 'desafio-vecinos-mundo.js']);
  const hallados = [];
  for (const [f, t] of archivos) {
    if (permitidos.has(f)) continue;
    for (const [i, l] of t.split('\n').entries()) if (/\b(ordenes|puestosAliados)\s*(=(?!=)|:\s*\{\s*\})|delete\s+[\w.]*\b(ordenes|puestosAliados)\b/.test(l)) hallados.push(`${f}:${i + 1}`);
  }
  return hallados;
};
igual(sinReinicios(archivosSrc), [], 'ningún archivo del juego reinicia las órdenes (sólo las escriben los módulos de órdenes y el saneo)');
// los que sí las escriben: sólo al ordenar (a mano), con el cuerno o con la campana
{
  const asignaciones = (f) => fs.readFileSync(new URL(f, SRC), 'utf8').split('\n').filter((l) => /\.ordenes\[[^\]]+\]\s*=/.test(l)).length;
  ok(asignaciones('desafio-aliados.js') === 3 && asignaciones('desafio-vecinos-mundo.js') === 2, 'cada módulo escribe una orden sólo al ordenar, con el cuerno (llamar) o con la campana');
}

// ---------------------------------------------------------------- 5. mutaciones: cada regla rota tiene que hacer fallar su comprobación
const falla = (f, arg, t) => { pasos++; assert.throws(() => f(arg), undefined, t); };
const mutarArchivo = async (archivo, desde, hacia, etiqueta) => {
  let t = fs.readFileSync(new URL(archivo, SRC), 'utf8');
  assert.equal(t.split(desde).length, 2, `la mutación «${etiqueta}» encuentra su texto una sola vez en ${archivo}`);
  t = t.replace(desde, () => hacia);
  t = t.replace(/from '\.\/([^']+)'/g, (_, m) => `from '${pathToFileURL(path.join(SRC.pathname.replace(/^\/([A-Za-z]:)/, '$1'), m)).href}'`);
  const tmp = path.join(os.tmpdir(), `hoj-mut-4110b-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(tmp, t);
  try { return await import(pathToFileURL(tmp).href); } finally { fs.rmSync(tmp, { force: true }); }
};
const L = {
  habilidades: '  p.desafio.habilidades = { ...sanearHabilidades(d0.habilidades), noche: 0 };',
  bonos: '  aplicarHabilidadesABonos(p.desafio);',
  bestiario: '  p.desafio.bestiario = sanearBestiario(d0.bestiario);',
  trofeos: '  p.desafio.crece = { ...creceNuevo(), trofeos: sanearTrofeos(d0.crece?.trofeos) };',
  meta: "  p.desafio.meta = metaDePartida({ modo: m && m.modo !== 'sinfin' ? m.modo : 'normal', ventajas: m?.ventajas, reglas: m?.reglas });",
  salud: '  p.desafio.salud = saludMaximaConBonos(SALUD_MAX, p.desafio);',
};
const mutantes = [
  ['no se llevan las habilidades', L.habilidades, '', ['habilidades']],
  ['la noche del último punto viaja', '{ ...sanearHabilidades(d0.habilidades), noche: 0 }', 'sanearHabilidades(d0.habilidades)', ['puntosNuevos']],
  ['los bonos de las habilidades no se rehacen', L.bonos, '', ['bonosHabilidad']],
  ['viajan los bonos de todos los orígenes', L.bonos, '  p.desafio.bonos = JSON.parse(JSON.stringify(d0.bonos));', ['bonosOrigenes']],
  ['no se arranca con la salud máxima', L.salud, '', ['salud']],
  ['no se lleva el bestiario', L.bestiario, '', ['bestiario']],
  ['el bestiario se comparte con la vieja', L.bestiario, '  p.desafio.bestiario = d0.bestiario || {};', ['noTocaLaVieja']],
  ['no se llevan los trofeos', L.trofeos, '  p.desafio.crece = creceNuevo();', ['trofeos']],
  ['viaja todo lo de crece (lo mirado y el perro)', L.trofeos, '  p.desafio.crece = JSON.parse(JSON.stringify(d0.crece || creceNuevo()));', ['trofeosLimpios']],
  ['no se llevan las reglas', L.meta, '', ['reglas']],
  ['se pierden las ventajas', 'ventajas: m?.ventajas,', 'ventajas: [],', ['reglas']],
  ['se pierden las reglas elegidas', 'reglas: m?.reglas }', 'reglas: [] }', ['reglas']],
  ['se pierde el modo', "modo: m && m.modo !== 'sinfin' ? m.modo : 'normal'", "modo: 'normal'", ['reglas']],
  ['la meta viaja tal cual (mismo número, arranque dado)', L.meta, '  p.desafio.meta = JSON.parse(JSON.stringify(d0.meta));', ['reglasPartidaNueva']],
  ['la meta de una campaña vieja no se arma', L.meta, '  p.desafio.meta = d0.meta ? { ...d0.meta, aplicado: false } : null;', ['reglasPartidaNueva', 'partidaVieja']],
];
for (const [etiqueta, desde, hacia, quienes] of mutantes) {
  const V = await mutarArchivo('desafio-vuelta-nueva.js', desde, hacia, etiqueta);
  for (const q of quienes) falla(vuelta[q], V, `mutación «${etiqueta}»: la comprobación «${q}» tiene que fallar`);
}
{
  // la vuelta que se lleva TODO lo viejo de la partida (ordenes incluidas) rompe «deLaPartida»
  const V = await mutarArchivo('desafio-vuelta-nueva.js', '  p.desafio.vuelta = Math.min(', '  p.desafio.ordenes = { ...(d0.ordenes || {}) }; p.desafio.puestosAliados = { ...(d0.puestosAliados || {}) }; p.desafio.companeros = [...(d0.companeros || [])];\n  p.desafio.vuelta = Math.min(', 'ordenes');
  falla(vuelta.deLaPartida, V, 'mutación: si las órdenes y los vecinos viajan, «deLaPartida» falla');
}
{
  // refuerzos
  const R1 = await mutarArchivo('desafio-reglas.js', '|| !esSoloTiradores(especial)) return tipos;', '|| true) return tipos;', 'los refuerzos ignoran la noche');
  falla(refuerzos.silenciosa, R1, 'mutación: sin la regla, los refuerzos de la silenciosa son la lista común');
  const R2 = await mutarArchivo('desafio-reglas.js', '|| !esSoloTiradores(especial)) return tipos;', '|| false) return tipos;', 'todas las noches son de tiradores');
  falla(refuerzos.otras, R2, 'mutación: las otras noches no pueden cambiar');
  const R3 = await mutarArchivo('desafio-reglas.js', "t !== 'enjambre' && t !== 'curandero' && t !== 'jefe'", 'true', 'cuenta todo');
  falla(refuerzos.silenciosa, R3, 'mutación: el enjambre y el curandero no cuentan como tiradores');
  const mutaTexto = (txt, desde, hacia) => { assert.equal(txt.split(desde).length, 2, 'el texto a mutar está una sola vez'); return txt.replace(desde, () => hacia); };
  falla(cableadoDesafio.giro, mutaTexto(desafioSrc, 'const tipos = refuerzosDeLaNoche(base.slice(', 'const tipos = ((base.slice('), 'mutación: el giro no usa la regla');
  falla(cableadoDesafio.giro, mutaTexto(desafioSrc, '!esSoloTiradores(d.especial) && Object.hasOwn(TIPOS_ALIEN', 'Object.hasOwn(TIPOS_ALIEN'), 'mutación: el giro trae curandero en la silenciosa');
  falla(cableadoDesafio.deMadrugada, mutaTexto(desafioSrc, 'empezarOleada(refuerzosDeLaNoche(refuerzo.slice(', 'empezarOleada((refuerzo.slice('), 'mutación: los de la 1:30 no usan la regla');
  // main.js
  falla(cableadoMain.textoDelAviso, mutaTexto(main, 'las habilidades del guardián, el bestiario, los trofeos y las reglas que elegiste. Los duendes', 'y los planos. Los duendes'), 'mutación: el aviso no cuenta lo que se lleva');
  falla(cableadoMain.noPideLasReglas, mutaTexto(main, '!metaElegida && !(progreso.desafio?.vuelta > 0) &&', '!metaElegida &&'), 'mutación: la vuelta vuelve a pedir las reglas');
  falla(cableadoMain.daElArranque, mutaTexto(main, '      metaJuego.aplicarInicio();\n      setTimeout(() => nota(`${textoVuelta(', '      setTimeout(() => nota(`${textoVuelta('), 'mutación: la vuelta no da el arranque');
  // órdenes
  const reinicia = (f, linea) => archivosSrc.map(([n, t]) => [n, n === f ? t.replace('\n}', `\n  ${linea}\n}`) : t]);
  for (const [f, linea] of [['desafio.js', 'D().ordenes = {};'], ['main.js', 'progreso.desafio.puestosAliados = {};'], ['desafio-campana.js', 'delete d.ordenes;']]) {
    ok(sinReinicios(reinicia(f, linea)).length === 1, `mutación: «${linea}» en ${f} la detecta el control de reinicios`);
  }
}

console.log(`verificar-4-11-0-desafio-b: ${pasos} comprobaciones, todo en verde`);
