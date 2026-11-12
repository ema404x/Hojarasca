// 4.26.3 (A): la buhardilla entra a la regla de interiores (no dibujar el exterior desde adentro) y la gente de «galpon-encuentro» se ve.
//   1. interior-visible.js (el de verdad): la buhardilla está en CASAS_CERRADAS y tiene su caja; el puesto de troncos no (la equivalencia de imagen mostró el pasto y el
//      terreno asomando por el piso del puesto: no es una rendija de la geometría).
//   2. main.js, efectoDuendesActo3 (el código de verdad, con un mundo de mentira): el grupo de duendes de las escenas del galpón se para ADELANTE TUYO (el mismo punto
//      que la cámara, `mundo.posicion({ frente })`, que gira si hay un sólido), no se sienta adentro del galponcito (atrás de su frente de tablas no se los ve) y, si el punto
//      cae adentro de la huella del galponcito, se lo corre afuera, del lado más cercano al jugador. Las escenas que no son del galpón no se corren.
// Cada mutación es una copia de src/ con otro nombre y corre en su propio proceso (la caché de ESM sólo mide la primera): tiene que hacer fallar algo.
// Uso: node pruebas/verificar-4-26-3-a.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.A4263_SRC || path.join(raiz, 'src');
const yo = fileURLToPath(import.meta.url);

