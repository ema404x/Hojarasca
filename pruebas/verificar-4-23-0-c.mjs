// 4.23.0 (C): interiores y CPU de la gente.
//
// 1. interior-visible.js (puro): adentro de un edificio cerrado de la aldea no se dibuja lo de afuera salvo que una puerta caiga en lo que mira la cámara (las hojas de las
//    puertas de la aldea se dibujan abiertas aunque `abierta` sea 0: se midió, por eso el estado no cuenta). Sin puertas registradas (herrería, carpintería) o con el edificio
//    abierto (observatorio, varadero, taller del tren) no se apaga nada.
// 2. rendimiento.js (puro): el choque de la gente con los obstáculos se espacia con la distancia (35 m: cada 3 cuadros; 80 m: cada 6; charlando, en una escena o con el cuadro
//    lento, siempre) y cada persona tiene su fase.
// 3. gente.js: la pose a mitad de frecuencia entre 20 y 38 m (de cerca, charlando o en una escena, en cada cuadro) y `caminarHacia` sin el choque cuando `__sinChoque`.
// 4. main.js: `apagarExterior` (con el código de verdad, con un mundo de mentira): apaga el terreno, el pasto, el bosque, lo instanciado y la gente que quedó afuera, no apaga el
//    edificio ni lo de adentro, lo vuelve a prender todo después, y al salir rehace el mapa de sombras.
// Cada mutación es una copia con el texto cambiado a propósito y tiene que hacer fallar su comprobación (las de los módulos puros, un proceso por copia: la caché de ESM sólo
// mide la primera).
//
// Uso: node pruebas/verificar-4-23-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { expresion, funcion, enUnaLinea } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// ---------------------------------------------------------------- lo que tiene que cumplir interior-visible.js (devuelve la lista de lo que falla)
function comprobarInterior(M) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const cam = { x: 0, z: 0 }, cos = M.cosVistaDe(70, 16 / 9);
  falla(cos > 0.36 && cos < 0.46, `cosVistaDe(70, 16:9) ≈ 0,41 (${cos})`);
  falla(M.cosVistaDe(70, 21 / 9) < cos, 'una pantalla más ancha abre más el cuadro');
  falla(M.cosVistaDe(100, 16 / 9) < cos, 'un campo de visión mayor abre más el cuadro');
  falla(M.cosVistaDe(150, 16 / 9) === -1, 'con un campo de visión enorme siempre se ve todo');
  falla(M.cosVistaDe(NaN, NaN) === cos || Math.abs(M.cosVistaDe(NaN, NaN) - cos) < 1e-9, 'sin datos usa 70 grados y 16:9');
  const puerta = [{ x: 0, z: -4 }];
  falla(M.puertaALaVista(cam, { x: 0, z: -1 }, puerta, cos) === true, 'la puerta de frente está a la vista');
  falla(M.puertaALaVista(cam, { x: 0, z: 1 }, puerta, cos) === false, 'la puerta a las espaldas no');
  falla(M.puertaALaVista(cam, { x: 1, z: 0 }, puerta, cos) === false, 'la puerta a 90 grados no (el cuadro abre unos 51 a cada lado)');
  falla(M.puertaALaVista(cam, { x: Math.sin(0.9), z: -Math.cos(0.9) }, puerta, cos) === true, 'la puerta a 52 grados todavía cuenta (con el margen)');
  falla(M.puertaALaVista(cam, { x: Math.sin(1.4), z: -Math.cos(1.4) }, puerta, cos) === false, 'la puerta a 80 grados ya no');
  falla(M.puertaALaVista({ x: 0, z: -3.3 }, { x: 0, z: 1 }, puerta, cos) === true, 'pegado a la puerta (menos de 1,2 m) siempre cuenta');
  falla(M.puertaALaVista(cam, { x: 0, z: 0.1 }, puerta, cos) === true, 'mirando casi derecho para arriba o para abajo se dibuja todo');
  falla(M.puertaALaVista(cam, { x: 0, z: -1 }, [], cos) === false && M.puertaALaVista(cam, { x: 0, z: -1 }, null, cos) === false, 'sin puertas no hay puerta a la vista');
  const cantina = { id: 'cantina', x: 0, z: 0, radio: 8, puertas: [{ x: 0, z: -4, abierta: 0 }] };
  falla(M.apagarExteriorAhora(cantina, cam, { x: 0, z: 1 }, cos) === true, 'mirando para el otro lado, con la puerta atrás: se apaga el exterior');
  falla(M.apagarExteriorAhora(cantina, cam, { x: 0, z: -1 }, cos) === false, 'mirando la puerta no se apaga, aunque su estado diga «cerrada» (la hoja se dibuja abierta)');
  falla(M.apagarExteriorAhora(null, cam, { x: 0, z: 1 }, cos) === false, 'afuera no se apaga nada');
  falla(M.apagarExteriorAhora({ ...cantina, id: 'observatorio' }, cam, { x: 0, z: 1 }, cos) === false, 'el observatorio se abre al cielo: no se apaga');
  falla(M.apagarExteriorAhora({ ...cantina, id: 'varadero' }, cam, { x: 0, z: 1 }, cos) === false, 'el varadero tiene el portón abierto: no se apaga');
  falla(M.apagarExteriorAhora({ ...cantina, id: 'taller-tren' }, cam, { x: 0, z: 1 }, cos) === false, 'el taller del tren tiene portones grandes: no se apaga');
  falla(M.apagarExteriorAhora({ ...cantina, id: 'herreria', puertas: [] }, cam, { x: 0, z: 1 }, cos) === false, 'sin puertas registradas (la herrería) no se apaga');
  falla(M.apagarExteriorAhora({ ...cantina, puertas: null }, cam, { x: 0, z: 1 }, cos) === false, 'sin lista de puertas no se apaga');
  falla(M.apagarExteriorAhora({ ...cantina, puertas: [{ x: 0, z: -4 }, { x: 3, z: 3 }] }, cam, { x: 0, z: -1 }, cos) === false, 'con dos puertas, una a la vista alcanza para dibujar todo');
  falla(M.quedaAfuera({ x: 0, z: 0 }, cantina) === false && M.quedaAfuera({ x: 7, z: 0 }, cantina) === false, 'la gente adentro de las paredes no queda afuera');
  falla(M.quedaAfuera({ x: 9, z: 0 }, cantina) === true && M.quedaAfuera({ x: 0, z: -12 }, cantina) === true, 'la de la calle sí');
  {
    const caja = { id: 'casa-te', x: 100, z: 50, y: 20, rot: 0.7, ancho: 6.4, fondo: 5.2, alto: 4, frente: [[-3.2, 2.6], [0, 2.6], [3.2, 2.6]] };
    const sal = { id: '', x: 0, z: 0, radio: 0, puertas: null };
    const local = (a, b, y = 21.6) => ({ x: caja.x + a * Math.cos(caja.rot) + b * Math.sin(caja.rot), y, z: caja.z - a * Math.sin(caja.rot) + b * Math.cos(caja.rot) });
    const r = M.interiorDeCaja(local(0, 0), caja, sal);
    falla(r === sal && r.id === 'casa-te' && r.x === 100 && r.z === 50 && Math.abs(r.radio - (Math.hypot(6.4, 5.2) / 2 + 2)) < 1e-9, 'interiorDeCaja: en el centro devuelve la salida con id, centro y radio');
    falla(r && r.puertas.length === 3, 'interiorDeCaja: tres puntos del frente');
    const centro = r && r.puertas[1], esperado = local(0, 2.6);
    falla(centro && Math.abs(centro.x - esperado.x) < 1e-9 && Math.abs(centro.z - esperado.z) < 1e-9, 'interiorDeCaja: el centro del frente está a media profundidad hacia +b (la conversión de estructuras.js)');
    const izq = r && r.puertas[0], eIzq = local(-3.2, 2.6);
    falla(izq && Math.abs(izq.x - eIzq.x) < 1e-9 && Math.abs(izq.z - eIzq.z) < 1e-9, 'interiorDeCaja: la esquina izquierda del frente está del lado que toca');
    falla(M.interiorDeCaja(local(3.0, 0), caja, sal) === sal && M.interiorDeCaja(local(-3.0, 0), caja, sal) === sal, 'interiorDeCaja: pegado a una pared (a 20 cm) todavía está adentro');
    falla(M.interiorDeCaja(local(3.15, 0), caja, sal) === null && M.interiorDeCaja(local(0, 2.55), caja, sal) === null && M.interiorDeCaja(local(0, -2.55), caja, sal) === null, 'interiorDeCaja: a menos de 10 cm de la pared ya cuenta como afuera');
    falla(M.interiorDeCaja(local(6, 0), caja, sal) === null && M.interiorDeCaja(local(0, 4), caja, sal) === null, 'interiorDeCaja: a la calle, no');
    falla(M.interiorDeCaja(local(0, 0, 18.9), caja, sal) === null && M.interiorDeCaja(local(0, 0, 24.1), caja, sal) === null && M.interiorDeCaja(local(0, 0, 23.9), caja, sal) === sal, 'interiorDeCaja: por debajo del piso o arriba del techo, no');
    falla(M.interiorDeCaja(local(0, 0), null, sal) === null && M.interiorDeCaja(local(0, 0), caja, null) === null, 'interiorDeCaja: sin caja o sin salida, null');
    const p0 = sal.puertas;
    M.interiorDeCaja(local(1, 1), caja, sal);
    falla(sal.puertas === p0, 'interiorDeCaja: reusa la lista de puertas (sin basura por cuadro)');
    // la regla completa en un cuarto de verdad: la cámara en el centro mirando al fondo (de espaldas al frente) apaga, mirando al frente no
    const cosV = M.cosVistaDe(70, 16 / 9);
    const mira = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
    const c0 = local(0, -0.4), it = M.interiorDeCaja(c0, caja, sal);
    falla(M.apagarExteriorAhora(it, c0, mira(caja.rot), cosV) === true, 'casa de té: en el centro, mirando al fondo (de espaldas al frente), se apaga el exterior');
    falla(M.apagarExteriorAhora(it, c0, mira(caja.rot + Math.PI), cosV) === false, 'casa de té: mirando al frente (puerta y ventanal), se dibuja todo');
    falla(M.apagarExteriorAhora(it, c0, mira(caja.rot + Math.PI / 2), cosV) === false, 'casa de té: mirando de costado el frente todavía asoma por un borde del cuadro, se dibuja todo');
  }
  falla(M.EDIFICIOS_ABIERTOS.has('observatorio') && M.EDIFICIOS_ABIERTOS.has('varadero') && M.EDIFICIOS_ABIERTOS.has('taller-tren') && M.EDIFICIOS_ABIERTOS.size === 3, 'los edificios abiertos son los tres de siempre');
  return mal;
}

