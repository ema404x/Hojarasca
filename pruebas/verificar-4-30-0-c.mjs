// 4.30.0 (C): la cacería de bugs del mundo y la física. Comprueba con el código de verdad (three del juego en Node):
//   1. la cortina de la cascada en Alta: el dibujo corre en el tiempo de vuelo y baja; con el reloj grande (la partida larga) los hilos no
//      se aplastan (la derivada del dibujo a lo alto no crece con el reloj);
//   2. el agua del arroyo (Alta y Ultra): el arrastre de la corriente acotado (dos fases que se turnan), sin «corriente × reloj» (rayas y
//      costuras rectas entre tramo y tramo con la partida larga);
//   3. el puentecito del camino de la Aldea (sulky.js): en rampa de orilla a orilla (sin pared del lado bajo ni salto del lado alto), con
//      35 cm sobre el agua; el piso (rincones-mundo.js) en tramos a la altura de la rampa, y el sulky y la bajada leen la rampa;
//   4. los puentes de la vía (trochita.js): el tablero sigue hasta donde el terraplén llega a la vía (antes la vía colgaba 2 a 5 m);
//   5. las brasas de los hornos y las fraguas titilan con el color del material (sin luz ni programa nuevo).
// Mutaciones: copias de los archivos con un cambio cada una, un proceso por copia (ESM en caché): todas tienen que fallar.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registrarThree } from './ayuda-three.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const archivo = (n) => process.env['MUT4300C_' + n.replace(/[^a-z]/gi, '_')] || path.join(src, n);
const leer = (n) => fs.readFileSync(archivo(n), 'utf8').replace(/\r\n/g, '\n');
registrarThree();
const avisoOrig = console.warn;
console.warn = (...a) => { if (!String(a[0]).includes('toNonIndexed')) avisoOrig(...a); };   // (las rocas del salto avisan de más)