async function comprobar() {
  const I = await import(pathToFileURL(path.join(SRC, 'interior-visible.js')).href);
  const fuente = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  const R = [];
  const ok = (nombre, v) => R.push([nombre, !!v]);

  // ---- 1. la regla
  ok('buhardilla en CASAS_CERRADAS', I.CASAS_CERRADAS.has('buhardilla'));
  ok('el puesto de troncos queda afuera', !I.CASAS_CERRADAS.has('puesto'));
  ok('lo de la 4.26.1 sigue (casilla, taller anexo, planta alta)', ['casilla', 'taller-anexo', 'planta-alta'].every((k) => I.CASAS_CERRADAS.has(k)));
  const bu = { id: 'buhardilla', x: 40, z: -70, y: 6, rot: 0.7, ancho: 4.4, fondo: 5.2, alto: 3.25 };
  const caja = I.cajaDeCasa(bu);
  ok('cajaDeCasa de la buhardilla: las medidas del plano y las paredes hasta alto + 0,25', !!caja && caja.id === 'obra-buhardilla' && caja.ancho === 4.4 && caja.fondo === 5.2 && Math.abs(caja.alto - 3.5) < 1e-9);
  ok('cajaDeCasa del puesto: no hay', I.cajaDeCasa({ ...bu, id: 'puesto' }) === null);
  const l = (a, b, y) => ({ x: bu.x + a * Math.cos(bu.rot) + b * Math.sin(bu.rot), y, z: bu.z - a * Math.sin(bu.rot) + b * Math.cos(bu.rot) });
  const sal = {};
  ok('adentro de la buhardilla la caja encuentra la cámara', !!caja && I.interiorDeCaja(l(0.3, 0.4, 6 + 1.65), caja, sal)?.id === 'obra-buhardilla');
  ok('afuera de la buhardilla no', !!caja && I.interiorDeCaja(l(0, 4, 6 + 1.65), caja, {}) === null);
  ok('arriba de las paredes tampoco', !!caja && I.interiorDeCaja(l(0, 0, 6 + 3.9), caja, {}) === null);
  ok('la puerta es el vano del frente (-z)', !!caja && caja.frente.length > 2 && caja.frente.every(([a, b]) => Math.abs(b + 2.6) < 1e-9 && Math.abs(a) <= 0.6 + 1e-9));

  // ---- 2. los duendes del galpón
  const jug = { estado: { pos: { x: 0, z: 0 }, yaw: 0 } };   // yaw 0 mira hacia -z
  let giro = 0, obra = null, sinMundo = false;
  const escenasMundo = {
    mundo: {
      posicion(ref) {
        const j = jug.estado, c = Math.cos(j.yaw + giro), s = Math.sin(j.yaw + giro), fx = -s, fz = -c, d = ref.dist ?? 3, la = ref.lado ?? 0;
        return { x: j.pos.x + fx * d + -fz * la, z: j.pos.z + fz * d + fx * la };
      },
    },
  };
  const ejecutar = (id, args = {}) => {
    const pts = [];
    const env = {
      jugador: jug, duendesDeEscena: [], escenasMundo: sinMundo ? null : escenasMundo, molinoViejoHist: null,
      obrasTerminadas: (k) => (k === 'galponcito' && obra ? [obra] : []),
      puntosCacheadosDeHistoria: () => ({ 'galpon-noche': obra ? { x: obra.datos.x, z: obra.datos.z } : null }),
      setTimeout: () => 0, Math, Number, Object, Array,
    };
    const f = funcion(fuente, 'efectoDuendesActo3', env);
    const crear = (tipo, p) => { pts.push({ tipo, x: p.x, z: p.z }); return { mirar() { return this; }, irA() { return this; }, huir() { return this; }, quitar() { return this; }, saludar() { return this; } }; };
    f(id, args, crear);
    return pts;
  };
  // el galponcito (4,6 × 3,6) 7 m adelante del jugador, girado 0,4
  const huella = (p) => { const dx = p.x - obra.datos.x, dz = p.z - obra.datos.z, c = Math.cos(obra.datos.rot), s = Math.sin(obra.datos.rot), lx = dx * c - dz * s, lz = dx * s + dz * c; return { lx, lz, adentro: Math.abs(lx) < 2.3 + 0.9 && Math.abs(lz) < 1.8 + 0.9 }; };
  const nuevoGalpon = (x, z, rot = 0.4) => ({ plano: { id: 'galponcito', ancho: 4.6, fondo: 3.6 }, datos: { x, z, rot } });

  // sin galponcito: el punto de la cámara (frente), sin tocarlo
  obra = null; giro = 0;
  let p = ejecutar('galpon-pillos', { n: 4 });
  const esperado = (d, la) => escenasMundo.mundo.posicion({ dist: d, lado: la });
  ok('sin galponcito: 4 pillos adelante tuyo, en el punto de la cámara', p.length === 4 && p.every((q, i) => { const e = esperado(5.5 + (i % 3) * 0.9, (i / 3 - 0.5) * 4.5); return Math.hypot(q.x - e.x, q.z - e.z) < 1e-9; }));
  giro = Math.PI / 3;
  p = ejecutar('galpon-pillos', { n: 4 });
  ok('sin galponcito y con un sólido adelante (la cámara gira 60 grados): el grupo gira con ella', p.every((q, i) => { const e = esperado(5.5 + (i % 3) * 0.9, (i / 3 - 0.5) * 4.5); return Math.hypot(q.x - e.x, q.z - e.z) < 1e-9; }) && Math.abs(p[0].x) > 3);
  giro = 0;
  sinMundo = true;
  p = ejecutar('galpon-pillos', { n: 4 });
  ok('sin el mundo de las escenas: el punto recto de siempre', p.length === 4 && p.every((q) => q.z < -5 && Math.abs(q.x) < 3));
  sinMundo = false;

  // con el galponcito 7 m adelante: ninguno adentro de la huella (+0,9 m), todos del lado del jugador
  obra = nuevoGalpon(0, -7);
  const casos = ['galpon-pillos', 'galpon-saltarines', 'galpon-lucecitas', 'galpon-yuyero', 'galpon-topo', 'galpon-mandamas'];
  let adentro = 0, lejos = 0, total = 0;
  for (const id of casos) for (const q of ejecutar(id, { n: 4 })) { total++; if (huella(q).adentro) adentro++; if (Math.hypot(q.x - jug.estado.pos.x, q.z - jug.estado.pos.z) > 7.2) lejos++; }
  ok(`con el galponcito adelante: ninguno de ${total} cae adentro de la huella`, total > 8 && adentro === 0);
  ok('con el galponcito adelante: ninguno queda del otro lado (atrás del galponcito)', lejos === 0);
  // el galponcito atrás del jugador: los puntos de adelante no se tocan
  obra = nuevoGalpon(0, 8);
  p = ejecutar('galpon-pillos', { n: 4 });
  ok('con el galponcito atrás tuyo: el punto de la cámara, sin tocar', p.every((q, i) => { const e = esperado(5.5 + (i % 3) * 0.9, (i / 3 - 0.5) * 4.5); return Math.hypot(q.x - e.x, q.z - e.z) < 1e-9; }));
  // de costado, con el punto adentro de la huella: sale por el lado más cercano a vos
  obra = nuevoGalpon(0, -6.2, 0);
  p = ejecutar('galpon-yuyero', {});
  const q0 = p[0];
  ok('un punto adentro de la huella sale por el borde más cercano a vos (el de adelante)', !huella(q0).adentro && q0.z > obra.datos.z && Math.abs(q0.z - (obra.datos.z + 1.8 + 1.2)) < 1e-9);
  // las escenas que no son del galpón no se corren
  obra = nuevoGalpon(0, -6.2, 0);
  p = ejecutar('lucecitas-mirador', { n: 3 });
  ok('una escena que no es del galpón no se corre (aunque haya galponcito)', p.length === 3 && p.every((q, i) => { const e = esperado(3.5 + (i % 3) * 0.9, (i / 2 - 0.5) * 3); return Math.hypot(q.x - e.x, q.z - e.z) < 1e-9; }));
  // ya no se sientan en ronda adentro del galponcito
  obra = nuevoGalpon(0, -7);
  p = ejecutar('galpon-mandamas', {});
  ok('el Mandamás no queda en el centro del galponcito', Math.hypot(p[0].x - obra.datos.x, p[0].z - obra.datos.z) > 2.5);
  return R;
}

