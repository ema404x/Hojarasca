// 4.20.0 (auditoría B): números de la auditoría de la Historia, calculados con los módulos reales (no cambia el juego). Se corre por partes:
//   node herramientas/auditoria-historia-b.mjs escenas       → escenas, líneas y minutos de lectura por capítulo (principales y optativas)
//   node herramientas/auditoria-historia-b.mjs ventanas      → ventanas horarias de los objetivos y espera esperada
//   node herramientas/auditoria-historia-b.mjs ecos          → qué lee del futuro cada opción de las seis decisiones
//   node herramientas/auditoria-historia-b.mjs lazos         → fuentes de lazo por vecino (escenas, decisiones, encargos) y rango alcanzable
//   node herramientas/auditoria-historia-b.mjs corridas <archivo.json>   → resumen de las corridas de auditoria-historia-corridas.mjs (aliados, finales, ramal)
//   node herramientas/auditoria-historia-b.mjs logros <archivo.json>     → los logros internos propuestos y cuántas corridas los cumplen
//   node herramientas/auditoria-historia-b.mjs marcas        → cuántos objetivos tendrían una marca en el mapa con los datos que ya hay
import fs from 'node:fs';
import { H, D, ESC, O } from '../pruebas/ayuda-4-18-4-historia.mjs';
import { ENCARGOS } from '../src/encargos.js';
import { ENCARGOS_TEMPORADA } from '../src/encargos-temporada.js';

const txt = (l) => (typeof l === 'string' ? l : (l && l.texto) || '');
const opt = new Set(O.OPTATIVAS.flatMap((o) => o.escenas));
const MIN_GUION = { 1: [20, 25], 2: [30, 40], 3: [25, 35], 4: [30, 40], 5: [35, 45], 6: [30, 40], 7: [30, 40], 8: [30, 40], 9: [30, 40], 10: [25, 30], 11: [35, 45], 12: [25, 30], 13: [20, 30] };   // GUION_HISTORIA.md, sección 2.1
const cmd = process.argv[2] || 'escenas';

function escenas() {
  const st = {};
  for (const e of Object.values(ESC)) {
    const k = `${opt.has(e.id) ? 'opt' : 'pri'}${e.capitulo}`;
    const s = (st[k] ||= { esc: 0, lin: 0, ch: 0, ele: 0 });
    s.esc++;
    for (const p of e.pasos) { if (p.tipo === 'dialogo') for (const l of p.lineas) { s.lin++; s.ch += txt(l).length; } if (p.tipo === 'eleccion') s.ele++; }
  }
  const m = (s, v) => (s.ch / v + s.lin * 0.8) / 60;   // 42 letras por segundo (la máquina de escribir) o 15 (lectura cómoda), más 0,8 s por línea para apretar la tecla
  let totP = 0, totG = 0;
  console.log('cap | escenas princ. | líneas | min lectura (rápido-cómodo) | min del guion (principal) | % de escenas sobre el guion | optativas (escenas, min)');
  for (let c = 1; c <= 13; c++) {
    const a = st[`pri${c}`] || { esc: 0, lin: 0, ch: 0 }, b = st[`opt${c}`] || { esc: 0, lin: 0, ch: 0 };
    const [g] = MIN_GUION[c];
    totP += m(a, 15); totG += g;
    console.log(`${String(c).padStart(2)} | ${a.esc} | ${a.lin} | ${m(a, 42).toFixed(1)}-${m(a, 15).toFixed(1)} | ${g} | ${(100 * m(a, 42) / g).toFixed(0)}-${(100 * m(a, 15) / g).toFixed(0)} % | ${b.esc}, ${m(b, 42).toFixed(1)}-${m(b, 15).toFixed(1)}`);
  }
  console.log(`total lectura cómoda ${totP.toFixed(0)} min de ${totG} min del guion`);
}

