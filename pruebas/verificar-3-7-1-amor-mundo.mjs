// 3.7.1 "Amor en la aldea", el mundo (sin Electron): src/amor-escenas.js (puro) y lo que se engancha en aldea-gente.js,
// gente.js, amor-juego.js y main.js; src/amor-mundo.js se revisa leyendo el código (las reglas del three local, el
// material de siempre, sin compilar nada nuevo).
//  · la pareja en el mundo: la cita (sale con tiempo, llega por el camino, su momento, la sobremesa), el refugio de noche
//    (la silla y la cama), el desayuno de la mañana después, separados no;
//  · los hijos: el bebé en la cuna o con la mamá, los chicos en su cama, la escuela, la plaza, la alfombra del refugio;
//  · el cuarto que se suma a la casa (al refugio y a cada casa de las candidatas, sin chocar con nada);
//  · el casamiento (el juez detrás del mostrador, los testigos, los invitados, tu familia) y la fiesta (salón o plaza,
//    el brindis); caminar juntos; con el ajuste apagado, nada.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as E from '../src/amor-escenas.js';
import * as M from '../src/amor.js';
import * as A from '../src/aldea.js';
import * as V from '../src/vecindad.js';
import * as G from '../src/aldea-gente.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (a, b, t = 0.05) => Math.abs(a - b) < t;
const aldeaCompleta = () => {
  const a = A.aldeaNueva();
  a.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  a.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  return A.sanearAldea(a);
};
const ficha = (etapa, extra = {}) => ({ etapa, afecto: 80, desde: 1, contacto: 3, charla: 0, piropo: 0, flores: 0, carta: 0, leyo: null, citas: 3, ultimaCita: 0, enojo: 0, motivo: null, rechazo: 0, reconquista: 0, chicos: 0, ...extra });
const partida = (extra = {}) => ({ dia: 3, horas: 10, entradas: {}, materiales: {}, cosas: {}, aldea: aldeaCompleta(), vecindad: V.vecindadNueva(), amor: M.amorNuevo(), ...extra });
const MA = A.marcoAldea(A.PARADA_ALDEA);
const REF = { x: -120, z: 232, y: 10, rot: 0.6 };
const SENDERO = Array.from({ length: 40 }, (_x, i) => ({ x: -160 + i * 4, z: 260 }));
const marcos = {
  refugio: REF, edificio: (id) => { const e = A.edificioEnMundo(id); return e ? { x: e.x, z: e.z, y: e.y, rot: e.rot } : null; },
  lugarValle: (k) => ({ mirador: { x: 300, z: 100 }, muelle: { x: -60, z: 200 } })[k] || { x: 0, z: 0 }, sendero: SENDERO, aldea: MA.aMundo(0, 40),
  aMundoPlano: (x, z) => MA.aMundo(x, z), rotPlano: (r) => MA.rotMundo(r),
};
const ctxDe = (p, extra = {}) => ({ dia: p.dia, hora: p.horas, aldea: p.aldea, mundo: M.mundoAmor(p, { dia: p.dia, hora: p.horas }), marcos, ...extra });

