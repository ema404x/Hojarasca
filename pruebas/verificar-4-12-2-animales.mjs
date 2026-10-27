// 4.12.2: los animales con huesos (caballo, ciervo, huemul y perro). Corre las mallas de verdad (sin placa de video) y mira:
//   · la piel arma una sola malla con los MISMOS vértices, normales, colores y triángulos de las mallas rígidas (misma forma, tamaño y pelaje),
//     los pesos suman 1 con a lo sumo cuatro huesos, y en reposo las matrices de los huesos son la identidad;
//   · Baja y Mínima no arman nada (siguen rígidos); el LOD (piel cerca, rígido lejos, con histéresis) y que se pueda apagar;
//   · las marchas son continuas (paso → trote → galope → quieto, andar → parar), sin saltos de pose cuadro a cuadro; nada se estira de más ni
//     se hunde en el piso; el cuello se curva en tres huesos y sigue lo que ponen los pivotes rígidos (la IA no se toca);
//   · un solo dibujo por animal con piel (contra seis o siete rígidos), el mismo material (ningún programa nuevo) y los huesos en la textura
//     compartida (el lugar se libera); el programa con huesos se compila en la carga (gente.js);
//   · los archivos de la IA, el movimiento, la montura, el carro y las sombras de contacto no cambian.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const P = await import('../src/animales-piel.js');
const { MAT_FAUNA } = await import('../src/vida.js');
const { mallaCaballo } = await import('../src/caballo-mundo.js');
const { mallaPerro } = await import('../src/perro.js');
const { mallaCiervo } = await import('../src/bichos.js');
const { mallaHuemul, pielDeHuemul } = await import('../src/vida.js');
const claveMaterial0 = MAT_FAUNA.customProgramCacheKey() + '|' + JSON.stringify(MAT_FAUNA.defines || {}) + '|' + MAT_FAUNA.vertexColors;
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- ayudas
// los vértices de la piel puestos como los dejan los huesos (lo que haría el vertex shader)
function posiciones(piel) {
  const sk = piel.malla.skeleton; sk.update();
  const geo = piel.malla.geometry, Pp = geo.attributes.position, sw = geo.attributes.skinWeight, si = geo.attributes.skinIndex;
  const out = new Float32Array(Pp.count * 3), M = sk.boneMatrices, b0 = sk.base;
  for (let i = 0; i < Pp.count; i++) {
    const x = Pp.getX(i), y = Pp.getY(i), z = Pp.getZ(i);
    let ox = 0, oy = 0, oz = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k); if (!w) continue;
      const o = (b0 + si.getComponent(i, k)) * 16;
      ox += w * (M[o] * x + M[o + 4] * y + M[o + 8] * z + M[o + 12]);
      oy += w * (M[o + 1] * x + M[o + 5] * y + M[o + 9] * z + M[o + 13]);
      oz += w * (M[o + 2] * x + M[o + 6] * y + M[o + 10] * z + M[o + 14]);
    }
    out[i * 3] = ox; out[i * 3 + 1] = oy; out[i * 3 + 2] = oz;
  }
  return out;
}
// cuánto se alarga la arista más estirada respecto del reposo
function estiramiento(piel, pos) {
  const geo = piel.malla.geometry, Pp = geo.attributes.position, ind = geo.index;
  let peor = 0;
  for (let t = 0; t < ind.count; t += 3) for (let e = 0; e < 3; e++) {
    const a = ind.getX(t + e), b = ind.getX(t + (e + 1) % 3);
    const r = Math.hypot(Pp.getX(a) - Pp.getX(b), Pp.getY(a) - Pp.getY(b), Pp.getZ(a) - Pp.getZ(b));
    if (r < 0.004) continue;
    const q = Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2]);
    peor = Math.max(peor, q / r);
  }
  return peor;
}
const minY = (pos) => { let m = 1e9; for (let i = 1; i < pos.length; i += 3) m = Math.min(m, pos[i]); return m; };
// los vértices de las mallas rígidas ya fundidas, en el espacio del animal
function rigidas(m) {
  m.g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(m.g.matrixWorld).invert();
  const lista = [];
  const v = new THREE.Vector3();
  for (const f of m.piel.rigidas) {
    f.updateWorldMatrix(true, false);
    const rel = new THREE.Matrix4().multiplyMatrices(inv, f.matrixWorld);
    const P1 = f.geometry.attributes.position, C = f.geometry.attributes.color;
    for (let i = 0; i < P1.count; i++) { v.fromBufferAttribute(P1, i).applyMatrix4(rel); lista.push([v.x, v.y, v.z, C.getX(i), C.getY(i), C.getZ(i)]); }
  }
  return lista;
}
const triangulos = (g) => g.index.count / 3;

