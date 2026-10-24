// 4.10.3 — render y efectos del Desafío (zona V): EJECUTA lo que se puede en Node; lo que depende de GL se anota en CAMBIOS_4_10_3_VISUAL_GEOMETRIA.md («Para mirar en Electron»).
//   V1 la ruina del bosque cae en sitios llanos (terreno real)   V2 el farol de Herminia: su llama sigue siendo chica y cada fuego pulsa con su fase
//   V3 las placas de los duendes adaptados: una malla por duende (no cinco) y se van al morir o irse
//   V5 los nidos de los lugares tomados eligen sitio libre   V6 las patas del Coihue apoyan en el terreno
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = await import('three');
const { generarTerreno } = await import('../src/terreno.js');
const VAL = await import('../src/desafio-valle.js');
const { BASE_REFUGIO } = await import('../src/desafio-mapa.js');
const { LIMITE } = await import('../src/config.js');

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const semilla = (n) => () => { n = (Math.imul(n ^ (n >>> 15), 2246822519) + 3266489917) | 0; n ^= n >>> 13; return (n >>> 0) / 4294967296; };

// ---------------------------------------------------------------- V1: la ruina
{
  // una ladera pareja de 30 %: sobre 17 m son 5 m de desnivel; en llano, cero
  ok(Math.abs(VAL.desnivelRuina((x, z) => z * 0.3, 0, 0, 0) - 17 * 0.3) < 1e-9, 'el desnivel de la ruina en una ladera de 30 % es 5,1 m');
  ok(VAL.desnivelRuina(() => 2, 10, 10, 1.3) === 0, 'en llano, 0');
  const T = generarTerreno();
  const centro = BASE_REFUGIO;
  const ctx = (azar) => ({ centro, altura: (x, z) => T.altura(x, z), agua: (x, z) => T.agua(x, z), pendiente: (x, z) => T.pendiente?.[T.indice(x, z)] ?? 0, limite: LIMITE, azar });
  // el sorteo de antes (el primer sitio que cumple lo de siempre), para comparar sobre el mismo terreno
  const viejo = (azar) => {
    for (let i = 0; i < 60; i++) {
      const a = azar() * Math.PI * 2, r = 120 + azar() * 130;
      const x = centro.x + Math.cos(a) * r, z = centro.z + Math.sin(a) * r;
      if (Math.abs(x) > LIMITE - 40 || Math.abs(z) > LIMITE - 40 || T.agua(x, z)) continue;
      if ((T.pendiente?.[T.indice(x, z)] ?? 0) > 0.35) continue;
      return { x, z, rot: Math.atan2(centro.x - x, centro.z - z) + Math.PI };
    }
    return null;
  };
  let nuevos = 0, buenos = 0, viejosMalos = 0, viejos = 0;
  for (let s = 1; s <= 150; s++) {
    const n = VAL.elegirLugarRuina(ctx(semilla(s)));
    ok(n && Number.isFinite(n.x) && Number.isFinite(n.z) && Number.isFinite(n.rot), `hay ruina (semilla ${s})`);
    nuevos++;
    if (VAL.desnivelRuina(T.altura, n.x, n.z, n.rot) <= VAL.DESNIVEL_RUINA_MAX + 1e-9) buenos++;
    const v = viejo(semilla(s));
    if (v) { viejos++; if (VAL.desnivelRuina(T.altura, v.x, v.z, v.rot) > 1) viejosMalos++; }
  }
  ok(buenos / nuevos >= 0.95, `al menos 95 % de las ruinas nuevas tiene ≤ ${VAL.DESNIVEL_RUINA_MAX} m de desnivel (${buenos}/${nuevos})`);
  ok(viejosMalos / viejos > 0.3, `(y el sorteo de antes superaba el metro en ${viejosMalos}/${viejos}: la prueba discrimina)`);
  console.log(`  V1: ruinas con desnivel ≤ ${VAL.DESNIVEL_RUINA_MAX} m: ${buenos}/${nuevos}; el sorteo de antes pasaba el metro en ${viejosMalos}/${viejos}`);
  // el mismo terreno: ninguna ruina nueva cae al agua ni a menos de 40 m del borde
  for (let s = 1; s <= 40; s++) { const n = VAL.elegirLugarRuina(ctx(semilla(1000 + s))); ok(!T.agua(n.x, n.z) && Math.abs(n.x) <= LIMITE - 40 && Math.abs(n.z) <= LIMITE - 40, 'tierra firme y adentro del límite'); }
  // si ningún sitio llano existe, igual hay ruina (la más pareja)
  const empinado = VAL.elegirLugarRuina({ ...ctx(semilla(5)), altura: (x, z) => (x * 0.2 + z * 0.1), pendiente: () => 0.1 });
  ok(empinado && Number.isFinite(empinado.x), 'sin sitios llanos, igual hay ruina (el más pareja)');
  const ev = leer('src/desafio-eventos.js');
  ok(ev.includes('return elegirLugarRuina({ centro: api.centroBase()'), 'desafio-eventos.js usa elegirLugarRuina');
}