function ventanas() {
  const src = fs.readFileSync(new URL('../src/historia.js', import.meta.url), 'utf8');
  const bloque = src.slice(src.indexOf('export const CAPITULOS'), src.indexOf('export const CAPITULO ='));
  const rows = [];
  for (const [k, d] of Object.entries(D.DISPARADORES)) {
    if (!d.hora) continue;
    const [a, b] = d.hora; const len = (((b - a) % 24) + 24) % 24 || 24;
    rows.push({ k, cap: String(d.cap), a, b, len, obj: bloque.includes(`'${d.escena || k}'`) });
  }
  rows.sort((x, y) => x.len - y.len);
  const ob = rows.filter((r) => r.obj);
  let tot = 0; for (const r of ob) tot += ((24 - r.len) ** 2) / 48;   // espera media si se llega a cualquier hora del día con la misma probabilidad
  console.log(`ventanas en objetivos: ${ob.length}; en optativas: ${rows.length - ob.length}; largo medio ${(ob.reduce((s, r) => s + r.len, 0) / ob.length).toFixed(1)} h`);
  for (const r of ob.slice(0, 12)) console.log(`  ${r.cap.padEnd(9)} ${r.k.padEnd(24)} ${r.a}-${r.b}  ${r.len.toFixed(1)} h de juego = ${Math.round(r.len * 75)} s reales`);
  console.log(`espera esperada sumada: ${tot.toFixed(0)} h de juego = ${(tot * 75 / 60).toFixed(0)} min reales sin sentarse; con R (x40) ${(tot * 75 / 40 / 60).toFixed(1)} min (día de 30 min: 1 h de juego = 75 s)`);
}

function ecos() {
  const tab = {};
  for (const e of Object.values(ESC)) for (const p of e.pasos) {
    const c = p.si;
    if (c && c.cond === 'decision') { const k = `${c.args.d}:${c.args.es}`; (tab[k] ||= { escenas: new Set(), caps: new Set() }); tab[k].escenas.add(e.id); tab[k].caps.add(e.capitulo); }
  }
  for (const d of H.DECISIONES) for (const o of ['a', 'b', 'c']) {
    const t = tab[`${d}:${o}`];
    console.log(`${d}:${o}  escenas con variante: ${t ? [...t.escenas].join(' ') : '—'}  | capítulos: ${t ? [...t.caps].sort((x, y) => x - y).join(',') : '—'}`);
  }
  // la tarjeta final sólo mira: trato/pelea, ramal, majada=a, cuaderno=a, graciela>=3, lazos de vecinos y la noche perdida (historia-final.js)
}

function lazos() {
  const enc = {};
  for (const e of [...ENCARGOS, ...ENCARGOS_TEMPORADA]) enc[e.quien] = (enc[e.quien] || 0) + 1;
  console.log('encargos del Relax que suman +1 de lazo a quien los pide:', JSON.stringify(enc), '· rango del lazo', H.LAZO_MIN, 'a', H.LAZO_MAX);
}

function corridas(arch) {
  const R = JSON.parse(fs.readFileSync(arch, 'utf8'));
  const n = R.length;
  const pct = (f) => `${Math.round((100 * R.filter(f).length) / n)} %`;
  console.log(`${n} corridas; terminaron ${pct((r) => r.fin)}; atascadas ${R.filter((r) => r.atascado).length}; con errores ${R.filter((r) => r.errores).length}`);
  console.log('aliados de la noche (sin encargos): Ramón', pct((r) => r.aliados.ramon), '· Josefina', pct((r) => r.aliados.josefina), '· Fermín', pct((r) => r.aliados.fermin), '· los tres', pct((r) => r.aliados.ramon && r.aliados.josefina && r.aliados.fermin), '· ninguno', pct((r) => !r.aliados.ramon && !r.aliados.josefina && !r.aliados.fermin));
  console.log('ramal:', ['salvado', 'a prueba', 'en duda'].map((e) => `${e} ${pct((r) => r.estadoRamal === e)}`).join(' · '));
  console.log('final:', ['trato', 'pelea'].map((e) => `${e} ${pct((r) => r.trato === e)}`).join(' · '), '· noche:', ['ganada', 'perdida'].map((e) => `${e} ${pct((r) => r.noche === e)}`).join(' · '));
  const dist = (k) => { const m = {}; for (const r of R) m[r.lazos[k]] = (m[r.lazos[k]] || 0) + 1; return Object.keys(m).sort((a, b) => a - b).map((v) => `${v}:${Math.round((100 * m[v]) / n)}%`).join(' '); };
  for (const q of H.LAZOS_TODOS) console.log(`  lazo ${q.padEnd(9)} ${dist(q)}`);
  console.log('lo que se vio:', `escenas ${Math.min(...R.map((r) => r.escenas))}-${Math.max(...R.map((r) => r.escenas))} de ${Object.keys(ESC).length}; optativas ${Math.min(...R.map((r) => r.optativas))}-${Math.max(...R.map((r) => r.optativas))} de ${O.OPTATIVAS.length}; lo raro ${Math.min(...R.map((r) => r.raros))}-${Math.max(...R.map((r) => r.raros))} de ${Object.keys(H.RAROS).length}`);
}