// ---------------------------------------------------------------- 1. misma forma y mismo pelaje
P.fijarPielFauna(true);
const bichos = [
  ['caballo', mallaCaballo(), P.POSES.caballo],
  ['perro', mallaPerro(), P.POSES.perro],
  ['ciervo macho', mallaCiervo(true), P.POSES.ciervo],
  ['cierva', mallaCiervo(false), P.POSES.ciervo],
  ['huemul', (() => { const h = mallaHuemul(true); h.piel = pielDeHuemul(h); return h; })(), P.POSES.ciervo],
];
for (const [nombre, m] of bichos) {
  ok(m.piel && m.piel.malla && m.piel.malla.isSkinnedMesh, `${nombre}: tiene piel por huesos`);
  const geo = m.piel.malla.geometry, N = geo.attributes.position.count;
  const rig = rigidas(m);
  ok(rig.length === N, `${nombre}: la piel tiene los mismos vértices que las mallas rígidas (${N})`);
  ok(m.piel.rigidas.length >= 5, `${nombre}: la versión rígida son ${m.piel.rigidas.length} dibujos y la piel uno solo`);
  const tris = m.piel.rigidas.reduce((s, f) => s + triangulos(f.geometry), 0);
  ok(triangulos(geo) === tris, `${nombre}: los mismos triángulos (${tris})`);
  // y los mismos, uno por uno: los índices de cada malla rígida, corridos a donde quedan en la piel
  { let ov = 0, esperado = 0, suma = 0, distintos = 0;
    for (const f of m.piel.rigidas) { const ix = f.geometry.index; for (let i = 0; i < ix.count; i++) esperado += ix.getX(i) + ov; ov += f.geometry.attributes.position.count; }
    for (let i = 0; i < geo.index.count; i++) suma += geo.index.getX(i);
    for (const f of m.piel.rigidas) distintos += f.geometry.index.count;
    ok(suma === esperado && distintos === geo.index.count, `${nombre}: los índices de los triángulos son los de las mallas rígidas`); }
  // vértice por vértice: posición y color iguales a los de la malla rígida (en el mismo orden de fundición)
  let dp = 0, dc = 0;
  const Pp = geo.attributes.position, Cc = geo.attributes.color;
  for (let i = 0; i < N; i++) {
    dp = Math.max(dp, Math.abs(Pp.getX(i) - rig[i][0]), Math.abs(Pp.getY(i) - rig[i][1]), Math.abs(Pp.getZ(i) - rig[i][2]));
    dc = Math.max(dc, Math.abs(Cc.getX(i) - rig[i][3]), Math.abs(Cc.getY(i) - rig[i][4]), Math.abs(Cc.getZ(i) - rig[i][5]));
  }
  ok(dp < 1e-5 && dc < 1e-6, `${nombre}: posiciones (${dp.toExponential(1)}) y colores pintados (${dc.toExponential(1)}) idénticos a los rígidos`);
  // los pesos
  const sw = geo.attributes.skinWeight, si = geo.attributes.skinIndex;
  let mal = 0, fuera = 0; const usados = new Set();
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); s += w; if (w > 0) { usados.add(si.getComponent(i, k)); if (si.getComponent(i, k) >= P.NUM_HUESOS) fuera++; } }
    if (Math.abs(s - 1) > 1e-3) mal++;
  }
  ok(mal === 0 && fuera === 0, `${nombre}: los pesos suman 1 con a lo sumo cuatro huesos del esqueleto`);
  const necesarios = [P.HUESO.CUELLO1, P.HUESO.CUELLO2, P.HUESO.CABEZA, P.HUESO.OREJA_I, P.HUESO.OREJA_D, P.HUESO.COLA1, P.HUESO.COLA2, P.HUESO.PELVIS, P.HUESO.TORAX];
  for (let k = 0; k < 4; k++) for (let t = 0; t < 3; t++) necesarios.push(P.hueso(k, t));
  ok(necesarios.every((h) => usados.has(h)), `${nombre}: todos los huesos mueven algo (${[...usados].sort((a, b) => a - b).join(',')})`);
  // el reposo es la identidad
  const reposo = posiciones(m.piel);
  let dr = 0; for (let i = 0; i < N; i++) dr = Math.max(dr, Math.abs(reposo[i * 3] - Pp.getX(i)), Math.abs(reposo[i * 3 + 1] - Pp.getY(i)), Math.abs(reposo[i * 3 + 2] - Pp.getZ(i)));
  ok(dr < 1e-5, `${nombre}: en reposo la piel queda igual a la malla rígida (${dr.toExponential(1)})`);
  ok(m.piel.malla.material === MAT_FAUNA, `${nombre}: el material es el de siempre (ningún programa nuevo en un material propio)`);
  ok(MAT_FAUNA.customProgramCacheKey() + '|' + JSON.stringify(MAT_FAUNA.defines || {}) + '|' + MAT_FAUNA.vertexColors === claveMaterial0, `${nombre}: armar la piel no toca el material de la fauna (misma clave de programa)`);
  ok(m.piel.malla.visible === false && m.piel.rigidas.every((f) => f.visible), `${nombre}: arranca rígido (la piel se activa por cercanía)`);
}