// una función `export function NOMBRE(` de un texto, evaluada con `entorno`
function funcionDe(texto, nombre, entorno = {}) {
  const i0 = texto.indexOf('export function ' + nombre + '(');
  if (i0 < 0) return null;
  const i1 = texto.indexOf('\n}\n', i0);
  const cuerpo = texto.slice(i0 + 'export '.length, i1 + 2);
  return new Function(...Object.keys(entorno), `return (${cuerpo});`)(...Object.values(entorno));
}
// GLSL → JS para evaluar una expresión escalar (sqrt, fract, mix, abs, smoothstep)
const aJS = (e) => e.replace(/\bsqrt\(/g, 'Math.sqrt(').replace(/\babs\(/g, 'Math.abs(').replace(/\bfract\(/g, '((v)=>v-Math.floor(v))(');

async function comprobar() {
  const mal = [];
  let n = 0;
  const falla = (c, t) => { n++; if (!c) mal.push(t); };
  const THREE = await import('three');
  const AG = await import(pathToFileURL(archivo('agua.js')).href);
  const MAT = await import(pathToFileURL(path.join(src, 'materiales.js')).href);

  // ---- 1. la cortina de Alta
  const T = { saltoAgua: { x: 0, z: 0, ang: 0.4, ancho: 2.4, arriba: 9, abajo: 3, i: 5 }, altura: () => 3,
    rio: Array.from({ length: 12 }, (_, i) => ({ x: i * 4, z: 0, s: 5 - i * 0.2, w: 3 })) };
  const cas = AG.crearCascada(T, new THREE.Scene(), MAT.U);
  const fc = cas.partes.cortina.material.fragmentShader;
  // las tres lecturas de ruido de los hilos: la coordenada «a lo alto» de cada una
  const lecturas = [...fc.matchAll(/vC\(vec2\(vUv\.x \* (?:80|38|14)\.0[^,]*,\s*([^)]*(?:\([^)]*\)[^)]*)*)\)\)/g)].map((m) => m[1]);
  falla(lecturas.length === 3, `la cortina lee el ruido de los hilos en tres escalas (${lecturas.length})`);
  const vueloExpr = (fc.match(/float vuelo = ([^;]+);/) || [])[1];
  const evaluar = (expr, f, t) => {
    const alto = T.saltoAgua.arriba - T.saltoAgua.abajo;
    const vuelo = vueloExpr ? new Function('f', 'uAlto', 'return ' + aJS(vueloExpr))(f, alto) : 0;
    const fase = /fase/.test(expr) ? new Function('f', 'uTiempo', 'return ' + aJS((fc.match(/float fase = ([^;]+);/) || [])[1] || '0'))(f, t) : 0;
    return new Function('f', 'y', 'uTiempo', 'vuelo', 'fase', 'return ' + aJS(expr))(f, f * alto, t, vuelo, fase);
  };
  let parejo = lecturas.length === 3, baja = lecturas.length === 3;
  for (const e of lecturas) for (const f of [0.2, 0.5, 0.85]) {
    const h = 1e-3;
    const d1 = (evaluar(e, f + h, 20) - evaluar(e, f, 20)) / h, d2 = (evaluar(e, f + h, 50000) - evaluar(e, f, 50000)) / h;
    if (!(Math.abs(d2 - d1) < 1e-3 * Math.max(1, Math.abs(d1)))) parejo = false;
    // el dibujo baja: la coordenada crece hacia abajo (f) y decrece con el reloj (un mismo dibujo se corre hacia f más grande)
    const dt = evaluar(e, f, 21) - evaluar(e, f, 20);
    if (!(d1 > 0 && dt < 0)) baja = false;
  }
  falla(parejo, 'la cortina de Alta: con el reloj grande los hilos no se aplastan (el dibujo a lo alto no depende del reloj)');
  falla(baja, 'la cortina de Alta: el agua baja');
  const gt = cas.partes.gotas;
  falla(gt.material === cas.partes.matNube && !!gt.geometry.attributes.aTam && !!gt.geometry.attributes.aAlfa && !gt.material.isPointsMaterial,
    'las gotas del pie de la cascada: motas redondas con el material de la bruma (no cuadraditos; ningún programa más)');

  // ---- 2. el agua del arroyo, en Alta y en Ultra
  AG.ajustarAguaNueva(true);
  const agua = AG.crearAgua(T, new THREE.Scene());
  const fa = agua.mat.fragmentShader;
  falla(!/vFlujo\s*\*\s*uTiempo/.test(fa), 'el agua: el arrastre ya no es corriente × reloj');
  falla(!/uTiempo\s*\*\s*\(\s*0\.9\s*\+\s*length\(vFlujo\)/.test(fa), 'las vetas del arroyo: tampoco reloj × corriente');
  const ondas = fa.slice(fa.indexOf('float ondas(vec2 p, float detalle) {'), fa.indexOf('void main()'));
  falla(/fract\(uTiempo \* [\d.]+\)/.test(ondas) && /fract\(uTiempo \* [\d.]+ \+ 0\.5\)/.test(ondas) && /abs\(fa \* 2\.0 - 1\.0\)/.test(ondas) && ondas.includes('vnoise(p * 0.35 - vFlujo * (fa * 14.0) * 0.35'),
    'las ondas del arroyo: dos fases que se turnan (cada una vuelve a cero mientras la otra manda)');
  falla(ondas.includes('if (dot(vFlujo, vFlujo) < 1e-6) a = vnoise(p * 0.35 + uTiempo * 0.05);') && !/vFlujo/.test(fa.slice(fa.indexOf('float ondasF('), fa.indexOf('float ondas(vec2'))), 'el lago (sin corriente) hace la cuenta de siempre; las ondas finas ya no se arrastran');
  const UA = await import(pathToFileURL(archivo('ultra-agua.js')).href);
  const fu = UA.fragmentoAguaUltra(fa);
  falla(!/uTiempo\s*\*\s*\(\s*0\.9\s*\+\s*velU/.test(fu) && /tfaU/.test(fu) && /tfbU/.test(fu), 'Ultra: la espuma, las burbujas y las chispas del arroyo también en dos fases');
  falla(!/vFlujo\s*\*\s*uTiempo/.test(fu), 'Ultra: sin corriente × reloj');

  // ---- 2b. la cinta del arroyo: en las vueltas suaves los dos tramos comparten el borde y la corriente (sin cuña doble ni costura)
  const CA = await import(pathToFileURL(archivo('cinta-arroyo.js')).href);
  const rioC = Array.from({ length: 30 }, (_, i) => ({ x: Math.sin(i * 0.12) * 20, z: i * 3, s: 5 - i * 0.05, w: 3 }));
  const cg = CA.construirCintaArroyo(rioC, -1);
  // los vértices de cada tramo: 4 seguidos (a1, a2, b1, b2) en orden de tramo, antes de los abanicos
  const vtx = (k) => [cg.pos[k * 3], cg.pos[k * 3 + 2], cg.flujo[k * 2], cg.flujo[k * 2 + 1]];
  let peorBorde = 0, peorFlujo = 0;
  for (let t = 0; t < rioC.length - 2; t++) {
    const b1 = vtx(t * 4 + 2), a1 = vtx((t + 1) * 4), b2 = vtx(t * 4 + 3), a2 = vtx((t + 1) * 4 + 1);
    peorBorde = Math.max(peorBorde, Math.hypot(b1[0] - a1[0], b1[1] - a1[1]), Math.hypot(b2[0] - a2[0], b2[1] - a2[1]));
    peorFlujo = Math.max(peorFlujo, Math.hypot(b1[2] - a1[2], b1[3] - a1[3]) / Math.max(1e-6, Math.hypot(a1[2], a1[3])));
  }
  falla(peorBorde < 1e-9 && peorFlujo < 0.2, `la cinta: en las vueltas suaves los tramos comparten el borde (${peorBorde.toExponential(1)} m) y la corriente sigue pareja (${(peorFlujo * 100).toFixed(1)} %)`);
  falla(cg.ind.length === (rioC.length - 1) * 6, 'la cinta: en las vueltas suaves no hay abanicos (no hace falta tapar nada)');

  // ---- 3. el puentecito del camino
  const S = await import(pathToFileURL(archivo('sulky.js')).href);
  // un arroyo que baja en escalón: la orilla de arriba a 3 m, la de abajo a 1 m, el agua de 3 m de ancho a 0,6 m
  const mundo = (orillaA, orillaB, nivel) => ({
    altura: (x, z) => (z < -2 ? orillaA : z > 2 ? orillaB : 0),
    agua: (x, z) => (Math.abs(z) <= 2 ? { nivel, prof: nivel } : null),
  });
  const camino = { puntos: Array.from({ length: 41 }, (_, i) => ({ x: 0, z: -20 + i })), s: Array.from({ length: 41 }, (_, i) => i) };
  const revisar = (Tm, nombre) => {
    const L = S.puentesDelCamino(camino, Tm);
    falla(L.length === 1, `${nombre}: un puentecito (${L.length})`);
    const b = L[0];
    if (!b) return;
    const yA = S.alturaPuente(b, 0, b.z - Math.cos(b.ang) * (b.largo / 2 - 0.6)), yB = S.alturaPuente(b, 0, b.z + Math.cos(b.ang) * (b.largo / 2 - 0.6));
    const tA = Tm.altura(0, b.z - Math.cos(b.ang) * (b.largo / 2 - 0.6)), tB = Tm.altura(0, b.z + Math.cos(b.ang) * (b.largo / 2 - 0.6));
    let libre = Infinity;
    for (let z = -2; z <= 2; z += 0.25) libre = Math.min(libre, S.alturaPuente(b, 0, z) - Tm.agua(0, z).nivel);
    return { b, yA, yB, tA, tB, libre };
  };
  const r1 = revisar(mundo(3, 1, 0.6), 'el escalón');
  if (r1) {
    falla(Math.abs(r1.yA - r1.tA) < 0.6 && Math.abs(r1.yB - r1.tB) < 0.6, `el escalón: las dos puntas del tablero apoyan en su orilla (${r1.yA.toFixed(2)}/${r1.tA}, ${r1.yB.toFixed(2)}/${r1.tB})`);
    falla(r1.libre >= 0.34, `el escalón: el tablero queda sobre el agua (${r1.libre.toFixed(2)} m)`);
    falla(Number.isFinite(r1.b.y0) && Number.isFinite(r1.b.y1) && r1.b.alto >= Math.max(r1.b.y0, r1.b.y1) - 0.7, 'el escalón: el puente dice su rampa y su punta alta');
  }
  // orillas bajas que suben al alejarse del agua: la rampa se corre camino afuera (sin levantarse en el aire)
  const bajas = { altura: (x, z) => (Math.abs(z) <= 2 ? 0 : 0.7 + (Math.abs(z) - 2) * 0.15), agua: (x, z) => (Math.abs(z) <= 2 ? { nivel: 0.9, prof: 0.9 } : null) };
  const r2 = revisar(bajas, 'orillas bajas');
  if (r2) {
    falla(r2.libre >= 0.34, `orillas bajas: el tablero le deja 35 cm al agua (${r2.libre.toFixed(2)} m)`);
    falla(Math.abs(r2.yA - r2.tA) < 0.3 && Math.abs(r2.yB - r2.tB) < 0.3, `orillas bajas: las puntas apoyan en la orilla (${(r2.yA - r2.tA).toFixed(2)}, ${(r2.yB - r2.tB).toFixed(2)})`);
  }
  falla(S.alturaPuente({ x: 0, z: 0, ang: 0, largo: 10, y0: 1, y1: 3 }, 0, 0) === 2 && S.alturaPuente({ x: 0, z: 0, ang: 0, largo: 10, y0: 1, y1: 3 }, 0, -9) === 1
    && S.alturaPuente({ x: 0, z: 0, ang: 0, largo: 10, alto: 4 }, 0, 2) === 4, 'alturaPuente: en el medio, acotada en las puntas, y la vieja (sin rampa) da su alto');
  const rm = leer('rincones-mundo.js'), rj = leer('rincones-juego.js');
  falla(/const tramos = Math\.max\(1, Math\.ceil\(b\.largo \/ 0\.5\)\)/.test(rm) && /agregarPlataforma\?\.\(\{ x: cx, z: cz, ang: -b\.ang \+ PI \/ 2, largo: lt \+ 0\.02, ancho: 2\.0, alto: alturaPuente\(b, cx, cz\) \+ 0\.035/.test(rm),
    'el piso del puentecito en tramos de medio metro a la altura de la rampa');
  falla(/g\.rotation\.set\(-Math\.atan2\(y1 - y0, b\.largo\), b\.ang, 0, 'YXZ'\)/.test(rm), 'la malla del puentecito, inclinada como la rampa');
  falla(/!est\.puentes\.some\(\(b\) => Math\.hypot\(f\.x - b\.x, f\.z - b\.z\) < b\.largo \/ 2 \+ 1\)/.test(rm), 'los faroles del camino no quedan al lado del puentecito (colgando sobre la barranca)');
  falla(/const pitch = enPuente \? -Math\.atan2\(alturaPuente\(enPuente, ad\.x, ad\.z\) - alturaPuente\(enPuente, pose\.x, pose\.z\), 1\.4\)/.test(rm), 'el sulky en el puentecito se inclina con la rampa (no con el cauce de abajo)');
  falla(/alturaPuente\(enPuente, pose\.x, pose\.z\)/.test(rm) && /alturaPuente\(puente, js\.pos\.x, js\.pos\.z\)/.test(rj) && /alturaPuente\(enPuente, a\.x, a\.z\)/.test(rj), 'el sulky y la bajada del sulky leen la rampa');

  // orillas bajas y llanas: correrse no alcanza; el tablero se levanta
  const r3 = revisar(mundo(0.75, 0.7, 0.6), 'orillas llanas');
  if (r3) falla(r3.libre >= 0.34, `orillas llanas: el tablero se levanta para dejarle 35 cm al agua (${r3.libre.toFixed(2)} m)`);

  // ---- 4. los puentes de la vía
  const tr = leer('trochita.js');
  const largoTablero = funcionDe(tr, 'largoTableroRiel');
  falla(!!largoTablero, 'trochita.js: largoTableroRiel');
  if (largoTablero) {
    // la quebrada: a 14 a 18 m del centro el terreno está 4 m bajo la vía; desde los 18,5 m el terraplén llega
    const alto = 20, luz = 21;
    const Tq = { altura: (x, z) => { const d = Math.abs(z); return d < 18.5 ? alto - 4.2 : alto - 0.2; } };
    const L = largoTablero(Tq, 0, 0, 0, alto, luz);
    falla(L / 2 >= 18.5 && L / 2 <= 21, `el tablero cubre la quebrada hasta el terraplén (mitad ${(L / 2).toFixed(1)} m)`);
    const Tl = { altura: () => alto - 0.2 };
    falla(largoTablero(Tl, 0, 0, 0, alto, luz) === luz + 4, 'donde el terraplén llega enseguida, el tablero de siempre (luz + 4)');
    falla(largoTablero({ altura: () => 0 }, 0, 0, 0, alto, luz) <= luz + 28, 'nunca más que luz + 28');
  }
  falla(/const tablero = largoTableroRiel\(T, p\.x, p\.z, ang, alto, luz\);/.test(tr) && /new THREE\.BoxGeometry\(2\.9, 0\.3, tablero\)/.test(tr) && /largo: tablero, ancho: 2\.6, alto: alto - 0\.2/.test(tr),
    'el tablero, la malla y el piso del puente de la vía usan el largo nuevo');

  // ---- 5. las brasas
  const am = leer('aldea-mundo.js');
  const brillo = funcionDe(am, 'brilloBrasas');
  falla(!!brillo, 'aldea-mundo.js: brilloBrasas');
  if (brillo) {
    const v = Array.from({ length: 400 }, (_, i) => brillo(i * 37));
    const min = Math.min(...v), max = Math.max(...v);
    falla(min >= 0.7 && max <= 1 && max - min > 0.12, `las brasas titilan entre 0,7 y 1 (${min.toFixed(2)} a ${max.toFixed(2)})`);
    // de un cuadro al siguiente (16 ms) no salta de golpe: es un fuego, no un parpadeo
    let salto = 0; for (let t = 0; t < 20000; t += 16) salto = Math.max(salto, Math.abs(brillo(t + 16) - brillo(t)));
    falla(salto < 0.05, `las brasas no parpadean de golpe (${salto.toFixed(3)} por cuadro)`);
  }
  falla(/if \(materiales\.brasas\) materiales\.brasas\.color\.setScalar\(brilloBrasas\(ahora\)\);/.test(am), 'el pulso de las brasas se aplica al material cada cuadro (cerca de la aldea)');
  falla(!/new THREE\.PointLight/.test(am.slice(am.indexOf('export function brilloBrasas'), am.indexOf('export function brilloBrasas') + 600)), 'ninguna luz nueva');
  // ---- 7. lo soltado con V (ramitas, piñones, cantos…) apoya en el tablón o el piso donde estás, y se guarda con su altura
  const ob = leer('objetos.js'), mn = leer('main.js'), gu = leer('guardado.js');
  falla(mn.includes("if (T.agua(x, z) && !col?.plataformaEn?.(x, z, js.pos.y + 0.3, 0.6)) { nota('Ahí no', 'Se te va con el agua'); return; }"), 'arriba de un puente sobre el agua, V deja las cosas en el tablón (antes: «Se te va con el agua»)');
  falla(/function soltar\(id, x, z, guardado = null, yPie = null\)/.test(ob) && /const y = Number\.isFinite\(yG\) \? Math\.max\(T\.altura\(x, z\), yG\) : T\.altura\(x, z\);/.test(ob), 'objetos.js: lo soltado apoya a la altura del pie (nunca bajo el terreno)');
  falla(/objetos\.soltar\(r\.id, x, z, null, alturaDePie\(T, col, x, z, js\.pos\.y\)\)/.test(mn), 'main.js: V le pasa dónde apoya (el tablón, el piso)');
  falla(/Number\.isFinite\(s\.y\) \? \{ tipo: s\.tipo, x: s\.x, z: s\.z, y: s\.y \}/.test(gu) && /\{ tipo, x, z, y: yPie \}/.test(ob), 'la partida guarda la altura de lo soltado arriba de algo');

  // ---- 8. la gente de ruta que se traba contra algo: rodea (antes caminaba en el lugar 12 s y aparecía del otro lado)
  const gt2 = leer('gente.js');
  const rodeo = funcionDe(gt2, 'rodeoEnRuta', { RODEO_S: 1.2, RODEO_M: 1.7 });
  falla(!!rodeo, 'gente.js: rodeoEnRuta');
  if (rodeo) {
    // una pared ancha (x de 0,2 a 1,3; z de -2,5 a 2,5) entre la persona (0, 0) y su etapa (3, 0): el resolver empuja lo que cae en la pared
    const colF = { resolver: (q) => { if (q.x > 0.2 && q.x < 1.3 && Math.abs(q.z) < 2.5) q.x = 0.19; }, paredEntre: () => false };
    const Tf = { agua: () => null };
    const g = { pos: { x: 0, z: 0, y: 0 }, velocidad: 0.65 }, etapa = { x: 3, z: 0 };
    let p = null;
    for (let i = 0; i < 100 && !p; i++) p = rodeo(g, etapa, 0.02, Tf, colF);
    falla(!!p && Math.abs(p.z) >= 2.5 && !(p.x > 0.2 && p.x < 1.3 && Math.abs(p.z) < 2.5), `trabada contra algo, la persona de ruta busca un punto a un costado libre (${p && [p.x.toFixed(2), p.z.toFixed(2)]})`);
    const g2 = { pos: { x: 0, z: 0, y: 0 }, velocidad: 0.65 }; let p2 = null;
    for (let i = 0; i < 100; i++) { g2.pos.x += 0.013; p2 = p2 || rodeo(g2, etapa, 0.02, Tf, colF); }
    falla(!p2, 'si avanza, no rodea');
  }
  falla(gt2.includes('else g.__rodeo = rodeoEnRuta(g, etapa, dt, T, col);') && gt2.includes('if (caminarHacia(g, dt, g.__rodeo, g.velocidad || 0.8, T, col, 0.35)) g.__rodeo = null;') && gt2.includes('else if (g.__rodeo.t > 4) { if (g.__lento) g.__lento.lado = -g.__rodeo.lado; g.__rodeo = null; }'), 'la gente de ruta usa el rodeo antes de aparecer en su etapa (y si un rodeo no llega, prueba del otro lado)');

  // ---- 6. (Ultra) las huellas en las lajas y la piedra de la plaza
  const UM = await import(pathToFileURL(archivo('ultra-materiales.js')).href);
  UM.conocerCieloUltraC(MAT.U);
  const shA = { uniforms: {}, fragmentShader: ['#include <common>', 'void main() {', 'diffuseColor.rgb = alb;', '#include <normal_fragment_maps>', '#include <lights_fragment_end>', '#include <opaque_fragment>', '}'].join('\n'), vertexShader: '' };
  UM.inyectarAldeaUltra(shA);
  const fA = shA.fragmentShader, iDef = fA.indexOf('float pisadaLodU('), iUso = fA.indexOf('pisadaLodU(vPosMundoVeg.xz)');
  falla(iDef > 0 && iUso > iDef && !!shA.uniforms.uHuellasU && shA.uniforms.uHuellasU === MAT.U.uHuellas, 'Ultra: la aldea lee la textura de las huellas finas (definida antes de usarla, con su uniforme)');
  const bloque = fA.slice(iUso - 400, iUso + 700);
  falla(/if \(horiz > 0\.5 && \(\(tipo > 4\.5 && tipo < 5\.5\) \|\| tipo > 8\.5\)\)/.test(bloque) && /alb = mix\(alb, vec3\(0\.6, 0\.51, 0\.38\)/.test(bloque) && bloque.includes('alb = mix(alb, vec3(0.2, 0.15, 0.1), pisaU * 0.6 * (1.0 - secoPU));') && bloque.includes('charcoU *= 1.0 - pisaU * 0.9;'),
    'Ultra: en la laja y la piedra de la plaza, polvo en seco y barro mate con lluvia (corta el brillo y el charco)');
  return { n, mal };
}

const r = await comprobar();
if (process.env.MUT4300C_HIJO) { process.stdout.write(JSON.stringify(r)); process.exit(0); }
if (r.mal.length) { console.error('verificar-4-30-0-c:\n  ' + r.mal.join('\n  ')); process.exit(1); }

// ================================================================ mutaciones
const MUTACIONES = [
  ['agua.js', 'la cortina con la fase de antes', '        float fino = vC(vec2(vUv.x * 80.0, vuelo * 0.5 - uTiempo * 2.4))', '        float fase = uTiempo * (3.2 + f * 5.5) * 1.6;\n        float fino = vC(vec2(vUv.x * 80.0, y * 0.32 + fase * 0.5))'],
  ['agua.js', 'la cortina que sube', 'vuelo * 0.14 - uTiempo * 0.8', 'vuelo * 0.14 + uTiempo * 0.8'],
  ['agua.js', 'las gotas cuadradas', 'const gotas = new THREE.Points(gotasGeo, matNube);', "const gotas = new THREE.Points(gotasGeo, new THREE.PointsMaterial({ color: 0xe6f2f4, size: 0.1, transparent: true, opacity: 0.6, depthWrite: false }));"],
  ['agua.js', 'las ondas con corriente × reloj', 'a = mix(vnoise(p * 0.35 - vFlujo * (fa * 14.0) * 0.35', 'a = mix(vnoise(p * 0.35 - vFlujo * uTiempo * 0.35'],
  ['agua.js', 'las vetas con reloj × corriente', 'float tfa352 = fa352 * 14.0 * vel352', 'float tfa352 = uTiempo * (0.9 + length(vFlujo) * 1.3)'],
  ['ultra-agua.js', 'Ultra: la espuma con reloj × corriente', 'float tfaU = faU * 14.0 * (0.9 + velU * 1.3)', 'float tfaU = uTiempo * (0.9 + velU * 1.3)'],
  ['sulky.js', 'el puentecito plano a la orilla alta', 'const y0 = r.ya + sube, y1 = r.yb + sube', 'const y0 = Math.max(r.ya, r.yb) + 0.13 + sube, y1 = y0'],
  ['sulky.js', 'el puentecito sin mirar el agua', 'for (let n = 0; n < 6 && r.falta > 0.01; n++)', 'for (let n = 0; n < 0 && r.falta > 0.01; n++)'],
  ['sulky.js', 'el puentecito sin levantarse', 'const { a, b, L } = r, sube = Math.max(0, r.falta);', 'const { a, b, L } = r, sube = 0;'],
  ['rincones-mundo.js', 'el piso plano del puentecito', 'alto: alturaPuente(b, cx, cz) + 0.035', 'alto: b.alto + 0.035'],
  ['trochita.js', 'el tablero de la vía de antes', '  return Math.min(luz + 28, medio * 2);', '  return luz + 4;'],
  ['ultra-materiales.js', 'Ultra: la aldea sin la textura de las huellas', "uniformesCielo(sh); uniformesHuellas(sh);   // (4.30.0 C: las huellas en las lajas)", 'uniformesCielo(sh);'],
  ['ultra-materiales.js', 'Ultra: las lajas sin polvo', 'alb = mix(alb, vec3(0.6, 0.51, 0.38)', 'alb = mix(alb, alb'],
  ['objetos.js', 'lo soltado otra vez al terreno', 'const y = Number.isFinite(yG) ? Math.max(T.altura(x, z), yG) : T.altura(x, z);', 'const y = T.altura(x, z);'],
  ['guardado.js', 'la partida sin la altura de lo soltado', 'Number.isFinite(s.y) ? { tipo: s.tipo, x: s.x, z: s.z, y: s.y }', 'false ? { tipo: s.tipo, x: s.x, z: s.z, y: s.y }'],
  ['main.js', 'V otra vez rechaza arriba del puente', 'if (T.agua(x, z) && !col?.plataformaEn?.(x, z, js.pos.y + 0.3, 0.6)) {', 'if (T.agua(x, z)) {'],
  ['cinta-arroyo.js', 'la cinta con un borde por tramo otra vez', 'export const MITRA_MAX = 0.5;', 'export const MITRA_MAX = 0;'],
  ['gente.js', 'la gente de ruta sin rodeo', '        else g.__rodeo = rodeoEnRuta(g, etapa, dt, T, col);', ''],
  ['gente.js', 'el rodeo hacia adentro de lo que frena', '    if (Math.hypot(q.x - p.x, q.z - p.z) > 0.05) continue;', ''],
  ['aldea-mundo.js', 'las brasas quietas', '  return Math.min(1, Math.max(0.7, 0.88 + 0.09 * lento + 0.03 * rapido));', '  return 1;'],
  ['aldea-mundo.js', 'las brasas que parpadean', 'rapido = Math.sin(ms / 53 + Math.sin(ms / 97) * 2.0)', 'rapido = (Math.floor(ms / 50) % 2) * 8'],
];
let atrapadas = 0;
const fallidas = [];
MUTACIONES.forEach(([arch, nombre, de, a], i) => {
  const orig = fs.readFileSync(path.join(src, arch), 'utf8');
  if (!orig.includes(de)) { fallidas.push(`${nombre} (no se encuentra el texto)`); return; }
  const copia = path.join(src, arch.replace('.js', `.mut4300c-${i}.js`));
  fs.writeFileSync(copia, orig.replace(de, a));
  try {
    const env = { ...process.env, MUT4300C_HIJO: '1', ['MUT4300C_' + arch.replace(/[^a-z]/gi, '_')]: copia };
    const h = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env, encoding: 'utf8' });
    let rr = null; try { rr = JSON.parse(h.stdout); } catch { rr = null; }
    if (!rr || rr.mal.length) atrapadas++; else fallidas.push(nombre);
  } finally { fs.rmSync(copia, { force: true }); }
});
if (fallidas.length) { console.error('verificar-4-30-0-c: mutaciones que pasaron: ' + fallidas.join(' | ')); process.exit(1); }
console.log(`verificar-4-30-0-c: ${r.n} comprobaciones de la cascada, el arroyo, los puentes y las brasas · ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
