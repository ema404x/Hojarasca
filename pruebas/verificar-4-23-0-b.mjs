// 4.23.0 (B): metas y logros de la Historia. Lo que se hizo, con comprobación de que antes fallaba (cada arreglo tiene su mutación: la misma prueba sobre una copia de src/
// con el arreglo deshecho tiene que fallar):
//   1. los logros de la Historia (25) entran por la misma lista que los del Relax (LOGROS_RELAX) y salen solos por `logrosParaSteam()` (sin tocar Steam); sólo piden lo posible
//      (Tobías y Tito se excluyen por la D2: 12 de 13 como mucho; 29 de 34 optativas como mucho), lo que adelantaría la historia va oculto, nada se dispara en la primera hora,
//      y lo que se saltó con el código `historia capitulo N` / `historia completar` no cuenta (marca `trucos.historia`)
//   2. el panel de logros los muestra bajo su título
//   3. los contadores de la guía (lo raro, de paso, vecinos de la casa, escenas vividas) con los topes posibles
//   4. el cuaderno «Lo vivido» con las 126 reseñas de escena (por capítulo, con el día, sin spoilers)
//   5. el tono de todo lo nuevo (castellano, sin números de lazo, nada religioso, nada sensual explícito)
// Las mutaciones corren cada una en su proceso sobre una copia de src/ (el caché de ESM engaña si no).
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { H, O, ESC, imp, jugar } from './ayuda-4-18-4-historia.mjs';

const LH = await imp('logros-historia.js'), LR = await imp('logros-relax.js'), ST = await imp('steam.js'), DL = await imp('desafio-logros.js');
const ME = await imp('historia-metas.js'), VI = await imp('historia-vivido.js'), NO = await imp('historia-noche.js');
const TR = await imp('trucos.js'), GU = await imp('guardado.js');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4184_SRC || join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
const HIJO = !!process.env.A4184_SRC;
const SEC = process.env.A4230_SECCIONES ? new Set(process.env.A4230_SECCIONES.split(',')) : null;
const va = (s) => !SEC || SEC.has(s);
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!process.env.A4230_CALLADO) console.log('FALLA ' + t); } };

const IDS_HISTORIA = LH.LOGROS_HISTORIA.map((l) => l.id);
const OCULTOS = ['historia-nevada', 'historia-trato', 'historia-pelea', 'historia-convidado', 'historia-ramal', 'historia-noche-una', 'historia-noche-otra', 'historia-deuda', 'historia-perdon', 'historia-armas', 'historia-prestado', 'historia-majada-fermin', 'historia-majada-vendida', 'historia-arbol-notable', 'historia-talado'];
const VISIBLES = ['historia-verano', 'historia-otono', 'historia-del-valle', 'historia-casa-1', 'historia-casa-5', 'historia-casa-8', 'historia-raro-25', 'historia-raro-60', 'historia-opt-10', 'historia-opt-20'];
const logro = (id) => LH.LOGROS_HISTORIA.find((l) => l.id === id);
const cumple = (id, h) => !!logro(id).cumple({ historia: h });
const cerrar = (h, ...ids) => { for (const id of ids) h.cerrados[id] = 5; return h; };
const casa = (h, ...quienes) => { for (const q of quienes) h.lazos[q] = 3; return h; };
const nuevaH = () => H.historiaNueva();