// ---------------------------------------------------------------- 2. Baja y Mínima
{
  P.fijarPielFauna(null);
  ok(P.calidadConPiel('media') && P.calidadConPiel('alta') && !P.calidadConPiel('baja') && !P.calidadConPiel('muybaja'), 'la piel corre en Media y Alta, no en Baja ni en Mínima');
  const guardado = (c) => { globalThis.localStorage = { getItem: () => JSON.stringify({ calidad: c }) }; P.fijarPielFauna(null); };
  guardado('baja');
  ok(P.pielPermitida() === false && mallaCaballo().piel === null && mallaPerro().piel === null && mallaCiervo(true).piel === null, 'Baja: no se arma la piel (caballo, perro y ciervo rígidos como siempre)');
  guardado('muybaja');
  ok(P.pielPermitida() === false && mallaCaballo().piel === null, 'Mínima: tampoco');
  guardado('media');
  ok(P.pielPermitida() === true && mallaCaballo().piel !== null, 'Media: sí');
  guardado('alta');
  ok(P.pielPermitida() === true, 'Alta: sí');
  // sin configuración guardada: la calidad por defecto es Media
  globalThis.localStorage = { getItem: () => null }; P.fijarPielFauna(null);
  ok(P.pielPermitida() === true, 'sin configuración guardada corre como Media');
  globalThis.localStorage = { getItem: () => { throw new Error('bloqueado'); } }; P.fijarPielFauna(null);
  ok(P.pielPermitida() === true, 'con el almacenamiento bloqueado no se rompe (Media)');
  delete globalThis.localStorage;
  P.fijarPielFauna(false);
  ok(mallaCaballo().piel === null && mallaPerro().piel === null, 'se puede apagar del todo (para medir)');
  P.fijarPielFauna(true);
  // las mallas rígidas de Baja no cambian: mismas piezas que con piel (la piel es una malla de más, escondida)
  const r0 = mallaPerro(); P.fijarPielFauna(false); const r1 = mallaPerro(); P.fijarPielFauna(true);
  const dibujos = (g) => { let c = 0; g.traverse((o) => { if (o.isMesh && o.visible) c++; }); return c; };
  ok(dibujos(r0.g) === dibujos(r1.g), `el perro con piel (escondida) dibuja lo mismo que el rígido: ${dibujos(r1.g)} mallas`);
}

// ---------------------------------------------------------------- 3. el LOD (cerca piel, lejos rígido)
{
  const m = mallaCaballo(); const g = m.g; scene_(g);
  function scene_(x) { return x; }
  const piel = m.piel, vis = () => ({ piel: piel.malla.visible, rigido: piel.rigidas.every((f) => f.visible), nada: piel.rigidas.every((f) => !f.visible) });
  g.position.set(0, 0, 0);
  P.observar({ x: 0, y: 0, z: 100 });
  ok(piel.lod(g) === false && vis().rigido && !vis().piel, 'a 100 m queda rígido');
  P.observar({ x: 0, y: 0, z: P.CERCA_PIEL - 2 });
  ok(piel.lod(g) === true && vis().piel && vis().nada, `a ${P.CERCA_PIEL - 2} m se ve con piel y las mallas rígidas se esconden (un dibujo en vez de ${piel.rigidas.length})`);
  P.observar({ x: 0, y: 0, z: P.CERCA_PIEL + 3 });
  ok(piel.lod(g) === true, 'histéresis: a 43 m sigue con piel (no parpadea en el borde)');
  P.observar({ x: 0, y: 0, z: P.CERCA_PIEL + P.HISTERESIS_PIEL + 2 });
  ok(piel.lod(g) === false && vis().rigido && !vis().piel, `pasados ${P.CERCA_PIEL + P.HISTERESIS_PIEL} m vuelve a lo rígido`);
  ok(P.CERCA_PIEL <= 40 && P.CERCA_PIEL >= 30, `la piel se usa sólo cerca (${P.CERCA_PIEL} m)`);
  // si baja la calidad en vivo, vuelve rígido aunque esté cerca
  P.observar({ x: 0, y: 0, z: 5 });
  ok(piel.lod(g) === true, 'cerca otra vez: piel');
  P.fijarPielFauna(false);
  ok(piel.lod(g) === false && vis().rigido && !vis().piel, 'si la calidad baja en vivo, vuelve a lo rígido al instante');
  P.fijarPielFauna(true);
  // sin cámara conocida no se activa
  const m2 = mallaPerro(); P.observar(null);
  ok(m2.piel.activa === false, 'sin observador no se activa por su cuenta');
  P.observar({ x: 0, y: 0, z: 5 });
  ok(m2.piel.lod(m2.g) === true && m2.piel.malla.visible, 'con el observador cerca, sí');
}