// ---------------------------------------------------------------- V2: el farol
{
  const { crearPiezasVecinos } = await import('../src/desafio-vecinos-piezas.js');
  const pz = crearPiezasVecinos();
  const farol = pz.fuego('farol'), farol2 = pz.fuego('farol'), fogon = pz.fuego('fogon');
  const alto = (f) => { f.llama.geometry.computeBoundingBox(); const b = f.llama.geometry.boundingBox; return (b.max.y - b.min.y) * f.llama.scale.y; };
  let maxFarol = 0, minFarol = 1e9, maxFogon = 0, minFogon = 1e9;
  for (let t = 0; t < 40; t += 0.37) {
    farol.titilar(t); fogon.titilar(t);
    maxFarol = Math.max(maxFarol, alto(farol)); minFarol = Math.min(minFarol, alto(farol));
    maxFogon = Math.max(maxFogon, alto(fogon)); minFogon = Math.min(minFogon, alto(fogon));
    ok(farol.llama.scale.x < 0.4 && farol.fina.scale.x === 0.32, 'la llama del farol no pasa de 0,4 de escala');
  }
  ok(maxFarol < 0.5, `la llama del farol mide como mucho ${maxFarol.toFixed(2)} m (antes 1,05 m, con una caja de vidrio de 0,24 m)`);
  ok(minFarol > 0.15, 'y no desaparece');
  // el fogón conserva lo que se veía: escala alrededor de 1
  { const g = pz.fuego('fogon'); g.titilar(0); ok(Math.abs(g.llama.scale.x - 1) < 0.08 && g.llama.scale.y > 0.8 && g.llama.scale.y < 1.2, 'el fogón titila alrededor de 1'); }
  ok(farol.brillo.material !== farol2.brillo.material && farol.brillo.material !== fogon.brillo.material, 'cada fuego tiene su material de brillo (cada uno pulsa con su fase)');
  farol.brillo.material.opacity = 0.1;
  ok(farol2.brillo.material.opacity !== 0.1, 'cambiarle la opacidad a uno no cambia la de los otros');
  const m = leer('src/desafio-vecinos-mundo.js');
  ok(m.includes('f.titilar(t);') && !m.includes('f.llama.scale.set(1 +'), 'el update titila sobre la escala de armado');
}

