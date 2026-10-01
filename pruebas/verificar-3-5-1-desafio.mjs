// 3.5.1 — auditoría del Desafío: lo que se arregló y no tiene que volver.
// Lo puro se prueba de verdad; lo que vive en el mundo (three, DOM) se mira en el texto,
// como las demás pruebas del Desafío. La partida real está en `humo-3-5-1-desafio.cjs`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ASEDIO, asedioNuevo, danarAncla } from '../src/desafio-asedio.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const des = leer('src/desafio.js');
const nave = leer('src/desafio-nave-mundo.js');
const arsenal = leer('src/desafio-arsenal-mundo.js');
const fortin = leer('src/desafio-fortin-mundo.js');
const aliados = leer('src/desafio-aliados.js');
const puestos = leer('src/desafio-puestos-mundo.js');
const main = leer('src/main.js');
let grupos = 0;
const ok = (t) => { grupos++; console.log('✓', t); };
const tiene = (txt, trozo, msg) => assert.ok(txt.includes(trozo), msg || trozo);
// el cuerpo de una función (hasta la siguiente de su mismo nivel)
const cuerpo = (txt, firma) => { const i = txt.indexOf(firma); assert.ok(i >= 0, `falta ${firma}`); const j = txt.indexOf('\n  function ', i + firma.length); return txt.slice(i, j < 0 ? undefined : j); };

// ---------------------------------------------------------------- la nodriza y el final
{
  const largar = des.slice(des.indexOf('largarDesde: (x, z) => {'), des.indexOf('alDerrotarNodriza:'));
  assert.ok(!/empezarOleada\(/.test(largar), 'las tandas de la nodriza no van a la cola de la nave escondida (no bajaban nunca)');
  tiene(largar, "aparecerEn(t, x + Math.cos(an) * r, z + Math.sin(an) * r)", 'bajan ahí mismo');
  tiene(largar, "a.estado = 'bajar'", 'flotando desde la nodriza');
  tiene(largar, 'nocheActual.invasores += n', 'y cuentan para la noche');
  const horario = cuerpo(des, 'function revisarHorario()');
  assert.match(horario, /!d\.oleadaTerminada && d\.nodriza && !d\.victoria && !d\.asedio && !eventos\.nodrizaActiva\) \{[^}]*eventos\.iniciarNodriza\(\)/,
    'guardada en la noche final sin invasores vivos, la nodriza vuelve al abrir');
  tiene(des, 'if (D().asedio?.ganado && !D().victoria) vencer({ nave: true });', 'cerrado mientras caía la nave: la victoria llega al abrir');
  tiene(des, 'if (!caido && !naveMundo.adentro) revisarHorario();', 'adentro de la nave no arranca la noche (día de reloj real)');
  ok('nodriza: las tandas bajan, vuelve al abrir, la victoria no se pierde');
}

