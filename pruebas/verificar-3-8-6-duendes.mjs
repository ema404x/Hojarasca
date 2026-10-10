// 3.8.6 (duendes): el pase de bugs de La noche de los duendes.
//  1. La salpicadura del escupitajo y de la piedra del artillero, y la picada de la lechuza, no pasan a través de una pared.
//  2. Los refuerzos de madrugada se guardan (`refuerzoNoche`): guardar y abrir los mandaba otra vez.
//  3. Si el reloj salta la hora del aviso (una siesta, la hora de tu reloj), la noche especial se decide igual.
//  4. El Rey Duende que cae no revive si se cierra el juego en los segundos en que se viene abajo el Coihue.
//  5. Los nidos de hongos no crecen atravesados por un árbol, una piedra o una obra, ni medio enterrados.
//  6. Las madrigueras tampoco (el hongo alto del medio y las estructuras de alrededor, al nacer y al crecer).
//  7. Las semillas doradas tiradas en el suelo se guardan en la partida, y al caer se pierden de verdad.
// Donde se puede, el código de verdad corre en una VM con lo mínimo alrededor.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
// el texto de una función interna (de `function nombre(` hasta la llave que la cierra, contando llaves)
function extraer(texto, nombre) {
  const i = texto.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  let n = 0, j = texto.indexOf(') {', i) + 2;
  for (; j < texto.length; j++) { if (texto[j] === '{') n++; else if (texto[j] === '}' && --n === 0) break; }
  return texto.slice(i, j + 1);
}
const des = leer('src/desafio.js');
const nave = leer('src/desafio-nave-mundo.js');
const R = await import('../src/desafio-reglas.js');
const A = await import('../src/desafio-asedio.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. la salpicadura no pasa a través de una pared
{
  class V3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { return this.set(v.x, v.y, v.z); }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    length() { return Math.hypot(this.x, this.y, this.z); }
  }
  // la pared más fina como la ve obraEnPunto (de 16 cm, cuenta como de 36: ±18 cm), de 0 a 2,3 m de alto
  ok(des.includes('Math.abs(lz) <= Math.max(0.2, (P.fondo || 1) / 2) + margen'), 'obraEnPunto mide igual que esta prueba');
  const pared = (x, y, z) => (Math.abs(z) <= 0.18 && y >= 0 && y <= 2.3 ? { pared: true } : null);
  const ctxVm = { THREE: { Vector3: V3 }, alturaSuelo: () => 0, obraEnPunto: pared };
  const i0 = des.indexOf('const _salA = new THREE.Vector3()');
  ok(i0 > 0, 'la salpicadura mira las paredes');
  const tapada = vm.runInNewContext([des.slice(i0, des.indexOf('\n', i0)), extraer(des, 'hayObraEntre'), extraer(des, 'salpicaduraTapada'), 'salpicaduraTapada'].join('\n'), ctxVm);
  // el escupitajo revienta contra la pared viniendo de z negativo: el punto del impacto es una muestra del tiro
  // (de a 35 cm), así que puede quedar de 0 a 35 cm adentro de la pared
  for (const hondo of [0, 0.1, 0.2, 0.34]) {
    const q = { pos: new V3(0, 1.1, -0.18 + hondo), vel: new V3(0, -2, 15) };
    ok(tapada(q, { pos: { x: 0.3, y: 0, z: 0.6 } }), `del otro lado de la pared no te salpica (${hondo})`);
    ok(!tapada(q, { pos: { x: 0.3, y: 0, z: -0.7 } }), `del mismo lado, sí (${hondo})`);
  }
  // revienta en el suelo afuera, con vos adentro: tapado; en el suelo de tu lado: no
  ok(tapada({ pos: new V3(0.2, 0, -0.9), vel: new V3(0, -8, 3) }, { pos: { x: 0, y: 0, z: 0.6 } }), 'en el suelo de afuera no salpica adentro');
  ok(!tapada({ pos: new V3(0.2, 0, 1.4), vel: new V3(0, -8, 3) }, { pos: { x: 0, y: 0, z: 0.6 } }), 'en el suelo de adentro, sí');
  ok(des.includes('Math.abs(js.pos.y - q.pos.y) < 2.4 && !salpicaduraTapada(q, js)) herirJugador(q.dano * 0.5, q.pos);'), 'el escupitajo');
  ok(des.includes('Math.abs(js.pos.y - q.pos.y) < 2.4 && !salpicaduraTapada(q, js)) herirJugador(q.dano * 0.6, q.pos);'), 'la piedra del artillero');
  ok(des.includes('n = Math.max(1, Math.ceil(L / 0.35))'), 'el tiro avanza de a 35 cm (la cuenta de arriba)');
  // la picada de la lechuza tampoco pega a través de una pared (la empalizada de 2,3 m, con vos pegado del lado de adentro)
  const vol = extraer(des, 'actualizarVolador');
  ok(/a\.cd <= 0 && !caido && \(fortin\.bajoTejado\(js\.pos\) \|\| hayObraEntre\(p, b, 0\.12\)\)\) \{/.test(vol), 'la lechuza mira la pared antes de pegar');
  const hayV = vm.runInNewContext(`(${extraer(des, 'hayObraEntre')})`, { obraEnPunto: pared });
  ok(hayV({ x: 0, y: 1.9, z: -0.9 }, { x: 0.2, y: 1.2, z: 0.45 }, 0.12), 'la lechuza de afuera, a tu altura: la pared tapa');
  ok(!hayV({ x: 0, y: 1.9, z: 1.3 }, { x: 0.2, y: 1.2, z: 0.45 }, 0.12), 'del mismo lado, te alcanza');
}