// ---------------------------------------------------------------- 1. los logros
if (va('logros')) {
  ok(IDS_HISTORIA.length === 25, `son 25 logros de la Historia: ${IDS_HISTORIA.length}`);
  ok(new Set(IDS_HISTORIA).size === 25, 'sin ids repetidos');
  ok(IDS_HISTORIA.every((id) => /^historia-[a-z0-9-]+$/.test(id)), 'ids en minúscula, sin ñ ni tildes, con el prefijo historia-');
  ok(VISIBLES.concat(OCULTOS).sort().join() === IDS_HISTORIA.slice().sort().join(), 'la lista de la prueba es la del juego (10 a la vista y 15 ocultos)');
  for (const l of LH.LOGROS_HISTORIA) {
    ok(typeof l.nombre === 'string' && l.nombre.length >= 3 && l.nombre.length <= 40, `${l.id}: nombre corto`);
    ok(typeof l.texto === 'string' && l.texto.length >= 20 && l.texto.length <= 140, `${l.id}: texto de 20 a 140 caracteres (${l.texto.length})`);
    ok(l.grupo === LH.GRUPO_HISTORIA && l.historia === true, `${l.id}: lleva su grupo y la marca historia`);
    ok(typeof l.cumple === 'function' && l.cumple({}) === false && l.cumple(undefined) === false && l.cumple({ historia: null }) === false, `${l.id}: sin historia no se cumple (ni rompe con datos raros)`);
    ok(!!l.oculto === OCULTOS.includes(l.id), `${l.id}: oculto sólo lo que adelantaría la historia`);
  }
  // entran por la misma lista que los del Relax y salen solos a Steam (Steam no se toca)
  ok(LR.LOGROS_RELAX.length === 16 + 25 && IDS_HISTORIA.every((id) => LR.LOGROS_RELAX.some((l) => l.id === id)), 'LOGROS_RELAX trae los 16 de siempre y los 25 de la Historia');
  ok(LR.LOGROS_RELAX.slice(0, 16).every((l) => !l.historia) && LR.LOGROS_RELAX.slice(16).every((l) => l.historia), 'los de la Historia van al final');
  const api = ST.logrosParaSteam().filter((l) => l.api.startsWith('RELAX_HISTORIA_'));
  ok(api.length === 25 && new Set(api.map((l) => l.api)).size === 25 && api.every((l) => /^RELAX_HISTORIA_[A-Z0-9_]+$/.test(l.api)), 'logrosParaSteam() ya los trae, con nombres de API únicos');
  ok(ST.logrosParaSteam().length === 16 + 25 + 18, 'y siguen los 16 del Relax y los 18 del Desafío');
  ok(!/historia/i.test(leer('steam.js')), 'steam.js no se tocó ni se preparó nada de Steam acá');
  // el almacén los guarda y los revisa como a los otros
  { const alm = new Map();
    const al = { getItem: (k) => (alm.has(k) ? alm.get(k) : null), setItem: (k, v) => alm.set(k, v) };
    const lib = LR.crearLogrosRelax(al, 'k', () => '2026-11-03T10:00:00.000Z');
    ok(lib.progreso().total === 41 && lib.progreso().hechos === 0, 'la libreta cuenta 41');
    const h = cerrar(nuevaH(), 'ramal');
    ok(lib.revisar({ historia: h }).map((l) => l.id).join() === 'historia-verano', 'revisar() desbloquea el del acto I y sólo ése');
    ok(lib.revisar({ historia: h }).length === 0 && lib.tiene('historia-verano'), 'no se desbloquea dos veces');
    ok(JSON.parse(alm.get('k')).logros['historia-verano'], 'queda guardado');
    ok(LR.sanearLogrosRelax({ logros: { 'historia-verano': '2026-11-03T10:00:00.000Z', 'historia-inventado': '2026-11-03T10:00:00.000Z' } }).logros['historia-verano'] !== undefined, 'el saneo conoce los nuevos');
    ok(LR.sanearLogrosRelax({ logros: { 'historia-inventado': '2026-11-03T10:00:00.000Z' } }).logros['historia-inventado'] === undefined, 'y descarta los inventados');
  }
  // cada uno, con su dato mínimo (y sin él)
  ok(!cumple('historia-verano', nuevaH()) && cumple('historia-verano', cerrar(nuevaH(), 'ramal')) && !cumple('historia-verano', cerrar(nuevaH(), 'llave', 'bolsa', 'mesa')), 'acto I: el cierre del capítulo 4, no antes');
  ok(!cumple('historia-otono', cerrar(nuevaH(), 'ramal')) && cumple('historia-otono', cerrar(nuevaH(), 'cuaderno')), 'acto II: el cierre del capítulo 8');
  ok(!cumple('historia-nevada', cerrar(nuevaH(), 'arco')) && cumple('historia-nevada', cerrar(nuevaH(), 'nevada')), 'la nevada: el cierre del capítulo 12');
  { const h = nuevaH(); ok(!cumple('historia-del-valle', h), 'sin terminar no es del valle'); h.terminada = 40; ok(cumple('historia-del-valle', h), 'terminada sí'); }
  { const h = nuevaH(); h.version = 1; h.terminada = 40; h.cerrados.ramal = 3; ok(IDS_HISTORIA.every((id) => !cumple(id, h)), 'una historia de la versión vieja (de ocho capítulos) no cuenta'); delete h.version; ok(IDS_HISTORIA.every((id) => !cumple(id, h)), 'ni una sin versión'); }
  for (const [id, cuantos] of [['historia-casa-1', 1], ['historia-casa-5', 5], ['historia-casa-8', 8]]) {
    const quienes = H.LAZOS_TODOS.filter((q) => q !== 'tobias');
    ok(!cumple(id, casa(nuevaH(), ...quienes.slice(0, cuantos - 1))) && cumple(id, casa(nuevaH(), ...quienes.slice(0, cuantos))), `${id}: se cumple con ${cuantos} de la casa y no con ${cuantos - 1}`);
    const h = nuevaH(); for (const q of quienes.slice(0, cuantos)) h.lazos[q] = 2; ok(!cumple(id, h), `${id}: la confianza a secas (lazo 2) no alcanza`);
  }
  for (const [id, cuantos] of [['historia-raro-25', 25], ['historia-raro-60', 60]]) {
    const ids = Object.keys(H.RAROS);
    const h = nuevaH(); h.raro = ids.slice(0, cuantos - 1).map((x) => ({ id: x, dia: 2 })); ok(!cumple(id, h), `${id}: con ${cuantos - 1} no`);
    h.raro.push({ id: ids[cuantos - 1], dia: 2 }); ok(cumple(id, h), `${id}: con ${cuantos} sí`);
  }
  for (const [id, cuantos] of [['historia-opt-10', 10], ['historia-opt-20', 20]]) {
    const h = nuevaH(); for (let i = 0; i < cuantos - 1; i++) h.optativas['x' + i] = 3; ok(!cumple(id, h), `${id}: con ${cuantos - 1} no`);
    h.optativas['x' + cuantos] = 3; ok(cumple(id, h), `${id}: con ${cuantos} sí`);
  }
  // el final y las decisiones piden haber terminado
  for (const [id, cambiar] of [
    ['historia-trato', (h) => { h.duendes.trato = 'trato'; }], ['historia-pelea', (h) => { h.duendes.trato = 'pelea'; }],
    ['historia-ramal', (h) => { h.ramal = H.RAMAL_SALVADO; }],
    ['historia-majada-fermin', (h) => { h.decisiones.majada = 'a'; }], ['historia-majada-vendida', (h) => { h.decisiones.majada = 'c'; }],
    ['historia-arbol-notable', (h) => { h.decisiones.cuaderno = 'c'; }], ['historia-talado', (h) => { h.decisiones.coihue = 'b'; }],
  ]) {
    const h = nuevaH(); cambiar(h);
    ok(!cumple(id, h), `${id}: sin haber terminado no se cumple`);
    h.terminada = 60; ok(cumple(id, h), `${id}: terminada, sí`);
    const otra = nuevaH(); otra.terminada = 60; ok(!cumple(id, otra), `${id}: terminada pero sin ese camino, no`);
  }
  { const h = nuevaH(); h.terminada = 60; h.duendes.trato = 'trato'; h.ramal = H.RAMAL_A_PRUEBA; ok(!cumple('historia-ramal', h), 'el ramal «a prueba» no es salvado'); }
  { const h = nuevaH(); h.terminada = 60; h.duendes.trato = 'pelea'; ok(!cumple('historia-trato', h) && cumple('historia-pelea', h), 'trato y pelea son excluyentes'); }
  { const h = nuevaH(); ok(!cumple('historia-convidado', h), 'sin convites no'); h.decisiones.bolsa = 'a'; ok(!cumple('historia-convidado', h), 'con un convite no'); h.decisiones.molienda = 'c'; ok(cumple('historia-convidado', h), 'con dos convites sí'); }
  // la noche: al primer intento o después de perder (la cuenta de intentos puede estar en la noche o en los duendes: manda la mayor)
  { const h = nuevaH(); h.duendes.noche = 'ganada'; h.noche.intentos = 1; ok(cumple('historia-noche-una', h) && !cumple('historia-noche-otra', h), 'ganada al primer intento: una');
    h.noche.intentos = 2; ok(!cumple('historia-noche-una', h) && cumple('historia-noche-otra', h), 'ganada al segundo: otra (intentos de la noche)');
    h.noche.intentos = 0; h.duendes.intentos = 3; ok(!cumple('historia-noche-una', h) && cumple('historia-noche-otra', h), 'ganada al tercero: otra (intentos de los duendes)');
    h.duendes.noche = 'perdida'; ok(!cumple('historia-noche-una', h) && !cumple('historia-noche-otra', h), 'una noche perdida no da ninguno');
    h.duendes.noche = 'pendiente'; h.noche.intentos = 1; ok(!cumple('historia-noche-una', h), 'una noche que no se ganó todavía no da ninguno'); }
  { // con las funciones del juego: perder y ganar, y ganar de una
    const h1 = nuevaH(); H.hacerTrato(h1, 'trato'); NO.empezarIntento(h1, 20); NO.cerrarIntento(h1, true);
    ok(h1.duendes.noche === 'ganada' && cumple('historia-noche-una', h1) && !cumple('historia-noche-otra', h1), 'la noche jugada de verdad (ganada de una): «Nevó y no cedió»');
    const h2 = nuevaH(); H.hacerTrato(h2, 'trato'); NO.empezarIntento(h2, 20); NO.cerrarIntento(h2, false); NO.empezarIntento(h2, 20); NO.cerrarIntento(h2, true);
    ok(h2.duendes.noche === 'ganada' && !cumple('historia-noche-una', h2) && cumple('historia-noche-otra', h2), 'perder y ganar con las funciones del juego: «Otra vez»');
    const h3 = nuevaH(); NO.empezarIntento(h3, 20); NO.cerrarIntento(h3, false); NO.dejarPerdida(h3);
    ok(!cumple('historia-noche-una', h3) && !cumple('historia-noche-otra', h3), 'dejar la noche perdida («que amanezca») no da ninguno'); }
  { const h = nuevaH(); h.duendes.trato = 'trato'; h.decisiones.bolsa = 'b'; h.duendes.deuda = 1; ok(!cumple('historia-deuda', h), 'con la deuda sin pagar no');
    h.duendes.deuda = 0; ok(!cumple('historia-deuda', h), 'sin la escena de pagar no (la deuda en cero de entrada no es pagarla)');
    h.escenas.vistas['deuda-pagada'] = 40; ok(cumple('historia-deuda', h), 'pagada en la raíz sí');
    h.duendes.trato = 'pelea'; ok(!cumple('historia-deuda', h), 'y sólo con el trato');
    const sin = nuevaH(); sin.duendes.trato = 'trato'; sin.escenas.vistas['deuda-pagada'] = 40; ok(!cumple('historia-deuda', sin), 'sin deuda (D1 y D2 por otro lado) no hay nada que pagar');
    const real = nuevaH(); real.decisiones.coihue = 'b'; H.alDecidirDuendes(real, 'a'); ok(real.duendes.deuda === 1, 'la deuda de verdad empieza en 1'); H.pagarDeuda(real); real.escenas.vistas['deuda-pagada'] = 40; ok(cumple('historia-deuda', real), 'con las funciones del juego: pagada'); }
  { const h = nuevaH(); h.duendes.trato = 'pelea'; ok(!cumple('historia-perdon', h), 'sin perdón no'); h.duendes.perdon = true; ok(cumple('historia-perdon', h), 'con perdón sí'); h.duendes.trato = 'trato'; ok(!cumple('historia-perdon', h), 'el perdón es de la pelea'); }
  { const h = nuevaH(); h.capitulo = H.CAPITULOS.findIndex((c) => c.id === 'arco'); H.ganarArma(h, 'arco'); ok(!cumple('historia-armas', h), 'sólo el arco no');
    H.ganarArma(h, 'honda'); ok(cumple('historia-armas', h), 'el arco y la honda sí');
    h.capitulo = 3; ok(!cumple('historia-armas', h), 'antes del capítulo 11 una práctica suelta no cuenta (no se gana en la primera hora)'); h.terminada = 5; ok(cumple('historia-armas', h), 'terminada la historia ya vale'); }
  { const h = nuevaH(); for (const k of H.PRESTADOS_NOCHE.slice(0, 3)) h.prestado[k] = true; ok(!cumple('historia-prestado', h), 'tres prestados no'); h.prestado[H.PRESTADOS_NOCHE[3]] = true; ok(cumple('historia-prestado', h), 'los cuatro sí');
    const t = nuevaH(); t.prestado.tobias = true; t.prestado.zaino = true; ok(!cumple('historia-prestado', t), 'Tobías y el zaino no son de la noche'); }
  // el primero no está en el capítulo 1
  { const h = nuevaH(); cerrar(h, 'llave', 'bolsa', 'mesa'); ok(IDS_HISTORIA.every((id) => !cumple(id, h)), 'con los tres primeros capítulos cerrados no se cumple ninguno (el primero llega al cerrar el acto I)'); }
  ok(IDS_HISTORIA.every((id) => !cumple(id, nuevaH())), 'una historia nueva no cumple ninguno');
  // las metas son posibles: 12 de 13 y 8 es menos
  ok(LH.MAXIMO_CASA === H.LAZOS_TODOS.length - 1 && LH.MAXIMO_CASA === 12, 'la casa: 12 de 13 como mucho');
  ok(H.LAZOS_TODOS.length === 13, 'los vecinos con lazo son 13');
  ok(8 <= LH.MAXIMO_CASA && 5 <= 8 && 1 <= 5, 'las metas de vecinos (1, 5, 8) entran en lo posible');
  // Tobías y Tito se excluyen por la D2 (por las decisiones, que es de donde sale el lazo)
  { const o = H.DEFINICION_DECISIONES.coihue.opciones; const l = (v, q) => o.find((x) => x.id === v).lazos[q] || 0;
    ok(l('c', 'tobias') === 2 && l('a', 'tobias') === 0 && l('b', 'tobias') === 0, 'Tobías sólo recibe lazo de la D2 con la pirca (C)');
    ok(l('b', 'tito') === 2 && l('a', 'tito') === 0 && l('c', 'tito') === 0, 'Tito sólo recibe lazo de la D2 con el talado (B)'); }
}