// ---------------------------------------------------------------- V3: las placas
{
  const { crearEvolucionMundo } = await import('../src/desafio-evolucion-mundo.js');
  const D = { evolucion: { niveles: { fuego: 3 }, noche: {}, ultimo: null } };
  const evo = crearEvolucionMundo({ chispas() {} }, {}, { D: () => D, nota() {} });
  const nuevo = (radio, altura) => ({ m: { g: new THREE.Group(), uniformes: () => null }, def: { radio, altura }, resiste: null });
  const azar = Math.random; Math.random = () => 0;   // el primero de la fila viene adaptado
  const a = nuevo(0.4, 1.2), b = nuevo(0.4, 1.2), c = nuevo(0.5, 1.7);
  try { evo.alBajar(a); evo.alBajar(b); evo.alBajar(c); } finally { Math.random = azar; }
  for (const x of [a, b, c]) {
    ok(x.resiste === 'fuego' && x.m.placas && x.m.placas.isMesh, 'el adaptado lleva las placas en UNA malla');
    ok(x.m.g.children.length === 1, `un solo dibujo por duende adaptado (tiene ${x.m.g.children.length}; antes 5)`);
    ok(x.m.placas.visible, 'visibles');
  }
  ok(a.m.placas.geometry === b.m.placas.geometry, 'dos duendes del mismo modelo comparten la geometría');
  ok(a.m.placas.geometry !== c.m.placas.geometry, 'otro modelo, otra geometría');
  // la forma es la de antes: cinco placas con la misma posición y giro que tenían como mallas sueltas
  {
    const g = new THREE.BoxGeometry(0.34, 0.42, 0.07, 4, 3, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) - x * x * 1.4); p.setY(i, y + 0.025 * Math.sin(x * 23)); p.setX(i, x * (1 - 0.15 * (y + 0.21))); }
    const r = 0.4 * 0.6, h = 1.2, esc = Math.max(0.3, Math.min(1.2, h / 1.6));
    const esperado = [];
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + 0.3, alto = i % 2 ? 0.36 : 0.47;
      const mesh = new THREE.Mesh(g);
      mesh.position.set(Math.sin(ang) * r, h * alto, Math.cos(ang) * r);
      mesh.rotation.set(-0.15, ang, (alto > 0.6 ? 0.2 : -0.2));
      mesh.scale.setScalar(esc);
      mesh.updateMatrix();
      for (let k = 0; k < p.count; k++) esperado.push(new THREE.Vector3().fromBufferAttribute(p, k).applyMatrix4(mesh.matrix));
    }
    const q = a.m.placas.geometry.attributes.position;
    ok(q.count === esperado.length, 'mismos vértices que las cinco placas');
    let peor = 0;
    for (let k = 0; k < q.count; k++) peor = Math.max(peor, Math.hypot(q.getX(k) - esperado[k].x, q.getY(k) - esperado[k].y, q.getZ(k) - esperado[k].z));
    ok(peor < 1e-5, `las placas fundidas están donde estaban (error ${peor.toExponential(1)})`);
    let finitos = true; for (let k = 0; k < q.count * 3; k++) if (!Number.isFinite(q.array[k])) finitos = false;
    ok(finitos, 'sin NaN');
    const n = a.m.placas.geometry.attributes.normal; let unidad = true;
    for (let k = 0; k < n.count; k++) if (Math.abs(Math.hypot(n.getX(k), n.getY(k), n.getZ(k)) - 1) > 1e-3) unidad = false;
    ok(unidad, 'normales unitarias');
    const idx = a.m.placas.geometry.index; let enRango = true; for (let k = 0; k < idx.count; k++) if (idx.getX(k) >= q.count) enRango = false;
    ok(enRango, 'índices en rango');
  }
  // al soltarse se esconden y al volver a bajar reaparecen (se reusa la malla)
  const malla = a.m.placas;
  evo.sacarPlacas(a);
  ok(!a.m.placas.visible, 'sacarPlacas las esconde');
  Math.random = () => 0; try { evo.alBajar(a); } finally { Math.random = azar; }
  ok(a.m.placas === malla && a.m.placas.visible && a.m.g.children.length === 1, 'al volver a bajar se reusa la misma malla');
  // el que no viene adaptado no tiene placas visibles
  D.evolucion.niveles = {};
  Math.random = () => 0; const d0 = nuevo(0.4, 1.2); try { evo.alBajar(d0); } finally { Math.random = azar; }
  ok(!d0.m.placas, 'sin adaptación, sin placas');
  // en desafio.js: al morir y al irse, las placas se esconden
  const des = leer('src/desafio.js');
  const morir = des.slice(des.indexOf("if (a.estado === 'morir') {"), des.indexOf("if (a.estado === 'irse') {"));
  const irse = des.slice(des.indexOf("if (a.estado === 'irse') {"), des.indexOf('// el saltador en el aire'));
  ok(morir.includes('a.m.placas.visible = false') && irse.includes('a.m.placas.visible = false'), 'morir e irse esconden las placas');
}

// ---------------------------------------------------------------- V5: los nidos de los lugares tomados
{
  // un campo de troncos de mentira (1 cada ~30 m²) y el chequeo del nido común (desafio.js): ningún tronco a menos de 1,5 m + su radio
  const azar = semilla(77);
  const troncos = [];
  for (let i = 0; i < 1000; i++) troncos.push({ x: (azar() - 0.5) * 140, z: (azar() - 0.5) * 140, r: 0.6 });
  const trabado = (x, z) => troncos.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.5);
  const zona = { id: 'estacion', x: 0, z: 0 };
  let sinPreferido = 0, conPreferido = 0, n = 0, sinNido = 0;
  for (let s = 1; s <= 200; s++) {
    const a = VAL.lugarNidoDeZona(zona, [], () => true, semilla(s));
    const b = VAL.lugarNidoDeZona(zona, [], () => true, semilla(s), (x, z) => !trabado(x, z));
    if (!a || !b) { sinNido++; continue; }
    n++;
    if (trabado(a.x, a.z)) sinPreferido++;
    if (trabado(b.x, b.z)) conPreferido++;
  }
  ok(sinNido === 0, 'siempre hay nido');
  ok(sinPreferido / n > 0.2, `(sin lo nuevo, ${sinPreferido}/${n} nidos quedaban trabados en este campo: la prueba discrimina)`);
  ok(conPreferido / n < 0.03, `con lo nuevo quedan trabados ${conPreferido}/${n}`);
  // si todo está trabado, igual hay nido (el primero que sirve)
  ok(VAL.lugarNidoDeZona(zona, [], () => true, semilla(3), () => false), 'sin sitio libre, igual hay nido');
  ok(VAL.lugarNidoDeZona(zona, [], () => false, semilla(3), () => true) === null, 'si no hay dónde, no hay nido');
  // y sin `preferido` es el de siempre
  const x1 = VAL.lugarNidoDeZona(zona, [], () => true, semilla(9)), x2 = VAL.lugarNidoDeZona(zona, [], () => true, semilla(9), null);
  ok(x1.x === x2.x && x1.z === x2.z, 'sin preferido, el mismo sitio de antes');
  const tm = leer('src/desafio-tomadas-mundo.js'), de = leer('src/desafio.js');
  ok(tm.includes('azarDe(d.semilla, nocheQueViene(), `nido-${z.id}-${hay}`), a.nidoLibre)'), 'sembrarNidos pasa nidoLibre');
  ok(de.includes('nidoLibre: (x, z) => !trabadoEn(x, z, NIDO_RADIO) && parejoEn(x, z, NIDO_RADIO * 0.8, 0.45)'), 'desafio.js lo arma como el nido común');
}

