// 3.8.3 (base): el pase de bugs de lo transversal (guardado y carga, portada y menús, pantallas y entrada,
// rendimiento y arranque), sin Electron. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { calidadParaEquipo } from '../src/calidad-equipo.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const main = leer('src/main.js');

// 1. Cerrar el juego en la portada de una partida sin jugar no la da por empezada: `guardar` no anota la
//    posición hasta entrar (si no, la portada decía «Seguir…» y el Desafío arrancaba sin código ni mapa).
{
  const g = main.slice(main.indexOf('function guardar() {'), main.indexOf('function guardar() {') + 4000);
  ok(/const empezadaAlAbrir = !!\(habiaGuardado && progreso\.pos\);/.test(main), 'se anota si la partida abierta ya estaba empezada');
  ok(/modo = 'jugando';\s*entroAlJuego = true;/.test(main), 'volver al juego marca que se entró');
  const i = g.indexOf('if (!empezadaAlAbrir && !entroAlJuego) progreso.pos = null;');
  ok(i > 0 && i < g.indexOf('guardarProgreso('), 'guardar no anota la posición antes de entrar');
}

// 2. El aviso de «el juego se recuperó» es de la apertura que hizo la recuperación: una recarga del juego (idioma,
//    calidad, modo, partida) conserva el ?recuperado= y no vuelve a avisar.
{
  ok(main.includes("const recargaDelJuego = (() => { try { return performance.getEntriesByType('navigation')[0]?.type === 'reload';"), 'se distingue la recarga del juego');
  ok(main.includes("const recuperadoDe = recargaDelJuego ? null : new URLSearchParams(location.search).get('recuperado');"), 'y entonces no hay aviso de recuperación');
  ok(!/new URLSearchParams\(location\.search\)\.get\('recuperado'\)/.test(main.replace("recargaDelJuego ? null : new URLSearchParams(location.search).get('recuperado')", '')), 'no se lee el ?recuperado= por otro lado');
}

// 3. La primera vez, las Radeon integradas que no se llaman «Radeon Graphics» también arrancan en baja (las placas
//    aparte, en media, como siempre).
{
  const baja = ['ANGLE (AMD, AMD Radeon R5 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', 'ANGLE (AMD, AMD Radeon(TM) R4 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon HD 8610G Direct3D11 vs_5_0 ps_5_0, D3D11)', 'ANGLE (AMD, AMD Radeon HD 7660D Direct3D11 vs_5_0 ps_5_0)',
    'ANGLE (AMD, AMD Radeon 780M Graphics (0x000015BF) Direct3D11 vs_5_0 ps_5_0, D3D11)', 'ANGLE (AMD, AMD Radeon(TM) 680M Direct3D11 vs_5_0 ps_5_0, D3D11)'];
  const media = ['ANGLE (AMD, AMD Radeon RX 7600M XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'ANGLE (AMD, AMD Radeon R7 200 Series Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon HD 8670M Direct3D11)', 'ANGLE (AMD, AMD Radeon R7 M265 Direct3D11)', 'ANGLE (AMD, Radeon RX 580 Series Direct3D11)'];
  for (const p of baja) ok(calidadParaEquipo(p) === 'baja', `integrada: ${p}`);
  for (const p of media) ok(calidadParaEquipo(p) === 'media', `aparte: ${p}`);
}

// 4. F2 prende el modo foto sólo desde el juego (jugando, la pausa, el cuaderno o el mapa): en la portada, la
//    victoria o la tarjeta del valle dejaba ese panel encima y el juego corriendo detrás.
{
  ok(main.includes("const fotoPosible = foto.activo || ((modo === 'jugando' || modo === 'pausa' || modo === 'cuaderno' || modo === 'mapa') && $('logros').classList.contains('oculto') && !modos?.panelAbierto());"), 'F2: en qué pantallas (y sin los logros ni las carreras encima)');
  ok(main.includes("if (e.code === 'F2' && jugador && fotoPosible && "), 'F2 mira la pantalla');
}

console.log(`✓ verificar-3-8-3-base: ${n} comprobaciones`);
