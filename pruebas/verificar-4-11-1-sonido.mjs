// 4.11.1 (sonido): lo que se decidió en DECISIONES_DISENO_4_10.md (Q4, Q5, Q7, Q12), EJECUTADO con el AudioContext de mentira
// (pruebas/ayuda-audio-falso.mjs) y con el motor real (sonido.js, gramola.js, huevos-juego.js).
//   · Q4: los pájaros salen por el bus de «El bosque»: con el bosque en 0 no suenan (ni su reverberación); con Efectos en 0, sí.
//   · Q5: adentro de una casa (puerta cerrada) se atenúan como el viento y la lluvia (`aves` en ESPACIOS, los mismos valores que `viento`).
//   · Q7: la gramola sale por el bus de la música: la perilla «Música» y «Solo el bosque» la gobiernan; Efectos y El bosque, no.
//   · Q12: la radio de la madrugada se puede apagar y descarta el audio que llega tarde (apagada, otra cosa pedida o lejos de la radio).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { FakeCtx, nodos } from './ayuda-audio-falso.mjs';

globalThis.window = globalThis;
globalThis.addEventListener = () => {};   // crearHuevosJuego engancha una tecla
const ctx = new FakeCtx();
globalThis.AudioContext = function () { return ctx; };
const { Sonido } = await import('../src/sonido.js');
const { ESPACIOS, espacioDe } = await import('../src/techo-lluvia.js');
const { alternarGramola, detenerGramola } = await import('../src/gramola.js');
const { crearHuevosJuego } = await import('../src/huevos-juego.js');
const H = await import('../src/huevos.js');

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const final = (p) => { const e = p.eventos.filter((x) => x[0] === 'set' || x[0] === 'tgt' || x[0] === 'lin').at(-1); return e ? e[1] : p.value; };
// la ganancia total del mejor camino de `origen` a `meta` (producto de las ganancias del camino; 0 si no llega)
function ganancia(origen, meta) {
  let mejor = 0;
  const ir = (n, g, vistos) => {
    if (n === meta) { mejor = Math.max(mejor, g); return; }
    for (const d of n.sal) {
      if (vistos.has(d)) continue;
      ir(d, g * (d.tipo === 'gain' ? final(d.gain) : 1), new Set([...vistos, d]));
    }
  };
  ir(origen, 1, new Set([origen]));
  return mejor;
}
const nuevo = (mezcla, musicaActiva = true) => {
  const s = new Sonido(); s.musicaActiva = musicaActiva; s.setMezcla(mezcla, {});
  s.iniciar(); while (s.cola.length) s.trabajarCola(1e9);
  return s;
};
const cerca = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
// lo que llegaba a la salida con la gramola por Efectos: su volumen propio (0,9) por el volumen general (0,8)
const MASTER = 0.9 * 0.8;
const POS = { x: 6, y: 1, z: 6 };

// ¿hay camino de `origen` a `meta`?
function llega(origen, meta, vistos = new Set()) {
  if (origen === meta) return true;
  if (vistos.has(origen)) return false;
  vistos.add(origen);
  for (const d of origen.sal) if (llega(d, meta, vistos)) return true;
  return false;
}
// lo que suena de un pájaro: las fuentes que crea `hacer`, su ganancia hasta la salida por el camino seco (pasando por un bus) y por el de la reverberación
function sonidoDe(s, hacer) {
  const n0 = nodos.length;
  hacer(s);
  const fuentes = nodos.slice(n0).filter((n) => n.tipo === 'bufsrc');
  const porBus = (src, bus) => ganancia(src, bus) * ganancia(bus, s.master);
  const seco = Math.max(0, ...fuentes.flatMap((f) => [porBus(f, s.bus.ambiente), porBus(f, s.bus.efectos)]));
  const reverb = Math.max(0, ...fuentes.flatMap((f) => [porBus(f, s.envioReverb), porBus(f, s.envioReverbAmbiente)]));
  return {
    fuentes: fuentes.length, seco, reverb,
    alBosque: fuentes.some((f) => llega(f, s.bus.ambiente)), aEfectos: fuentes.some((f) => llega(f, s.bus.efectos)),
    reverbBosque: fuentes.some((f) => llega(f, s.envioReverbAmbiente)), reverbEfectos: fuentes.some((f) => llega(f, s.envioReverb)),
  };
}
const AVES = ['zorzal', 'rayadito', 'fiofio', 'chucao', 'carpintero', 'cachanas', 'concon', 'ranita', 'ave', 'picaflor', 'bandurrias', 'cisnes', 'martin', 'cauquen'];
const cantar = (nombre) => (s) => { s[nombre](POS); while (s.cola.length) s.trabajarCola(1e9); s[nombre](POS); };

