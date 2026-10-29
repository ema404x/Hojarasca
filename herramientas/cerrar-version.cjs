// 4.16: automatiza lo mecánico de cerrar una versión. El texto de cada versión va en
// herramientas/cierre/<ver>.json; el resto lo hace este script.
//
// Uso (desde la carpeta de la rama de integración, salvo `publicar`, que va en el repo principal):
//   node herramientas/cerrar-version.cjs juntar <rama>        git merge de la rama de otro agente, resolviendo solo el choque de package.json
//   node herramientas/cerrar-version.cjs docs <ver>           sube la versión, escribe CAMBIOS, RELEASE_STATUS, SEGUIR y LEEME, arma y confirma
//   node herramientas/cerrar-version.cjs publicar <ver> <rama> [--sin-zip]   (en el repo principal, con el gate ya pasado) ff a main, etiqueta, push y zip
//
// El gate (`npm run verify` de corrido) NO lo corre: tiene que pasar antes de `publicar`.
//
// Formato de herramientas/cierre/<ver>.json:
//   { "anterior": "4.15.0", "titulo": "Historia nueva, acto II", "cambios": ["línea markdown", ...],
//     "release": "texto de la línea de RELEASE_STATUS", "seguir": "texto del bloque ÚLTIMO de SEGUIR-EN-OTRA-PC",
//     "leemeNovedades": ["línea", ...], "leemeMirar": ["línea", ...] }
const fs = require('fs'), path = require('path'), cp = require('child_process');
const B = String.fromCharCode(96);
const NL = String.fromCharCode(10);
const raiz = process.cwd();
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const escribir = (f, t) => fs.writeFileSync(path.join(raiz, f), t);
const sh = (cmd, opts = {}) => cp.execSync(cmd, { cwd: raiz, stdio: 'pipe', encoding: 'utf8', ...opts });
const aviso = (m) => console.log(m);
const falla = (m) => { console.error('ERROR: ' + m); process.exit(1); };

