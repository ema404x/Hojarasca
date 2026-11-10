// 4.22.0 · A · Noches con forma (el paquete «4.22.0 · Noches con forma» de AUDITORIA_4_20_0_A.md), en Node con los módulos reales:
//   · la cantidad de la oleada sigue creciendo después de la noche 9 (uno más cada dos noches: 23 en la 19; se clavaba en 18);
//   · la dureza de la noche crece 10 % por noche desde la 11 (8 % hasta la 10): de la 11 a la 19 la vida total crece ~6,1 % por noche (3,7 %);
//   · cada vuelta suma +12 % de cantidad, +15 % de vida y +10 % de daño (eran 20 / 25 / 15);
//   · el primer mandamás (noche 5) aguanta la mitad: deja de ser un salto de 3,6 veces sobre la noche 4;
//   · las semillas doradas sueltas: el bruto [1, 2] y el mandamás [8, 12] (eran [2, 3] y [14, 20]);
//   · caer cuesta más cuanto más avanzada la campaña (20 % + 1 % por noche, hasta 40 %) y en Tranquila se guarda un cuarto de las semillas;
//   · las tres perillas de la dificultad (cantidad, vida, daño: −2 a +2) se suman a la dificultad elegida y valen 0 si nunca se tocaron.
// Las mutaciones (que cada línea de acá falle si se deshace el cambio) las corre `pruebas/mutaciones-4-22-0-a.mjs`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';
import { enUnaLinea } from './ayuda-codigo.mjs';

registrarThree();
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; },
};
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const cerca = (v, esperado, tol, m) => ok(Math.abs(v - esperado) <= tol, `${m} (${v}, esperado ${esperado} ± ${tol})`);

const R = await import('../src/desafio-reglas.js');
const V = await import('../src/desafio-vuelta.js');
const P = await import('../src/desafio-perillas.js');
const SF = await import('../src/desafio-supervivencia.js');
const LG = await import('../src/desafio-logros.js');
const G = await import('../src/guardado.js');
const limpio = () => { R.fijarPartidaMeta(null); R.fijarPerillas(null); };

// la vida total de la oleada (con la escala del primer mandamás, como en el juego: desafio.js)
function oleada(noche, dif = 'normal', vuelta = 0) {
  const lista = R.composicionOleada(noche, dif, vuelta), mult = R.multiplicadorNoche(noche), mv = V.multiplicadorVuelta(vuelta), d = R.dificultad(dif);
  let vida = 0;
  for (const t of lista) vida += Math.round(R.TIPOS_ALIEN[t].vida * mult * mv.vida * d.vida * (R.TIPOS_ALIEN[t].jefe ? R.escalaDelJefe(noche) : 1));
  return { cantidad: lista.length, vida, lista };
}

// ============================================================ 1. la cantidad de la oleada
limpio();
{
  const hasta9 = [3, 5, 7, 9, 11, 13, 15, 17, 18];
  for (let noche = 1; noche <= 9; noche++) eq(R.cantidadDeLaNoche(noche), hasta9[noche - 1], `noche ${noche}: la cantidad sigue como siempre hasta la 9`);
  const desde10 = [18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23];   // noches 10 a 20
  for (let noche = 10; noche <= 20; noche++) eq(R.cantidadDeLaNoche(noche), desde10[noche - 10], `noche ${noche}: uno más cada dos noches`);
  // y la composición la usa (noche común, sin enjambre ni mandamás: 19 y 13)
  eq(oleada(19).cantidad, 23, 'la noche 19 trae 23 duendes en Normal (eran 18)');
  eq(oleada(13).cantidad, 20, 'la noche 13 trae 20');
  eq(oleada(9).lista.filter((t) => t !== 'enjambre').length, 18, 'la noche 9, 18 comunes (más el enjambre)');
  // Tranquila e Implacable siguen la misma curva por su cantidad, con el tope de 24
  eq(oleada(19, 'tranquila').cantidad, 14, 'Tranquila: 23 × 0,6 = 14');
  eq(oleada(19, 'implacable').cantidad, 24, 'Implacable llega al tope de 24');
  eq(oleada(2).cantidad, 5, 'las primeras noches no cambian');
}

