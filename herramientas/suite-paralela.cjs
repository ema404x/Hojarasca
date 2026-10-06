// 3.7.1: todas las partidas reales, de a N a la vez, cada una con su perfil (perfil-propio.cjs) y
// sus ventanas en el monitor externo (al-monitor.cjs). Mismo resumen que suite.ps1.
// Uso: node herramientas/suite-paralela.cjs <salida> [N=3] [lista,separada,por,comas]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const salida = path.resolve(process.argv[2] || path.join(raiz, '..', 'salida-paralela'));
const N = Math.max(1, Number(process.argv[3]) || 3);
const lista = process.argv[4] ? process.argv[4].split(',').map((s) => s.trim()) : fs.readdirSync(path.join(raiz, 'pruebas')).filter((f) => /^humo-.*\.cjs$/.test(f)).sort();
const out = path.join(salida, 'humo');
fs.mkdirSync(out, { recursive: true });
const resumen = path.join(out, 'resumen.txt');
const hora = () => new Date().toTimeString().slice(0, 8);
fs.writeFileSync(resumen, `inicio ${hora()} · ${lista.length} pruebas de a ${N}\n`);
const electron = path.join(raiz, 'node_modules', 'electron', 'dist', 'electron.exe');
const pre = ['al-monitor.cjs', 'perfil-propio.cjs'].flatMap((m) => ['-r', path.join(raiz, 'herramientas', m)]);
const LIMITE = 15 * 60 * 1000;
const resultados = [];

function correr(archivo) {
  return new Promise((listo) => {
    const n = archivo.replace(/\.cjs$/, '');
    const log = path.join(out, `${n}.log`);
    const perfil = path.join(out, 'perfiles', n);
    fs.rmSync(perfil, { recursive: true, force: true });
    fs.mkdirSync(perfil, { recursive: true });
    const t0 = Date.now();
    const f = fs.openSync(log, 'w');
    const p = spawn(electron, ['--no-sandbox', ...pre, path.join(raiz, 'pruebas', archivo)], { cwd: raiz, env: { ...process.env, HOJ_PERFIL: perfil }, stdio: ['ignore', f, f], windowsHide: true });
    let agotado = false;
    const reloj = setTimeout(() => { agotado = true; try { spawn('taskkill', ['/PID', String(p.pid), '/T', '/F']); } catch {} }, LIMITE);
    p.on('exit', (codigo) => {
      clearTimeout(reloj);
      fs.closeSync(f);
      const texto = fs.readFileSync(log, 'utf8');
      const bien = (texto.match(/^✓/gm) || []).length, mal = (texto.match(/^✗/gm) || []).length;
      const errores = /^ERRORES:/m.test(texto) && !/^ERRORES:\s*$/m.test(texto);
      const ok = !agotado && codigo === 0 && mal === 0 && !errores;
      const linea = `${ok ? 'OK' : 'FALLA'} ${n} · salida ${agotado ? 'tiempo agotado' : codigo} · ✓${bien} ✗${mal} · ${Math.round((Date.now() - t0) / 1000)}s`;
      fs.appendFileSync(resumen, linea + '\n');
      console.log(linea);
      resultados.push({ n, ok });
      listo();
    });
  });
}

(async () => {
  const cola = [...lista];
  await Promise.all(Array.from({ length: N }, async () => { while (cola.length) await correr(cola.shift()); }));
  const fallas = resultados.filter((r) => !r.ok).map((r) => r.n);
  fs.appendFileSync(resumen, `FIN ${hora()} · OK ${resultados.length - fallas.length} de ${resultados.length}${fallas.length ? ' · fallan: ' + fallas.join(', ') : ''}\n`);
  console.log(`FIN · OK ${resultados.length - fallas.length} de ${resultados.length}`);
})();