// ---------------------------------------------------------------- 4. marchas continuas (caballo)
// el quiebre: cuánto cambia la velocidad de un ángulo de un cuadro al otro (la segunda diferencia). Un movimiento parejo, aunque rápido, casi no
// lo tiene; un salto de pose (la pata que se apaga de golpe, el cambio de marcha) lo tiene enorme.
function quiebre(series, desde = 2, hasta = 1e9) {
  let peor = 0;
  for (const s of series) for (let i = Math.max(2, desde); i < Math.min(s.length, hasta); i++) peor = Math.max(peor, Math.abs(s[i] - 2 * s[i - 1] + s[i - 2]));
  return peor;
}
function cadaCuadro(piel, fn, cuadros) {
  // las series de los huesos de las patas (rotación x), un valor por cuadro
  const huesos = [];
  for (let k = 0; k < 4; k++) for (let t = 0; t < 3; t++) huesos.push(P.hueso(k, t));
  const series = huesos.map(() => []);
  for (let i = 0; i < cuadros; i++) { fn(i); huesos.forEach((h, j) => series[j].push(piel.huesos.rot[h * 3])); }
  return series;
}
{
  const m = mallaCaballo(); const piel = m.piel; piel.activa = true;
  // la marcha del caballo (caballo.js) y la fase, como las avanza caballo-mundo.js
  const { marcha } = await import('../src/caballo.js');
  let fase = 0;
  const camina = (vel) => { const mc = marcha(vel); fase += (1 / 60) * mc.cadencia; return { fase, modo: mc.modo, amplitud: mc.amplitud, galope: mc.modo === 'galope', montado: true }; };
  // una carrera: parado, acelera hasta el galope, frena, parado (la velocidad cambia suave, como la `est.vel` del juego)
  let vel = 0;
  const perfil = (i) => { const objetivo = i < 60 ? 0 : i < 360 ? 11.5 : 0; vel += (objetivo - vel) * (1 - Math.exp(-6 / 60)); return vel; };
  // lo que haría la versión rígida: el salto máximo de la pata (rotation.x) cuando cambia de marcha
  const rig = [[], [], [], []];
  { let f2 = 0, v2 = 0; for (let i = 0; i < 460; i++) { v2 += ((i < 60 ? 0 : i < 360 ? 11.5 : 0) - v2) * (1 - Math.exp(-6 / 60)); const mc = marcha(v2); f2 += mc.cadencia / 60; const gal = mc.modo === 'galope';
    for (let k = 0; k < 4; k++) rig[k].push(mc.modo === 'quieto' ? 0 : Math.sin(f2 + (gal ? (k < 2 ? 0 : Math.PI * 0.6) : (k === 0 || k === 3) ? 0 : Math.PI)) * mc.amplitud); } }
  // (el quiebre de un movimiento parejo, aunque rápido, es el del galope parejo; un salto de pose lo supera con creces)
  const rigidoSalto = quiebre(rig), rigidoParejo = quiebre(rig, 250, 340);
  const series = cadaCuadro(piel, (i) => P.POSES.caballo(piel, 1 / 60, m, camina(perfil(i))), 460);
  const salto = quiebre(series), parejo = quiebre(series, 250, 340);
  ok(rigidoSalto > rigidoParejo * 1.8, `caballo: la versión rígida salta en los cambios de marcha (quiebre ${rigidoSalto.toFixed(3)} contra ${rigidoParejo.toFixed(3)} del galope parejo)`);
  // la pata no cambia de golpe: ni un hueso de la pata se mueve más de 0,5 rad de un cuadro al otro (doblar el carpo no es un salto de pose)
  { let d1 = 0; for (const s of series) for (let i = 1; i < s.length; i++) d1 = Math.max(d1, Math.abs(s[i] - s[i - 1])); ok(d1 < 0.5, `caballo: ningún hueso de la pata salta más de ${d1.toFixed(2)} rad entre dos cuadros`); }
  ok(salto < parejo * 1.3,`caballo: con huesos, de parado al galope y otra vez a parado la pata no quiebra más que en el galope parejo (${salto.toFixed(3)} contra ${parejo.toFixed(3)})`);
  // el pico de la pose: nada se estira de más ni se hunde
  let est = 0, hundido = 0;
  vel = 0; fase = 0;
  for (let i = 0; i < 400; i++) { P.POSES.caballo(piel, 1 / 60, m, camina(perfil(i))); if (i % 7 === 0) { const pos = posiciones(piel); est = Math.max(est, estiramiento(piel, pos)); hundido = Math.min(hundido, minY(pos)); } }
  ok(est < 1.75, `caballo: ninguna arista se estira más de ${est.toFixed(2)}× en toda la carrera`);
  ok(hundido > -0.14, `caballo: los cascos no se hunden en el piso (${hundido.toFixed(3)} m)`);
  // las patas flexionan carpo y garrón al andar (la rígida no podía)
  vel = 0; fase = 0; let flexMax = 0;
  for (let i = 0; i < 300; i++) { P.POSES.caballo(piel, 1 / 60, m, camina(perfil(i))); for (let k = 0; k < 4; k++) flexMax = Math.max(flexMax, Math.abs(piel.huesos.rot[P.hueso(k, 1) * 3])); }
  ok(flexMax > 0.6, `caballo: al galope las patas doblan carpo y garrón (${flexMax.toFixed(2)} rad)`);
  // parado vuelve exacto al reposo (menos la respiración y la cola)
  for (let i = 0; i < 240; i++) P.POSES.caballo(piel, 1 / 60, m, camina(0));
  let patasQuietas = 0; for (let k = 0; k < 4; k++) for (let t = 0; t < 3; t++) patasQuietas = Math.max(patasQuietas, Math.abs(piel.huesos.rot[P.hueso(k, t) * 3]));
  ok(patasQuietas < 0.02, `caballo: parado, las patas vuelven al reposo (${patasQuietas.toExponential(1)} rad)`);
  // la columna se flexiona al galope (pelvis y tórax en sentidos contrarios)
  let col = 0; vel = 0; fase = 0;
  for (let i = 0; i < 360; i++) { P.POSES.caballo(piel, 1 / 60, m, camina(perfil(i))); col = Math.max(col, Math.abs(piel.huesos.rot[P.HUESO.PELVIS * 3] - piel.huesos.rot[P.HUESO.TORAX * 3])); }
  ok(col > 0.08, `caballo: la columna se arquea al galope (${col.toFixed(2)} rad entre pelvis y tórax)`);
  // el cuello sigue al pivote rígido y se reparte en tres huesos
  m.cuello.rotation.x = 0.6;
  for (let i = 0; i < 5; i++) P.POSES.caballo(piel, 1 / 60, m, camina(0));
  const suma = [P.HUESO.CUELLO1, P.HUESO.CUELLO2, P.HUESO.CABEZA].map((h) => piel.huesos.rot[h * 3]);
  ok(suma.every((x) => x > 0.1) && suma.reduce((a, b) => a + b, 0) > 0.6, `caballo: pastando (cuello ${m.cuello.rotation.x}), el cuello se curva en tres huesos (${suma.map((x) => x.toFixed(2)).join(' + ')})`);
  const pos = posiciones(piel);
  ok(estiramiento(piel, pos) < 1.9, 'caballo: con la cabeza baja no se estira de más');
  m.cuello.rotation.x = 0;
  // la esfera con que three decide si se dibuja cubre al animal en cualquier pose (si no, se cortaría en el borde de la pantalla)
  { const e = piel.malla.boundingSphere, c = e.center; let fuera = 0;
    vel = 0; fase = 0; m.cuello.rotation.x = 0.6;
    for (let i = 0; i < 400; i++) { P.POSES.caballo(piel, 1 / 60, m, camina(perfil(i))); if (i % 11 === 0) { const pos = posiciones(piel); for (let v = 0; v < pos.length; v += 3) if (Math.hypot(pos[v] - c.x, pos[v + 1] - c.y, pos[v + 2] - c.z) > e.radius) fuera++; } }
    ok(fuera === 0 && piel.malla.frustumCulled === true && e.radius < 4, `caballo: la esfera de la malla (${e.radius.toFixed(2)} m) cubre todas las poses y la malla se descarta fuera de la vista`);
    m.cuello.rotation.x = 0; }
}

