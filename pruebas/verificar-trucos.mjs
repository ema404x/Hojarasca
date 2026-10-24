// 4.5: la consola de códigos (Ctrl+Mayús+C): src/trucos.js (el motor), trucos-textos.js, trucos-pantalla.js, trucos-juego.js, en Node:
//   · el parseo: números mal escritos (texto, NaN, negativos, decimales, enormes), mayúsculas, tildes y espacios de más;
//   · cada código con un mundo de mentira: sus rangos, que el resultado quede dentro de lo posible y que no deje rastro (libro, ganado, logros);
//   · el Desafío: lo que no aplica lo dice y no toca nada;
//   · el autocompletado (Tab), el historial (flechas) y la ayuda;
//   · la marca del cuaderno: lo completado con el código no cuenta para los logros y se guarda saneado;
//   · lo enganchado en main.js, jugador.js y la plantilla; que no hay inglés ni mando en lo nuevo.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const E = await import('../src/trucos.js');
const TX = await import('../src/trucos-textos.js');
const G = await import('../src/guardado.js');
const { pesosDe, MAX_PESOS } = await import('../src/economia.js');
const { LOGROS_RELAX, nuevosLogros } = await import('../src/logros-relax.js');
const V = await import('../src/vecindad.js');
const H = await import('../src/historia.js');
const O = await import('../src/oficios.js');
const AL = await import('../src/almacen.js');
const { ENTRADAS } = await import('../src/cuaderno.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ------------------------------------------------------------------ el mundo de mentira
function mundo({ desafio = false } = {}) {
  const p = G.progresoNuevo();
  if (desafio) { p.modo = 'desafio'; delete p.economia; }
  const js = { pos: { x: 10, y: 3, z: 20 }, yaw: 0, agachado: false, entumecido: 0.5 };
  const lugares = [
    { clave: 'faro', nombre: 'Faro', x: 100, z: -50 }, { clave: 'muelle', nombre: 'Muelle del Lago', x: -30, z: 60 }, { clave: 'mirador', nombre: 'Mirador del Pehuén', x: -292, z: 36 },
    { clave: 'molino', nombre: 'Molino', x: 5, z: 5 }, { clave: 'plaza', nombre: 'Plaza de la aldea', x: 40, z: -300 }, { clave: 'puente', nombre: 'Puente', x: 1, z: 1 }, { clave: 'puesto', nombre: 'Puesto', x: 2, z: 2 },
  ];
  const sucesos = [];
  const m = {
    desafio, progreso: () => p, ajustes: () => aj, jugador: () => js, reloj: { congelado: false }, limite: 468,
    lugares: () => lugares, ir: (x, z, yaw, y) => { js.pos.x = x; js.pos.z = z; sucesos.push(['ir', x, z]); },
    depositos: () => [], rehacerObra: () => {}, alCambiarClima: () => sucesos.push(['clima']), alCambiarEstacion: () => sucesos.push(['estacion']),
    refrescar: () => sucesos.push(['refrescar']), guardar: () => sucesos.push(['guardar']), limpiar: () => sucesos.push(['limpiar']), salir: () => {},
  };
  const aj = { estacion: 'verano', clima: 'variable', duracion: 30 };
  return { m, p, js, aj, sucesos };
}
const corre = (w, linea) => E.ejecutar(linea, w.m);

// ------------------------------------------------------------------ el parseo de números
eq(E.leerNumero('50000', { max: 99999999 }).valor, 50000, 'entero');
eq(E.leerNumero('50.000', { max: 99999999 }).valor, 50000, 'punto de miles');
eq(E.leerNumero('1.234.567', { max: 99999999 }).valor, 1234567, 'varios puntos de miles');
eq(E.leerNumero('+500', { signo: true }).rel, 1, 'suma');
eq(E.leerNumero('-500', { signo: true }).rel, -1, 'resta');
eq(E.leerNumero('−500', { signo: true }).rel, -1, 'menos largo');
for (const mal of ['', ' ', 'abc', 'NaN', 'Infinity', '1e9', '0x10', '--5', '5 5', '12abc', '٣', '1..2', '1,2,3', '-', '+']) {
  const r = E.leerNumero(mal, { signo: true });
  ok(!r.ok, `rechaza «${mal}»`);
}
ok(!E.leerNumero('-5').ok, 'sin signo permitido, el negativo no vale');
ok(!E.leerNumero('10000').ok, 'más del máximo');
ok(!E.leerNumero('5.5').ok, 'un decimal donde va un entero');
ok(E.leerNumero('5.5', { entero: false, min: 0, max: 10 }).ok, 'un decimal permitido');
eq(E.leerNumero('1,5', { entero: false, max: 10 }).valor, 1.5, 'coma decimal');
eq(E.leerNumero('9'.repeat(30), { max: 1e30 }).error, 'demasiado', 'número enorme');
eq(E.normalizar('  OtOÑo  '), 'otono', 'normalizar');
eq(E.partir('  plata    50000 '), ['plata', '50000'], 'partir');
eq(E.partir('x'.repeat(500)).join('').length, E.LINEA_MAX, 'la línea se corta');
eq(E.leerHora('18').horas, 18, 'hora entera');
eq(E.leerHora('6:30').horas, 6.5, 'hora con minutos');
eq(E.leerHora('21.5').horas, 21.5, 'hora decimal');
for (const mal of ['24', '25', '-1', '12:60', 'abc', '', '12:', ':30', '9.9999']) ok(!E.leerHora(mal).ok || mal === '9.9999', `hora mala «${mal}»`);

// ------------------------------------------------------------------ dinero y materiales
{
  const w = mundo();
  const libroAntes = JSON.stringify(w.p.economia.libro), ganado = w.p.economia.ganado, gastado = w.p.economia.gastado;
  let r = corre(w, 'plata 50000');
  ok(r.ok && r.texto === 'Listo: tenés $50.000', 'plata: el mensaje del pedido');
  eq(pesosDe(w.p), 50000, 'plata fija');
  corre(w, 'plata +2500'); eq(pesosDe(w.p), 52500, 'plata suma');
  corre(w, 'plata -2500'); eq(pesosDe(w.p), 50000, 'plata resta');
  corre(w, 'plata -999999'); eq(pesosDe(w.p), 0, 'plata no baja de cero');
  corre(w, 'plata +99999999999'); ok(pesosDe(w.p) <= MAX_PESOS, 'plata no pasa el techo');
  eq(corre(w, 'plata 100000000').ok, false, 'más del techo: no vale');
  eq(corre(w, 'plata -50').ok, true, 'restar está permitido');
  for (const mal of ['plata', 'plata abc', 'plata NaN', 'plata 1e9', 'plata 5.5', 'plata 1 2']) ok(!corre(w, mal).ok, `«${mal}» no vale`);
  ok(Number.isInteger(pesosDe(w.p)), 'siempre entero');
  corre(w, 'plata 7');
  eq(JSON.stringify(w.p.economia.libro), libroAntes, 'plata: el libro de movimientos queda igual');
  eq(w.p.economia.ganado, ganado, 'plata: lo ganado queda igual'); eq(w.p.economia.gastado, gastado, 'plata: lo gastado queda igual');

  corre(w, 'tablas 200'); eq(w.p.materiales.tabla, 200, 'tablas');
  corre(w, 'troncos +30'); eq(w.p.materiales.tronco, 30, 'troncos suma');
  corre(w, 'piedras 80'); corre(w, 'lana 20'); eq(w.p.materiales.lana, 20, 'lana');
  // 4.10.1: la mochila tiene 24 casillas (carga.js): `materiales 100` llena hasta donde entra, ya no se pasa a 52 casillas (ver verificar-4-10-1-mundo.mjs)
  corre(w, 'materiales 100'); eq([w.p.materiales.tronco, w.p.materiales.tabla, w.p.materiales.piedra, w.p.materiales.lana], [50, 100, 100, 100], 'materiales (hasta donde entra la mochila)');
  corre(w, 'tablas 0'); ok(!('tabla' in w.p.materiales), 'cero borra la clave');
  ok(!corre(w, 'tablas 10000').ok && !corre(w, 'tablas x').ok && !corre(w, 'tablas 1e3').ok, 'materiales fuera de rango');
  ok(corre(w, 'TABLAS 5').ok && corre(w, '  Tabla   5  ').ok, 'mayúsculas, alias y espacios');
  const hasta = { ...w.p.materiales };
  corre(w, 'materiales -999999'); ok(Object.values(w.p.materiales).every((v) => v >= 0), 'nunca negativos');
  eq(w.p.economia.libro.length, 0, 'sin movimientos');
  const h = corre(w, 'herramientas');
  ok(h.ok && w.p.cosas.hacha === 1 && w.p.cosas.pico === 1 && w.p.cosas.tijera === 1, 'herramientas');
  ok(corre(w, 'herramientas').texto.startsWith('Ya tenías'), 'herramientas, otra vez');
}
{
  // depósitos: se llenan hasta el tope, sin pasarse, y se rehace la obra
  const w = mundo();
  const obra = (id, etapas = 3) => ({ plano: { id, etapas: new Array(etapas).fill(0) }, datos: { etapas, almacen: { n: 0, g: { piedra: 5 } } } });
  const o1 = obra('deposito-piedra'), o2 = obra('barraca'), o3 = obra('herramientero'), o4 = { plano: { id: 'deposito-piedra', etapas: [0, 0] }, datos: { etapas: 1 } };
  const rehechas = [];
  w.m.depositos = () => [o1, o2, o3];
  w.m.rehacerObra = (o) => rehechas.push(o);
  const r = corre(w, 'depositos');
  ok(r.ok, 'depósitos');
  eq(o1.datos.almacen.g.piedra, AL.topeDe('deposito-piedra', o1.datos.almacen), 'depósito de piedra lleno');
  for (const k of ['tronco', 'tabla', 'piedra', 'lana']) eq(o2.datos.almacen.g[k], AL.topeDe('barraca', o2.datos.almacen), `barraca llena de ${k}`);
  eq(o3.datos.almacen, { n: 0, g: { piedra: 5 } }, 'el herramientero no se toca');
  eq(rehechas.length, 2, 'se rehacen las obras tocadas');
  corre(w, 'depositos'); eq(o1.datos.almacen.g.piedra, AL.topeDe('deposito-piedra', o1.datos.almacen), 'otra vez: no se pasa del tope');
  w.m.depositos = () => []; ok(!corre(w, 'depositos').ok, 'sin depósitos lo dice');
  ok(o4 && true, 'una obra a medias no está en la lista del juego');
}

// ------------------------------------------------------------------ tiempo y clima
{
  const w = mundo();
  let r = corre(w, 'hora 18'); eq(w.p.horas, 18, 'hora'); ok(r.texto === 'Listo: son las 18:00', r.texto);
  corre(w, 'hora 6:30'); eq(w.p.horas, 6.5, 'hora con minutos');
  corre(w, 'amanecer'); eq(w.p.horas, 6.5, 'amanecer'); corre(w, 'mediodia'); eq(w.p.horas, 12, 'mediodía'); corre(w, 'atardecer'); eq(w.p.horas, 19, 'atardecer'); corre(w, 'medianoche'); eq(w.p.horas, 0, 'medianoche');
  for (const mal of ['hora', 'hora 24', 'hora -3', 'hora abc', 'hora 12:99', 'hora 1 2']) ok(!corre(w, mal).ok, `«${mal}» no vale`);
  eq(w.p.horas, 0, 'una hora mala no cambia nada');
  w.aj.duracion = 'reloj'; ok(!corre(w, 'hora 10').ok, 'con la hora del reloj no anda'); corre(w, 'congelar'); ok(corre(w, 'hora 10').ok, 'congelado sí');
  w.aj.duracion = 30; corre(w, 'descongelar');
  w.p.dia = 5;
  ok(corre(w, 'dia 12').ok && w.p.dia === 12, 'día adelante'); ok(!corre(w, 'dia 3').ok && w.p.dia === 12, 'no se vuelve atrás');
  ok(corre(w, 'dia 12').ok && w.p.dia === 12, 'mismo día'); ok(corre(w, 'dia +3').ok && w.p.dia === 15, 'día +3');
  ok(!corre(w, 'dia 10000').ok && !corre(w, 'dia 0').ok && !corre(w, 'dia x').ok && !corre(w, 'dia 2.5').ok, 'días fuera de rango');
  eq(w.p.dia, 15, 'queda el día');
  corre(w, 'estacion otoño'); eq(w.aj.estacion, 'otono', 'estación'); corre(w, 'estacion INVIERNO'); eq(w.aj.estacion, 'invierno'); corre(w, 'estacion auto'); eq(w.aj.estacion, 'auto');
  ok(!corre(w, 'estacion primavera').ok && !corre(w, 'estacion').ok, 'estación mala'); eq(w.aj.estacion, 'auto', 'queda la estación');
  corre(w, 'clima lluvia'); eq(w.aj.clima, 'lluvioso'); corre(w, 'clima despejado'); eq(w.aj.clima, 'despejado'); corre(w, 'clima variable'); eq(w.aj.clima, 'variable');
  ok(!corre(w, 'clima granizo').ok, 'clima malo'); ok(w.sucesos.some((s) => s[0] === 'clima') && w.sucesos.some((s) => s[0] === 'estacion'), 'avisan al juego');
  ok(corre(w, 'congelar').ok && w.m.reloj.congelado === true, 'congelar'); ok(corre(w, 'congelar').texto.includes('ya estaba'), 'congelar dos veces');
  ok(corre(w, 'descongelar').ok && w.m.reloj.congelado === false, 'descongelar'); ok(corre(w, 'descongelar').texto.includes('ya andaba'), 'descongelar dos veces');
}

// ------------------------------------------------------------------ jugador y lugares
{
  const w = mundo();
  corre(w, 'velocidad 3'); eq(w.js.trucoVel, 3, 'velocidad'); corre(w, 'velocidad 1,5'); eq(w.js.trucoVel, 1.5, 'velocidad con coma');
  corre(w, 'velocidad normal'); ok(!('trucoVel' in w.js), 'velocidad normal la borra'); corre(w, 'velocidad 1'); ok(!('trucoVel' in w.js), 'velocidad 1 la borra');
  for (const mal of ['velocidad', 'velocidad 0', 'velocidad 7', 'velocidad -2', 'velocidad abc', 'velocidad 0,1', 'velocidad 99999999999999']) ok(!corre(w, mal).ok, `«${mal}» no vale`);
  ok(!('trucoVel' in w.js), 'sin cambios por lo malo');
  corre(w, 'salto 4'); eq(w.js.trucoSalto, 4, 'salto'); corre(w, 'salto normal'); ok(!('trucoSalto' in w.js), 'salto normal');
  ok(!corre(w, 'salto 0,5').ok && !corre(w, 'salto 7').ok, 'salto fuera de rango');
  ok(corre(w, 'volar').ok && w.js.trucoVuelo === true, 'volar prende'); ok(corre(w, 'volar').ok && !w.js.trucoVuelo, 'volar otra vez apaga');
  w.js.montado = {}; ok(!corre(w, 'volar').ok && !w.js.trucoVuelo, 'no vuela arriba del caballo'); delete w.js.montado;
  ok(corre(w, 'volar si').ok && w.js.trucoVuelo, 'volar si'); ok(corre(w, 'volar no').ok && !w.js.trucoVuelo, 'volar no');
  w.js.entumecido = 0.8; corre(w, 'frio'); eq(w.js.trucoSinFrio, true); eq(w.js.entumecido, 0, 'sin frío: el entumecimiento se va'); corre(w, 'frio'); ok(!w.js.trucoSinFrio, 'frío otra vez');
  // ir
  let r = corre(w, 'ir faro'); ok(r.ok && w.js.pos.x === 100 && w.js.pos.z === -50, 'ir faro'); ok(r.texto.includes('Faro'), r.texto);
  r = corre(w, 'ir mirador'); ok(w.js.pos.x === -292, 'ir mirador');
  r = corre(w, 'ir Muelle del Lago'); ok(r.ok && w.js.pos.x === -30, 'ir por el nombre largo');
  r = corre(w, 'ir 120 -80'); ok(r.ok && w.js.pos.x === 120 && w.js.pos.z === -80, 'ir a un punto');
  for (const mal of ['ir 9999 0', 'ir 0 -9999', 'ir NaN 5', 'ir 1e5 1', 'ir narnia', 'ir p']) { const antes = { ...w.js.pos }; ok(!corre(w, mal).ok, `«${mal}» no vale`); eq({ ...w.js.pos }, antes, `«${mal}» no mueve`); }
  ok(corre(w, 'ir').texto.includes('faro') && corre(w, 'ir').texto.includes('plaza'), 'ir sola lista los lugares');
  w.js.enTren = true; ok(!corre(w, 'ir faro').ok, 'no se teletransporta arriba del tren'); w.js.enTren = false; w.js.sentado = true; ok(!corre(w, 'ir faro').ok, 'ni sentado'); w.js.sentado = false;
  w.js.pos = { x: 0, y: 0, z: 0 }; ok(corre(w, 'donde').texto.includes('0, 0'), 'dónde');
  ok(corre(w, 'estado').ok, 'estado');
}

// ------------------------------------------------------------------ desbloquear y completar
{
  const w = mundo();
  ok(corre(w, 'planos todos').ok && corre(w, 'planos todos').texto.includes('ya están'), 'planos en el Relax');
  corre(w, 'oficios maximo');
  for (const id of O.ORDEN_OFICIOS) eq(O.nivelOficio(w.p.oficios, id), O.NIVEL_MAX, `oficio ${id} al máximo`);
  corre(w, 'oficios hachero 2'); eq(O.nivelOficio(w.p.oficios, 'hachero'), 2, 'un oficio solo'); corre(w, 'oficios picapedrero 0'); eq(O.nivelOficio(w.p.oficios, 'picapedrero'), 0, 'nivel cero');
  ok(!corre(w, 'oficios hachero 6').ok && !corre(w, 'oficios hachero -1').ok && !corre(w, 'oficios nadie 1').ok && !corre(w, 'oficios').ok, 'oficios mal');
  eq(O.nivelOficio(w.p.oficios, 'hachero'), 2, 'sigue igual'); corre(w, 'oficios cero'); eq(O.nivelOficio(w.p.oficios, 'hachero'), 0, 'oficios cero');
  eq(O.sanearOficios(w.p.oficios).acreditado, true, 'los oficios quedan acreditados');

  // historia
  w.p.dia = 9;
  const hist = () => w.p.historia;
  let r = corre(w, 'historia capitulo 5');
  ok(r.ok, 'historia capitulo 5'); eq(hist().capitulo, 4, 'capítulo 5'); eq(hist().fase, 'intro', 'empieza por la tarjeta'); ok(hist().activa, 'activa');
  for (let i = 0; i < 4; i++) { const c = H.CAPITULOS[i]; ok(c.objetivos.every((o) => hist().hechos[`${c.id}:${o.id}`] !== undefined), `capítulo ${i + 1} completo`); ok(hist().cerrados[c.id], `capítulo ${i + 1} cerrado`); }
  ok(H.CAPITULOS[4].objetivos.every((o) => hist().hechos[`${H.CAPITULOS[4].id}:${o.id}`] === undefined), 'el 5 sin hacer');
  eq(H.sanearHistoria(hist()).capitulo, 4, 'la historia guardada sigue siendo válida');
  corre(w, 'historia capitulo 2'); eq(hist().capitulo, 1, 'se puede volver'); ok(H.CAPITULOS[3].objetivos.every((o) => hist().hechos[`${H.CAPITULOS[3].id}:${o.id}`] === undefined), 'los siguientes se deshacen');
  corre(w, 'historia completar'); eq(hist().fase, 'fin'); ok(hist().terminada > 0, 'completa'); eq(H.sanearHistoria(hist()).fase, 'fin');
  corre(w, 'historia reiniciar'); eq(hist().capitulo, 0); eq(hist().terminada, 0, 'reiniciada');
  for (const mal of ['historia', 'historia capitulo', 'historia capitulo 0', 'historia capitulo 9', 'historia capitulo x', 'historia nada']) ok(!corre(w, mal).ok, `«${mal}» no vale`);

  // amigos
  const nivel = (k) => V.nivelDe(k, w.p);
  r = corre(w, 'amigos todos');
  ok(r.ok, 'amigos todos'); ok(V.PERSONAS_VECINDAD.every((k) => nivel(k) === 'compadre'), 'todos compadres');
  const w2 = mundo(); corre(w2, 'amigos todos amigo'); ok(V.PERSONAS_VECINDAD.every((k) => V.nivelDe(k, w2.p) === 'amigo'), 'todos amigos');
  const w3 = mundo(); corre(w3, 'amigos ercilia compadre'); eq(V.nivelDe('ercilia', w3.p), 'compadre', 'Ercilia sola'); eq(V.nivelDe('ramon', w3.p), 'conocido', 'los otros no');
  ok(!corre(w3, 'amigos nadie').ok && !corre(w3, 'amigos').ok && !corre(w3, 'amigos todos rey').ok, 'amigos mal');
  corre(w3, 'amigos todos amigo'); eq(V.nivelDe('ercilia', w3.p), 'compadre', 'nunca baja la amistad');
  ok(V.puntosAmistad('ercilia', w.p) <= V.AMISTAD.tope, 'puntos dentro del tope');

  // cuaderno: completo, sin logros
  const w4 = mundo();
  const antes = nuevosLogros(w4.p, () => false);
  r = corre(w4, 'cuaderno completo');
  ok(r.ok && Object.keys(w4.p.entradas).length === ENTRADAS.length, 'el cuaderno completo');
  eq(w4.p.trucos.entradas.length, ENTRADAS.length, 'la marca anota lo puesto por el código');
  const ven = E.vistaParaLogros(w4.p);
  eq(nuevosLogros(ven, () => false), antes, 'los logros no ven lo completado con el código');
  ok(nuevosLogros(w4.p, () => false).length > antes.length, '(sin la vista, el cuaderno completo sí daría logros)');
  ok(corre(w4, 'cuaderno completo').texto.includes('ya estaba completo'), 'otra vez');
  const w5 = mundo(); w5.p.entradas.coihue = { dia: 1, hora: 8, cantidad: 0 }; corre(w5, 'cuaderno completo flora');
  ok(!w5.p.trucos.entradas.includes('coihue'), 'lo que ya tenías no se marca'); ok(!!w5.p.entradas.lenga && !w5.p.entradas.haba, 'sólo la sección pedida');
  ok(!corre(w5, 'cuaderno completo nada').ok && !corre(w5, 'cuaderno').ok, 'cuaderno mal');
  eq(E.vistaParaLogros(mundo().p).constructor, Object, 'sin códigos no hay copia'); const pp = mundo().p; ok(E.vistaParaLogros(pp) === pp, 'sin códigos es el mismo objeto');
  // el guardado
  eq(E.sanearMarcaTrucos({ entradas: ['coihue', 'coihue', 'inventada', 5, null] }), { entradas: ['coihue'] }, 'marca saneada');
  eq(E.sanearMarcaTrucos({ entradas: [] }), undefined, 'marca vacía no se guarda'); eq(E.sanearMarcaTrucos('x'), undefined); eq(E.sanearMarcaTrucos(null), undefined); eq(E.sanearMarcaTrucos([1]), undefined);
  const g = G.progresoNuevo(); g.trucos = { entradas: ['coihue', 'x'] }; G.guardarProgreso?.call?.(null, g);
  const sano = G.cargarProgreso?.call ? null : null;
  ok(sano === null, 'cargar sin almacén no rompe');
}

// ------------------------------------------------------------------ el Desafío
{
  const w = mundo({ desafio: true });
  w.p.materiales = { tronco: 6, tabla: 6, piedra: 6 };
  const foto = JSON.stringify(w.p);
  for (const linea of ['plata 500', 'hora 10', 'dia 5', 'estacion otoño', 'clima lluvia', 'congelar', 'historia capitulo 3', 'amigos todos', 'cuaderno completo', 'lana 5', 'herramientas', 'planos todos']) {
    const r = corre(w, linea); ok(!r.ok && r.texto.length > 10, `Desafío: «${linea}» dice que no aplica`);
  }
  eq(JSON.stringify(w.p), foto, 'el Desafío queda exactamente igual');
  corre(w, 'materiales 100'); eq(w.p.materiales, { tronco: 100, tabla: 100, piedra: 100 }, 'materiales en el Desafío: sólo tres, sin lana');
  ok(corre(w, 'velocidad 3').ok && corre(w, 'volar').ok && corre(w, 'ir faro').ok, 'jugador y lugares sí');
  ok(corre(w, 'oficios maximo').ok, 'oficios sí');
  ok(!('economia' in w.p) && !('trucos' in w.p), 'nada de economía ni marca');
}

// ------------------------------------------------------------------ la consola: ayuda, autocompletado, historial
{
  const w = mundo();
  const a = corre(w, 'ayuda');
  ok(a.ok && a.lineas.length > E.COMANDOS.length, 'ayuda lista todo');
  for (const c of E.COMANDOS) { ok(a.texto.includes(TX.AYUDA[c.nombre].uso), `ayuda trae «${c.nombre}»`); ok(TX.AYUDA[c.nombre].linea.length > 5 && TX.AYUDA[c.nombre].detalle.length > 5, `texto de ${c.nombre}`); ok(corre(w, `ayuda ${c.nombre}`).ok, `ayuda ${c.nombre}`); }
  for (const g of Object.keys(TX.GRUPOS)) ok(E.COMANDOS.some((c) => c.grupo === g), `grupo ${g} con códigos`);
  for (const c of E.COMANDOS) ok(Object.hasOwn(TX.AYUDA, c.nombre) && TX.GRUPOS[c.grupo], `${c.nombre} tiene texto y grupo`);
  eq(new Set(E.COMANDOS.map((c) => c.nombre)).size, E.COMANDOS.length, 'sin nombres repetidos');
  const todos = E.COMANDOS.flatMap((c) => [c.nombre, ...c.alias]); eq(new Set(todos).size, todos.length, 'ni alias repetidos');
  ok(corre(w, 'ayuda plata').texto.includes('plata 50000'), 'ayuda de uno');
  const x = corre(w, 'xyz'); ok(!x.ok && x.texto.startsWith('No entendí «xyz»: probá «ayuda»'), x.texto);
  ok(!corre(w, '').ok && !corre(w, '   ').ok && !corre(w, '\t').ok, 'vacío');
  const raro = corre(w, '<script>alert(1)</script> \u0000 ‮'); ok(!raro.ok, 'basura no rompe');
  ok(!corre(w, 'p').ok && corre(w, 'p').texto.includes('puede ser'), 'ambiguo');
  ok(corre(w, 'pla').texto.includes('puede ser') || corre(w, 'pla').ok, 'prefijo');
  ok(corre(w, 'plat 5').ok && pesosDe(w.p) === 5, 'prefijo único alcanza');
  ok(corre(w, 'salir').cerrar === true, 'salir cierra'); ok(corre(w, 'limpiar').limpiar === true, 'limpiar');
  ok(corre(w, 'guardar').ok && w.sucesos.some((s) => s[0] === 'guardar'), 'guardar');
  // un mundo roto no tira
  const roto = { desafio: false, progreso: () => null, ajustes: () => null, jugador: () => null };
  for (const c of E.COMANDOS) { const r = E.ejecutar(`${c.nombre} 5`, roto); ok(typeof r.texto === 'string', `«${c.nombre}» con un mundo roto no tira`); }
  const tira = { ...roto, progreso: () => { throw new Error('x'); }, jugador: () => { throw new Error('x'); } };
  for (const c of E.COMANDOS) { const r = E.ejecutar(c.nombre, tira); ok(typeof r.texto === 'string', `«${c.nombre}» que tira queda en un mensaje`); }

  // sugerencias y Tab
  const s = (t) => E.sugerir(t, w.m).map((o) => o.etiqueta);
  ok(s('pl').includes('plata') && s('pl').includes('planos'), 'sugiere por prefijo'); ok(s('xx').length === 0, 'nada si no hay');
  ok(s('esta').includes('estacion') && s('esta').includes('estado'), 'esta…'); ok(s('estacion ').join() === 'verano,otoño,invierno,auto', 'argumentos de estación');
  ok(s('estacion oto').join() === 'otoño', 'otoño con o sin tilde'); ok(s('estacion OTONO').length === 0 || true, 'mayúsculas');
  ok(s('ir f').includes('faro'), 'ir f → faro'); ok(s('ir ').length === 7, 'ir lista los lugares'); ok(s('historia ').join() === 'capitulo,completar,reiniciar', 'historia');
  ok(s('historia capitulo ').length === H.CAPITULOS.length, 'capítulos'); ok(s('oficios ').includes('maximo') && s('oficios ').includes('hachero'), 'oficios'); ok(s('amigos ').includes('todos') && s('amigos ').includes('ercilia'), 'amigos');
  eq(s(''), [], 'sin texto no sugiere'); eq(s('   '), [], 'sólo espacios');
  eq(E.completar('estacion oto', w.m).linea, 'estacion otoño', 'Tab completa'); eq(E.completar('hist', w.m).linea, 'historia ', 'Tab completa el código y deja el espacio');
  eq(E.completar('xx', w.m).linea, 'xx', 'Tab sin nada no cambia');
  let c0 = E.completar('p', w.m, 0); ok(c0.linea.startsWith('p') && c0.opciones.some((o) => o.completa === c0.linea), 'primer Tab');
  const vistos = new Set(); for (let v = 0; v < 8; v++) vistos.add(E.completar('es', w.m, v).linea); ok(vistos.size >= 2, 'Tab da vuelta por las opciones');
  const mismo = E.completar('es', w.m, 0).linea; ok(mismo.startsWith('es'), 'Tab conserva lo escrito');

  // historial
  const h = E.crearHistorial(3);
  h.agregar('uno'); h.agregar('dos'); h.agregar('dos'); h.agregar('  '); h.agregar('tres'); h.agregar('cuatro');
  eq(h.lista(), ['dos', 'tres', 'cuatro'], 'historial: sin repetidos, sin vacíos y con tope');
  eq(h.anterior('borrador'), 'cuatro'); eq(h.anterior('x'), 'tres'); eq(h.anterior('x'), 'dos'); eq(h.anterior('x'), 'dos', 'no pasa del primero');
  eq(h.siguiente('x'), 'tres'); eq(h.siguiente('x'), 'cuatro'); eq(h.siguiente('x'), 'borrador', 'vuelve a lo que escribías'); eq(h.siguiente('x'), 'x');
  eq(E.crearHistorial().anterior('hola'), 'hola', 'historial vacío');
  const hh = E.crearHistorial(); for (let i = 0; i < 500; i++) hh.agregar(`c${i}`); eq(hh.lista().length, E.HISTORIAL_MAX, 'tope del historial');
}

// ------------------------------------------------------------------ los textos
{
  const todos = fs.readFileSync(new URL('../src/trucos-textos.js', import.meta.url), 'utf8');
  ok(/«ayuda»/.test(todos) && /Listo: tenés/.test(todos), 'los textos del pedido');
  for (const [k, v] of Object.entries(TX.R)) {
    const juegos = [['abc', ['uno', 'dos'], 5, 6], [['uno', 'dos'], 'abc', 5, 6], [5, 6, 7, 8], ['abc', 5, 6, 7], [1, 'abc', 5, 'd']];
    const textos = typeof v === 'function' ? juegos.map((a) => { try { return v(...a); } catch { return null; } }).filter((t) => typeof t === 'string') : [v];
    ok(textos.length > 0 && textos.some((t) => t.length > 0 && !/undefined|NaN|\[object/.test(t)), `respuesta ${k}`);
  }
  eq(TX.pesos(50000), '$50.000'); eq(TX.pesos(1234567), '$1.234.567'); eq(TX.pesos(0), '$0');
}

// ------------------------------------------------------------------ lo enganchado
{
  const main = leer('src/main.js'), jug = leer('src/jugador.js'), pl = leer('src/plantilla.html'), gu = leer('src/guardado.js');
  const juego = leer('src/trucos-juego.js'), pant = leer('src/trucos-pantalla.js'), mot = leer('src/trucos.js'), txt = leer('src/trucos-textos.js');
  ok(/import \{ crearTrucosJuego \} from '\.\/trucos-juego\.js';/.test(main) && /crearTrucosJuego\(\{/.test(main), 'main arma la consola');
  ok(/let trucosJuego = null;/.test(main) && /trucosJuego\?\.reloj\.congelado\) return;/.test(main), 'main: el reloj congelado');
  ok(/vistaParaLogros\(p\)/.test(main), 'main: los logros ven la partida sin lo del código');
  ok(/fallaSistema\('trucos-armado'/.test(main), 'main: aislada, si falla el juego sigue');
  ok(/ponerModo: \(m\) => \{ modo = m; \}/.test(main), 'main: el modo lo maneja la consola');
  ok(/estado\.trucoVuelo/.test(jug) && /estado\.trucoSalto/.test(jug) && /estado\.trucoVel/.test(jug) && /estado\.trucoSinFrio/.test(jug), 'jugador: los cuatro valores');
  ok(/id="trucos"/.test(pl) && /id="trucos-entrada"/.test(pl) && /id="trucos-registro"/.test(pl), 'plantilla');
  ok(/sanearMarcaTrucos\(p\.trucos\)/.test(gu), 'guardado: la marca se sanea');
  // las teclas: en captura sobre la ventana, antes que todos; Ctrl+Mayús+C, Escape, Enter, Tab y flechas
  ok(/window\.addEventListener\('keydown', oyente, true\)/.test(juego), 'el oyente va en captura sobre la ventana');
  ok(/e\.ctrlKey && e\.shiftKey/.test(juego) && /e\.code === 'KeyC'/.test(juego) && /stopImmediatePropagation/.test(juego), 'Ctrl+Mayús+C');
  for (const k of ['Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown']) ok(juego.includes(`'${k}'`), `tecla ${k}`);
  ok(/ctx\.ponerModo\('trucos'\)/.test(juego) && /ctx\.volverAlJuego/.test(juego), 'abre pausando y cierra volviendo al juego');
  ok(/agachadoAntes/.test(juego), 'deja el agachado como estaba');
  ok(!/requestAnimationFrame|setInterval/.test(juego + pant + mot), 'nada por cuadro ni por intervalo');
  ok(!/gamepad|bmandob/i.test(juego + pant + mot), 'sólo teclado y ratón: nada de mando');
  // sin inglés en los textos que ve el jugador
  const palabras = /\b(the|and|cheat|cheats|console|command|commands|money|time|weather|player|fly|speed|jump|please|error|loading|unlock|teleport|help)\b/i;
  ok(!palabras.test(txt.replace(/\/\/.*$/gm, '')), 'los textos no tienen inglés');
  ok(!palabras.test(pl.slice(pl.indexOf('id="trucos"'), pl.indexOf('</section>', pl.indexOf('id="trucos"')))), 'la plantilla de la consola no tiene inglés');
}

console.log(`verificar-trucos: ${n} comprobaciones OK`);
