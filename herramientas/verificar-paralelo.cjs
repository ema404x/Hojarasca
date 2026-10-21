// 4.6.0: el gate en paralelo (`npm run verify:paralelo`). Mismos pasos que `npm run verify` (la lista sale
// de `verificar-todo.cjs`), mismo veredicto y mismo formato al final; sirve durante el trabajo. Para cerrar
// una versión manda `npm run verify`, de corrido.
// Orden: `node armar.mjs` primero y solo (todo lo demás lee el index.html que arma); después el resto en un
// grupo de procesos, los más lentos primero (según la corrida anterior) para que no queden colas; y al final,
// de a uno y con la máquina tranquila, los pasos EN_SERIE.
// Hilos: HOJ_VERIFY_HILOS=n (por defecto, los núcleos menos 2; como mínimo 2).
// A diferencia del de corrido, no frena en la primera falla: corre todo y lista todas las que fallan.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { leerPasos, raiz } = require('./verificar-todo.cjs');

// Pasos que no pueden correr junto a otros (se corren al final, de a uno):
const EN_SERIE = {
  // rearma index.html dos veces (con `node armar.mjs`) mientras las demás pruebas lo leen
  'node pruebas/verificar-build-reproducible.mjs': 'rearma index.html',
  // miden tiempos con un tope fijo o comparan dos mediciones: con la máquina cargada pueden fallar
  'node pruebas/verificar-2-2.mjs': 'mide tiempos',
  'node pruebas/verificar-3-5-4-caos.mjs': 'mide tiempos',
  'node pruebas/verificar-3-6-2-visual.mjs': 'mide tiempos',
  'node pruebas/verificar-3-7-2-granja.mjs': 'mide tiempos',
  'node pruebas/verificar-3-7-5-rincones.mjs': 'mide tiempos',
  'node pruebas/verificar-4-0-3-rendimiento.mjs': 'mide tiempos',
  'node pruebas/verificar-4-0-3-colisiones.mjs': 'mide tiempos',
  'node pruebas/verificar-4-4-empleados.mjs': 'mide tiempos',
};
// Por las dudas: un paso que lance Electron o una partida real nunca va en el grupo (de a uno, siempre).
const enSerie = (paso) => Object.hasOwn(EN_SERIE, paso) || /electron|humo-/i.test(paso);

const pasos = leerPasos();
if (!pasos.length) { console.error('verify:pasos está vacío'); process.exit(1); }
const hilos = Math.max(2, Number(process.env.HOJ_VERIFY_HILOS) || os.cpus().length - 2);
const archivoTiempos = path.join(raiz, 'pruebas', 'salidas', 'verify-tiempos.json');
let tiempos = {};
try { tiempos = JSON.parse(fs.readFileSync(archivoTiempos, 'utf8')) || {}; } catch {}
const tty = process.stdout.isTTY;
const t00 = Date.now();
const seg = (ms) => (ms / 1000).toFixed(1) + ' s';

function correr(i) {
  const paso = pasos[i];
  return new Promise((listo) => {
    const t0 = Date.now();
    const partes = [];
    const p = spawn(paso, { cwd: raiz, shell: true, windowsHide: true });
    p.stdout.on('data', (d) => partes.push(d));
    p.stderr.on('data', (d) => partes.push(d));
    p.on('error', (e) => partes.push(Buffer.from(String(e && e.stack || e) + '\n')));
    p.on('close', (codigo) => listo({ i, paso, codigo: codigo === null ? 1 : codigo, ms: Date.now() - t0, salida: Buffer.concat(partes).toString('utf8') }));
  });
}

let hechos = 0, ultimaLinea = 0;
const resultados = [];
function avance(r, total) {
  hechos++;
  resultados.push(r);
  const fallas = resultados.filter((x) => x.codigo !== 0).length;
  const linea = `[${hechos}/${total}] ${fallas ? fallas + ' con falla · ' : ''}${seg(Date.now() - t00)}`;
  if (r.codigo !== 0) { if (tty) process.stdout.write('\r\x1b[K'); console.log(`  falla: ${r.paso}`); }
  if (tty) process.stdout.write('\r\x1b[K' + linea);
  else if (hechos === total || Date.now() - ultimaLinea > 5000) { ultimaLinea = Date.now(); console.log(linea); }
}

(async () => {
  console.log(`verify:paralelo · ${pasos.length} pasos · ${hilos} a la vez`);
  // 1) armar, solo
  const iArmar = pasos.indexOf('node armar.mjs');
  if (iArmar >= 0) {
    const r = await correr(iArmar);
    avance(r, pasos.length);
    if (r.codigo !== 0) {
      if (tty) process.stdout.write('\n');
      process.stdout.write(r.salida);
      console.error(`\nFALLÓ el paso ${iArmar + 1} de ${pasos.length}: ${r.paso}`);
      process.exit(r.codigo || 1);
    }
  }
  const resto = pasos.map((_, i) => i).filter((i) => i !== iArmar);
  // 2) el grupo: los más lentos primero (sin dato, se los supone lentos para no dejarlos al final)
  const largo = (i) => tiempos[pasos[i]] ?? 1e9;
  const cola = resto.filter((i) => !enSerie(pasos[i])).sort((a, b) => largo(b) - largo(a));
  await Promise.all(Array.from({ length: Math.min(hilos, cola.length) }, async () => {
    while (cola.length) avance(await correr(cola.shift()), pasos.length);
  }));
  // 3) los de a uno
  for (const i of resto.filter((i) => enSerie(pasos[i]))) avance(await correr(i), pasos.length);
  if (tty) process.stdout.write('\n');

  const nuevos = { ...tiempos };
  for (const r of resultados) nuevos[r.paso] = r.ms;
  try { fs.mkdirSync(path.dirname(archivoTiempos), { recursive: true }); fs.writeFileSync(archivoTiempos, JSON.stringify(nuevos, null, 1) + '\n'); } catch {}

  // HOJ_VERIFY_GUARDAR=carpeta: deja la salida de cada paso (NNN.txt, en el orden de la lista), para comparar corridas
  if (process.env.HOJ_VERIFY_GUARDAR) {
    const dir = path.resolve(process.env.HOJ_VERIFY_GUARDAR);
    fs.mkdirSync(dir, { recursive: true });
    for (const r of resultados) fs.writeFileSync(path.join(dir, String(r.i).padStart(3, '0') + '.txt'), r.salida);
  }
  const fallas = resultados.filter((r) => r.codigo !== 0).sort((a, b) => a.i - b.i);
  console.log(`(${seg(Date.now() - t00)} con ${hilos} a la vez)`);
  if (!fallas.length) { console.log(`\nverify: ${pasos.length} pasos OK`); return; }
  for (const r of fallas) {
    console.log(`\n========== salida de ${r.paso} (código ${r.codigo}) ==========`);
    process.stdout.write(r.salida.endsWith('\n') ? r.salida : r.salida + '\n');
  }
  console.error('');
  for (const r of fallas) console.error(`FALLÓ el paso ${r.i + 1} de ${pasos.length}: ${r.paso}`);
  console.error(`verify: ${fallas.length} de ${pasos.length} pasos fallan`);
  process.exit(fallas.find((r) => r.codigo !== 0).codigo || 1);
})();