// ============================================================ 2. la dureza de la noche
{
  cerca(R.multiplicadorNoche(1), 1, 1e-9, 'noche 1: 1');
  cerca(R.multiplicadorNoche(10), 1.72, 1e-9, 'noche 10: 1,72 (8 % por noche, como siempre)');
  cerca(R.multiplicadorNoche(11), 1.82, 1e-9, 'noche 11: 1,82 (10 % desde acá: era 1,80)');
  cerca(R.multiplicadorNoche(15), 2.22, 1e-9, 'noche 15: 2,22 (era 2,12)');
  cerca(R.multiplicadorNoche(20), 2.72, 1e-9, 'noche 20: 2,72 (era 2,52)');
  for (let noche = 1; noche < 25; noche++) ok(R.multiplicadorNoche(noche + 1) > R.multiplicadorNoche(noche), 'sube siempre');
  // la sin fin sigue de ahí: el mismo número en la noche 20 y un techo 1,6 más arriba
  cerca(SF.multiplicadorSinFin(20), R.multiplicadorNoche(20), 1e-9, 'la sin fin arranca en la dureza de la noche 20');
  cerca(SF.techoSinFin(), R.multiplicadorNoche(20) + 1.6, 1e-9, 'y su techo sigue 1,6 más arriba');
  eq(SF.composicionSinFin(19, 'normal').length, R.composicionOleada(19, 'normal').length, 'hasta la 19 la sin fin es la campaña');
  ok(SF.composicionSinFin(30, 'normal').length <= 24 + 1, 'la sin fin no pasa del tope de la nave');
}

// ============================================================ 3. la vida de la noche 11 a la 19 crece ~6,1 % por noche
{
  const v = (nn) => oleada(nn).vida;
  const crece = (Math.pow(v(19) / v(11), 1 / 8) - 1) * 100;
  cerca(crece, 6.1, 0.3, 'de la noche 11 a la 19 la vida total crece ~6,1 % por noche (era 3,7 %)');
  ok(crece > 5.5, 'más que el 3,7 % de antes');
  // las noches comunes de 11 a 19 ya no valen menos que la anterior (salvo la que viene detrás del mandamás)
  for (const nn of [13, 14, 17, 19]) ok(v(nn) > v(nn - 1) * 0.99, `la noche ${nn} no vale menos que la anterior`);
  cerca(v(20), 7265, 5, 'la noche 20 queda en ~7.265 de vida (era 5.942)');
  cerca(v(10), 4056, 5, 'las noches 1 a 10 no cambian (la 10 sigue en ~4.056)');
  [120, 367, 494, 627].forEach((x, i) => cerca(v(i + 1), x, 4, `ni la noche ${i + 1}`));
}

// ============================================================ 4. las vueltas
{
  const m = V.multiplicadorVuelta(1);
  cerca(m.cantidad, 1.12, 1e-9, 'vuelta 2: +12 % de cantidad'); cerca(m.vida, 1.15, 1e-9, '+15 % de vida'); cerca(m.dano, 1.1, 1e-9, '+10 % de daño');
  eq(V.multiplicadorVuelta(0), { cantidad: 1, vida: 1, dano: 1 }, 'la primera vuelta es la de siempre');
  cerca(V.multiplicadorVuelta(9).cantidad, 2.08, 1e-9, 'vuelta 10: x2,08 de cantidad (era 2,8)');
  cerca(V.multiplicadorVuelta(99).vida, V.multiplicadorVuelta(9).vida, 1e-9, 'la vuelta máxima sigue siendo 10');
  // la noche 10 llega al tope de 24 una vuelta más tarde (la 4ª y no la 3ª) y la 10ª vuelta de la noche 20 queda en ~17.200 de vida
  eq([0, 1, 2, 3].map((vv) => oleada(10, 'normal', vv).cantidad), [18, 20, 22, 24], 'noche 10: 18, 20, 22 y recién en la vuelta 4 el tope de 24');
  cerca(oleada(20, 'normal', 9).vida, 17239, 8, 'la vuelta 10 de la noche 20: ~17.239 de vida (era 22.088)');
  ok(oleada(20, 'normal', 9).cantidad === 24, 'y sigue topando en 24');
  ok(oleada(20, 'normal', 9).vida / oleada(20, 'normal', 2).vida < 1.9, 'la cantidad deja de ser el único freno: entre la vuelta 3 y la 10 la vida crece menos de 1,9 veces');
  // el texto de «Otra vuelta» sale del mismo multiplicador
  ok(enUnaLinea(leer('src/main.js'), ['m.cantidad - 1', 'm.vida - 1', 'm.dano - 1']), 'el aviso de Otra vuelta usa multiplicadorVuelta');
}

