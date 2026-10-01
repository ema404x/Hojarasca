// 3.0 — el asedio final de varias noches y la pelea adentro de la nave nodriza.
// Lo puro (reglas del asedio y de la Madre), lo que se guarda, y el cableado con el resto
// del Desafío (que no se puede importar en Node: se mira el texto).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  ASEDIO, ZONAS_ASEDIO, defZona, asedioNuevo, sanearAsedio, asedioActivo, zonasLibres, zonasTomadas, capasEscudo,
  puedeAbordar, debilidadNave, danarAncla, elegirContraataque, desgastarBaliza, cerrarNocheAsedio, tocaGuardia,
  guardianesDe, ganarAsedio, textoAsedio, marcasAsedio, ubicarZonas, ubicarNave,
} from '../src/desafio-asedio.js';
import {
  NAVE, FASES_NAVE, naveNueva, indiceFase, puntosActivos, herirPunto, avanzarNave, criasDeFase, fraccionNave,
  textoNave, tocaOnda, tocaPua, dentroDeArena, fueraDelCuerpo,
} from '../src/desafio-nave.js';
import { sanearDesafio, desafioNuevo, TIPOS_ALIEN, NOCHE_FINAL } from '../src/desafio-reglas.js';
import { marcasAutomaticas } from '../src/chinches.js';
import { seccionesGuia } from '../src/guia.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let grupos = 0;
const ok = (t) => { grupos++; console.log('✓', t); };

// ---------------------------------------------------------------- nacer y sanear
const ZONAS = [{ id: 'base', x: 0, z: 40 }, { id: 'estacion', x: 200, z: 0 }, { id: 'lago', x: -150, z: 90 }, { id: 'bosque', x: 60, z: -220 }];
{
  assert.equal(asedioNuevo(null, { x: 0, z: 0 }), null, 'sin zonas no hay asedio');
  assert.equal(asedioNuevo(ZONAS, null), null, 'sin lugar para la nave, tampoco');
  const a = asedioNuevo([...ZONAS, { id: 'marte', x: 1, z: 1 }, { id: 'lago', x: 'x', z: 1 }], { x: 10, z: 20 }, 600);
  assert.equal(a.zonas.length, 4, 'ids desconocidos o sin coordenadas no entran');
  assert.ok(a.zonas.every((z) => z.estado === 'tomada' && z.vida === 600 && z.vidaMax === 600));
  assert.equal(capasEscudo(a), 4);
  assert.equal(puedeAbordar(a), false);
  assert.equal(asedioActivo(a), true);
  assert.equal(ZONAS_ASEDIO.length, 4);
  for (const z of ZONAS_ASEDIO) for (const t of z.guardianes) assert.ok(Object.hasOwn(TIPOS_ALIEN, t), `guardián desconocido: ${t}`);
  assert.equal(defZona('lago').corto, 'el lago');
  assert.equal(defZona('toString'), null, 'búsqueda por nombre sin heredados');

  assert.equal(sanearAsedio(null), null);
  assert.equal(sanearAsedio('basura'), null);
  assert.equal(sanearAsedio({ zonas: [{ id: 'lago', x: 1, z: 2 }] }), null, 'sin la nave no hay asedio');
  const s = sanearAsedio({
    nave: { x: '5', z: 6 }, contra: 1, noches: -3, abordajes: 'dos',
    zonas: [{ id: 'lago', x: 1, z: 2, estado: 'recuperada', baliza: 9e9 }, { id: 'lago', x: 9, z: 9 }, { id: 'bosque', x: 3, z: 4, estado: 'raro', vida: -5 }, { id: 'nada', x: 0, z: 0 }],
  });
  assert.deepEqual(s.nave, { x: 5, z: 6 });
  assert.equal(s.zonas.length, 2, 'sin repetidos ni zonas inventadas');
  assert.equal(s.zonas[0].baliza, ASEDIO.vidaBaliza, 'la baliza se acota');
  assert.equal(s.zonas[1].estado, 'tomada', 'estado roto → tomada');
  assert.equal(s.zonas[1].vida, 1, 'la aguja nunca queda con vida 0 estando en pie');
  assert.equal(s.contra, null, 'el contraataque sólo apunta a una zona recuperada');
  assert.equal(s.noches, 0); assert.equal(s.abordajes, 0);
  // viaja en la partida
  assert.equal(desafioNuevo().asedio, null, 'una partida nueva no tiene asedio');
  assert.equal(sanearDesafio({}).asedio, null, 'una partida vieja carga sin asedio');
  const guardada = JSON.parse(JSON.stringify(sanearDesafio({ asedio: a })));
  assert.deepEqual(sanearDesafio(guardada).asedio, sanearAsedio(a), 'ida y vuelta por el guardado');
  ok('nacer y sanear: zonas válidas, valores rotos a su lugar, viaja en la partida');
}