// ---------------------------------------------------------------- Q4: los pájaros van por «El bosque»
{
  for (const ave of AVES) {
    const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
    const r = sonidoDe(s, cantar(ave));
    assert.ok(r.fuentes > 0, ave + ': suena algo');
    assert.ok(r.alBosque && !r.aEfectos, ave + ': sale por el bus del bosque, no por Efectos');
  }
  // el chillido de los murciélagos no es un pájaro: queda con los efectos
  { const s = nuevo({}); const r = sonidoDe(s, cantar('chillido')); assert.ok(r.aEfectos && !r.alBosque, 'el chillido del murciélago sigue por Efectos'); }

  for (const ave of ['zorzal', 'chucao', 'picaflor']) {
    const normal = sonidoDe(nuevo({ ambiente: 1, efectos: 1, musica: 1 }), cantar(ave));
    assert.ok(normal.seco > 0 && normal.reverb > 0, ave + ': con todo al máximo suena, seco y reverb');
    const sinBosque = sonidoDe(nuevo({ ambiente: 0, efectos: 1, musica: 1 }), cantar(ave));
    assert.equal(sinBosque.seco, 0, ave + ': con «El bosque» en 0 no suena');
    assert.equal(sinBosque.reverb, 0, ave + ': ni deja cola de reverberación');
    const sinEfectos = sonidoDe(nuevo({ ambiente: 1, efectos: 0, musica: 1 }), cantar(ave));
    assert.ok(cerca(sinEfectos.seco, normal.seco), ave + ': con Efectos en 0 suena igual');
    assert.ok(cerca(sinEfectos.reverb, normal.reverb), ave + ': y su reverberación también');
    const mitad = sonidoDe(nuevo({ ambiente: 0.5, efectos: 1, musica: 1 }), cantar(ave));
    assert.ok(cerca(mitad.seco / normal.seco, 0.5, 1e-6) && cerca(mitad.reverb / normal.reverb, 0.5, 1e-6), ave + ': la mitad del bosque, la mitad del pájaro');
  }
  // y la mezcla por hora del bosque también los baja (de noche el bosque baja)
  {
    const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
    const a = sonidoDe(s, cantar('zorzal'));
    s.setMezcla({}, { ambiente: 0.5, efectos: 1, musica: 1 });
    const b = sonidoDe(s, cantar('zorzal'));
    assert.ok(cerca(b.seco / a.seco, 0.5, 1e-6) && cerca(b.reverb / a.reverb, 0.5, 1e-6), 'la mezcla por hora del ambiente baja a los pájaros');
  }
  // lo que no es pájaro sigue con Efectos: un sonido posicional cualquiera, con el bosque en 0
  { const s = nuevo({ ambiente: 0, efectos: 1, musica: 1 }); const g = s.fuente(POS, 1, 0.6); assert.ok(ganancia(g, s.master) > 0, 'un hachazo (fuente común) sigue con Efectos'); }
}