// ============================================================ 1. el código
{
  const mundo = leer('src/amor-mundo.js'), esc = leer('src/amor-escenas.js'), main = leer('src/main.js'), ag = leer('src/aldea-gente.js'), gente = leer('src/gente.js'), aj = leer('src/amor-juego.js');
  ok(!/from 'three'|document\.|window\./.test(esc), 'amor-escenas.js es puro (sin three ni el DOM)');
  ok(!/new THREE\.(ShapeGeometry|Shape|OctahedronGeometry|Vector4|Frustum)\b/.test(mundo), 'nada de lo que el three local no trae');
  ok(!/new THREE\.\w*Material\b/.test(mundo), 'sin materiales nuevos: todo con el de las estructuras (no se compila nada a mitad de juego)');
  ok([...mundo.matchAll(/tipo:\s*(\d)/g)].every((m) => m[1] === '0' || m[1] === '4') && [...mundo.matchAll(/'#[0-9a-f]{6}',\s*(\d)\b/gi)].every((m) => ['0', '4'].includes(m[1])), 'la geometría, con material tipo 0 o 4');
  for (const t of [mundo, esc]) {
    ok(t.split('\n').filter((l) => /^import /.test(l)).every((l) => /^import \{ [^}]+ \} from '\.\/[\w-]+\.js';$|^import \* as THREE from 'three';$/.test(l)), 'imports en una línea');
    ok(![...t.matchAll(/^export (?:function|const|let) ([^\s(=]+)/gm)].some((m) => /ñ/.test(m[1])), 'exportados sin ñ');
    ok(!/\r\n/.test(t), 'fines de línea LF');
    ok(!/^export \{/m.test(t) && !/^export (async function|function\*)/m.test(t), 'sin «export { }» (armar.mjs no lo entiende)');
    ok(!/\b(iglesia|capilla|cura|misa|altar|bendic\w*|dios|religios\w*|sacerdote|pastor)\b/i.test(t.replace(/sin religión|nada religioso|Nada religioso/g, '')), 'nada religioso');
  }
  ok(main.includes("import { crearAmorMundo } from './amor-mundo.js';") && main.includes('amorDestino: (k) => amorMundo?.destino(k) || null') && main.includes('mundo: () => amorMundo,') && main.includes('if (!desafio) amorMundo?.actualizar(dt);'), 'main.js: el mundo del amor enganchado (sólo en el Relax)');
  ok(ag.includes('const r = ctx.amorDestino(k);') && ag.includes('if (n.conVos) { st.clave = \'\'; continue; }') && ag.includes('function llegarCaminando(n, d)'), 'aldea-gente.js: el destino del amor manda, y llega caminando');
  ok(gente.includes("case 'dormir':") && gente.includes("case 'brindar':") && gente.includes('function gestoAmor(g)') && gente.includes('if (g.enLejano || g.conVos || g.alAmor) cerquita = false;'), 'gente.js: acostada, el brindis, de la mano y del brazo');
  ok(aj.includes("ctx.mundo?.()?.opcionCaminar?.(clave)") && aj.includes("que === 'caminar'"), 'amor-juego.js: salir a caminar juntos');
}

// ============================================================ 2. el cuarto de los chicos
{
  const cr = E.cuartoDe('refugio');
  ok(cr.base === 'refugio' && cerca(cr.lx, -(E.REFUGIO.W / 2 + 0.16 + E.CUARTO.ancho / 2)) && cr.espejo === 1, 'el del refugio, pegado a la pared del costado (la de la ventana)');
  ok(cr.alto < 2.42 && cr.bajo > 2.0, 'la chapa pasa por debajo del alero del refugio y adentro se está parado');
  for (const [k, casa] of Object.entries(E.CASAS_CANDIDATAS)) {
    const c = E.cuartoDe(casa);
    ok(c && c.choca === 0, `${k} (${casa}): el cuarto al costado, sin chocar con otro edificio, el anexo ni la calle`);
  }
  ok(E.cuartoDe('plaza') === null && E.cuartoDe('estacion-aldea') === null, 'la plaza y la estación no suman cuarto');
  // los puntos, adentro del cuarto (espejado o no)
  for (const espejo of [1, -1]) {
    const mc = { x: 10, z: 20, y: 5, rot: 0.4, espejo, piso: 0.32, alto: 2.7, bajo: 2.5 };
    for (const nombre of ['cuna', 'cama-hijo-1', 'cama-hijo-2', 'adentro', 'umbral']) {
      const p = E.puntoCuarto(mc, nombre, E.TALLA_HIJO.joven);
      const l = E.aLocalMarco(mc, p.x, p.z);
      ok(Math.abs(l.lx) < E.CUARTO.ancho / 2 && Math.abs(l.lz) < E.CUARTO.fondo / 2, `${nombre} (espejo ${espejo}): adentro`);
    }
    const pu = E.aLocalMarco(mc, E.puntoCuarto(mc, 'puerta').x, E.puntoCuarto(mc, 'puerta').z);
    ok(pu.lz > E.CUARTO.fondo / 2 && Math.sign(pu.lx) === espejo, `la puerta, afuera, del lado de la casa (espejo ${espejo})`);
    // acostado: los pies adentro de la cama y la cabeza en la almohada, para cada talla
    for (const t of [E.TALLA_HIJO.chico, E.TALLA_HIJO.joven]) {
      const p = E.puntoCuarto(mc, 'cama-hijo-1', t);
      const l = E.aLocalMarco(mc, p.x, p.z);
      const m = E.MUEBLES_CUARTO['cama-hijo-1'];
      ok(p.pose === 'dormir' && Math.abs(espejo * l.lx - m.x) <= m.largo / 2 + 0.01, `la cama 1, talla ${t}: los pies sobre la cama`);
    }
  }
}

// ============================================================ 3. la cita
{
  const p = partida({ dia: 3, horas: 9.9 });
  p.amor.personas.fotografa = ficha('saliendo');
  p.amor.cita = { clave: 'fotografa', lugar: 'mirador', dia: 3, desde: 11, hasta: 12.5, estado: 'acordada' };
  ok(E.destinoPareja(p, 'fotografa', ctxDe(p)) === null || E.destinoPareja(p, 'fotografa', ctxDe(p)).lugar !== 'cita', 'antes de las 10, todavía con lo suyo');
  p.horas = 10.1;
  let d = E.destinoPareja(p, 'fotografa', ctxDe(p));
  ok(d && d.lugar === 'cita' && d.fuera && cerca(d.x, 301.2) && cerca(d.z, 101.2), 'una hora antes ya sale al mirador (afuera de la aldea)');
  ok(d.llegada && Math.hypot(d.llegada.x - d.x, d.llegada.z - d.z) >= 18 && Math.hypot(d.llegada.x - d.x, d.llegada.z - d.z) <= 45, 'y llega caminando, desde el camino');
  ok(d.pose === null, 'esperando, parada');
  { const agua = (x, z) => z > 100; const l = E.llegadaValle({ x: 0, z: 99 }, [], { x: 0, z: 400 }, (x, z) => !agua(x, z)); ok(l && !agua(l.x, l.z), 'la llegada nunca en el agua (si la aldea queda del lado del lago, por otro lado)'); }
  { const s = E.destinoPareja(p, 'fotografa', { ...ctxDe(p), marcos: { ...marcos, sentadero: () => ({ x: 302, z: 101, mira: 0, asiento: 0.45 }) } }); ok(s.pose === null, 'esperando no se sienta todavía'); }
  p.amor.cita.estado = 'en-curso';
  d = E.destinoPareja(p, 'fotografa', ctxDe(p));
  ok(d.pose === 'mirar', 'empezada, mira el paisaje');
  { const s = E.destinoPareja(p, 'fotografa', { ...ctxDe(p), marcos: { ...marcos, sentadero: () => ({ x: 302, z: 101, mira: 0, asiento: 0.45 }) } }); ok(s.pose === 'sentado' && s.asiento === 0.45 && cerca(Math.hypot(s.x - 302, s.z - 101), 0.5), 'con un banco cerca, se sienta en una punta (la otra es tuya)'); }
  p.amor.cita = null;
  d = E.destinoPareja(p, 'fotografa', ctxDe(p, { puesta: { clave: 'fotografa', por: 'cita', lugar: 'mirador' } }));
  ok(d && d.lugar === 'cita' && d.pose === 'mirar', 'la sobremesa: se queda un rato en el lugar');
  ok(E.destinoPareja(p, 'fotografa', ctxDe(p)) === null || E.destinoPareja(p, 'fotografa', ctxDe(p)).lugar !== 'cita', 'después, a lo suyo');
  // en la aldea: un punto con nombre (aldea-gente.js la lleva por las calles) y su momento
  p.amor.personas.galesa = ficha('saliendo');
  p.amor.cita = { clave: 'galesa', lugar: 'casa-te', dia: 3, desde: 20, hasta: 21.75, estado: 'acordada' };
  p.horas = 19.6;
  d = E.destinoPareja(p, 'galesa', ctxDe(p));
  ok(d && !d.fuera && d.edificio === 'casa-te' && d.punto === 'mesa-4' && !Number.isFinite(d.x), 'la casa de té: media hora antes va a la mesa 4');
  p.amor.cita.estado = 'en-curso';
  ok(E.destinoPareja(p, 'galesa', ctxDe(p)).pose === 'sentado', 'empezada, el té sentados');
  for (const [lugar, pose] of Object.entries(E.MOMENTO_CITA)) ok(Object.hasOwn(M.LUGARES_CITA, lugar) && typeof pose.pose === 'string', `${lugar}: su momento (${pose.pose})`);
  ok(Object.keys(M.LUGARES_CITA).every((k) => Object.hasOwn(E.MOMENTO_CITA, k)), 'todos los lugares de cita tienen su momento');
  // con el ajuste apagado, nada
  p.amor.cita.estado = 'acordada';
  ok(E.destinoPareja(p, 'galesa', { ...ctxDe(p), mundo: M.mundoAmor(p, { romance: false }) }) === null, 'apagado: nada');
  ok(E.destinoPareja(p, 'nena', ctxDe(p)) === null && E.destinoPareja(p, 'modista', ctxDe(p)) === null, 'ni chicos ni Pocha');
}

// ============================================================ 4. vivir juntos en el refugio, la mañana después
{
  const p = partida({ dia: 8, horas: 20 });
  p.amor.personas.veterinaria = ficha('casados');
  p.amor.conyuge = 'veterinaria';
  p.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: 7 };
  let d = E.destinoPareja(p, 'veterinaria', ctxDe(p));
  const silla = E.aMundoMarco(REF, E.PUNTOS_REFUGIO.adentro.x, E.PUNTOS_REFUGIO.adentro.z);
  ok(d && d.fuera && d.edificio === 'refugio' && d.punto === 'adentro' && d.sentado && d.pose === 'sentado' && cerca(d.x, silla.x) && cerca(d.z, silla.z), 'a la noche, en el refugio: a la mesa, en su silla');
  ok(d.entrada.length === 2 && d.llegada, 'entra por la puerta, llegando por el camino');
  p.horas = 23.5;
  d = E.destinoPareja(p, 'veterinaria', ctxDe(p));
  ok(d.punto === 'cama' && d.pose === 'dormir' && cerca(d.y, REF.y + E.PUNTOS_REFUGIO.cama.y), 'tarde, en la cama (acostada)');
  p.horas = 11;
  d = E.destinoPareja(p, 'veterinaria', ctxDe(p));
  ok(d === null, 'de día, a su local (lo de siempre)');
  p.amor.niki = 8; p.dia = 9; p.horas = 8.5;
  d = E.destinoPareja(p, 'veterinaria', ctxDe(p));
  ok(d && d.edificio === 'refugio' && d.punto === 'adentro', 'la mañana después: el desayuno juntos (hasta las 9 y media)');
  p.horas = 9.6;
  ok(E.destinoPareja(p, 'veterinaria', ctxDe(p)) === null, 'y después, a trabajar');
  p.amor.personas.veterinaria.etapa = 'separados'; p.horas = 23.5;
  d = E.destinoPareja(p, 'veterinaria', ctxDe(p));
  ok(!d || d.edificio !== 'refugio', 'separados, no viene al refugio');
  // esperando un bebé, a la obra no
  p.amor.personas.veterinaria.etapa = 'casados';
  ok(M.mundoAmor(p, { dia: p.dia, hora: p.horas }).activo, 'el mundo sigue activo');
}

