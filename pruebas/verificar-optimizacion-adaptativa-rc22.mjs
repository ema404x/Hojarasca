import fs from 'fs';
import assert from 'assert/strict';
import { crearPresupuestoAdaptativo, crearIndiceEspacial2D } from '../src/rendimiento.js';

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const veg = leer('../src/vegetacion.js');
const pasto = leer('../src/pasto.js');

// Presupuesto adaptativo: presión sostenida sube nivel; margen sostenido lo recupera.
const p = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3 });
for (let i = 0; i < 40; i++) p.actualizar(0.030, 16.7);
assert.ok(p.nivel >= 1, 'frametime lento sostenido debe activar presupuesto adaptativo');
const nivelPresion = p.nivel;
assert.ok(p.intervalo(0.2, 2) > 0.2, 'trabajo secundario debe espaciarse bajo presión');
assert.ok(p.factorDetalle() < 1, 'microdetalle lejano debe reducir alcance bajo presión');
for (let i = 0; i < 500; i++) p.actualizar(0.010, 16.7);
assert.ok(p.nivel < nivelPresion, 'el sistema debe recuperar calidad/cadencia con margen sostenido');

// El índice espacial base sigue siendo local y reutilizable para estáticos.
const idx = crearIndiceEspacial2D(16);
const items = [];
for (let i = 0; i < 200; i++) items.push({ id:i, x:i * 4, z:(i % 5) * 3 });
idx.reconstruir(items, (o)=>o);
const out = [];
idx.consultar(8, 3, 9, out);
assert.ok(out.length > 0 && out.length < items.length / 3, 'consulta estática debe devolver sólo vecindad local');

// Integración: frametime real separado del dt de simulación y presupuesto con histéresis.
assert.match(main, /const presupuestoAdaptativo = crearPresupuestoAdaptativo/);
assert.match(main, /const dtReal = Math\.min\(0\.2/);
assert.match(main, /presupuestoAdaptativo\.actualizar\(dtReal/);
assert.match(main, /presupuestoAdaptativo\.intervalo\(0\.25, 1\.7\)/);
assert.match(main, /const hzSombras = Math\.max\(3, 6 - presupuestoAdaptativo\.nivel\)/);
assert.match(main, /presupuesto L\$\{presupuestoAdaptativo\.nivel\}/);

// Render/control principal permanecen continuos: se degrada primero lo secundario.
assert.match(main, /jugador\.actualizar\(dt\)/);
assert.match(main, /dibujar\(luzCielo, noche\)/);

// Culling estático: estructuras y chunks del tren consultan sólo celdas próximas.
assert.match(main, /const indiceCentrosEst = crearIndiceEspacial2D\(64\)/);
assert.match(main, /indiceCentrosEst\.reconstruir\(centrosEst/);
assert.match(main, /indiceCentrosEst\.consultar/);
assert.match(main, /const indiceChunksTren = crearIndiceEspacial2D\(96\)/);
assert.match(main, /indiceChunksTren\.consultar/);

// Recursos vegetales: hacha y despeje ya no recorren todo el bosque.
assert.match(veg, /const indiceArboles = crearIndiceEspacial2D\(24\)/);
assert.match(veg, /const indiceMatas = crearIndiceEspacial2D\(18\)/);
assert.match(veg, /function arbolesCerca/);
assert.match(veg, /function matasCerca/);
assert.match(main, /veg\.matasCerca/);
assert.match(main, /veg\.arbolesCerca/);

// Presupuesto GPU de detalle: sólo afecta anillo lejano de vegetación/pasto.
assert.match(veg, /function actualizar\(cam, factorDetalle = 1\)/);
assert.match(veg, /calidad\.sotobosque, 52\) \* detalle/);
// 3.5: el pasto se acorta con el fundido del borde (uCorte), no achicando uR (que corría el anillo entero)
assert.match(pasto, /const corte = Math\.max\(0\.78, Math\.min\(1, factorDetalle \|\| 1\)\);/);
assert.match(main, /pasto\.actualizar\(cam, miraPasto, presupuestoAdaptativo\.factorDetalle\(0\.78\)\)/);

console.log('OK Optimización Adaptativa RC22 · presupuesto por frametime · culling espacial estático · recursos locales · microdetalle GPU adaptativo · sombras escalonadas');