// ---------------------------------------------------------------- 5. el perro: del andar a parar sin saltos
{
  const m = mallaPerro(); const piel = m.piel; piel.activa = true;
  // en la rígida el andar apaga las patas de golpe al bajar de 0,15 m/s: un salto de hasta 1,4 rad
  const serieRigida = [[]];
  { for (let i = 0; i < 200; i++) { const vel = i < 100 ? 3 : 0, anda = vel > 0.15; serieRigida[0].push(anda ? Math.sin(i * 0.25) * 0.7 : 0); } }
  const saltoRigido = quiebre(serieRigida), parejoRigido = quiebre(serieRigida, 10, 90);
  let paso = 0;
  const huesos = [0, 1, 2, 3].map((k) => P.hueso(k, 0));
  const serie = [[], [], [], []];
  for (let i = 0; i < 260; i++) {
    const vel = i < 120 ? 3 : 0, anda = vel > 0.15;
    paso += (1 / 60) * (2 + vel * 3.4);
    for (let k = 0; k < 4; k++) m.patas[k].rotation.x = anda ? Math.sin(paso * 2 + (k % 2 ? Math.PI : 0) + (k > 1 ? 0.7 : 0)) * 0.7 : 0;
    P.POSES.perro(piel, 1 / 60, m, { paso, anda, vel, sentado: 0, marcando: false });
    huesos.forEach((h, j) => serie[j].push(piel.huesos.rot[h * 3]));
  }
  const peor = quiebre(serie), parejo = quiebre(serie, 20, 100);
  ok(saltoRigido > parejoRigido * 3, `perro: la versión rígida apagaba las patas de golpe al parar (quiebre ${saltoRigido.toFixed(2)} contra ${parejoRigido.toFixed(2)} andando)`);
  ok(peor < parejo * 1.15, `perro: con huesos, del andar a parar la pata no quiebra más que andando (${peor.toFixed(3)} contra ${parejo.toFixed(3)})`);
  // sentado: sigue lo que ponen los pivotes (la sentada) y no se estira
  m.patas[0].rotation.x = 0.6; m.patas[1].rotation.x = 0.6; m.patas[2].rotation.x = -0.52; m.patas[3].rotation.x = -0.52;
  for (let i = 0; i < 10; i++) P.POSES.perro(piel, 1 / 60, m, { paso, anda: false, vel: 0, sentado: 1, marcando: false });
  ok(Math.abs(piel.huesos.rot[P.hueso(0, 0) * 3] - 0.6) < 0.05 && Math.abs(piel.huesos.rot[P.hueso(2, 0) * 3] + 0.52) < 0.05, 'perro: sentado, las patas siguen la pose de la sentada');
  ok(estiramiento(piel, posiciones(piel)) < 1.6, 'perro: sentado no se estira de más');
  // olfateando: la cabeza baja con el cuello curvado (el pivote rígido manda)
  for (let k = 0; k < 4; k++) m.patas[k].rotation.x = 0;
  m.cabeza.rotation.x = 0.8;
  for (let i = 0; i < 5; i++) P.POSES.perro(piel, 1 / 60, m, { paso, anda: false, vel: 0, sentado: 0, marcando: false });
  const cu = [P.HUESO.CUELLO1, P.HUESO.CUELLO2, P.HUESO.CABEZA].map((h) => piel.huesos.rot[h * 3]);
  ok(cu.every((x) => x > 0.1) && cu.reduce((a, b) => a + b, 0) > 0.8, `perro: olfateando baja el cuello en tres huesos (${cu.map((x) => x.toFixed(2)).join(' + ')})`);
  ok(estiramiento(piel, posiciones(piel)) < 1.8, 'perro: olfateando no se estira de más');
  // la cola sigue al pivote rígido (mueve la cola contento) y las orejas atrás al correr
  m.cola.rotation.z = 0.5;
  for (let i = 0; i < 20; i++) P.POSES.perro(piel, 1 / 60, m, { paso, anda: false, vel: 0, sentado: 0, marcando: false });
  ok(Math.abs(piel.huesos.rot[P.HUESO.COLA1 * 3 + 2]) > 0.2 && Math.abs(piel.huesos.rot[P.HUESO.COLA3 * 3 + 2]) > 0.2, 'perro: la cola sigue el movimiento del pivote en tres tramos');
}