// ============================================================ 5. los hijos
{
  const p = partida({ dia: 40, horas: 23 });
  p.amor.personas.veterinaria = ficha('casados');
  p.amor.conyuge = 'veterinaria';
  p.amor.convivencia = { con: 'veterinaria', donde: 'refugio', desde: 7 };
  p.amor.hijos = [{ id: 'hijo-1', nombre: 'Mateo', sexo: 'nene', nacio: 26, madre: 'veterinaria', guia: null }, { id: 'hijo-2', nombre: 'Juana', sexo: 'nena', nacio: 38, madre: 'veterinaria', guia: null }];
  let b = E.destinoHijo(p, 1, ctxDe(p));
  ok(b && b.bebe && b.donde === 'cuna' && b.casa === 'refugio', 'el bebé, de noche, en la cuna del cuarto del refugio');
  p.horas = 11;
  b = E.destinoHijo(p, 1, ctxDe(p));
  ok(b && b.bebe && b.donde === 'mama' && b.madre === 'veterinaria', 'de día, en brazos de la mamá');
  ok(E.figuraHijo(p.amor.hijos[1], 1, p.dia) === null, 'el bebé no tiene figura propia');
  const f = E.figuraHijo(p.amor.hijos[0], 0, p.dia);
  ok(f && f.etapa === 'chico' && cerca(f.talla, 0.62) && f.nombre === 'Mateo' && f.oficio === 'tu hijo', 'Mateo, un chico del estilo P (talla de chico)');
  p.horas = 22;
  let h = E.destinoHijo(p, 0, ctxDe(p));
  const mc = E.marcoCuarto(E.cuartoDe('refugio'), REF);
  ok(h && h.cuarto && h.pose === 'dormir' && h.punto === 'cama-hijo-1' && h.entrada.length === 2, 'de noche, dormido en su cama, en el cuarto (entra por su puerta)');
  const l = E.aLocalMarco(mc, h.x, h.z);
  ok(Math.abs(l.lx) < E.CUARTO.ancho / 2 && Math.abs(l.lz) < E.CUARTO.fondo / 2, 'la cama está adentro del cuarto');
  p.horas = 19;
  h = E.destinoHijo(p, 0, ctxDe(p));
  ok(h && h.edificio === 'refugio' && h.pose === 'sentado' && h.fuera, 'a la tardecita, en la alfombra del refugio');
  p.horas = 9; p.dia = 41;
  while (A.diaSemanaDe(p.dia) >= 5) p.dia++;
  h = E.destinoHijo(p, 0, ctxDe(p));
  ok(h && h.lugar === 'escuela' && h.pose === 'sentado' && !h.fuera && Number.isFinite(h.x), 'un día de semana a la mañana, a la escuela (sentado en el pupitre)');
  p.horas = 15;
  h = E.destinoHijo(p, 0, ctxDe(p));
  ok(h && h.lugar === 'plaza' && h.pose === 'jugar', 'a la tarde, a jugar a la plaza');
  ok(E.cuartoVisible(M.mundoAmor(p, { dia: p.dia, hora: p.horas }))?.cuna === true, 'con un bebé, el cuarto tiene cuna');
  eq(E.cuartoVisible(M.mundoAmor(p, { romance: false })), null, 'apagado, no hay cuarto');
}