// ---------------------------------------------------------------- recuperar zonas
{
  const a = asedioNuevo(ZONAS, { x: 0, z: 0 }, 100);
  assert.equal(danarAncla(a, 0, 50, false).ok, false, 'de noche la aguja está cerrada');
  assert.equal(a.zonas[0].vida, 100);
  assert.equal(danarAncla(a, 9, 50, true).ok, false);
  assert.deepEqual(danarAncla(a, 0, 60, true), { ok: true, rota: false });
  const r = danarAncla(a, 0, 60, true);
  assert.equal(r.rota, true); assert.equal(r.zona, 'base');
  assert.equal(a.zonas[0].estado, 'recuperada');
  assert.equal(a.zonas[0].baliza, ASEDIO.vidaBaliza, 'se planta la baliza');
  assert.equal(capasEscudo(a), 3, 'el escudo pierde una capa');
  assert.equal(danarAncla(a, 0, 60, true).ok, false, 'rota no se vuelve a romper');
  danarAncla(a, 1, 999, true);
  assert.equal(puedeAbordar(a), false, 'con dos libres todavía no');
  const tercera = danarAncla(a, 2, 999, true);
  assert.equal(tercera.abrePaso, true, 'la tercera abre el haz');
  assert.equal(puedeAbordar(a), true);
  assert.equal(debilidadNave(a), 0);
  danarAncla(a, 3, 999, true);
  assert.equal(debilidadNave(a), 1, 'con las cuatro, la Madre llega más débil');
  assert.equal(zonasLibres(a), 4); assert.equal(zonasTomadas(a), 0);
  ok('de día se rompen las agujas; cada una saca una capa; con tres se abre el haz');
}

// ---------------------------------------------------------------- el contraataque
{
  const a = asedioNuevo(ZONAS, { x: 0, z: 0 }, 100);
  assert.equal(elegirContraataque(a), null, 'sin zonas recuperadas, la noche es la de siempre');
  danarAncla(a, 2, 999, true);
  danarAncla(a, 1, 999, true);
  assert.equal(elegirContraataque(a), 1, 'van por la última recuperada');
  assert.equal(a.contra, 1);
  assert.equal(desgastarBaliza(a, 0, 1).cayo, false);
  // caíste esa noche: la zona sigue recuperada (se defiende de nuevo)
  assert.deepEqual(cerrarNocheAsedio(a, false), { asegurada: null });
  assert.equal(a.zonas[1].estado, 'recuperada');
  assert.equal(a.contra, null);
  // la noche siguiente aguanta: asegurada
  assert.equal(elegirContraataque(a), 1);
  desgastarBaliza(a, 4, 10);
  assert.ok(a.zonas[1].baliza < ASEDIO.vidaBaliza && a.zonas[1].baliza > 0);
  assert.deepEqual(cerrarNocheAsedio(a, true), { asegurada: 'estacion' });
  assert.equal(a.zonas[1].estado, 'asegurada');
  assert.equal(a.noches, 1);
  // la otra: la baliza cae y la aguja vuelve a crecer, a la mitad
  assert.equal(elegirContraataque(a), 2);
  let cayo = null;
  for (let i = 0; i < 4000 && !cayo; i++) { const r = desgastarBaliza(a, 13, 0.1); if (r.cayo) cayo = r; }
  assert.ok(cayo, 'una oleada entera tira la baliza');
  assert.equal(a.zonas[2].estado, 'tomada');
  assert.equal(a.zonas[2].vida, Math.round(100 * ASEDIO.rebrote));
  assert.equal(a.contra, null, 'sin baliza, los invasores vuelven a buscarte a vos');
  assert.equal(capasEscudo(a), 3);
  assert.deepEqual(cerrarNocheAsedio(a, true), { asegurada: null });
  // la guardia sale una vez por día y sólo cerca
  assert.equal(tocaGuardia(a, 0, 5, ASEDIO.cercaGuardia + 1), false);
  assert.equal(tocaGuardia(a, 0, 5, 10), true);
  a.zonas[0].guardia = 5;
  assert.equal(tocaGuardia(a, 0, 5, 10), false, 'el mismo día no vuelve a salir');
  assert.equal(tocaGuardia(a, 0, 6, 10), true);
  assert.equal(tocaGuardia(a, 1, 6, 10), false, 'una zona asegurada no tiene guardia');
  assert.ok(guardianesDe('estacion', 2).length > guardianesDe('estacion', 0).length, 'cuantas más perdieron, más cuidan');
  assert.deepEqual(guardianesDe('marte'), []);
  ok('el contraataque: aguanta → asegurada; cae → la aguja rebrota; si caés, se vuelve a defender');
}