// ============================================================ 5. el primer mandamás
{
  eq(R.escalaDelJefe(5), 0.5, 'el primer mandamás aguanta la mitad');
  for (const nn of [1, 4, 6, 10, 15, 20, 25]) eq(R.escalaDelJefe(nn), 1, `la noche ${nn} no cambia`);
  const v = (nn) => oleada(nn).vida;
  const salto = v(5) / v(4);
  ok(salto > 2.4 && salto < 3, `la noche 5 es ~2,7 veces la 4 (${salto.toFixed(2)}; era 3,6)`);
  const vecinas = (nn) => v(nn) / ((v(nn - 1) + v(nn + 1)) / 2);
  cerca(vecinas(5), vecinas(10), 0.15, 'el primer mandamás pesa lo mismo que el de la 10, sobre sus noches de al lado');
  cerca(vecinas(5), vecinas(15), 0.15, 'y que el de la 15');
  ok(v(5) < v(8), 'ya no es la noche más dura hasta la 8');
  cerca(v(5), 1692, 5, 'la noche 5: ~1.692 de vida total (era 2.286)');
  // en el juego se aplica al bajar el mandamás (y sólo a él)
  const desafio = leer('src/desafio.js');
  ok(enUnaLinea(desafio, ['a.vida = a.vidaMax =', 'a.def.vida * mult * mv.vida', "(a.def.jefe ? escalaDelJefe(D().oleadas) : 1)"]), 'el mandamás nace con la escala de la noche');
  // la partida corta (el mandamás de la 7 es el final) no la usa
  R.fijarPartidaMeta({ modo: 'corta', ventajas: [], reglas: [] });
  eq(R.escalaDelJefe(5), 1, 'en la partida corta no hay escala'); eq(R.escalaDelJefe(7), 1, 'ni en la noche 7');
  limpio();
}

// ============================================================ 6. las semillas doradas sueltas
{
  eq(R.TIPOS_ALIEN.bruto.cristales, [1, 2], 'el bruto suelta de 1 a 2 (eran 2 a 3)');
  eq(R.TIPOS_ALIEN.jefe.cristales, [8, 12], 'el mandamás, de 8 a 12 (eran 14 a 20)');
  eq(R.TIPOS_ALIEN.rastreador.cristales, [0, 1], 'los demás, como siempre'); eq(R.TIPOS_ALIEN.tirador.cristales, [1, 2], 'tirador'); eq(R.TIPOS_ALIEN.escupidor.cristales, [1, 2], 'escupidor');
  const sueltas = (hasta) => { let s = 0; for (let nn = 1; nn <= hasta; nn++) for (const t of R.composicionOleada(nn, 'normal')) { const c = R.TIPOS_ALIEN[t].cristales || [0, 0]; s += (c[0] + c[1]) / 2; } return s; };
  ok(sueltas(7) > 65 && sueltas(7) < 80, `hasta la noche 7 se sueltan ~73 (eran 93): ${sueltas(7)}`);
  ok(sueltas(20) > 430 && sueltas(20) < 470, `hasta la 20, ~449 (eran 499): ${sueltas(20)}`);
  ok(sueltas(3) >= 9, `con lo de las tres primeras noches alcanza para la primera mejora (3 semillas): ${sueltas(3)}`);
}

