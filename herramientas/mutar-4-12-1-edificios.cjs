// 4.12.1 (edificios y luz): rompe a propósito cada regla y confirma que verificar-4-12-1-edificios.mjs falla.
// Cada mutación cambia un trozo de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-12-1-edificios.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-12-1-edificios.mjs');

const AS = 'src/asentado.js', AM = 'src/asentado-mundo.js', CO = 'src/construccion.js', ES = 'src/estructuras.js', MA = 'src/main.js', AL = 'src/aldea-mundo.js';
const MUTACIONES = [
  // ---- la semilla de cada edificio
  ['la semilla ignora la posición', AS, "  mezclar(Math.round((Number(x) || 0) * 10) | 0);\n", ''],
  ['la semilla ignora el id', AS, '  for (let i = 0; i < s.length; i++) mezclar(s.charCodeAt(i));\n', ''],
  ['azarDe ignora el índice', AS, '(Math.imul((sem | 0) ^ 0x9e3779b9, 374761393) + Math.imul(i | 0, 668265263))', '(Math.imul((sem | 0) ^ 0x9e3779b9, 374761393))'],
  ['el desgaste gasta números al azar del juego', AS, 'const s1 = sem ^ 0x1234567', 'const s1 = (Math.random() * 4e9) | 0'],
  // ---- el teselado
  ['el teselado cambia los colores', AS, 'pozo[r + c] = (pozo[P + c] + pozo[Q + c]) / 2;', 'pozo[r + c] = (pozo[P + c] + pozo[Q + c]) / 2.1;'],
  ['el teselado pierde el orden de las piezas', AS, '      desde[q] = nOut;\n', '      desde[q] = 0;\n'],
  ['el teselado parte los listones finos', AS, '(2 * area) / mayor >= 0.15', '(2 * area) / mayor >= 0'],
  ['el teselado se pasa del tope', AS, '        if (nOut + pila.length / 3 > tope / 3) return null;\n', ''],
  ['el teselado deforma la caja', AS, 'const m = medio(pa, pb);', 'const m = medio(pa, pc);'],
  // ---- la oclusión
  ['sin oscurecer el pie', AS, '    oc += pegado * 0.7;', '    oc += pegado * 0;'],
  ['sin sombra bajo el alero', AS, '      oc += alero * 0.9;', '      oc += alero * 0;'],
  ['la panza del techo sin sombra', AS, '    if (uy < -0.5) oc += 0.55 * Math.min(1, (-uy - 0.5) * 3);', '    if (uy < -0.5) oc += 0 * Math.min(1, (-uy - 0.5) * 3);'],
  ['las caras se oscurecen con su propia pared', AS, '      if (delante < h * 0.95) continue;', '      if (delante < -9) continue;'],
  ['sin rincón entrante', AS, '      suma += (1 - d / R) * Math.min(1, (delante / d) * 1.3);', '      suma += 0 * (1 - d / R) * Math.min(1, (delante / d) * 1.3);'],
  ['oscurece de más', AS, 'export const OCLUSION = { celda: 0.28, fuerza: 0.7,', 'export const OCLUSION = { celda: 0.28, fuerza: 0.97,'],
  ['la oclusión se pasa del tope de vértices', AS, "const m = leer(geo, o.maxVerts ?? OCLUSION.maxVerts);", "const m = leer(geo, 1e9);"],
  // ---- el desgaste
  ['una obra nueva se mancha', AS, 'nivel = Math.min(1, Math.max(0, o.nivel ?? 0.3))', 'nivel = Math.min(1, Math.max(0.5, o.nivel ?? 0.3))'],
  ['el matiz propio es enorme', AS, 'const tono = 1 + (azarDe(sem, 1) - 0.5) * 0.06;', 'const tono = 1 + (azarDe(sem, 1) - 0.5) * 0.6;'],
  ['sin humedad al pie', AS, 'const k = nivel * cuantoPie *', 'const k = 0 * nivel * cuantoPie *'],
  ['el musgo no distingue la sombra', AS, 'const dispone = arriba * 0.6 + sombra * 0.4 * (1 - suave(0.4, 2.8, alto)) + sombra * arriba * 0.3;', 'const dispone = arriba * 0.6 + 0.2;'],
  ['la sombra cae del lado del sol', AS, 'const wnz = -ux * sr + uz * cr;', 'const wnz = -(-ux * sr + uz * cr);'],
  ['la casa girada no cambia su sombra', AS, 'const wnz = -ux * sr + uz * cr;', 'const wnz = uz;'],
  ['sin musgo en los techos', AS, 'const arriba = suave(0.2, 0.7, uy);', 'const arriba = 0;'],
  ['musgo chillón', AS, 'const MUSGO = [0.67, 1.16, 0.37];', 'const MUSGO = [0.2, 2.6, 0.1];'],
  // ---- la huella y el interruptor
  ['la huella incluye el techo', AS, '    if (y < base - 0.45 || y > base + banda) continue;', '    if (false) continue;'],
  ['asentarGeometria ignora el interruptor', AS, 'if (CONFIG.ocluir && o.ocluir !== false) ocl = ocluirGeometria(geo, o);', 'if (o.ocluir !== false) ocl = ocluirGeometria(geo, o);'],
  ['Baja también se asienta', AS, '  CONFIG.ocluir = !!o.ocluir;', '  CONFIG.ocluir = true;'],
  // ---- la sombra de contacto
  ['el anillo no oscurece', AM, '    col.push(fuerza * 0.9, fuerza * 0.96, fuerza, 0, 0, 0);', '    col.push(0, 0, 0, 0, 0, 0);'],
  ['el anillo tiene borde duro', AM, '    col.push(fuerza * 0.9, fuerza * 0.96, fuerza, 0, 0, 0);', '    col.push(fuerza * 0.9, fuerza * 0.96, fuerza, fuerza, fuerza, fuerza);'],
  ['el anillo flota sobre el terreno', AM, "(px, pz) => altura(px, pz) + 0.05", "(px, pz) => altura(px, pz) + 2"],
  ['el anillo con niebla', AM, 'depthWrite: false, fog: false', 'depthWrite: false, fog: true'],
  ['la sombra mezcla como pintura', AM, 'blending: BLEND_RESTA, premultipliedAlpha: true,', 'blending: 1, premultipliedAlpha: true,'],
  ['la sombra se dibuja dos veces', AM, 'side: THREE.DoubleSide, forceSinglePass: true,', 'side: THREE.DoubleSide,'],
  ['la sombra escribe profundidad', AM, 'depthWrite: false, fog: false', 'depthWrite: true, fog: false'],
  ['la sombra de lo lejano queda sola', AM, '      if (cam && (h.x - cam.x) * (h.x - cam.x) + (h.z - cam.z) * (h.z - cam.z) > c2) continue;\n', ''],
  ['la sombra se rehace cada cuadro', AM, 'if ((sucio && reloj > 0.35) || (movido && reloj > 1.5))', 'if (true)'],
  ['la sombra igual de noche', AM, 'mat.color.setScalar(0.28 + 0.72 * dia * (1 - nublado * 0.35));', 'mat.color.setScalar(1);'],
  ['la sombra se dibuja en Baja', AM, '    if (!pleno) { malla.visible = false; return; }\n', ''],
  // ---- los halos
  ['halos de día', AM, '    malla.visible = cerca;', '    malla.visible = total > 0;'],
  ['halos de lejos', AM, 'if (dx * dx + dz * dz < a2) { cerca = true; break; }', 'if (true) { cerca = true; break; }'],
  ['halos que no se apagan con el alumbrado', AM, "soloNoche: h.soloNoche !== false", 'soloNoche: false'],
  ['los halos rehacen la malla siempre', AM, '    if (f === firma) return false;\n', ''],
  ['las ventanas juntas en una', AM, 'ventanasDeVidrio(raiz, materiales, { junta = 1.1,', 'ventanasDeVidrio(raiz, materiales, { junta = 90,'],
  // ---- el enganche
  ['las obras se asientan en Baja', CO, 'if (!asentadoActivo().ocluir || !datos', 'if (!datos'],
  ['una obra a medio hacer se mancha', CO, 'const nivel = terminada ? (', 'const nivel = true ? ('],
  ['todas las casas con el mismo aspecto', CO, 'semillaDe(datos.x, datos.z, plano.id)', 'semillaDe(0, 0, plano.id)'],
  ['las marcas de zona no siguen al teselado', CO, '    remarcarRangos(marcas, tesela);\n', ''],
  ['sombra de contacto sobre un piso propio', CO, '    if (Number.isFinite(d.y) && d.y > T.altura(d.x, d.z) + 0.25) return;\n', ''],
  ['los canteros con sombra de contacto', CO, '!(d.etapas > 0) || p.jardin ||', '!(d.etapas > 0) ||'],
  ['la sombra queda al retirar la obra', CO, '    asiento?.quitar(obra);\n    if (obra.luzInterior)', '    if (obra.luzInterior)'],
  ['la sombra queda al mover con Shift+Y', CO, '    asiento?.quitar(mejor);\n', ''],
  ['sombra de contacto exagerada', CO, 'fuerza: grande > 10 ? 0.5 : 0.4', 'fuerza: grande > 10 ? 0.94 : 0.9'],
  ['el refugio no corre sus marcas', ES, 'remarcarRangos(marcas, teselarGeometria(', 'void (marcas, teselarGeometria('],
  ['las estructuras se asientan en Baja', ES, '    if (A.ocluir) {\n      remarcarRangos', '    if (true) {\n      remarcarRangos'],
  ['las estructuras sin sombra de contacto', ES, '    if (asiento && A.contacto) {', '    if (false) {'],
  ['Baja con asentado', MA, 'fijarAsentado({ ocluir: !!calidad.post, contacto: !!calidad.post, halos: !!calidad.post });', 'fijarAsentado({ ocluir: true, contacto: true, halos: true });'],
  ['Baja con sombra de contacto', MA, 'asiento = calidad.post ? crearAsiento(', 'asiento = true ? crearAsiento('],
  ['Baja con halos', MA, 'halosValle = calidad.post ? crearHalosValle(', 'halosValle = true ? crearHalosValle('],
  ['las estufas con halo de fogata', MA, "f.activa && f.vida > 0 && !f.contenida", 'f.activa && f.vida > 0'],
  ['halos sin las ventanas de tus casas', MA, "    halosValle.fijar('casas',", "    void ('casas',"],
  ['la sombra de contacto sin actualizar', MA, '  if (asiento) asiento.actualizar(dt, cam,', '  if (false) asiento.actualizar(dt, cam,'],
  ['la aldea sin sombra de contacto', AL, '    if (ctx.asiento) {\n      for (const b of edificios.values()) {', '    if (false) {\n      for (const b of edificios.values()) {'],
  ['la aldea con sombra desde la obra', AL, 'if (d && d.etapa >= 2) ctx.asiento.poner', 'if (d) ctx.asiento.poner'],
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
console.log(`\n${aprobadas.length} atrapadas, ${vivas.length} sin atrapar`);
if (vivas.length) { console.log('SIN ATRAPAR:\n  ' + vivas.join('\n  ')); process.exit(1); }
