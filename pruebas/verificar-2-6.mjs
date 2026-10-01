// 2.6: el fortín del Desafío, en Node. Las reglas puras (desafio-fortin.js), las piezas
// en los planos, y que el juego las tenga enganchadas.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as F from '../src/desafio-fortin.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const casi = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

// ---------------------------------------------------------------- 1. reglas
{
  assert.equal(F.pasaPorTronera(1.3), true); assert.equal(F.pasaPorTronera(0.5), false); assert.equal(F.pasaPorTronera(1.9), false);
  assert.equal(F.factorPared({}), 1);
  casi(F.factorPared({ apuntalada: true }), 0.7); casi(F.factorPared({ helada: true }), 0.6); casi(F.factorPared({ apuntalada: true, helada: true }), 0.42);
  assert.equal(F.heladaActiva({ helada: true }, 1), true); assert.equal(F.heladaActiva({ helada: true }, 0), false, 'se derrite fuera del invierno');
  // resina: de día se carga con un tronco, de noche se vuelca
  const d = {};
  assert.equal(F.usarResina(d, { noche: false, troncos: 0 }).accion, 'sinLena');
  assert.deepEqual(F.usarResina(d, { noche: false, troncos: 3 }), { accion: 'cargar', troncos: 1 }); assert.equal(d.resina, 2);
  assert.equal(F.usarResina(d, { noche: false, troncos: 3 }).accion, 'llena');
  assert.deepEqual(F.usarResina(d, { noche: true }), { accion: 'volcar', quedan: 1 });
  F.usarResina(d, { noche: true });
  assert.equal(F.usarResina(d, { noche: true }).accion, 'vacia');
  assert.equal(F.avisoResina({ resina: 0 }, { noche: true }), null, 'de noche y vacía no se ofrece');
  assert.match(F.avisoResina({ resina: 0 }, { noche: false }), /Cargar/);
  // catapulta: el grupo más apretado, entre el mínimo y el alcance
  const o = { x: 0, z: 0 };
  const b = F.blancoCatapulta(o, [{ x: 5, z: 0 }, { x: 30, z: 0 }, { x: 31, z: 1 }, { x: 29, z: -1 }, { x: 20, z: 10 }]);
  assert.ok(b && Math.abs(b.x - 30) <= 1.5, 'va al grupo de tres, no al que está cerca ni al suelto');
  assert.equal(F.blancoCatapulta(o, [{ x: 5, z: 0 }, { x: 60, z: 0 }]), null, 'muy cerca o muy lejos, no tira');
  const t = F.tiroParabolico(30, 0);
  casi(t.horizontal * t.tiempo, 30, 1e-6);
  casi(t.vertical * t.tiempo - 0.5 * 9.8 * t.tiempo * t.tiempo, 0, 1e-6);
  // espejo: el haz
  assert.equal(F.enElHaz({ x: 0, z: 0 }, 0, { x: 0, z: 10 }), true);
  assert.equal(F.enElHaz({ x: 0, z: 0 }, 0, { x: 10, z: 10 }), false, 'de costado no');
  assert.equal(F.enElHaz({ x: 0, z: 0 }, 0, { x: 0, z: 40 }), false, 'muy lejos no');
  assert.ok(Math.abs(F.rumboEspejo(0, 3.5) - 0) <= F.FORTIN.espejo.barrido + 1e-9, 'barre dentro de lo previsto');
  // embudo
  assert.ok(F.destinoEmbudo(2, 6), 'delante de la boca, va a la garganta'); assert.equal(F.destinoEmbudo(5, 3), null, 'fuera de la V no lo encauza (lo metía contra el ala)'); assert.equal(F.destinoEmbudo(0, -2), null, 'adentro ya no'); assert.equal(F.destinoEmbudo(0, 30), null, 'lejos no');
  // rampa
  const r = {};
  assert.deepEqual(F.usarRampa(r, { troncos: 2 }), { accion: 'cargar', pone: 2, lista: false });
  assert.deepEqual(F.usarRampa(r, { troncos: 5 }), { accion: 'cargar', pone: 1, lista: true });
  assert.deepEqual(F.usarRampa(r, { troncos: 5 }), { accion: 'soltar', troncos: 3 }); assert.equal(r.troncos, 0);
  assert.equal(F.usarRampa(r, { troncos: 0 }).accion, 'sinTroncos');
  // armero: hasta los topes, con lo que haya
  const tengo = { tabla: 10, piedra: 10 };
  const a = F.recargaArmero({ flechas: 3, virotes: 0, boleadoras: 6 }, { arco: 1, ballesta: 1, boleadoras: 1 }, (k) => tengo[k] || 0);
  assert.equal(a.hecho.flechas, 21, 'hasta 24'); assert.equal(a.hecho.virotes, 12); assert.equal(a.hecho.boleadoras, undefined, 'las boleadoras ya estaban llenas');
  assert.ok((a.gasto.tabla || 0) <= 10 && (a.gasto.piedra || 0) <= 10, 'no gasta lo que no hay');
  assert.equal(F.recargaArmero({ flechas: 0 }, {}, () => 99).algo, false, 'sin armas no hace nada');
  const pobre = F.recargaArmero({ flechas: 0 }, { arco: 1 }, () => 0);
  assert.equal(pobre.algo, false, 'sin materiales no hace nada');
  // saneo
  assert.deepEqual(F.sanearDatosFortin({ resina: 9, piedras: -2, troncos: 'x', bajado: 1, armada: 0 }), { resina: 2, piedras: 0, troncos: 0, bajado: true, armada: false });
}