// ---------------------------------------------------------------- lo que tiene que cumplir la cadencia de rendimiento.js
function comprobarCadencia(R) {
  const mal = [];
  const falla = (c, t) => { if (!c) mal.push(t); };
  const c = (d, dt, s) => R.cadaCuantosCuadrosChoca(d, dt, s);
  falla(c(0) === 1 && c(10) === 1 && c(34.9) === 1, 'a menos de 35 m el choque va en cada cuadro');
  falla(c(35) === 3 && c(60) === 3 && c(79.9) === 3, 'de 35 a 80 m, cada tres cuadros');
  falla(c(80) === 6 && c(300) === 6, 'a más de 80 m, cada seis');
  falla(c(60, 0.06) === 1 && c(60, 0.05) === 1 && c(60, 0.049) === 3, 'con el cuadro lento (50 ms o más) siempre: un paso largo podría atravesar algo');
  falla(c(60, 1 / 60, true) === 1 && c(500, 1 / 60, true) === 1, 'la que charla o está en una escena, siempre');
  falla(c(NaN) === 1 && c(undefined) === 1 && c(60, NaN) === 1, 'sin dato, siempre');
  falla(R.CHOQUE_CERCA_M === 35 && R.CHOQUE_LEJOS_M === 80, 'los cortes son 35 y 80 m');
  // la fase: cada persona choca una vez cada `cada` cuadros y entre todas se reparten
  for (const cada of [3, 6]) {
    for (let fase = 0; fase < 6; fase++) {
      let n = 0;
      for (let cuadro = 100; cuadro < 100 + cada * 10; cuadro++) if (R.leTocaElChoque(cada, cuadro, fase)) n++;
      falla(n === 10, `con cada ${cada} y fase ${fase}: diez choques en ${cada * 10} cuadros (${n})`);
    }
    for (let cuadro = 7; cuadro < 7 + cada; cuadro++) {
      let n = 0;
      for (let fase = 0; fase < 6; fase++) if (R.leTocaElChoque(cada, cuadro, fase)) n++;
      falla(n === 6 / cada, `con cada ${cada}: ${6 / cada} de 6 personas por cuadro, no todas juntas (${n})`);
    }
  }
  falla(R.leTocaElChoque(1, 5, 3) === true && R.leTocaElChoque(0, 5, 3) === true, 'con cada = 1 le toca siempre');
  falla(R.POSE_ENTERA_M === 20 && Math.abs(R.PASO_POSE_MEDIA - 1 / 32) < 1e-12, 'la pose entera hasta 20 m y la media a ~30 por segundo');
  return mal;
}

