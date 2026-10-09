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

// ---------------------------------------------------------------- 5. desmontar la parrilla con el asado al fuego
// Los ingredientes se gastan al prender: desmontando, se perdían todos.
{
  const CP = await import('../src/cocina-pasos.js');
  const src = cuerpo('devolverContenido');
  const correr = (coccion) => {
    const progreso = { cosas: {}, entradas: {} };
    const sumarEntrada = (k, n) => { const e = progreso.entradas[k] || (progreso.entradas[k] = { cantidad: 0 }); e.cantidad += n; };
    const nada = () => {};
    new Function('d', 'progreso', 'sumarEntrada', 'sumarMaterial', 'refrescarBarra', 'sanearLenera', 'sanearAserradero', 'sanearMuela', 'sanearColmena', 'sanearAhumadero', 'sanearCoccion', 'pideCon', 'RECETA_PASOS', 'DEL_ALMACEN', src)(
      { coccion }, progreso, sumarEntrada, nada, nada, nada, nada, nada, nada, nada, CP.sanearCoccion, CP.pideCon, CP.RECETA_PASOS, CP.DEL_ALMACEN);
    return progreso;
  };
  const asado = Object.keys(CP.RECETA_PASOS).find((id) => CP.RECETA_PASOS[id].pide.some((x) => x.k === 'chorizo'));
  ok(asado, 'hay una receta con chorizos');
  const rc = CP.RECETA_PASOS[asado];
  const p = correr({ receta: asado, paso: 1, falta: 0 });
  const vuelve = (k) => (p.entradas[k]?.cantidad || 0) + (p.cosas[k] || 0);
  ok(rc.pide.every((x) => vuelve(x.k) === x.n), `vuelve lo que se puso al fuego (${JSON.stringify(p)})`);
  ok(rc.pide.filter((x) => CP.DEL_ALMACEN.includes(x.k)).every((x) => p.cosas[x.k] === x.n), 'lo del almacén, a las cosas');
  const robado = correr({ receta: asado, paso: 1, falta: 0, robado: true });
  ok(((robado.entradas.chorizo?.cantidad || 0) + (robado.cosas.chorizo || 0)) === rc.pide.find((x) => x.k === 'chorizo').n - 1, 'el chorizo que se robó el perro no vuelve');
  ok(Object.keys(correr(undefined).entradas).length === 0, 'sin nada al fuego, nada');
}

// ---------------------------------------------------------------- 6. la cocina: el panel sobre una obra desmontada, «Aprendiste» y «Faltan una hora»
{
  const { crearCocinaJuego } = await import('../src/cocina-juego.js');
  const { progresoNuevo } = await import('../src/guardado.js');
  const armar = () => {
    const p = progresoNuevo();
    p.dia = 3; p.horas = 12; p.materiales = { tronco: 5 }; p.cosas.harina = 4;
    const obra = { plano: { id: 'horno', etapas: [1] }, datos: { x: 0, z: 0, y: 0, etapas: 1 } };
    const obras = { obras: [obra], cubiertaDePieza: () => false, dentro: () => false };
    const notas = [];
    const sumarEntrada = (k, n) => { const e = p.entradas[k] || (p.entradas[k] = { cantidad: 0 }); e.cantidad = Math.max(0, (e.cantidad || 0) + n); return e.cantidad; };
    const cj = crearCocinaJuego({ progreso: () => p, desafio: () => false, obras: () => obras, jugador: () => ({ pos: { x: 1, z: 1 } }), lluvia: () => 0, invierno: () => false,
      nota: (t, s) => notas.push(`${t} | ${s}`), guardar: () => {}, troncos: () => p.materiales.tronco, gastarTroncos: (n) => { p.materiales.tronco -= n; }, sumarEntrada, sumarMaterial: () => {} });
    return { p, obra, obras, notas, cj };
  };
  // 6a. el panel abierto y la obra desmontada: no se gasta nada
  {
    const { p, obra, obras, cj } = armar();
    cj.usar(obra);
    ok(cj.panelAbierto(), 'E en el horno abre las recetas');
    obras.obras.length = 0;
    const antes = JSON.stringify([p.cosas, p.entradas, p.materiales]);
    cj.elegirPanel(0);
    ok(JSON.stringify([p.cosas, p.entradas, p.materiales]) === antes && !obra.datos.coccion && !cj.panelAbierto(), 'con la obra desmontada, elegir no gasta nada y cierra el panel');
  }
  // 6b. el pan de entrada, de punta a punta: sin «Aprendiste» y con «Falta una hora…» en singular
  {
    const { obra, notas, cj } = armar();
    cj.usar(obra); cj.elegirPanel(0);
    ok(obra.datos.coccion, `el pan, al horno (${notas.join(' / ')})`);
    obra.datos.coccion.falta = 1.5;
    cj.usar(obra);
    ok(notas.some((t) => /Falta una hora y 30 minutos/.test(t)) && !notas.some((t) => /Faltan una hora/.test(t)), `«Falta una hora y 30 minutos» (${notas.at(-1)})`);
    for (let i = 0; i < 8 && obra.datos.coccion; i++) { cj.__adelantar(3); cj.usar(obra); }
    ok(!obra.datos.coccion, 'el pan sale');
    await new Promise((r) => setTimeout(r, 1700));
    ok(!notas.some((t) => /^Aprendiste/.test(t)), `una receta de entrada no se «aprende» (${notas.filter((t) => /Aprendiste/.test(t)).join(' / ')})`);
  }
}
// 6c. con un panel abierto el aviso queda vacío (E lo cierra), aunque lo de más arriba lo vuelva a escribir
ok(/aviso = null;\n {4}\/\/ 3\.8\.3: con un panel abierto E lo cierra[\s\S]{0,200}if \(enElAlmacen \|\| enLaFeria \|\| enLasCargas\(\) \|\| cocinaJuego\?\.panelAbierto\(\) \|\| tallerTren\?\.panelAbierto\(\)\) aviso = null;\n {4}mostrarAviso\(aviso\);/.test(main), 'con un panel abierto, el aviso es el de la tecla E (nada), justo antes de mostrarlo');