// ============================================================ 6. el casamiento y la fiesta
{
  const p = partida({ dia: 12, horas: 10.7 });
  p.amor.personas.veterinaria = ficha('comprometidos');
  p.amor.boda = { con: 'veterinaria', dia: 12, hora: 11 };
  p.vidaAldea = { familia: { quien: 'hermano' } };
  const presentes = [...A.ORDEN_VECINOS_ALDEA, ...A.ORDEN_POBLADORES_ALDEA, 'ercilia'];
  const mundo = M.mundoAmor(p, { dia: 12, hora: 10.7 });
  let e = E.escenaBoda(p, { dia: 12, hora: 10.7, mundo, aldea: p.aldea, presentes });
  ok(e && e.fase === 'ceremonia' && e.donde === 'biblioteca' && e.ella.clave === 'veterinaria', 'la ceremonia, en la biblioteca popular');
  const pts = A.puntosFijosDe('biblioteca');
  ok(e.juez && Math.hypot(e.juez.plano.x - pts.adentro.x, e.juez.plano.z - pts.adentro.z) < 0.8, 'el juez de paz, detrás del mostrador');
  ok(Math.hypot(e.ella.destino.plano.x - pts.cliente.x, e.ella.destino.plano.z - pts.cliente.z) < 0.5, 'la novia, frente al mostrador');
  ok(e.personas.get('jefe')?.punto === 'testigo-1' && e.personas.get('modista')?.punto === 'testigo-2', 'los testigos: Ernesto y Pocha');
  ok(e.personas.get('herrero')?.sentado === true && /^lectura-/.test(e.personas.get('herrero').punto), 'Anselmo, sentado entre los invitados');
  ok(e.familia.length === 1 && e.familia[0].quien === 'hermano', 'tu familia (tu hermano)');
  ok(!e.personas.has('veterinaria'), 'la novia no es invitada de sí misma');
  ok(E.escenaBoda(p, { dia: 12, hora: 9.5, mundo, aldea: p.aldea, presentes }) === null, 'antes de que llegue el juez, nada');
  // casados: la fiesta (la recuerda amor-mundo.js)
  p.amor.boda = null; p.amor.conyuge = 'veterinaria'; p.amor.personas.veterinaria.etapa = 'casados'; p.amor.personas.veterinaria.desde = 12;
  const m2 = M.mundoAmor(p, { dia: 12, hora: 11.5 });
  const fiesta = { dia: 12, desde: 11.3, con: 'veterinaria' };
  e = E.escenaBoda(p, { dia: 12, hora: 11.4, mundo: m2, aldea: p.aldea, presentes, fiesta });
  ok(e && e.fase === 'fiesta' && e.donde === 'salon' && e.ella.destino.pose === 'bailar' && e.brindis, 'la fiesta en el salón: la novia baila, y al principio, el brindis');
  ok(e.personas.get('musico')?.punto === 'escenario' && e.personas.get('musico').pose === 'tocar' && e.musica, 'el músico toca');
  ok([...e.personas.values()].some((x) => x.pose === 'brindar'), 'los vasos en alto');
  e = E.escenaBoda(p, { dia: 12, hora: 12.5, mundo: m2, aldea: p.aldea, presentes, fiesta });
  ok(e && !e.brindis && ![...e.personas.values()].some((x) => x.pose === 'brindar'), 'después del brindis, a bailar');
  delete p.aldea.locales.salon;
  e = E.escenaBoda(p, { dia: 12, hora: 12.5, mundo: m2, aldea: p.aldea, presentes, fiesta });
  ok(e && e.donde === 'plaza' && e.mesa && e.mesa.largo > 2, 'sin salón, en la plaza con una mesa larga');
  ok(E.escenaBoda(p, { dia: 12, hora: 11.3 + E.BODA.fiesta + 0.01, mundo: m2, aldea: p.aldea, presentes, fiesta }) === null, 'la fiesta dura dos horas y media');
  ok(E.escenaBoda(p, { dia: 13, hora: 12, mundo: m2, aldea: p.aldea, presentes, fiesta }) === null, 'y no al otro día');
  ok(E.escenaBoda(p, { dia: 12, hora: 12, mundo: { activo: false }, aldea: p.aldea, presentes, fiesta }) === null, 'apagado: nada');
}