// ---------------------------------------------------------------- textos, mapa, final
{
  const a = asedioNuevo(ZONAS, { x: 7, z: 8 }, 100);
  assert.match(textoAsedio(a), /0\/4 zonas libres · escudo 4/);
  danarAncla(a, 0, 999, true); danarAncla(a, 1, 999, true); danarAncla(a, 2, 999, true);
  assert.match(textoAsedio(a), /haz de la nave está abierto/);
  elegirContraataque(a);
  assert.match(textoAsedio(a), /defendé la baliza de el lago \(100%\)/);
  const m = marcasAsedio(a);
  assert.equal(m.length, 5, 'cuatro zonas y la nave');
  assert.ok(m.some((q) => q.estado === 'nave' && q.x === 7));
  const auto = marcasAutomaticas({ desafio: { asedio: { marcas: () => m } } });
  assert.equal(auto.length, 5, 'el mapa las dibuja');
  assert.ok(auto.every((q) => q.clase === 'asedio'));
  assert.equal(marcasAutomaticas({ desafio: {} }).length, 0, 'sin asedio, nada nuevo en el mapa');
  assert.equal(ganarAsedio(a), true);
  assert.equal(asedioActivo(a), false);
  assert.equal(textoAsedio(a), '');
  assert.deepEqual(marcasAsedio(a), []);
  assert.ok(a.zonas.every((z) => z.estado !== 'recuperada'));
  assert.equal(danarAncla(a, 3, 999, true).ok, false, 'ganado, ya no hay agujas');
  ok('HUD, mapa y final del asedio');
}

// ---------------------------------------------------------------- dónde va cada cosa
{
  let n = 0;
  const azar = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
  const lugares = { estacion: { x: 250, z: 20 }, muelle: { x: -200, z: 150 }, arrayanes: { x: 80, z: -260 } };
  const zonas = ubicarZonas(lugares, { x: 0, z: 0 }, (x, z) => Math.abs(x) < 400 && Math.abs(z) < 400, azar);
  assert.deepEqual(zonas.map((z) => z.id), ['base', 'estacion', 'lago', 'bosque']);
  for (const z of zonas) for (const q of zonas) if (z !== q) assert.ok(Math.hypot(z.x - q.x, z.z - q.z) >= ASEDIO.distanciaEntreZonas, 'zonas separadas');
  const base = zonas[0];
  assert.ok(Math.hypot(base.x, base.z) >= 38 && Math.hypot(base.x, base.z) <= 58, 'la de la base, alrededor de la base');
  assert.ok(Math.hypot(zonas[1].x - 250, zonas[1].z - 20) <= 34, 'la estación, cerca de la estación');
  // un mapa sin lago: igual hay zona, lejos de la base
  const sinLago = ubicarZonas({ estacion: { x: 250, z: 20 } }, { x: 0, z: 0 }, () => true, azar);
  assert.equal(sinLago.length, 4);
  assert.ok(Math.hypot(sinLago[2].x, sinLago[2].z) >= 149, "sin lago, lejos de la base");
  // si nada sirve, no inventa lugares
  assert.deepEqual(ubicarZonas(lugares, { x: 0, z: 0 }, () => false, azar), []);
  // la nave se asienta en el llano
  const nave = ubicarNave({ x: 100, z: 100 }, (x, z) => (x < 0 ? 0.05 : 0.3), azar);
  assert.ok(nave && nave.x < 0, 'elige el llano');
  assert.equal(ubicarNave({ x: 0, z: 0 }, () => Infinity, azar), null);
  ok('zonas separadas, cerca de su lugar (o lejos de la base si el mapa no lo tiene); la nave en un llano');
}