// ---------------------------------------------------------------- 1b. lo saltado con el código no cuenta
if (va('trucos')) {
  const nuevoMundo = () => {
    const p = GU.progresoNuevo();
    const aj = { estacion: 'verano', clima: 'variable', duracion: 30, relaxTipo: 'libre' };
    const js = { pos: { x: 10, y: 3, z: 20 }, yaw: 0 };
    return { p, aj, m: { desafio: false, progreso: () => p, ajustes: () => aj, jugador: () => js, reloj: { congelado: false }, limite: 468, lugares: () => [], ir() {}, depositos: () => [], rehacerObra() {}, alCambiarClima() {}, alCambiarEstacion() {}, refrescar() {}, guardar() {}, limpiar() {}, salir() {} } };
  };
  const logrosDe = (p) => LR.nuevosLogros(TR.vistaParaLogros(p), () => false).filter((id) => id.startsWith('historia-'));
  { const w = nuevoMundo(); const r = TR.ejecutar('historia capitulo 6', w.m);
    ok(r.ok && w.p.trucos?.historia === true, '«historia capitulo 6» deja la marca en la partida');
    w.p.historia.cerrados.ramal = 4; w.p.historia.cerrados.cuaderno = 9; w.p.historia.terminada = 20;
    ok(TR.vistaParaLogros(w.p).historia === undefined && w.p.historia !== undefined, 'los logros no ven la historia (y la partida sigue intacta)');
    ok(logrosDe(w.p).length === 0, 'saltar capítulos con el código no desbloquea ningún logro de la Historia'); }
  { const w = nuevoMundo(); TR.ejecutar('historia completar', w.m);
    ok(w.p.trucos?.historia === true && w.p.historia.terminada > 0 && logrosDe(w.p).length === 0, '«historia completar» tampoco desbloquea nada'); }
  { const w = nuevoMundo(); TR.ejecutar('historia capitulo 6', w.m); TR.ejecutar('historia completar', w.m);
    TR.ejecutar('historia reiniciar', w.m);
    ok(w.p.trucos?.historia === undefined, '«historia reiniciar» saca la marca: la historia vuelve a empezar de verdad');
    w.p.historia.cerrados.ramal = 4; ok(logrosDe(w.p).join() === 'historia-verano', 'y los logros vuelven a contar lo que se juegue desde ahí'); }
  { const w = nuevoMundo(); w.p.historia = nuevaH(); w.p.historia.cerrados.ramal = 4; ok(logrosDe(w.p).join() === 'historia-verano', 'una historia jugada de verdad sí cuenta');
    const v = TR.vistaParaLogros(w.p); ok(v === w.p, 'sin códigos no hay copia (es la misma partida)'); }
  { { const w = nuevoMundo(); w.p.entradas = { a: { dia: 1 }, b: { dia: 1 } }; w.p.trucos = { entradas: ['a'], historia: true }; w.p.historia = nuevaH();
    const v = TR.vistaParaLogros(w.p); ok(!('a' in v.entradas) && 'b' in v.entradas && v.historia === undefined, 'las anotaciones del código y la historia saltada se sacan juntas'); } }
  ok(JSON.stringify(TR.sanearMarcaTrucos({ historia: true })) === '{"historia":true}', 'el saneo guarda la marca de la historia');
  ok(TR.sanearMarcaTrucos({ historia: 'si' }) === undefined && TR.sanearMarcaTrucos({ historia: false }) === undefined && TR.sanearMarcaTrucos({}) === undefined, 'y sólo si es verdadera (nada de basura)');
  ok(TR.sanearMarcaTrucos({ entradas: ['inexistente'], historia: true }).entradas === undefined, 'sin romper el saneo de las anotaciones');
  ok(/sanearMarcaTrucos\(p\.trucos\)/.test(leer('guardado.js')), 'el guardado pasa por ese saneo');
}

