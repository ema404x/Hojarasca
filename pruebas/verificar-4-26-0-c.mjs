// 4.26.0 (C): los interiores que faltaban (el refugio, las cabañas, el almacén y las casas prefabricadas del jugador).
//
// 1. interior-visible.js (puro): las aberturas de cada estructura se vuelven puntos cada medio metro como mucho (una ventana ancha vista de cerca no
//    se escapa entre dos puntos), `cajaDeLugar` arma la caja de una estructura del valle con sus aberturas y `cajaDeCasa` la de una casa del jugador
//    con la puerta en el centro del frente (−z). La regla de siempre: si una abertura cae en lo que mira la cámara, se dibuja todo.
// 2. main.js: `interiorDelValle` (con el código de verdad, con un mundo de mentira): encuentra el refugio, las cabañas, el almacén y las casas
//    terminadas de la lista; no las que están en obra, en edición, las abiertas (el quincho) ni en el Desafío; arma cada caja una vez y la rehace si
//    la estructura cambia de lugar. `apagarExterior` usa el valle aunque no haya aldea.
// 3. estructuras.js: los números de las paredes y las aberturas son los de la geometría (la puerta y las ventanas del refugio, de la cabaña y del almacén).
// 4. objetos.js: los bultos de lo que tirás con V tienen nombre propio (no se apagan con el exterior cuando están adentro de tu casa).
// Cada mutación es una copia con el texto cambiado a propósito y tiene que hacer fallar su comprobación (las del módulo puro, un proceso por copia:
// la caché de ESM sólo mide la primera).
//
// Uso: node pruebas/verificar-4-26-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { funcion } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// Un punto del marco de una caja (a lo ancho a, a lo hondo b) en el mundo: la conversión de estructuras.js (aMundo) y de construccion.js
const enMundo = (c, a, b, y) => ({ x: c.x + a * Math.cos(c.rot) + b * Math.sin(c.rot), y, z: c.z - a * Math.sin(c.rot) + b * Math.cos(c.rot) });
// La mira de la cámara con un rumbo (yaw) como el del juego: (−sen, −cos)
const mira = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
// El rumbo para mirar hacia +a, −a, +b o −b del marco de una caja girada `rot`
const rumbo = (rot, hacia) => rot + ({ '-b': 0, '+b': Math.PI, '+a': -Math.PI / 2, '-a': Math.PI / 2 })[hacia];

