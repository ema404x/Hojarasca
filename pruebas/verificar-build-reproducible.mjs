// El mismo árbol de fuentes debe producir exactamente el mismo index.html.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = path.join(raiz, 'index.html');
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(index)).digest('hex');
const build = () => {
  const r = spawnSync(process.execPath, ['armar.mjs'], { cwd: raiz, encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'falló armar.mjs').trim());
};
build(); const a = hash();
build(); const b = hash();
if (a !== b) throw new Error(`build no reproducible: ${a} != ${b}`);
console.log(`OK build reproducible · SHA-256 ${a.slice(0,16)}…`);
