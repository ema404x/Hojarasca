// 4.2: la segunda tanda de lujo (src/planos-lujo-2.js) y la gramola (src/gramola.js), en Node:
//   · las 16 piezas: están en el catálogo, ids y nombres únicos, categoría que existe, materiales que existen, texto;
//   · el precio: dentro de la escala de PRECIOS_CONSTRUCCION.md, redondo, de 1 a 4 veces los materiales, y hay variedad (de lo barato a lo muy caro);
//   · la geometría: sin números rotos, sólo tipo 0 y 4, dentro de lo que miden, sin hundirse, con presupuesto de triángulos;
//   · la física: lo que se cuelga de la pared no choca; lo demás sí y el choque cabe en su ancho;
//   · lo funcional: la cama con dosel duerme, la gramola se usa con E, las de piedra le dan uso al pico;
//   · la gramola: los temas encajan en sus compases, los eventos son sanos, y el motor (con un audio de mentira) arranca, programa, se calla;
//   · el cobro y el reintegro de estas piezas, el guardado de `pagadas`, y que main.js y construccion.js las usan.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const { PLANO, PLANOS } = await import('../src/construccion.js');
const { Constructor } = await import('../src/geometria.js');
const O = await import('../src/obra-pesos.js');
const { economiaNueva, pesosDe, formatoPesos } = await import('../src/economia.js');
const { PIEZAS_LUJO_2, LUJO2_QUE_SE_USA } = await import('../src/planos-lujo-2.js');
const { PIEZAS_LUJO } = await import('../src/planos-lujo.js');
const Gr = await import('../src/gramola.js');
const { leerNotas } = await import('../src/personal-musica.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const relax = (pesos, dia = 4) => ({ modo: 'relax', dia, economia: { ...economiaNueva(), pesos } });

const PRECIOS = {
  'candelabro-pared': 900, 'jarron-flores': 1000, 'cuadro-retrato': 1200, 'cuadro-valle': 1800, 'candelabro-pie': 2200, 'farol-hierro': 2600,
  'biombo-tallado': 2800, 'sillon-cuero': 3000, 'estanteria-roble': 4200, 'armario-tallado': 5500, 'gramola': 6000, 'mesa-banquete': 7000,
  'cama-dosel': 8500, 'pergola-enredadera': 9000, 'estatua-baqueano': 11000, 'chimenea-salon': 12000,
};
const IDS = Object.keys(PRECIOS);
const MATERIALES = { tabla: 100, tronco: 150, piedra: 100, lana: 300 };   // valor base (PRECIOS_CONSTRUCCION.md)
const ESCALA = { 'mueble bueno': [800, 3000], lujo: [4000, 20000] };
const COLGADAS = ['candelabro-pared', 'cuadro-retrato', 'cuadro-valle'];   // van en la pared: no chocan
const EXTERIOR = ['farol-hierro', 'pergola-enredadera', 'estatua-baqueano'];

// ---------------------------------------------------------------- 1. el catálogo
eq(PIEZAS_LUJO_2.map((p) => p.id).sort(), [...IDS].sort(), 'las dieciséis del pedido');
ok(PIEZAS_LUJO_2.length >= 14 && PIEZAS_LUJO_2.length <= 16, 'entre 14 y 16 piezas');
{
  const ids = PLANOS.map((p) => p.id), nombres = PLANOS.map((p) => p.nombre);
  ok(new Set(ids).size === ids.length, 'ningún id repetido en todo el catálogo');
  ok(PIEZAS_LUJO_2.every((p) => nombres.filter((x) => x === p.nombre).length === 1), 'ningún nombre de estas piezas se repite en el catálogo');
  const lujo1 = new Set(PIEZAS_LUJO.map((p) => p.id));
  ok(IDS.every((id) => !lujo1.has(id)), 'ninguna repite las cinco de planos-lujo.js');
}
for (const id of IDS) {
  const P = PLANO[id];
  ok(P && P.pieza === true && P.etapas.length === 1 && P.etapas[0].termina, `${id}: está en el catálogo, una etapa`);
  ok(P.soloRelax === true && !P.soloDesafio, `${id}: sólo en el Relax`);
  ok(['mobiliario', 'exterior', 'trabajo', 'refugios'].includes(P.categoria), `${id}: en una categoría que ya existía (${P.categoria})`);
  ok(EXTERIOR.includes(id) === (P.categoria === 'exterior'), `${id}: la categoría coincide con dónde va`);
  ok(Object.entries(P.pide).every(([k, c]) => Object.hasOwn(MATERIALES, k) && Number.isInteger(c) && c > 0), `${id}: materiales que existen`);
  ok(P.nombre && P.texto && P.texto.length > 60 && P.texto.length < 330 && P.radio > 0 && P.separacion > 0, `${id}: nombre, texto y medidas`);
  ok(!/[A-Za-z]{3,}\s+(the|and|with)\s/.test(P.texto), `${id}: el texto está en castellano`);
  ok(!P.funciones?.includes('luz') && !P.luzInterior && !P.fuego, `${id}: sin luces dinámicas`);
}

// ---------------------------------------------------------------- 2. el precio
for (const id of IDS) {
  const P = PLANO[id], precio = PRECIOS[id];
  eq(P.etapas[0].pesos, precio, `${id}: la etapa declara su precio`);
  eq(P.pesos, precio, `${id}: y el plano también`);
  eq(O.precioDeEtapa(id, 0), precio, `${id}: el registro tiene ${formatoPesos(precio)}`);
  ok(precio % 50 === 0 && (precio < 5000 || precio % 100 === 0), `${id}: precio redondo`);
  const [min, max] = precio < 4000 ? ESCALA['mueble bueno'] : ESCALA.lujo;
  ok(precio >= min && precio <= max, `${id}: dentro de la escala (${formatoPesos(min)} a ${formatoPesos(max)})`);
  const materiales = Object.entries(P.pide).reduce((a, [k, c]) => a + MATERIALES[k] * c, 0);
  ok(precio >= materiales * 0.9 && precio <= materiales * 4.2, `${id}: pesos de 1 a 4 veces los materiales (${formatoPesos(precio)} sobre ${formatoPesos(materiales)})`);
  ok(precio < 14000 + 1 && precio >= 800, `${id}: nada pasa de la fuente de piedra ($14.000) ni baja de $800`);
}
{
  const ps = Object.values(PRECIOS);
  ok(new Set(ps).size === ps.length, 'cada una con su precio');
  ok(Math.min(...ps) <= 1000 && Math.max(...ps) >= 11000, 'hay de lo barato (hasta $1.000) a lo muy caro (desde $11.000)');
  ok(ps.filter((p) => p < 3000).length >= 4 && ps.filter((p) => p >= 8000).length >= 3, 'y varias de cada lado: hay para ahorrar y para darse el gusto');
  ok(PRECIOS['estatua-baqueano'] > PRECIOS['pergola-enredadera'] && PRECIOS['cama-dosel'] > PRECIOS['armario-tallado'] && PRECIOS['armario-tallado'] > PRECIOS['estanteria-roble'] && PRECIOS['estanteria-roble'] > PRECIOS['sillon-cuero'], 'lo más grande y más trabajado cuesta más');
}

// ---------------------------------------------------------------- 3. la geometría
for (const id of IDS) {
  const P = PLANO[id];
  for (const suelo of [null, (x, z) => 0.2 + 0.1 * x]) {
    const c = new Constructor(); P.etapas[0].arma(c, P, {}, suelo);
    ok(c.pos.length > 0 && c.pos.every(Number.isFinite) && c.col.every(Number.isFinite), `${id}: dibuja sin números rotos`);
    ok(c.tipo.every((t) => t === 0 || t === 4), `${id}: sólo tipo 0 y 4`);
  }
  const c = new Constructor(); P.etapas[0].arma(c, P, {}, null);
  const tri = Math.round(c.pos.length / 9);
  ok(tri <= 1000 && tri >= 60, `${id}: ${tri} triángulos (tope 1000; la mediana del juego es ~250)`);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let k = 0; k < c.pos.length; k += 3) { x0 = Math.min(x0, c.pos[k]); x1 = Math.max(x1, c.pos[k]); y0 = Math.min(y0, c.pos[k + 1]); y1 = Math.max(y1, c.pos[k + 1]); z0 = Math.min(z0, c.pos[k + 2]); z1 = Math.max(z1, c.pos[k + 2]); }
  ok(y0 >= -0.02, `${id}: no se hunde (${y0.toFixed(2)})`);
  ok(y1 <= P.alto + 0.12 && y1 >= P.alto * 0.45, `${id}: entra en su alto (${y1.toFixed(2)} de ${P.alto})`);
  ok(Math.max(Math.abs(x0), Math.abs(x1)) <= P.ancho / 2 + 0.12, `${id}: entra en su ancho (${x0.toFixed(2)} a ${x1.toFixed(2)} de ${P.ancho})`);
  ok(Math.max(Math.abs(z0), Math.abs(z1)) <= P.fondo / 2 + 0.12, `${id}: entra en su fondo (${z0.toFixed(2)} a ${z1.toFixed(2)} de ${P.fondo})`);
  // lo que se cuelga de la pared queda en el aire: arriba del piso
  if (COLGADAS.includes(id)) ok(y0 > 0.6, `${id}: colgada a la altura de los ojos (desde ${y0.toFixed(2)})`);
  // la física
  const reg = { s: [], c: [] };
  if (P.fisica) P.fisica({ segmento: (...a) => reg.s.push(a), circulo: (...a) => reg.c.push(a), plataforma: () => {} });
  if (COLGADAS.includes(id)) ok(reg.s.length + reg.c.length === 0, `${id}: no choca`);
  else {
    ok(reg.s.length + reg.c.length >= 1, `${id}: choca`);
    for (const s of reg.s) ok(s.length === 7 && s.every(Number.isFinite) && s[4] > 0 && s[5] < s[6] && s[6] <= P.alto + 0.1, `${id}: segmento sano`);
    for (const q of reg.c) ok(q.length === 5 && q.every(Number.isFinite) && q[2] > 0 && q[3] < q[4] && q[4] <= P.alto + 0.1, `${id}: círculo sano`);
    const alcance = Math.max(0, ...reg.s.map((s) => Math.max(Math.abs(s[0]), Math.abs(s[2])) + s[4]), ...reg.c.map((q) => Math.max(Math.abs(q[0]), Math.abs(q[1])) + q[2]));
    ok(alcance <= P.ancho / 2 + 0.12 || alcance <= P.fondo / 2 + 0.12, `${id}: el choque cabe en su ancho (${alcance.toFixed(2)})`);
  }
}