// ============================================================ 7. caminar juntos
{
  const p = partida({ dia: 3, horas: 16 });
  p.amor.personas.herbolaria = ficha('novios');
  ok(E.puedeCaminar(p, 'herbolaria', { dia: 3, hora: 16, aldea: p.aldea }).ok || E.puedeCaminar(p, 'herbolaria', { dia: 3, hora: 16, aldea: p.aldea }).motivo === 'trabaja', 'a la tarde, se puede (o está trabajando)');
  eq(E.puedeCaminar(p, 'herbolaria', { dia: 3, hora: 23, aldea: p.aldea }), { ok: false, motivo: 'noche' }, 'a la noche, no');
  eq(E.puedeCaminar(p, 'pintora', { dia: 3, hora: 16, aldea: p.aldea }), { ok: false, motivo: 'no' }, 'sin ser pareja, no');
  ok(E.JUNTOS.lado.mano < E.JUNTOS.lado.cerca && E.JUNTOS.lado.brazo <= E.JUNTOS.lado.mano, 'de la mano y del brazo, más cerca que saliendo');
  ok(['saliendo', 'novios', 'comprometidos', 'casados'].every((k) => E.FRASES_JUNTOS.si[k]), 'lo que dice al salir, en cada etapa');
  // la pose explícita gana (aldea-gente.js)
  ok(G.poseDe({ lugar: 'boda', pose: 'brindar' }) === 'brindar' && G.poseDe({ lugar: 'salon', punto: 'baile-3' }) === 'bailar' && G.poseDe({ sentado: true, pose: null }) === 'sentado', 'poseDe: la del amor, si la pide');
}

console.log(`verificar-3-7-1-amor-mundo: ${n} comprobaciones OK`);
