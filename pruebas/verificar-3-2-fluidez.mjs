// 3.2: la fluidez. El ritmo parejo según el monitor (rendimiento.js), el ajuste 'auto' y su
// migración (guardado.js), el panel F3 y los enganches en main.js, y el arreglo de las
// compilaciones de programas en medio del dibujo (armar.mjs).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  crearRelojCadencia, crearMedidorRefresco, estimarPeriodo, rangoDivisores, divisorInicial,
  crearRitmoAuto, planCadencia, crearCronometroGpu,
} from '../src/rendimiento.js';

const leer = (r) => fs.readFileSync(new URL(r, import.meta.url), 'utf8');
const main = leer('../src/main.js');
const plantilla = leer('../src/plantilla.html');
const guardadoFuente = leer('../src/guardado.js');
const armador = leer('../armar.mjs');

// ---------------------------------------------------------------- 1. el período y los divisores
const P144 = 1000 / 144, P120 = 1000 / 120, P60 = 1000 / 60, P165 = 1000 / 165, P240 = 1000 / 240;
assert.equal(divisorInicial(P144), 2, '144 Hz arranca en 72');
assert.equal(divisorInicial(P120), 2, '120 Hz arranca en 60');
assert.equal(divisorInicial(P60), 1, '60 Hz arranca en 60');
assert.equal(divisorInicial(P165), 2, '165 Hz arranca en 82,5');
assert.equal(divisorInicial(P240), 3, '240 Hz arranca en 80');
assert.deepEqual(rangoDivisores(P144), { kMin: 1, kMax: 5 }, '144 Hz: de 144 a 28,8 cuadros');
assert.deepEqual(rangoDivisores(P60), { kMin: 1, kMax: 2 }, '60 Hz: 60 o 30');
assert.equal(rangoDivisores(P240).kMin, 2, 'en 240 Hz el techo automático es 120');

let semilla = 7;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
{
  const d = []; for (let i = 0; i < 90; i++) d.push(P144 * (azar() < 0.5 ? 1 : 2) + (azar() - 0.5) * 0.2);
  assert.ok(Math.abs(estimarPeriodo(d) - P144) < 0.1, 'mezcla de 1 y 2 refrescos: el período es el de 1');
  assert.equal(estimarPeriodo([1, 2, 3]), 0, 'con pocas muestras no opina');
}
{
  const m = crearMedidorRefresco(); let t = 0;
  for (let i = 0; i < 300; i++) { t += P144 + (azar() - 0.5) * 0.3; m.anotar(Math.round(t * 10) / 10); }
  assert.ok(Math.abs(m.hz - 144) < 0.5, `mide 144 Hz (${m.hz})`);
  // sólo cuadros de 2 refrescos: sin pista cree 72, con la pista de Electron sabe que es 144
  const sin = crearMedidorRefresco(), con = crearMedidorRefresco({ pistaHz: 144 }); t = 0;
  for (let i = 0; i < 300; i++) { t += 2 * P144 + (azar() - 0.5) * 0.3; sin.anotar(t); con.anotar(t); }
  assert.ok(Math.abs(sin.hz - 72) < 0.5, 'sin pista: 72');
  assert.equal(Math.round(con.hz), 144, 'con pista: 144');
  // la ventana se muda a un monitor de 60: hacen falta dos mediciones que coincidan, y cambia
  for (let i = 0; i < 300; i++) { t += P60 + (azar() - 0.5) * 0.3; m.anotar(t); }
  assert.ok(Math.abs(m.hz - 60) < 0.5, `se da cuenta del monitor nuevo (${m.hz})`);
  // tirones, pausas y cargas (más de 60 ms entre sellos) no cuentan
  const p = m.periodoMs; m.anotar(t + 500); m.anotar(t + 900);
  assert.equal(m.periodoMs, p);
}