// ---------------------------------------------------------------- 6. el ciervo y el huemul
for (const [nombre, m] of [['ciervo', bichos[2][1]], ['huemul', bichos[4][1]]]) {
  const piel = m.piel; piel.activa = true;
  const { marchaMamifero } = await import('../src/vida.js');
  let fase = 0, vel = 0;
  const prm = { paseo: 0.9, carrera: 7.5 };
  const paso = (estado, objetivo) => { vel += (objetivo - vel) * (1 - Math.exp(-4 / 60)); const mc = marchaMamifero(vel, estado, prm.paseo, prm.carrera); fase += mc.cadencia / 60;
    return { fase, amplitud: mc.amplitud * Math.min(1, vel * 0.9), posterior: mc.posterior, estado, galope: mc.modo === 'galope' }; };
  const huesos = []; for (let k = 0; k < 4; k++) for (let t = 0; t < 2; t++) huesos.push(P.hueso(k, t));
  const serie = huesos.map(() => []);
  let est = 0;
  for (let i = 0; i < 500; i++) {
    const fase_ = i < 80 ? ['pastar', 0] : i < 200 ? ['caminar', 0.9] : i < 300 ? ['caminar', 2.5] : i < 400 ? ['huir', 7.5] : ['pastar', 0];
    P.POSES.ciervo(piel, 1 / 60, m, paso(fase_[0], fase_[1]));
    huesos.forEach((h, j) => serie[j].push(piel.huesos.rot[h * 3]));
    if (i % 9 === 0) est = Math.max(est, estiramiento(piel, posiciones(piel)));
  }
  const peor = quiebre(serie), parejo = quiebre(serie, 330, 390);
  ok(peor < parejo * 1.15, `${nombre}: de pastar a caminar, trotar, huir y volver a pastar la pata no quiebra más que en la huida pareja (${peor.toFixed(3)} contra ${parejo.toFixed(3)})`);
  ok(est < 1.8, `${nombre}: nada se estira más de ${est.toFixed(2)}× en toda la secuencia`);
  m.cabeza.rotation.x = 0.95;
  for (let i = 0; i < 5; i++) P.POSES.ciervo(piel, 1 / 60, m, paso('pastar', 0));
  const cu = [P.HUESO.CUELLO1, P.HUESO.CUELLO2, P.HUESO.CABEZA].map((h) => piel.huesos.rot[h * 3]);
  ok(cu.every((x) => x > 0.1) && cu.reduce((a, b) => a + b, 0) > 0.95, `${nombre}: pastando (cabeza ${m.cabeza.rotation.x}) el cuello se curva en tres huesos (${cu.map((x) => x.toFixed(2)).join(' + ')})`);
  ok(estiramiento(piel, posiciones(piel)) < 1.9, `${nombre}: pastando no se estira de más`);
  // alerta: las orejas apuntan adelante
  m.cabeza.rotation.x = 0;
  for (let i = 0; i < 60; i++) P.POSES.ciervo(piel, 1 / 60, m, paso('alerta', 0));
  ok(piel.huesos.rot[P.HUESO.OREJA_I * 3] > 0.2 && piel.huesos.rot[P.HUESO.OREJA_D * 3] > 0.2, `${nombre}: alerta, las orejas se ponen adelante`);
}

