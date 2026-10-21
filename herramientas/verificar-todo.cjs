// 3.8.7: `npm run verify` corre cada paso por separado. La línea única de package.json ya pasaba de los
// 8191 caracteres que acepta cmd.exe («La línea de comandos es demasiado larga»). Los pasos viven en
// `scripts["verify:pasos"]` (un texto con «&&» entre pasos, que nadie ejecuta entero) y acá se corren de a uno.
// 4.6.0: la lista se arma en `leerPasos` y la comparte `verificar-paralelo.cjs` (npm run verify:paralelo).
const { spawnSync } = require('child_process');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const leerPasos = () => String(require(path.join(raiz, 'package.json')).scripts['verify:pasos'] || '')
  .split('&&').map((s) => s.trim()).filter(Boolean);
module.exports = { leerPasos, raiz };
if (require.main === module) {
  const pasos = leerPasos();
  if (!pasos.length) { console.error('verify:pasos está vacío'); process.exit(1); }
  for (const [i, paso] of pasos.entries()) {
    const r = spawnSync(paso, { cwd: raiz, shell: true, stdio: 'inherit' });
    if (r.status !== 0) { console.error(`\nFALLÓ el paso ${i + 1} de ${pasos.length}: ${paso}`); process.exit(r.status || 1); }
  }
  console.log(`\nverify: ${pasos.length} pasos OK`);
}
