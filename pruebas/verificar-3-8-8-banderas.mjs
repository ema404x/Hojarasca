// 3.8.8: las banderas flamean según el viento y el clima. Se prueba lo que se puede en Node (el flameo en sí es del vertex shader y se
// miró en una vista previa con calma, brisa, temporal y lluvia):
//   · el rumbo del viento es el mismo que el del pasto;
//   · el paño trae sus atributos (a, b, L, A y los ejes) bien calculados;
//   · el material engancha el viento, la lluvia y el tiempo del clima y conserva la niebla de siempre;
//   · una bandera se orienta con el viento (con cualquier giro de base y del padre) y lo sigue cuando cambia;
//   · todas están conectadas: las de la aldea (plaza, escuela, seccional) y las dos de la casa de té; y la de adentro, no.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const THREE = globalThis.THREE || (await import('three'));
const B = await import('../src/bandera-viento.js');
const { U } = await import('../src/materiales.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. el rumbo, el mismo que el del pasto
{
  const pasto = leer('src/pasto.js');
  ok(/normalize\(vec2\(1\.0, 0\.35\)\)/.test(pasto), 'el pasto sopla hacia normalize(1, 0,35)');
  ok(Math.abs(B.RUMBO_VIENTO.x - 1 / Math.hypot(1, 0.35)) < 1e-9 && Math.abs(B.RUMBO_VIENTO.z - 0.35 / Math.hypot(1, 0.35)) < 1e-9, 'el rumbo de las banderas es ese');
  // un paño sin girar apunta a (cos ψ, 0, −sin ψ): con ψ = ANGULO_VIENTO es el rumbo
  ok(Math.abs(Math.cos(B.ANGULO_VIENTO) - B.RUMBO_VIENTO.x) < 1e-9 && Math.abs(-Math.sin(B.ANGULO_VIENTO) - B.RUMBO_VIENTO.z) < 1e-9, 'y el ángulo de giro lo apunta ahí');
}

// ---------------------------------------------------------------- 2. los atributos del paño
{
  const L = 1.5, A = 0.95;
  const g = new THREE.PlaneGeometry(L, A, 28, 8); g.translate(L / 2, -A / 2, 0);
  B.prepararPano(g, { along: [1, 0, 0], lat: [0, 0, 1], esquina: [0, 0, 0], L, A });
  const cuenta = g.attributes.position.count;
  ok(g.attributes.aBand.count === cuenta && g.attributes.aBand.itemSize === 4 && g.attributes.aAlong.itemSize === 3 && g.attributes.aLat.itemSize === 3, 'tres atributos por vértice');
  let amin = 1e9, amax = -1e9, bmin = 1e9, bmax = -1e9;
  for (let i = 0; i < cuenta; i++) { const a = g.attributes.aBand.getX(i), b = g.attributes.aBand.getY(i); amin = Math.min(amin, a); amax = Math.max(amax, a); bmin = Math.min(bmin, b); bmax = Math.max(bmax, b); ok(g.attributes.aBand.getZ(i) === Math.fround(L), 'el largo en cada punto'); }
  ok(Math.abs(amin) < 1e-6 && Math.abs(amax - L) < 1e-6 && Math.abs(bmin + A) < 1e-6 && Math.abs(bmax) < 1e-6, `a de 0 a ${L} (hacia la punta) y b de −${A} a 0 (hacia abajo)`);
  // con un giro: el eje a lo largo gira con el paño (la bandera de un mástil de la aldea)
  const gb = 0.7, cg = Math.cos(gb), sg = Math.sin(gb);
  const g2 = new THREE.PlaneGeometry(L, A, 4, 2);   // un rectángulo en el plano x-y, que giro a mano sobre Y
  g2.translate(L / 2, A / 2, 0); g2.rotateY(gb);
  B.prepararPano(g2, { along: [cg, 0, -sg], lat: [sg, 0, cg], esquina: [0, A, 0], L, A });
  let max2 = 0; for (let i = 0; i < g2.attributes.position.count; i++) max2 = Math.max(max2, g2.attributes.aBand.getX(i));
  ok(Math.abs(max2 - L) < 1e-5, 'con el paño girado, a sigue yendo de 0 a L');
}

// ---------------------------------------------------------------- 3. el material
{
  const m = B.materialBandera({ vertexColors: true });
  ok(m.isMeshLambertMaterial && m.side === THREE.DoubleSide && m.vertexColors === true, 'un Lambert de dos caras con colores por vértice');
  const sh = { uniforms: {}, vertexShader: '#include <common>\nvoid main(){\n#include <begin_vertex>\n}', fragmentShader: '#include <common>\nvoid main(){\n#include <color_fragment>\n#include <fog_fragment>\n}' };
  m.onBeforeCompile(sh);
  ok(sh.uniforms.uTiempo === U.uTiempo && sh.uniforms.uViento === U.uViento && sh.uniforms.uLluvia === U.uLluvia, 'toma el tiempo, el viento (con las rachas) y la lluvia del clima');
  ok(!sh.vertexShader.includes('#include <begin_vertex>') && /aBand/.test(sh.vertexShader) && /uViento/.test(sh.vertexShader) && /uLluvia/.test(sh.vertexShader), 'el flameo reemplaza al begin_vertex');
  for (const que of ['cuelga', 'calma', 'racha', 'fase', 'pliegue']) ok(sh.vertexShader.includes(que), `el shader tiene: ${que}`);
  ok(sh.fragmentShader.includes('vTonoBandera') && !sh.fragmentShader.includes('#include <fog_fragment>'), 'el tono de las crestas, y la niebla de siempre (con techo) sigue');
  ok(m.customProgramCacheKey() === B.materialBandera().customProgramCacheKey(), 'un solo programa para todas las banderas');
}

// ---------------------------------------------------------------- 4. se orienta con el viento
{
  const mundo = (o) => o.rotation.y + (o.parent ? o.parent.rotation.y : 0);
  for (const [base, padre] of [[0, 0], [0, 1.9], [0.8, -0.6], [-2.4, 3.0]]) {
    const o = { rotation: { y: 0 }, parent: { rotation: { y: padre } }, id: 7 };
    for (let i = 0; i < 400; i++) B.orientarBandera(o, base, 0.1, 1.0, i * 0.1);
    let d = mundo(o) + base - B.ANGULO_VIENTO; d = Math.atan2(Math.sin(d), Math.cos(d));
    ok(Math.abs(d) < 0.3, `con viento fuerte (base ${base}, padre ${padre}) apunta con el viento (error ${d.toFixed(2)} rad)`);
  }
  // con poco viento sigue más flojo: se mueve más alrededor del rumbo que con viento fuerte
  const abanico = (v) => { const o = { rotation: { y: 0 }, parent: { rotation: { y: 0 } }, id: 3 }; let lo = 9, hi = -9; for (let i = 0; i < 1500; i++) { B.orientarBandera(o, 0, 0.1, v, i * 0.1); if (i > 300) { lo = Math.min(lo, o.rotation.y); hi = Math.max(hi, o.rotation.y); } } return hi - lo; };
  ok(abanico(0.15) > abanico(1.1), `con poco viento da más vueltas que con temporal (${abanico(0.15).toFixed(2)} contra ${abanico(1.1).toFixed(2)} rad)`);
  // y el registro de las sueltas se actualiza con un cuadro
  const g = new THREE.Group(); const padre = new THREE.Group(); padre.rotation.y = 0.5; padre.add(g);
  const antes = B.cuantasBanderas();
  B.registrarBandera(g, 0);
  ok(B.cuantasBanderas() === antes + 1, 'se registra');
  const y0 = g.rotation.y; B.actualizarBanderas(0.5);
  ok(g.rotation.y !== y0, 'y se orienta con un cuadro');
  const pano = B.crearPanoBandera(1.5, 0.95, null);
  ok(pano.children.length === 1 && pano.children[0].geometry.attributes.aBand && pano.children[0].material.isMeshLambertMaterial, 'un paño suelto: un grupo con la malla y su material');
}

// ---------------------------------------------------------------- 5. todas las banderas, conectadas
{
  const aq = leer('src/aldea-arquitectura.js'), am = leer('src/aldea-mundo.js'), amm = leer('src/aldea-mecanicas-mundo.js'), est = leer('src/estructuras.js'), main = leer('src/main.js');
  ok(/K\.animable\('bandera'[\s\S]*?material: 'bandera'[\s\S]*?giroBase: giro/.test(aq), 'la bandera de los mástiles de la aldea lleva el material y el giro de base');
  ok(/const onda = \(\) => 0;/.test(aq) && /const seg = 14;/.test(aq), 'sin la onda pintada en la malla, y con cortes para ondear');
  ok(am.includes('bandera: materialBandera({ vertexColors: true })') && am.includes('prepararPano(a.geometria'), 'la aldea arma el material y prepara el paño');
  ok(amm.includes('orientarBandera(b.objeto, b.dato?.giroBase ?? 0, dt)'), 'y las orienta al viento en cada cuadro (la plaza, la escuela y la seccional son todas banderas animables)');
  ok((est.match(/registrarBandera\(crearPanoBandera\(/g) || []).length === 2 && est.includes("userData.bandera = 'argentina'") && est.includes("userData.bandera = 'galesa'"), 'las dos de la casa de té, en un mismo mástil');
  ok(!/function panoBandera/.test(est), 'ya no queda el plano fijo');
  ok(main.includes("import { actualizarBanderas } from './bandera-viento.js';") && main.includes('actualizarBanderas(dt);'), 'main.js las orienta en cada cuadro');
  // la de adentro (el banner de la pared) no flamea: no hay viento adentro
  ok(/lienzoTextura\(380, 248, banderaGalesa\)/.test(est), 'la bandera galesa de la pared de adentro sigue quieta (es un cuadro)');
  for (const f of ['src/bandera-viento.js']) for (const m of leer(f).matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}) from '[^']+';$/.test(m[0]), `import en una línea: ${m[0]}`);
  for (const m of leer('src/bandera-viento.js').matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `exportado sin ñ: ${m[1]}`);
}
console.log(`verificar-3-8-8-banderas: ${n} verificaciones ok`);