// ---------------------------------------------------------------- 2. la cadencia pareja
{
  // 144 Hz, k = 2: se dibuja cada dos refrescos, siempre, aunque el sello tiemble
  const r = crearRelojCadencia(0); const dts = [], vs = []; let t = 0, dibujos = 0;
  for (let i = 0; i < 1440; i++) {
    t += P144 + (azar() - 0.5) * 0.4;
    const d = r.decidirVsync(Math.round(t * 10) / 10, P144, 2);
    if (d.dibujar) { dibujos++; dts.push(d.dtReal); vs.push(d.vsyncs); }
  }
  assert.ok(dibujos >= 719 && dibujos <= 721, `72 cuadros por segundo (${dibujos / 10})`);
  assert.ok(vs.every((v) => v === 2), 'nunca un cuadro de 1 ni de 3 refrescos');
  const suma = dts.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(suma - t / 1000) < 0.01, 'el reloj del juego no adelanta ni atrasa');
  assert.ok(Math.max(...dts) - Math.min(...dts) < 0.0005, 'dt parejo: menos de medio ms de diferencia');
  // un cuadro que se pasa de su turno se muestra un refresco más, y se sigue desde ahí
  const q = crearRelojCadencia(0);
  assert.equal(q.decidirVsync(P144 * 2, P144, 2).dibujar, true);
  assert.equal(q.decidirVsync(P144 * 3, P144, 2).dibujar, false);
  const tarde = q.decidirVsync(P144 * 5, P144, 2);
  assert.equal(tarde.vsyncs, 3);
  assert.equal(q.decidirVsync(P144 * 6, P144, 2).dibujar, false);
  assert.equal(q.decidirVsync(P144 * 7, P144, 2).dibujar, true);
}
// 60 en un monitor de 144 no puede ser parejo: queda con el reloj de siempre (promedia 60)
assert.deepEqual(planCadencia(60, P144), { modo: 'fijo', k: 0, fps: 60 });
assert.equal(planCadencia(60, P120).modo, 'vsync'); assert.equal(planCadencia(60, P120).k, 2);
assert.equal(planCadencia(60, P60).k, 1);
assert.equal(planCadencia(120, P240).k, 2);
assert.equal(planCadencia('libre', P144).modo, 'libre');
assert.deepEqual(planCadencia('auto', 0), { modo: 'fijo', k: 0, fps: 60 }, 'sin medir el monitor todavía: 60 de siempre');
assert.equal(planCadencia('auto', P144).k, 2);
assert.equal(planCadencia('auto', P144, 1).fps, 144);

