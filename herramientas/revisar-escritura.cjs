// 4.6.0: control automático de Claude Code (hook PostToolUse, ver .claude/settings.json).
// Después de cada Write/Edit revisa ese archivo; después de cada comando de consola, los archivos de texto
// cambiados o nuevos según git. Avisa (sale con 2 y escribe en stderr, que le llega a Claude) si encuentra:
//  - caracteres de control (salvo tabulador y salto de línea): p. ej. un retroceso (0x08) donde iba «\b»
//    en una expresión regular, que pasa cuando las barras invertidas se pierden al escribir desde la consola;
//  - fines de línea de Windows (CRLF): el proyecto es LF.
// Sólo mira texto del proyecto (.js .mjs .cjs .md .json .html .css .txt); nunca toca nada.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EXT = new Set(['.js', '.mjs', '.cjs', '.md', '.json', '.html', '.css', '.txt']);
const IGNORAR = /(^|[\\/])(node_modules|dist|\.git)([\\/]|$)|(^|[\\/])index\.html$|three-r186-inline\.js$/;

function leerEntrada() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

function archivosCambiados(dir) {
  try {
    const salida = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const raiz = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return salida.split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop()).map((f) => path.join(raiz, f));
  } catch { return []; }
}

function revisar(archivo) {
  if (!EXT.has(path.extname(archivo).toLowerCase()) || IGNORAR.test(archivo)) return [];
  let t;
  try { t = fs.readFileSync(archivo, 'utf8'); } catch { return []; }
  if (t.length > 4_000_000) return [];
  const problemas = [];
  const lineas = t.split('\n');
  let crlf = 0;
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (l.endsWith('\r')) crlf++;
    const m = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.exec(l);
    if (m) {
      const cod = m[0].charCodeAt(0).toString(16).padStart(2, '0');
      const pista = cod === '08' ? ' (¿un «\\b» que perdió la barra?)' : '';
      problemas.push(`${archivo}:${i + 1}: carácter de control 0x${cod}${pista}`);
      if (problemas.length >= 8) break;
    }
  }
  if (crlf) problemas.push(`${archivo}: ${crlf} línea(s) con fin de línea de Windows (CRLF); el proyecto usa LF`);
  return problemas;
}

const entrada = leerEntrada();
const dir = entrada.cwd || process.cwd();
const ruta = entrada.tool_input && (entrada.tool_input.file_path || entrada.tool_input.notebook_path);
// después de un comando de consola no se miran los .txt (salidas y registros de PowerShell, que pueden venir en CRLF)
const archivos = ruta ? [path.resolve(dir, ruta)] : archivosCambiados(dir).filter((f) => path.extname(f).toLowerCase() !== '.txt');
const problemas = archivos.flatMap(revisar);
if (problemas.length) {
  process.stderr.write(`Control de escritura de Hojarasca: hay que corregir esto antes de seguir.\n${problemas.join('\n')}\n` +
    'Si es un retroceso en una expresión regular, poné «\\b» de verdad (escribilo con Node usando String.fromCharCode(92) si la consola se come las barras).\n');
  process.exit(2);
}