// ---------------------------------------------------------------- la Madre
{
  const n = naveNueva();
  assert.equal(n.fase, 'ojos');
  assert.deepEqual(puntosActivos(n).map((p) => p.tipo), ['ojo', 'ojo', 'ojo']);
  assert.equal(herirPunto(n, 'pilar', 0, 50).ok, false, 'los pilares todavía no');
  assert.equal(herirPunto(n, 'corazon', 0, 50).ok, false, 'el corazón está tapado');
  assert.equal(fraccionNave(n), 1);
  for (let i = 0; i < 2; i++) assert.equal(herirPunto(n, 'ojo', i, 9999).roto, true);
  assert.equal(herirPunto(n, 'ojo', 0, 10).ok, false, 'un ojo reventado no recibe');
  const f2 = herirPunto(n, 'ojo', 2, 9999);
  assert.equal(f2.fase, 'pilares');
  assert.equal(n.fase, 'pilares');
  assert.equal(puntosActivos(n).length, NAVE.pilares);
  assert.equal(herirPunto(n, 'corazon', 0, 50).ok, false, 'con el escudo, al corazón no le entra');
  for (let i = 0; i < NAVE.pilares - 1; i++) herirPunto(n, 'pilar', i, 9999);
  assert.equal(herirPunto(n, 'pilar', NAVE.pilares - 1, 9999).fase, 'corazon');
  assert.deepEqual(puntosActivos(n), [{ tipo: 'corazon', i: 0 }]);
  assert.ok(fraccionNave(n) > 0 && fraccionNave(n) < 0.5);
  assert.match(textoNave(n), /Fase 3/);
  assert.equal(herirPunto(n, 'corazon', 0, n.corazon - 1).roto, false);
  assert.equal(herirPunto(n, 'corazon', 0, 5).ganada, true);
  assert.equal(n.ganada, true);
  assert.deepEqual(puntosActivos(n), []);
  assert.equal(herirPunto(n, 'corazon', 0, 5).ok, false, 'ganada, no hay más');
  // la dificultad y la debilidad del asedio
  assert.ok(naveNueva({ vida: 1.25 }).corazon > naveNueva({ vida: 0.8 }).corazon);
  assert.equal(naveNueva({ debilidad: 1 }).ojos.filter((v) => v > 0).length, 2, 'con las cuatro zonas, un ojo menos');
  assert.equal(naveNueva({ debilidad: 9 }).ojos.filter((v) => v > 0).length, 1, 'siempre queda un ojo');
  assert.deepEqual(FASES_NAVE, ['ojos', 'pilares', 'corazon']);
  ok('la Madre: ojos → pilares → corazón, cada fase frena lo que todavía no toca');
}
{
  // lo que hace en cada fase
  const n = naveNueva();
  const hechos = [], vistos = new Set();
  for (let i = 0; i < 800; i++) for (const h of avanzarNave(n, 0.05, { crias: 0 }, hechos)) vistos.add(h);
  assert.ok(vistos.has('disparo') && vistos.has('llamar'));
  assert.ok(!vistos.has('onda') && !vistos.has('pua'), 'en la primera fase no hay ondas ni púas');
  const lleno = naveNueva(); let llamo = false;
  for (let i = 0; i < 800; i++) if (avanzarNave(lleno, 0.05, { crias: NAVE.maxCrias[0] }, hechos).includes('llamar')) llamo = true;
  assert.equal(llamo, false, 'con las crías al tope no llama más');
  n.ojos = n.ojos.map(() => 0); n.fase = 'pilares';
  vistos.clear();
  for (let i = 0; i < 800; i++) for (const h of avanzarNave(n, 0.05, {}, hechos)) vistos.add(h);
  assert.ok(vistos.has('onda') && vistos.has('pua'), 'en la segunda, ondas y púas');
  assert.equal(indiceFase(n), 1);
  assert.deepEqual(criasDeFase(n), NAVE.crias[1]);
  for (const f of NAVE.crias) for (const t of f) assert.ok(Object.hasOwn(TIPOS_ALIEN, t));
  assert.deepEqual(avanzarNave(null, 1), []);
  // esquivar
  assert.equal(tocaOnda(10, 10.2, 0), true, 'la onda te pega en el piso');
  assert.equal(tocaOnda(10, 10.2, 0.6), false, 'saltando se pasa');
  assert.equal(tocaOnda(10, 13, 0), false);
  assert.equal(tocaPua({ x: 0, z: 0 }, 0.5, 0.5), true);
  assert.equal(tocaPua({ x: 0, z: 0 }, 3, 0), false, 'saliendo de donde brilla, se esquiva');
  const d = dentroDeArena(NAVE.radioArena + 5, 0);
  assert.equal(d.afuera, true); assert.ok(d.dx < NAVE.radioArena);
  const c = fueraDelCuerpo(1, 0);
  assert.equal(c.adentro, true); assert.ok(c.dx >= NAVE.radioCuerpo);
  ok('ataques por fase, tope de crías, ondas que se saltan y púas que se esquivan');
}