// ---------------------------------------------------------------- las copias mutadas corren sólo la comprobación y dicen cuántas fallas tienen
const hijo = process.argv.indexOf('--hijo');
if (hijo > 0) {
  const archivo = process.argv[hijo + 1], tipo = process.argv[hijo + 2];
  const M = await import(pathToFileURL(archivo).href);
  const mal = tipo === 'interior' ? comprobarInterior(M) : comprobarCadencia(M);
  console.log(String(mal.length));
  process.exit(0);
}

let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };

// ---------------------------------------------------------------- 1 y 2: los módulos puros de verdad
{
  const I = await import('../src/interior-visible.js');
  const mal = comprobarInterior(I);
  ok(mal.length === 0, `interior-visible.js cumple todo (${mal.join(' | ') || 'sin fallas'})`);
  const R = await import('../src/rendimiento.js');
  const mal2 = comprobarCadencia(R);
  ok(mal2.length === 0, `rendimiento.js: la cadencia de la gente cumple todo (${mal2.join(' | ') || 'sin fallas'})`);
}

// ---------------------------------------------------------------- 3: gente.js
const fuenteGente = leer('src/gente.js');
{
  const R = await import('../src/rendimiento.js');
  const pasoPose = (fuente, g, d, charlando = false, nivel = 0) => expresion(fuente, 'const pasoPose = ', { g, d, charlando, presupuestoNivel: nivel, POSE_ENTERA_M: R.POSE_ENTERA_M, PASO_POSE_MEDIA: R.PASO_POSE_MEDIA });
  const comprobarPose = (f) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    falla(pasoPose(f, {}, 5) === 0 && pasoPose(f, {}, 19.9) === 0, 'a menos de 20 m la pose es en cada cuadro');
    falla(Math.abs(pasoPose(f, {}, 25) - 1 / 32) < 1e-9 && Math.abs(pasoPose(f, {}, 37.9) - 1 / 32) < 1e-9, 'de 20 a 38 m, a mitad de frecuencia (1/32 s)');
    falla(Math.abs(pasoPose(f, {}, 38) - 1 / 12) < 1e-9 && Math.abs(pasoPose(f, {}, 84) - 1 / 12) < 1e-9, 'de 38 a 85 m sigue a 12 por segundo');
    falla(Math.abs(pasoPose(f, {}, 90) - 1 / 8) < 1e-9, 'a más de 85 m sigue a 8 por segundo');
    falla(pasoPose(f, {}, 30, true) === 0, 'el que charla, a 30 m, en cada cuadro');
    falla(pasoPose(f, { enEscena: true }, 30) === 0 && pasoPose(f, { enEscena: true }, 700) === 0, 'el de una escena, entero a la distancia que sea (4.19.0)');
    return mal;
  };
  const mal = comprobarPose(fuenteGente);
  ok(mal.length === 0, `gente.js: la pose por distancia (${mal.join(' | ') || 'sin fallas'})`);
  const musP = [
    ['pose-sin-banda-media', 'charlando || g.enEscena || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA', 'true ? 0 : PASO_POSE_MEDIA'],
    ['pose-media-a-todos', 'charlando || g.enEscena || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA', 'charlando || g.enEscena ? 0 : PASO_POSE_MEDIA'],
    ['pose-escena-media', 'charlando || g.enEscena || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA', 'charlando || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA'],
    ['pose-charla-media', 'charlando || g.enEscena || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA', 'g.enEscena || d < POSE_ENTERA_M ? 0 : PASO_POSE_MEDIA'],
  ];
  for (const [n, de, a] of musP) {
    if (!fuenteGente.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const m = comprobarPose(fuenteGente.replace(de, a));
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }

  // caminarHacia: sin el choque (y sin la altura del pie) cuando `g.__sinChoque`; con él, igual que siempre
  const llamadas = (fuente, sinChoque, destino = {}) => {
    const n = { resolver: 0, altura: 0, plataforma: 0 };
    const T = { agua: () => false, altura: () => 5 };
    const col = { resolver() { n.resolver++; }, plataformaEn() { n.plataforma++; return null; } };
    const alturaDePie = (T2, col2, x, z, y) => { n.altura++; return T2.altura(x, z); };
    const f = funcion(fuente, 'caminarHacia', { alturaDePie });
    const g = { pos: { x: 0, y: 0, z: 0 }, __sinChoque: sinChoque, rumboObjetivo: 0, vel: 0 };
    const llegó = f(g, 1 / 60, { x: 0, z: 10, ...destino }, 0.8, T, col);
    return { n, g, llegó };
  };
  const comprobarCaminar = (fuente) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    const con = llamadas(fuente, false), sin = llamadas(fuente, true), sinChoqueDestino = llamadas(fuente, false, { sinChoque: true });
    falla(con.n.resolver === 1 && con.n.altura === 1, `con choque: resuelve el choque y la altura una vez (${con.n.resolver}/${con.n.altura})`);
    falla(sin.n.resolver === 0 && sin.n.altura === 0, `con __sinChoque: ni el choque ni la altura del pie (${sin.n.resolver}/${sin.n.altura})`);
    falla(sin.g.pos.z > 0.01 && Math.abs(sin.g.pos.z - con.g.pos.z) < 1e-12, 'sin el choque igual camina lo mismo');
    falla(sinChoqueDestino.n.resolver === 0 && sinChoqueDestino.n.altura === 1, 'el tramo «sinChoque» (la puerta para adentro) sigue sin choque y con altura');
    falla(llamadas(fuente, undefined).n.resolver === 1, 'sin la marca, con choque (como siempre)');
    return mal;
  };
  const m2 = comprobarCaminar(fuenteGente);
  ok(m2.length === 0, `gente.js: caminarHacia (${m2.join(' | ') || 'sin fallas'})`);
  const musC = [
    ['choque-siempre', 'if (!destino.sinChoque && conChoque) col.resolver(g.pos, 0.3);', 'if (!destino.sinChoque) col.resolver(g.pos, 0.3);'],
    ['altura-siempre', 'else if (conChoque) g.pos.y = alturaDePie(T, col, g.pos.x, g.pos.z, g.pos.y);', 'else g.pos.y = alturaDePie(T, col, g.pos.x, g.pos.z, g.pos.y);'],
    ['nunca-choque', 'if (!destino.sinChoque && conChoque) col.resolver(g.pos, 0.3);', 'if (false) col.resolver(g.pos, 0.3);'],
    ['marca-al-reves', 'const conChoque = !g.__sinChoque;', 'const conChoque = !!g.__sinChoque;'],
  ];
  for (const [n, de, a] of musC) {
    if (!fuenteGente.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const m = comprobarCaminar(fuenteGente.replace(de, a));
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }

  // el enganche en `actualizar`: la marca sale de la cadencia (la que charla y la de una escena, siempre)
  const marca = (fuente, d, dt, charlando, g, cuadro, fase) => {
    const env = { g: { ...g }, d, dt, charlando, cuadroGente: cuadro, cadaCuantosCuadrosChoca: R.cadaCuantosCuadrosChoca, leTocaElChoque: R.leTocaElChoque, faseGente: fase, Math };
    env.g.__faseChoque = fase;
    return expresion(fuente, 'g.__sinChoque = ', env);
  };
  const comprobarMarca = (fuente) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    falla(marca(fuente, 10, 1 / 60, false, {}, 7, 2) === false, 'cerca (10 m): siempre con choque');
    let sin = 0; for (let c = 0; c < 30; c++) if (marca(fuente, 50, 1 / 60, false, {}, c, 1)) sin++;
    falla(sin === 20, `a 50 m: 2 de cada 3 cuadros sin choque (${sin} de 30)`);
    let sin6 = 0; for (let c = 0; c < 30; c++) if (marca(fuente, 120, 1 / 60, false, {}, c, 1)) sin6++;
    falla(sin6 === 25, `a 120 m: 5 de cada 6 cuadros sin choque (${sin6} de 30)`);
    let char = 0; for (let c = 0; c < 30; c++) if (marca(fuente, 120, 1 / 60, true, {}, c, 1)) char++;
    falla(char === 0, 'charlando, siempre con choque aunque esté lejos');
    let esc = 0; for (let c = 0; c < 30; c++) if (marca(fuente, 400, 1 / 60, false, { enEscena: true }, c, 1)) esc++;
    falla(esc === 0, 'en una escena, siempre con choque a la distancia que sea');
    let lento = 0; for (let c = 0; c < 30; c++) if (marca(fuente, 120, 0.08, false, {}, c, 1)) lento++;
    falla(lento === 0, 'con el cuadro lento, siempre con choque');
    let reparto = 0; for (let fase = 0; fase < 6; fase++) if (marca(fuente, 50, 1 / 60, false, {}, 5, fase)) reparto++;
    falla(reparto === 4, `a 50 m y en el mismo cuadro, cada persona con su fase: 4 de 6 sin choque (${reparto})`);
    return mal;
  };
  const m3 = comprobarMarca(fuenteGente);
  ok(m3.length === 0, `gente.js: la marca __sinChoque sale de la distancia (${m3.join(' | ') || 'sin fallas'})`);
  ok(enUnaLinea(fuenteGente, ['if (g.__faseChoque === undefined) g.__faseChoque = faseGente++ % 6;']), 'gente.js: cada persona recibe su fase una vez (0 a 5)');
  const musM = [
    ['marca-sin-charla', 'cadaCuantosCuadrosChoca(d, dt, charlando || !!g.enEscena)', 'cadaCuantosCuadrosChoca(d, dt, !!g.enEscena)'],
    ['marca-sin-escena', 'cadaCuantosCuadrosChoca(d, dt, charlando || !!g.enEscena)', 'cadaCuantosCuadrosChoca(d, dt, charlando)'],
    ['marca-sin-dt', 'cadaCuantosCuadrosChoca(d, dt, charlando || !!g.enEscena)', 'cadaCuantosCuadrosChoca(d, 0, charlando || !!g.enEscena)'],
    ['marca-sin-fase', 'cuadroGente, g.__faseChoque)', 'cuadroGente, 0)'],
    ['marca-al-reves', 'g.__sinChoque = !leTocaElChoque(', 'g.__sinChoque = leTocaElChoque('],
  ];
  for (const [n, de, a] of musM) {
    if (!fuenteGente.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const m = comprobarMarca(fuenteGente.replace(de, a));
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }
  ok(/import \{[^}]*cadaCuantosCuadrosChoca[^}]*\} from '\.\/rendimiento\.js';/.test(fuenteGente), 'gente.js: el import de la cadencia va en una línea (armar.mjs sólo entiende esos)');
  ok(/cuadroGente\+\+;/.test(fuenteGente), 'gente.js: el contador de cuadros sube en cada actualización');
}