// ---------------------------------------------------------------- 2. los refuerzos de madrugada
{
  ok(!/refuerzoHecho/.test(des), 'sin la marca en memoria');
  ok(/!d\.oleadaTerminada && d\.refuerzoNoche !== d\.oleadas && d\.oleadas >= 3/.test(des), 'se miran en la partida');
  ok(/d\.refuerzoNoche = d\.oleadas;\n\s*const refuerzo = sinJefe/.test(des), 'y se anotan al mandarlos');
  ok(R.desafioNuevo().refuerzoNoche === -1, 'una partida nueva no los tuvo');
  ok(R.sanearDesafio({ refuerzoNoche: 7 }).refuerzoNoche === 7, 'se guardan');
  ok(R.sanearDesafio(JSON.parse(JSON.stringify(R.sanearDesafio({ refuerzoNoche: 12 })))).refuerzoNoche === 12, 'ida y vuelta por JSON');
  ok(R.sanearDesafio({}).refuerzoNoche === -1 && R.sanearDesafio({ refuerzoNoche: null }).refuerzoNoche === -1 && R.sanearDesafio({ refuerzoNoche: 'x' }).refuerzoNoche === -1, 'una partida vieja o rara: -1');
}

// ---------------------------------------------------------------- 3. el aviso salteado
{
  const rev = extraer(des, 'revisarHorario');
  ok(/function decidirNoche\(clave\) \{[\s\S]*?avisada = clave;[\s\S]*?d\.especial = esNocheFinal\(\) \? null/.test(des), 'la noche se decide en un solo lugar');
  ok(/avisada !== p\.dia && d\.oleadaNoche !== p\.dia\) \{\n\s*decidirNoche\(p\.dia\);/.test(rev), 'en el aviso');
  ok(/if \(d\.oleadaNoche !== noche\) \{[\s\S]{0,500}?if \(avisada !== noche && !d\.especial\) decidirNoche\(noche\);\n\s*d\.oleadaNoche = noche;/.test(rev), 'y al empezar la noche si el aviso no pasó (y no hay una ya decidida)');
  // la siesta del Desafío suma dos horas: desde las 18:30 pasa por encima de toda la hora del aviso
  const { HORA_ATAQUE } = R;
  ok(18.6 + 2 >= HORA_ATAQUE && 18.6 < HORA_ATAQUE - 1, 'una siesta a las 18:36 saltea el aviso');
  // y el azar de la especial es fijo con el código (decidirla tarde da la misma que habría anunciado el aviso)
  const M = await import('../src/meteo.js');
  const d = { semilla: 'COIHUE-4821' };
  ok(M.azarEspecial(d, null, 7) === M.azarEspecial(d, null, 7), 'mismo azar con el mismo código');
}

// ---------------------------------------------------------------- 4. el Rey que cae
{
  const a = A.asedioNuevo([{ id: 'base', x: 1, z: 2 }], { x: 3, z: 4 });
  ok(!('reyCaido' in A.sanearAsedio(a)), 'sin caer, nada');
  ok(A.sanearAsedio({ ...a, reyCaido: true }).reyCaido === true, 'el Rey caído se guarda');
  ok(!('reyCaido' in A.sanearAsedio({ ...a, reyCaido: true, ganado: true })), 'con el asedio ganado ya no hace falta');
  ok(R.sanearDesafio({ asedio: { ...a, reyCaido: true } }).asedio.reyCaido === true, 'pasa por el saneado del Desafío');
  const fin = extraer(nave, 'empezarFinal');
  ok(/if \(asedio\) asedio\.reyCaido = true;\n\s*api\.guardar\(\);/.test(fin), 'se anota antes de guardar, al caer');
  ok(/if \(D\(\)\.asedio\?\.reyCaido && !D\(\)\.asedio\.ganado && !D\(\)\.victoria\) ganarAsedio\(D\(\)\.asedio\);\n\s*if \(D\(\)\.asedio\?\.ganado && !D\(\)\.victoria\) vencer\(\{ nave: true \}\);/.test(des), 'al abrir, el asedio se gana y llega la victoria');
  ok(/^import \{ ganarAsedio \} from '\.\/desafio-asedio\.js';$/m.test(des), 'importado en una línea (armar.mjs)');
  const g = A.sanearAsedio({ ...a, reyCaido: true });
  A.ganarAsedio(g);
  ok(g.ganado && !A.asedioActivo(g), 'ganarAsedio lo cierra');
}

// ---------------------------------------------------------------- 5. los nidos de hongos, enteros
{
  const I = await import('../src/desafio-infestacion.js');
  const S = await import('../src/semilla.js');
  const azar = () => S.azarDe('COIHUE-4821', 6, 'capullos');
  // un bosque de mentira: un árbol cada 6 m en una grilla; el nido no puede tener uno a menos de 1,5 m
  const arbol = (x, z) => { const ax = Math.round(x / 6) * 6, az = Math.round(z / 6) * 6; return Math.hypot(x - ax, z - az) < 1.5 + 0.3; };
  const l = I.lugaresCapullos(5, { x: 0, z: 0 }, { preferido: (x, z) => !arbol(x, z), azar: azar() });
  ok(l.length === 5, `los cinco nidos (${l.length})`);
  ok(l.every((c) => !arbol(c.x, c.z)), 'ninguno atravesado por un árbol');
  ok(l.every((c, i) => l.every((o, j) => i === j || Math.hypot(c.x - o.x, c.z - o.z) >= I.CAPULLOS.separacion)), 'lejos entre sí');
  ok(JSON.stringify(I.lugaresCapullos(5, { x: 0, z: 0 }, { preferido: (x, z) => !arbol(x, z), azar: azar() })) === JSON.stringify(l), 'con el mismo código, en el mismo lugar');
  // si ningún lugar es bueno del todo, igual salen todos (de la reserva): no hay menos nidos que antes
  const r = I.lugaresCapullos(4, { x: 0, z: 0 }, { preferido: () => false, azar: azar() });
  ok(r.length === 4, `sin lugar parejo, igual cuatro (${r.length})`);
  ok(JSON.stringify(I.lugaresCapullos(4, { x: 0, z: 0 }, { azar: azar() })) === JSON.stringify(I.lugaresCapullos(4, { x: 0, z: 0 }, { preferido: null, azar: azar() })), 'sin preferido, como siempre');
  const sem = extraer(des, 'sembrarCapullos');
  ok(/const preferido = \(x, z\) => !trabadoEn\(x, z, NIDO_RADIO\) && parejoEn\(x, z, NIDO_RADIO \* 0\.8, 0\.45\);/.test(sem), 'el nido mira árboles, piedras, obras y la pendiente');
  ok(/lugaresCapullos\(n, centroBase\(\), \{ esBueno, preferido, azar: azarNoche\('capullos'\) \}\)/.test(sem), 'y lo usa');
  ok(/const cofreTrabado = \(x, z\) => trabadoEn\(x, z, 0\.55\);/.test(des) && /const cofreParejo = \(x, z\) => parejoEn\(x, z, 0\.5, 0\.18\);/.test(des), 'el cofre, como en la 3.8.1');
}

// ---------------------------------------------------------------- 6. las madrigueras, sin árboles atravesados
{
  const P = await import('../src/desafio-puestos.js');
  const { generador } = await import('../src/semilla.js');
  // un bosque de mentira: un árbol cada 7 m; atravesado si el tronco (30 cm) queda adentro del radio de la estructura
  const arbol = (x, z, r) => { const ax = Math.round(x / 7) * 7, az = Math.round(z / 7) * 7; return Math.hypot(x - ax, z - az) < r + 0.3; };
  const libre = (x, z, r) => !arbol(x, z, r);
  const preferido = (x, z) => libre(x, z, P.ESTRUCTURAS.aguja.radio);
  const c = { x: 0, z: 0 };
  for (let s = 1; s <= 20; s++) {
    const l = P.lugarDelPuesto(c, { azar: generador(s), preferido });
    ok(l && preferido(l.x, l.z), `el hongo alto sin un árbol atravesado (${s})`);
  }
  ok(JSON.stringify(P.lugarDelPuesto(c, { azar: generador(9), preferido: () => false })) === JSON.stringify(P.lugarDelPuesto(c, { azar: generador(9) })), 'sin lugar libre, el de antes');
  const sitios = [{ x: 0, z: 140 }, { x: 140, z: 0 }, { x: 3.5, z: 150 }];
  ok(JSON.stringify(P.sitioDelPuesto(sitios, { preferido })) === JSON.stringify({ x: 3.5, z: 150 }), 'con el mapa, el primer sitio libre');
  ok(JSON.stringify(P.sitioDelPuesto(sitios, { preferido: () => false })) === JSON.stringify({ x: 0, z: 140 }), 'y si ninguno, el primero, como antes');
  // las estructuras de alrededor (al nacer y al crecer)
  const est = P.puestosNuevos();
  const p = P.puestoNuevo(est.proximoId++, { x: 3.5, z: 150 }, 2, generador(4), libre);
  est.lista.push(p);
  for (let noche = 4; noche <= 12; noche += 2) P.crecerPuestos(est, noche, generador(noche), libre);
  ok(p.nivel === P.PUESTOS.nivelMax && p.estructuras.length > 3, `creció entera (${p.estructuras.length} estructuras)`);
  ok(p.estructuras.every((e) => e.tipo === 'aguja' || libre(p.x + e.dx, p.z + e.dz, P.ESTRUCTURAS[e.tipo].radio)), 'ninguna estructura atravesada por un árbol');
  ok(p.estructuras.every((e, i) => p.estructuras.every((o, j) => i === j || Math.hypot(e.dx - o.dx, e.dz - o.dz) >= 2.4)), 'y sin encimarse');
  const q1 = P.puestoNuevo(1, { x: 0, z: 0 }, 2, generador(5)), q2 = P.puestoNuevo(1, { x: 0, z: 0 }, 2, generador(5), null);
  ok(JSON.stringify(q1) === JSON.stringify(q2), 'sin `libre`, como siempre');
  const mundo = leer('src/desafio-puestos-mundo.js');
  ok(/const libre = \(x, z, r\) => !api\.trabadoEn\?\.\(x, z, r\);\n\s*const crecieron = crecerPuestos\(est, noche, azar, libre\);/.test(mundo), 'al crecer');
  ok(/sitioDelPuesto\(sitios, \{ esBueno, preferido,/.test(mundo) && /lugarDelPuesto\(c, \{ esBueno, preferido,/.test(mundo) && /puestoNuevo\(est\.proximoId\+\+, pos, noche, azar, libre\)/.test(mundo), 'al nacer');
  ok(des.includes('api.trabadoEn = (x, z, r) => trabadoEn(x, z, r);'), 'el mundo del Desafío se lo pasa');
}

// ---------------------------------------------------------------- 7. las semillas doradas tiradas en el suelo
{
  ok(Array.isArray(R.desafioNuevo().sueltas) && !R.desafioNuevo().sueltas.length, 'una partida nueva, sin semillas tiradas');
  ok(JSON.stringify(R.sanearSueltas([{ x: 1, y: 2, z: 3 }, { x: 'a', y: 0, z: 0 }, null, { x: null, y: 0, z: 0 }, { x: 1e9, y: 0, z: 0 }, 5])) === JSON.stringify([{ x: 1, y: 2, z: 3 }]), 'el saneado');
  ok(R.sanearSueltas(Array.from({ length: 200 }, (_, i) => ({ x: i, y: 0, z: 0 }))).length === R.SUELTAS_MAX, 'con tope');
  ok(R.sanearDesafio({ sueltas: [{ x: 4, y: 5, z: 6 }] }).sueltas[0].z === 6 && R.sanearDesafio({}).sueltas.length === 0, 'pasa por el saneado del Desafío');
  // el código de verdad, en una VM: soltar, juntar, guardar, abrir y caer
  const armar = (d) => {
    const ctxVm = {
      D: () => d, SUELTAS_MAX: R.SUELTAS_MAX, cristales: [], geoCristal: null, matCristal: null,
      THREE: { Mesh: class { constructor() { this.visible = false; } } }, escena: { add() {} },
      alturaSuelo: () => 10, naveMundo: { adentro: false }, T: { agua: () => null },
    };
    const f = ['semillaLibre', 'anotarSuelta', 'borrarSuelta', 'soltarCristales', 'restaurarSueltas', 'perderSueltas'].map((k) => extraer(des, k)).join('\n');
    return vm.runInNewContext(`${f}\n({ soltarCristales, restaurarSueltas, perderSueltas, borrarSuelta, cristales })`, ctxVm);
  };
  const d = { sueltas: [] };
  const a = armar(d);
  a.soltarCristales({ x: 100, z: 50 }, 6);
  ok(d.sueltas.length === 6, 'las seis que soltó quedan anotadas');
  const c0 = a.cristales[0]; c0.activo = false; a.borrarSuelta(c0);
  ok(d.sueltas.length === 5, 'la que juntaste ya no');
  // guardar y abrir: vuelven las cinco, en el mismo lugar
  const guardado = JSON.parse(JSON.stringify(R.sanearDesafio(d)));
  const b = armar(guardado);
  b.restaurarSueltas();
  const activas = b.cristales.filter((c) => c.activo);
  ok(activas.length === 5 && guardado.sueltas.length === 5, 'al abrir vuelven las cinco');
  ok(activas.every((c) => d.sueltas.some((s) => Math.abs(s.x - c.x) < 0.01 && Math.abs(s.z - c.z) < 0.01 && Math.abs(s.y - c.y) < 0.01)), 'en su lugar');
  ok(activas.every((c) => c.mesh.visible), 'y se ven');
  // al caer se pierden de verdad: no quedan para juntar al despertar
  b.perderSueltas();
  ok(!b.cristales.some((c) => c.activo || c.mesh.visible) && guardado.sueltas.length === 0, 'al caer, ninguna');
  // cableado: juntar borra, caer pierde antes de que main.js guarde la caída, y al abrir se restauran
  ok(/c\.activo = false; c\.mesh\.visible = false; juntados\+\+;\n\s*borrarSuelta\(c\);/.test(des), 'juntarla la borra de la partida');
  ok(/if \(!d\.oleadaTerminada\) terminarOleada\(false\);\n\s*perderSueltas\(\);[^\n]*\n\s*ctx\.alCaer\?\.\(\);/.test(des), 'al caer, antes de guardar la caída');
  ok(/devolverTodo\(false\);[^\n]*\n\s*restaurarSueltas\(\);/.test(des), 'al abrir');
  ok(!/cristales\.length > 80/.test(des), 'el tope del pozo es SUELTAS_MAX');
}

console.log(`verificar-3-8-6-duendes: ${n} comprobaciones OK`);
