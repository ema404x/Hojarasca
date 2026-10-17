// 4.0.3: la aldea y sus vecinos (zona E de la 2.ª ronda). Ejecuta los módulos de verdad:
//  · E1: la noche de estrellas no se lleva a los músicos de la peña, ni a los parroquianos, ni a la moza y la bailarina; con lluvia o nieve no sale;
//  · E2: `invitar()` no acepta a quien está en su cumpleaños o sentado en la cantina (decía que sí y a los 0,5 s la cita se cancelaba);
//  · E3: las fiestas no llevan al predio al chico que estudia afuera ni al poblador que espera en el andén.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const A = await import('../src/aldea.js');
const V = await import('../src/vecindad.js');
const C = await import('../src/calendario.js');
const F = await import('../src/fiestas.js');
const FJ = await import('../src/fiestas-juego.js');
const NJ = await import('../src/noticias-juego.js');

const aldeaCompleta = () => {
  const a0 = A.aldeaNueva(); a0.descubierta = 1;
  a0.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  a0.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  a0.cercanos = ['padre', 'madre', 'jefe', 'carpintero', 'herrero'];
  return A.sanearAldea(a0);
};
const aldea = aldeaCompleta();

// ------------------------------------------------------------ E1
{
  let sabados = 0, conMusicos = 0, conParroquianos = 0, conMoza = 0, conMozaClub = 0;
  for (let d = 1; d <= 400; d++) {
    if (A.diaSemanaDe(d) === C.NOCHE_ESTRELLAS.diaSemana) {
      sabados++;
      const van = C.asistentes('estrellas', d, aldea);
      if (van.includes('musico') || van.includes('herrero')) conMusicos++;
      if (van.some((k) => A.enLaCantinaDe(aldea, k, A.nocheDeCantina(d, 22), 22))) conParroquianos++;
      if (van.includes('moza') || van.includes('bailarina')) conMoza++;
      ok(van.length >= 4 && new Set(van).size === van.length, `día ${d}: siguen yendo vecinos (${van.length}), sin repetidos`);
    }
    if (A.diaSemanaDe(d) === C.CLUB_LECTURA.diaSemana) { const van = C.asistentes('club', d, aldea); if (van.includes('moza') || van.includes('bailarina')) conMozaClub++; }
  }
  ok(sabados > 40, `${sabados} sábados mirados`);
  ok(conMusicos === 0, `la noche de estrellas no se lleva al músico ni al herrero (${conMusicos} sábados de ${sabados})`);
  ok(conParroquianos === 0, `ni a los parroquianos de la cantina (${conParroquianos})`);
  ok(conMoza === 0 && conMozaClub === 0, `ni la moza ni la bailarina, ni para el club (${conMoza} y ${conMozaClub})`);
  // el reparto del mundo (lo que usa aldea-gente) con cielo despejado y con lluvia
  let diaE = null;
  for (let d = 1; d <= 60 && !diaE; d++) if (C.hayEstrellas(d, aldea, (x) => F.fechaDe(x))) diaE = d;
  ok(diaE !== null, 'hay un día de estrellas sin fiesta');
  const P = { dia: diaE, horas: 22, aldea, entradas: {}, noticias: null, modo: 'relax' };
  const hacer = (clima) => NJ.crearNoticiasJuego({ progreso: () => P, ajustes: () => ({}), desafio: () => false, nota() {}, guardar() {}, registrar() {}, pronostico: () => [], cartaVieja: () => false, concursos: () => null, redibujar() {}, clima: () => clima });
  const sol = hacer({ lluvia: 0, invierno: 0, viento: 0, nublado: 0 }), lluvia = hacer({ lluvia: 0.8, invierno: 0, viento: 0, nublado: 0.8 }), nieve = hacer({ lluvia: 0.8, invierno: 1, viento: 0, nublado: 0.8 });
  ok(!!sol.destino('astronoma') && sol.destino('astronoma').lugar === 'estrellas', 'con cielo despejado Valentina sale a la plaza');
  ok(lluvia.destino('astronoma') === null && nieve.destino('astronoma') === null, 'con lluvia o nieve no sale (antes se quedaban los 8 bajo el agua)');
  const algunoVa = A.ORDEN_PERSONAS_ALDEA.some((k) => sol.destino(k)?.lugar === 'estrellas');
  const nadie = A.ORDEN_PERSONAS_ALDEA.every((k) => lluvia.destino(k) === null);
  ok(algunoVa && nadie, 'y con lluvia nadie va a la plaza');
}