// ---------------------------------------------------------------- el cableado
{
  const desafio = leer('src/desafio.js'), main = leer('src/main.js'), reglas = leer('src/desafio-reglas.js'), meteo = leer('src/meteo.js');
  const asedioM = leer('src/desafio-asedio-mundo.js'), naveM = leer('src/desafio-nave-mundo.js');
  // los módulos puros no tocan three ni el DOM, y los identificadores exportados no llevan eñe
  for (const f of ['src/desafio-asedio.js', 'src/desafio-nave.js']) {
    const t = leer(f);
    assert.ok(!/from 'three'|document\.|window\./.test(t), `${f} tiene que ser puro`);
  }
  for (const f of ['src/desafio-asedio.js', 'src/desafio-nave.js', 'src/desafio-asedio-mundo.js', 'src/desafio-nave-mundo.js']) {
    const t = leer(f);
    for (const m of t.matchAll(/^export (?:const|function|let) ([^\s(=]+)/gm)) assert.ok(/^[\w$]+$/.test(m[1]), `${f}: ${m[1]} no puede llevar eñe`);
    // armar.mjs: importaciones de una línea, sin `export ... from`, sin async/generadores exportados
    for (const l of t.split('\n').filter((x) => x.startsWith('import '))) assert.match(l, /^import (\{ [^}]+ \}|\* as \w+) from '[^']+';$/, `${f}: import raro: ${l}`);
    assert.ok(!/export \{[^}]*\} from|export async function|export function\*/.test(t), `${f}: export que armar.mjs no entiende`);
    assert.ok(!/OctahedronGeometry|ShapeGeometry|DodecahedronGeometry/.test(t), `${f}: geometría que el three local no trae`);
  }
  assert.match(reglas, /asedio: sanearAsedio\(x\.asedio\)/, 'el asedio se guarda');
  // la noche final sigue igual; el asedio la reemplaza sólo si amanece con la nodriza arriba
  assert.match(desafio, /!d\.asedio && d\.oleadas \+ 1 >= NOCHE_FINAL/, 'en el asedio no vuelve la noche final');
  assert.match(desafio, /asedioMundo\.alTerminarNoche\(sobrevivida\)/);
  assert.match(asedioM, /if \(!d\.victoria && d\.nodriza && d\.oleadas >= NOCHE_FINAL\) return empezar\(\);/, 'el asedio arranca al alba de la noche final sin victoria');
  assert.match(asedioM, /d\.nodriza = null;/, 'los núcleos se repliegan: la nodriza vieja no vuelve');
  assert.match(desafio, /api\.alGanarNave = \(\) => asedioMundo\.derribar\(\(\) => vencer\(\{ nave: true \}\)\)/, 'ganar adentro es la victoria de siempre (y abre el nido)');
  assert.match(desafio, /abrirSegundoActo\(\);/);
  assert.match(main, /s\?\.nave \? 'La nave cayó desde adentro'/, 'la pantalla de victoria lo cuenta');
  assert.match(main, /final \? 'El nido cayó'/);
  assert.match(meteo, /!d\.asedio && n >= NOCHE_FINAL/, 'la estación no anuncia la nodriza en el asedio');
  // los invasores del pool: el campo nuevo se limpia al reciclar
  assert.match(desafio, /a\.enNave = false; a\.guardiaAsedio = false;/);
  assert.match(desafio, /if \(a\.enNave\) return naveMundo\.actualizarAlien\(a, dt, js\);/);
  // blancos por el mismo camino que los núcleos y el nido
  assert.match(desafio, /eventos\.blancos = \(\) => \(naveMundo\.adentro \? naveMundo\.blancos\(\) : asedioMundo\.blancos\(blancosDelValle\(\)\)\)/);
  assert.match(desafio, /if \(!c\.nido && !c\.asedio\) continue;/, 'a la aguja y a la Madre se les entra también a hachazos');
  // la baliza del contraataque se gasta como el lugar de un vecino
  assert.match(desafio, /\(blancoVarada\(\) \|\| asedioMundo\.blancoNoche\(\)\)/);
  assert.match(desafio, /asedioMundo\.desgastar\(n, dt, multLugar\)/);
  // adentro de la nave el suelo es el piso de la nave (proyectiles, rayo, cristales, partículas)
  assert.equal((desafio.match(/alturaSuelo\(/g) || []).length >= 4, true);
  assert.match(desafio, /efectos\.actualizar\(dt, naveMundo\.adentro \? naveMundo\.pisoT : T\)/);
  // si caés adentro, la nave te escupe (no hay caída ni soft-lock)
  assert.match(desafio, /if \(naveMundo\.adentro && naveMundo\.alCaerAdentro\(\)\) return;/);
  // E: el mismo orden en la tecla y en el aviso
  const usar = /usarCercaDe: \(pos, dPuerta\) => (.+),\n/.exec(desafio)[1].split('||').map((s) => s.trim().replace(/\(.*$/, ''));
  const aviso = /avisoCercaDe: \(pos, dPuerta\) => (.+),\n/.exec(desafio)[1].split('||').map((s) => s.trim().replace(/\(.*$/, ''));
  assert.deepEqual(usar.slice(0, 2), ['naveMundo.usarCerca', 'asedioMundo.usarCerca']);
  assert.deepEqual(aviso.slice(0, 2), ['naveMundo.avisoCerca', 'asedioMundo.avisoCerca']);
  assert.equal(usar.length, aviso.length, 'la tecla E y el aviso ofrecen lo mismo');
  // al pie del haz, si no se puede subir, el aviso y E dicen por qué (lo mismo, del mismo lugar)
  assert.match(asedioM, /function motivoHaz\(pos = null\)/);
  for (const t of ['Hay invasores cerca: despejá la zona para subir', 'De noche el haz está apagado', 'el haz se apagó hasta mañana', 'El escudo no deja subir']) assert.ok(asedioM.includes(t), `falta el motivo: ${t}`);
  assert.match(asedioM, /function usarCerca\(pos\) \{\n    if \(!enElHaz\(pos\)\) return false;\n    const m = motivoHaz\(pos\);/);
  assert.match(asedioM, /function avisoCerca\(pos\) \{\n    if \(!enElHaz\(pos\)\) return null;\n    const m = motivoHaz\(pos\);/);
  assert.match(asedioM, /function hazAbierto\(\) \{ return !motivoHaz\(\); \}/, 'el haz visible y la tecla usan la misma regla');
  // adentro: se esconde el valle, se congela el reloj y se vuelve afuera si se guardó adentro
  assert.match(naveM, /function ocultarValle\(\)/);
  assert.match(naveM, /if \(hora\) api\.fijarHora\?\.\(hora\.h, hora\.dia\);/);
  assert.match(naveM, /js\.pos\.y > T\.altura\(js\.pos\.x, js\.pos\.z\) \+ 250/, 'una partida guardada adentro vuelve al valle');
  // guía y pistas
  const titulos = seccionesGuia('desafio').flatMap((s) => s.items.map((i) => i[0]));
  for (const t of ['El asedio', 'Recuperar zonas', 'Adentro de la nave']) assert.ok(titulos.includes(t), `la guía no explica: ${t}`);
  for (const p of ['p-asedio', 'p-haz']) assert.ok(main.includes(`id: '${p}'`), `falta la pista ${p}`);
  assert.equal(NOCHE_FINAL, 20);
  ok('cableado: guardado, noche final, pool, blancos, contraataque, piso de adentro, E y aviso, guía');
}

console.log(`\n3.0 asedio y nave: ${grupos} grupos de pruebas en verde`);
