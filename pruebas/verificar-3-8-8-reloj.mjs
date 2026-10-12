// 3.8.8: el aviso del próximo vecino, el reloj y el almanaque, en Node.
//   · el aviso de lo que falta para que llegue el próximo vecino (aldea.js: avisoProximoVecino);
//   · los textos del reloj de la plaza y del almanaque de la biblioteca, y la línea del HUD del reloj de bolsillo y del
//     almanaque de pared (reloj-almanaque.js);
//   · los dos cambios del almacén y sus anotaciones del cuaderno;
//   · las dos mecánicas (con E) y que existan los puntos en la plaza y la biblioteca;
//   · el cableado de main.js y la plantilla, y el inglés.
import assert from 'assert/strict';
import fs from 'fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const A = await import('../src/aldea.js');
const R = await import('../src/reloj-almanaque.js');
const MC = await import('../src/aldea-mecanicas.js');
const { TRUEQUES, TRUEQUE, tieneYa } = await import('../src/trueque.js');
const { ENTRADAS } = await import('../src/cuaderno.js');
const { crearTraductor } = await import('../src/idioma.js');
const { EN } = await import('../src/idioma-en.js');
const { armarEdificio } = await import('../src/aldea-arquitectura.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

const partida = (extra = {}) => {
  const p = { modo: 'relax', dia: 6, horas: 10, materiales: {}, entradas: {}, cosas: {}, aldea: A.aldeaNueva(), ...extra };
  p.aldea.pobladores.push({ clave: 'carpintero', dia: 5 });
  p.aldea.locales = { carpinteria: 6 };
  p.aldea.ultimaApertura = 6;
  return p;
};
const anotar = (p, k) => { for (let i = 0; i < k; i++) p.entradas['e' + i] = { cantidad: 1 }; return p; };

// ============================================================ 1. el aviso del próximo vecino
{
  // el día que abre un local, con el cuaderno vacío: se dice lo que falta (y no «viene en unos días»)
  let av = A.avisoProximoVecino(partida());
  ok(av && !av.listo, 'hay aviso');
  ok(/faltan 14 anotaciones/.test(av.titulo), `dice cuántas anotaciones faltan: ${av.titulo}`);
  ok(/cuaderno/.test(av.texto) && av.texto.includes('Ayelén Catriel'), 'dice dónde anotar y quién viene');
  av = A.avisoProximoVecino(anotar(partida(), 13));
  ok(/falta 1 anotación$/.test(av.titulo), `en singular: ${av.titulo}`);
  // con las anotaciones, el mismo día de la apertura: hay que esperar al próximo tren
  av = A.avisoProximoVecino(anotar(partida(), 14));
  ok(/unos días/.test(av.titulo) && !av.listo, 'con las anotaciones, el mismo día: unos días');
  // al día siguiente puede venir
  av = A.avisoProximoVecino(anotar(partida({ dia: 7 }), 14));
  ok(av.listo && /ya puede venir/i.test(av.titulo) && /próxima trochita/.test(av.texto), 'listo: baja de la próxima trochita');
  // con una obra en curso se dice eso, no las anotaciones
  const enObra = partida();
  enObra.aldea.obras = { panaderia: { etapa: 0, aportado: {}, lista: null, desde: 6 } };
  ok(/terminar la obra/.test(A.avisoProximoVecino(enObra).titulo), 'primero la obra');
  // alguien esperando en el andén
  const esperando = anotar(partida({ dia: 8 }), 14);
  A.empezarLlegada(esperando.aldea, 'veterinaria', 8);
  ok(/esperando/.test(A.avisoProximoVecino(esperando).titulo), 'alguien en el andén');
  // el Desafío, sin vecinos o con todos los que tenían que venir: nada
  eq(A.avisoProximoVecino({ ...partida(), modo: 'desafio' }), null, 'en el Desafío no hay aviso');
  const todos = partida();
  todos.aldea.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
  eq(A.avisoProximoVecino(todos), null, 'ya vinieron todos');
  // si la historia llamó, no pide anotaciones
  const llamado = partida({ dia: 7 });
  llamado.aldea.llamado = true;
  ok(A.avisoProximoVecino(llamado).listo, 'llamado por la historia: ya puede venir');
}

// ============================================================ 2. el reloj y el almanaque: los textos
{
  eq([R.horaFormato(10.5), R.horaFormato(0), R.horaFormato(23.999), R.horaFormato(24.5), R.horaFormato(-1)], ['10:30', '00:00', '23:59', '00:30', '23:00'], 'horaFormato');
  eq([4.9, 5, 8, 12, 14, 19, 21].map(R.momentoDelDia), ['de madrugada', 'al amanecer', 'a la mañana', 'al mediodía', 'a la tarde', 'al anochecer', 'de noche'], 'momentoDelDia');
  eq(R.partesReloj({ hora: 10.5, dia: 12 }), ['Son las 10:30, a la mañana.', 'Hoy es viernes, día 12 en el valle.'], 'el reloj de la plaza');
  eq(R.partesReloj({ hora: NaN, dia: -3 }), ['Son las 12:00, al mediodía.', 'Hoy es lunes, día 1 en el valle.'], 'el reloj no se rompe con datos malos');
  const a = A.aldeaNueva();
  a.pobladores.push({ clave: 'carpintero', dia: 5 });
  a.locales = { carpinteria: 6 };
  const sinSalon = R.partesAlmanaque({ dia: 12, horas: 20, aldea: a });
  ok(sinSalon[0] === 'Viernes, día 12.' && /^4\.º día del invierno, año 1\.$/.test(sinSalon[1]), 'la fecha');
  ok(sinSalon.includes('Estación: Invierno.') && sinSalon.some((x) => /^La luna: /.test(x)), 'la estación y la luna');
  ok(sinSalon.some((x) => /^Mañana: /.test(x)), 'lo que viene mañana');
  ok(sinSalon.includes('Los domingos, de 10 a 11: los cuentos de la abuela en la biblioteca.'), 'los cuentos del domingo');
  ok(!sinSalon.some((x) => /baile/.test(x)), 'sin el salón no hay baile');
  ok(sinSalon.some((x) => /miércoles, de 18 a 19:30: el club de lectura/.test(x)), 'el club de lectura');
  a.locales.salon = 7;
  ok(R.partesAlmanaque({ dia: 12, horas: 20, aldea: a }).includes('Los sábados, de 17 a 19: el baile en el salón.'), 'con el salón, el baile del sábado');
  ok(R.partesAlmanaque({ dia: 3, horas: 8 }).length >= 8, 'sin aldea tampoco se rompe');
  for (const t of [...R.partesAlmanaque({ dia: 12, horas: 20, aldea: a }), ...R.partesReloj({ hora: 3, dia: 5 })]) ok(typeof t === 'string' && t.length > 0 && !/undefined|NaN|\[object/.test(t), `texto sano: ${t}`);
  // la fase de la luna cambia con el día
  const fases = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((d) => R.partesAlmanaque({ dia: d, aldea: a }).find((x) => /^La luna/.test(x))));
  ok(fases.size >= 5, 'la luna pasa por varias fases en ocho días');
}

// ============================================================ 3. la línea del HUD (reloj de bolsillo y almanaque de pared)
{
  eq(R.textoHud(partida({ cosas: {} })), '', 'sin nada comprado no hay línea');
  eq(R.textoHud(partida({ horas: 13.25, cosas: { reloj: 1 } })), '13:15', 'sólo el reloj: la hora');
  eq(R.textoHud(partida({ dia: 3, cosas: { almanaque: 1 } })), 'Miércoles, día 3 · Verano', 'sólo el almanaque: el día y la estación');
  eq(R.textoHud(partida({ dia: 12, horas: 7.9, cosas: { reloj: 1, almanaque: 1 } })), '07:54 · Viernes, día 12 · Invierno', 'los dos');
  eq(R.textoHud({ ...partida({ cosas: { reloj: 1, almanaque: 1 } }), modo: 'desafio' }), '', 'en el Desafío no se muestra');
  eq(R.textoHud(null), '', 'sin partida');
  ok(R.tieneReloj(partida({ cosas: { reloj: 1 } })) && !R.tieneReloj(partida()) && R.tieneAlmanaque(partida({ cosas: { almanaque: 2 } })), 'tieneReloj / tieneAlmanaque');
}

// ============================================================ 4. el almacén y el cuaderno
{
  const NOMBRES = new Set(['calafate', 'pluma', 'canto', 'ramita', 'pinon', 'frutilla', 'frasco-frutilla', 'calafate-seco', 'hongos-secos']);
  for (const id of [R.RELOJ_PROPIO, R.ALMANAQUE_PROPIO]) {
    const t = TRUEQUE[id];
    ok(t && t.nombre && t.texto && t.efecto, `${id}: está en el almacén`);
    ok(t.pide.length >= 1 && t.pide.every(([k, c]) => NOMBRES.has(k) && Number.isInteger(c) && c > 0), `${id}: pide cosas que existen`);
    ok(!t.repetible && tieneYa(t, { [id]: 1 }) && !tieneYa(t, {}), `${id}: se cambia una sola vez`);
    ok(ENTRADAS.some((e) => e.id === id && e.seccion === 'trueque' && e.nombre && e.texto && e.pista), `${id}: tiene su anotación en el cuaderno`);
  }
  ok(TRUEQUES.length === new Set(TRUEQUES.map((t) => t.id)).size, 'ids del almacén sin repetir');
  // los dos van al final: no mueven los números de lo que ya había
  eq(TRUEQUES.slice(-2).map((t) => t.id), ['reloj', 'almanaque'], 'al final de la lista del almacén');
}

// ============================================================ 5. las mecánicas (E) y los puntos
{
  for (const k of ['reloj', 'almanaque']) {
    ok(MC.ORDEN_MECANICAS.includes(k) && MC.MECANICAS[k] && MC.AVISOS_MECANICAS[k], `${k}: en la lista, con su aviso`);
    ok(MC.MECANICAS_EN_LA_CHARLA.includes(k), `${k}: también en el menú de la charla`);
    ok(!MC.lugarTapaVecino(k), `${k}: no le gana a la charla con un vecino al lado`);
  }
  eq([MC.MECANICAS.reloj.edificio, MC.MECANICAS.reloj.punto, MC.MECANICAS.almanaque.edificio, MC.MECANICAS.almanaque.punto], ['plaza', 'reloj', 'biblioteca', 'almanaque'], 'dónde están');
  ok(MC.ORDEN_MECANICAS.indexOf('reloj') > MC.ORDEN_MECANICAS.indexOf('horario'), 'van después del horario de trenes');
  // y los puntos existen en los edificios armados
  const plaza = armarEdificio('plaza', 4).puntos.nombrados, bib = armarEdificio('biblioteca', 4).puntos.nombrados;
  ok(plaza.reloj && Number.isFinite(plaza.reloj.lx) && Number.isFinite(plaza.reloj.lz), 'la plaza tiene su punto «reloj»');
  ok(bib.almanaque && Number.isFinite(bib.almanaque.lx) && Number.isFinite(bib.almanaque.lz), 'la biblioteca tiene su punto «almanaque»');
  // el reloj no queda sobre el mástil ni sobre la soga (la prueba de la plaza exige llegar a mastil-soga)
  ok(Math.hypot(plaza.reloj.lx - plaza['mastil-soga'].lx, plaza.reloj.lz - plaza['mastil-soga'].lz) > 2.5, 'el punto del reloj no tapa la soga del mástil');
  // el almanaque no está junto al mostrador (ahí gana el préstamo)
  ok(Math.hypot(bib.almanaque.lx - bib.adentro.lx, bib.almanaque.lz - bib.adentro.lz) > 1.2, 'el almanaque no está encima del mostrador');
}

// ============================================================ 6. el cableado (main.js, plantilla) y las reglas de siempre
{
  const main = leer('src/main.js'), plantilla = leer('src/plantilla.html');
  ok(main.includes("from './reloj-almanaque.js'") && main.includes('actualizarRelojHud(dt)'), 'main.js actualiza la línea del reloj');
  ok(/function actualizarRelojHud\(dt\)[\s\S]{0,400}esDesafio/.test(main), 'y no la muestra en el Desafío');
  ok(plantilla.includes('id="reloj-hud"') && plantilla.includes('.reloj-hud {'), 'la plantilla tiene el elemento y su estilo');
  const gente = leer('src/aldea-gente.js');
  ok(gente.includes('avisoProximoVecino') && gente.includes('avisarProximoVecino(true)') && gente.includes('if (a.descubierta) avisarProximoVecino()'), 'el aviso al abrir un local y el de cada día');
  for (const f of ['src/reloj-almanaque.js', 'src/aldea-mecanicas-mundo.js', 'src/main.js']) {
    for (const m of leer(f).matchAll(/^import .*$/gm)) ok(/^import (\* as THREE|\{ [^}]+ \}|\* as [A-Za-z_$][\w$]*) from '[^']+';$/.test(m[0]), `${f}: import en una línea: ${m[0].slice(0, 60)}`);
  }
  for (const m of leer('src/reloj-almanaque.js').matchAll(/^export\s+(?:const|let|function|class)\s+([^\s(=]+)/gm)) ok(!/ñ/i.test(m[1]), `exportado sin ñ: ${m[1]}`);
}

// ============================================================ 7. el inglés
{
  const t = crearTraductor(EN, 'en').t;
  const a = A.aldeaNueva();
  const textos = [
    ...R.partesReloj({ hora: 10.5, dia: 12 }), ...R.partesAlmanaque({ dia: 12, horas: 20, aldea: a }),
    ...Object.values(MC.AVISOS_MECANICAS).filter((x) => /reloj|almanaque/.test(x)),
    'El reloj de la plaza', 'El almanaque de la biblioteca', 'la plaza de la aldea', 'la biblioteca popular',
    TRUEQUE.reloj.nombre, TRUEQUE.reloj.texto, TRUEQUE.reloj.efecto, TRUEQUE.almanaque.nombre, TRUEQUE.almanaque.texto, TRUEQUE.almanaque.efecto,
    ...ENTRADAS.filter((e) => e.id === 'reloj' || e.id === 'almanaque').flatMap((e) => [e.nombre, e.pista, e.texto]),
  ];
  for (const x of textos) {
    const en = t(x);
    ok(en && en !== x, `falta el inglés de «${x}»`);
    ok(!/\b(día|del|las|Son|Hoy|mañana)\b/.test(en.replace(/Ernesto|Llancafil/g, '')), `quedó castellano en «${en}»`);
  }
  // el aviso del vecino, en los cuatro casos
  const p = partida();
  for (const av of [A.avisoProximoVecino(p), A.avisoProximoVecino(anotar(partida(), 13)), A.avisoProximoVecino(anotar(partida({ dia: 7 }), 14))]) {
    ok(t(av.titulo) !== av.titulo && t(av.texto) !== av.texto, `inglés del aviso: ${av.titulo}`);
  }
}

console.log(`verificar-3-8-8-reloj: ${n} verificaciones ok`);