// ---------------------------------------------------------------- 2. las piezas en los planos
{
  const c = leer('src/construccion.js');
  const piezas = ['muro-tronera', 'catapulta', 'troncos-colgantes', 'cerco-cristal', 'puente-levadizo', 'espejo-faro', 'senuelo', 'trampa-lazo', 'abrojos', 'embudo', 'tejado-lajas', 'puesto-tirador', 'pasarela-colgante', 'rampa-troncos', 'armero', 'contrafuerte'];
  for (const id of piezas) {
    const m = new RegExp(`id: '${id}', nombre: '[^']+', pieza: true, soloDesafio: true, categoria: 'defensa'[\\s\\S]*?defensa: \\{ tipo: '([a-z-]+)'`).exec(c);
    assert.ok(m, `la pieza ${id}, del Desafío, con su defensa`);
  }
  // los tipos que usa el mundo existen en las piezas
  const mundo = leer('src/desafio-fortin-mundo.js');
  for (const t of ['catapulta', 'troncos', 'cerco-cristal', 'puente', 'espejo', 'senuelo', 'lazo', 'abrojos', 'embudo', 'tejado', 'puesto', 'rampa', 'armero', 'contrafuerte']) {
    assert.ok(c.includes(`defensa: { tipo: '${t}'`), `hay una pieza de tipo ${t}`);
    assert.ok(mundo.includes(`'${t}'`) || mundo.includes(`L.${t}`), `el mundo sabe de ${t}`);
  }
  assert.ok(!/OctahedronGeometry/.test(c), 'el runtime de three local no trae OctahedronGeometry');
  assert.match(c, /soloArriba: 1\.85,/, 'los tiros pasan por debajo del adarve');
  assert.match(c, /vida: 700, cubreOtras: true,/, 'bajo el tejado de lajas se pueden poner antorchas');
}