// Los logros internos propuestos: cada uno mira datos que YA se guardan en progreso.historia (o en el estado que arma estadoHistoria). `h` = progreso.historia.
export const LOGROS_HISTORIA = [
  { id: 'H_LLEGADA', nombre: 'Llegué con la llave', cumple: (h) => !!h.cerrados?.llave },
  { id: 'H_VERANO', nombre: 'Ya sos del valle', cumple: (h) => !!h.cerrados?.ramal },
  { id: 'H_OTONO', nombre: 'El molino muele', cumple: (h) => !!h.cerrados?.cuaderno },
  { id: 'H_INVIERNO', nombre: 'Lo que dice el cuaderno', cumple: (h) => !!h.cerrados?.nevada },
  { id: 'H_DEL_VALLE', nombre: 'Del valle', cumple: (h) => h.terminada > 0 },
  { id: 'H_TRATO', nombre: 'No hay que tenerles miedo ni confianza', cumple: (h) => h.terminada > 0 && h.duendes?.trato === 'trato' },
  { id: 'H_PELEA', nombre: 'La puerta entornada', cumple: (h) => h.terminada > 0 && h.duendes?.trato === 'pelea' },
  { id: 'H_CONVIDADO', nombre: 'Convidado', cumple: (h) => H.esConvidado(h) },
  { id: 'H_RAMAL', nombre: 'El silbato largo', cumple: (h) => h.terminada > 0 && H.estadoRamal(h) === 'salvado' },
  { id: 'H_NOCHE_UNA', nombre: 'Nevó y no cedió', cumple: (h) => h.duendes?.noche === 'ganada' && (h.noche?.intentos ?? h.duendes?.intentos ?? 1) <= 1 },
  { id: 'H_NOCHE_OTRA', nombre: 'Otra vez', cumple: (h) => h.duendes?.noche === 'ganada' && (h.noche?.intentos ?? h.duendes?.intentos ?? 1) >= 2 },
  { id: 'H_DEUDA', nombre: 'Palabra de molinero', cumple: (h) => h.duendes?.trato === 'trato' && (h.decisiones?.bolsa === 'b' || h.decisiones?.coihue === 'b') && h.duendes.deuda === 0 && !!h.escenas?.vistas?.['deuda-pagada'] },
  { id: 'H_PERDON', nombre: 'Pedir perdón', cumple: (h) => h.duendes?.trato === 'pelea' && h.duendes.perdon === true },
  { id: 'H_ARMAS', nombre: 'Arco y honda', cumple: (h) => !!h.duendes?.armas?.arco && !!h.duendes?.armas?.honda },
  { id: 'H_PRESTADO', nombre: 'Todo el valle prestó algo', cumple: (h) => H.PRESTADOS_NOCHE.every((k) => h.prestado?.[k] === true) },
  { id: 'H_CASA_1', nombre: 'De la casa', cumple: (h) => H.LAZOS_TODOS.some((q) => H.lazoDe(h, q) >= 3) },
  { id: 'H_CASA_5', nombre: 'La mesa larga', cumple: (h) => H.LAZOS_TODOS.filter((q) => H.lazoDe(h, q) >= 3).length >= 5 },
  { id: 'H_CASA_TODOS', nombre: 'Todo el valle en tu mesa', oculto: true, cumple: (h) => H.LAZOS_TODOS.every((q) => H.lazoDe(h, q) >= 3) },
  { id: 'H_RARO_25', nombre: 'Un zorro con gorro', cumple: (h) => (h.raro || []).length >= 25 },
  { id: 'H_RARO_60', nombre: 'Cuaderno de lo raro', cumple: (h) => (h.raro || []).length >= 60 },
  { id: 'H_OPT_10', nombre: 'De paso', cumple: (h) => Object.keys(h.optativas || {}).length >= 10 },
  { id: 'H_OPT_20', nombre: 'Lo que hiciste de paso', cumple: (h) => Object.keys(h.optativas || {}).length >= 20 },
  { id: 'H_MAJADA_FERMIN', nombre: 'No me la devuelvas flaca', cumple: (h) => h.decisiones?.majada === 'a' && h.terminada > 0 },
  { id: 'H_MAJADA_VENDIDA', nombre: 'Andá', oculto: true, cumple: (h) => h.decisiones?.majada === 'c' && h.terminada > 0 },
  { id: 'H_ARBOL_NOTABLE', nombre: 'Árbol notable', cumple: (h) => h.decisiones?.cuaderno === 'c' && h.terminada > 0 },
  { id: 'H_TALADO', nombre: 'Seis hachazos', oculto: true, cumple: (h) => h.decisiones?.coihue === 'b' && h.terminada > 0 },
];

