// 4.10.3 (sonido): lo que arregla el pase de bugs de sonido, EJECUTADO con un AudioContext de mentira
// (pruebas/ayuda-audio-falso.mjs: se porta como Chrome: tira RangeError donde Chrome lo hace).
//   · Q1: la reverberación sigue la perilla de su bus: con Música o Efectos en 0 no queda cola de sala.
//   · Q3: los buses nacen con la mezcla del jugador (antes los primeros 0 a 4 s ignoraban los deslizadores).
//   · Q6: setMezcla sin «hora» (los botones de Ajustes en la pausa) no pierde la mezcla por hora.
//   · Q2: tras una pausa larga la música de la cantina, de las fiestas y del baile descarta lo atrasado.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { FakeCtx, nodos } from './ayuda-audio-falso.mjs';

globalThis.window = globalThis;
const ctx = new FakeCtx();
globalThis.AudioContext = function () { return ctx; };
const { Sonido } = await import('../src/sonido.js');
const { empezarMelodia, seguirMelodia } = await import('../src/personal-musica.js');

// valor al que va a parar un parámetro (el último que se le pidió)
const final = (p) => { const e = p.eventos.filter((x) => x[0] === 'set' || x[0] === 'tgt' || x[0] === 'lin').at(-1); return e ? e[1] : p.value; };
// la ganancia total del mejor camino de `origen` a `meta` (producto de las ganancias del camino; 0 si no llega)
function ganancia(origen, meta) {
  let mejor = 0;
  const ir = (n, g, vistos) => {
    if (n === meta) { mejor = Math.max(mejor, g); return; }
    for (const d of n.sal) {
      if (vistos.has(d)) continue;
      const k = d.tipo === 'gain' ? final(d.gain) : 1;
      ir(d, g * k, new Set([...vistos, d]));
    }
  };
  ir(origen, 1, new Set([origen]));
  return mejor;
}
const nuevo = (mezcla, musicaActiva = true) => {
  const s = new Sonido(); s.musicaActiva = musicaActiva; s.setMezcla(mezcla, {});   // como sincronizarAjustes al cargar: todavía sin ctx
  s.iniciar(); while (s.cola.length) s.trabajarCola(1e9);
  return s;
};

// ---------------------------------------------------------------- Q3: la mezcla guardada vale desde el primer instante
{
  const s = nuevo({ ambiente: 0.2, efectos: 0.1, musica: 0.3 });
  assert.equal(s.bus.ambiente.gain.value, 0.2, 'El bosque al crear el contexto');
  assert.equal(s.bus.techo.gain.value, 0.2, 'el techo es ambiente');
  assert.equal(s.bus.efectos.gain.value, 0.1, 'Efectos al crear el contexto');
  assert.ok(Math.abs(s.bus.musica.gain.value - 0.15) < 1e-9, 'Música (0,5 de base) al crear el contexto');
  assert.ok(Math.abs(s.bus.piano.gain.value - 0.15) < 1e-9, 'el piano sigue la música');
  // y con todo al máximo queda igual que antes (música 0,5; envíos 0,5)
  const t = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
  assert.equal(t.bus.musica.gain.value, 0.5); assert.equal(t.bus.efectos.gain.value, 1); assert.equal(t.envioReverb.gain.value, 0.5); assert.equal(t.envioReverbMusica.gain.value, 0.5);
  // «Solo el bosque»: la música nace muda
  assert.equal(nuevo({ musica: 1 }, false).bus.musica.gain.value, 0);
}

// ---------------------------------------------------------------- Q1: la reverberación no se salta los volúmenes
{
  const medir = (conf) => {
    const s = nuevo(conf);
    const g = s.fuente({ x: 5, y: 1, z: 5 }, 1, 0.6);
    const n0 = nodos.length; s.frase(0.2, null);
    const destino = nodos.slice(n0).find((n) => n.tipo === 'gain' && [...n.sal].includes(s.bus.musica));
    const mel = empezarMelodia(s, 'refugio');
    return { efectos: ganancia(g, s.master), frase: ganancia(destino, s.master), tocadiscos: mel ? ganancia(mel.destino, s.master) : null };
  };
  const normal = medir({ ambiente: 1, efectos: 1, musica: 1 });
  assert.ok(normal.efectos > 0 && normal.frase > 0 && normal.tocadiscos > 0, 'con todo al máximo la reverb suena: ' + JSON.stringify(normal));
  const sinMusica = medir({ ambiente: 1, efectos: 1, musica: 0 });
  assert.equal(sinMusica.frase, 0, 'Música en 0: la frase no deja cola de reverb');
  assert.equal(sinMusica.tocadiscos, 0, 'Música en 0: el tocadiscos tampoco');
  assert.ok(sinMusica.efectos > 0, 'Música en 0 no toca los efectos');
  const sinEfectos = medir({ ambiente: 1, efectos: 0, musica: 1 });
  assert.equal(sinEfectos.efectos, 0, 'Efectos en 0: un sonido posicional no deja cola de reverb');
  assert.ok(sinEfectos.frase > 0, 'Efectos en 0 no toca la música');
  // la mitad de Música baja la reverb a la mitad, como baja el seco
  const mitad = medir({ ambiente: 1, efectos: 1, musica: 0.5 });
  assert.ok(Math.abs(mitad.frase / normal.frase - 0.5) < 1e-9, 'Música 0,5: la reverb baja como el seco');
  // «Solo el bosque» (setMusica(false)) la corta
  const s = nuevo({ musica: 1 }); s.setMusica(false);
  assert.equal(final(s.envioReverbMusica.gain), 0, 'setMusica(false) corta el envío de la música');
  s.setMusica(true); assert.equal(final(s.envioReverbMusica.gain), 0.5);
  // la lluvia del techo (ambiente) no depende de Efectos
  const t = nuevo({ ambiente: 1, efectos: 0, musica: 1 });
  assert.ok(ganancia(t.bus.techo, t.master) > 0, 'Efectos en 0 no apaga el techo');
  assert.equal(nuevo({ ambiente: 0, efectos: 1, musica: 1 }).bus.techo.gain.value, 0);
}