// ---------------------------------------------------------------- 4: main.js, apagarExterior con el código de verdad
const fuenteMain = leer('src/main.js');
{
  const I = await import('../src/interior-visible.js');
  const mundo = (opciones = {}) => {
    const mk = (nombre, extra = {}) => ({ name: nombre, visible: true, children: [], ...extra });
    const terreno = mk('terreno'), terrenoAldea = mk('terreno-aldea'), soto = mk('sotobosque'), impostores = mk('impostores', { isInstancedMesh: true, count: 5 });
    const instanciado = mk('', { isInstancedMesh: true, count: 40 }), huerta = mk('huerta', { isInstancedMesh: true, count: 3 }), contacto = mk('sombras-de-contacto'), molino = mk('molino-paisaje'), tren = mk('tren');
    const edificio = mk(''), interior = mk(''), rincones = mk('rincones'), luz = mk(''), vacioApagado = mk('', { isInstancedMesh: true, count: 0, visible: false });
    const pastoA = mk(''), pastoB = mk('');
    const chunk1 = { grupo: mk('') }, chunk2 = { grupo: mk('', { visible: false }) };
    const dentro = { g: mk(''), pos: { x: 1, z: 1 } }, fuera = { g: mk(''), pos: { x: 100, z: 0 } }, oculta = { g: mk('', { visible: false }), pos: { x: 100, z: 0 } };
    const escena = { children: [terreno, terrenoAldea, soto, impostores, instanciado, huerta, contacto, molino, tren, edificio, interior, rincones, luz, vacioApagado, pastoA] };
    const it = { id: 'cantina', x: 0, z: 0, radio: 8, puertas: [{ x: 0, z: -4, abierta: 0 }] };
    const env = {
      aldeaMundo: { interiorDe: () => (opciones.afuera || opciones.casaTe ? null : it) },
      interiorDeLaCasaDeTe: () => (opciones.casaTe ? it : null),
      window: { __hojarasca: opciones.debug ? { __sinInteriorVisible: true } : {} },
      camara: { position: { x: 0, y: 1.6, z: 0 }, fov: 70, aspect: 16 / 9, getWorldDirection(v) { v.x = opciones.mira?.x ?? 0; v.y = 0; v.z = opciones.mira?.z ?? 1; } },
      miraDeInterior: { x: 0, y: 0, z: 0 }, miraPlana: { x: 0, z: 0 },
      apagarExteriorAhora: I.apagarExteriorAhora, quedaAfuera: I.quedaAfuera, cosVistaDe: I.cosVistaDe,
      exteriorApagado: [], exteriorEstabaApagado: opciones.estabaApagado || false,
      renderer: { shadowMap: { enabled: true, needsUpdate: false } },
      escena, pasto: { malla: opciones.pastoLista ? [pastoA, pastoB] : pastoA }, veg: { chunks: new Map([['a', chunk1], ['b', chunk2]]) },
      gente: { gente: [dentro, fuera, oculta] }, statsInterior: { cuadros: 0, apagados: 0, ultimosApagados: 0 },
    };
    return { env, todo: { terreno, terrenoAldea, soto, impostores, instanciado, huerta, contacto, molino, tren, edificio, interior, rincones, luz, vacioApagado, pastoA, pastoB, chunk1, chunk2, dentro, fuera, oculta } };
  };
  const comprobarMain = (fuente) => {
    const mal = [];
    const falla = (c, t) => { if (!c) mal.push(t); };
    const correr = (opciones) => {
      const { env, todo } = mundo(opciones);
      const apagar = funcion(fuente, 'apagarExterior', env);
      const prender = funcion(fuente, 'prenderExterior', env);
      apagar();
      return { env, todo, estado: () => Object.fromEntries(Object.entries(todo).map(([k, v]) => [k, (v.grupo || v.g || v).visible])), prender };
    };
    const a = correr({});
    const v = a.estado();
    falla(!v.terreno && !v.terrenoAldea && !v.soto && !v.impostores && !v.instanciado, 'adentro, de espaldas a la puerta: se apagan el terreno, el terreno de la aldea, el sotobosque, los impostores y lo instanciado');
    falla(!v.contacto && !v.molino && !v.tren, 'se apagan las sombras de contacto, el paisaje del molino y el tren');
    falla(!v.pastoA && !v.chunk1, 'se apagan el pasto y el bosque (los chunks)');
    falla(!v.fuera, 'se apaga la gente que quedó afuera');
    falla(v.dentro === true, 'la gente que está adentro de las paredes se sigue dibujando');
    falla(v.edificio && v.interior && v.rincones && v.luz && v.huerta, 'el edificio, lo de adentro, tu casa (rincones), las luces y lo instanciado con nombre propio quedan');
    falla(v.chunk2 === false && v.oculta === false && v.vacioApagado === false, 'lo que ya estaba oculto sigue oculto');
    falla(a.env.exteriorApagado.length === 11, `se anotaron las 11 cosas apagadas (${a.env.exteriorApagado.length})`);
    falla(a.env.statsInterior.cuadros === 1 && a.env.statsInterior.ultimosApagados === 11, 'las estadísticas anotan el cuadro y lo apagado');
    a.prender();
    const v2 = a.estado();
    falla(v2.terreno && v2.terrenoAldea && v2.soto && v2.impostores && v2.instanciado && v2.contacto && v2.molino && v2.tren && v2.pastoA && v2.chunk1 && v2.fuera, 'después de dibujar, todo lo apagado vuelve a estar prendido');
    falla(v2.chunk2 === false && v2.oculta === false && v2.vacioApagado === false, 'y lo que estaba oculto no se prende');
    falla(a.env.exteriorApagado.length === 0, 'la lista queda vacía');
    const b = correr({ mira: { x: 0, z: -1 } });
    falla(b.env.exteriorApagado.length === 0 && b.estado().terreno === true, 'mirando la puerta no se apaga nada');
    const c = correr({ afuera: true });
    falla(c.env.exteriorApagado.length === 0 && c.estado().terreno === true, 'afuera no se apaga nada');
    const d = correr({ debug: true });
    falla(d.env.exteriorApagado.length === 0, 'con __sinInteriorVisible (las pruebas de equivalencia) no se apaga nada');
    const ct = correr({ casaTe: true });
    falla(ct.env.exteriorApagado.length === 11 && ct.estado().terreno === false, 'la casa de té (estructura del valle puesta en la aldea) también apaga el exterior');
    const e = correr({ pastoLista: true });
    falla(e.estado().pastoA === false && e.estado().pastoB === false, 'si el pasto es una lista de mallas, se apagan todas');
    // el mapa de sombras: al salir (o al abrir la puerta) se rehace una vez
    const s1 = correr({ afuera: true, estabaApagado: true });
    falla(s1.env.renderer.shadowMap.needsUpdate === true && s1.env.exteriorEstabaApagado === false, 'al salir se rehace el mapa de sombras (con el exterior prendido) una sola vez');
    const s2 = correr({ afuera: true, estabaApagado: false });
    falla(s2.env.renderer.shadowMap.needsUpdate === false, 'afuera y sin haber estado adentro no se toca el mapa de sombras');
    const s3 = correr({ mira: { x: 0, z: -1 }, estabaApagado: true });
    falla(s3.env.renderer.shadowMap.needsUpdate === true, 'al mirar la puerta (se vuelve a dibujar todo) también se rehace');
    const s4 = correr({});
    falla(s4.env.exteriorEstabaApagado === true, 'adentro queda anotado que el exterior estaba apagado');
    return mal;
  };
  const mal = comprobarMain(fuenteMain);
  ok(mal.length === 0, `main.js: apagarExterior con el código de verdad (${mal.join(' | ') || 'sin fallas'})`);
  const mus = [
    ['sin-terreno', "nombre === 'terreno' || ", ''],
    ['sin-terreno-aldea', "nombre === 'terreno-aldea' || ", ''],
    ['sin-impostores', " || nombre === 'impostores'", ''],
    ['instanciados-con-nombre', "o.isInstancedMesh ? (nombre === '' ||", "o.isInstancedMesh ? (true ||"],
    ['sin-pasto', 'if (pasto?.malla) {', 'if (false) {'],
    ['sin-bosque', 'for (const ch of veg.chunks.values()) ocultar(ch.grupo);', ''],
    ['sin-gente-afuera', 'if (g.g.visible && quedaAfuera(g.pos, it)) ocultar(g.g);', ''],
    ['gente-adentro-tambien', 'if (g.g.visible && quedaAfuera(g.pos, it)) ocultar(g.g);', 'if (g.g.visible) ocultar(g.g);'],
    ['sin-anotar', 'const ocultar = (o) => { if (o && o.visible) { o.visible = false; exteriorApagado.push(o); } };', 'const ocultar = (o) => { if (o && o.visible) { o.visible = false; } };'],
    ['prende-lo-oculto', 'const ocultar = (o) => { if (o && o.visible) { o.visible = false; exteriorApagado.push(o); } };', 'const ocultar = (o) => { if (o) { o.visible = false; exteriorApagado.push(o); } };'],
    ['sin-sombras-al-salir', 'if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; }', '}'],
    ['sin-marca-de-salida', 'if (exteriorEstabaApagado) { exteriorEstabaApagado = false;', 'if (exteriorEstabaApagado) {'],
    ['sin-marca-de-entrada', 'exteriorEstabaApagado = true;', ''],
    ['sin-cos-de-vista', 'apagarExteriorAhora(it, cam, miraPlana, cosVistaDe(camara.fov, camara.aspect))', 'apagarExteriorAhora(it, cam, miraPlana, 2)'],
    ['sin-casa-de-te', '(aldeaMundo.interiorDe(cam) || interiorDeLaCasaDeTe(cam))', 'aldeaMundo.interiorDe(cam)'],
    ['siempre-apaga', 'apagar = apagarExteriorAhora(it, cam, miraPlana, cosVistaDe(camara.fov, camara.aspect)); }', 'apagar = true; }'],
    ['sin-bandera-de-debug', '!window.__hojarasca?.__sinInteriorVisible', 'true'],
    ['prender-a-medias', 'for (let i = 0; i < exteriorApagado.length; i++) exteriorApagado[i].visible = true;', 'for (let i = 1; i < exteriorApagado.length; i++) exteriorApagado[i].visible = true;'],
    ['no-vaciar-la-lista', '  exteriorApagado.length = 0;\n}\n// Dibuja la escena', '}\n// Dibuja la escena'],
  ];
  for (const [n, de, a] of mus) {
    if (!fuenteMain.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    let m;
    try { m = comprobarMain(fuenteMain.replace(de, a)); } catch (e) { m = ['se rompió: ' + String(e.message).slice(0, 60)]; }
    ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
  }
  {
    const I2 = await import('../src/interior-visible.js');
    const casa = { x: 100, z: 50, y: 20, rot: 0.7, ancho: 6.4, fondo: 5.2 };
    const comprobarCasa = (fuente) => {
      const mal = [];
      const falla = (c, t) => { if (!c) mal.push(t); };
      const env = (lugares) => ({ T: { lugares }, interiorDeCaja: I2.interiorDeCaja, salidaCasaTe: { id: '', x: 0, z: 0, radio: 0, puertas: null }, cajaCasaTe: null });
      const e1 = env({ 'casa-te': casa });
      const f1 = funcion(fuente, 'interiorDeLaCasaDeTe', e1);
      const dentro = { x: 100, y: 21.6, z: 50 };
      falla(f1(dentro)?.id === 'casa-te' && f1(dentro).puertas.length === 3, 'interiorDeLaCasaDeTe: en el centro devuelve la casa de té con su frente');
      falla(f1({ x: 140, y: 21.6, z: 50 }) === null, 'interiorDeLaCasaDeTe: afuera, null');
      falla(funcion(fuente, 'interiorDeLaCasaDeTe', env({}))(dentro) === null, 'interiorDeLaCasaDeTe: sin casa de té, null');
      falla(funcion(fuente, 'interiorDeLaCasaDeTe', env({ 'casa-te': { ...casa, ancho: undefined } }))(dentro) === null, 'interiorDeLaCasaDeTe: sin las medidas de las paredes, null (no se adivina)');
      const e2 = env({ 'casa-te': casa }); const f2 = funcion(fuente, 'interiorDeLaCasaDeTe', e2); f2(dentro);
      const caja1 = e2.cajaCasaTe; f2(dentro);
      falla(caja1 && e2.cajaCasaTe === caja1, 'interiorDeLaCasaDeTe: la caja se arma una vez, no en cada cuadro');
      e2.T.lugares['casa-te'] = { ...casa, x: 120 }; f2({ x: 120, y: 21.6, z: 50 });
      falla(e2.cajaCasaTe !== caja1 && e2.cajaCasaTe.x === 120, 'interiorDeLaCasaDeTe: si la casa cambia de lugar, se rehace');
      return mal;
    };
    const mc = comprobarCasa(fuenteMain);
    ok(mc.length === 0, `main.js: interiorDeLaCasaDeTe (${mc.join(' | ') || 'sin fallas'})`);
    for (const [n, de, a] of [
      ['casa-frente-sin-ancho', '[[-c.ancho / 2, c.fondo / 2], [0, c.fondo / 2], [c.ancho / 2, c.fondo / 2]]', '[[0, c.fondo / 2]]'],
      ['casa-caja-cada-cuadro', 'if (!cajaCasaTe || cajaCasaTe.x !== c.x', 'if (true || cajaCasaTe.x !== c.x'],
    ]) {
      if (!fuenteMain.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
      let m; try { m = comprobarCasa(fuenteMain.replace(de, a)); } catch (e) { m = ['se rompió: ' + String(e.message).slice(0, 60)]; }
      ok(m.length > 0, `mutación «${n}» hace fallar la comprobación (${(m[0] || 'no falló').slice(0, 80)})`);
    }
    const est = leer('src/estructuras.js');
    ok(/radio: Math\.max\(W \/ 2 \+ 1\.4, D \/ 2 \+ 3\.5\), ancho: W, fondo: D \}/.test(est), 'estructuras.js: la casa de té expone `ancho` y `fondo` (sus paredes)');
  }
  // el enganche en `dibujar`
  const dibujar = fuenteMain.slice(fuenteMain.indexOf('function dibujar(luz, noche) {'), fuenteMain.indexOf('function dibujarCuadro('));
  ok(/apagarVacias\(\);\s*apagarExterior\(\);\s*try \{ dibujarCuadro\(luz, noche\); \} finally \{ prenderExterior\(\); prenderVacias\(\); \}/.test(dibujar), 'main.js: dibujar() apaga el exterior antes del cuadro y lo prende después, aunque falle (finally)');
  ok(/import \{[^}]*apagarExteriorAhora[^}]*\} from '\.\/interior-visible\.js';/.test(fuenteMain), 'main.js: el import de interior-visible.js va en una línea');
  ok(/perfilador, statsInterior,/.test(fuenteMain), 'main.js: las estadísticas del interior salen en window.__hojarasca (para las pruebas de equivalencia)');
  const am = leer('src/aldea-mundo.js');
  ok(/function interiorDe\(pos\) \{\s*const b = edificioEn\(pos, false\);\s*if \(!b\) return null;/.test(am) && /adentro, interiorDe, bajoCubierta/.test(am), 'aldea-mundo.js: interiorDe(pos) devuelve el edificio cerrado donde está la cámara (con su centro, radio y puertas)');
}

