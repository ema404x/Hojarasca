// 4.8 noches: las noches distintas del Desafío («La noche de los duendes»), en lo que tienen de lógica pura.
//   1. Dos noches nuevas (niebla y luna llena) que se suman a las cuatro de siempre.
//   2. Los giros de las dos de la mañana.
//   3. Las noches que se encadenan.
// La partida real está en `pruebas/humo-4-8-noches.cjs`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as N from '../src/desafio-noches.js';
import * as R from '../src/desafio-reglas.js';
import * as SF from '../src/desafio-supervivencia.js';
import { curanderosEnLaNoche } from '../src/desafio-duendes-nuevos.js';
import * as DR from '../src/desafio-duendes-reglas.js';
import * as sentidos from '../src/desafio-sentidos.js';
import { azarDe } from '../src/semilla.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const des = leer('src/desafio.js'), reglas = leer('src/desafio-reglas.js'), guardado = leer('src/guardado.js');
const { ESPECIALES, nocheEspecial, aplicarEspecial, efectoClima, sanearDesafio, desafioNuevo, NOCHE_FINAL, esNocheDeJefe, composicionOleada } = R;

// ======================================================== 1. las noches nuevas
{
  assert.deepEqual(Object.keys(ESPECIALES).slice(0, 4), ['roja', 'eclipse', 'silenciosa', 'apagon'], 'las cuatro de siempre siguen primero');
  assert.ok(ESPECIALES.niebla && ESPECIALES.lunallena, 'los ids exactos son niebla y lunallena');
  for (const id of ['niebla', 'lunallena']) {
    const e = ESPECIALES[id];
    assert.ok(e.nombre && e.aviso && e.cantidad > 0, `${id}: nombre, aviso y cantidad`);
    assert.ok(!/[a-z]{3}ing\b|\bthe\b|\bnight\b/i.test(e.nombre + e.aviso), `${id}: en castellano`);
  }
  assert.match(ESPECIALES.niebla.aviso, /niebla baja del monte/i);
  // las franjas de siempre no se tocaron
  assert.equal(nocheEspecial(6, 0.05), 'roja'); assert.equal(nocheEspecial(6, 0.15), 'eclipse');
  assert.equal(nocheEspecial(6, 0.25), 'silenciosa'); assert.equal(nocheEspecial(6, 0.33), 'apagon');
  assert.equal(nocheEspecial(6, 0.38), 'apagon');
  assert.equal(nocheEspecial(6, 0.40), 'niebla'); assert.equal(nocheEspecial(6, 0.435), 'niebla');
  assert.equal(nocheEspecial(6, 0.44), 'lunallena'); assert.equal(nocheEspecial(6, 0.49), 'lunallena');
  assert.equal(nocheEspecial(6, 0.5), null); assert.equal(nocheEspecial(6, 0.9), null);
  // las mismas reglas que las otras: no antes de la cuarta, nunca dos seguidas, nunca la final ni la del jefe
  for (const a of [0.4, 0.47]) {
    assert.equal(nocheEspecial(3, a), null, 'no antes de la cuarta');
    assert.equal(nocheEspecial(6, a, 'roja'), null); assert.equal(nocheEspecial(6, a, 'niebla'), null, 'nunca dos seguidas');
    assert.equal(nocheEspecial(NOCHE_FINAL, a), null, 'ni la final');
    assert.equal(nocheEspecial(NOCHE_FINAL + 1, a), null, 'ni después de la final en la campaña');
    for (const j of [5, 10, 15]) assert.equal(nocheEspecial(j, a), null, `ni la del jefe (${j})`);
  }
  // la frecuencia sigue siendo razonable: de todas las noches que pueden ser especiales, entre un tercio y la mitad
  let hay = 0, cuenta = {};
  for (let i = 0; i < 10000; i++) { const e = nocheEspecial(7, i / 10000, null); if (e) { hay++; cuenta[e] = (cuenta[e] || 0) + 1; } }
  assert.ok(hay / 10000 > 0.4 && hay / 10000 < 0.55, `chance de especial ${hay / 10000}`);
  for (const k of Object.keys(ESPECIALES)) assert.ok(cuenta[k] > 400, `${k} sale (${cuenta[k]})`);
  // la corrida sin fin sigue las mismas franjas y estira
  const c2 = {};
  for (let i = 0; i < 2000; i++) { const e = SF.especialSinFin(41, i / 2000, null); c2[e] = (c2[e] || 0) + 1; }
  for (const k of Object.keys(ESPECIALES)) assert.ok(c2[k] > 60, `sin fin: ${k} sale (${c2[k]})`);
  for (let n = 4; n < 20; n++) for (const a of [0.01, 0.2, 0.31, 0.37, 0.41, 0.47, 0.5]) assert.equal(SF.especialSinFin(n, a, null), nocheEspecial(n, a, null), `noche ${n}: antes de la 20, las mismas`);
  assert.equal(SF.especialSinFin(41, 0.47, 'niebla'), null); assert.equal(SF.especialSinFin(45, 0.4, null), null, 'con el jefe no');
  // el saneo del guardado las acepta
  for (const k of ['niebla', 'lunallena']) assert.equal(sanearDesafio({ especial: k, especialAnterior: k }).especial, k);
  assert.equal(sanearDesafio({ especial: 'inventada' }).especial, null);
}