// ---------------------------------------------------------------- 7. el deslizador de la hora del modo foto no hace correr el reloj
// aplicarFoto escribe progreso.horas: la cocina, el taller y las máquinas avanzaban con esa hora (y de vuelta, otra vez)
ok(main.includes("if (!foto.activo) cocinaJuego?.actualizar(dt);") && main.includes("if (modo === 'jugando' && !desafio && !foto.activo) tallerTren?.actualizar(dt);") && main.includes('if (!foto.activo) revisarMaquinas();'), 'en el modo foto no corren la cocina, el taller ni las máquinas');
ok(/function aplicarFoto[\s\S]{0,800}if \(foto\.activo\) progreso\.horas = foto\.hora;/.test(main), '(porque el modo foto pisa la hora del juego)');

// ---------------------------------------------------------------- 8. el taller del tren: «13:60», «a la tarde» a las 11 y la plataforma de atrás
{
  const TM = await import('../src/tren-mejoras.js');
  ok(TM.textoListo(85.995) === 'el día 3 a las 14' && TM.textoListo(82.5) === 'el día 3 a las 10:30' && TM.textoListo(79) === 'el día 3 a las 7', `las horas sin «:60» (${TM.textoListo(85.995)})`);
  let malas = 0;
  for (let t = 0; t < 200; t += 0.001) if (/:60|:6\d\b/.test(TM.textoListo(t))) malas++;
  ok(malas === 0, `ninguna hora con «:60» (${malas})`);
  const evento = (listo) => TM.eventosTaller({ ...TM.trenNuevo(), taller: { ...TM.trenNuevo().taller, pedido: { id: Object.keys(TM.MEJORAS_TREN)[0], listo } } })[0]?.texto || '';
  ok(/a primera hora$/.test(evento(3 * 24 + 7)) && /a la mañana$/.test(evento(3 * 24 + 11)) && /a la tarde$/.test(evento(3 * 24 + 16)), `el calendario: ${evento(3 * 24 + 7)} / ${evento(3 * 24 + 11)} / ${evento(3 * 24 + 16)}`);
  ok(/const atras = \{ x: 0, z: -\(COCHE\.L \/ 2 \+ 0\.45\), y, lado: 0, plataforma: true \};/.test(leer('src/tren.js')), 'la plataforma de atrás tiene lado (WASD llega)');
}

// ---------------------------------------------------------------- 9. la línea de estado del tren parado no dice «E para bajar» cuando E hace otra cosa
ok(main.includes("avisoLugarDelTren()?.tecla === 'E' ? '· W A S D para cambiar de lugar y bajar' : '· E para bajar · W A S D para cambiar de lugar'"), 'en la cocina, la cucheta o el mate, la línea de estado no promete bajar con E');

console.log(`verificar-3-8-3-mundo: ${n} comprobaciones OK`);