// ---------------------------------------------------------------- 1: lo que tiene que cumplir interior-visible.js (devuelve la lista de lo que falla)
function comprobarInterior(M) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const cos = M.cosVistaDe(70, 16 / 9);
  // puntosDeAbertura
  const p = M.puntosDeAbertura([1.65, 2.75, 2.75, 2.75]);
  falla(p.length >= 3 && p[0][0] === 1.65 && p[p.length - 1][0] === 2.75 && p.every((q) => q[1] === 2.75), 'puntosDeAbertura: las dos puntas y los puntos del medio, sobre la pared');
  let paso = 0; for (let i = 1; i < p.length; i++) paso = Math.max(paso, Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  falla(paso <= 0.5 + 1e-9, `puntosDeAbertura: cada medio metro como mucho (${paso.toFixed(2)})`);
  falla(M.puntosDeAbertura([0, 0, 0, 0]).length === 2, 'puntosDeAbertura: un tramo de largo cero da sus dos puntas (no se pierde)');
  falla(M.puntosDeAbertura([-3.5, -0.6, -3.5, 0.6]).every((q) => q[0] === -3.5), 'puntosDeAbertura: una ventana del costado queda sobre el costado');
  // cajaDeLugar
  const ref = { x: 200, z: -80, y: 12, rot: 0.9, ancho: 7, fondo: 5.5, alto: 3, aberturas: [[-0.6, 2.75, 0.6, 2.75], [1.65, 2.75, 2.75, 2.75], [-3.5, -0.6, -3.5, 0.6]] };
  const c = M.cajaDeLugar('refugio', ref);
  falla(c && c.id === 'refugio' && c.x === 200 && c.z === -80 && c.y === 12 && c.rot === 0.9 && c.ancho === 7 && c.fondo === 5.5 && c.alto === 3, 'cajaDeLugar: la caja con el lugar, el giro y las medidas');
  falla(c && c.frente.length >= 9 && c.frente.some((q) => q[0] === -3.5) && c.frente.some((q) => q[0] === 2.75 && q[1] === 2.75), 'cajaDeLugar: los puntos de las tres aberturas (puerta, ventana del frente, ventana del costado)');
  falla(M.cajaDeLugar('refugio', { ...ref, ancho: undefined }) === null && M.cajaDeLugar('refugio', { ...ref, alto: 0 }) === null && M.cajaDeLugar('refugio', { ...ref, y: NaN }) === null, 'cajaDeLugar: sin medidas, null (no se adivina)');
  falla(M.cajaDeLugar('refugio', { ...ref, aberturas: [] }) === null && M.cajaDeLugar('refugio', { ...ref, aberturas: undefined }) === null, 'cajaDeLugar: sin aberturas, null (no se sabe por dónde se ve para afuera)');
  falla(M.cajaDeLugar('refugio', null) === null, 'cajaDeLugar: sin lugar, null');
  falla(M.cajaDeLugar('x', { ...ref, rot: undefined })?.rot === 0, 'cajaDeLugar: sin giro, 0');
  // la regla en el refugio de verdad: desde el centro, de espaldas al frente se apaga; mirando el frente (la puerta) o el costado de la ventana, no
  if (c) {
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
    const cam = enMundo(c, 0, 0, 12 + 0.37 + 1.6);
    const it = M.interiorDeCaja(cam, c, sal);
    falla(it === sal && it.id === 'refugio' && it.puertas.length === c.frente.length, 'refugio: en el centro está adentro, con todas sus aberturas');
    falla(M.apagarExteriorAhora(it, cam, mira(rumbo(c.rot, '-b')), cos) === true, 'refugio: de espaldas a la puerta, mirando al fondo, se apaga el exterior');
    falla(M.apagarExteriorAhora(it, cam, mira(rumbo(c.rot, '+b')), cos) === false, 'refugio: mirando la puerta se dibuja todo');
    falla(M.apagarExteriorAhora(it, cam, mira(rumbo(c.rot, '-a')), cos) === false, 'refugio: mirando la ventana del costado (−a) se dibuja todo');
    falla(M.apagarExteriorAhora(it, cam, mira(rumbo(c.rot, '+a')), cos) === false, 'refugio: mirando al costado sin ventana el frente asoma por un borde del cuadro: se dibuja todo');
    const fondo = enMundo(c, 1.5, -1.8, cam.y);
    const it2 = M.interiorDeCaja(fondo, c, sal);
    falla(M.apagarExteriorAhora(it2, fondo, mira(rumbo(c.rot, '+a')), cos) === true, 'refugio: desde el fondo, mirando la pared sin ventana (+a), se apaga');
    falla(M.interiorDeCaja(enMundo(c, 0, 0, 12 + 3.2), c, sal) === null, 'refugio: arriba de las paredes (en el techo) ya no cuenta como adentro');
    falla(M.interiorDeCaja(enMundo(c, 0, 3.4, cam.y), c, sal) === null, 'refugio: en el umbral, afuera de las paredes, no');
  }
  // una ventana ancha vista de cerca: el medio queda fuera del cuadro pero la punta no
  {
    const ancha = M.cajaDeLugar('prueba', { x: 0, z: 0, y: 0, rot: 0, ancho: 6, fondo: 6, alto: 3, aberturas: [[-2, 3, 2, 3]] });
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
    const cam = { x: 0, y: 1.6, z: 1.6 };
    const it = M.interiorDeCaja(cam, ancha, sal);
    falla(it && M.apagarExteriorAhora(it, cam, { x: -1, z: 0 }, cos) === false, 'una ventana de 4 m a 1,4 m: el medio queda a 90 grados pero la punta entra en el cuadro: se dibuja todo');
    falla(it && M.apagarExteriorAhora(it, cam, { x: 0, z: -1 }, cos) === true, 'y de espaldas a la ventana, se apaga');
  }
  // cajaDeCasa
  falla(M.CASAS_CERRADAS.has('cabana-piedra') && M.CASAS_CERRADAS.has('casa-galeria') && M.CASAS_CERRADAS.has('casona') && M.CASAS_CERRADAS.has('salon-grande') && M.CASAS_CERRADAS.has('torreon-piedra'), 'las casas prefabricadas cerradas están en la lista');
  // (4.26.1 (A), ajustada a propósito: la casilla, el puesto de troncos, el taller anexo, la buhardilla y la planta alta entran: sus rendijas se cerraron con geometría)
  falla(M.CASAS_CERRADAS.has('casilla') && M.CASAS_CERRADAS.has('taller-anexo') && M.CASAS_CERRADAS.has('planta-alta') && M.CASAS_CERRADAS.has('buhardilla') && !M.CASAS_CERRADAS.has('puesto'), 'la casilla, el taller anexo, la planta alta (4.26.1) y la buhardilla (4.26.3) entran; el puesto de troncos no (la equivalencia de imagen lo dejó afuera)');
  falla(!M.CASAS_CERRADAS.has('quincho') && !M.CASAS_CERRADAS.has('galeria-cerrada') && !M.CASAS_CERRADAS.has('piso-modular') && !M.CASAS_CERRADAS.has('techo-modular'), 'el quincho (frente abierto), la galería cerrada (sin pared de atrás) y lo modular quedan afuera');
  const casa = { id: 'casa-galeria', x: -50, z: 30, y: 4, rot: 2.1, ancho: 7.8, fondo: 5.6, alto: 2.6 };
  const k = M.cajaDeCasa(casa);
  falla(k && k.id === 'obra-casa-galeria' && k.ancho === 7.8 && k.fondo === 5.6 && Math.abs(k.alto - (2.6 + 0.25)) < 1e-9, 'cajaDeCasa: la caja de la casa, con las paredes hasta alto + 0,25 (Y0 + alto − 0,35)');
  falla(k && k.frente.every((q) => q[1] === -2.8) && k.frente.some((q) => q[0] === -0.6) && k.frente.some((q) => q[0] === 0.6), 'cajaDeCasa: la puerta en el centro del frente (−z), de jamba a jamba');
  falla(M.cajaDeCasa({ ...casa, id: 'casilla' }) !== null && M.cajaDeCasa({ ...casa, id: 'puesto' }) === null, 'cajaDeCasa: la casilla tiene caja (4.26.1) y el puesto de troncos no');
  falla(M.cajaDeCasa({ ...casa, id: 'quincho' }) === null && M.cajaDeCasa({ ...casa, id: 'pared-modular' }) === null, 'cajaDeCasa: lo que no es una casa cerrada, null');
  falla(M.cajaDeCasa({ ...casa, ancho: 0 }) === null && M.cajaDeCasa({ ...casa, y: undefined }) === null && M.cajaDeCasa(null) === null, 'cajaDeCasa: sin medidas, null');
  if (k) {
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
    const cam = enMundo(k, 0, 0, 4 + 0.62 + 1.6);
    const it = M.interiorDeCaja(cam, k, sal);
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k.rot, '+b')), cos) === true, 'casa: en el centro, mirando al fondo (+b, de espaldas a la puerta del frente), se apaga');
    falla(it && M.apagarExteriorAhora(it, cam, mira(rumbo(k.rot, '-b')), cos) === false, 'casa: mirando la puerta (−b) se dibuja todo');
    falla(M.interiorDeCaja(enMundo(k, 0, -3.5, cam.y), k, sal) === null, 'casa: en la galería (delante del frente), afuera');
    falla(M.interiorDeCaja(enMundo(k, 0, 0, 4 + 3.0), k, sal) === null, 'casa: arriba de las paredes, afuera');
  }
  falla(M.LUGARES_CERRADOS.join() === 'refugio,cabana,puesto,almacen', 'las estructuras del valle: el refugio, las dos cabañas y el almacén');
  return mal;
}