// 4.8 (junta): el enjambre (de la rama de ataques) va aparte y las noches especiales no lo multiplican
const sinEnjambre = (l) => l.filter((t) => t !== 'enjambre');

// niebla: acorta la vista (lo mismo que la lluvia), se oye antes, el perro avisa antes
{
  const claro = efectoClima({}), nb = efectoClima({ niebla: 1 });
  assert.equal(claro.vista, 1);
  assert.ok(nb.vista <= 0.5 + 1e-9 && nb.vista > 0, `con niebla se ve a la mitad (${nb.vista})`);
  assert.ok(efectoClima({ lluvia: 1, niebla: 1 }).vista < efectoClima({ lluvia: 1 }).vista, 'la niebla se suma a la lluvia');
  assert.equal(efectoClima({ niebla: 0 }).vista, 1);
  assert.ok(N.NIEBLA.oido > 1 && N.NIEBLA.perro > 1 && N.NIEBLA.visibilidad < 60);
  assert.equal(sentidos.avisoDelPerro({ distancia: 50, visto: false }), null, 'sin niebla, a 50 m el perro no dice nada');
  assert.equal(sentidos.avisoDelPerro({ distancia: 50, visto: false, alcance: N.NIEBLA.perro }), 'grunir', 'con niebla gruñe antes');
  assert.equal(sentidos.avisoDelPerro({ distancia: 10, visto: true, alcance: N.NIEBLA.perro }), 'ladrar');
  assert.ok(N.hayNiebla('niebla', null, 3) && !N.hayNiebla(null, null, 3) && !N.hayNiebla('roja', null, 3));
  assert.ok(N.hayNiebla(null, { id: 'niebla', noche: 5 }, 5), 'la que baja a las dos');
  assert.ok(!N.hayNiebla(null, { id: 'niebla', noche: 4 }, 5), 'la de otra noche no cuenta');
  const base = sinEnjambre(composicionOleada(8));   // 4.8 (junta): el enjambre va aparte y las especiales no lo multiplican
  const lista = aplicarEspecial(base, 'niebla');
  assert.equal(lista.length, Math.round(base.length * ESPECIALES.niebla.cantidad));
}

// luna llena: casi todos viejos, más brutos, más luz
{
  const L = ESPECIALES.lunallena;
  assert.ok(L.porcionViejos > 0.8 && L.porcionViejos <= 1 && L.vidaViejos > 1 && L.luz > 0);
  assert.equal(DR.vieneDeViejo('rastreador', { grande: true, azar: 0.8 }), false, 'una noche grande común: 0,6 de viejos');
  assert.equal(DR.vieneDeViejo('rastreador', { grande: true, azar: 0.8, porcion: L.porcionViejos }), true, 'con luna llena también ese');
  assert.equal(DR.vieneDeViejo('rastreador', { grande: false, azar: 0.1, porcion: 1 }), false, 'sin noche grande, no');
  assert.equal(DR.vieneDeViejo('bruto', { azar: 0.99 }), true);
  assert.ok(DR.esNocheGrande({ noche: 6, especial: 'lunallena' }), 'es noche grande: hay viejos');
  assert.equal(DR.DUENDE_DE.bruto, 'grandote'); assert.ok(DR.SIEMPRE_VIEJOS.has('bruto'));
  for (const noche of [4, 7, 9, 12, 17]) {
    const base = sinEnjambre(composicionOleada(noche));   // 4.8 (junta): el enjambre va aparte (lo prueba verificar-4-8-ataques)
    const brutos = (l) => l.filter((t) => t === 'bruto').length;
    const luna = aplicarEspecial(base, 'lunallena');
    assert.ok(brutos(luna) >= brutos(base.slice(0, luna.length)), `noche ${noche}: la luna trae por lo menos los mismos brutos`);
    assert.ok(brutos(luna) / luna.length >= Math.min(0.28, brutos(base) / base.length), `noche ${noche}: más grandotes`);
    assert.equal(luna.length, Math.max(2, Math.round(base.length * L.cantidad)), `noche ${noche}: menos, pero más duros`);
  }
  const conJefe = composicionOleada(10);
  const lj = aplicarEspecial(conJefe, 'lunallena');
  assert.equal(lj.filter((t) => t === 'jefe').length, 1); assert.equal(lj.at(-1), 'jefe', 'el jefe sigue siendo uno y va último');
  assert.equal(N.conMasBrutos(['rastreador', 'saltador', 'rastreador', 'tirador'], 1).filter((t) => t === 'bruto').length, 4 - 1, 'sólo se vuelven los traviesos');
  assert.ok(N.conMasBrutos(Array(24).fill('rastreador'), 1).filter((t) => t === 'bruto').length <= 7, 'nunca más de siete');
}