// ---------------------------------------------------------------- los invasores
{
  const inv = cuerpo(des, 'function invocar(tipo, x, z)');
  assert.match(inv, /const nx0 = estadoNave\.x, nz0 = estadoNave\.z;[\s\S]*bajarAlien\(tipo\);\s*estadoNave\.x = nx0; estadoNave\.z = nz0;/, 'invocar no corre la nave para siempre');
  const bajar = cuerpo(des, 'function bajarAlien(tipo)');
  for (const campo of ['a.tLod = 0', 'a.faseAla = 0', 'a.tAleteo = 0']) tiene(bajar, campo, `reciclado sin ${campo.split(' ')[0]} viejo`);
  tiene(des, "if ((T.agua(nx, nz) && !T.agua(p.x, p.z)) || Math.abs(nx) > LIMITE", 'el que está en el agua puede salir');
  tiene(des, "{ const s = T.altura(p.x, p.z); if (p.y > s + 0.05) p.y = Math.max(s, p.y - dt * 9); }", 'el que muere en el aire cae');
  tiene(des, 'empujados.add(aliens[i]); empujados.add(aliens[j]);', 'se anotan los empujados');
  assert.match(des, /for \(const al of empujados\) \{[\s\S]{0,200}col\.resolver\(al\.m\.g\.position/, 'el empujón entre invasores no los mete en las paredes');
  tiene(des, 'if (!a.enNave) soltarCristales(a.m.g.position, sueltos);', 'las crías de la nave no son una mina de cristal');
  ok('invasores: nave quieta, reciclado limpio, agua, caída, empujón, crías');
}

// ---------------------------------------------------------------- el jugador
{
  const herir = cuerpo(des, 'function herirJugador(n, desde)');
  tiene(herir, 'if (!d.oleadaTerminada) terminarOleada(false);', 'caer de día no cierra otra vez la noche');
  tiene(herir, 'if (bloqueando) bloquear(false);', 'caído se baja el escudo');
  assert.match(des, /function cambioDeArma\(\) \{[^\n]*if \(bloqueando\) bloquear\(false\);/, 'cambiar de arma baja el escudo');
  tiene(main, "desafio?.cambioDeArma?.();   // 3.5.1", 'abrir los planos corta la ráfaga');
  ok('jugador: el escudo se baja, caer de día no es perder la noche');
}

// ---------------------------------------------------------------- arsenal y fortín
{
  const est = cuerpo(arsenal, 'function estallar(c, arma)');
  assert.match(est, /for \(const n of \(api\.blancos\?\.\(\) \|\| \[\]\)\.slice\(\)\)[\s\S]*api\.herirBlanco\?\.\(n, dano\)/, 'la granada le llega al nido, puestos, agujas y la Madre');
  tiene(des, 'api.herirBlanco = (n, dano) => eventos.herirNucleo(n, dano);');
  tiene(arsenal, 'const y = api.alturaSuelo?.(pos.x, pos.z) ?? T.altura(pos.x, pos.z);', 'lo tirado adentro de la nave queda en su piso');
  assert.match(arsenal, /for \(let k = 1; k < n; k\+\+\) \{[\s\S]{0,200}api\.obraEnPunto\?\.\(sx, T\.altura\(sx, sz\) \+ 1, sz\)/, 'el arpón revisa las paredes en tramos cortos');
  tiene(fortin, 'if (o.datos.helada && invierno() <= 0.5) o.datos.helada = false;', 'pasado el invierno el hielo se derrite');
  tiene(fortin, 'const k = Math.max(0, Math.min(1, vida / max));', 'los abrojos devuelven lo que queda de ellos');
  ok('arsenal y fortín: granada, piso de la nave, arpón, hielo, abrojos');
}

// ---------------------------------------------------------------- aliados y puestos
{
  const perro = cuerpo(aliados, 'function objetivoPerro(');
  tiene(perro, 'if (a.enNave) continue;', 'el perro no muerde las crías de la nave desde el valle');
  tiene(aliados, "if (a.enNave || a.estado === 'dormido') continue;", 'Ema tampoco les tira (ni a los dormidos)');
  tiene(aliados, 'npc.ruta[0].mirar = { x: ap.x, z: ap.z };', 'Ema mira una copia, no al invasor reciclado');
  tiene(puestos, "if (!g.contado && g.a.puesto === p.id && g.a.estado !== 'dormido') { g.contado = true; p.guardias = Math.max(0, p.guardias - 1); }", 'la guardia de un puesto no vuelve entera');
  ok('aliados y puestos');
}

// ---------------------------------------------------------------- adentro de la nave
{
  const entrada = cuerpo(nave, 'function hacerEntrada()');
  tiene(entrada, 'o.globo.visible = o.pupila.visible = true; o.herida.visible = false;', 'al volver a subir, los ojos están enteros');
  tiene(entrada, 'p.nucleo.visible = true;', 'y los pilares');
  tiene(entrada, 'p.columna.scale.y = 1; p.columna.position.y = 4;');
  tiene(cuerpo(nave, 'function limpiar()'), 'setTargetAtTime(1, sonido.ctx.currentTime, 0.4)', 'el ambiente vuelve al limpiar adentro');
  tiene(nave, "(document.getElementById('hud') || document.body).appendChild(hud);", 'la barra de la Madre se esconde con el HUD');
  tiene(nave, 'const sobreElHaz = ', 'la partida guardada adentro vuelve al valle aunque el sitio sea alto');
  ok('nave: reabordaje, sonido, barra, guardado');
}

// ---------------------------------------------------------------- el asedio con menos zonas
{
  const dos = asedioNuevo([{ id: 'base', x: 0, z: 40 }, { id: 'lago', x: -150, z: 90 }], { x: 10, z: 20 }, 100);
  assert.equal(danarAncla(dos, 0, 999).abrePaso, false);
  const r = danarAncla(dos, 1, 999);
  assert.equal(r.abrePaso, true, 'con dos zonas, la segunda abre el haz y se avisa');
  const cuatro = asedioNuevo([{ id: 'base', x: 0, z: 40 }, { id: 'estacion', x: 200, z: 0 }, { id: 'lago', x: -150, z: 90 }, { id: 'bosque', x: 60, z: -220 }], { x: 0, z: 0 }, 100);
  const avisos = [0, 1, 2, 3].map((i) => danarAncla(cuatro, i, 999).abrePaso);
  assert.deepEqual(avisos, [false, false, true, false], 'con cuatro, sólo la tercera');
  assert.equal(ASEDIO.zonasParaAbordar, 3);
  ok('asedio: el aviso del haz con menos de tres zonas');
}

console.log(`verificar-3-5-1-desafio: ok · ${grupos} grupos`);
