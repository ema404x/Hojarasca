// Recorrido de revisión en el juego real (Chromium sin pantalla, vía Playwright): fotos del taller ferroviario, el arroyo y la cascada, la casa
// de té (afuera y adentro), la bandera del mástil y las del pueblo, con la hora y el viento que se pida. Para mirar lo hecho sin abrir el juego.
// Uso: node armar.mjs && node pruebas/humo-revision.cjs [toma,toma,...]   → fotos en pruebas/salidas/revision/
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const raiz = path.resolve(__dirname, '..');
const salida = path.join(raiz, 'pruebas', 'salidas', 'revision');
fs.mkdirSync(salida, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// cada toma: dónde parado (x, z), a dónde mira (mx, mz, my), la hora y, si hace falta, lo que hay que preparar
const TOMAS = {
  'taller-puerta': { lugar: 'taller-tren', punto: 'pie', mira: 'puerta', hora: 11, nota: 'la puerta del taller ferroviario y su entrada' },
  'taller-adentro': { lugar: 'taller-tren', punto: 'zaguan', mira: 'banco', hora: 11, nota: 'adentro del galpón, mirando hacia el cuarto de Martín' },
  'te-fuera': { rel: 'casa-te', d: 14, ang: 0.6, hora: 15, mira: 'centro', nota: 'la casa de té desde afuera' },
  'te-mastil': { rel: 'casa-te', d: 9, ang: -0.9, hora: 15, mira: 'alto', viento: 1, nota: 'el mástil con las dos banderas' },
  'cascada-lejos': { salto: true, d: 18, ang: 0.0, hora: 14, mira: 'salto', nota: 'la cascada desde abajo' },
  'cascada-cerca': { salto: true, d: 8, ang: 0.4, hora: 14, mira: 'salto', nota: 'la cascada y su poza de cerca' },
  'arroyo': { rioIdx: 200, d: 7, ang: 0.8, hora: 14, mira: 'rio', nota: 'el arroyo' },
};
(async () => {
  const pedidas = (process.argv[2] || '').split(',').filter(Boolean);
  const lista = pedidas.length ? pedidas : Object.keys(TOMAS);
  const errores = [];
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const pg = await b.newPage({ viewport: { width: 1100, height: 700 } });
  pg.on('pageerror', (e) => errores.push('PAGEERROR ' + String(e).slice(0, 300)));
  const ev = (f, a) => pg.evaluate(f, a);
  const cuadros = async (n = 4) => { const c0 = await ev(() => { if (!window.__cuadros) { window.__cuadros = 0; const f = () => { window.__cuadros++; requestAnimationFrame(f); }; requestAnimationFrame(f); } return window.__cuadros; }); for (let i = 0; i < 90; i++) { await esperar(500); if ((await ev(() => window.__cuadros)) - c0 >= n) return; } };
  const url = 'file://' + path.join(raiz, 'index.html') + '?debug=1';
  await pg.goto(url);
  await ev(() => { localStorage.clear(); localStorage.setItem('hojarasca-ajustes-v1', JSON.stringify({ calidad: 'media', clima: 'despejado', musica: false, modo: 'relax', autoCalidad: false, guiaPrimerDia: false })); });
  await pg.goto(url);
  for (let i = 0; i < 240; i++) { await esperar(1000); if (await ev(() => !!window.__hojarasca).catch(() => false)) break; }
  await ev(() => { document.getElementById('btn-entrar').click(); });
  await esperar(3000);
  for (const nombre of lista) {
    const t = TOMAS[nombre];
    if (!t) { console.log('toma desconocida', nombre); continue; }
    await ev((t2) => {
      const H = window.__hojarasca, js = H.jugador.estado, T = H.T;
      H.progreso.horas = t2.hora; H.progreso.dia = 2;
      let x, z, mx, mz, my = null, dy = 1.8;
      if (t2.lugar) {
        const P = H.__aldea.puntos(t2.lugar), a = P[t2.punto], m = P[t2.mira];
        x = a.x; z = a.z; mx = m.x; mz = m.z; dy = 1.5;
      } else if (t2.rel) {
        const L = T.lugares[t2.rel]; mx = L.x; mz = L.z; x = L.x + Math.sin(t2.ang) * t2.d; z = L.z + Math.cos(t2.ang) * t2.d; if (t2.mira === 'alto') dy = 7;
      } else if (t2.salto) {
        const s = T.saltoAgua; mx = s.x; mz = s.z; my = s.abajo + s.alto * 0.5;
        x = s.x + Math.sin(s.ang + t2.ang) * t2.d; z = s.z + Math.cos(s.ang + t2.ang) * t2.d;
      } else if (t2.rioIdx !== undefined) {
        const r = T.rio[t2.rioIdx]; mx = r.x; mz = r.z; x = r.x + Math.sin(t2.ang) * t2.d; z = r.z + Math.cos(t2.ang) * t2.d;
      }
      if (T.agua && (t2.salto || t2.rioIdx !== undefined)) { let k = 0; while (T.agua(x, z) && k++ < 60) { const d = Math.hypot(x - mx, z - mz) || 1; x += ((x - mx) / d) * 1.0; z += ((z - mz) / d) * 1.0; } }
      if (H.__aldeaMundo) { const AM = H.__aldeaMundo(); let n = 0; while (AM.medir().cola > 0 && n < 200) { AM.montarCola(true); n++; } }
      js.pos.set(x, T.altura(x, z) + 0.1, z);
      js.yaw = Math.atan2(-(mx - x), -(mz - z));
      const yMira = my !== null ? my : T.altura(mx, mz) + dy;
      js.pitch = Math.atan2(yMira - (T.altura(x, z) + 1.6), Math.hypot(mx - x, mz - z));
      if (t2.viento !== undefined && H.clima && H.clima.estado) { H.clima.estado.viento = t2.viento; }
    }, t);
    await esperar(1500); await cuadros(5);
    await pg.screenshot({ path: path.join(salida, nombre + '.png'), timeout: 180000 });
    console.log('foto', nombre, '-', t.nota);
  }
  await b.close();
  if (errores.length) console.log('ERRORES', errores.slice(0, 5));
})();