if (process.argv[2] === '--hijo') {
  const R = await comprobar();
  console.log(JSON.stringify(R));
  process.exit(0);
}

let malas = 0;
const hijo = (src) => {
  const r = spawnSync(process.execPath, [yo, '--hijo'], { env: { ...process.env, A4263_SRC: src }, encoding: 'utf8' });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; }
};
const base = hijo(SRC);
if (!base) { console.error('no corrió la comprobación'); process.exit(1); }
for (const [n, v] of base) { console.log((v ? 'ok   ' : 'MAL  ') + n); if (!v) malas++; }

// ---- mutaciones
const MUT = [
  ['interior-visible.js', 'la buhardilla sale de la regla', "'planta-alta', 'buhardilla']);", "'planta-alta']);"],
  ['interior-visible.js', 'el puesto entra a la regla', "'planta-alta', 'buhardilla']);", "'planta-alta', 'buhardilla', 'puesto']);"],
  ['main.js', 'no se corre el punto de la huella', 'if (Math.abs(lx) >= mx || Math.abs(lz) >= mz) return p;', 'return p;'],
  ['main.js', 'sin margen alrededor del galponcito', 'mx = P.ancho / 2 + 1.2, mz = P.fondo / 2 + 1.2;', 'mx = P.ancho / 2 + 0.1, mz = P.fondo / 2 + 0.1;'],
  ['main.js', 'sale por el borde más lejano', 'if (!mejor || d < mejor.d) mejor = { w, d };', 'if (!mejor || d > mejor.d) mejor = { w, d };'],
  ['main.js', 'no usa el punto de la cámara (frente)', 'if (q && Number.isFinite(q.x) && Number.isFinite(q.z)) return q; } catch', 'if (false) return q; } catch'],
  ['main.js', 'se corre en todas las escenas', "id.startsWith('galpon-') ? obrasTerminadas('galponcito')[0] || null : null;", "obrasTerminadas('galponcito')[0] || null;"],
  ['main.js', 'no se corre en las del galpón', "id.startsWith('galpon-') ? obrasTerminadas('galponcito')[0] || null : null;", 'null;'],
  ['main.js', 'vuelven a sentarse en ronda adentro', 'const p = fueraDelGalpon(frente(adelante + (i % 3) * 0.9, ((i / Math.max(1, (n || 1) - 1)) - 0.5) * ancho));', "let p = fueraDelGalpon(frente(adelante + (i % 3) * 0.9, ((i / Math.max(1, (n || 1) - 1)) - 0.5) * ancho)); if (sitioGalpon) p = { x: sitioGalpon.datos.x + Math.cos(i) * 1.1, z: sitioGalpon.datos.z + Math.sin(i) * 1.1 };"],
];
for (const [archivo, nombre, de, a] of MUT) {
  const original = fs.readFileSync(path.join(SRC, archivo), 'utf8');
  if (!original.includes(de)) { console.log('MAL  mutación inaplicable: ' + nombre); malas++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut4263-'));
  fs.cpSync(SRC, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, archivo), original.replace(de, a));
  const r = hijo(dir);
  const falla = !r || r.some(([, v]) => !v);
  console.log((falla ? 'ok   ' : 'MAL  ') + 'la mutación «' + nombre + '» hace fallar');
  if (!falla) malas++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(malas ? `\n${malas} problema(s)` : '\ntodo en verde');
process.exit(malas ? 1 : 0);