// ---------------------------------------------------------------- 2. el panel de logros
const nodo = (tag) => ({ tag, className: '', textContent: '', children: [], attrs: {}, listeners: {}, appendChild(c) { this.children.push(c); return c; }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { this.listeners[t] = f; } });
const el = (tag, clase, texto) => { const x = nodo(tag); if (clase) x.className = clase; if (texto !== undefined) x.textContent = texto; return x; };
const textoDe = (x) => [x.textContent || '', ...(x.children || []).map(textoDe)].join('\n');
if (va('panel')) {
  const alm = new Map();
  const lib = LR.crearLogrosRelax({ getItem: (k) => (alm.has(k) ? alm.get(k) : null), setItem: (k, v) => alm.set(k, v) }, 'k', () => '2026-11-03T10:00:00.000Z');
  lib.revisar({ historia: cerrar(nuevaH(), 'ramal') });
  const cont = { ownerDocument: { createElement: nodo }, textContent: '', children: [], appendChild(c) { this.children.push(c); return c; } };
  DL.dibujarLogros(cont, lib, 'normal');
  const ul = cont.children.find((c) => c.className === 'logro-lista');
  const grupos = ul.children.filter((c) => c.className === 'logro-grupo');
  ok(ul.children.length === 41 + 1 && grupos.length === 1 && grupos[0].textContent === 'La historia del valle', 'el panel: 41 logros y un solo título para los de la Historia');
  ok(ul.children.indexOf(grupos[0]) === 16 && ul.children.slice(0, 16).every((c) => /^logro-item/.test(c.className)), 'el título va después de los 16 del Relax');
  const txt = textoDe(ul);
  ok(txt.includes('Ya sos del valle') && txt.includes('Terminá el primer acto'), 'el del acto I, ganado, se ve con su nombre');
  ok(!txt.includes('La puerta entornada') && !txt.includes('Hay que tener trato') && !txt.includes('Pedí perdón'), 'lo oculto sin ganar no se ve (ni el nombre ni la descripción)');
  ok(textoDe(cont.children[0]).includes('1 de 41 logros'), 'el contador dice 1 de 41');
  ok(ul.children.filter((c) => /logro-item/.test(c.className) && textoDe(c).includes('???')).length === 15 + 2, 'los 15 de la Historia y los 2 del Relax que son ocultos dicen «???»');
  // los del Desafío se dibujan como siempre (sin título)
  const desafio = { progreso: () => ({ hechos: 0, total: 1 }), todos: () => [{ id: 'x', nombre: 'Uno', texto: 'El primero', oculto: false, desbloqueado: false, fecha: null }] };
  const c2 = { ownerDocument: { createElement: nodo }, textContent: '', children: [], appendChild(c) { this.children.push(c); return c; } };
  DL.dibujarLogros(c2, desafio, 'normal');
  ok(c2.children.find((c) => c.className === 'logro-lista').children.length === 1, 'sin `grupo` no se agrega ningún título');
  ok(/\.logro-grupo \{[^}]*grid-column: 1 \/ -1/.test(DL.CSS_LOGROS), 'el título ocupa todo el ancho de la grilla (se lee en 1366x768 y 1024x600)');
}