// ---------------------------------------------------------------- 3. el objetivo automático
function simular(hz, costo, segundos, { conPlaca = true, ritmo = crearRitmoAuto() } = {}) {
  const P = 1000 / hz; let t = 0, k = ritmo.objetivo(P), cambios = 0, prev = k;
  while (t < segundos * 1000) {
    const c = costo(t);
    const v = Math.max(k, Math.ceil(c / P - 1e-9));
    t += v * P;
    k = ritmo.anotar(c, v, P, conPlaca);
    if (k !== prev) { cambios++; prev = k; }
  }
  return { k, cambios, ritmo };
}
const ruido = (m, d) => () => m + (azar() - 0.5) * 2 * d;
assert.deepEqual([simular(144, ruido(9, 1.5), 60).k, simular(144, ruido(9, 1.5), 60).cambios], [2, 0], '9 ms en 144 Hz: 72 parejos, sin tocar');
assert.equal(simular(144, ruido(4, 0.5), 60).k, 1, '4 ms en 144 Hz: 144');
assert.equal(simular(60, ruido(12, 2), 60).k, 1, '12 ms en 60 Hz: 60');
assert.equal(simular(60, ruido(20, 2), 60).k, 2, '20 ms en 60 Hz: 30 parejos');
assert.equal(simular(165, ruido(9, 1), 60).k, 2, '165 Hz: 82,5');
{
  // tirones sueltos (2% de cuadros de 49 ms) no bajan el ritmo
  const r = simular(144, () => 9 + (azar() < 0.02 ? 40 : 0), 60);
  assert.equal(r.k, 2); assert.equal(r.cambios, 0);
  // y en racha, con la placa medida, tampoco (se arreglan sacando el tirón, no dibujando menos)
  const racha = simular(144, (t) => 9 + ((t % 6000) < 900 && azar() < 0.6 ? 30 : 0), 60);
  assert.equal(racha.k, 2);
}
{
  // sin la placa medida y con la placa cara (la CPU dice 3 ms, el cuadro tarda 9): prueba bajar,
  // no aguanta, vuelve, y cada vez espera el doble: en 10 minutos, pocas vueltas
  const ritmo = crearRitmoAuto(); const P = P144; let t = 0, k = ritmo.objetivo(P), cambios = 0, prev = k;
  while (t < 600000) { const real = 9 + (azar() - 0.5) * 2; const v = Math.max(k, Math.ceil(real / P)); t += v * P; k = ritmo.anotar(3, v, P, false); if (k !== prev) { cambios++; prev = k; } }
  assert.equal(k, 2);
  assert.ok(cambios <= 16, `histéresis: ${cambios} cambios en 10 minutos`);
  assert.ok(ritmo.rebotes >= 4, 'cada rebote duplica la espera');
}
{
  // sin histéresis oscilaría: con un costo justo en el borde se queda quieto
  const r = simular(144, ruido(5.5, 1), 120);
  assert.equal(r.cambios, 0);
}
assert.equal(crearCronometroGpu(null), null, 'sin placa medible: null');
assert.equal(crearCronometroGpu({ getExtension: () => null }), null);

// ---------------------------------------------------------------- 4. el ajuste y su migración
const datos = new Map();
globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
const G = await import('../src/guardado.js?fluidez=' + Date.now());
assert.equal(G.AJUSTES_BASE.limiteFps, 'auto', 'de fábrica: según el monitor');
assert.equal(G.cargarAjustes().limiteFps, 'auto', 'jugador nuevo: auto');
datos.set('hojarasca-ajustes-v1', JSON.stringify({ limiteFps: 60, calidad: 'baja' }));
assert.equal(G.cargarAjustes().limiteFps, 'auto', 'el 60 de fábrica de antes pasa a auto');
assert.equal(G.cargarAjustes().calidad, 'baja', 'lo demás no se toca');
for (const v of [30, 120, 'libre']) { datos.set('hojarasca-ajustes-v1', JSON.stringify({ limiteFps: v })); assert.equal(G.cargarAjustes().limiteFps, v, `${v} elegido se respeta`); }
G.guardarAjustes({ ...G.cargarAjustes(), limiteFps: 60 });
assert.equal(JSON.parse(datos.get('hojarasca-ajustes-v1')).versionAjustes, G.VERSION_AJUSTES);
assert.equal(G.cargarAjustes().limiteFps, 60, 'un 60 elegido desde la 3.2 queda 60');
for (const basura of [45, '60fps', null, {}, -1]) assert.equal(G.sanearLimiteFps(basura, 2), 'auto', `basura (${JSON.stringify(basura)}) → auto`);
assert.deepEqual(G.LIMITES_FPS, ['auto', 30, 60, 120, 'libre']);
assert.ok(guardadoFuente.includes('const fps = sanearLimiteFps(x.limiteFps, x.versionAjustes);'));
assert.ok(plantilla.includes('data-ajuste="limiteFps"><button data-valor="auto">Auto (según tu monitor)</button><button data-valor="30">30</button><button data-valor="60">60</button><button data-valor="120">120</button><button data-valor="libre">Sin límite</button>'), 'Auto primero; 30/60/120/libre siguen');
assert.ok(main.includes("if (clave === 'limiteFps' && v !== 'libre' && v !== 'auto') v = Number(v);"), 'el botón Auto no se convierte en número');