// ======================================================== 2. los giros
{
  const ok = { noche: 6, azar: 0.0, hayDefensas: true };
  assert.equal(N.HORA_GIRO, 2.0, 'a las dos de la mañana');
  assert.ok(N.HORA_GIRO > 0 && N.HORA_GIRO < R.HORA_AMANECER, 'después de medianoche y antes del alba');
  assert.deepEqual(Object.keys(N.GIROS).sort(), ['defensa', 'niebla', 'refuerzos']);
  assert.ok(N.elegirGiro(ok), 'con azar bajo, en una noche común, pasa algo');
  assert.equal(N.elegirGiro({ ...ok, noche: 1 }), null, 'no en la primera noche');
  assert.equal(N.elegirGiro({ ...ok, noche: 0 }), null);
  assert.equal(N.elegirGiro({ ...ok, jefe: true }), null, 'no sumado a un jefe');
  assert.equal(N.elegirGiro({ ...ok, final: true }), null, 'ni a la final');
  assert.equal(N.elegirGiro({ ...ok, rescate: true }), null, 'ni a un rescate');
  assert.equal(N.elegirGiro({ ...ok, varada: true }), null);
  assert.equal(N.elegirGiro({ ...ok, azar: 0.4 }), null, 'no todas las noches');
  assert.equal(N.elegirGiro({ ...ok, azar: 0.99 }), null);
  assert.equal(N.elegirGiro({ ...ok, azar: NaN }), null); assert.equal(N.elegirGiro({ ...ok, azar: -1 }), null);
  assert.equal(N.elegirGiro({ ...ok, noche: 2, azar: 0.3 }), null, 'la segunda, menos seguido');
  assert.ok(N.elegirGiro({ ...ok, noche: 2, azar: 0.01 }), 'pero puede');
  assert.notEqual(N.elegirGiro({ ...ok, noche: 2, azar: 0.01 }), 'defensa', 'en la segunda todavía no se cae una defensa');
  assert.notEqual(N.elegirGiro({ ...ok, noche: 2, azar: 0.01 }), 'refuerzos');
  // condiciones de cada uno
  const todos = (extra) => { const s = new Set(); for (let i = 0; i < 400; i++) { const g = N.elegirGiro({ noche: 8, azar: i / 1000, hayDefensas: true, ...extra }); if (g) s.add(g); } return s; };
  assert.deepEqual([...todos({})].sort(), ['defensa', 'niebla', 'refuerzos'], 'salen los tres');
  assert.ok(!todos({ hayDefensas: false }).has('defensa'), 'sin defensas no se cae una');
  assert.ok(!todos({ especial: 'niebla' }).has('niebla'), 'con la noche de niebla no baja otra niebla');
  assert.ok(!todos({ especial: 'apagon' }).has('niebla'));
  assert.ok(!todos({ yaHuboRefuerzo: true }).has('refuerzos'), 'si ya llegaron refuerzos de madrugada, no otra vez');
  for (const g of Object.keys(N.GIROS)) assert.ok(!todos({ anterior: g }).has(g), `${g} no se repite seguido`);
  assert.deepEqual(['Empalizada de troncos', 'Muro de pirca', 'Portón de empalizada', 'Zanja', 'Red dorada', 'Torre de vigía', 'Mirador'].map(N.conArticulo),
    ['la empalizada de troncos', 'el muro de pirca', 'el portón de empalizada', 'la zanja', 'la red dorada', 'la torre de vigía', 'el mirador'], 'el artículo de cada obra');
  assert.equal(N.pronombreDe('Muro de pirca'), 'lo'); assert.equal(N.pronombreDe('Zanja'), 'la'); assert.equal(N.conArticulo(''), 'la defensa'); assert.equal(N.conArticulo(undefined), 'la defensa');
  // la chance
  let pasa = 0; for (let i = 0; i < 10000; i++) if (N.elegirGiro({ noche: 8, azar: i / 10000, hayDefensas: true })) pasa++;
  assert.ok(pasa / 10000 > 0.3 && pasa / 10000 < 0.5, `chance de giro ${pasa / 10000}`);
  // textos en castellano
  for (const g of Object.values(N.GIROS)) assert.ok(g.nombre.length > 5 && g.aviso.length > 8 && g.texto.length > 20);
  assert.match(N.GIROS.niebla.aviso, /niebla/i);
  // guardado del giro
  assert.deepEqual(N.sanearGiro({ id: 'niebla', noche: 4.7 }), { id: 'niebla', noche: 4 });
  for (const v of [null, 'x', {}, { id: 'constructor', noche: 1 }, { id: '__proto__', noche: 1 }, { id: 'niebla', noche: null }, { id: 'niebla', noche: 'x' }, [], { id: 'niebla', noche: true }]) assert.equal(N.sanearGiro(v), null, JSON.stringify(v));
}