// ---------------------------------------------------------------- las copias mutadas corren sólo la comprobación y dicen cuántas fallas tienen
const hijo = process.argv.indexOf('--hijo');
if (hijo > 0) {
  const M = await import(pathToFileURL(process.argv[hijo + 1]).href);
  console.log(String(comprobarInterior(M).length));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

const I = await import('../src/interior-visible.js');
{
  const mal = comprobarInterior(I);
  ok(mal.length === 0, `interior-visible.js: aberturas, cajas del valle y de las casas (${mal.join(' | ') || 'sin fallas'})`);
}

// ---------------------------------------------------------------- 2: main.js con el código de verdad
const fuenteMain = leer('src/main.js');
{
  const lugaresBase = () => ({
    refugio: { x: 0, z: 0, y: 10, rot: 0.3, ancho: 7, fondo: 5.5, alto: 3, aberturas: [[-0.6, 2.75, 0.6, 2.75]] },
    cabana: { x: 100, z: 0, y: 5, rot: 0, ancho: 4.6, fondo: 4, alto: 2.45, aberturas: [[-0.55, 2, 0.55, 2]] },
    almacen: { x: 0, z: 100, y: 7, rot: 1, ancho: 7.5, fondo: 5.5, alto: 3.35, aberturas: [[-0.58, -2.75, 0.58, -2.75]] },
  });
  const obra = (id, x, z, extra = {}) => ({ plano: { id, ancho: 5, fondo: 4, alto: 2.4, etapas: [1, 2, 3, 4] }, datos: { x, z, y: 3, rot: 0, etapas: 4 }, ...extra });
  const armarEnv = (op = {}) => {
    const lista = op.obras || [];
    const env = {
      desafio: op.desafio || null,
      T: { lugares: op.lugares || lugaresBase(), altura: () => 3 },
      obras: op.sinObras ? null : { obrasCerca: (pos, r, salida) => { salida.length = 0; for (const o of lista) if (Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) < r) salida.push(o); return salida; }, get editando() { return op.editando || null; } },
      salidaValle: { id: '', x: 0, z: 0, radio: 0, puertas: null }, cajasInterior: new WeakMap(), obrasInterior: [],
      LUGARES_CERRADOS: I.LUGARES_CERRADOS, CASAS_CERRADAS: I.CASAS_CERRADAS, cajaDeLugar: I.cajaDeLugar, cajaDeCasa: I.cajaDeCasa, interiorDeCaja: I.interiorDeCaja,
    };
    return env;
  };
  const comprobarValle = (fuente) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    const crear = (op) => { const env = armarEnv(op); env.cajaCacheada = funcion(fuente, 'cajaCacheada', env); const f = funcion(fuente, 'interiorDelValle', env); return { env, f }; };
    const { env, f } = crear({});
    const r1 = f({ x: 0, y: 11.9, z: 0 });
    falla(r1 && r1.id === 'refugio' && r1 === env.salidaValle && r1.puertas.length >= 3, 'interiorDelValle: en el centro del refugio devuelve el refugio con su puerta');
    falla(f({ x: 100, y: 7, z: 0 })?.id === 'cabana', 'interiorDelValle: la cabaña');
    falla(f({ x: 0, y: 9, z: 100 })?.id === 'almacen', 'interiorDelValle: el almacén');
    falla(f({ x: 50, y: 5, z: 50 }) === null, 'interiorDelValle: en el campo, null');
    falla(f({ x: 0, y: 14, z: 0 }) === null, 'interiorDelValle: arriba del techo del refugio, null');
    falla(crear({ desafio: {} }).f({ x: 0, y: 11.9, z: 0 }) === null, 'interiorDelValle: en el Desafío no (los duendes son instancias sin nombre y entran por la puerta)');
    // las casas del jugador
    const casilla = obra('cabana-piedra', 300, 300), quincho = obra('quincho', 330, 300), enObra = obra('casa-galeria', 360, 300, { datos: { x: 360, z: 300, y: 3, rot: 0, etapas: 2 } }), editada = obra('casona', 390, 300);
    const cc = crear({ obras: [casilla, quincho, enObra, editada], editando: editada });
    falla(cc.f({ x: 300, y: 5.2, z: 300 })?.id === 'obra-cabana-piedra', 'interiorDelValle: adentro de una cabaña de tablas y piedra terminada');
    falla(cc.f({ x: 330, y: 5.2, z: 300 }) === null, 'interiorDelValle: el quincho no (frente abierto)');
    falla(cc.f({ x: 360, y: 5.2, z: 300 }) === null, 'interiorDelValle: una casa a medio hacer no (sin paredes ni techo)');
    falla(cc.f({ x: 390, y: 5.2, z: 300 }) === null, 'interiorDelValle: la casa que estás editando no');
    falla(crear({ sinObras: true }).f({ x: 300, y: 5.2, z: 300 }) === null, 'interiorDelValle: sin construcción, null (no se rompe)');
    // la caja se arma una vez y se rehace si la casa cambia de lugar
    cc.f({ x: 300, y: 5.2, z: 300 });
    const caja1 = cc.env.cajasInterior.get(casilla);
    cc.f({ x: 300.5, y: 5.2, z: 300 });
    falla(caja1 && cc.env.cajasInterior.get(casilla) === caja1, 'interiorDelValle: la caja de una casa se arma una vez, no en cada cuadro');
    casilla.datos.x = 301; cc.f({ x: 301, y: 5.2, z: 300 });
    falla(cc.env.cajasInterior.get(casilla) !== caja1 && cc.env.cajasInterior.get(casilla).x === 301, 'interiorDelValle: si la casa se mueve, la caja se rehace');
    const lug = lugaresBase(), cl = crear({ lugares: lug });
    cl.f({ x: 0, y: 11.9, z: 0 }); const cr1 = cl.env.cajasInterior.get(lug.refugio);
    lug.refugio.x = 20; cl.f({ x: 20, y: 11.9, z: 0 });
    falla(cr1 && cl.env.cajasInterior.get(lug.refugio) !== cr1 && cl.env.cajasInterior.get(lug.refugio).x === 20, 'interiorDelValle: si el refugio cambia de lugar, la caja se rehace');
    const sinMedidas = lugaresBase(); delete sinMedidas.refugio.aberturas;
    const cs = crear({ lugares: sinMedidas });
    falla(cs.f({ x: 0, y: 11.9, z: 0 }) === null && cs.f({ x: 0, y: 11.9, z: 0 }) === null, 'interiorDelValle: una estructura sin aberturas no cuenta (y queda anotada como nula, sin rehacerla en cada cuadro)');
    return mal;
  };
  const mal = comprobarValle(fuenteMain);
  ok(mal.length === 0, `main.js: interiorDelValle con el código de verdad (${mal.join(' | ') || 'sin fallas'})`);
  const mus = [
    ['sin-desafio', '  if (desafio) return null;\n  for (let i = 0; i < LUGARES_CERRADOS.length', '  for (let i = 0; i < LUGARES_CERRADOS.length'],
    ['sin-lugares', 'if (c && interiorDeCaja(cam, c, salidaValle)) return salidaValle;\n  }\n  if (!obras', 'if (false) return salidaValle;\n  }\n  if (!obras'],
    ['sin-casas', "const c = cajaCacheada(o, d.x, d.z, d.rot, P.id,", "const c = null && cajaCacheada(o, d.x, d.z, d.rot, P.id,"],
    // (sacar el `CASAS_CERRADAS.has` de main.js no cambia nada: cajaDeCasa también lo mira, y esa la prueba la mutación «casa-cualquiera»)
    ['casa-sin-altura', 'y: Number.isFinite(d.y) ? d.y : T.altura(d.x, d.z),', 'y: 0,'],
    ['casas-en-obra', ' || !(d.etapas >= P.etapas.length)) continue;', ') continue;'],
    ['casa-en-edicion', ' || o === editando || ', ' || '],
    ['caja-cada-cuadro', 'if (c === undefined || c.__x !== x', 'if (true || c.__x !== x'],
    ['caja-sin-mover', 'c.__x !== x || c.__z !== z || ', ''],
    ['sin-obras-se-rompe', '  if (!obras?.obrasCerca) return null;\n', ''],
  ];
  for (const [n, de, a] of mus) {
    if (!fuenteMain.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    let m; try { m = comprobarValle(fuenteMain.replace(de, a)); } catch (e) { m = ['se rompió: ' + String(e.message).slice(0, 60)]; }
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }
}
// apagarExterior: el valle cuenta aunque no haya aldea, y la bandera de las pruebas de equivalencia lo apaga
{
  const mk = (nombre, extra = {}) => ({ name: nombre, visible: true, children: [], ...extra });
  const correr = (fuente, op = {}) => {
    const terreno = mk('terreno'), instanciado = mk('', { isInstancedMesh: true, count: 40 }), bultos = mk('bultos-tirados', { isInstancedMesh: true, count: 2 }), casa = mk('');
    const it = { id: 'refugio', x: 0, z: 0, radio: 6.5, puertas: [{ x: 0, z: -3 }], conTerreno: op.sinTerrenoPropio ? undefined : true };
    const env = {
      aldeaMundo: op.aldea ? { interiorDe: () => null } : null,
      interiorDeLaCasaDeTe: () => null,
      interiorDelValle: () => (op.afuera ? null : it),
      window: { __hojarasca: op.debug ? { __sinInteriorVisible: true } : {} },
      camara: { position: { x: 0, y: 1.6, z: 0 }, fov: 70, aspect: 16 / 9, getWorldDirection(v) { v.x = 0; v.y = 0; v.z = op.mirandoLaPuerta ? -1 : 1; } },
      miraDeInterior: { x: 0, y: 0, z: 0 }, miraPlana: { x: 0, z: 0 },
      apagarExteriorAhora: I.apagarExteriorAhora, quedaAfuera: I.quedaAfuera, cosVistaDe: I.cosVistaDe,
      exteriorApagado: [], exteriorEstabaApagado: false, renderer: { shadowMap: { enabled: true, needsUpdate: !!op.sombras } },
      escena: { children: [terreno, instanciado, bultos, casa] }, pasto: null, veg: { chunks: new Map() }, gente: { gente: [] }, statsInterior: { cuadros: 0, apagados: 0, ultimosApagados: 0 },
    };
    funcion(fuente, 'apagarExterior', env)();
    return { terreno, instanciado, bultos, casa, env };
  };
  const comprobar = (fuente) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    const a = correr(fuente, {});
    falla(!a.instanciado.visible, 'sin aldea (el valle), adentro del refugio de espaldas a la puerta: se apaga lo instanciado');
    falla(a.terreno.visible && !a.env.exteriorApagado.includes(a.terreno), 'en el valle el terreno queda (entre las tablas del piso se ve el suelo) y no queda anotado para prender');
    falla(!correr(fuente, { sinTerrenoPropio: true }).terreno.visible, 'un interior sin conTerreno (la aldea) apaga el terreno como siempre');
    const s = correr(fuente, { sombras: true });
    falla(s.instanciado.visible && s.env.exteriorApagado.length === 0, 'el cuadro en que se rehace el mapa de sombras se dibuja entero (las sombras de afuera no se pierden)');
    falla(a.bultos.visible && a.casa.visible, 'los bultos que tiraste (con nombre propio) y la casa siguen');
    const b = correr(fuente, { aldea: true });
    falla(!b.instanciado.visible, 'con aldea (y fuera de sus edificios), el valle también cuenta');
    falla(correr(fuente, { mirandoLaPuerta: true }).instanciado.visible, 'mirando la puerta, no se apaga');
    falla(correr(fuente, { debug: true }).instanciado.visible, 'con __sinInteriorVisible (las pruebas de equivalencia) no se apaga');
    falla(correr(fuente, { afuera: true }).instanciado.visible, 'afuera, no se apaga');
    return mal;
  };
  const mal = comprobar(fuenteMain);
  ok(mal.length === 0, `main.js: apagarExterior con el valle (${mal.join(' | ') || 'sin fallas'})`);
  for (const [n, de, a] of [
    ['valle-solo-con-aldea', '|| interiorDelValle(cam)) : null;', ') : null;'],
    ['valle-sin-terreno', "  if (it.conTerreno) for (let i = exteriorApagado.length - 1;", "  if (false) for (let i = exteriorApagado.length - 1;"],
    ['valle-terreno-anotado', 'o.visible = true; exteriorApagado.splice(i, 1);', 'o.visible = true;'],
    ['sombras-con-exterior-apagado', '  if (apagar && renderer.shadowMap.enabled && renderer.shadowMap.needsUpdate) apagar = false;', ''],
    ['valle-sin-bandera', "const it = !window.__hojarasca?.__sinInteriorVisible ? ((aldeaMundo", "const it = true ? ((aldeaMundo"],
  ]) {
    if (!fuenteMain.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    let m; try { m = comprobar(fuenteMain.replace(de, a)); } catch (e) { m = ['se rompió: ' + String(e.message).slice(0, 60)]; }
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }
  ok(/import \{[^}]*cajaDeLugar[^}]*cajaDeCasa[^}]*LUGARES_CERRADOS[^}]*CASAS_CERRADAS[^}]*\} from '\.\/interior-visible\.js';/.test(fuenteMain), 'main.js: el import de interior-visible.js sigue en una línea (armar.mjs sólo entiende esos)');
}