// ---------------------------------------------------------------- 4. lo funcional
ok(PLANO['cama-dosel'].funciones.includes('dormir') && PLANO['cama-dosel'].confort >= 5, 'la cama con dosel se duerme (y es de las más cómodas)');
ok(PLANO['gramola'].alcanceE > 0 && PIEZAS_LUJO_2.find((p) => p.id === 'gramola').alcanceE === PLANO['gramola'].alcanceE, 'la gramola se usa con E de cerca');
eq(Object.keys(LUJO2_QUE_SE_USA), ['gramola'], 'y es lo único que se usa con E');
for (const id of ['estatua-baqueano', 'chimenea-salon']) ok((PLANO[id].pide.piedra || 0) >= 25, `${id}: pide mucha piedra (le da uso al pico)`);
ok(IDS.filter((id) => (PLANO[id].pide.piedra || 0) > 0).length >= 8, 'y la piedra se usa en varias piezas');
ok(IDS.every((id) => PLANO[id].confort >= 1), 'todas suman confort a la casa');
ok(PLANO['cama-dosel'].confort <= 5, 'la cama con dosel no pasa a la cama doble ($5): no rompe el equilibrio de la casa');

// ---------------------------------------------------------------- 5. el cobro y el reintegro
{
  const p = relax(9000);
  eq(O.puedePagarEtapa(p, 'cama-dosel', 0), { ok: true, precio: 8500 }, 'con plata alcanza');
  eq(O.puedePagarEtapa(relax(3000), 'cama-dosel', 0), { ok: false, precio: 8500, falta: 5500 }, 'sin plata dice cuánto falta');
  eq(O.pagarEtapa(p, 'cama-dosel', 0), { ok: true, precio: 8500 }, 'cobra');
  eq(pesosDe(p), 500, 'el saldo baja');
  eq(O.reintegroAlDesmontar(relax(0), 'cama-dosel', 1, 1), 4250, 'desmontarla devuelve la mitad ($4.250)');
  eq(O.reintegroAlDesmontar(relax(0), 'cama-dosel', 1, 0), 0, 'una de una partida vieja (sin `pagadas`) no regala');
  eq(O.puedePagarEtapa({ modo: 'desafio', economia: economiaNueva() }, 'cama-dosel', 0), { ok: true, precio: 0 }, 'el Desafío no cobra');
  eq(O.puedePagarEtapa({ dia: 3 }, 'estatua-baqueano', 0), { ok: true, precio: 0 }, 'una partida sin economía no cobra');
  eq(O.avisoSinPlata('gramola', { precio: 5500, falta: 500 }, 1).titulo, 'Falta plata para esta pieza', 'el aviso es el de las piezas');
}