function logros(arch) {
  const R = JSON.parse(fs.readFileSync(arch, 'utf8'));
  const n = R.length;
  // se rearma un `h` mínimo con lo que guardan las corridas (los datos que el juego ya guarda)
  const comoH = (r) => ({ terminada: r.fin ? 1 : 0, cerrados: Object.fromEntries(H.CAPITULOS.map((c, i) => [c.id, i < (r.fin ? 13 : 0) ? 1 : 0]).filter(([, v]) => v)), lazos: r.lazos, decisiones: r.dec, ramal: r.ramal, duendes: { trato: r.trato, noche: r.noche, intentos: r.intentos, convidado: r.convidado, deuda: r.deuda, perdon: r.perdon, armas: r.armas }, noche: { intentos: r.intentos }, prestado: r.prestado, raro: new Array(r.raros).fill(0), optativas: Object.fromEntries(r.optHechas.map((k) => [k, 1])), escenas: { vistas: Object.fromEntries(r.vistas.map((k) => [k, 1])) } });
  console.log(`${LOGROS_HISTORIA.length} logros propuestos; corridas: ${n} (jugador al azar, sin encargos del Relax)`);
  for (const l of LOGROS_HISTORIA) {
    const k = R.filter((r) => { try { return !!l.cumple(comoH(r)); } catch { return false; } }).length;
    console.log(`  ${l.id.padEnd(16)} ${l.nombre.padEnd(40)} ${String(Math.round((100 * k) / n)).padStart(3)} %${l.oculto ? '  (oculto)' : ''}`);
  }
}

function marcas() {
  const t = fs.readFileSync(new URL('../src/historia.js', import.meta.url), 'utf8').split('\n');
  const ini = t.findIndex((l) => l.startsWith('export const CAPITULOS = ['));
  const fin = t.findIndex((l, i) => i > ini && l.startsWith('];'));
  const HOME = { ramon: 'puesto-alto', ercilia: 'ramos', ema: 'seccional', fermin: 'galpon', tobias: 'cantera', belisario: 'puesto-paso', carpintero: 'carpinteria', panadera: 'panaderia', abuela: 'casa-herminia', nicanor: 'muelle', fotografa: 'estudio-fotos', tejedora: 'plaza', herrero: 'plaza', martin: 'plaza', apicultor: 'plaza', guarda: 'estacion' };
  let cap = null, total = 0, escena = 0, lugar = 0, npc = 0;
  for (let i = ini; i < fin; i++) {
    let m = /^    id: '(\w+)', titulo/.exec(t[i]); if (m) { cap = m[1]; continue; }
    m = /^\s*\{ id: '([^']+)', tecla: '(.)',/.exec(t[i]); if (!m) continue;
    total++;
    const e = (/escena\('([^']+)'\)/.exec(t[i]) || /escenas\.has\('([^']+)'\)/.exec(t[i]) || [])[1];
    if (!e) continue;
    escena++;
    const ds = Object.entries(D.DISPARADORES).filter(([k, d]) => (d.escena || k) === e);
    if (ds.some(([, d]) => d.lugar)) lugar++; else if (ds.some(([, d]) => d.clave && HOME[d.clave])) npc++;
  }
  console.log(`objetivos ${total}; con escena ${escena}; de ésos, con lugar en el disparador ${lugar} y con vecino de lugar conocido ${npc}`);
}

({ escenas, ventanas, ecos, lazos, corridas: () => corridas(process.argv[3]), logros: () => logros(process.argv[3]), marcas }[cmd] || (() => console.log('comando desconocido')))();