// Resuelve el choque de siempre de package.json (la línea verify:pasos): deja las pruebas de los dos lados.
function fusionarPkg() {
  let p = leer('package.json');
  const m = p.match(/<<<<<<< HEAD\r?\n(.*)\r?\n=======\r?\n(.*)\r?\n>>>>>>> [^\r\n]+\r?\n/);
  if (!m) return 'sin choque en package.json';
  const paso = (l) => l.match(/pruebas\/[^ "]+/g) || [];
  const A = paso(m[1]), Bp = paso(m[2]);
  const extra = Bp.filter((x) => !A.includes(x));
  const linea = m[1].replace(/"\s*$/, '') + extra.map((e) => ' && node ' + e).join('') + '"';
  p = p.replace(m[0], linea + NL);
  JSON.parse(p);
  escribir('package.json', p);
  return 'package.json: sumadas las pruebas del otro lado: ' + (extra.join(', ') || '(ninguna)');
}

function juntar(rama) {
  if (!rama) falla('falta la rama');
  let salida = '';
  try { salida = sh('git merge --no-edit ' + rama); aviso(salida.split(NL).slice(-3).join(NL)); return; } catch (e) { salida = String(e.stdout || '') + String(e.stderr || ''); }
  const conflictos = sh('git diff --name-only --diff-filter=U').split(NL).filter(Boolean);
  aviso('Choques: ' + conflictos.join(', '));
  const resto = [];
  for (const f of conflictos) {
    if (f === 'package.json') { aviso(fusionarPkg()); sh('git add package.json'); continue; }
    resto.push(f);
  }
  if (resto.length) {
    aviso('A mano (no se tocaron): ' + resto.join(', '));
    aviso('Si son los huecos que dejó un agente para el archivo de otro: git checkout --theirs <archivo> && git add <archivo>');
    process.exit(2);
  }
  sh('git commit --no-edit');
  aviso('Junta lista. Falta: node armar.mjs y las pruebas.');
}

function docs(ver) {
  const f = path.join(raiz, 'herramientas', 'cierre', ver + '.json');
  if (!fs.existsSync(f)) falla('falta ' + f);
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ant = d.anterior;
  if (!ant) falla('el json necesita "anterior"');
  const guion = ver.replace(/\./g, '_');
  for (const [file, ls] of [['package.json', [3]], ['package-lock.json', [3, 9]]]) {
    const a = leer(file).split(NL);
    for (const i of ls) { if (!a[i - 1].includes('"' + ant + '"')) falla(file + ':' + i + ' no dice ' + ant + ': ' + a[i - 1]); a[i - 1] = a[i - 1].replace(ant, ver); }
    escribir(file, a.join(NL));
  }
  const cambios = ['# Hojarasca ' + ver + ' — ' + d.titulo, '', ...(d.cambios || []), ''];
  escribir('CAMBIOS_' + guion + '.md', cambios.join(NL));

  let t = leer('RELEASE_STATUS.md');
  const i = t.indexOf(NL + '- ' + ant);
  if (i < 0) falla('RELEASE_STATUS no tiene la línea de ' + ant);
  t = t.slice(0, i) + NL + '- ' + ver + ' (sobre main = ' + ant + '): ' + d.release + t.slice(i);
  escribir('RELEASE_STATUS.md', t);

  let s = leer('SEGUIR-EN-OTRA-PC.md');
  const a = s.indexOf('> **ÚLTIMO (');
  if (a < 0) falla('SEGUIR-EN-OTRA-PC.md no tiene el bloque ÚLTIMO');
  const fecha = d.fecha || new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
  const nuevo = '> **ÚLTIMO (' + fecha + ', ' + (d.maquina || 'notebook') + '): VERSIÓN ' + ver + ' en ' + B + 'main' + B + ', etiqueta ' + B + 'v' + ver + B + '** — ' + d.seguir + NL + NL;
  s = s.slice(0, a) + nuevo + s.slice(a);
  escribir('SEGUIR-EN-OTRA-PC.md', s);

  let l = leer('herramientas/LEEME-' + ant + '.txt');
  const cab = l.split(NL);
  for (let k = 0; k < 12; k++) cab[k] = cab[k].split(ant).join(ver);
  l = cab.join(NL).replace('NOVEDADES DE LAS VERSIONES 4.0.1 A ' + ant, 'NOVEDADES DE LAS VERSIONES 4.0.1 A ' + ver);
  const n2 = ['NOVEDADES DE LA ' + ver + ' — ' + d.titulo.toUpperCase(), ...(d.leemeNovedades || []), '', 'PARA MIRAR Y CONTARME (' + ver + ')', ...(d.leemeMirar || []), '', ''].join(NL);
  const pos = l.indexOf('NOVEDADES DE LA ' + ant);
  if (pos < 0) falla('el LEEME de ' + ant + ' no tiene su bloque de novedades');
  escribir('herramientas/LEEME-' + ver + '.txt', l.slice(0, pos) + n2 + l.slice(pos));

  aviso(sh('node armar.mjs').trim().split(NL).pop());
  sh('git add -A');
  cp.execFileSync('git', ['commit', '-m', ver + ': versión, documentos y LEEME' + NL + NL + 'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>'], { cwd: raiz });
  aviso('Documentos de ' + ver + ' listos y confirmados. Ahora el gate: npm run verify (de corrido).');
}

function publicar(ver, rama, sinZip) {
  if (!ver || !rama) falla('uso: publicar <ver> <rama> [--sin-zip]');
  const actual = sh('git rev-parse --abbrev-ref HEAD').trim();
  if (actual !== 'main') falla('hay que estar en main (estás en ' + actual + ')');
  if (sh('git status --porcelain').trim()) falla('main tiene cambios sin confirmar');
  aviso(sh('git merge --ff-only ' + rama).trim().split(NL).pop());
  aviso(sh('node armar.mjs').trim().split(NL).pop());
  if (sh('git status --porcelain').trim()) aviso('OJO: armar dejó cambios sin confirmar en main (index.html?). Revisalos.');
  sh('git tag v' + ver);
  aviso(sh('git push origin main v' + ver).trim());
  if (sinZip) return;
  const zip = cp.spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'herramientas\\empaquetar.ps1', '.', ver, 'herramientas\\LEEME-' + ver + '.txt'], { cwd: raiz, encoding: 'utf8' });
  aviso((zip.stdout || '').trim().split(NL).pop() + (zip.status ? ' (salió con ' + zip.status + ': ' + (zip.stderr || '').trim() + ')' : ''));
}

const [, , cmd, a1, a2, a3] = process.argv;
if (cmd === 'juntar') juntar(a1);
else if (cmd === 'docs') docs(a1);
else if (cmd === 'publicar') publicar(a1, a2, a2 === '--sin-zip' || a3 === '--sin-zip');
else falla('uso: juntar <rama> | docs <ver> | publicar <ver> <rama> [--sin-zip]');