// ------------------------------------------------------------ E2
{
  let probados = 0, ocupados = 0, mal = 0;
  for (let d = 1; d <= 24; d++) {
    const f = A.fiestaDeCumple(d, aldea);
    if (!f) continue;
    for (const k of f.claves) {
      const P = { dia: d, horas: 18.5, aldea, vecindad: V.vecindadNueva() };
      for (let q = 0; q < 5; q++) V.sumarAmistadDe(P, k, 10, d);
      const ds = A.diaSemanaDe(d);
      const libre = V.estaLibre(k, 18.5, ds, P);
      const r = V.invitar(k, 'mate', P, 18.5, { dia: d, diaSemana: ds });
      probados++;
      if (!libre) { ocupados++; if (r.ok) mal++; }
    }
  }
  ok(probados >= 5 && ocupados >= 3, `cumpleaños probados: ${probados} (${ocupados} con el festejado ocupado)`);
  ok(mal === 0, `invitar no acepta al que está en su cumpleaños (${mal} aceptados de ${ocupados} ocupados)`);
  let cantina = 0, malCantina = 0;
  for (let d = 2; d <= 8; d++) {
    const ds = A.diaSemanaDe(d);
    for (const p of A.parroquianosDeLaNoche(aldea, d).filter((x) => x.llega <= 20.75).slice(0, 3)) {
      const P = { dia: d, horas: 20.9, aldea, vecindad: V.vecindadNueva() };
      const libre = V.estaLibre(p.clave, 20.9, ds, P);
      const r = V.invitar(p.clave, 'mate', P, 20.9, { dia: d, diaSemana: ds });
      if (!libre) { cantina++; if (r.ok) malCantina++; }
    }
  }
  ok(cantina >= 3, `parroquianos probados: ${cantina}`);
  ok(malCantina === 0, `invitar no acepta al que ya está sentado en la cantina (${malCantina} de ${cantina})`);
  // y a un vecino libre lo sigue aceptando
  const P = { dia: 3, horas: 10.5, aldea, vecindad: V.vecindadNueva() };
  let acepta = 0;
  for (const k of A.ORDEN_PERSONAS_ALDEA) if (V.estaLibre(k, 10.5, A.diaSemanaDe(3), P) && V.invitar(k, 'mate', { ...P, vecindad: V.vecindadNueva() }, 10.5, { dia: 3, diaSemana: A.diaSemanaDe(3) }).ok) acepta++;
  ok(acepta >= 1, `a la mañana, los vecinos libres siguen aceptando (${acepta})`);
}

// ------------------------------------------------------------ E3
{
  const dia = 28;   // Día de la Aldea (el día 4 del año 3)
  ok(F.fechaDe(dia)?.id, 'hay fiesta ese día');
  const al = aldeaCompleta();
  al.chicos.nene = { ...al.chicos.nene, etapa: 3, estudia: dia + 3, afuera: true, carrera: null, oficio: null, desde: 1, dia: dia - 1 };
  al.llegando = { clave: 'carpintero', dia: dia - 1 };
  al.pobladores = al.pobladores.filter((p) => p.clave !== 'carpintero');
  const P = { dia, horas: 13, aldea: al, entradas: {}, materiales: {}, cosas: {}, modo: 'relax' };
  const personas = new Map([...A.ORDEN_PERSONAS_ALDEA, 'carpintero'].map((k) => [k, {}]));
  const crear = (ausente) => FJ.crearFiestasJuego({ progreso: () => P, desafio: () => false, jugador: () => null, aldeaGente: () => ({ personas }), mundo: () => null, nota() {}, guardar() {}, refrescarBarra() {}, sonido: () => null, alClic() {}, traducir: (s) => s, alAbrirPanel() {}, ausente });
  const sin = crear(undefined), con = crear((k) => A.chicoAfuera(P.aldea, k) || P.aldea?.llegando?.clave === k);
  ok(!!sin.destino('nene')?.punto, 'sin el filtro (antes) el chico que estudia afuera iba a la mesa del predio');
  ok(!!sin.destino('carpintero')?.punto, 'y el que espera en el andén, también');
  ok(con.destino('nene') === null, 'ahora el que estudia afuera no va');
  ok(con.destino('carpintero') === null, 'ni el que espera en el andén');
  ok(!!con.destino('jefe')?.punto && !!con.destino('madre')?.punto, 'y los demás siguen yendo a la fiesta');
  const m = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  ok(m.includes('ausente: (k) => chicoAfuera(progreso.aldea, k) || progreso.aldea?.llegando?.clave === k,'), 'main.js le pasa a las fiestas quién no está');
  ok(m.includes('clima: climaVecindad,   // 4.0.3: la noche de estrellas mira el cielo'), 'main.js le pasa el clima a las noticias');
}
console.log(`OK 4.0.3 aldea · ${n} verificaciones · estrellas sin músicos ni parroquianos y con cielo, invitar con el día, fiestas sin los ausentes`);
