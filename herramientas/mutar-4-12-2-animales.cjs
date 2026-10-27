// 4.12.2 (animales con huesos): rompe a propósito cada regla y confirma que verificar-4-12-2-animales.mjs falla.
// Cada mutación cambia un trozo de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-12-2-animales.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-12-2-animales.mjs');

const PI = 'src/animales-piel.js', CA = 'src/caballo-mundo.js', PE = 'src/perro.js', BI = 'src/bichos.js', VI = 'src/vida.js', GE = 'src/gente.js';
const MUTACIONES = [
  // ---- calidad y LOD
  ['Baja también arma la piel', PI, "return c === 'media' || c === 'alta'; }", 'return true; }'],
  ['Mínima también arma la piel', PI, "return c === 'media' || c === 'alta'; }", "return c !== 'x'; }"],
  ['la piel se usa de lejos', PI, 'export const CERCA_PIEL = 40;', 'export const CERCA_PIEL = 200;'],
  ['sin histéresis en el borde del LOD', PI, 'export const HISTERESIS_PIEL = 6;', 'export const HISTERESIS_PIEL = 0;'],
  ['la malla rígida no se esconde con la piel', PI, 'for (const r of rigidas) r.visible = !si;', ''],
  ['la piel no se esconde de lejos', PI, 'malla.visible = si;', 'malla.visible = true;'],
  ['el LOD ignora la calidad en vivo', PI, '      if (!pielPermitida()) return p.mostrar(false);\n', ''],
  ['la calidad no se vuelve a leer', PI, 't - calidadT > 3000', 't - calidadT > 3e12'],
  ['el programa de la carga no se precompila', GE, '    try { precalentarPiel(escena, camara, dibujar); } catch (err) { console.warn(\'piel de los animales:\', err); }\n', ''],
  ['la malla de precompilado no proyecta sombra', PI, 'malla.castShadow = true; malla.frustumCulled = false;', 'malla.castShadow = false; malla.frustumCulled = false;'],
  ['la malla de precompilado se queda en la escena', PI, '    escena.remove(malla);\n    geo.dispose();', '    geo.dispose();'],
  ['el precompilado corre en Baja', PI, 'if (!pielPermitida() || !escena || !camara) return false;', 'if (!escena || !camara) return false;'],
  // ---- la misma forma y el mismo pelaje
  ['la piel cambia los colores pintados', PI, 'col[j * 3] = C.getX(i);', 'col[j * 3] = C.getX(i) * 0.9;'],
  ['la piel mueve los vértices', PI, 'pos[j * 3] = v.x; pos[j * 3 + 1] = v.y;', 'pos[j * 3] = v.x * 1.02; pos[j * 3 + 1] = v.y;'],
  ['la piel se arma con un material propio', PI, 'new MallaConPiel(geo, MAT_FAUNA, esfera)', 'new MallaConPiel(geo, new THREE.MeshLambertMaterial({ vertexColors: true }), esfera)'],
  ['la piel pierde triángulos', PI, '    if (geo.index) for (let i = 0; i < geo.index.count; i++) ind[oi++] = geo.index.getX(i) + ov;', '    if (geo.index) for (let i = 0; i < geo.index.count - 3; i++) ind[oi++] = geo.index.getX(i) + ov;'],
  ['los pesos no se normalizan', PI, 'sw[j * 4 + r] = vale ? ws[r] / tot : 0;', 'sw[j * 4 + r] = vale ? ws[r] : 0;'],
  ['en reposo la matriz de un hueso no es la identidad', PI, 'out[o + 12] = e[12] - (e[0] * ax + e[4] * ay + e[8] * az);', 'out[o + 12] = e[12];'],
  ['la pata no pesa en el tramo de en medio', PI, 'sumar(hueso(k, 1), resto * bajo * (1 - pie));', ''],
  ['el menudillo sin hueso', PI, 'sumar(hueso(k, 2), resto * bajo * pie);', 'sumar(hueso(k, 1), resto * bajo * pie);'],
  ['las orejas no tienen hueso', PI, '      } else if (enCabeza && tag === ETIQUETA.oreja) {', '      } else if (false) {'],
  ['la cola no tiene huesos', PI, '      } else if (enCola || tag === ETIQUETA.cola) {', '      } else if (false) {'],
  ['el cuello del ciervo no tiene huesos', PI, '      } else if (enCuello || tag === ETIQUETA.cuello) {', '      } else if (enCuello) {'],
  ['la cola del caballo sin etiqueta', CA, "[0.06, 0.075, 0.07], 6, 10), 'cola'));", '[0.06, 0.075, 0.07], 6, 10)));'],
  ['las orejas del caballo sin etiqueta', CA, "cabeza.add(etiquetar(conPelaje(oreja), 'oreja'));", 'cabeza.add(conPelaje(oreja));'],
  ['el atributo etiqueta no llega a la malla fundida', VI, "    if (eti) geo.setAttribute('etiqueta', new THREE.BufferAttribute(eti, 1));\n", ''],
  ['la bounding sphere se queda corta', PI, 'geo.boundingSphere.radius * 1.3 + 0.3', 'geo.boundingSphere.radius * 0.5'],
  ['el esqueleto no libera su tramo', PI, '  lugar.pagina.libres.push(lugar.base / HUESOS_ANIMAL);\n', ''],
  ['la textura de huesos es enorme', PI, 'export const LADO_PAGINA = 64;', 'export const LADO_PAGINA = 512;'],
  // ---- las marchas
  ['la amplitud del caballo salta entre marchas', PI, 'S.amp = mezcla(S.amp, objAmp, suavizado(dt, 9));', 'S.amp = objAmp;'],
  ['el galope del caballo cambia la fase de golpe', PI, 'S.gal = mezcla(S.gal, c.galope ? 1 : 0, suavizado(dt, 4.5));\n  const intens = Math.min(1, S.amp / 0.7);', 'S.gal = c.galope ? 1 : 0;\n  const intens = Math.min(1, S.amp / 0.7);'],
  ['el perro apaga las patas de golpe', PI, 'S.anda = mezcla(S.anda, c.anda ? 1 : 0, suavizado(dt, 9));', 'S.anda = c.anda ? 1 : 0;'],
  ['la zancada posterior del ciervo salta', PI, 'S.post = mezcla(S.post, c.posterior, suavizado(dt, 6));', 'S.post = c.posterior;'],
  ['la amplitud del ciervo salta', PI, 'S.amp = mezcla(S.amp, c.amplitud, suavizado(dt, 9));', 'S.amp = c.amplitud;'],
  ['las patas no doblan carpo y garrón', PI, '  p.r(hueso(k, 1), med, 0, 0);', '  p.r(hueso(k, 1), 0, 0, 0);'],
  ['las patas giran de más', PI, '  p.r(hueso(k, 0), a, 0, 0);', '  p.r(hueso(k, 0), a * 3, 0, 0);'],
  ['la pata se levanta a los saltos', PI, 'return c * c * (3 - 2 * c); }', 'return c > 0 ? 1 : 0; }'],
  ['la columna no se arquea al galope', PI, 'p.r(HUESO.PELVIS, gal * 0.075 * Math.sin(fase + 1.0),', 'p.r(HUESO.PELVIS, gal * 0 * Math.sin(fase + 1.0),'],
  ['la columna se arquea al revés (la piel se estira)', PI, 'p.r(HUESO.TORAX, -gal * 0.065 * Math.sin(fase + 1.0),', 'p.r(HUESO.TORAX, gal * 0.9 * Math.sin(fase + 1.0),'],
  ['el cuello no se curva en el segundo hueso', PI, 'p.r(HUESO.CUELLO2, 0.36 * t + extra.c2, 0.3 * giro, 0);', 'p.r(HUESO.CUELLO2, 0, 0, 0);'],
  ['el cuello reparte mal el ángulo', PI, 'p.r(HUESO.CABEZA, 0.3 * t + extra.c3, 0.5 * giro, 0);', 'p.r(HUESO.CABEZA, 0.02 * t + extra.c3, 0.5 * giro, 0);'],
  ['el cuello del caballo ignora el pivote rígido', PI, 'cuelloYCabeza(p, m.cuello.rotation.x, m.cuello.rotation.y,', 'cuelloYCabeza(p, 0, m.cuello.rotation.y,'],
  ['la cabeza del ciervo ignora el pivote rígido', PI, 'cuelloYCabeza(p, m.cabeza.rotation.x, m.cabeza.rotation.y, { c1: cabeceo * 0.5 - alerta * 0.12', 'cuelloYCabeza(p, 0, m.cabeza.rotation.y, { c1: cabeceo * 0.5 - alerta * 0.12'],
  ['el perro ignora la sentada', PI, 'const a = m.patas[k].rotation.x - crudo + Math.sin(ph) * 0.7 * S.anda;', 'const a = Math.sin(ph) * 0.7 * S.anda;'],
  ['la cola del perro no sigue al pivote', PI, 'S.cola[0] = mezcla(S.cola[0], m.cola.rotation.z, suavizado(dt, 22));', 'S.cola[0] = 0;'],
  ['las orejas del ciervo no se paran en alerta', PI, 'orejaAdelante: alerta, orejaX: -alerta * 0.1,', 'orejaAdelante: 0, orejaX: 0,'],
  // ---- los ganchos y lo que no se toca
  ['el caballo no pone la pose con huesos', CA, '    if (m.piel?.lod(m.g)) m.piel.posar(dt, m, { fase: est.fase, modo: mc.modo, amplitud: mc.amplitud, galope, montado });', ''],
  ['el perro no pone la pose con huesos', PE, "    if (m.piel?.lod(m.g)) m.piel.posar(dt, m, { paso: est.paso, anda, vel: est.vel, sentado: est.sentado || 0, marcando: est.estado === 'marcar' });", ''],
  ['el ciervo no pone la pose con huesos', BI, '      posarPielMamifero(c, dt, PRM_CIERVO);\n', ''],
  ['el huemul no pone la pose con huesos', VI, '      posarPielMamifero(a, dt, PRM_HUEMUL);\n', ''],
  ['bichos no avisa dónde está la cámara', BI, '    observar(camara.position);', ''],
  ['el perro no avisa dónde está la cámara', PE, '    observar(camara?.position);', ''],
  ['personalizar el perro deja la piel vieja', PE, '    m.piel?.liberar();\n', ''],
  ['personalizar el caballo no toma la piel nueva', CA, 'm.patas = n.patas; m.piel = n.piel;', 'm.patas = n.patas;'],
  ['la IA del ciervo cambia el rumbo', VI, '  a.g.rotation.y = a.rumbo;\n  const marcha', '  a.g.rotation.y = a.rumbo + 0.01;\n  const marcha'],
  ['la piel mueve al animal', PI, '  const S = p.S, t = (S.t += dt);\n  const objAmp', '  m.g.position.y = 0;\n  const S = p.S, t = (S.t += dt);\n  const objAmp'],
  ['la piel toca la montura', PI, 'export const NUM_HUESOS =', 'export const sulkyEnganchado = false;\nexport const NUM_HUESOS ='],
  ['la piel escribe un pivote rígido', PI, '  cuerpoEnMarcha(p, c.fase, intens, S.gal);\n  // el cuello: lo que pide el rígido (pasta, galopa)', '  cuerpoEnMarcha(p, c.fase, intens, S.gal);\n  m.cuello.rotation.y = 0.1;\n  // el cuello: lo que pide el rígido (pasta, galopa)'],
  ['el rebote del caballo cambia', CA, 'Math.abs(Math.sin(est.fase)) * 0.05 * mc.amplitud', 'Math.abs(Math.sin(est.fase)) * 0.06 * mc.amplitud'],
  ['el pivote rígido de las patas del caballo cambia', CA, "p.rotation.x = mc.modo === 'quieto' ? 0 : Math.sin(est.fase + (galope ? par : diag)) * mc.amplitud;", "p.rotation.x = mc.modo === 'quieto' ? 0 : Math.sin(est.fase + (galope ? par : diag)) * mc.amplitud * 0.9;"],
  ['un shader propio para la piel', PI, 'malla.name = \'piel-\' + (esp.nombre || \'animal\');', 'malla.material = Object.assign(new THREE.MeshLambertMaterial({ vertexColors: true }), { onBeforeCompile: (s) => s });'],
];

const solo = process.env.SOLO;
const aprobadas = [], vivas = [];
for (const [nombre, archivo, viejo, nuevo] of MUTACIONES) {
  if (solo && !nombre.includes(solo)) continue;
  const ruta = path.join(raiz, archivo);
  const original = fs.readFileSync(ruta, 'utf8');
  if (!original.includes(viejo)) { console.log('NO ENCONTRADA  ' + nombre); vivas.push(nombre + ' (no encontrada)'); continue; }
  fs.writeFileSync(ruta, original.replace(viejo, () => nuevo));
  let r;
  try { r = spawnSync(process.execPath, [prueba], { cwd: raiz, encoding: 'utf8', timeout: 300000 }); }
  finally { fs.writeFileSync(ruta, original); }
  const falla = r.status !== 0;
  console.log((falla ? 'atrapada       ' : 'SOBREVIVIÓ     ') + nombre + (falla ? '  ← ' + ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || '').slice(0, 110) : ''));
  (falla ? aprobadas : vivas).push(nombre);
}
console.log(`\n${aprobadas.length} atrapadas, ${vivas.length} sobrevivieron${vivas.length ? ': ' + vivas.join(' | ') : ''}`);
process.exit(vivas.length ? 1 : 0);
