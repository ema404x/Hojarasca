// 4.2 (huevos de pascua): las reglas puras de los easter eggs del Relax (src/huevos.js), su guardado (src/guardado.js) y el
// enganche en main.js. Sin Electron. Se prueba que:
//  · la estrella fugaz con deseo: una por noche, separadas varias noches, probabilidad baja y determinista, tres deseos, se cumple
//    a los 2 a 4 días con un regalo chico y una nota, y no hay dos deseos a la vez;
//  · lo que se guarda se sanea (partida vieja sin el campo, datos rotos, caos) y el Desafío no lo tiene.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const eq = (a, b, t) => { pasos++; assert.deepEqual(a, b, t); };
const H = await imp('huevos.js');

// ---------------------------------------------------------------- 0. el azar determinista
ok(H.azarDe(1, 2, 3) === H.azarDe(1, 2, 3) && H.azarDe(1, 2, 3) !== H.azarDe(3, 2, 1), 'el azar es siempre el mismo con los mismos números');
{ let min = 1, max = 0, suma = 0; for (let i = 0; i < 5000; i++) { const a = H.azarDe(99, i); min = Math.min(min, a); max = Math.max(max, a); suma += a; } ok(min >= 0 && max < 1 && Math.abs(suma / 5000 - 0.5) < 0.03, 'y reparte parejo en [0, 1)'); }

// ---------------------------------------------------------------- 1. la estrella fugaz con deseo
ok(H.DESEOS.length === 3 && new Set(H.IDS_DESEOS).size === 3 && H.DESEOS.every((d) => d.texto.length > 0 && d.texto.length <= 28), 'tres deseos, cortos');
ok(H.ESTRELLA.demoraMin === 2 && H.ESTRELLA.demoraMax === 4, 'el deseo se cumple a los 2 a 4 días');
{
  const h = H.huevosNuevos();
  // probabilidad: baja (alrededor de la declarada) y la misma cada vez
  let si = 0; const N = 4000;
  for (let n = 0; n < N; n++) if (H.trajoDeseo({ estrella: H.estrellaNueva() }, 10 + n, 1)) si++;
  ok(si / N > 0.12 && si / N < 0.3, `trae deseo una de cada ~5 fugaces vistas (${si}/${N})`);
  ok(H.trajoDeseo(h, 40, 2) === H.trajoDeseo(h, 40, 2), 'el sorteo es determinista');
  // una vez por noche
  let noche = 0, n0 = 0;
  for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) { noche = 50; n0 = n; break; }
  ok(noche === 50, 'alguna fugaz de una noche trae deseo');
  H.ofrecerEstrella(h, 50);
  let otra = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50, n)) otra = true;
  ok(!otra, 'una vez por noche: ya no hay otra esa noche');
  let seguido = false; for (let d = 51; d < 50 + H.ESTRELLA.separacion; d++) for (let n = 1; n < 120; n++) if (H.trajoDeseo(h, d, n)) seguido = true;
  ok(!seguido, `y no más de una cada ${H.ESTRELLA.separacion} noches`);
  let despues = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 50 + H.ESTRELLA.separacion, n)) despues = true;
  ok(despues, 'pasadas las noches de separación, vuelve a ser posible');
  // pedir
  ok(H.pedirDeseo(h, 7, 50) === null && H.pedirDeseo(h, -1, 50) === null && h.estrella.deseo === null, 'un deseo que no existe no se pide');
  const d = H.pedirDeseo(h, 1, 50);
  ok(d && d.id === 'vecino' && d.pedido === 50 && d.cumple >= 52 && d.cumple <= 54, 'pedido el 50, se cumple entre el 52 y el 54');
  ok(H.pedirDeseo(h, 0, 50) === null, 'no hay dos deseos a la vez');
  let con = false; for (let n = 1; n < 400; n++) if (H.trajoDeseo(h, 200, n)) con = true;
  ok(!con, 'con un deseo esperando, no viene otra estrella con deseo');
  ok(!H.deseoListo(h, d.cumple - 1, 12) && !H.deseoListo(h, d.cumple, 3) && !H.deseoListo(h, d.cumple, 21) && H.deseoListo(h, d.cumple, 9) && H.deseoListo(h, d.cumple + 5, 9), 'se cumple a la mañana o la tarde del día señalado o después, nunca de noche');
  const r = H.cumplirDeseo(h, d.cumple);
  ok(r && r.id === 'vecino' && VECINOS().includes(r.vecino) && r.amistad === 1 && r.texto.includes('__NOMBRE__') && !r.material, 'la visita: un vecino del valle y un punto de amistad');
  ok(h.estrella.deseo === null && h.estrella.cumplidos === 1 && H.cumplirDeseo(h, d.cumple) === null, 'queda cumplido una sola vez');
  // los regalos son chicos
  for (const [i, k, max] of [[0, 'tronco', 4], [2, 'calafate', 5]]) {
    const x = H.huevosNuevos(); H.pedirDeseo(x, i, 10);
    const g = H.cumplirDeseo(x, 13);
    ok(g.material.k === k && g.material.n >= 1 && g.material.n <= max && g.texto.length > 20 && g.titulo.length > 3, `el regalo del deseo ${i} es chico (${g.material.n} ${k})`);
  }
}
function VECINOS() { return H.VECINOS_DESEO; }
{
  const V = await imp('vecindad.js');
  ok(H.VECINOS_DESEO.every((k) => V.VALLE_VECINDAD.includes(k)), 'los vecinos de la visita son del valle (vecindad.js)');
}