// ---------------------------------------------------------------- 7. los huesos en la textura compartida
{
  const antes = P.esqueletosEnUso();
  const t = [mallaPerro(), mallaPerro(), mallaCaballo()];
  ok(P.esqueletosEnUso() === antes + 3, 'cada piel toma su tramo de la textura compartida');
  const bases = new Set(t.map((m) => m.piel.malla.skeleton.base));
  ok(bases.size === 3, 'los tramos no se pisan');
  const baseLiberada = t[0].piel.malla.skeleton.base;
  t[0].piel.liberar();
  ok(P.esqueletosEnUso() === antes + 2, 'liberar la piel devuelve su tramo');
  const otra = mallaCiervo(true);
  ok(otra.piel.malla.skeleton.base === baseLiberada, 'y el tramo liberado lo toma el que llega');
  ok(P.CAP_PAGINA >= 40 && P.LADO_PAGINA * P.LADO_PAGINA * 4 * 4 <= 70000, `la textura es chica (${P.LADO_PAGINA}×${P.LADO_PAGINA}, ${P.CAP_PAGINA} animales por página)`);
  // la matriz de un hueso con una rotación mueve los vértices que le pesan
  const piel = t[1].piel; piel.activa = true;
  piel.r(P.HUESO.CABEZA, 0.5, 0, 0);
  const p0 = posiciones(piel); piel.r(P.HUESO.CABEZA, 0, 0, 0); const p1 = posiciones(piel);
  let mov = 0; for (let i = 0; i < p0.length; i++) mov = Math.max(mov, Math.abs(p0[i] - p1[i]));
  ok(mov > 0.05, `girar el hueso de la cabeza mueve la malla (${mov.toFixed(2)} m)`);
}