// ---------------------------------------------------------------- 3. enganchado en el juego
{
  const des = leer('src/desafio.js');
  assert.match(des, /fortin = crearFortinMundo\(T, escena, col, obras, efectos, sonido, api, defensas\);/);
  assert.match(des, /function obraEnPunto\(x, y, z, margen = 0\.05, ignorar = null, tiroPropio = false\)/);
  assert.match(des, /if \(tiroPropio && fortin\?\.pasaTiro\(o, y - base\)\) continue;/, 'tus tiros por las troneras');
  assert.match(des, /const o = obraEnPunto\(x, y, z, -0\.02, q\.ignorar, q\.deJugador\);/, 'los proyectiles lo saben');
  assert.match(des, /n \*= defensas\.factorDanoObra\(o\) \* fortin\.factorDanoObra\(o\);/, 'contrafuerte y hielo');
  assert.match(des, /if \(fortin\.impideSalto\(o\)\) return false;/, 'la pirca helada no se trepa');
  assert.match(des, /!frenaAlExcavador\(enMedio\) && !fortin\.frenaExcavador\(enMedio\)/, 'el excavador y el contrafuerte');
  assert.match(des, /dano \*= fortin\.multiplicadorDano\(a\);/, 'colgado recibe más');
  assert.match(des, /if \(quietoArsenal \|\| ef\.quieto\) \{/, 'el fortín actúa aunque el arsenal lo tenga quieto');
  assert.match(des, /!fortin\.antorchaProtegida\(o\)/, 'el volador no alcanza la antorcha bajo el tejado');
  const tiene = (txt, trozo, msg) => assert.ok(txt.includes(trozo), msg || trozo);
  tiene(des, 'fortin.usarCerca(pos, deNoche(), dPuerta)', 'E en el fortín, sin ganarle a la puerta más cercana');
  // la revisión de la 2.6
  tiene(des, 'if (fortin?.sinCuerpo(o) || fortin?.debajo(o, y - base)) continue;', 'bajo el tejado te pegan; el lazo no frena tus flechas');
  tiene(des, 'if (fortin?.debajo(o, a.m.g.position.y - base + 0.4)) continue;', 'y no rompen el tejado para pasar por abajo');
  tiene(des, 'if (a.colgadoT > 0) { a.colgadoT = 0;', 'el que muere colgado cae');
  {
    const mu = leer('src/desafio-fortin-mundo.js'), cc = leer('src/construccion.js');
    tiene(mu, "const enTierra = (a, T) => a.estado !== 'bajar'", 'la catapulta no le tira a los que bajan de la nave');
    tiene(mu, 'col.eliminarPorDuenio?.(o.userPuente.duenio)', 'el puente roto no deja una pared invisible');
    tiene(mu, 'if (u.donde !== donde)', 'el puente movido se vuelve a registrar');
    tiene(mu, '!gastados.includes(o)', 'una sola nota por abrojos gastados');
    tiene(mu, 'function chocaTronco(', 'los troncos que ruedan chocan con árboles y piedras');
    tiene(mu, 'recargaArmero(api.D(), api.cosas()', 'el armero sólo se ofrece si puede hacer algo');
    tiene(cc, "defensa: { tipo: 'lazo', sinCuerpo: true }"); tiene(cc, "defensa: { tipo: 'troncos', sinCuerpo: true }");
  }
  // el reciclado de invasores
  assert.match(des, /a\.congeladoT = 0; a\.mordido = 0; a\.enFoso = null;/, 'el congelado y la mordida no pasan a la vida siguiente');
  assert.match(des, /a\.fuegoT = 0; a\.tLlama = 0; a\.dudaT = 0; a\.confusoT = 0;/, 'ni el fuego, la duda o el humo');
  assert.match(des, /a\.colgadoT = 0; a\.encandilado = 0; a\.tCerco = 0;/, 'ni el lazo o el espejo');
  assert.match(leer('src/desafio-aliados.js'), /const puesto = orden === 'base' \? api\.puestoTirador\?\.\(\) : null;/, 'Ema se aposta');
  assert.match(leer('src/main.js'), /!!obras\.tieneFuncionCerca\('armero', jugador\.estado\.pos, 5\.2\)/, 'el armero cuenta como banco');
}

console.log(`2.6: el fortín · 16 piezas, resina y hielo · catapulta a ${F.FORTIN.catapulta.minimo}-${F.FORTIN.catapulta.alcance} m`);