// el giro en el juego (el código de desafio.js con el mundo de mentira)
{
  const ini = des.indexOf('  function revisarGiro(p) {'), fin = des.indexOf('\n  }\n', ini) + 4;
  assert.ok(ini > 0 && fin > ini, 'revisarGiro existe');
  const cuerpo = des.slice(ini, fin);
  const mundo = (sobre = {}) => {
    const d = { oleadas: 6, oleadaTerminada: false, giroNoche: -1, giro: null, giroAnterior: null, especial: null, rescate: null, varada: null,
      refuerzoNoche: -1, sinFin: null, nodriza: null, victoria: false, asedio: null, vuelta: 0, ...sobre.d };
    const notas = [], lanzadas = [], danos = [];
    const obra = (vida, max, nombre) => ({ datos: { vida, x: 1, z: 2 }, plano: { categoria: 'defensa', nombre } , max });
    const obrasLista = sobre.obras ?? [obra(500, 500, 'Empalizada'), obra(900, 900, 'Muro de piedra')];
    const env = {
      D: () => d, HORA_GIRO: N.HORA_GIRO, HORA_AMANECER: R.HORA_AMANECER, GIROS: N.GIROS, elegirGiro: N.elegirGiro,
      eventos: { nodrizaActiva: false }, naveMundo: { adentro: false }, asedioMundo: { activo: false }, caido: false,
      obras: { obras: obrasLista }, completa: () => true, vidaDe: (o) => ({ vida: o.datos.vida, max: o.max }),
      esNocheDeJefe, NOCHE_FINAL, nocheFinalCoihue: R.nocheFinalCoihue, conArticulo: N.conArticulo, pronombreDe: N.pronombreDe, azarNoche: () => () => sobre.azar ?? 0.0, /* azarNoche da un generador, como azarDe */ ctx: { nota: (t, x) => notas.push([t, x]), dificultad: () => 'normal' },
      sinJefe: (l) => l.filter((t) => t !== 'jefe'), composicionSinFin: SF.composicionSinFin, composicionOleada, TIPOS_ALIEN: sobre.tipos ?? R.TIPOS_ALIEN,
      setTimeout: (f) => f(), empezarOleada: (tipos, nueva) => lanzadas.push([tipos, nueva]), danarObra: (o, n) => { danos.push(n); o.datos.vida -= n; },
      S: { derrumbe() {} }, curanderosEnLaNoche, sacudidas: { set() {} },   // 4.10.1
    };
    const f = new Function('env', `with (env) { ${cuerpo}\n return revisarGiro; }`)(new Proxy(env, { has: (t, k) => typeof k === 'string' && (k in t || !(k in globalThis)) }));
    return { d, f, notas, lanzadas, danos, obras: obrasLista };
  };
  // antes de las dos, de día o terminada: nada
  for (const horas of [1.9, 0.5, 6.0, 12]) { const m = mundo(); m.f({ horas }); assert.equal(m.d.giro, null, `a las ${horas}: nada`); assert.equal(m.d.giroNoche, -1); }
  { const m = mundo({ d: { oleadaTerminada: true } }); m.f({ horas: 3 }); assert.equal(m.d.giroNoche, -1, 'noche terminada: nada'); }
  // una sola vez por noche
  { const m = mundo({ azar: 0.99 }); m.f({ horas: 2.1 }); assert.equal(m.d.giroNoche, 6, 'se decidió, no pasó nada'); assert.equal(m.d.giro, null);
    m.f({ horas: 2.5 }); assert.equal(m.notas.length, 0); }
  // la primera noche: nada
  { const m = mundo({ d: { oleadas: 1 } }); m.f({ horas: 2.2 }); assert.equal(m.d.giro, null); }
  // refuerzos (azar 0 de los tres: el primero que cae es niebla; se fuerza por anterior)
  // 4.8 (junta): el curandero ya existe en el juego (rama de ataques): este mundo de prueba no lo tiene
  const sinCurandero = Object.fromEntries(Object.entries(R.TIPOS_ALIEN).filter(([k]) => k !== 'curandero'));
  { const m = mundo({ d: { giroAnterior: 'niebla' }, azar: 0.0, tipos: sinCurandero }); m.f({ horas: 2.2 });
    assert.equal(m.d.giro?.id, 'refuerzos'); assert.equal(m.d.giro.noche, 6); assert.equal(m.d.giroAnterior, 'refuerzos');
    assert.equal(m.lanzadas.length, 1); assert.equal(m.lanzadas[0][1], false, 'refuerzos de la misma noche');
    assert.ok(m.lanzadas[0][0].length >= 2 && !m.lanzadas[0][0].includes('jefe') && !m.lanzadas[0][0].includes('curandero'), 'sin curandero si el juego todavía no lo tiene');
    assert.match(m.notas[0][0], /refuerzos/i); }
  // con curandero si existe (y sólo entonces)
  { const m = mundo({ d: { giroAnterior: 'niebla' }, tipos: { ...R.TIPOS_ALIEN, curandero: { vida: 1 } } }); m.f({ horas: 2.2 }); assert.ok(m.lanzadas[0][0].includes('curandero'), 'con curandero'); }
  // niebla: queda anotada
  { const m = mundo({ azar: 0.0 }); m.f({ horas: 2.2 }); assert.equal(m.d.giro?.id, 'niebla'); assert.ok(N.hayNiebla(null, m.d.giro, 6)); assert.equal(m.lanzadas.length, 0); assert.match(m.notas[0][0], /niebla/i); }
  // defensa: la que más aguanta queda al 12%
  { const m = mundo({ d: { giroAnterior: 'niebla' }, azar: 0.30 }); m.f({ horas: 2.2 });
    assert.equal(m.d.giro?.id, 'defensa'); assert.equal(m.danos.length, 0, '4.10.1: la vida se fija, no pasa por el daño de las obras');
    assert.ok(Math.abs(m.obras[1].datos.vida - 900 * 0.12) < 1e-6 && m.obras[0].datos.vida === 500, 'el muro (la más fuerte) queda al 12%'); }
  // sin defensas en pie, no se cae nada
  { const m = mundo({ obras: [], azar: 0.30, d: { giroAnterior: 'niebla' } }); m.f({ horas: 2.2 }); assert.notEqual(m.d.giro?.id, 'defensa'); }
  // jefe, final, rescate, la nave del Coihue
  { const m = mundo({ d: { oleadas: 10 } }); m.f({ horas: 2.2 }); assert.equal(m.d.giro, null, 'noche de jefe'); }
  { const m = mundo({ d: { oleadas: NOCHE_FINAL } }); m.f({ horas: 2.2 }); assert.equal(m.d.giro, null, 'noche final'); }
  { const m = mundo({ d: { rescate: { lugar: 'x' } } }); m.f({ horas: 2.2 }); assert.equal(m.d.giro, null, 'rescate'); }
  { const m = mundo({ d: { refuerzoNoche: 6, giroAnterior: 'niebla' }, azar: 0.01 }); m.f({ horas: 2.2 }); assert.notEqual(m.d.giro?.id, 'refuerzos'); }
  // la niebla del giro no es la de la noche especial: no se suma a una niebla
  { const m = mundo({ d: { especial: 'niebla' }, azar: 0.0 }); m.f({ horas: 2.2 }); assert.notEqual(m.d.giro?.id, 'niebla'); }
}