// ---------------------------------------------------------------- 3: estructuras.js, los números son los de la geometría
{
  const est = leer('src/estructuras.js');
  const bloque = (desde, hasta) => est.slice(est.indexOf(desde), est.indexOf(hasta, est.indexOf(desde)));
  const ref = bloque('// ---------------------------------------------------------------- refugio', 'if (puertas) puertas.agregar({ sitio: { x: ref.x');
  ok(/const W = 7, D = 5\.5, H = 2\.7;/.test(ref) && /const PUERTA = \{ x0: -0\.6, x1: 0\.6 \};/.test(ref), 'refugio: 7 × 5,5 con la puerta de −0,6 a 0,6');
  ok(/ref\.ancho = 7; ref\.fondo = 5\.5; ref\.alto = 3\.0; ref\.aberturas = \[\[-0\.6, 2\.75, 0\.6, 2\.75\], \[1\.65, 2\.75, 2\.75, 2\.75\], \[-3\.5, -0\.6, -3\.5, 0\.6\]\];/.test(ref), 'refugio: paredes y aberturas (la puerta, la ventana del frente y la del costado) en estructuras.js');
  ok(/cilindroEntre\(c, \[PUERTA\.x1, y, D \/ 2\], \[1\.65, y, D \/ 2\]/.test(ref) && /cilindroEntre\(c, \[2\.75, y, D \/ 2\]/.test(ref), 'refugio: la ventana del frente es el hueco entre troncos de 1,65 a 2,75 (la geometría)');
  ok(/cilindroEntre\(c, \[-W \/ 2, y, -D \/ 2 - 0\.3\], \[-W \/ 2, y, -0\.6\]/.test(ref) && /cilindroEntre\(c, \[-W \/ 2, y, 0\.6\]/.test(ref), 'refugio: el hueco del costado (−W/2) de −0,6 a 0,6 (la geometría)');
  ok(/for \(let i = 0; i < 9; i\+\+\) \{\s*const y = 0\.5 \+ i \* radio \* 1\.85;/.test(ref) && /const radio = 0\.16;/.test(ref), 'refugio: el último tronco a 0,5 + 8 × 0,296 + 0,16 ≈ 3,0 m (el alto de la caja)');
  const cab = bloque('function cabaña(clave, nombre, x, z, mirarA, opciones = {}) {', 'cabañas.push(info);');
  ok(/const PUERTA = \{ x0: -0\.55, x1: 0\.55 \};/.test(cab) && /cilindroEntre\(c, \[-W \/ 2, yy, -D \/ 2 - 0\.25\], \[-W \/ 2, yy, -0\.5\]/.test(cab) && /cilindroEntre\(c, \[-W \/ 2, yy, 0\.5\]/.test(cab), 'cabaña: la puerta (−0,55 a 0,55) y el hueco del costado (−0,5 a 0,5) en la geometría');
  ok(/ancho: W, fondo: D, alto: 2\.45, aberturas: \[\[PUERTA\.x0, D \/ 2, PUERTA\.x1, D \/ 2\], \[-W \/ 2, -0\.5, -W \/ 2, 0\.5\]\] \};/.test(cab), 'cabaña: paredes y aberturas (la puerta del frente, +z, y la ventana del costado)');
  ok(/const radio = 0\.15;/.test(cab) && /for \(let i = 0; i < 8; i\+\+\) \{\s*const yy = 0\.45 \+ i \* radio \* 1\.8;/.test(cab), 'cabaña: el último tronco a 0,45 + 7 × 0,27 + 0,15 ≈ 2,49 m (la caja corta en 2,45)');
  const alm = bloque('const W = 7.5, D = 5.5, H = 2.9;', 'T.lugares.almacen = almacen;');
  ok(/\{ x0: -0\.58, x1: 0\.58, y0: 0\.42, y1: 2\.52 \}/.test(alm) && /\{ x0: -3\.3, x1: -1\.9, y0: 1\.15, y1: 2\.25 \}/.test(alm) && /\{ x0: 1\.9, x1: 3\.3, y0: 1\.15, y1: 2\.25 \}/.test(alm), 'almacén: la puerta y las dos vidrieras del frente (−z) en la geometría');
  ok(/alto: 0\.45 \+ H, aberturas: \[\[-0\.58, -D \/ 2, 0\.58, -D \/ 2\], \[-3\.3, -D \/ 2, -1\.9, -D \/ 2\], \[1\.9, -D \/ 2, 3\.3, -D \/ 2\]\] \};/.test(alm), 'almacén: paredes y aberturas (la puerta y las vidrieras)');
  ok(/entabladoVertical\(c, \{ W, z: D \/ 2, y0: 0\.45, alto: H, tabla: 0\.34, lado: 1 \}\);/.test(alm), 'almacén: el fondo es continuo (sin aberturas)');
  // las rendijas que dejaban ver afuera (lo mostró la equivalencia de imagen): las tapajuntas del almacén centradas en la junta y las de los costados
  ok(/matriz\(\[x \+ tabla \/ 2, \(a \+ b\) \/ 2, z \+ lado \* 0\.018\]\)/.test(est) && !/x \+ tabla \/ 2 - 0\.018/.test(est), 'almacén: la tapajunta del frente y del fondo, centrada en la junta (antes corrida 1,8 cm)');
  ok(/if \(z \+ 0\.34 < D \/ 2 - 0\.01\) c\.agregar\(new THREE\.BoxGeometry\(0\.03, H, 0\.035\), \{ color: '#6f5237'[^)]*matriz: matriz\(\[l \* \(W \/ 2 \+ 0\.075\), 0\.45 \+ H \/ 2, z \+ 0\.34\]\)/.test(alm), 'almacén: tapajuntas de afuera sobre las juntas de los costados');
  {
    const pcs = leer('src/planos-casas.js'), pam = leer('src/planos-ampliar.js');
    const et = pcs.slice(pcs.indexOf('function etapaTecho(M, P) {'), pcs.indexOf('// cumbrera', pcs.indexOf('function etapaTecho(M, P) {')));
    ok(/forroTecho\(c, eje, a, yr - pend \* a \/ 2, Lp, largo, incl\);/.test(et), 'casas: el techo de dos aguas lleva el forro bajo las tablas (sin rendijas al cielo)');
    const ft = funcion(pcs, 'forroTecho', { caja: (c, w, h, d, pos, color, o) => c.push({ w, h, d, pos, color, o }), TABLA: 'x', Math });
    const cz = [], cx = [];
    ft(cz, 'z', 2, 3, 2.2, 5, 0.5); ft(cx, 'x', 2, 3, 2.2, 5, 0.5);
    const debajo = (q, lado, eje) => { const n = eje === 'z' ? [lado * Math.sin(0.5), Math.cos(0.5), 0] : [0, Math.cos(0.5), lado * Math.sin(0.5)]; const centro = eje === 'z' ? [lado * 1, 3, 0] : [0, 3, lado * 1]; return ((q.pos[0] - centro[0]) * n[0] + (q.pos[1] - centro[1]) * n[1] + (q.pos[2] - centro[2]) * n[2]); };
    ok(cz.length === 2 && cx.length === 2 && cz.every((q, i) => Math.abs(debajo(q, i ? 1 : -1, 'z') + 0.045) < 1e-9) && cx.every((q, i) => Math.abs(debajo(q, i ? 1 : -1, 'x') + 0.045) < 1e-9), 'forroTecho: una tabla por agua, 4,5 cm debajo de las tablas del techo (del lado de adentro), en los dos ejes');
    ok(cz.every((q) => q.h === 0.02 && q.w === 2.2 && Math.abs(q.d - 5.1) < 1e-9) && cx.every((q) => q.h === 0.02 && q.d === 2.2 && Math.abs(q.w - 5.1) < 1e-9), 'forroTecho: cubre todo el largo de la cumbrera y el largo de la pendiente');
    ok(/caja\(c, W \+ 0\.1, 0\.02, Ls, \[0, \(yFrente \+ yFondo\) \/ 2 - 0\.045 \* Math\.cos\(incl\), 0\.045 \* Math\.sin\(incl\)\], TABLA/.test(pam), 'ampliaciones: el techo de una agua también lleva el forro');
  }
  // las casas prefabricadas: la puerta al frente, en el centro, y las ventanas son cajas sobre la pared entera
  const pc = leer('src/planos-casas.js');
  ok(/la puerta mira siempre a -z \(el frente\)/.test(pc) && /const PUERTA = 1\.04;/.test(pc) && /caja\(c, W, h, t, \[0, yc, D \/ 2\], PARED\);/.test(pc), 'planos-casas.js: la puerta al frente (−z, 1,04 de vano) y el fondo de pared entera (las ventanas son cajas encima)');
  const cons = leer('src/construccion.js');
  ok(/const dx = pos\.x - o\.datos\.x, dz = pos\.z - o\.datos\.z;\s*const lx = dx \* Math\.cos\(rot\) - dz \* Math\.sin\(rot\);\s*const lz = dx \* Math\.sin\(rot\) \+ dz \* Math\.cos\(rot\);/.test(cons), 'construccion.js: el marco de las obras (dentro) es el mismo de interiorDeCaja');
}

// ---------------------------------------------------------------- 4: objetos.js, los bultos con nombre propio
{
  const ob = leer('src/objetos.js');
  const i0 = ob.indexOf('for (const [forma, geo] of Object.entries(BULTO_GEO)) {'), tramo = ob.slice(i0, ob.indexOf('mallasBulto[forma] = im;', i0));
  ok(i0 > 0 && /im\.name = 'bultos-tirados';\s*escena\.add\(im\);/.test(tramo), 'objetos.js: las mallas de los bultos se llaman «bultos-tirados» (adentro de tu casa no se apagan con el exterior)');
}

// ---------------------------------------------------------------- reglas de presupuesto y de armado
{
  const iv = leer('src/interior-visible.js');
  const sin = iv.split(String.fromCharCode(10)).filter((l) => !l.trimStart().startsWith('//')).join(String.fromCharCode(10));
  ok(!/THREE|import |document|window/.test(sin) && !/ShaderMaterial|onBeforeCompile|Material|new THREE\./.test(sin), 'interior-visible.js sigue puro: sin three, sin materiales ni shaders (0 programas nuevos, 0 llamadas de dibujo nuevas)');
  const exp = iv.split(String.fromCharCode(10)).filter((l) => l.startsWith('export const ')).every((l) => !/^export const \w+ = [^;]*,\s*\w+ = /.test(l));
  ok(exp, 'interior-visible.js: un export por línea (armar.mjs sólo exporta el primer nombre)');
  const fn = funcion(fuenteMain, 'interiorDelValle', { desafio: null, T: { lugares: {} }, obras: null, LUGARES_CERRADOS: [] });
  ok(typeof fn === 'function', 'main.js: interiorDelValle es una función suelta (sin three ni materiales)');
  const pkg = JSON.parse(leer('package.json'));
  ok(pkg.scripts['verify:pasos'].includes('verificar-4-26-0-c.mjs'), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- mutaciones del módulo puro (una copia con otro nombre por cada una; un proceso por copia)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4260c-'));
  const correr = (nombre, texto) => {
    const f = path.join(dir, nombre + '.mjs');
    fs.writeFileSync(f, texto);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', f], { encoding: 'utf8' });
    return (r.stdout || '').trim().split('\n').pop() || (r.stderr || '').slice(0, 200);
  };
  const interior = leer('src/interior-visible.js');
  ok(correr('interior-original', interior) === '0', 'mutación 0 (interior-visible.js): la copia sin tocar cumple todo');
  const mi = [
    ['solo-el-medio', 'for (let i = 0; i <= n; i++) puntos.push([a0 + ((a1 - a0) * i) / n, b0 + ((b1 - b0) * i) / n]);', 'puntos.push([(a0 + a1) / 2, (b0 + b1) / 2]);'],
    ['sin-puntas', 'for (let i = 0; i <= n; i++) puntos.push(', 'for (let i = 1; i < n; i++) puntos.push('],
    ['paso-largo', 'export const PASO_ABERTURA_M = 0.5;', 'export const PASO_ABERTURA_M = 3;'],
    ['lugar-sin-aberturas-adivina', "if (!Array.isArray(l.aberturas) || !l.aberturas.length) return null;", "if (!Array.isArray(l.aberturas)) l.aberturas = [];"],
    ['lugar-sin-medidas', "|| !(l.ancho > 0) || !(l.fondo > 0) || !(l.alto > 0)) return null;", ') return null;'],
    ['lugar-sin-giro', 'rot: l.rot || 0, ancho: l.ancho', 'rot: 0, ancho: l.ancho'],
    ['casa-puerta-al-fondo', "puntosDeAbertura([-MEDIO_VANO_CASAS, -o.fondo / 2, MEDIO_VANO_CASAS, -o.fondo / 2])", "puntosDeAbertura([-MEDIO_VANO_CASAS, o.fondo / 2, MEDIO_VANO_CASAS, o.fondo / 2])"],
    ['casa-vano-angosto', 'export const MEDIO_VANO_CASAS = 0.6;', 'export const MEDIO_VANO_CASAS = 0.1;'],
    ['casa-tope-alto', 'export const TOPE_CASAS = 0.25;', 'export const TOPE_CASAS = 1.5;'],
    ['casa-sin-casilla', "'casilla', ", ''],
    ['casa-quincho', "'planta-alta', 'buhardilla']);", "'planta-alta', 'buhardilla', 'quincho']);"],
    ['casa-sin-casona', "'casa-galeria', 'casona', ", "'casa-galeria', "],
    ['casa-cualquiera', "if (!o || !CASAS_CERRADAS.has(o.id) || ", 'if (!o || '],
    ['lugares-sin-almacen', "['refugio', 'cabana', 'puesto', 'almacen']", "['refugio', 'cabana', 'puesto']"],
  ];
  for (const [n, de, a] of mi) {
    if (!interior.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, interior.replace(de, a));
    ok(r !== '0', `mutación «${n}» (interior-visible.js) hace fallar la comprobación (${r.slice(0, 60)} fallas)`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