// ---------------------------------------------------------------- 6. la gramola: los temas
{
  ok(Gr.TEMAS.length === 3 && new Set(Gr.TEMAS.map((t) => t.id)).size === 3, 'tres temas');
  for (const t of Gr.TEMAS) {
    const notas = leerNotas(t.notas), beats = notas.reduce((a, x) => a + x.t, 0);
    ok(notas.length >= 30 && notas.every((x) => x.midi === null || (x.midi >= 55 && x.midi <= 90)), `${t.id}: notas en un registro cómodo`);
    eq(beats / t.compas, t.acordes.length, `${t.id}: los compases encajan (${beats} tiempos de ${t.compas}, un acorde por compás)`);
    ok(Number.isInteger(beats / t.compas), `${t.id}: compases enteros`);
    const ev = Gr.eventosDeTema(t);
    ok(ev.eventos.length > 100 && ev.duracion >= 20 && ev.duracion <= 70, `${t.id}: ${ev.eventos.length} eventos en ${ev.duracion.toFixed(0)} s`);
    ok(ev.eventos.every((e, i) => Number.isFinite(e.cuando) && e.cuando >= 0 && e.dur > 0 && e.midi >= 30 && e.midi <= 100 && e.vol > 0 && e.vol <= 0.2 && (i === 0 || ev.eventos[i - 1].cuando <= e.cuando)), `${t.id}: eventos sanos y en orden`);
    ok(ev.eventos.every((e) => e.cuando < ev.duracion), `${t.id}: ninguno pasa del final`);
    ok(ev.eventos.some((e) => e.voz === 'mel') && ev.eventos.some((e) => e.voz === 'bajo') && ev.eventos.some((e) => e.voz === 'acorde'), `${t.id}: melodía, bajo y acordes`);
  }
}

