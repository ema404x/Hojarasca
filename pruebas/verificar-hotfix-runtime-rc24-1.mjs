import { nivelRc } from './version.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fauna = fs.readFileSync(path.join(raiz, 'src/fauna.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
const fallos = [];
if (fauna.includes('actualizarPudu(p, dt, jug, m)')) fallos.push('quedó la referencia huérfana m en actualizarPudu');
if (!fauna.includes('actualizarPudu(p, dt, jug, estadoMundo)')) fallos.push('fauna no pasa estadoMundo al pudú');
if (nivelRc(pkg.version) < 24) fallos.push(`versión inesperada ${pkg.version}`);
if (fallos.length) { console.error('HOTFIX RC24.1 FALLÓ'); for (const f of fallos) console.error(' -', f); process.exit(1); }
console.log('OK Hotfix Runtime RC24.1 · pudú recibe estadoMundo · ReferenceError m eliminado');
