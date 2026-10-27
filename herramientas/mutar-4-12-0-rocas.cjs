// 4.12.0 (rocas y terreno): rompe a propósito cada regla y confirma que verificar-4-12-0-rocas.mjs falla.
// Cada mutación cambia un trozo de un archivo, corre la prueba y deja el archivo como estaba.
// Uso: node herramientas/mutar-4-12-0-rocas.cjs   (SOLO=<parte del nombre> para correr unas pocas)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.resolve(__dirname, '..');
const prueba = path.join(raiz, 'pruebas', 'verificar-4-12-0-rocas.mjs');

const VE = 'src/vegetacion.js', MA = 'src/materiales.js';
const MUTACIONES = [
  // ---- el reparto de modelos
  ['Baja también trae los cuatro modelos nuevos', VE, "  if (musgo) {\n    registrar('roca1'", "  if (true) {\n    registrar('roca1'"],
  ['el modelo ignora el lugar', VE, '(PESOS_ROCA[contexto] || PESOS_ROCA.suelta).slice()', 'PESOS_ROCA.suelta.slice()'],
  ['elegir el modelo gasta números al azar del bosque', VE, 'let u = h3(x * 0.713 + 1.7, z * 0.931 - 4.1, 2.9) * (w[0]', 'let u = r() * (w[0]'],
  ['las chicas no son cantos', VE, 'if (tam < 0.5) { w[2] *= 3; w[3] *= 0.6; w[4] *= 0.3; }', 'if (tam < 0.5) { w[2] *= 1; }'],
  ['las grandes también son cantos', VE, 'w[0] *= 1.3; w[2] *= 0.4; w[4] *= 1.4;', 'w[0] *= 1.3; w[2] *= 1; w[4] *= 1;'],
  ['la orilla sin cantos de más', VE, 'orilla: [0.2, 0.15, 0.5, 0.05, 0.1]', 'orilla: [0.2, 0.15, 0.1, 0.05, 0.1]'],
  ['la ladera sin rocas partidas de más', VE, 'ladera: [0.2, 0.25, 0.12, 0.27, 0.16]', 'ladera: [0.2, 0.25, 0.12, 0.05, 0.16]'],
  ['los grupos no tienen modelo dominante', VE, '7.7) < 0.55) return dominante;', '7.7) < -1) return dominante;'],
  ['el reparto cambia entre armados', VE, 'let u = h3(x * 0.713 + 1.7, z * 0.931 - 4.1, 2.9) * (w[0]', 'let u = Math.random() * (w[0]'],
  ['los cuatro nuevos van al mismo bloque que el peñasco', VE, "    registrar('roca2', rocaCanto(), null, mats.roca, 'soto');", "    registrar('roca2', rocaCanto(), null, materialVegetal({ flex: 0, soto: fundido.soto }), 'soto');"],
  // ---- cada piedra con lo suyo
  ['las piedras sueltas son bolas parejas', VE, '      _sRoca.x *= 0.9 + 0.24 * h3(x * 2.31 + 0.5, z * 1.77 - 2.2, 4.4);\n      _sRoca.z *= 0.9 + 0.24 * h3(x * 1.13 - 7.7, z * 2.91 + 1.9, 9.1);\n', ''],
  ['no se hunde más', VE, '    M.elements[13] -= hunde;\n', ''],
  // ---- nada se mueve
  ['el bosque se corre (la grilla de árboles)', VE, 'const PASO = 6.4;', 'const PASO = 6.5;'],
  ['cambia la cuenta de rocas sueltas', VE, "tirada < 0.012 + (dAgua < 6 ? 0.03 : 0)) { tipo = 'roca'", "tirada < 0.013 + (dAgua < 6 ? 0.03 : 0)) { tipo = 'roca'"],
  ['las rocas grandes dejan de chocar', VE, "if (tipo === 'roca' && esc > 0.9) { choque", "if (tipo === 'roca' && esc > 9.9) { choque"],
  // ---- los modelos
  ['el canto rodado con musgo', VE, "c.agregar(g, { color: '#8b867c', colorArriba: '#98958b', tipo: 4,", "c.agregar(g, { color: '#8b867c', colorArriba: '#98958b', tipo: 4, tipoVert: tipoMusgoNuevo(1, 1, 0.5),"],
  ['lajas blancas', VE, "'#686b6e', '#767a76'", "'#ffffff', '#ffffff'"],
  ['la roca partida sin caras claras', VE, 'corte[v] * 0.72', 'corte[v] * 0'],
  ['la peña sin líquenes', VE, 'sm01(0.62, 0.72, mancha) * lado * 0.88', 'sm01(0.62, 0.72, mancha) * lado * 0'],
  ['la peña casi sin musgo', VE, 'tipoMusgoNuevo(27.1, 1.25, 0.42)', 'tipoMusgoNuevo(27.1, 0.3, 0)'],
  ['la roca partida demasiado pesada', VE, 'icosferaModelada(6, (ux, uy, uz, o, i) => {', 'icosferaModelada(12, (ux, uy, uz, o, i) => {'],
  ['las lajas altas como un pilar', VE, '[-0.15, 1.14, 0.31, 0.94,', '[-0.15, 1.14, 1.31, 0.94,'],
  ['modelos con vértices rotos', VE, 'return o.set(ux / d, uy / d, uz / d);', 'return o.set(ux / d, uy / d, uz / (d - d));'],
  // ---- el terreno
  ['la variedad del terreno corre en Baja', MA, '          if (uDetalleSuelo > 0.5) {\n            float dV', '          if (true) {\n            float dV'],
  ['la variedad del terreno no se apaga lejos', MA, 'float cercaV = 1.0 - smoothstep(180.0, 300.0, dV);', 'float cercaV = 1.0;'],
  ['la variedad pide una textura', MA, 'float n3 = vnoise(p * 0.42 + 11.0);', 'float n3 = texture2D(uMascara, p).r;'],
  ['el terreno sin tierra pelada', MA, 'tierraV * 0.6 * cercaV', 'tierraV * 0.0 * cercaV'],
  ['el terreno sin borde de camino', MA, 'bordeCam * 0.4 * cercaV', 'bordeCam * 0.0 * cercaV'],
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
console.log(`\n${aprobadas.length} mutaciones atrapadas, ${vivas.length} sobrevivieron`);
process.exit(vivas.length ? 1 : 0);