// ---------------------------------------------------------------- 7. la gramola: el motor con un audio de mentira
{
  const regs = { osc: 0, buf: 0, tiempo: 0, filtro: 0, desconectados: 0, objetivos: [] };
  const nodo = () => ({ connect() {}, disconnect() { regs.desconectados++; }, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime(v) { regs.objetivos.push(v); } }, frequency: { value: 0 }, Q: { value: 0 }, start() {}, stop() {} });
  const ctx = {
    get currentTime() { return regs.tiempo; }, sampleRate: 8000, state: 'running',
    createOscillator() { regs.osc++; return nodo(); }, createGain: nodo, createBiquadFilter() { regs.filtro++; return nodo(); },
    createBuffer(c, l) { regs.buf++; return { getChannelData: () => new Float32Array(l), duration: l / 8000 }; }, createBufferSource: nodo,
  };
  const sonido = { ctx, bus: { efectos: nodo(), musica: nodo() }, bajaMusica: nodo() };
  eq(Gr.alternarGramola({ ctx: null }, () => true), { sinSonido: true }, 'sin audio no arranca ni se rompe');
  ok(!Gr.gramolaSuena(), 'y no queda sonando');
  let cerca = true;
  const r1 = Gr.alternarGramola(sonido, () => cerca);
  ok(r1.suena && r1.titulo === 'Vals de la gramola' && Gr.gramolaSuena(), 'E la pone: suena el primer tema');
  ok(regs.osc > 0 && regs.filtro === 1 && regs.buf === 1, `programó notas (${regs.osc} osciladores) con un solo filtro y un solo buffer de crujido`);
  ok(regs.osc <= 60, `y sólo lo próximo (${regs.osc} osciladores, no el tema entero)`);
  ok(regs.objetivos.includes(0.3), 'baja un poco la música de fondo');
  const r2 = Gr.alternarGramola(sonido, () => cerca);
  ok(!r2.suena && !Gr.gramolaSuena(), 'E otra vez la para');
  ok(regs.objetivos.includes(1), 'y devuelve la música de fondo');
  const r3 = Gr.alternarGramola(sonido, () => cerca);
  ok(r3.suena && r3.titulo === 'Polca del domingo', 'la próxima vez toca el tema que sigue');
  // se calla sola si te alejás (o si la desmontan): lo mira el temporizador
  cerca = false;
  await new Promise((r) => setTimeout(r, 700));
  ok(!Gr.gramolaSuena(), 'si te alejás o la desmontan, se calla sola');
  const r4 = Gr.alternarGramola(sonido, () => true);
  eq(r4.titulo, 'Habanera de la tarde', 'y el tercer tema');
  Gr.detenerGramola();
  ok(!Gr.gramolaSuena(), 'detenerGramola la para (y si ya está parada no pasa nada)');
  Gr.detenerGramola();
  const r5 = Gr.alternarGramola(sonido, () => true);
  eq(r5.titulo, 'Vals de la gramola', 'y vuelve al primero');
  Gr.detenerGramola();
}