// ---------------------------------------------------------------- Q5: adentro de la casa se atenúan
{
  // los valores son los mismos que los del viento en cada espacio
  for (const [nombre, E] of Object.entries(ESPACIOS)) assert.equal(E.aves, E.viento, nombre + ': `aves` vale lo que `viento`');
  assert.equal(espacioDe('adentro').aves, 0.3);
  const afuera = sonidoDe(nuevo({}), cantar('zorzal'));
  for (const [nombre, E] of Object.entries(ESPACIOS)) {
    const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
    s.espacioActual = nombre;
    const r = sonidoDe(s, cantar('zorzal'));
    assert.ok(cerca(r.seco / afuera.seco, E.aves, 1e-6), nombre + ': el pájaro suena ' + E.aves + ' de lo de afuera');
    assert.ok(cerca(r.reverb / afuera.reverb, E.aves, 1e-6), nombre + ': y su reverberación también');
  }
  // el picaflor también
  { const s = nuevo({}); s.espacioActual = 'adentro'; const a = sonidoDe(s, cantar('picaflor')); const b = sonidoDe(nuevo({}), cantar('picaflor')); assert.ok(cerca(a.seco / b.seco, 0.3, 1e-6), 'el picaflor adentro se atenúa'); }
  // salir de la casa devuelve el volumen
  { const s = nuevo({}); s.espacioActual = 'adentro'; sonidoDe(s, cantar('zorzal')); s.espacioActual = 'bosque'; const r = sonidoDe(s, cantar('zorzal')); assert.ok(cerca(r.seco, afuera.seco, 1e-9), 'afuera otra vez, suena entero'); }
  // el motor lo toma del espacio que le pasa el juego en cada cuadro
  const src = leer('src/sonido.js');
  assert.ok(src.includes('this.espacioActual = e.espacio'), 'el motor recuerda el espacio del cuadro');
  assert.ok(/fuenteDeAve\(pos, vol = 1, reverb = 0\.6\) \{\s*return this\.fuente\(pos, vol \* espacioDe\(this\.espacioActual\)\.aves/.test(src), 'los pájaros se multiplican por `aves` del espacio');
}

// ---------------------------------------------------------------- Q7: la gramola es música
{
  const gramola = (mezcla, musicaActiva = true) => {
    const s = nuevo(mezcla, musicaActiva);
    const n0 = nodos.length;
    const r = alternarGramola(s, () => true, 'gramola-1');
    const entrada = nodos.slice(n0).find((n) => n.tipo === 'biquad');
    const g = entrada ? ganancia(entrada, s.master) : null;
    const alBus = nodos.slice(n0).some((n) => n.tipo === 'gain' && ([...n.sal].includes(s.bus.piano) || [...n.sal].includes(s.bus.musica)));
    const aEfectos = nodos.slice(n0).some((n) => n.tipo === 'gain' && [...n.sal].includes(s.bus.efectos));
    detenerGramola();
    return { r, g, alBus, aEfectos };
  };
  const normal = gramola({ ambiente: 1, efectos: 1, musica: 1 });
  assert.ok(normal.r.suena, 'la gramola da cuerda');
  assert.ok(normal.alBus && !normal.aEfectos, 'sale por el bus de la música y no por Efectos');
  assert.ok(cerca(normal.g, MASTER, 1e-9), 'con todo al máximo suena igual que antes (0,9 del volumen propio por 0,8 del general): ' + normal.g);
  assert.equal(gramola({ ambiente: 1, efectos: 1, musica: 0 }).g, 0, 'con Música en 0 no suena');
  assert.ok(cerca(gramola({ ambiente: 1, efectos: 1, musica: 0.5 }).g, MASTER / 2, 1e-9), 'con Música a la mitad, la mitad');
  assert.ok(cerca(gramola({ ambiente: 0, efectos: 0, musica: 1 }).g, MASTER, 1e-9), 'El bosque y Efectos en 0 no la tocan');
  assert.equal(gramola({ ambiente: 1, efectos: 1, musica: 1 }, false).g, 0, '«Solo el bosque» (la música apagada) la calla');
  // y si se apaga la música con la gramola sonando, también
  {
    const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
    const n0 = nodos.length; alternarGramola(s, () => true, 'gramola-2');
    const entrada = nodos.slice(n0).find((n) => n.tipo === 'biquad');
    s.setMusica(false);
    assert.equal(ganancia(entrada, s.master), 0, 'setMusica(false) con la gramola sonando la calla');
    s.setMusica(true);
    assert.ok(cerca(ganancia(entrada, s.master), MASTER, 1e-9), 'y al volver la música, vuelve');
    detenerGramola();
  }
  // la gramola sigue bajando la música de fondo mientras suena (y no se baja a sí misma)
  {
    const s = nuevo({}); alternarGramola(s, () => true, 'gramola-3');
    assert.equal(final(s.bajaMusica.gain), 0.3, 'baja la música de fondo');
    const n = nodos.filter((x) => x.tipo === 'gain' && [...x.sal].includes(s.bus.piano)).at(-1);
    assert.ok(n && !ganancia(n, s.bajaMusica), 'pero no pasa por `bajaMusica`');
    detenerGramola();
  }
}

// ---------------------------------------------------------------- Q12: la radio de la madrugada
{
  // dos noches con emisora y una con tango (la que usamos; el tango tarda más en sintetizarse)
  const noches = []; for (let n = 1; n < 400 && noches.length < 3; n++) if (H.hayEmisoraMadrugada(n)) noches.push(n);
  assert.ok(noches.length >= 3);
  const montar = (opciones = {}) => {
    const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
    const progreso = { dia: noches[0] + 1, horas: 3, huevos: null };
    const jugador = { estado: { pos: { x: 0, z: 0 } } };
    const notas = [];
    const j = crearHuevosJuego({
      progreso: () => progreso, desafio: () => opciones.desafio ?? false, jugador: () => jugador, sonido: s,
      nota: (t, sub) => notas.push(t), diario: () => {}, guardar: () => {},
    });
    return { s, j, progreso, jugador, notas };
  };
  const RADIO = { x: 3, z: 2 };
  // fuentes del tamaño de la radio (16 kHz) que arrancaron
  const sonando = (s) => nodos.filter((n) => n.tipo === 'bufsrc' && n.arrancado && n.buffer && n.buffer.sampleRate === 16000);
  const drenar = (s) => { while (s.cola.length) s.trabajarCola(1e9); };

  // sin apagar: suena, y se puede apagar
  {
    const { s, j } = montar();
    assert.equal(j.radioSuena(), false);
    const n0 = sonando(s).length;
    assert.equal(j.radioMadrugada(RADIO), true, 'esa noche hay emisora');
    assert.equal(j.radioSuena(), true, 'el pedido queda vigente mientras se sintetiza');
    drenar(s);
    const fuentes = sonando(s);
    assert.equal(fuentes.length, n0 + 1, 'llegó la síntesis y suena');
    const f = fuentes.at(-1);
    assert.equal(j.radioSuena(), true);
    assert.ok(ganancia(f, s.bus.efectos) > 0, 'sonando, llega a la salida');
    assert.equal(j.apagarRadio(), true, 'se apaga');
    assert.equal(j.radioSuena(), false);
    assert.ok(f.parada !== undefined && f.parada <= ctx.currentTime + 0.5, 'la fuente se corta');
    assert.equal(ganancia(f, s.bus.efectos), 0, 'con un fundido a cero hacia el bus de efectos');
    assert.equal(j.apagarRadio(), false, 'apagar de nuevo no hace nada');
  }
  // apagada antes de que llegue el audio: el audio atrasado se descarta
  {
    const { s, j } = montar();
    const n0 = sonando(s).length;
    j.radioMadrugada(RADIO);
    assert.ok(s.cola.length > 0, 'la síntesis está en la cola');
    assert.equal(j.apagarRadio(), true);
    drenar(s);
    assert.equal(sonando(s).length, n0, 'llegó tarde y no suena');
    assert.equal(j.radioSuena(), false);
  }
  // te alejaste antes de que llegue: tampoco
  {
    const { s, j, jugador } = montar();
    const n0 = sonando(s).length;
    j.radioMadrugada(RADIO);
    jugador.estado.pos = { x: 80, z: 80 };
    drenar(s);
    assert.equal(sonando(s).length, n0, 'si ya no estás cerca de la radio, el audio atrasado no suena');
  }
  // y si te alejás con la radio sonando, se pierde sola (la revisión de cada 2 s)
  {
    const { s, j, jugador } = montar();
    j.radioMadrugada(RADIO); drenar(s);
    assert.equal(j.radioSuena(), true);
    j.actualizar(2.1);
    assert.equal(j.radioSuena(), true, 'cerca de la radio sigue');
    jugador.estado.pos = { x: 60, z: 0 };
    j.actualizar(2.1);
    assert.equal(j.radioSuena(), false, 'lejos de la radio, se apaga');
  }
  // si empieza el Desafío, también
  {
    let desafio = false;
    const s = nuevo({});
    const progreso = { dia: noches[0] + 1, horas: 3, huevos: null };
    const j = crearHuevosJuego({ progreso: () => progreso, desafio: () => desafio, jugador: () => ({ estado: { pos: { x: 0, z: 0 } } }), sonido: s, nota() {}, diario() {}, guardar() {} });
    j.radioMadrugada(RADIO); drenar(s); assert.equal(j.radioSuena(), true);
    desafio = true; j.actualizar(2.1);
    assert.equal(j.radioSuena(), false, 'en el Desafío la emisora se apaga');
  }
  // un pedido nuevo invalida al anterior (otra noche): el viejo, si llega tarde, no suena
  {
    const { s, j, progreso } = montar();
    const n0 = sonando(s).length;
    j.radioMadrugada(RADIO);                       // pedido 1, todavía en la cola
    progreso.dia = noches[1] + 1;
    j.radioMadrugada(RADIO);                       // pedido 2: anula al 1
    drenar(s);
    assert.equal(sonando(s).length, n0 + 1, 'suena uno solo: el último');
  }
  // y un pedido nuevo corta al que ya suena (otra noche, con el primero sonando)
  {
    const { s, j, progreso } = montar();
    j.radioMadrugada(RADIO); drenar(s);
    const primera = sonando(s).at(-1);
    assert.ok(primera && primera.parada === undefined, 'la primera suena');
    progreso.dia = noches[1] + 1;
    j.radioMadrugada(RADIO);
    assert.ok(primera.parada !== undefined, 'al pedir otra emisora, la que sonaba se corta');
    drenar(s);
    assert.equal(ganancia(primera, s.bus.efectos), 0, 'y se fue a cero');
  }
  // sin posición de la radio (como la llaman las pruebas viejas), no se mide la distancia
  {
    const { s, j, jugador } = montar();
    const n0 = sonando(s).length;
    j.radioMadrugada();
    jugador.estado.pos = { x: 500, z: 500 };
    drenar(s);
    assert.equal(sonando(s).length, n0 + 1, 'sin posición, suena como siempre');
    j.actualizar(2.1);
    assert.equal(j.radioSuena(), true);
  }
  // el enganche en main.js: con la emisora sonando, la E la apaga y el aviso lo dice; pasa después de mandar el pedido y antes de pescar otra
  {
    const m = leer('src/main.js');
    const i1 = m.indexOf('cumplirPedido(r, progreso.materiales');
    const i2 = m.indexOf('huevosJuego?.radioSuena?.()) { huevosJuego.apagarRadio()');
    const i3 = m.indexOf('huevosJuego?.radioMadrugada({ x: o.datos.x, z: o.datos.z })');
    assert.ok(i1 > 0 && i2 > i1 && i3 > i2, 'main.js: E apaga la emisora (después del pedido, antes de pescar otra)');
    assert.ok(m.includes("if (huevosJuego?.radioSuena?.()) return 'Apagar la radio';"), 'main.js: el aviso dice «Apagar la radio» mientras suena');
  }
}

console.log('verificar-4-11-1-sonido: ok');
process.exit(0);