// ---------------------------------------------------------------- V6: las patas del Coihue
{
  // (un lienzo de mentira para el halo de los hongos)
  const noop = () => {};
  const ctx2d = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), measureText: () => ({ width: 10 }) }, { get: (t, p) => (p in t ? t[p] : noop), set: () => true });
  globalThis.document = globalThis.document || { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctx2d }) };
  const F = await import('../src/desafio-coihue-formas.js');
  const T = generarTerreno();
  const co = F.armarCoihueViejo();
  co.g.scale.setScalar(F.COIHUE.escala);
  const esc = F.COIHUE.escala;
  const sube = (x, z, giro, calzar) => {
    co.g.position.set(x, T.altura(x, z), z); co.g.rotation.set(0, giro, 0); co.g.updateMatrixWorld(true);
    F.animarCoihue(co, 0, 0);
    if (calzar) F.calzarPatasCoihue(co, T.altura, x, z, giro);
    const devs = [];
    for (const p of co.patas) {
      const P = p.piv.position, s = Math.sin(p.a), c = Math.cos(p.a);
      const punta = new THREE.Vector3(s * p.alcance, -0.3, c * p.alcance).sub(P).applyQuaternion(p.piv.quaternion).add(P).applyMatrix4(co.g.matrixWorld);
      ok(Number.isFinite(punta.x) && Number.isFinite(punta.y), 'la punta es un número');
      devs.push(punta.y - (T.altura(punta.x, punta.z) - 0.3 * esc));   // 0: la punta está donde estaba en llano (0,3 m hundida)
    }
    return devs;
  };
  const azar = semilla(31);
  let antes = 0, despues = 0, total = 0, grandeAntes = 0, grandeDespues = 0;
  for (let k = 0, n = 0; n < 250 && k < 100000; k++) {
    const x = (azar() * 2 - 1) * (LIMITE - 80), z = (azar() * 2 - 1) * (LIMITE - 80), i = T.indice(x, z);
    if (T.agua(x, z) || (T.pendiente[i] ?? 0) > 0.55 || (T.distRiel?.[i] ?? 99) < 9) continue;
    n++;
    const giro = azar() * Math.PI * 2;
    const pos0 = co.patas.map((p) => p.piv.position.clone());
    const a = sube(x, z, giro, false), d = sube(x, z, giro, true);
    co.patas.forEach((p, j) => ok(p.piv.position.distanceTo(pos0[j]) < 1e-9, 'el pivote (la raíz en el tronco) no se mueve'));
    for (let j = 0; j < 6; j++) { total++; if (Math.abs(a[j]) > 1) antes++; if (Math.abs(d[j]) > 1) despues++; }
  }
  ok(antes / total > 0.3, `(antes, ${antes}/${total} puntas quedaban a más de 1 m de su sitio: la prueba discrimina)`);
  ok(despues / total < 0.1, `con el calce quedan a más de 1 m ${despues}/${total}`);
  console.log(`  V6: puntas a más de 1 m de su sitio: antes ${antes}/${total}, con el calce ${despues}/${total}`);
  // en llano no cambia nada
  const plano = { altura: () => 5 };
  co.g.position.set(0, 5, 0); co.g.rotation.set(0, 0.7, 0); co.g.updateMatrixWorld(true);
  F.animarCoihue(co, 0, 0);
  const qs = co.patas.map((p) => p.piv.quaternion.clone());
  const fis = F.calzarPatasCoihue(co, plano.altura, 0, 0, 0.7);
  ok(fis.every((f) => Math.abs(f) < 1e-4), 'en llano, el calce es 0');
  co.patas.forEach((p, j) => ok(p.piv.quaternion.angleTo(qs[j]) < 1e-4, 'y las patas no se mueven'));
  ok(leer('src/desafio-asedio-mundo.js').includes('calzarPatasCoihue(n, T.altura, px, pz, n.giro);'), 'el asedio calza las patas después de animarlas');
}

console.log(`4.10.3 visual: ${pasos} pasos OK`);