// ---------------------------------------------------------------- 8. el guardado: `pagadas` sobrevive
{
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const G = await import('../src/guardado.js');
  const obras = [{ plano: 'cama-dosel', x: 1, z: 2, rot: 0, etapas: 1, pagadas: 1 }, { plano: 'gramola', x: 3, z: 2, rot: 0, etapas: 1, pagadas: 1 }, { plano: 'baul', x: 5, z: 2, rot: 0, etapas: 1 }];
  ok(G.escribirPartida('relax', 1, { modo: 'relax', dia: 5, horas: 10, obras, economia: { ...economiaNueva(), pesos: 500 } }), 'se guarda');
  const r = G.leerPartida('relax', 1).progreso;
  eq(r.obras.map((o) => o.plano), ['cama-dosel', 'gramola', 'baul'], 'las piezas vuelven');
  eq(r.obras.map((o) => o.pagadas), [1, 1, undefined], 'lo pagado vuelve igual y lo viejo sigue sin `pagadas`');
}

// ---------------------------------------------------------------- 9. el código: main.js, construccion.js, y el estilo de los imports
{
  const m = leer('src/main.js');
  ok(m.includes("import { LUJO2_QUE_SE_USA } from './planos-lujo-2.js';") && m.includes("import { alternarGramola, gramolaSuena, gramolaSuenaEn, DISTANCIA_GRAMOLA } from './gramola.js';"), 'main.js trae la gramola');
  ok(m.includes('OBRAS_QUE_TRABAJAN.push(...Object.keys(LUJO2_QUE_SE_USA));'), 'la gramola es una obra que se usa con E');
  ok(m.includes("case 'gramola': return gramolaSuenaEn(o) ? 'Parar la gramola' : LUJO2_QUE_SE_USA.gramola;"), 'el aviso cambia según suene o no (esa gramola)');
  ok(m.includes('const r = alternarGramola(sonido, () => (obras?.obras || []).includes(o)'), 'E la alterna y se calla si la desmontan');
  const c = leer('src/construccion.js');
  ok(c.includes("import { PIEZAS_LUJO_2 } from './planos-lujo-2.js';") && c.includes('PIEZAS.push(...PIEZAS_LUJO_2);'), 'construccion.js suma las piezas con un import y un push');
  ok(c.includes('PIEZAS.push(...PIEZAS_LUJO);'), 'y no tocó lo de las cinco primeras');
  for (const f of ['src/planos-lujo-2.js', 'src/gramola.js']) {
    const t = leer(f);
    for (const x of t.matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(x[0]), `${f}: import en una línea y sin comentario atrás`);
    ok(!/ñ/.test([...t.matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)].map((x) => x[1]).join(' ')), `${f}: exporta sin ñ`);
    ok(!/export\s*\{/.test(t), `${f}: sin export { } (se usa export const)`);
    ok(!/\|\|\s*'escuela'|\bmando\b|gamepad/i.test(t), `${f}: nada fuera de lugar`);
    ok(!/\b(english|inglés|ingles|translate|traducci)/i.test(t), `${f}: sin nada de inglés ni traducciones`);
  }
  ok(!/\.(mp3|ogg|wav|flac)\b|fetch\(|new Audio\(/.test(leer('src/gramola.js')), 'la gramola no baja ni carga audios: todo sintetizado');
  const k = leer('src/construccion.js');
  ok(/CATEGORIAS_CONSTRUCCION|PLANOS_POR_PAGINA/.test(k), 'las categorías y las páginas siguen en construccion.js');
}

console.log(`verificar-4-2-lujo: ${n} verificaciones ok`);