// ======================================================== 3. las noches que se encadenan
{
  const C = N.cadenaNueva();
  assert.equal(N.efectoCadena(C, 1), null); assert.equal(N.efectoCadena(null, 1), null);
  // un duende se escapó con la leña
  N.anotarEscape(C, 5, 'tabla');
  assert.equal(C.hoy.escapados, 1);
  N.cerrarNoche(C, 5, { perdidas: 2, dano: 90, saludMax: 100, vivos: 0 });
  assert.equal(C.paraNoche, 6); assert.deepEqual(C.escapo, { cosa: 'tabla', n: 1 }); assert.equal(C.perfecta, false); assert.equal(C.vueltos, 0);
  assert.deepEqual(C.hoy, { noche: 0, escapados: 0, cosa: null }, 'lo de hoy se limpia');
  let e = N.efectoCadena(C, 6);
  assert.equal(e.companias, 2); assert.equal(e.grande, false); assert.equal(e.vueltos, 0);
  assert.deepEqual(e.textos, ['El que se escapó con tu leña volvió con compañía.']);
  assert.equal(N.efectoCadena(C, 7), null, 'sólo vale para la noche que sigue'); assert.equal(N.efectoCadena(C, 5), null);
  // varios escapes
  const C2 = N.cadenaNueva(); for (let i = 0; i < 5; i++) N.anotarEscape(C2, 3, 'piedra'); N.cerrarNoche(C2, 3, { perdidas: 1, dano: 90 });
  e = N.efectoCadena(C2, 4); assert.equal(e.companias, N.CADENA.companiasMax, 'con tope'); assert.match(e.textos[0], /Los que se escaparon/);
  // un escape de otra noche no cuenta
  const C3 = N.cadenaNueva(); N.anotarEscape(C3, 2, 'tabla'); N.cerrarNoche(C3, 3, { perdidas: 1, dano: 90 }); assert.equal(C3.escapo, null);
  // ganar sin bajas: la que viene es más grande
  const C4 = N.cadenaNueva(); N.cerrarNoche(C4, 7, { perdidas: 0, dano: 10, saludMax: 100, vivos: 0 });
  e = N.efectoCadena(C4, 8); const efGrande = e; assert.equal(e.grande, true); assert.equal(e.companias, 0); assert.match(e.textos[0], /Anoche no pudieron con vos/);
  N.cerrarNoche(C4, 7, { perdidas: 1, dano: 10 }); assert.equal(C4.perfecta, false, 'una obra perdida no es sin bajas');
  N.cerrarNoche(C4, 7, { perdidas: 0, dano: 60 }); assert.equal(C4.perfecta, false, 'ni con mucha herida');
  // los que huyeron con la luz
  const C5 = N.cadenaNueva(); N.cerrarNoche(C5, 9, { perdidas: 1, dano: 90, vivos: 5 });
  e = N.efectoCadena(C5, 10); assert.equal(e.vueltos, N.CADENA.vueltosMax); assert.match(e.textos[0], /primera luz volvieron más grandes/);
  // la brecha: una defensa sin arreglar
  const defs = [{ x: 1, z: 2, nombre: 'la empalizada', ratio: 0.9 }, { x: 8, z: 9, nombre: 'el muro de piedra', ratio: 0.2 }, { x: 3, z: 3, nombre: 'el portón', ratio: 0.4 }];
  const b = N.elegirBrecha(defs, 11);
  assert.deepEqual(b, { x: 8, z: 9, nombre: 'el muro de piedra', noche: 11 }, 'la más maltrecha');
  assert.equal(N.elegirBrecha([{ x: 1, z: 2, nombre: 'a', ratio: 0.8 }], 11), null, 'si están bien, nada'); assert.equal(N.elegirBrecha([], 11), null); assert.equal(N.elegirBrecha(null, 11), null);
  assert.equal(N.elegirBrecha([{ x: NaN, z: 2, ratio: 0.1 }, null, { x: 1, z: 1, ratio: 'x' }], 11), null);
  const C6 = N.cadenaNueva(); C6.brecha = b;
  e = N.efectoCadena(C6, 11); assert.deepEqual(e.brecha, b); assert.equal(e.textos[0], 'Dejaste el muro de piedra sin arreglar: esta noche entran por ahí.');
  assert.equal(N.efectoCadena(C6, 12), null, 'la brecha es de una sola noche');
  // caíste: nada se arrastra
  N.olvidarCadena(C5); assert.equal(N.efectoCadena(C5, 10), null);
  // la lista de la noche
  const lista = ['rastreador', 'rastreador', 'bruto', 'tirador', 'saltador', 'rastreador', 'rastreador', 'jefe'];
  const copia = lista.slice();
  const a1 = N.aplicarCadena(lista, N.efectoCadena(C, 6));
  assert.deepEqual(lista, copia, 'no toca la lista de entrada');
  assert.equal(a1.length, lista.length + 2); assert.equal(a1.at(-1), 'jefe'); assert.equal(a1.filter((t) => t === 'jefe').length, 1);
  assert.equal(a1.filter((t) => t === 'rastreador').length, 4 + 2);
  const a2 = N.aplicarCadena(lista, efGrande);
  assert.equal(a2.length, lista.length + Math.ceil(7 * N.CADENA.parteGrande), 'más grande'); assert.equal(a2.at(-1), 'jefe');
  const a3 = N.aplicarCadena(lista, N.efectoCadena(C5, 10) || { companias: 0, grande: false, vueltos: 3 });
  assert.equal(a3.filter((t) => t === 'bruto').length, 1 + 3, 'vuelven de grandotes');
  const grande = Array(24).fill('rastreador');
  const a4 = N.aplicarCadena(grande, { companias: 4, grande: true, vueltos: 3 });
  assert.equal(a4.length, 24, 'nunca más del tope'); assert.equal(a4.filter((t) => t === 'bruto').length, 3, 'las novedades entran primero');
  assert.deepEqual(N.aplicarCadena(lista, null), lista);
  // el guardado
  const san = N.sanearCadena(C);
  assert.deepEqual(san, { ...C, hoy: { ...C.hoy } });
  for (const v of [undefined, null, 5, 'x', [], { escapo: 'x', brecha: 3, hoy: 7 }, { escapo: { cosa: 'constructor', n: 3 }, vueltos: -4, paraNoche: 'x' },
    { brecha: { x: 'a', z: 1, noche: 2 } }, { brecha: { x: 1, z: 1e9, noche: 2 } }, { vueltos: 1e9, perfecta: 'si' }, { hoy: { escapados: 1e9, cosa: '__proto__' } }]) {
    const s = N.sanearCadena(v);
    assert.deepEqual(Object.keys(s).sort(), Object.keys(N.cadenaNueva()).sort(), 'siempre la misma forma');
    assert.ok(s.vueltos >= 0 && s.vueltos <= N.CADENA.vueltosMax && s.hoy.escapados <= 99);
    assert.ok(s.escapo === null || (['cristal', 'ramita', 'tabla', 'piedra'].includes(s.escapo.cosa)));
    assert.ok(s.brecha === null);
    assert.equal(s.perfecta, false); assert.ok(!(s.hoy.cosa === '__proto__'));
  }
  assert.equal(N.sanearCadena({ perfecta: true }).perfecta, true);
  assert.deepEqual(N.sanearCadena({ brecha: { x: 3, z: 4, noche: 7, nombre: 'la pirca' } }).brecha, { x: 3, z: 4, nombre: 'la pirca', noche: 7 });
}

