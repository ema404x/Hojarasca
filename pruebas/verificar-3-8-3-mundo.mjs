// 3.8.3 (mundo) — pase de bugs de vehículos, cocina y mundo antes de Steam. Una comprobación por arreglo.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
let n = 0;
// los módulos que importan three, con el three local del juego (como en verificar-3-6-mecanicas.mjs)
{
  const codigo = leer('three-r186-inline.js');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  vm.runInNewContext(codigo + '\n;this.__claves = Object.keys(THREE);', caja);
  const archivo = path.join(os.tmpdir(), 'hojarasca-three-383-mundo.mjs');
  fs.writeFileSync(archivo, codigo + '\nexport const { ' + caja.__claves.join(', ') + ' } = THREE;\n');
  register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(archivo).href)}, shortCircuit: true }; return n(s, c); }`));
}
const ok = (c, m) => { assert.ok(c, m); n++; };
// el cuerpo de una función de main.js (hasta la llave que la cierra en la columna 0)
function cuerpo(nombre) {
  const i = main.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  const f = main.indexOf('\n}\n', i);
  return main.slice(main.indexOf('{', i) + 1, f);
}

// ---------------------------------------------------------------- 1. bajarse del zaino al lado de una pared
// Antes se bajaba siempre 1,1 m a la izquierda, sin mirar: pegado a una pared o una cerca, quedabas del otro lado.
{
  const src = cuerpo('desmontar');
  const correr = (pared) => {
    const js = { pos: { x: 0, y: 0, z: 0 }, yaw: 0, montado: {} };
    const c = {};
    const col = { paredEntre: (ax, az, bx, bz) => pared(bx, bz) };
    new Function('jugador', 'caballo', 'yawCaballo', 'nota', 'guardar', 'col', src)({ estado: js }, () => c, (y) => y + Math.PI, () => {}, () => {}, col);
    return { js, c };
  };
  // sin paredes: a la izquierda (yaw 0 mira a -z: la izquierda es -x), como siempre
  let r = correr(() => false);
  ok(r.js.pos.x < -1 && !r.js.montado && r.c.x === 0, 'sin paredes, se baja por la izquierda y el zaino queda donde estaba');
  // pared a la izquierda: por la derecha
  r = correr((x) => x < 0);
  ok(r.js.pos.x > 1, 'con una pared a la izquierda, se baja por la derecha');
  // paredes de los dos lados: al lado del zaino, sin cruzar ninguna
  r = correr(() => true);
  ok(r.js.pos.x === 0 && r.js.pos.z === 0, 'con paredes de los dos lados, no se cruza ninguna');
}

// ---------------------------------------------------------------- 2. el caballo con nombre, a la jaula
// Con nombre propio el aviso decía «Subiste Tormenta a la jaula».
{
  const src = cuerpo('subirCaballoAlTren');
  const notas = [];
  const correr = (nombre) => {
    notas.length = 0;
    const js = { montado: {} };
    const sin = () => {};
    new Function('jugador', 'viajeTren', 'tren', 'caballoMundo', 'diario', 'registrar', 'sonido', 'nota', 'guardar', src)(
      { estado: js }, () => ({}), { tren: { ponerCaballo: sin, subirCaballo: sin }, subir: sin }, { apariencia: () => null, nombre: () => nombre },
      { anotar: sin }, sin, { casco: sin }, (t) => notas.push(t), sin);
    return notas[0];
  };
  ok(correr('Tormenta') === 'Subiste a Tormenta a la jaula', `con nombre: «${correr('Tormenta')}»`);
  ok(correr('') === 'Subiste al zaino a la jaula', `sin nombre: «${correr('')}»`);
}

// ---------------------------------------------------------------- 3. la granja
{
  const G = await import('../src/granja.js');
  const { crearGranjaJuego } = await import('../src/granja-juego.js');
  const armar = (g, entradas) => {
    const notas = [];
    const P = { dia: 10, horas: 10, entradas, granja: g };
    const J = crearGranjaJuego({ progreso: () => P, ajustes: () => ({ estacion: 'verano' }), desafio: () => false, mundo: null, obras: () => [], terminada: () => true,
      corral: () => null, ovejas: () => [], ovejaCerca: () => null, nota: (t, s) => notas.push(`${t} · ${s}`), sumarEntrada: (k, n) => { entradas[k].cantidad += n; }, registrar: () => {}, refrescarBarra: () => {}, guardar: () => {} });
    return { J, notas, P };
  };
  // 3a. la camada que nace al echar las sobras se avisa (antes nacía en silencio, con «0 raciones»)
  {
    const g = G.granjaNueva(7);
    g.chancha = { id: 1, desde: 1, cuenta: 9, comio: 9, comidos: G.GRANJA.diasCamada - 1, lugar: null };
    g.sig = 2;
    const { J, notas, P } = armar(g, { papa: { cantidad: 3 } });
    J.echarALaBatea();
    const nacieron = P.granja.lechones.length;
    ok(nacieron > 0, `la chancha come ya y nace la camada (${nacieron})`);
    ok(notas.some((t) => /La chancha tuvo (un lechón|\d lechones)/.test(t)), `y se avisa (${notas.join(' / ')})`);
    ok(!notas.some((t) => /\b0 raciones/.test(t)), 'sin «0 raciones»');
  }
  // 3b. «tuvo 1 lechones» y «con 0 días»
  {
    const g = G.granjaNueva(7);
    g.chancha = { id: 1, desde: 1, cuenta: 9, comio: 9, comidos: G.GRANJA.diasCamada - 1, lugar: null };
    g.lechones = Array.from({ length: G.GRANJA.lechones - 1 }, (_, i) => ({ id: 2 + i, nacio: 1, engorde: 0 }));
    g.sig = 20;
    const { J, notas } = armar(g, { papa: { cantidad: 3 } });
    J.echarALaBatea();
    ok(notas.some((t) => /La chancha tuvo un lechón/.test(t)) && !notas.some((t) => /tuvo 1 lechones/.test(t)), `un lechón, en singular (${notas.join(' / ')})`);
    const h = G.granjaNueva(7);
    h.chancha = { id: 1, desde: 1, cuenta: 9, comio: 9, comidos: G.GRANJA.diasCamada, lugar: null }; h.batea = 1;
    ok(!/\b0 días/.test(G.textoChancha(h)), `la chancha no dice «0 días» (${G.textoChancha(h)})`);
  }
  // 3c. un frutal grande plantado fuera de la primavera no promete fruta este año
  {
    for (const especie of Object.keys(G.FRUTALES)) for (let plantado = 1; plantado <= 24; plantado++) {
      const f = { especie, plantado, cosecha: -1 };
      const p = G.primeraFruta(f);
      for (let dia = plantado; p && dia < p; dia++) {
        const t = G.textoFrutal(f, dia, 12);
        if (G.anioDe(p) > G.anioDe(dia) && !/en flor/.test(t) && / en (verano|otoño)$/.test(t)) ok(false, `${especie} plantado el día ${plantado}: el día ${dia} dice «${t}» y la fruta llega el ${p}`);
      }
    }
    ok(/da fruta el día 16/.test(G.textoFrutal({ especie: 'frambuesa', plantado: 3, cosecha: -1 }, 7, 12)), `el frambueso del día 3, el día 7: «${G.textoFrutal({ especie: 'frambuesa', plantado: 3, cosecha: -1 }, 7, 12)}»`);
  }
  // 3d. un id enorme en un guardado roto no deja a todos los nuevos con el mismo id
  {
    const g = G.sanearGranja({ vaca: { id: 1e20, desde: 1 }, terneros: [{ id: 0, nacio: 1 }, { id: 0, nacio: 1 }], sig: 1e30 }, 10, 3);
    const ids = [g.vaca.id, ...g.terneros.map((t) => t.id)];
    ok(new Set(ids).size === ids.length && ids.every((k) => Number.isSafeInteger(k)), `ids distintos (${ids.join(', ')})`);
    const a = g.sig++, b = g.sig;
    ok(b === a + 1, 'y el que sigue suma');
  }
}

// ---------------------------------------------------------------- 4. cargar con el caballo en la jaula
// La bajada del caballo guarda: corría antes de ubicar al jugador (en 0, 0) y la partida quedaba en el medio del mapa.
{
  const ubicar = main.indexOf('if (progreso.pos) jugador.ubicar(progreso.pos.x, progreso.pos.z, progreso.yaw, progreso.pos.y);');
  const baja = main.indexOf('progreso.trenViaje?.caballo && !jugador.estado.enTren) bajarCaballoDelTren();');
  ok(ubicar > 0 && baja > ubicar && baja - ubicar < 800, 'el caballo de la jaula baja después de ubicar al jugador');
  ok(!/progreso\.trenViaje\?\.caballo && !jugador\?\.estado\?\.enTren/.test(main), 'y no queda la llamada de antes');
}

console.log(`verificar-3-8-3-mundo: ${n} comprobaciones OK`);