// ============================================================ 7. lo que cuesta caer
{
  const c = (noche, dif) => P.castigoDeCaer(noche, dif);
  cerca(c(1).materiales, 0.21, 1e-9, 'noche 1: 21 %'); cerca(c(10).materiales, 0.3, 1e-9, 'noche 10: 30 %, como antes'); cerca(c(15).materiales, 0.35, 1e-9, 'noche 15: 35 %');
  cerca(c(20).materiales, 0.4, 1e-9, 'noche 20: 40 %'); cerca(c(80).materiales, 0.4, 1e-9, 'el tope es 40 %'); cerca(c(0).materiales, 0.21, 1e-9, 'una noche rara cuenta como la 1');
  cerca(c('x').materiales, 0.21, 1e-9, 'texto: como la noche 1'); cerca(c(NaN).materiales, 0.21, 1e-9, 'NaN: como la noche 1');
  for (let nn = 1; nn < 30; nn++) ok(c(nn + 1).materiales >= c(nn).materiales, 'nunca baja con la noche');
  eq(c(7, 'normal').cristalesQueQuedan, 0, 'en Normal se pierden todas las semillas'); eq(c(7, 'implacable').cristalesQueQuedan, 0, 'en Implacable también'); eq(c(7, 'tranquila').cristalesQueQuedan, 0.25, 'en Tranquila queda un cuarto');
  const antes = { tronco: 40, tabla: 40, piedra: 40, cristal: 12, ramita: 5 };
  // noche 10 en Normal: lo mismo que la regla vieja (floor(x × 0,7), semillas a 0)
  eq(P.aplicarCastigo({ ...antes }, c(10, 'normal')), { tronco: 28, tabla: 28, piedra: 28, cristal: 0, ramita: 5 }, 'noche 10 en Normal: como antes');
  eq(P.aplicarCastigo({ ...antes }, c(20, 'normal')), { tronco: 24, tabla: 24, piedra: 24, cristal: 0, ramita: 5 }, 'noche 20: queda el 60 %');
  eq(P.aplicarCastigo({ ...antes }, c(1, 'normal')), { tronco: 31, tabla: 31, piedra: 31, cristal: 0, ramita: 5 }, 'noche 1: queda el 79 %');
  eq(P.aplicarCastigo({ ...antes }, c(10, 'tranquila')), { tronco: 28, tabla: 28, piedra: 28, cristal: 3, ramita: 5 }, 'en Tranquila quedan 3 de 12 semillas');
  eq(P.aplicarCastigo({ cristal: 7 }, c(5, 'tranquila')).cristal, 1, 'de 7 semillas queda 1 (redondea para abajo)');
  eq(P.aplicarCastigo({ cristal: 3 }, c(5, 'tranquila')).cristal, 0, 'de 3 no queda ninguna');
  eq(P.aplicarCastigo({}, c(10)), { cristal: 0 }, 'sin nada, sin nada (y sin NaN)');
  eq(P.aplicarCastigo(null, c(10)), { cristal: 0 }, 'sin materiales: un objeto vacío, sin romper');
  ok(P.textoCaida(c(3, 'tranquila')) !== P.textoCaida(c(3, 'normal')), 'el aviso cambia en Tranquila (queda algo)');
  ok(/^Perdiste las semillas doradas/.test(P.textoCaida(c(3, 'normal'))), 'y en las demás sigue diciendo que se pierden');
  // el juego lo usa en lugar de la regla plana
  const main = leer('src/main.js');
  ok(!main.includes('M.cristal = 0;') && !main.includes('M[k] * 0.7'), 'main.js ya no tiene la pérdida plana');
  ok(enUnaLinea(main, ['castigoDeCaer(', 'progreso.desafio?.oleadas', 'dificultadEnJuego()']), 'caer mira la noche y la dificultad');
  ok(enUnaLinea(main, ['aplicarCastigo(M, castigo)']), 'y aplica el castigo a los materiales');
  ok(enUnaLinea(main, ['textoCaida(castigo)']), 'y el aviso sale de ahí');
  ok(/20% y un 40%/.test(leer('src/guia.js')) && !/un 30% de los troncos/.test(leer('src/guia.js')), 'la guía dice lo nuevo');
}