// ---------------------------------------------------------------- 3. los contadores de la guía
function hMeta(opc = {}) {
  const h = nuevaH();
  h.empezada = 2;
  h.raro = (opc.raros || []).map((x) => ({ id: x, dia: 2 }));
  for (const k of opc.opt || []) h.optativas[k] = 3;
  for (const q of opc.casa || []) h.lazos[q] = 3;
  for (const e of opc.vistas || []) h.escenas.vistas[e] = 2;
  return h;
}
if (va('metas')) {
  const m0 = ME.metasHistoria(nuevaH());
  ok(m0.raro.total === Object.keys(H.RAROS).length && m0.raro.total >= 117, `lo raro: el total sale de los indicios que hay (${m0.raro.total})`);
  ok(m0.optativas.total === O.OPTATIVAS.length && m0.optativas.total === 34, `de paso: 34 optativas (${m0.optativas.total})`);
  ok(m0.escenas.total === VI.TOTAL_ESCENAS && m0.escenas.total === Object.keys(ESC).length && m0.escenas.total === 126, `escenas: las 126 de la historia (${m0.escenas.total})`);
  ok(m0.casa.max === 12 && m0.optativas.max === 29, 'los topes que se muestran son los posibles: 12 de la casa y 29 de paso');
  const raros = Object.keys(H.RAROS).slice(0, 7);
  const m = ME.metasHistoria(hMeta({ raros, opt: ['oveja', 'truchas', 'noventa'], casa: ['ramon', 'ema', 'sofia'], vistas: ['nota-eusebio', 'llegada-estacion', 'escena-que-no-existe'] }));
  ok(m.raro.n === 7 && m.optativas.n === 3 && m.casa.n === 3, 'los contadores cuentan lo que hay');
  ok(m.escenas.n === Object.keys(ESC).filter((k) => ['nota-eusebio', 'llegada-estacion'].includes(k)).length, 'las escenas vividas cuentan sólo las que existen');
  { const h = hMeta({ opt: ['oveja', 'fantasma'] }); h.raro = [{ id: 'no-existe', dia: 1 }, { id: raros[0], dia: 1 }]; const mm = ME.metasHistoria(h);
    ok(mm.optativas.n === 1 && mm.raro.n === 1, 'una optativa o un indicio que ya no existe no se cuenta'); }
  const lineas = ME.lineasMetas(hMeta({ raros, opt: ['oveja'], casa: ['ramon'] }));
  ok(lineas.length === 4, 'son cuatro líneas');
  ok(lineas[0] === `Lo raro: 7 de ${m0.raro.total}` && lineas[1] === 'De paso: 1 de 34 (en una misma partida entran hasta 29)' && lineas[2] === 'Vecinos de la casa: 1 (hasta 12 en una misma partida)' && lineas[3] === 'Escenas vividas: 0 de 126', 'las líneas, tal cual');
  ok(lineas.every((l) => !/lazo|confianza|[+-]\d/i.test(l)), 'ninguna línea muestra un número de lazo');
  // los topes posibles de las optativas se comprueban con las condiciones reales (`ofrece`): el mejor camino, con pareja y cumpleaños, ofrece 31; sin ellas, 29
  { const TODO = { has: (k) => k !== 'noche-espera' };
    const mejor = (amor, cumple) => {
      let max = 0, minimo = 99;
      for (const bolsa of 'abc') for (const coihue of 'abc') for (const majada of 'abc') for (const trato of ['trato', 'pelea']) for (const cuaderno of 'abc') {
        const s = new Proxy({ escenas: TODO, temas: { has: () => true }, objetos: { has: () => true }, pobladores: { has: () => true }, terminadas: { has: () => true },
          decisiones: { bolsa, coihue, majada, cuaderno, molienda: 'a', duendes: 'a' }, trato, amor, cumple: cumple ? { quien: 'ercilia' } : null, llave79: true, aceptados: 9, regaloTorta: 'x', regaloRamon: 'x', tablas: 99, cintaDulce: true, puestoFeria: true, perdon: false }, { get: (t, k) => (k in t ? t[k] : true) });
        const lista = O.OPTATIVAS.filter((o) => { try { return o.ofrece ? !!o.ofrece(s, {}) : true; } catch { return true; } }).map((o) => o.id);
        max = Math.max(max, lista.length); minimo = Math.min(minimo, lista.length);
        for (const [a, b] of ME.OPTATIVAS_EXCLUYENTES) ok(!(lista.includes(a) && lista.includes(b)), `${a} y ${b} no se ofrecen juntas (${bolsa}${coihue}${majada}${trato}${cuaderno})`);
      }
      return max;
    };
    ok(mejor(true, true) === 31, 'con pareja y cumpleaños, el mejor camino ofrece 31 de 34');
    ok(mejor(false, false) === ME.maximoOptativas() && ME.maximoOptativas() === 29, 'sin ellas, 29: el tope que dice la guía');
    ok(ME.OPTATIVAS_DE_AZAR.every((id) => O.OPTATIVAS.some((o) => o.id === id)) && ME.OPTATIVAS_EXCLUYENTES.flat().every((id) => O.OPTATIVAS.some((o) => o.id === id)), 'todas las optativas que nombra el cálculo existen');
  }
  // y están en la guía
  { const ui = leer('historia-ui.js');
    ok(/import \{ lineasMetas \} from '\.\/historia-metas\.js';/.test(ui), 'historia-ui: importa los contadores');
    ok(/\(h\.empezada \? `<ul class="metas">\$\{lineasMetas\(h\)\.map/.test(ui), 'la guía los dibuja sólo con la historia empezada');
    ok(/\.valle-guia ul\.metas \{[^}]*list-style: none/.test(ui) && /\.valle-guia ul\.metas li/.test(ui), 'tienen su estilo (una línea cada uno, chicos como el resto de la caja)'); }
}

// ---------------------------------------------------------------- 4. «Lo vivido»
const mini = () => {
  const lista = el('div', 'pagina'), ficha = el('div', 'pagina');
  return { lista, ficha, todo: () => textoDe(lista) + '\n' + textoDe(ficha) };
};
if (va('vivido')) {
  const todas = Object.values(ESC);
  ok(todas.length === 126 && todas.every((e) => typeof e.resumen === 'string' && e.resumen.length >= 40 && e.resumen.length <= 400), 'las 126 escenas traen su reseña (de 40 a 400 caracteres)');
  ok(VI.TOTAL_ESCENAS === 126 && Object.keys(VI.ESCENAS_HISTORIA).length === 126, 'el cuaderno conoce las 126');
  ok(VI.escenasVividas(nuevaH()).length === 0 && VI.capitulosVividos(nuevaH()).length === 0, 'sin escenas vistas no hay nada');
  ok(VI.escenasVividas(null).length === 0 && VI.escenasVividas({ escenas: { vistas: [] } }).length === 0 && VI.escenasVividas({ escenas: { vistas: 'x' } }).length === 0, 'un guardado raro no rompe');
  ok(!VI.hayVivido(nuevaH()) && VI.hayVivido({ empezada: 3 }) && VI.hayVivido({ escenas: { vistas: { x: 1 } } }) && !VI.hayVivido(undefined) && !VI.hayVivido(null), 'la pestaña aparece con la historia empezada o con alguna escena vista');
  // orden por capítulo, día y vista; lo que no existe se descarta
  const por = (cap) => todas.filter((e) => e.capitulo === cap).map((e) => e.id);
  { const h = nuevaH(); const c1 = por(1), c3 = por(3);
    h.escenas.vistas[c3[0]] = 9; h.escenas.vistas[c1[1]] = 4; h.escenas.vistas[c1[0]] = 4; h.escenas.vistas['no-existe'] = 2; h.escenas.vistas[c1[2]] = 2;
    const v = VI.escenasVividas(h);
    ok(v.map((x) => x.id).join() === [c1[2], c1[1], c1[0], c3[0]].join(), 'orden: capítulo, después día y, a igual día, el orden en que se vieron');
    ok(v.every((x) => x.resumen && x.titulo && x.dia >= 1), 'cada una trae título, día y reseña');
    ok(v[0].resumen === ESC[c1[2]].resumen && v[0].dia === 2 && v[0].titulo === ESC[c1[2]].titulo, 'y son las del guion, tal cual');
    const g = VI.capitulosVividos(h);
    ok(g.length === 2 && g[0].numero === 1 && g[0].escenas.length === 3 && g[1].numero === 3 && g[1].id === H.CAPITULOS[2].id && g[1].titulo === H.CAPITULOS[2].titulo, 'agrupadas por capítulo (sólo los que tienen alguna)'); }
  // sin spoilers: el título de un capítulo que no tocaste no aparece, ni las reseñas de lo que no viste
  { const h = nuevaH(); const c1 = por(1); h.escenas.vistas[c1[0]] = 1; h.escenas.vistas[c1[1]] = 1;
    const p = mini(); VI.olvidarCapituloVivido(); VI.dibujarVivido(p.lista, p.ficha, el, h, () => {});
    const t = p.todo();
    ok(t.includes(ESC[c1[0]].resumen) && t.includes(ESC[c1[1]].resumen) && t.includes('Día 1 · ' + ESC[c1[0]].titulo), 'se ven las dos escenas vividas, con su día');
    ok(t.includes('2 de 126 escenas vividas'), 'y el avance dice 2 de 126');
    ok(H.CAPITULOS.slice(1).every((c) => !t.includes(c.titulo)), 'ningún título de un capítulo que no tocaste');
    ok(todas.filter((e) => !c1.slice(0, 2).includes(e.id)).every((e) => !t.includes(e.resumen) && !t.includes(e.titulo + '\n')), 'ni la reseña ni el título de una escena que no viste');
    ok(H.CAPITULOS[0].titulo && t.includes(H.CAPITULOS[0].titulo), 'sí el del capítulo 1'); }
  // vacío: dice que falta vivir, sin spoilers
  { const p = mini(); VI.dibujarVivido(p.lista, p.ficha, el, nuevaH(), () => {}); const t = p.todo();
    ok(t.includes(VI.TEXTO_VIVIDO_VACIO) && t.includes('0 de 126 escenas vividas'), 'vacío: lo dice');
    ok(H.CAPITULOS.every((c) => !t.includes(c.titulo)), 'y no nombra ningún capítulo'); }
  // elegir otro capítulo
  { const h = nuevaH(); const c1 = por(1), c2 = por(2); h.escenas.vistas[c1[0]] = 1; h.escenas.vistas[c2[0]] = 2;
    let redibujos = 0; VI.olvidarCapituloVivido();
    let p = mini(); VI.dibujarVivido(p.lista, p.ficha, el, h, () => { redibujos++; });
    ok(p.todo().includes(ESC[c2[0]].resumen) && !p.todo().includes(ESC[c1[0]].resumen), 'por defecto, el último capítulo vivido');
    const botones = (x) => (x.children || []).flatMap((c) => (c.tag === 'button' ? [c] : botones(c)));
    const bs = botones(p.lista); ok(bs.length === 2 && bs[1].attrs['aria-current'] === 'true' && bs[0].attrs['aria-current'] === undefined, 'dos botones y el elegido marcado');
    bs[0].listeners.click(); ok(redibujos === 1, 'elegir otro capítulo vuelve a dibujar el cuaderno');
    p = mini(); VI.dibujarVivido(p.lista, p.ficha, el, h, () => {});
    ok(p.todo().includes(ESC[c1[0]].resumen) && !p.todo().includes(ESC[c2[0]].resumen), 'y muestra el elegido');
    VI.olvidarCapituloVivido(); }
  // los textos de las dos páginas son del tono del cuaderno (se dibujan con las mismas clases que las otras pestañas)
  { const h = nuevaH(); h.escenas.vistas[por(1)[0]] = 1; const p = mini(); VI.dibujarVivido(p.lista, p.ficha, el, h, () => {});
    const clases = (x) => [x.className, ...(x.children || []).flatMap(clases)];
    ok(clases(p.lista).includes('progreso') && clases(p.lista).includes('lista') && clases(p.ficha).includes('anotado') && clases(p.ficha).includes('texto'), 'usa las clases del cuaderno (progreso, lista, anotado, texto)'); }
  // cableado en el cuaderno del juego
  { const main = leer('main.js');
    ok(/import \{ dibujarVivido, hayVivido \} from '\.\/historia-vivido\.js';/.test(main), 'main: importa el cuaderno «Lo vivido»');
    ok(/if \(!desafio && hayVivido\(progreso\.historia\)\) pestanas\.push\(\['vivido', 'Lo vivido'\]\);/.test(main), 'main: la pestaña sólo en el Relax y con historia');
    ok(/else if \(pestana === 'vivido'\) pestana = 'especies';/.test(main), 'main: sin historia la pestaña vuelve a «Especies»');
    ok(/if \(pestana === 'vivido' && !desafio\) \{ dibujarVivido\(lista, ficha, el, progreso\.historia, dibujarCuaderno\); return; \}/.test(main), 'main: dibuja las dos páginas'); }
}

// ---------------------------------------------------------------- 5. el tono de lo nuevo
if (va('tono')) {
  // (\b no entiende las tildes: «Andá» daba «and»; se usan los bordes de letra a mano)
  const pal = (alt, banderas = 'i') => new RegExp(`(?<![a-záéíóúüñ])(?:${alt})(?![a-záéíóúüñ])`, banderas);
  const religioso = pal('dios|diosa|santo|santa|santos|santuario|rez[aáo]r?|oraci[oó]n|milagro|[aá]ngel|virgen|bendici[oó]n|bendec\\w+|iglesia|capilla|cruz|crucifi\\w+|pecado|infierno|para[ií]so|gauchito|difunta|pachamama|biblia|cristo|jes[uú]s|rosario');
  const ingles = pal('the|and|you|your|with|achievement|unlock\\w*|story|valley|level|quest|game');
  const explicito = pal('sexo|sexual|desnud\\w+|beso en la boca|erótic\\w+|cama con');
  const lazo = pal('lazos?|confianza\\s*[+-]?\\d|[+-]\\d\\s*(?:de )?(?:lazo|confianza)');
  const nuevos = [
    ...LH.LOGROS_HISTORIA.flatMap((l) => [['logro ' + l.id + ' (nombre)', l.nombre], ['logro ' + l.id + ' (texto)', l.texto]]),
    ['grupo', LH.GRUPO_HISTORIA], ['vivido vacío', VI.TEXTO_VIVIDO_VACIO], ['vivido intro', VI.TEXTO_VIVIDO_INTRO],
    ...ME.lineasMetas(hMeta({ raros: Object.keys(H.RAROS).slice(0, 3) })).map((t, i) => ['contador ' + i, t]),
  ];
  for (const [donde, t] of nuevos) {
    ok(!religioso.test(t), `${donde}: nada religioso (${t})`);
    ok(!ingles.test(t), `${donde}: sin inglés (${t})`);
    ok(!explicito.test(t), `${donde}: nada sensual explícito`);
    ok(!lazo.test(t), `${donde}: sin números ni palabras de lazo en pantalla (${t})`);
    ok(/[a-záéíóúñ]/i.test(t) && !/\s{2,}/.test(t) && t === t.trim(), `${donde}: texto limpio`);
  }
  // el voseo (rioplatense) en las consignas
  for (const l of LH.LOGROS_HISTORIA) ok(/^(Terminá|Ganate|Que|Anotá|Hacé|Llegá|Pagá|Pedí|Perdé|Ganá|Dejá|Vendé|Talá)(?![a-záéíóúüñ])/.test(l.texto), `${l.id}: la consigna empieza con un verbo en voseo («${l.texto.split(' ')[0]}»)`);
  // las 126 reseñas que muestra «Lo vivido»: lo que ya estaba escrito también cuida el tono
  for (const e of Object.values(ESC)) {
    ok(!religioso.test(e.resumen) && !religioso.test(e.titulo), `reseña ${e.id}: nada religioso`);
    ok(!ingles.test(e.resumen), `reseña ${e.id}: sin inglés`);
    ok(!lazo.test(e.resumen), `reseña ${e.id}: sin números de lazo`);
  }
}

// ---------------------------------------------------------------- 6. partidas completas del jugador de mentira
if (va('corridas')) {
  const SEMILLAS = [1, 2, 3, 4, 6, 10, 11, 12];   // (4.24.0: la 5 pasó a la 6; con la charla nueva el jugador de mentira cae en el atasco conocido de la guardia, que no es del juego: con más pasos termina)
  const alcanzados = new Set(), primero = {};
  let casaMax = 0, optMax = 0;
  for (const semilla of SEMILLAS) {
    const vistos = new Set();
    const r = jugar(semilla, { alPaso: (h) => { for (const l of LH.LOGROS_HISTORIA) if (!vistos.has(l.id) && l.cumple({ historia: h })) { vistos.add(l.id); primero[l.id] = Math.min(primero[l.id] ?? 99, h.capitulo); } } });
    const h = r.S.hist();
    ok(r.fin === true && !r.atascado && !(r.errores || []).length, `semilla ${semilla}: los trece capítulos terminan sin atascos ni errores`);
    for (const l of LH.LOGROS_HISTORIA) if (l.cumple({ historia: h })) alcanzados.add(l.id);
    const dc = H.LAZOS_TODOS.filter((q) => H.lazoDe(h, q) >= 3);
    casaMax = Math.max(casaMax, dc.length);
    ok(!(dc.includes('tobias') && dc.includes('tito')), `semilla ${semilla}: Tobías y Tito no son de la casa a la vez`);
    const hechas = Object.keys(h.optativas || {});
    optMax = Math.max(optMax, hechas.length);
    for (const [a, b] of ME.OPTATIVAS_EXCLUYENTES) ok(!(hechas.includes(a) && hechas.includes(b)), `semilla ${semilla}: ${a} y ${b} no se hicieron las dos`);
    // los contadores y «Lo vivido» sobre una historia de verdad
    const m = ME.metasHistoria(h);
    ok(m.raro.n === (h.raro || []).length && m.raro.n <= m.raro.total, `semilla ${semilla}: lo raro cuenta lo anotado`);
    ok(m.optativas.n === hechas.filter((k) => O.OPTATIVAS.some((o) => o.id === k)).length && m.optativas.n <= m.optativas.max, `semilla ${semilla}: lo de paso no pasa de lo posible (${m.optativas.n} de ${m.optativas.max})`);
    ok(m.casa.n === dc.length && m.casa.n <= m.casa.max, `semilla ${semilla}: los de la casa no pasan de lo posible`);
    const vistas = Object.keys(h.escenas.vistas).filter((k) => ESC[k]);
    ok(m.escenas.n === vistas.length && vistas.length >= 29, `semilla ${semilla}: escenas vividas ${m.escenas.n} de ${m.escenas.total}`);
    const v = VI.escenasVividas(h);
    ok(v.length === vistas.length && new Set(v.map((x) => x.id)).size === v.length, `semilla ${semilla}: cada escena vista aparece una sola vez en «Lo vivido»`);
    ok(v.every((x, i) => i === 0 || v[i - 1].capitulo < x.capitulo || (v[i - 1].capitulo === x.capitulo && v[i - 1].dia <= x.dia)), `semilla ${semilla}: y en orden`);
    VI.olvidarCapituloVivido();
    for (const g of VI.capitulosVividos(h)) {
      const hh = { ...h }; // elegir ese capítulo con el botón
      const p = mini(); VI.dibujarVivido(p.lista, p.ficha, el, hh, () => {});
      const bs = []; const buscar = (x) => (x.children || []).forEach((c) => { if (c.tag === 'button') bs.push(c); buscar(c); }); buscar(p.lista);
      bs[VI.capitulosVividos(h).findIndex((x) => x.numero === g.numero)].listeners.click();
      const p2 = mini(); VI.dibujarVivido(p2.lista, p2.ficha, el, hh, () => {});
      const t = p2.todo();
      ok(g.escenas.every((e) => t.includes(e.resumen) && t.includes(`Día ${e.dia} · ${e.titulo}`)), `semilla ${semilla}, capítulo ${g.numero}: se leen las ${g.escenas.length} reseñas con su día`);
    }
    VI.olvidarCapituloVivido();
    // la tarjeta del panel de logros con la partida real
    ok(LR.nuevosLogros({ historia: h }, () => false).filter((id) => id.startsWith('historia-')).includes('historia-del-valle'), `semilla ${semilla}: terminar la historia da «Del valle»`);
  }
  const faltan = IDS_HISTORIA.filter((id) => !alcanzados.has(id));
  ok(faltan.join() === 'historia-noche-otra', `con ${SEMILLAS.length} partidas de mentira se alcanzan todos menos «Otra vez» (el jugador de mentira no cuenta intentos: se prueba con las funciones de la noche): faltan ${faltan.join() || 'ninguno'}`);
  ok(casaMax >= 8 && casaMax <= LH.MAXIMO_CASA, `la meta de ocho vecinos de la casa se alcanza en una partida (${casaMax}) y no pasa de lo posible`);
  ok(optMax >= 20 && optMax <= ME.maximoOptativas(), `la meta de veinte cosas de paso se alcanza (${optMax}) y no pasa de lo posible`);
  const antes = Object.entries(primero).filter(([id, c]) => c < 3 && id !== 'historia-armas');
  ok(antes.length === 0, `nada se cumple antes del capítulo 4 (primera hora): ${antes.map(([i, c]) => `${i}@${c + 1}`).join() || 'nada'}`);
  ok(primero['historia-verano'] === 4 && primero['historia-otono'] === 8, 'el acto I llega al empezar el capítulo 5 y el II al empezar el 9');
}

// ---------------------------------------------------------------- mutaciones (cada una en su proceso, sobre una copia de src/)
const MUT = [
  ['logros-historia.js', "Number(h.version) >= VERSION_HISTORIA ? h : null", "true ? h : null", 'una historia de la versión vieja cuenta para los logros', 'logros'],
  ['logros-historia.js', "cumple: con(cerrado('ramal')) }", "cumple: con(cerrado('llave')) }", 'el primer logro llega al cerrar el capítulo 1 (en la primera hora)', 'logros'],
  ['logros-historia.js', "cuantosDeLaCasa(h) >= 5) }", "cuantosDeLaCasa(h) >= 3) }", 'la mesa larga pide tres en vez de cinco', 'logros'],
  ['logros-historia.js', "cuantosDeLaCasa(h) >= 8) }", "cuantosDeLaCasa(h) >= LAZOS_TODOS.length) }", 'los ocho de la casa piden los trece (imposible)', 'logros'],
  ['logros-historia.js', "export const MAXIMO_CASA = LAZOS_TODOS.length - 1;", "export const MAXIMO_CASA = LAZOS_TODOS.length;", 'el tope de la casa vuelve a 13', 'logros,metas'],
  ['logros-historia.js', "const intentosDeNoche = (h) => Math.max(Number(obj(h.noche).intentos) || 0, Number(obj(h.duendes).intentos) || 0);", "const intentosDeNoche = (h) => Number(obj(h.duendes).intentos) || 0;", 'los intentos sólo se miran en los duendes', 'logros'],
  ['logros-historia.js', "obj(h.duendes).noche === 'ganada' && intentosDeNoche(h) <= 1)", "obj(h.duendes).noche === 'ganada' && intentosDeNoche(h) <= 9)", 'al primer intento vale con cualquier cantidad', 'logros'],
  ['logros-historia.js', "{ id: 'historia-pelea', nombre: 'La puerta entornada', texto: 'Terminá la historia después de la pelea.', oculto: true,", "{ id: 'historia-pelea', nombre: 'La puerta entornada', texto: 'Terminá la historia después de la pelea.',", 'el logro de la pelea deja de ser oculto (spoiler)', 'logros'],
  ['logros-historia.js', "con((h) => terminada(h) && obj(h.duendes).trato === 'trato') }", "con((h) => obj(h.duendes).trato === 'trato') }", 'el logro del trato se da sin terminar la historia', 'logros'],
  ['logros-historia.js', " && !!obj(obj(h.escenas).vistas)['deuda-pagada']) },", ") },", 'la deuda «se paga» sin pagarla', 'logros'],
  ['logros-historia.js', "cumple: con((h) => desde('arco')(h) && obj(obj(h.duendes).armas).arco === true", "cumple: con((h) => obj(obj(h.duendes).armas).arco === true", 'las armas valen desde cualquier capítulo', 'logros'],
  ['logros-historia.js', "{ id: 'historia-raro-25', nombre: 'Un zorro con gorro', texto: 'Anotá 25 cosas en el cuaderno de lo raro.', cumple: con((h) => cuantosRaros(h) >= 25) },", "{ id: 'historia-raro-25', nombre: 'Un zorro con gorro', texto: 'Anotá 25 cosas en el cuaderno de lo raro.', cumple: con((h) => cuantosRaros(h) >= 5) },", 'los 25 indicios piden cinco', 'logros'],
  ['logros-historia.js', "obj(h.decisiones).coihue === 'b' && terminada(h)) },", "obj(h.decisiones).coihue === 'c' && terminada(h)) },", 'el talado mira otra opción', 'logros'],
  ['logros-relax.js', "export const LOGROS_RELAX = [...LOGROS_RELAX_BASE, ...LOGROS_HISTORIA];", "export const LOGROS_RELAX = [...LOGROS_RELAX_BASE];", 'los logros de la Historia no entran en la lista del Relax', 'logros,panel'],
  ['trucos.js', "    marcarHistoria(p, true);   // 4.23.0 (B)\n    // 4.19.0: las decisiones", "    // 4.19.0: las decisiones", 'saltar de capítulo con el código no deja marca', 'trucos'],
  ['trucos.js', "    marcarHistoria(p, true);   // 4.23.0 (B)\n    const tomadas = tomarPorDefecto(h, n, dia);", "    const tomadas = tomarPorDefecto(h, n, dia);", 'completar con el código no deja marca', 'trucos'],
  ['trucos.js', "    marcarHistoria(p, false);   // 4.23.0 (B)\n", "", 'reiniciar la historia no saca la marca', 'trucos'],
  ['trucos.js', "  if (sinHistoria) r.historia = undefined;\n", "", 'los logros ven la historia aunque se haya saltado con el código', 'trucos'],
  ['trucos.js', "  if (v.historia === true) r.historia = true;", "  if (v.historia) r.historia = true;", 'el saneo guarda cualquier cosa como marca de la historia', 'trucos'],
  ['desafio-logros.js', "if (l.grupo && l.grupo !== grupoActual) { grupoActual = l.grupo; ul.appendChild(el('li', 'logro-grupo', l.grupo)); }", "", 'el panel no pone el título de la Historia', 'panel'],
  ['historia-vivido.js', "r.sort((a, b) => a.capitulo - b.capitulo || a.dia - b.dia || a.orden - b.orden);", "r.sort((a, b) => a.orden - b.orden);", 'Lo vivido sale en el orden en que se vieron las escenas', 'vivido'],
  ['historia-vivido.js', "    if (!Object.hasOwn(ESCENAS_HISTORIA, id)) return;\n", "", 'Lo vivido se rompe con una escena que ya no existe', 'vivido'],
  ['historia-vivido.js', "export const hayVivido = (h) => Number(obj(h).empezada) > 0 || Object.keys(obj(obj(obj(h).escenas).vistas)).length > 0;", "export const hayVivido = (h) => true;", 'la pestaña Lo vivido aparece sin historia', 'vivido'],
  ['historia-vivido.js', "  const elegido = grupos.find((g) => g.numero === capituloElegido) || grupos[grupos.length - 1];", "  const elegido = grupos.find((g) => g.numero === capituloElegido) || grupos[0];", 'por defecto abre el primer capítulo y no el último', 'vivido'],
  ['historia-vivido.js', "    ficha.appendChild(el('p', 'anotado', `Día ${e.dia} · ${e.titulo}`));\n", "", 'Lo vivido no dice el día de cada escena', 'vivido'],
  ['historia-vivido.js', "    b.addEventListener('click', () => { capituloElegido = g.numero; if (typeof redibujar === 'function') redibujar(); });", "    b.addEventListener('click', () => { if (typeof redibujar === 'function') redibujar(); });", 'elegir un capítulo no cambia nada', 'vivido,corridas'],
  ['historia-metas.js', "max: maximoOptativas() },", "max: TOTAL_OPTATIVAS },", 'los de paso muestran 34 como tope y no 29', 'metas'],
  ['historia-metas.js', "export const OPTATIVAS_EXCLUYENTES = [['trigo-abuelo', 'masa-crece'], ['tablas-tito', 'veta-vuelve'], ['llave-79', 'pedir-perdon']];", "export const OPTATIVAS_EXCLUYENTES = [['trigo-abuelo', 'masa-crece'], ['tablas-tito', 'veta-vuelve']];", 'el tope de lo de paso olvida un par que se excluye', 'metas'],
  ['historia-metas.js', "    `Lo raro: ${m.raro.n} de ${m.raro.total}`,\n", "    `Lo raro: ${m.raro.n} de ${m.raro.total} (lazo ${m.casa.n})`,\n", 'un contador muestra un número de lazo', 'metas'],
  ['historia-ui.js', "(h.empezada ? `<ul class=\"metas\">", "(true ? `<ul class=\"metas\">", 'los contadores salen aunque la historia no empezó', 'metas'],
  ['main.js', "pestanas.push(['vivido', 'Lo vivido']);", "void 0;", 'la pestaña Lo vivido no se agrega al cuaderno', 'vivido'],
];
let atrapadas = 0;
const SIN_MUT = !!process.env.A4230_SIN_MUT;
if (!HIJO && !SIN_MUT) {
  const tmp = mkdtempSync(join(tmpdir(), 'a4230b-'));
  try {
    for (const [arch, de, a, que, secc] of MUT) {
      const orig = leer(`${arch}`);
      if (!orig.includes(de)) { ok(false, `mutación inaplicable: ${que}`); continue; }
      const dir = join(tmp, `m${atrapadas}-${Math.random().toString(36).slice(2, 7)}`, 'src');
      mkdirSync(dirname(dir), { recursive: true });
      cpSync(join(raiz, 'src'), dir, { recursive: true });
      writeFileSync(join(dir, arch), orig.replace(de, () => a));
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, A4184_SRC: dir, A4230_CALLADO: '1', A4230_SECCIONES: secc }, encoding: 'utf8', timeout: 280000 });
      if (r.status !== 0) atrapadas++; else console.log(`NO ATRAPADA: ${que}`);
      rmSync(dirname(dir), { recursive: true, force: true });
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(atrapadas === MUT.length, `las mutaciones se atrapan (${atrapadas} de ${MUT.length})`);
}

if (!HIJO || SIN_MUT) console.log(fallas ? `FALLÓ: ${fallas} de ${n}` : `OK 4.23.0 (B) metas y logros de la Historia: 25 logros, contadores de la guía y cuaderno «Lo vivido» · ${n} comprobaciones · ${atrapadas} mutaciones atrapadas`);
process.exit(fallas ? 1 : 0);