// ---------------------------------------------------------------- Q6: setMezcla sin «hora» conserva la última
{
  const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
  s.setMezcla({}, { ambiente: 0.82, efectos: 0.9, musica: 1.22 });
  assert.ok(Math.abs(final(s.bus.ambiente.gain) - 0.82) < 1e-9);
  s.setMezcla({ ambiente: 0.5, efectos: 0.5, musica: 0.5 });   // un botón de Ajustes en la pausa: sin «hora»
  assert.ok(Math.abs(final(s.bus.ambiente.gain) - 0.41) < 1e-9, 'sigue la hora de antes: 0,5 · 0,82');
  assert.ok(Math.abs(final(s.bus.efectos.gain) - 0.45) < 1e-9);
  assert.ok(Math.abs(final(s.bus.musica.gain) - 0.5 * 0.5 * 1.22) < 1e-9);
}

// ---------------------------------------------------------------- Q2: lo atrasado por una pausa se descarta
{
  const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
  // el baile / tocadiscos: seguirMelodia
  const mel = empezarMelodia(s, 'refugio');
  assert.ok(mel, 'hay melodía del refugio');
  for (let i = 0; i < 40; i++) { ctx.avanzar(0.1); seguirMelodia(s, mel); }   // suena normal
  ctx.avanzar(30, 0.5);                                                      // pausa larga: nadie llama a seguirMelodia
  const n0 = nodos.length;
  seguirMelodia(s, mel);
  const juntas = nodos.slice(n0).filter((x) => x.esFuente && x.arrancado && x.t0 <= ctx.currentTime + 0.01).length;
  assert.ok(juntas <= 4, 'al volver de una pausa larga no arranca un racimo de notas juntas (' + juntas + ')');
}
{
  // la cantina: la función `sonar` del código, con un sonido de mentira que cuenta las pulsadas
  const fuente = fs.readFileSync(new URL('../src/cantina-ambiente.js', import.meta.url), 'utf8');
  const i0 = fuente.indexOf('  function sonar(s, vol) {'), i1 = fuente.indexOf('\n  }\n', i0);
  assert.ok(i0 > 0 && i1 > i0, 'la cantina tiene sonar()');
  const musica = { destino: null, t0: 0, paso: 0, hasta: 32, pausa: 0 };
  const info = { notas: 0 };
  const dest = { gain: { setTargetAtTime() {} }, connect() {} };
  const pulsadas = [];
  const s = {
    ctx: { currentTime: 100, createGain: () => ({ gain: { value: 0 }, connect() {} }) }, bus: { musica: {} },
    pulsar: (m, o) => { pulsadas.push(o.cuando); return true; },
  };
  const sonar = new Function('musica', 'info', 'CORCHEA', 'ACORDES', 'PATRON', 'callar', `${fuente.slice(i0, i1 + 4)}\n return sonar;`)(
    musica, info, 0.46, [[45, 52, 57, 60, 64], [43, 50, 55, 59, 62], [41, 48, 53, 57, 60], [40, 47, 52, 56, 59]], [0, 2, 3, 1, 3, 2, 4, 2], () => {});
  musica.destino = dest; musica.t0 = 100.2;
  for (let t = 100; t < 105; t += 0.1) { s.ctx.currentTime = t; sonar(s, 0.4); }
  const antes = pulsadas.length; pulsadas.length = 0;
  assert.ok(antes >= 8, 'la cantina toca normalmente (' + antes + ')');
  s.ctx.currentTime = 117;   // 12 s de pausa
  sonar(s, 0.4);
  assert.ok(pulsadas.length <= 4, 'la cantina no larga un racimo al volver de la pausa (' + pulsadas.length + ')');
}
{
  // las fiestas: el código descarta lo atrasado antes de tocar el evento (el lazo es de una clausura con el mundo; se mira que la guarda esté donde va)
  const fuente = fs.readFileSync(new URL('../src/fiestas-mundo.js', import.meta.url), 'utf8');
  const l = fuente.split('\n');
  const i = l.findIndex((x) => x.includes('const e = m.ev.eventos[m.i++];'));
  assert.ok(i > 0, 'las fiestas recorren los eventos');
  assert.ok(/m\.t0 \+ e\.cuando < ahora - 0\.25\) continue/.test(l[i + 1]), 'las fiestas descartan lo atrasado más de 0,25 s antes de tocar');
  assert.ok(l[i + 2].includes('tocarEvento('));
}

// ---------------------------------------------------------------- Q11: una receta que tira no traba la cola
{
  const s = nuevo({ ambiente: 1, efectos: 1, musica: 1 });
  let llego = null;
  function* rota() { yield; throw new Error('receta rota'); }
  function* buena() { yield; return new Float32Array(480).fill(0.1); }
  s.preparar('rota-q11', rota);
  s.preparar('buena-q11', buena, (b) => { llego = b; });
  while (s.cola.length) s.trabajarCola(1e9);
  assert.ok(llego, 'la receta buena de atrás se sintetiza igual');
  assert.ok(!s.pendientes.has('rota-q11'), 'y la rota no queda pendiente');
}

console.log('verificar-4-10-3-sonido: ok');
process.exit(0);