// ============================================================ 8. las perillas
{
  // un paso válido: entero de −2 a +2
  eq([P.pasoDe(0), P.pasoDe(2), P.pasoDe(-2), P.pasoDe(3), P.pasoDe(-9), P.pasoDe('1'), P.pasoDe('-1'), P.pasoDe(1.6), P.pasoDe(-0.4)], [0, 2, -2, 2, -2, 1, -1, 2, -0], 'pasoDe acota y redondea');
  eq([P.pasoDe(null), P.pasoDe(''), P.pasoDe(true), P.pasoDe('x'), P.pasoDe(undefined), P.pasoDe(NaN), P.pasoDe(Infinity), P.pasoDe({}), P.pasoDe([])].map((x) => Object.is(x, -0) ? 0 : x), [0, 0, 0, 0, 0, 0, 0, 0, 0], 'lo que no es un número: 0');
  eq(P.sanearPerillas(null), { cantidad: 0, vida: 0, dano: 0 }, 'sin nada: en cero'); eq(P.sanearPerillas([1, 2]), { cantidad: 0, vida: 0, dano: 0 }, 'una lista no vale');
  eq(P.sanearPerillas({ cantidad: 1, vida: 9, dano: 'x', otra: 1 }), { cantidad: 1, vida: 2, dano: 0 }, 'sin campos raros');
  eq(P.perillasDeAjustes({ perillaCantidad: -1, perillaVida: '2', perillaDano: 5 }), { cantidad: -1, vida: 2, dano: 2 }, 'se leen de los ajustes');
  eq(P.perillasDeAjustes(undefined), { cantidad: 0, vida: 0, dano: 0 }, 'sin ajustes: cero');
  eq(P.PERILLAS.cantidad.pasos, [0.6, 0.8, 1, 1.2, 1.4], 'cantidad: de 0,6 a 1,4'); eq(P.PERILLAS.vida.pasos, [0.8, 0.9, 1, 1.1, 1.2], 'vida: de 0,8 a 1,2'); eq(P.PERILLAS.dano.pasos, [0.6, 0.8, 1, 1.2, 1.4], 'daño: de 0,6 a 1,4');
  eq(P.multiplicadoresPerillas({ cantidad: 2, vida: -1, dano: 0 }), { cantidad: 1.4, vida: 0.9, dano: 1 }, 'los multiplicadores');
  ok(P.perillasEnCero({}) && !P.perillasEnCero({ vida: 1 }), 'en cero'); ok(P.perillasFacilitan({ dano: -1 }) && !P.perillasFacilitan({ dano: 2, vida: 1 }), 'facilitan sólo si alguna baja');

  // sobre la dificultad: en cero no cambia NADA (los mismos objetos de siempre)
  limpio();
  for (const k of Object.keys(R.DIFICULTADES)) ok(R.dificultad(k) === R.DIFICULTADES[k], `${k}: con las perillas en cero es el objeto de siempre`);
  R.fijarPerillas({ cantidad: 2 });
  cerca(R.dificultad('normal').cantidad, 1.4, 1e-9, 'cantidad +2: x1,4 sobre Normal'); eq(R.dificultad('normal').vida, 1, 'la vida no se movió'); eq(R.dificultad('normal').dano, 1, 'ni el daño');
  cerca(R.dificultad('implacable').cantidad, 1.4 * 1.4, 1e-9, 'se suma a Implacable (x1,96)'); cerca(R.dificultad('tranquila').cantidad, 0.6 * 1.4, 1e-9, 'y a Tranquila');
  eq(R.dificultad('normal').nombre, 'Normal', 'sigue siendo Normal');
  R.fijarPerillas({ cantidad: -2, vida: -2, dano: -2 });
  cerca(R.dificultad('normal').cantidad, 0.6, 1e-9, 'cantidad −2: 0,6'); cerca(R.dificultad('normal').vida, 0.8, 1e-9, 'vida −2: 0,8'); cerca(R.dificultad('normal').dano, 0.6, 1e-9, 'daño −2: 0,6');
  R.fijarPerillas({ vida: 2, dano: 1 });
  eq(oleada(10).cantidad, 18, 'sin tocar la cantidad, vienen los mismos'); ok(oleada(10).vida > 4056 * 1.15, 'pero aguantan más (vida +2)');
  // la composición cambia con la cantidad
  R.fijarPerillas({ cantidad: 2 }); eq(oleada(10).cantidad, 24, 'noche 10 con cantidad +2: 24 (el tope)');
  R.fijarPerillas({ cantidad: -2 }); eq(oleada(10).cantidad, 11, 'con cantidad −2: 11');
  // con el modo de la partida: se multiplican entre sí y cada uno se puede cambiar sin pisar al otro
  R.fijarPartidaMeta({ modo: 'pesadilla', ventajas: [], reglas: [] }); R.fijarPerillas({ dano: 2 });
  cerca(R.dificultad('normal').dano, 1.15 * 1.4, 1e-9, 'pesadilla (x1,15) con daño +2 (x1,4)'); cerca(R.dificultad('normal').cantidad, 1.3, 1e-9, 'la pesadilla sigue con su cantidad');
  R.fijarPartidaMeta(null);
  cerca(R.dificultad('normal').dano, 1.4, 1e-9, 'al sacar el modo quedan las perillas'); cerca(R.dificultad('normal').cantidad, 1, 1e-9, 'y sólo ellas');
  R.fijarPerillas(null);
  cerca(R.dificultad('normal').dano, 1, 1e-9, 'al sacar las perillas, de vuelta Normal'); ok(R.dificultad('normal') === R.DIFICULTADES.normal, 'el mismo objeto de siempre');
  R.fijarPerillas({ cantidad: 1, vida: -1, dano: 2 });
  eq(R.perillasPartida(), { cantidad: 1, vida: -1, dano: 2 }, 'la partida las recuerda'); ok(R.perillasFacilitanPartida(), 'y sabe que una facilita');
  limpio(); ok(!R.perillasFacilitanPartida(), 'en cero no facilita');

  // el texto que las explica
  ok(/Como la dificultad elegida/.test(P.textoPerillas({})), 'en cero: como la dificultad elegida');
  eq(P.textoPerillas({ cantidad: 2 }), 'Sobre la dificultad elegida: 40 % más de duendes.', 'una sola perilla');
  eq(P.textoPerillas({ cantidad: 1, vida: 2, dano: 1 }), 'Sobre la dificultad elegida: 20 % más de duendes, 20 % más de vida y 20 % más de daño.', 'varias, con «y»');
  ok(/no se anotan récords/.test(P.textoPerillas({ dano: -1 })), 'si facilita, avisa que no hay récords');
  ok(!/no se anotan récords/.test(P.textoPerillas({ dano: 1 })), 'si sólo suben, no avisa');
  for (const t of [P.textoPerillas({ cantidad: -2, vida: -1, dano: 2 }), P.textoCaida(P.castigoDeCaer(3, 'tranquila'))]) ok(!/[A-Za-z]*\b(the|and|you|your)\b/i.test(t), 'sin inglés');

  // récords y logros: con una perilla más fácil no se anotan, y 'facilitada' no cuenta como Implacable
  const logros = LG.evaluarNoche({ sobrevivida: true, danoRecibido: 5, abatidos: 3, abatidosLanza: 0, abatidosOtros: 3, invasores: 10, obrasPerdidas: 1, noche: 9, dificultad: 'facilitada' }, {});
  ok(!logros.includes('implacable'), 'una dificultad facilitada no da el logro de Implacable');
  ok(LG.evaluarNoche({ sobrevivida: true, danoRecibido: 5, abatidos: 3, abatidosLanza: 0, abatidosOtros: 3, invasores: 10, obrasPerdidas: 1, noche: 9, dificultad: 'implacable' }, {}).includes('implacable'), 'y la Implacable de verdad, sí');
  const desafio = leer('src/desafio.js');
  ok(enUnaLinea(desafio, ["dificultad: D().facilitada || perillasFacilitanPartida() ? 'facilitada'", 'ctx.dificultad?.()']), 'el logro de la noche mira las perillas');   // (4.25.2: y la marca de la partida)
  ok(enUnaLinea(desafio, ['if (sinRecords()) return;']) && enUnaLinea(desafio, ['const sinRecords = () =>', 'perillasFacilitanPartida()']), 'registrarRecords no anota si una perilla facilita');   // (4.25.2: por sinRecords)

  // en el juego: se fijan al abrir (menos en la sin fin) y al tocarlas
  const main = leer('src/main.js');
  ok(enUnaLinea(main, ['if (esDesafio) fijarPerillas(esSinFin ? null : perillasDeAjustes(ajustes));']), 'se fijan al abrir, y la sin fin no las usa');
  ok(enUnaLinea(main, ["clave.startsWith('perilla') && esDesafio", 'fijarPerillas(esSinFin ? null : perillasDeAjustes(ajustes))']), 'y al tocar una en Ajustes');
  ok(enUnaLinea(main, ["clave.startsWith('perilla')", 'v = Number(v)']), 'el valor del botón se vuelve número');
  ok(enUnaLinea(main, ['textoPerillas(perillasDeAjustes(ajustes))']), 'el texto se arma desde los ajustes');
  ok(enUnaLinea(main, ["el.dataset.perillas === 'ajustes' && !esDesafio", "ajustes.desafioTipo === 'sinfin'"]), 'se ocultan en el Relax y en la sin fin');

  // la pantalla: tres grupos de cinco botones en la portada y tres en Ajustes
  const html = leer('src/plantilla.html');
  for (const clave of ['perillaCantidad', 'perillaVida', 'perillaDano']) {
    const grupos = [...html.matchAll(new RegExp(`<div class="segmentos" data-ajuste="${clave}"[^>]*>(.*?)</div>`, 'g'))];
    eq(grupos.length, 2, `${clave}: está en la portada y en Ajustes`);
    for (const g of grupos) eq([...g[1].matchAll(/data-valor="(-?\d)"/g)].map((m) => m[1]), ['-2', '-1', '0', '1', '2'], `${clave}: cinco pasos`);
  }

  // los ajustes guardados: por defecto en cero; un guardado viejo (sin las claves) carga en cero; lo raro se sanea
  eq([G.AJUSTES_BASE.perillaCantidad, G.AJUSTES_BASE.perillaVida, G.AJUSTES_BASE.perillaDano], [0, 0, 0], 'de fábrica, en cero');
  const cargar = (obj) => { almacen.clear(); almacen.set('hojarasca-ajustes-v1', JSON.stringify(obj)); return G.cargarAjustes(); };
  { const a = cargar({ modo: 'desafio' }); eq([a.perillaCantidad, a.perillaVida, a.perillaDano], [0, 0, 0], 'una partida vieja carga en cero'); }
  { const a = cargar({ perillaCantidad: 2, perillaVida: -1, perillaDano: '1' }); eq([a.perillaCantidad, a.perillaVida, a.perillaDano], [2, -1, 1], 'lo guardado vuelve'); }
  { const a = cargar({ perillaCantidad: 99, perillaVida: 'x', perillaDano: null }); eq([a.perillaCantidad, a.perillaVida, a.perillaDano], [2, 0, 0], 'lo raro se sanea'); }
  { G.guardarAjustes({ ...G.AJUSTES_BASE, perillaDano: 1 }); eq(G.cargarAjustes().perillaDano, 1, 'guardar y cargar'); }
}