// ---------------------------------------------------------------- reglas de presupuesto y de armado
{
  const iv = leer('src/interior-visible.js');
  const sinComentarios = iv.split(String.fromCharCode(10)).filter((l) => !l.trimStart().startsWith('//')).join(String.fromCharCode(10));
  ok(!/THREE|import |document|window/.test(sinComentarios), 'interior-visible.js es puro (sin three, sin imports ni DOM)');
  ok(!/ShaderMaterial|onBeforeCompile|MeshLambertMaterial|new THREE\./.test(sinComentarios), 'interior-visible.js no crea materiales, mallas ni shaders (0 programas de shader nuevos)');
  const pkg = JSON.parse(leer('package.json'));
  ok(pkg.scripts['verify:pasos'].includes('verificar-4-23-0-c.mjs'), 'la prueba está en verify:pasos');
}

// ---------------------------------------------------------------- mutaciones de los módulos puros (una copia con otro nombre por cada una; un proceso por copia)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4230c-'));
  const correr = (nombre, texto, tipo) => {
    const f = path.join(dir, nombre + '.mjs');
    fs.writeFileSync(f, texto);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', f, tipo], { encoding: 'utf8' });
    return (r.stdout || '').trim().split('\n').pop() || (r.stderr || '').slice(0, 200);
  };
  const interior = leer('src/interior-visible.js');
  ok(correr('interior-original', interior, 'interior') === '0', 'mutación 0 (interior-visible.js): la copia sin tocar cumple todo');
  const mi = [
    ['usa-el-estado-abierta', 'if ((dx * mira.x + dz * mira.z) / (d * ml) > cosVista) return true;', 'if (p.abierta > 0.02 && (dx * mira.x + dz * mira.z) / (d * ml) > cosVista) return true;'],
    ['cos-al-reves', 'if ((dx * mira.x + dz * mira.z) / (d * ml) > cosVista) return true;', 'if ((dx * mira.x + dz * mira.z) / (d * ml) < cosVista) return true;'],
    ['sin-pegado', 'if (d < PEGADO_A_LA_PUERTA_M) return true;', ''],
    ['sin-mira-plana', 'if (!(ml > MIRA_PLANA_MINIMA)) return true;', 'if (!(ml > 1e-9)) return true;'],
    ['sin-margen', 'export const MARGEN_VISTA = 0.25;', 'export const MARGEN_VISTA = 0;'],
    ['margen-enorme', 'export const MARGEN_VISTA = 0.25;', 'export const MARGEN_VISTA = 1.2;'],
    ['observatorio-cerrado', "new Set(['observatorio', 'varadero', 'taller-tren'])", "new Set(['varadero', 'taller-tren'])"],
    ['sin-puertas-apaga', 'if (!interior.puertas || !interior.puertas.length) return false;', ''],
    ['afuera-apaga', 'if (!interior) return false;', ''],
    ['gente-adentro-afuera', 'return Math.hypot(g.x - interior.x, g.z - interior.z) > interior.radio;', 'return Math.hypot(g.x - interior.x, g.z - interior.z) < interior.radio;'],
    ['cos-sin-aspecto', 'Math.tan((f * Math.PI) / 360) * a)', 'Math.tan((f * Math.PI) / 360) * 1)'],
    ['caja-giro-al-reves', 'const a = dx * cs - dz * sn, b = dx * sn + dz * cs;', 'const a = dx * cs + dz * sn, b = -dx * sn + dz * cs;'],
    ['caja-sin-altura', 'if (Number.isFinite(cam.y) && (cam.y < c.y - 1 || cam.y > c.y + c.alto)) return null;', ''],
    ['caja-ancho-por-fondo', 'Math.abs(a) < c.ancho / 2 - 0.1 && Math.abs(b) < c.fondo / 2 - 0.1', 'Math.abs(a) < c.fondo / 2 - 0.1 && Math.abs(b) < c.ancho / 2 - 0.1'],
    ['caja-sin-margen', 'Math.abs(a) < c.ancho / 2 - 0.1 && Math.abs(b) < c.fondo / 2 - 0.1', 'Math.abs(a) < c.ancho / 2 + 5 && Math.abs(b) < c.fondo / 2 + 5'],
    ['caja-frente-al-reves', 'p.x = c.x + pa * cs + pb * sn; p.z = c.z - pa * sn + pb * cs;', 'p.x = c.x + pa * cs - pb * sn; p.z = c.z - pa * sn - pb * cs;'],
    ['caja-radio', 'salida.radio = Math.hypot(c.ancho, c.fondo) / 2 + 2;', 'salida.radio = 1;'],
    ['siempre-ve-la-puerta', 'return !puertaALaVista(cam, mira, interior.puertas, cosVista);', 'return true;'],
  ];
  for (const [n, de, a] of mi) {
    if (!interior.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, interior.replace(de, a), 'interior');
    ok(r !== '0', `mutación «${n}» (interior-visible.js) hace fallar la comprobación (${r.slice(0, 60)} fallas)`);
  }
  const rend = leer('src/rendimiento.js');
  ok(correr('cadencia-original', rend, 'cadencia') === '0', 'mutación 0 (rendimiento.js): la copia sin tocar cumple todo');
  const mr = [
    ['sin-siempre', 'if (siempre || !(dt < 0.05) || !(distancia >= CHOQUE_CERCA_M)) return 1;', 'if (!(dt < 0.05) || !(distancia >= CHOQUE_CERCA_M)) return 1;'],
    ['sin-cuadro-lento', 'if (siempre || !(dt < 0.05) || !(distancia >= CHOQUE_CERCA_M)) return 1;', 'if (siempre || !(distancia >= CHOQUE_CERCA_M)) return 1;'],
    ['corte-cerca', 'export const CHOQUE_CERCA_M = 35;', 'export const CHOQUE_CERCA_M = 20;'],
    ['corte-lejos', 'export const CHOQUE_LEJOS_M = 80;', 'export const CHOQUE_LEJOS_M = 60;'],
    ['seis-por-tres', 'return distancia < CHOQUE_LEJOS_M ? 3 : 6;', 'return distancia < CHOQUE_LEJOS_M ? 6 : 6;'],
    ['tres-por-seis', 'return distancia < CHOQUE_LEJOS_M ? 3 : 6;', 'return distancia < CHOQUE_LEJOS_M ? 3 : 3;'],
    ['sin-fase', 'return cada <= 1 || ((cuadro + fase) % cada) === 0;', 'return cada <= 1 || (cuadro % cada) === 0;'],
    ['fase-al-reves', 'return cada <= 1 || ((cuadro + fase) % cada) === 0;', 'return cada <= 1 || ((cuadro + fase) % cada) !== 0;'],
    ['pose-entera-lejos', 'export const POSE_ENTERA_M = 20;', 'export const POSE_ENTERA_M = 38;'],
    ['pose-media-lenta', 'export const PASO_POSE_MEDIA = 1 / 32;', 'export const PASO_POSE_MEDIA = 1 / 12;'],
  ];
  for (const [n, de, a] of mr) {
    if (!rend.includes(de)) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    const r = correr(n, rend.replace(de, a), 'cadencia');
    ok(r !== '0', `mutación «${n}» (rendimiento.js) hace fallar la comprobación (${r.slice(0, 60)} fallas)`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