// ---------------------------------------------------------------- 1b. los duendes del Coihue
{
  const D = H.DUENDES;
  const arboles = [
    { x: 0, z: 100, especie: 'coihue', esc: 1.2 }, { x: 10, z: 120, especie: 'coihue', esc: 1.38 }, { x: 20, z: 60, especie: 'lenga', esc: 1.9 },
    { x: 5, z: 10, especie: 'coihue', esc: 2.0 }, { x: 900, z: 900, especie: 'coihue', esc: 2.5 }, { x: 30, z: 130, especie: 'coihue', esc: 1.38 }, null, { especie: 'coihue' },
  ];
  eq(H.elegirCoihue(arboles, { x: 0, z: 0 }), { x: 10, z: 120, esc: 1.38 }, 'el coihue elegido: el más grande a una caminata (ni lenga, ni encima, ni perdido); en un empate, el de x menor');
  ok(H.elegirCoihue([], { x: 0, z: 0 }) === null && H.elegirCoihue(null, { x: 0, z: 0 }) === null && H.elegirCoihue([{ x: 1, z: 1, especie: 'lenga', esc: 1 }], { x: 0, z: 0 }) === null, 'sin coihue a mano, ninguno');
  ok(H.elegirCoihue(arboles, { x: 0, z: 0 })?.x === H.elegirCoihue([...arboles].reverse(), { x: 0, z: 0 })?.x, 'no depende del orden de la lista');
  const h = H.huevosNuevos();
  ok(H.puedeConvidar(h, 5) && H.convidar(h, 5) && h.duendes.ofrenda === 5, 'se deja el convite el día 5');
  ok(!H.puedeConvidar(h, 6) && !H.convidar(h, 6), 'con un convite esperando no se deja otro');
  ok(!H.bultoListo(h, 5, 12) && !H.bultoListo(h, 6, 5) && H.bultoListo(h, 6, 8) && H.bultoListo(h, 9, 18) && !H.bultoListo(h, 6, 22), 'el bulto está a la mañana siguiente (de 6 a 21 h), no el mismo día ni de noche');
  const r = H.levantarBulto(h, 6);
  ok(r && H.NOTAS_DUENDE.includes(r.nota) && (r.material === null || (r.material.n >= 1 && r.material.n <= D.matMax)), 'siempre una nota; el regalo, si hay, es chico');
  ok(h.duendes.ofrenda === 0 && h.duendes.recibidos === 1 && H.levantarBulto(h, 6) === null, 'se levanta una sola vez');
  ok(!H.puedeConvidar(h, 5 + D.separacion - 1) && H.puedeConvidar(h, 5 + D.separacion), `no se puede otro convite hasta ${D.separacion} días después`);
  // de cuántos convites sale regalo
  let con = 0; const N = 2000;
  for (let i = 1; i <= N; i++) { const x = H.huevosNuevos(); H.convidar(x, i * 10); if (H.levantarBulto(x, i * 10 + 1).material) con++; }
  ok(con / N > 0.3 && con / N < 0.6, `un regalito en poco menos de la mitad de los convites (${con}/${N})`);
  ok(H.NOTAS_DUENDE.length >= 5 && H.NOTAS_DUENDE.every((t) => t.length > 20 && t.length < 100 && !/[A-Za-z]{3,} (the|and) /.test(t)), 'las notas, en castellano y cortas');
}
// ---------------------------------------------------------------- 1c. el corazón en los tulipanes
{
  const P = await imp('molino-paisaje-plano.js');
  const D = P.DIBUJO_CAMPO, sie = P.sembrarTulipanes();
  ok(sie.total === 1926, `los tulipanes siguen siendo los mismos 1926 (${sie.total})`);
  const todas = Object.values(sie.porColor).flat();
  ok(todas.length === 1926 && Object.keys(sie.porColor).length === 5 && Object.values(sie.porColor).every((l) => l.length > 0), 'siguen las cinco mallas (una por color), todas con plantas: no se suma ni un dibujo');
  ok(JSON.stringify(P.sembrarTulipanes().porColor.blanco[3]) === JSON.stringify(sie.porColor.blanco[3]), 'la siembra es la misma cada vez');
  ok(D.filas.length === P.FRANJAS.length && D.filas.every((f) => f.length === D.filas[0].length && /^[.#]+$/.test(f)), 'el dibujo tiene una fila por franja');
  // por celda (franja × columna): adentro del corazón casi todo blanco; afuera, casi nada
  const fr = P.limitesFranjas(), cols = D.filas[0].length, ancho = (P.CAMPO.lx1 - P.CAMPO.lx0) / cols;
  let dentro = 0, fuera = 0, nDentro = 0, nFuera = 0, mal = 0;
  for (let fi = 0; fi < fr.length; fi++) for (let c = 0; c < cols; c++) {
    const x0 = P.CAMPO.lx0 + c * ancho, x1 = x0 + ancho, f = fr[fi], mio = D.filas[fr.length - 1 - fi][c] === '#';
    // el centro de la celda (lejos del borde): ahí no se mezcla
    const lista = todas.filter((t) => t.z >= f.z0 - 0.06 && t.z <= f.z1 + 0.06 && t.x >= x0 + D.suave && t.x < x1 - D.suave);
    if (lista.length < 5) { mal++; continue; }
    const b = lista.filter((t) => t.color === D.color).length / lista.length;
    if (mio) { dentro += b; nDentro++; } else { fuera += b; nFuera++; }
    if (mio ? b < 0.8 : b > 0.3) mal++;
  }
  ok(mal === 0 && dentro / nDentro > 0.9 && fuera / nFuera < 0.2, `cada celda del corazón es casi toda blanca (${(dentro / nDentro).toFixed(2)}) y las de afuera, casi nada (${(fuera / nFuera).toFixed(2)})`);
  // el borde no es una raya: hay mezcla pegada al límite
  { const f = fr[0], xb = P.CAMPO.lx0 + 3 * ancho;   // en la fila de la punta, el borde entre la columna 2 (vacía) y la 3 (llena)
    const cerca = todas.filter((t) => t.z >= f.z0 - 0.06 && t.z <= f.z1 + 0.06 && Math.abs(t.x - xb) < 0.2);
    const b = cerca.filter((t) => t.color === D.color).length / cerca.length;
    ok(cerca.length > 6 && b > 0.1 && b < 0.9, `el borde del parche se mezcla (${b.toFixed(2)} blancas a 20 cm del límite)`); }
  // la fracción blanca del campo es la del dibujo (el resto conserva los colores de siempre)
  const blancas = todas.filter((t) => t.color === D.color).length / todas.length;
  ok(blancas > 0.45 && blancas < 0.75, `el corazón ocupa un poco más de la mitad del campo (${(blancas * 100).toFixed(0)} %)`);
  ok(['rojo', 'naranja', 'amarillo'].every((k) => sie.porColor[k].length >= 150) && sie.porColor.rosa.length >= 8, 'los colores de las franjas siguen a la vista alrededor (el rosa, apenas: su franja queda casi toda adentro del corazón)');
  // bajar la calidad saca plantas parejo: el corazón sigue leyéndose con la mitad
  const mitad = (l) => l.slice(0, Math.floor(l.length / 2));
  ok(Math.abs(mitad(sie.porColor.blanco).length / sie.porColor.blanco.length - 0.5) < 0.01, 'con la mitad de las plantas (calidad baja) las mallas se acortan parejo');
}

// ---------------------------------------------------------------- 1d. el huemul blanco
{
  const U = H.HUEMUL;
  ok(!H.ventanaHuemul(5.4) && H.ventanaHuemul(5.5) && H.ventanaHuemul(7.4) && !H.ventanaHuemul(8.8) && !H.ventanaHuemul(15) && !H.ventanaHuemul(2), 'sólo al amanecer (de 5:30 a 8:48)');
  // los días en que el sorteo da que sí: pocos
  const dias = []; for (let d = 10; d < 4010; d++) if (H.azarDe(7201, d) < U.prob) dias.push(d);
  ok(dias.length / 4000 > 0.04 && dias.length / 4000 < 0.11, `el sorteo da que sí en una de cada ~14 mañanas con niebla (${dias.length}/4000)`);
  const h = H.huevosNuevos(), d0 = dias[0];
  ok(!H.huemulAfuera(h, d0, 7.4, 0.1) && !H.huemulAfuera(h, d0, 10, 0.6) && !H.huemulAfuera(h, d0 + 1, 7.4, 0.6) === !(dias.includes(d0 + 1)), 'sin niebla de valle o fuera del amanecer, no sale');
  ok(H.huemulAfuera(h, d0, 7.4, 0.5) === true, 'una mañana sorteada, con niebla, sale');
  ok(H.huemulAfuera(h, d0, 7.4, 0.5) === H.huemulAfuera(H.huevosNuevos(), d0, 7.4, 0.5), 'el sorteo es el mismo cada vez (recargar no lo cambia)');
  H.salioHuemul(h, d0);
  ok(h.huemul.ultimo === d0 && H.huemulAfuera(h, d0, 6.5, 0), 'una vez afuera, se queda toda la mañana aunque la niebla baje');
  H.seFueHuemul(h);
  ok(!H.huemulAfuera(h, d0, 7.4, 0.6) && h.huemul.ido, 'si se fue, no vuelve esa mañana (ni al recargar)');
  // separación: el siguiente día sorteado a menos de 5 días no sale
  const cerca = dias.find((d) => d > d0 && d - d0 < U.separacion);
  const lejos = dias.find((d) => d - d0 >= U.separacion);
  ok(cerca === undefined || !H.huemulAfuera(h, cerca, 7.4, 0.6), `no sale otra vez antes de ${U.separacion} días`);
  ok(lejos !== undefined && H.huemulAfuera(h, lejos, 7.4, 0.6), 'pasados los días de separación, sí');
  ok(H.seAsusta(U.cerca - 0.1) && !H.seAsusta(U.cerca + 0.1) && U.cerca >= 15, 'se asusta cuando te acercás demasiado');
  H.avistoHuemul(h); ok(h.huemul.avistajes === 1, 'el avistaje se cuenta');
  const E = H.ENTRADAS_HUEVOS[0], C = await imp('cuaderno.js');
  ok(E.id === 'avistaje-huemul' && E.seccion === 'fauna' && E.cientifico === 'avistaje raro' && E.modo === 'observar' && C.ENTRADA['avistaje-huemul'] === E, 'se anota en el cuaderno como «avistaje raro» (fauna)');
  ok(C.ENTRADAS.filter((e) => e.id === 'avistaje-huemul').length === 1, 'una sola entrada');
}

// ---------------------------------------------------------------- 2. lo que se guarda
eq(H.sanearHuevos(undefined, 10), H.huevosNuevos(), 'una partida vieja (sin el campo) arranca de cero');
eq(H.sanearHuevos(null, 10), H.huevosNuevos(), 'null: de cero');
eq(H.sanearHuevos({ estrella: { ultimaNoche: 9999, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: -4 } }, 20).estrella, { ultimaNoche: 20, deseo: { id: 'lena', pedido: 5, cumple: 7 }, cumplidos: 0 }, 'las fechas no pasan de hoy');
eq(H.sanearHuevos({ duendes: { ofrenda: 9999, ultima: -3, recibidos: 1e9 } }, 20).duendes, { ofrenda: 20, ultima: 20, recibidos: 999 }, 'los duendes: las fechas no pasan de hoy y el convite no queda sin fecha');
eq(H.sanearHuevos({ duendes: 'x' }, 20).duendes, H.duendesNuevos(), 'duendes roto: de cero');
eq(H.sanearHuevos({ huemul: { ultimo: 5000, ido: true, avistajes: -2 } }, 20).huemul, { ultimo: 20, ido: true, avistajes: 0 }, 'el huemul: la fecha no pasa de hoy');
eq(H.sanearHuevos({ huemul: { ultimo: 0, ido: true } }, 20).huemul, H.huemulNuevo(), 'sin aparición no puede haberse ido');
eq(H.sanearHuevos({ huemul: 7 }, 20).huemul, H.huemulNuevo(), 'huemul roto: de cero');
for (const malo of [{ id: 'magia', pedido: 5, cumple: 7 }, { id: 'lena', pedido: 30, cumple: 32 }, { id: 'lena', pedido: 5, cumple: 5 }, { id: 'lena', pedido: 5, cumple: 90 }, 'x', 7, [], { id: 'lena' }]) {
  ok(H.sanearHuevos({ estrella: { deseo: malo } }, 20).estrella.deseo === null, `un deseo imposible se descarta: ${JSON.stringify(malo)}`);
}
{
  let rng = 11; const azar = () => ((rng = (rng * 1103515245 + 12345) >>> 0) / 4294967296);
  const valor = (d = 0) => { const r = azar(); if (d > 2 || r < 0.3) return [null, -1, 0, 1e9, NaN, 'x', true, 'lena', 'tierra'][Math.floor(azar() * 9)]; if (r < 0.65) { const o = {}; for (const k of ['estrella', 'deseo', 'id', 'pedido', 'cumple', 'cumplidos', 'ultimaNoche', 'v', 'duendes', 'ofrenda', 'ultima', 'recibidos', 'huemul', 'ido', 'avistajes']) if (azar() < 0.6) o[k] = valor(d + 1); return o; } return [valor(d + 1), valor(d + 1)]; };
  let bien = 0;
  for (let i = 0; i < 500; i++) {
    const x = H.sanearHuevos(valor(), 1 + Math.floor(azar() * 60));
    const y = H.sanearHuevos(JSON.parse(JSON.stringify(x)), 100);
    if (JSON.stringify(y) === JSON.stringify(x) && Number.isFinite(x.estrella.ultimaNoche) && x.estrella.cumplidos >= 0 && x.duendes.ofrenda <= x.duendes.ultima && x.huemul.avistajes >= 0 && (!x.huemul.ido || x.huemul.ultimo > 0)) bien++;
  }
  eq(bien, 500, 'el caos: nunca se rompe y lo saneado queda igual');
}
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const GU = await import('../src/guardado.js?v42huevos=' + Date.now());
  eq(GU.progresoNuevo().huevos, H.huevosNuevos(), 'partida nueva del Relax: los huevos de cero');
  const vieja = GU.progresoNuevo(); delete vieja.huevos; vieja.dia = 40;
  datos.set('hojarasca-v1', JSON.stringify(vieja));
  eq(GU.cargarProgreso().huevos, H.huevosNuevos(), 'una partida vieja carga bien y arranca de cero');
  const con = GU.progresoNuevo(); con.dia = 40; con.huevos = { estrella: { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 } };
  datos.set('hojarasca-v1', JSON.stringify(con));
  eq(GU.cargarProgreso().huevos.estrella, { ultimaNoche: 30, deseo: { id: 'tierra', pedido: 38, cumple: 41 }, cumplidos: 2 }, 'un deseo esperando se conserva al recargar');
}
{
  const g = leer('src/guardado.js');
  ok(g.includes("huevos: modoPartida === 'desafio' ? undefined : sanearHuevos(p.huevos,") && g.includes('...(desafio ? {} : { huevos: huevosNuevos() })'), 'en el Desafío, sin huevos');
  const m = leer('src/main.js');
  ok(m.includes('huevosJuego?.fugazVista(diaNoche, nocheCielo.vistas)') && m.includes("!desafio) huevosJuego?.actualizar(dt)"), 'main.js: la fugaz vista y el reloj de 2 segundos, sólo en el Relax');
  const j = leer('src/huevos-juego.js');
  ok(!/requestAnimationFrame/.test(j) && !/from 'three'/.test(j) && /acum < 2/.test(j), 'huevos-juego.js: por evento, sin cuadros ni three');
  ok(m.includes('cacheHuevos = huevosJuego ? huevosJuego.accion(js) : null') && m.includes("aviso = { tecla: 'E', texto: cacheHuevos.texto }") && m.includes('cacheHuevos) { const a = cacheHuevos; cacheHuevos = null; a.hacer(); break; }'), 'main.js: la E y el aviso de los huevos, en el mismo lugar (después de los rincones) y con la misma función');
  const vi = leer('src/vida.js');
  ok(vi.includes('export function mallaHuemulBlanco()') && vi.includes('function mallaHuemul(macho, blanco = false)'), 'vida.js: el huemul blanco es el mismo modelo con otro pelaje');
  ok(!/huemulEstado|mallaHuemulBlanco|huevos/.test(leer('src/fauna.js')) && !/mallaHuemulBlanco/.test(vi.slice(vi.indexOf('export function crearVida'))), 'el huemul blanco no está en la fauna del juego: no se caza, no se cuenta, no lo rastrea el perro');
  const mu = leer('src/huevos-mundo.js');
  ok(/MAT_FAUNA/.test(mu) && !/new THREE.(MeshStandardMaterial|MeshBasicMaterial|ShaderMaterial|MeshPhongMaterial)/.test(mu) && !/OctahedronGeometry|Vector4|Frustum|ShapeGeometry/.test(mu), 'huevos-mundo.js: sólo MAT_FAUNA (no compila nada nuevo) y sin clases que el three recortado no trae');
  const p = leer('src/huevos.js');
  ok(!/from 'three'/.test(p) && !/document\./.test(p) && !/Date\.now|Math\.random/.test(p.replace(/\/\/.*$/gm, '')), 'huevos.js es puro: ni three ni DOM ni reloj ni Math.random');
}

console.log(`OK 4.2 huevos de pascua · ${pasos} verificaciones · estrella con deseo, duendes del Coihue, corazón de tulipanes, huemul blanco, guardado saneado y enganche`);