// ---------------------------------------------------------------- 5. el bucle y F3
assert.ok(main.includes('const ahora = !manual && tRaf > 0 ? tRaf : performance.now();'), 'el reloj del cuadro es el sello de requestAnimationFrame');
assert.ok(main.includes('relojCadencia.decidirVsync(ahora, medidorRefresco.periodoMs, plan.k)'), 'vsyncs enteros');
assert.ok(main.includes('ritmoAuto.anotar(costo, cadencia.vsyncs, P, msGpu >= 0)'), 'el objetivo automático aprende de cada cuadro');
assert.ok(main.includes("if (manual) return { modo: l === 'libre' ? 'libre' : 'fijo'"), 'a mano (pruebas) el bucle sigue como siempre');
assert.ok(main.includes('presupuestoAdaptativo.actualizar(dtReal, objetivoMs)'), 'el presupuesto mira el objetivo del ritmo');
assert.ok(/if \(e\.code !== 'F3' \|\| e\.repeat\) return;\s*\/\/[^\n]*\n\s*if \(accionDeTecla\(teclasPropias, 'F3'\)\) return;/.test(main), 'F3 es del panel salvo que el jugador se la dé a una acción');
const { TECLAS_POR_DEFECTO } = await import('../src/accesibilidad.js');
assert.ok(!Object.values(TECLAS_POR_DEFECTO).includes('F3'), 'F3 libre en las teclas de fábrica');
assert.ok(plantilla.includes('<canvas class="medidor-grafico oculto" id="medidor-grafico"'), 'el gráfico de tiempos de cuadro');
for (const t of ['function alternarMedidor(', 'function dibujarGraficoMedidor(', 'function textoRitmo(', '`ritmo ${textoRitmo()}`', 'tirones (>2×', 'placa ${msGpu']) assert.ok(main.includes(t), `F3: ${t}`);
assert.ok(main.includes('medidor.tiempos[medidor.iTiempo] = msCuadro;') && !main.includes('medidor.muestras.push'), 'F3 sin basura por cuadro');
assert.match(main, /if \(!medidor\.visible && !HOJARASCA_DEBUG\) return/);
assert.ok(main.includes("usarCronometroGpu() && cronometroGpu.empezar()") && main.includes("if (ajustes.limiteFps !== 'auto' && !medidor.visible) return false;"), 'la placa se mide sólo con auto o F3');
assert.ok(leer('../preload.cjs').includes("refresco: () => ipcRenderer.invoke('pantalla-refresco')"));
assert.ok(leer('../main.cjs').includes("ipcMain.handle('pantalla-refresco'") && leer('../main.cjs').includes('getDisplayMatching'), 'Electron dice el refresco del monitor de la ventana');

// ---------------------------------------------------------------- 6. menos compilaciones en el dibujo
assert.ok(armador.includes("luces.replace(/:(P\\.[A-Za-z.]+),/g, ':__usaLuces?$1:0,')"), 'armar.mjs: los materiales sin luces no llevan la cantidad de luces en su programa');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(index.includes('let __usaLuces=p.isMeshLambertMaterial||p.isMeshToonMaterial||p.isMeshPhongMaterial||p.isMeshStandardMaterial||p.isShadowMaterial||p.isShaderMaterial&&p.lights===!0,N=H.fog,'));
assert.ok(index.includes('numPointLights:__usaLuces?P.point.length:0,') && !index.includes('numPointLights:P.point.length,'));
assert.ok(!leer('../three-r186-inline.js').includes('__usaLuces'), 'el runtime de three queda intacto: el cambio se aplica al armar');

console.log('OK 3.2 fluidez · ritmo parejo según el monitor (144→72, 120→60, 60→60, 165→82,5) con histéresis · auto de fábrica y migración del 60 viejo · F3 con gráfico, 1% peor, tirones y ritmo · sin recompilar materiales sin luces');