// el estado nuevo en la partida: una partida vieja carga y las nuevas vuelven a limpio
{
  const nuevo = desafioNuevo();
  assert.deepEqual([nuevo.giro, nuevo.giroNoche, nuevo.giroAnterior], [null, -1, null]);
  assert.deepEqual(Object.keys(nuevo.cadena).sort(), Object.keys(N.cadenaNueva()).sort());
  // una partida de la 4.7: no trae nada de esto
  const vieja = { oleadas: 6, noches: 5, especial: 'roja', especialAnterior: null, racha: 3, oleadaNoche: 6, oleadaTerminada: true };
  const s = sanearDesafio(vieja);
  assert.equal(s.oleadas, 6); assert.equal(s.especial, 'roja');
  assert.deepEqual([s.giro, s.giroNoche, s.giroAnterior], [null, -1, null]); assert.deepEqual(s.cadena, N.cadenaNueva());
  for (const raro of [null, undefined, 3, 'x', [], { giro: 'x', giroNoche: 'y', giroAnterior: 'constructor', cadena: 'z' }, { giro: { id: 'constructor', noche: 1 }, cadena: { escapo: { cosa: 'hasOwnProperty', n: 1 } } }]) {
    const t = sanearDesafio(raro);
    assert.equal(t.giro, null); assert.equal(t.giroAnterior, null); assert.equal(t.giroNoche, -1); assert.deepEqual(t.cadena, N.cadenaNueva());
  }
  // lo guardado vuelve igual (ida y vuelta por JSON)
  const medio = { ...nuevo, giro: { id: 'refuerzos', noche: 6 }, giroNoche: 6, giroAnterior: 'refuerzos', cadena: { ...N.cadenaNueva(), paraNoche: 7, escapo: { cosa: 'ramita', n: 2 }, perfecta: true, vueltos: 2, brecha: { x: 4, z: 5, nombre: 'el portón', noche: 7 } } };
  const ida = sanearDesafio(JSON.parse(JSON.stringify(medio)));
  assert.deepEqual([ida.giro, ida.giroNoche, ida.giroAnterior, ida.cadena], [medio.giro, 6, 'refuerzos', medio.cadena]);
  assert.match(guardado, /sanearDesafio\(/, 'guardado.js sanea el Desafío');
}

// ======================================================== 4. 30 noches con distintas semillas: variedad
{
  const semillas = ['COIHUE-1001', 'COIHUE-2002', 'COIHUE-3003', 'COIHUE-4004', 'COIHUE-5005', 'COIHUE-6006', 'COIHUE-7007', 'COIHUE-8008', 'COIHUE-9009', 'COIHUE-1234', 'ALERCE-4821', 'ALERCE-77'];
  const caminos = new Set(), global = {}, giros = {};
  let sinGiroSeguidos = 0;
  for (const sem of semillas) {
    let anterior = null, giroAnt = null;
    const seq = [];
    let cuantas = 0;
    for (let n = 1; n <= 30; n++) {
      const final = n >= NOCHE_FINAL;   // la campaña llega a la 20: las demás son de la corrida sin fin
      const esp = n <= NOCHE_FINAL ? (final ? null : nocheEspecial(n, azarDe(sem, n, 'especial')(), anterior)) : SF.especialSinFin(n, azarDe(sem, n, 'especial')(), anterior);
      // las reglas valen para todas
      if (esp) {
        assert.ok(n >= 4, 'no antes de la cuarta'); assert.notEqual(anterior !== null, true, 'nunca dos seguidas');
        assert.ok(!esNocheDeJefe(n), 'nunca la del jefe'); assert.notEqual(n, NOCHE_FINAL, 'nunca la final');
        global[esp] = (global[esp] || 0) + 1; cuantas++;
      }
      seq.push(esp || '-');
      anterior = esp;
      const g = N.elegirGiro({ noche: n, especial: esp, jefe: esNocheDeJefe(n), final: n === NOCHE_FINAL, anterior: giroAnt, hayDefensas: true, azar: azarDe(sem, n, 'giro')() });
      if (g) { assert.ok(n >= 2 && !esNocheDeJefe(n) && n !== NOCHE_FINAL, 'el giro respeta las condiciones'); giros[g] = (giros[g] || 0) + 1; }
      giroAnt = g;
    }
    caminos.add(seq.join(','));
    assert.ok(cuantas >= 2, `${sem}: en 30 noches hubo al menos 2 especiales (${cuantas})`);
  }
  assert.equal(caminos.size, semillas.length, 'cada semilla da una serie de noches distinta');
  for (const k of Object.keys(ESPECIALES)) assert.ok(global[k] >= 2, `${k} salió en alguna semilla (${global[k]})`);
  for (const k of Object.keys(N.GIROS)) assert.ok(giros[k] >= 3, `el giro ${k} salió (${giros[k]})`);
  // la misma semilla, siempre las mismas noches
  const una = (s) => { let a = null; const o = []; for (let n = 4; n < 20; n++) { a = nocheEspecial(n, azarDe(s, n, 'especial')(), a); o.push(a); } return o.join(); };
  assert.equal(una('COIHUE-1001'), una('COIHUE-1001'));
  // una racha de 19 noches sin giro nunca se repite en el mismo lugar para todas las semillas
  const sinSeguidas = semillas.map((s) => { const l = []; for (let n = 2; n < 20; n++) l.push(!!N.elegirGiro({ noche: n, azar: azarDe(s, n, 'giro')(), hayDefensas: true })); return l.join(); });
  assert.ok(new Set(sinSeguidas).size > semillas.length / 2, 'los giros caen en noches distintas');
}

// ======================================================== 5. el enganche en el juego (texto del código)
{
  assert.match(des, /import \{[^}]*\} from '\.\/desafio-noches\.js';/);
  assert.match(des, /revisarGiro\(p\);/, 'revisarHorario mira el giro');
  assert.match(des, /azarNoche\('giro', d\.oleadas\)\(\)/, 'el azar del giro es un número (azarNoche da un generador)');
  assert.match(des, /Object\.hasOwn\(TIPOS_ALIEN, 'curandero'\)/, 'el curandero, sólo si existe');
  assert.match(des, /conLaCadena\(tipos, d\.oleadas \+ 1, final\)/, 'la cadena entra en la lista de la noche');
  assert.match(des, /conLaCadena\(tipos, d\.oleadas, /, 'y al abrir una partida a mitad de ataque');
  assert.match(des, /cerrarNoche\(cadenaD\(\), d\.oleadas,/, 'al amanecer se cierra la noche');
  assert.match(des, /olvidarCadena\(cadenaD\(\)\)/, 'caer la olvida');
  const fuera = des.indexOf('  // 2.1: los dormidos de los restos no cuentan');
  assert.match(des.slice(des.indexOf('  function terminarOleada('), des.indexOf('  // 3.8.4: caer de día')), /d\.giro = null;/, 'el giro se limpia al amanecer (y al caer)');
  assert.match(des.slice(des.indexOf('  function perderNocheSalteada('), fuera), /d\.giro = null;/, 'y al perder una noche salteada');
  assert.match(des, /anotarEscape\(cadenaD\(\), D\(\)\.oleadas, r\.cosa\)/, 'el que se escapa con lo robado queda anotado');
  assert.match(des, /\|\| brechaDeLaNoche\(\);/, 'la nave baja por donde quedó la brecha');
  assert.match(des, /avisarCadena\(\);/, 'se avisa una hora antes');
  assert.match(des, /nb !== climaVisto\.niebla/, 'la niebla recalcula el efecto del clima');
  assert.match(des, /api\.alcancePerro = /, 'el perro lo sabe');
  assert.match(des, /LUNALLENA\.porcionViejos/); assert.match(des, /LUNALLENA\.vidaViejos/);
  assert.match(reglas, /niebla: \{ \.\.\.NIEBLA \}/); assert.match(reglas, /lunallena: \{ \.\.\.LUNALLENA \}/);
  // no se arma nada por cuadro: el efecto del clima se recalcula sólo al cambiar
  const act = des.slice(des.indexOf('  function actualizar(dt, mundo) {'), des.indexOf('  function hayAtaque()'));
  assert.ok(!/efectoClima\(\{/.test(act), 'efectoClima no se llama con un objeto nuevo por cuadro');
  assert.ok(!/elegirGiro|aplicarCadena|efectoCadena/.test(act), 'ni el giro ni la cadena corren por cuadro');
  // 4.8 (junta): acá se comprobaba que esta rama no tocara lo de «ataques» (curandero, enjambre); ya está todo junto
}

console.log('4.8 noches: ok · niebla y luna llena (franjas, reglas, vista, oído, perro, viejos) · giros de las dos · cadena (escape, sin bajas, huidos, brecha) · guardado · 12 semillas x 30 noches');