// ---------------------------------------------------------------- 8. el programa con huesos se compila en la carga, y nada más
{
  const gente = leer('src/gente.js');
  ok(/function precalentar\(camara, dibujar\) \{[^]*?precalentarPiel\(escena, camara, dibujar\)/.test(gente), 'gente.js: la pasada de precompilado de la carga también arma el programa con huesos de los animales');
  const pre = P.precalentarPiel.toString();
  ok(/pielPermitida\(\)/.test(pre) && /escena\.add\(malla\)/.test(pre) && /escena\.remove\(malla\)/.test(pre) && /dibujar\(\)/.test(pre), 'precalentarPiel: sólo si la piel corre, dibuja una malla mínima con huesos y la saca');
  ok(/castShadow = true/.test(pre), 'precalentarPiel: la malla proyecta sombra (se compila también el programa de la sombra)');
  const ecena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(); let dibujos = 0;
  P.fijarPielFauna(false);
  ok(P.precalentarPiel(ecena, cam, () => { dibujos++; }) === false && dibujos === 0, 'en Baja y Mínima no se dibuja nada de más');
  P.fijarPielFauna(true);
  const antes = P.esqueletosEnUso();
  ok(P.precalentarPiel(ecena, cam, () => { dibujos++; ok(ecena.children.length === 1 && ecena.children[0].isSkinnedMesh, 'durante el dibujo hay una malla con huesos'); }) === true && dibujos === 1 && ecena.children.length === 0 && P.esqueletosEnUso() === antes, 'en Media y Alta dibuja una vez y no deja nada');
  for (const f of ['src/caballo-mundo.js', 'src/perro.js', 'src/bichos.js', 'src/vida.js']) ok(!/new THREE\.(Shader|RawShader)Material|onBeforeCompile *= .*skin/i.test(leer(f).split('4.12.2')[1] || ''), `${f}: sin shaders propios para la piel`);
  ok(!/onBeforeCompile|ShaderMaterial/.test(leer('src/animales-piel.js').replace(/\/\/.*$/gm, '')), 'animales-piel.js: ni un shader propio (usa el material de la fauna con el skinning de three)');
}

// ---------------------------------------------------------------- 9. lo que no se toca
{
  const caballo = leer('src/caballo-mundo.js'), perro = leer('src/perro.js'), bichos = leer('src/bichos.js'), vida = leer('src/vida.js');
  // la IA y el movimiento siguen escribiendo los pivotes rígidos de siempre
  ok(/m\.g\.position\.set\(est\.x, y \+ \(mc\.modo === 'quieto' \? 0 : Math\.abs\(Math\.sin\(est\.fase\)\) \* 0\.05 \* mc\.amplitud\), est\.z\)/.test(caballo), 'caballo: la posición y el rebote del cuerpo no cambiaron');
  ok(/p\.rotation\.x = mc\.modo === 'quieto' \? 0 : Math\.sin\(est\.fase \+ \(galope \? par : diag\)\) \* mc\.amplitud;/.test(caballo), 'caballo: los pivotes rígidos de las patas siguen igual');
  ok(/m\.cuello\.rotation\.x = lerp\(m\.cuello\.rotation\.x, pastando \? 0\.55/.test(caballo), 'caballo: el cuello rígido sigue igual (de ahí lee la piel)');
  ok(/const suelo = inclinacionTerrenoMamifero\(T, \{ x: est\.x, z: est\.z \}, est\.yaw, 0\.22\)/.test(caballo) && /seguirCarro\(dt, visible && est\.conCarro && !sinCarro\)/.test(caballo), 'caballo: la inclinación al terreno y el carro enganchado siguen igual');
  ok(/est\.vel = lerp\(est\.vel, velocidad, 1 - Math\.exp\(-5 \* dt\)\)/.test(perro) && /m\.palito\.visible = est\.estado === 'traer'/.test(perro) && /if \(!progreso\.entradas\.perro && d < 6\) registrar\('perro'\)/.test(perro), 'perro: el movimiento, el palito y el registro no cambiaron');
  ok(/a\.g\.rotation\.y = a\.rumbo;/.test(vida) && /a\.cabeza\.rotation\.x = lerp\(a\.cabeza\.rotation\.x, bajar \+ microGesto\.cabezaX \* microPermitida/.test(vida) && /if \(a\.estado === 'huir'\) a\.pos\.y \+= Math\.abs\(Math\.sin\(a\.fase\)\) \* prm\.salto/.test(vida), 'vida: actualizarCiervo (IA, hambre, pastoreo, huida) no cambió');
  ok(/limitarSombrasPorDistancia\(c\.g, dCiervo, 58\)/.test(bichos) && /c\.g\.visible = \(dCiervo < 240\) && sale\(c\)/.test(bichos), 'bichos: la distancia de dibujo y las sombras del ciervo siguen igual');
  // los ganchos: cada animal pone la pose con huesos al final de su cuadro (lo demás es lo de siempre)
  ok(/if \(m\.piel\?\.lod\(m\.g\)\) m\.piel\.posar\(dt, m, \{ fase: est\.fase, modo: mc\.modo, amplitud: mc\.amplitud, galope, montado \}\)/.test(caballo), 'caballo: pone la pose con huesos al final del cuadro');
  ok(/if \(m\.piel\?\.lod\(m\.g\)\) m\.piel\.posar\(dt, m, \{ paso: est\.paso, anda, vel: est\.vel, sentado: est\.sentado \|\| 0, marcando: est\.estado === 'marcar' \}\)/.test(perro), 'perro: pone la pose con huesos después de la sentada');
  ok(/actualizarCiervo\(c, dt, js, PRM_CIERVO, T, col\);\n\s*posarPielMamifero\(c, dt, PRM_CIERVO\);/.test(bichos) && /actualizarCiervo\(a, dt, js, PRM_HUEMUL, T, col, m\);\n\s*posarPielMamifero\(a, dt, PRM_HUEMUL\);/.test(vida), 'ciervo y huemul: la pose con huesos va después de actualizarCiervo');
  ok(/observar\(camara\.position\)/.test(bichos) && /observar\(camara\?\.position\)/.test(perro), 'bichos y perro le dicen a la piel dónde está la cámara cada cuadro');
  ok(/m\.piel\?\.liberar\(\);[^]*?m\.piel = n\.piel/.test(caballo) && /m\.piel\?\.liberar\(\);[^]*?m\.piel = n\.piel/.test(perro), 'caballo y perro: al personalizar se libera la piel vieja y se toma la nueva');
  ok(/etiquetar\([^\n]*'cola'\)/.test(caballo) && /etiquetar\([^\n]*'oreja'\)/.test(caballo) && /etiquetar\([^\n]*'oreja'\)/.test(perro) && /etiquetar\([^\n]*'cuello'\)/.test(bichos) && /etiquetar\([^\n]*'cola'\)/.test(vida), 'las colas, orejas y cuellos van etiquetados para la piel');
  // la piel sólo lee: nunca escribe posición, rumbo ni estado del animal
  const piel = leer('src/animales-piel.js').replace(/\/\/.*$/gm, '');
  // (las poses reciben al animal en `m`, la marcha en `c` y a sí misma en `p`/`S`: del animal sólo leen)
  ok(!/\b[mc]\.[\w.\[\]]*\s*(=|\+=|-=|\*=)(?!=)/.test(piel) && !/\bm\.[\w.]*\.set\(/.test(piel), 'animales-piel.js no escribe nada del animal (ni posición, ni rumbo, ni estado, ni velocidad, ni pivotes)');
  ok(!/colision|resolver|hitbox|montar|sulky|silla|enganche/i.test(piel), 'animales-piel.js no toca colisiones, monta, sulky, silla ni carro');
}

console.log(`verificar-4-12-2-animales: ${n} comprobaciones OK`);