// ============================================================ 9. el resto de la dificultad queda como estaba
limpio();
{
  eq(R.DIFICULTADES.tranquila.cantidad, 0.6, 'Tranquila'); eq(R.DIFICULTADES.implacable.cantidad, 1.4, 'Implacable');
  eq(R.TOPE_OLEADA, 24, 'el tope de la oleada sigue en 24'); eq(R.TOPE_OLEADA_PESADILLA, 31, 'y 31 en la pesadilla');
  eq(R.NOCHE_FINAL, 20, 'la campaña sigue en 20 noches');
  // la cadena grande de las noches (R12) no se tocó
  eq(R.esNocheDeJefe(5) && R.esNocheDeJefe(10) && R.esNocheDeJefe(15) && R.esNocheDeJefe(20) && !R.esNocheDeJefe(6), true, 'los mandamases siguen en 5, 10, 15 y 20');
  const sanea = R.sanearDesafio({ vuelta: 4, oleadas: 12 });
  eq([sanea.vuelta, sanea.oleadas], [4, 12], 'una partida guardada vieja carga igual (sin claves nuevas)');
  ok(!('perillas' in R.desafioNuevo()), 'las perillas no están en la partida: son de los ajustes');
}

console.log(`4.22.0 A: ok · noches con forma (cantidad 23 en la 19, dureza +10 %, vueltas 12/15/10, primer mandamás a la mitad, semillas, castigo de caer, perillas) · ${n} verificaciones`);
