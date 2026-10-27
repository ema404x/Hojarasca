// 4.12.2 · carro, guardado y sonido: arreglos de la revisión (zonas C2 y G2). EJECUTA el comportamiento en Node (módulos puros con un mundo de mentira):
//   1. G2-1  el sonido se duerme al perder el foco o minimizar y despierta al volver (AudioContext de mentira): alterna bien, no despierta lo que
//            suspendió otra cosa, no queda dormido para siempre si se pierde el evento, y main.js lo engancha a blur, visibilidad, foco, clic y tecla;
//   2. C2-1  el caballo y el carro se apoyan en el puente (el piso de la obra) y no en el lecho del arroyo (terreno real, three real);
//   3. C2-2  el carro no atraviesa un árbol: con la colisión real, sale del obstáculo y sigue enganchado a la distancia justa;
//   4. C2-3  «Empezar acá» no escribe la receta en los ajustes de todas las partidas: queda anotada y se aplica al arrancar esa ranura;
//   5. G2-2  una partida de una versión más nueva conserva los campos desconocidos de sus sub-objetos al importarla, y el aviso dice la versión y «sólo lectura»;
//   6. bajos: la carpintería con caballo suma el bono de madera, el banco de sonidos no corta la gramola de la casa, la pausa en sólo lectura no
//            toca la miniatura, el proceso principal baja el almacenamiento a disco antes de `app.exit`, la consola de códigos no abre sobre el banco.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FakeCtx } from './ayuda-audio-falso.mjs';
import { registrarThree } from './ayuda-three.mjs';
import { funcion, enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const THREE = await import('three');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const imp = (f) => import(pathToFileURL(path.join(RAIZ, 'src', f)).href);
const main = leer('src/main.js');

// ================================================================ 1. G2-1: el sonido se duerme sin foco
{
  globalThis.window = globalThis;
  const ctx = new FakeCtx();
  globalThis.AudioContext = function () { return ctx; };
  const { Sonido } = await imp('sonido.js');
  const s = new Sonido(); s.relax = true; s.iniciar();
  ok(ctx.state === 'running' && !s.dormidoPorFoco, 'arranca andando');
  // los bucles del ambiente andan con el contexto andando
  ok(s.dormir(true) === true && ctx.state === 'suspended' && s.dormidoPorFoco === true, 'al perder el foco el contexto se suspende (y se anota que fue por eso)');
  ok(s.dormir(true) === false && ctx.state === 'suspended', 'dormir de nuevo no hace nada (idempotente)');
  // sin contexto andando el motor no actualiza: ni siquiera con el contexto dormido hay excepciones
  s.actualizar(0.016, { cam: { x: 0, y: 1.7, z: 0 }, adelante: { x: 0, y: 0, z: -1 }, espacio: 'bosque' });
  ok(s.dormir(false) === true && ctx.state === 'running' && !s.dormidoPorFoco, 'al volver el contexto se reanuda');
  ok(s.dormir(false) === false, 'despertar de más no hace nada');
  // lo que suspendió otra cosa (el navegador antes del primer clic, la historia) no lo despierta el foco
  ctx.suspend();
  ok(s.dormir(false) === false && ctx.state === 'suspended', 'un contexto suspendido por otra cosa no se despierta por el foco');
  ok(s.dormir(true) === false && !s.dormidoPorFoco, 'ni se marca como dormido por el foco si ya estaba suspendido');
  ctx.resume();
  // el evento de vuelta se pierde: cualquier camino que reanude (gramola, banco, clic) deja el motor andando, y perder el foco otra vez lo duerme de nuevo
  s.dormir(true);
  ctx.resume();   // (la gramola o el banco reanudan el contexto por su cuenta)
  ok(s.dormir(true) === true && ctx.state === 'suspended', 'si algo lo reanudó mientras tanto, volver a perder el foco lo duerme otra vez');
  // el clic o la tecla (iniciar) lo despierta y limpia la marca
  s.iniciar();
  ok(ctx.state === 'running' && !s.dormidoPorFoco, 'iniciar() (el clic) lo despierta y limpia la marca');
  // el contexto fuera de línea (el banco renderiza a un archivo) nunca se duerme
  const s2 = new Sonido(); s2.offline = true; s2.ctx = new FakeCtx();
  ok(s2.dormir(true) === false && s2.ctx.state === 'running', 'el contexto fuera de línea no se duerme');
  ok(new Sonido().dormir(true) === false && new Sonido().dormir(false) === false, 'sin contexto no pasa nada');
  // un suspend que falla (promesa rechazada) no rompe nada
  const s3 = new Sonido(); s3.iniciar();
  const ctx3 = s3.ctx; ctx3.suspend = () => Promise.reject(new Error('no')); ctx3.state = 'running';
  let tiro = false; try { s3.dormir(true); await new Promise((r) => setTimeout(r, 5)); } catch { tiro = true; }
  ok(!tiro, 'una suspensión rechazada no tira excepción');
  // main.js
  ok(enUnaLinea(main, ["addEventListener('blur'", '() => {']) && /addEventListener\('blur', \(\) => \{\n\s+dormirSonido\(true\);/.test(main), 'perder el foco duerme el sonido');
  ok(/visibilitychange', \(\) => \{\n\s+if \(document\.visibilityState === 'visible'\) \{ despertarSonido\(\); return; \}[^\n]*\n\s+if \(document\.visibilityState !== 'hidden'\) return;\n\s+dormirSonido\(true\);/.test(main), 'minimizar (ocultarse) duerme el sonido y volver a verse lo despierta');
  ok(enUnaLinea(main, ["addEventListener('focus', despertarSonido)"]) && enUnaLinea(main, ["addEventListener('pointerdown', despertarSonido, true)"]) && enUnaLinea(main, ["addEventListener('keydown', despertarSonido, true)"]), 'el foco, un clic o una tecla lo despiertan');
  ok(/function cuadroDelJuego\(tRaf, manual\) \{\n[^\n]*\n\s+if \(sonido\.dormidoPorFoco && !manual && document\.hasFocus\?\.\(\) && document\.visibilityState === 'visible'\)/.test(main), 'y por si se pierde el evento, el cuadro lo despierta si la ventana ya tiene el foco');
  // la pausa normal (Esc) no duerme nada: el sonido sólo se toca en estos tres eventos
  ok((main.match(/dormirSonido\(true\)/g) || []).length === 2 && !/sonido\.pausar\(/.test(main), 'la pausa normal no duerme el sonido (sólo el blur y ocultarse)');
}

// ================================================================ 2 y 3. C2-1 y C2-2: el carro en el mundo real
{
  const { generarTerreno } = await imp('terreno.js');
  const T = generarTerreno();
  const { crearCaballo } = await imp('caballo-mundo.js');
  const { crearColisiones } = await imp('colisiones.js');
  const { alturaDePie } = await imp('gente.js');
  const { ENGANCHE } = await imp('carro.js');
  const CARRO = { carro: true, enganchado: true };
  // --- el Puente de Troncos: la cubierta del puente está arriba del arroyo; se registra como plataforma de la colisión (como las obras)
  const pu = T.puentes[0];
  ok(!!pu && pu.alto - T.altura(pu.x, pu.z) > 1.5, `el puente está bien arriba del terreno del medio (${(pu.alto - T.altura(pu.x, pu.z)).toFixed(2)} m)`);
  const col = crearColisiones();
  col.agregarPlataforma({ x: pu.x, z: pu.z, largo: pu.largo, ancho: 3, cos: Math.cos(pu.ang), sin: Math.sin(pu.ang), alto: pu.alto, espesor: 0.2, alturaMin: pu.alto - 0.2 });
  const pie = (x, z, y) => alturaDePie(T, col, x, z, y);
  const yaw = Math.atan2(Math.cos(pu.ang), Math.sin(pu.ang));   // mirando a lo largo del puente
  const sobre = (cab, x, z, y) => { for (let i = 0; i < 3; i++) cab.actualizar(1 / 60, { x, z, yaw, y }, 5, true, true, false); };
  // sin cómo apoyarse (como antes): se dibuja en el terreno de abajo
  { const e = new THREE.Scene(), cab = crearCaballo(T, e); sobre(cab, pu.x, pu.z, pu.alto); ok(cab.malla.position.y < pu.alto - 1.5, 'sin la altura del piso, el caballo se dibujaba en el lecho (el defecto)'); }
  // con la altura del piso (main.js): se dibuja en la cubierta, derecho, y el carro también
  {
    const e = new THREE.Scene(), cab = crearCaballo(T, e, pie);
    cab.personalizar(CARRO);
    const dir = { x: Math.cos(pu.ang), z: Math.sin(pu.ang) };
    // viene de lejos por el puente: el carro se arrastra detrás del caballo
    for (let d = -8; d <= 0.5; d += 0.1) cab.actualizar(1 / 60, { x: pu.x + dir.x * d, z: pu.z + dir.z * d, yaw, y: undefined }, 5, true, true, false);
    // (el jugador a pie pisa la cubierta: su y es la de la plataforma)
    for (let i = 0; i < 6; i++) cab.actualizar(1 / 60, { x: pu.x + dir.x * 0.5, z: pu.z + dir.z * 0.5, yaw, y: pu.alto }, 5, true, true, false);
    ok(Math.abs(cab.malla.position.y - pu.alto) < 0.12, `el caballo se dibuja en la cubierta (${cab.malla.position.y.toFixed(2)} vs ${pu.alto.toFixed(2)})`);
    ok(cab.malla.rotation.x === 0 || Math.abs(cab.malla.rotation.x) < 0.02, 'y va derecho (no se inclina con el lecho de abajo)');
    const k = cab.carro();
    ok(k && Math.abs(k.g.position.y - pu.alto) < 0.35, `el carro también va sobre la cubierta (${k.g.position.y.toFixed(2)} vs ${pu.alto.toFixed(2)})`);
    // lejos del puente, sobre el terreno, el caballo vuelve a apoyarse en el suelo
    const lejos = { x: pu.x + dir.x * 80, z: pu.z + dir.z * 80 };
    for (let i = 0; i < 6; i++) cab.actualizar(1 / 60, { x: lejos.x, z: lejos.z, yaw, y: T.altura(lejos.x, lejos.z) }, 5, true, true, false);
    ok(Math.abs(cab.malla.position.y - T.altura(lejos.x, lejos.z)) < 0.12, 'fuera del puente se apoya en el terreno como siempre');
  }
  // desmontado (sin y), el caballo parado en el puente tampoco se hunde
  { const e = new THREE.Scene(), cab = crearCaballo(T, e, pie); cab.malla.position.y = pu.alto; for (let i = 0; i < 3; i++) cab.actualizar(1 / 60, { x: pu.x, z: pu.z, yaw }, 0, false, true, false); ok(Math.abs(cab.malla.position.y - pu.alto) < 0.12, 'parado en el puente (sin jinete) se queda en la cubierta'); }
  ok(enUnaLinea(main, ['crearCaballo(T, escena,', 'alturaDePie(T, col, x, z, y)']), 'main.js le pasa a crearCaballo cómo se apoya (alturaDePie, igual que el jugador y la gente)');
  ok(enUnaLinea(main, ['if (js.montado) return { x: js.pos.x, z: js.pos.z, yaw: yawCaballo(js.yaw), y: js.pos.y }']), 'y montado, la altura en que vas');

  // --- C2-2: el carro no atraviesa un árbol
  function llano() {
    for (let r = 30; r < 500; r += 7) for (let a = 0; a < 6.28; a += 0.2) {
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      let bien = true;
      for (let i = -3; i <= 12 && bien; i++) for (const j of [-1, 0, 1]) { const px = x + j * 2, pz = z + i * 2; if (T.normal(px, pz).y < 0.995 || T.agua(px, pz)) { bien = false; break; } }
      if (bien) return { x, z };
    }
    throw new Error('sin llano');
  }
  const L = llano();
  const corre = (conArbol) => {
    const e = new THREE.Scene(), c = crearColisiones();
    // un tronco de 0,5 m de radio, justo donde queda el eje del carro cuando el caballo se detiene en L.z + 4
    const arbol = { x: L.x + 0.2, z: L.z + 4 + ENGANCHE.atras + ENGANCHE.largo, r: 0.5, alturaMax: 99 };
    if (conArbol) c.agregar(arbol);
    const cab = crearCaballo(T, e, (x, z, y) => alturaDePie(T, c, x, z, y), (p, r, h) => c.resolver(p, r, h));
    cab.personalizar(CARRO);
    // el caballo va hacia -z (yaw = π) y se detiene: el carro viene atrás (hacia +z) y su cuerpo quedaría dentro del tronco
    let minD = Infinity, maxE = 0;
    const hitch = (z) => ({ x: L.x, z: z + ENGANCHE.atras });
    for (let i = 0; i <= 220; i++) {
      const z = L.z + 12 - Math.min(i, 160) * 0.05;   // de 12 m a 4 m del origen, 1 m/s... y frenado
      cab.actualizar(1 / 60, { x: L.x, z, yaw: Math.PI, y: T.altura(L.x, z) }, 3, true, true, false);
      const k = cab.carro(); if (!k) continue;
      const p = k.g.position;
      if (i > 100) minD = Math.min(minD, Math.hypot(p.x - arbol.x, p.z - arbol.z));
      const h = hitch(z); maxE = Math.max(maxE, Math.abs(Math.hypot(p.x - h.x, p.z - h.z) - 0)); // (no se usa)
    }
    return { cab, minD, arbol };
  };
  {
    const sin = corre(false), con = corre(true);
    const kS = sin.cab.carro().g.position, kC = con.cab.carro().g.position;
    // sin árbol: el carro viene derecho atrás (misma x que el caballo)
    ok(Math.abs(kS.x - L.x) < 0.05, 'sin obstáculos el carro viene derecho detrás del caballo (no cambió nada)');
    // con el árbol en su línea: el cuerpo (radio 0,6) queda afuera del tronco (0,5): a 1,1 m del centro o más
    ok(con.minD > 0.8 && sin.minD < 0.3, `con un árbol atrás el carro no entra en el tronco (distancia mínima ${con.minD.toFixed(2)} m; sin la colisión pasaba por el centro: ${sin.minD.toFixed(2)} m)`);
    ok(Math.hypot(kC.x - con.arbol.x, kC.z - con.arbol.z) > 1.0, 'y termina afuera del tronco');
    // sigue enganchado: el balancín queda en el enganche del caballo (a ENGANCHE.largo del eje, girado)
    const ult = con.cab.carro(); ult.g.updateMatrixWorld(true);
    const bal = new THREE.Vector3(0, ENGANCHE.alto, ENGANCHE.largo); ult.g.localToWorld(bal);
    const zFin = L.z + 12 - 160 * 0.05, hz = zFin + ENGANCHE.atras;
    ok(Math.hypot(bal.x - L.x, bal.z - hz) < 0.12, `con el desvío el balancín sigue en el enganche del caballo (error ${Math.hypot(bal.x - L.x, bal.z - hz).toFixed(3)} m)`);
    ok(Math.abs(kC.x - L.x) > 0.2, 'el carro giró alrededor del enganche para esquivar el árbol');
  }
  // sin la colisión (pruebas viejas, Desafío) se comporta como antes; una colisión que tira no frena el dibujo
  { const e = new THREE.Scene(), cab = crearCaballo(T, e, null, () => { throw new Error('roto'); }); cab.personalizar(CARRO); let tiro = false; try { for (let i = 0; i < 30; i++) cab.actualizar(1 / 60, { x: L.x, z: L.z + i * 0.05, yaw: Math.PI }, 3, true, true, false); } catch { tiro = true; } ok(!tiro && cab.carro(), 'si la colisión falla, el carro se sigue dibujando'); }
  ok(enUnaLinea(main, ['crearCaballo(T, escena,', 'col.resolver(p, r, h)']), 'main.js le pasa la misma colisión que usan el jugador y los animales');
}

// ================================================================ 4. C2-3: «Empezar acá» no pisa los ajustes de todas las partidas
{
  const PP = await imp('personal-partida.js');
  const almacen = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const personal = { ropa: {}, partida: { proxima: { estacion: 'invierno', clima: 'lluvioso', dificultad: 'implacable', animales: 'normal', vecinos: true }, actual: { animales: 'normal', vecinos: true }, recetas: [] } };
  const ajustes = { estacion: 'verano', clima: 'auto', dificultad: 'normal', ranura: 1 };
  const a = almacen();
  const copia = { ...ajustes };
  PP.dejarPersonalPendiente(a, 'relax', 2, personal, ajustes);
  eq(ajustes, copia, 'dejar lo pendiente no toca el objeto de ajustes que se le pasó');
  const t = PP.tomarAjustesPendientes(a, 'relax', 2);
  eq(t, { estacion: 'invierno', clima: 'lluvioso', dificultad: 'implacable' }, 'la receta queda anotada para esa ranura');
  ok(PP.tomarAjustesPendientes(a, 'relax', 2) === null, 'se toma una sola vez');
  // una receta que no cambia nada (todo «igual») no anota ajustes
  const p2 = JSON.parse(JSON.stringify(personal)); Object.assign(p2.partida.proxima, { estacion: 'igual', clima: 'igual', dificultad: 'igual' });
  PP.dejarPersonalPendiente(a, 'relax', 3, p2, ajustes);
  ok(PP.tomarAjustesPendientes(a, 'relax', 3) === null, 'una receta «igual» no anota nada');
  // lo roto o raro se descarta o se limpia
  a.setItem(PP.claveAjustesPendientes('relax', 4), JSON.stringify({ estacion: 'invierno', clima: 7, dificultad: 'x'.repeat(40), otra: 'cosa', __proto__: 'x' }));
  eq(PP.tomarAjustesPendientes(a, 'relax', 4), { estacion: 'invierno' }, 'sólo estación, clima y dificultad, y con texto razonable');
  a.setItem(PP.claveAjustesPendientes('relax', 4), '{roto');
  ok(PP.tomarAjustesPendientes(a, 'relax', 4) === null, 'un anotado roto se descarta sin romper');
  ok(PP.tomarAjustesPendientes(a, 'desafio', 2) === null, 'otro modo no lo ve');
  // irAPartida: no escribe los ajustes globales, y si volvés sin haber empezado la ranura nueva, quedan como eran
  const correr = (infoHay, extra = {}) => {
    const alm = almacen(); const aj = { ranura: 1, estacion: 'verano', clima: 'auto', dificultad: 'normal' }; const hechos = [];
    const f = funcion(main, 'irAPartida', {
      ranuraActual: () => 1, cerrarPartidas: () => {}, modo: 'jugando', guardar: () => {}, ajustes: aj, esSinFin: false, guardarAjustes: (x) => hechos.push({ ...x }), reiniciandoPartida: false,
      cancelarGuardadoSuave: () => {}, location: { reload: () => hechos.push('recarga') }, infoPartida: () => ({ hay: infoHay }), modoJuego: 'relax', sessionStorage: alm, progreso: { personal },
      dejarPersonalPendiente: PP.dejarPersonalPendiente, ...extra,
    });
    f(2);
    return { aj, hechos, alm };
  };
  { const v = correr(false);
    eq([v.aj.estacion, v.aj.clima, v.aj.dificultad], ['verano', 'auto', 'normal'], 'al entrar a una ranura vacía los ajustes de todas las partidas no cambian');
    eq([v.hechos[0].estacion, v.hechos[0].clima], ['verano', 'auto'], 'ni lo que se guarda en disco');
    ok(v.alm.m.has(PP.claveAjustesPendientes('relax', 2)), 'la receta viaja anotada para cuando se abra esa ranura'); }
  { const v = correr(true); ok(!v.alm.m.has(PP.claveAjustesPendientes('relax', 2)), 'a una ranura con partida no se le anota nada'); }
  // volver desde la ranura nueva sin empezarla: los ajustes vuelven a lo que eran (lo único que los cambió fue la receta, en memoria)
  { const alm = almacen(); const aj = { ranura: 2, estacion: 'invierno', clima: 'lluvioso', dificultad: 'normal' };
    funcion(main, 'irAPartida', { ranuraActual: () => 2, cerrarPartidas: () => {}, modo: 'inicio', guardar: () => {}, ajustes: aj, esSinFin: false, guardarAjustes: () => {}, reiniciandoPartida: false, cancelarGuardadoSuave: () => {}, location: { reload() {} },
      infoPartida: () => ({ hay: false }), modoJuego: 'relax', sessionStorage: alm, progreso: { personal }, dejarPersonalPendiente: PP.dejarPersonalPendiente, ajustesSinReceta: { estacion: 'verano', clima: 'auto' } })(1);
    eq([aj.estacion, aj.clima], ['verano', 'auto'], 'si salís de la ranura nueva sin haberla empezado, la receta no se queda en los ajustes'); }
  { const alm = almacen(); const aj = { ranura: 2, estacion: 'invierno', clima: 'lluvioso', dificultad: 'normal' };
    funcion(main, 'irAPartida', { ranuraActual: () => 2, cerrarPartidas: () => {}, modo: 'inicio', guardar: () => {}, ajustes: aj, esSinFin: false, guardarAjustes: () => {}, reiniciandoPartida: false, cancelarGuardadoSuave: () => {}, location: { reload() {} },
      infoPartida: () => ({ hay: true }), modoJuego: 'relax', sessionStorage: alm, progreso: { personal }, dejarPersonalPendiente: PP.dejarPersonalPendiente, ajustesSinReceta: { estacion: 'verano', clima: 'auto' } })(1);
    eq([aj.estacion, aj.clima], ['invierno', 'lluvioso'], 'pero si ya la empezaste (tiene partida), la receta queda'); }
  ok(enUnaLinea(main, ['tomarAjustesPendientes(sessionStorage, modoJuego, ranuraActual())', 'Object.assign(ajustes, deReceta)']), 'al arrancar la ranura nueva se aplican (en memoria) antes de armar el mundo');
  ok(enUnaLinea(main, ['if (ajustesSinReceta) { ajustesSinReceta = null; guardarAjustes(ajustes); }']), 'y se guardan al empezar de verdad (Seguir/Empezar)');
}

// ================================================================ 5. G2-2: una partida más nueva
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import(pathToFileURL(path.join(RAIZ, 'src', 'guardado.js')).href + '?g2=' + Date.now());
  const { empaquetar, leerPaquete, avisoImportar } = await imp('transferir.js');
  const SI = await imp('sincronia.js');
  for (const modo of ['relax', 'desafio']) {
    G.usarModoGuardado(modo, 1);
    const p = G.progresoNuevo(); p.dia = 33; p.versionJuego = '9.0.0'; p.campoTopNuevo = { a: 1 };
    if (modo === 'desafio') { p.desafio.campoNuevoDeLaVersion9 = 123; p.desafio.meta = { ...(p.desafio.meta || {}), modo: 'normal', extra: 1 }; }
    else { p.personal.caballo.enganche2 = 'dos'; p.aldea.nuevoCampo = 5; }
    const texto = empaquetar({ progreso: p, fotos: {}, modo, ranura: 1, version: '9.0.0' });
    const r = leerPaquete(texto);
    const clave = modo === 'relax' ? 'hojarasca-v1' : 'hojarasca-desafio-v1';
    // este juego es el 4.12.1: la partida 9.0.0 es más nueva y no pierde los campos de adentro
    G.fijarVersionDelJuego('4.12.1');
    datos.clear();
    ok(G.escribirPartida(modo, 1, r.paquete.progreso, r.paquete.fotos), `${modo}: se escribe`);
    let g = JSON.parse(datos.get(clave));
    eq(g.versionJuego, '9.0.0', `${modo}: conserva la versión de la partida`);
    eq(g.campoTopNuevo, { a: 1 }, `${modo}: y el campo nuevo de primer nivel`);
    if (modo === 'desafio') { eq([g.desafio.campoNuevoDeLaVersion9, g.desafio.meta.extra], [123, 1], 'desafío: y los campos nuevos de adentro (también el de adentro de `meta`)'); }
    else eq([g.personal.caballo.enganche2, g.aldea.nuevoCampo], ['dos', 5], 'relax: y los campos nuevos de adentro del caballo y de la aldea');
    // una partida de la misma versión o de una más vieja se sanea como siempre (lo desconocido se va)
    G.fijarVersionDelJuego('9.0.0');
    datos.clear(); G.escribirPartida(modo, 1, r.paquete.progreso, r.paquete.fotos);
    g = JSON.parse(datos.get(clave));
    ok(modo === 'desafio' ? g.desafio.campoNuevoDeLaVersion9 === undefined : g.personal.caballo.enganche2 === undefined, `${modo}: con la misma versión, lo que no se conoce se limpia como siempre`);
    // y sin versión fijada (pruebas viejas), nada cambia
    G.fijarVersionDelJuego('');
    datos.clear(); G.escribirPartida(modo, 1, r.paquete.progreso, r.paquete.fotos);
    g = JSON.parse(datos.get(clave));
    ok(modo === 'desafio' ? g.desafio.campoNuevoDeLaVersion9 === undefined : g.personal.caballo.enganche2 === undefined, `${modo}: sin la versión del juego fijada, se sanea como siempre`);
  }
  // __proto__ de un archivo retocado a mano no contamina nada
  { G.usarModoGuardado('relax', 1); G.fijarVersionDelJuego('4.12.1');
    const p = G.progresoNuevo(); p.versionJuego = '9.0.0';
    const sucio = JSON.parse('{"__proto__":{"pisado":1},"x":1}'); p.aldea = { ...p.aldea, ...sucio, ['otro']: 2 };
    datos.clear(); G.escribirPartida('relax', 1, p, {});
    ok(({}).pisado === undefined, 'una clave __proto__ no contamina Object.prototype'); G.fijarVersionDelJuego(''); }
  // los avisos dicen la versión y que queda en sólo lectura
  const local = { hay: true, dia: 5, guardadoEn: 1700000000000, ranura: 1 };
  const remota = { progreso: { dia: 9, guardadoEn: 1700009999000, versionJuego: '9.0.0' }, modo: 'relax', version: '9.0.0', dia: 9 };
  for (const [nom, f] of [['la oferta de la carpeta', SI.textoOferta], ['«dos cambiaron»', SI.textoDosCambiaron]]) {
    const t = f(local, remota, '9.0.0');
    ok(t.includes('9.0.0') && /sólo lectura/.test(t) && /no se guarda/.test(t), `${nom} dice la versión y que se abre en sólo lectura`);
    ok(!/sólo lectura/.test(f(local, remota)) && !/sólo lectura/.test(f(local, remota, '')), `${nom}: sin versión más nueva, el texto es el de siempre`);
  }
  { const aviso = avisoImportar({ modo: 'relax', dia: 9, version: '9.0.0' }, local, '9.0.0');
    ok(aviso.includes('9.0.0') && /sólo lectura/.test(aviso), 'importar a mano también avisa de la versión y del sólo lectura');
    ok(!/sólo lectura/.test(avisoImportar({ modo: 'relax', dia: 9, version: '4.12.1' }, local)), 'y una de la misma versión no avisa de nada raro'); }
  { const linea = main.split(String.fromCharCode(10)).find((x) => x.startsWith('function versionNuevaDe('));
    const f = new Function('sanearVersionJuego', 'versionMasNueva', 'versionDelJuego', linea + '; return versionNuevaDe;')(G.sanearVersionJuego, G.versionMasNueva, () => '4.12.1');
    eq([f({ progreso: { versionJuego: '9.0.0' } }), f({ progreso: { versionJuego: '4.12.1' } }), f({ progreso: { versionJuego: '4.9.0' } }), f({ progreso: {} }), f(null), f({ progreso: { versionJuego: 'x' } })], ['9.0.0', '', '', '', '', ''], 'main.js: sólo una versión más nueva activa el aviso'); }
  ok(enUnaLinea(main, ['avisoImportar(r.paquete, infoPartida(modoJuego, ranura), versionNuevaDe(r.paquete))']) && enUnaLinea(main, ['textoOfertaSync(local, r.paquete, versionNuevaDe(r.paquete))', 'textoDosCambiaron(local, r.paquete, versionNuevaDe(r.paquete))']), 'main.js pasa la versión nueva a los tres avisos');
  ok(enUnaLinea(main, ['fijarVersionDelJuego(versionDelJuego())']), 'main.js le dice a guardado.js la versión de este juego');
}

// ================================================================ 6. los bajos
{
  // --- la carpintería con caballo suma el bono de madera (aviso y E)
  const llamadas = { notas: [] };
  const entorno = (extra = {}) => ({
    TALLERES: {}, tieneCaballo: () => true, desafio: false, progreso: { personal: { caballo: { carro: false } }, materiales: {} }, materialesVisibles: () => ({}), pesosDe: () => 0,
    avisoCarro: () => 'El carro del caballo: 14 tablas', extraMadera: () => 0.1, nivelDe: () => 0, textoCarpinteria: () => 'Al terminar una etapa, sobra un 10 % más', tieneCarro: (c) => c?.carro === true,
    textoCasillasCarro: () => 'Enganchado y montado, suma 16 casillas', nota: (t, s) => llamadas.notas.push([t, s]), ...extra,
  });
  const av = funcion(main, 'avisoOficioPropio', entorno())({ plano: { id: 'carpinteria' } });
  ok(av.includes('El carro del caballo') && av.includes('10 % más de madera'), 'con caballo, el aviso de la carpintería habla del carro y del bono de madera');
  const avSin = funcion(main, 'avisoOficioPropio', entorno({ tieneCaballo: () => false }))({ plano: { id: 'carpinteria' } });
  ok(avSin === 'Tu banco: en cada obra sobra 10 % más de madera', 'sin caballo, el aviso es el de siempre');
  funcion(main, 'usarCarpinteriaCarro', entorno({ progreso: { personal: { caballo: { carro: true, enganchado: true } } } }))();
  ok(llamadas.notas.at(-1)[1].includes('16 casillas') && llamadas.notas.at(-1)[1].includes('sobra un 10 %'), 'con el carro hecho, la E dice cómo va y el bono de madera');

  // --- el banco de sonidos no corta la gramola de la casa
  {
    globalThis.window = globalThis;
    const ctx = new FakeCtx(); globalThis.AudioContext = function () { return ctx; };
    const { Sonido } = await imp('sonido.js');
    const B = await imp('banco-sonidos.js');
    const GR = await imp('gramola.js');
    const s = new Sonido(); s.relax = true; s.iniciar();
    const R = { ...B.armarMotor(s) };
    GR.detenerGramola();
    const r = GR.alternarGramola(s, () => true, { datos: { x: 0, z: 0 } });
    ok(r.suena && GR.gramolaSuena(), 'la gramola de tu casa suena');
    const ban = B.crearBancoSonidos(R);
    ok(ban.abrir() && GR.gramolaSuena(), 'abrir el banco no la corta');
    ban.detenerTodo?.();
    ok(GR.gramolaSuena(), '«Detener todo» tampoco corta la de tu casa');
    ban.cerrar();
    ok(GR.gramolaSuena(), 'ni cerrar el banco');
    GR.detenerGramola();
    // la que prende el banco, sí la corta él
    ok(ban.abrir(), 'se abre de nuevo');
    await ban.tocar('gramola');
    ok(GR.gramolaSuena(), 'la gramola del catálogo suena');
    ban.cerrar();
    ok(!GR.gramolaSuena(), 'y la que prendió el banco la apaga al cerrar (como antes)');
    // si la de la casa sonaba y el banco la reemplaza por la suya, también la apaga al cerrar
    GR.alternarGramola(s, () => true, { datos: { x: 0, z: 0 } });
    ban.abrir(); await ban.tocar('gramola');
    ban.cerrar();
    ok(!GR.gramolaSuena(), 'si el banco reemplazó la de la casa por la suya, se apaga al cerrar');
  }

  // --- la pausa en sólo lectura no toca la miniatura
  { const l = main.split(String.fromCharCode(10)).find((x) => x.includes('guardarVista(fotos.hacerMiniatura(lienzo))'));
    ok(l && l.includes('if (!partidaSoloLectura())'), 'la miniatura de la pausa sólo se escribe si la partida no es de sólo lectura'); }

  // --- el proceso principal baja el almacenamiento a disco antes de salir
  {
    const { cuidarErroresMain } = req('../recuperacion-main.cjs');
    const eventos = []; let reloj = 0;
    const temporizadores = [];
    const ventana = { isDestroyed: () => false, webContents: { isDestroyed: () => false, send: (c) => eventos.push('envia ' + c), session: { flushStorageData: () => eventos.push('flush') } } };
    const proceso = { on() {} };
    const app = { exit: (c) => eventos.push('exit ' + c) };
    const realSet = globalThis.setTimeout;
    globalThis.setTimeout = (f, ms) => { const t = { f, ms, unref() {} }; temporizadores.push(t); return t; };
    try {
      const c = cuidarErroresMain({ proceso, app, escribirCrash: () => {}, ventanaActual: () => ventana, max: 3, ventanaMs: 10000, ahora: () => reloj });
      for (let i = 0; i < 3; i++) { reloj += 100; c.anotar('x', new Error('boom')); }
      ok(c.cerrando(), 'tres errores seguidos cierran el juego');
      const baja = temporizadores.filter((t) => t.ms === 400), cierre = temporizadores.find((t) => t.ms === 1500);
      ok(baja.length === 3 && cierre, 'cada pedido de guardar programa bajar el almacenamiento a disco, y el cierre queda a 1,5 s');
      eventos.length = 0;
      cierre.f();
      eq(eventos, ['flush', 'exit 1'], 'justo antes de `app.exit` se baja el almacenamiento a disco');
      eventos.length = 0; baja[0].f();
      eq(eventos, ['flush'], 'y el temporizador de cada pedido también lo baja');
      // una ventana que ya no está no rompe el cierre
      const c2 = cuidarErroresMain({ proceso, app, escribirCrash: () => {}, ventanaActual: () => null, max: 1, ahora: () => reloj });
      c2.anotar('y', new Error('x')); eventos.length = 0;
      temporizadores.filter((t) => t.ms === 1500).at(-1).f();
      eq(eventos, ['exit 1'], 'sin ventana, igual cierra');
    } finally { globalThis.setTimeout = realSet; }
  }

  // --- la consola de códigos no abre encima del banco de sonidos
  ok(enUnaLinea(main, ['ocupado: () =>', 'infoAbierta()', 'bancoSonidosAbierto()']), 'la consola de códigos cuenta el banco de sonidos como «ocupado»');
}

console.log(`verificar-4-12-2-carro-guardado: ${n} comprobaciones OK`);
