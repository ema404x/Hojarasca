// 4.6.1 — una sola lista para la tecla E y el aviso (src/interacciones.js).
// Comprueba:
//   1. que la E y el aviso de main.js salen de la misma tabla (y que no quedaron las dos cadenas viejas);
//   2. que todo lo que la tabla le pide al juego existe en el contexto de main.js (ctxInteraccion);
//   3. la tabla en sí: ids únicos, cada entrada completa, las otras teclas sin E;
//   4. escenarios clave (juncal con hoz contra helecho, pehuén en otoño, tablón contra vecino, mostrador, puestos de ruta,
//      sentarse…): la E y el aviso dan la misma respuesta;
//   5. al azar, en muchos estados: lo que dice el aviso con tecla E es lo que hace la E.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { INTERACCIONES, OTRAS_TECLAS, IDS, IDS_OTRAS, que, contexto, bloqueCtx, antes, funcionDeMain } from './ayuda-interacciones.mjs';
import { avisoDe, queHariaE } from '../src/interacciones.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js'), tabla = leer('src/interacciones.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ---------------------------------------------------------------- 1. la E y el aviso, de la misma tabla
{
  ok(/^import \{ avisoDe, hacerConE \} from '\.\/interacciones\.js';$/m.test(main), 'main.js importa la tabla (en una línea, como pide armar.mjs)');
  const i0 = main.indexOf("case 'KeyE': {"), i1 = main.indexOf("case 'Tab':", i0);
  const tecla = main.slice(i0, i1);
  ok(i0 > 0 && /hacerConE\(ctxInteraccion\);/.test(tecla), 'la tecla E recorre la tabla');
  ok(!/break; \}/.test(tecla) && tecla.split('\n').length < 12, 'y no quedó la cadena vieja de la E');
  eq((main.match(/hacerConE\(ctxInteraccion\)/g) || []).length, 1, 'una sola llamada de la E');
  eq((main.match(/avisoDe\(ctxInteraccion\)/g) || []).length, 1, 'una sola llamada del aviso');
  ok(!/let aviso = objetivo \?/.test(main) && !/if \(!aviso && /.test(main), 'no quedó la cadena vieja del aviso');
  // en el cuadro, entre la cuenta del aviso y mostrarlo, nada vuelve a escribirlo
  const a0 = main.indexOf('const aviso = avisoDe(ctxInteraccion);'), a1 = main.indexOf('mostrarAviso(aviso);', a0);
  ok(a0 > 0 && a1 > a0 && !/aviso = /.test(main.slice(a0 + 10, a1)), 'nada pisa el aviso antes de mostrarlo');
  ok(!/si estás mirando a una persona/.test(main) && /si estás mirando a una persona, E habla con ella antes de accionar puertas/.test(tabla), 'el comentario de la prioridad vive en la tabla');
}

// ---------------------------------------------------------------- 2. lo que la tabla pide existe en el contexto
{
  const ctx = bloqueCtx(main);
  const pedidos = new Set([...tabla.matchAll(/\bc\.([A-Za-z_]+)/g)].map((m) => m[1]));
  ok(pedidos.size > 60, `la tabla pide ${pedidos.size} cosas al juego`);
  const faltan = [...pedidos].filter((k) => !new RegExp(`(^|[\\s,{])(get )?${k}(\\(\\)|\\s*[:,])`, 'm').test(ctx));
  eq(faltan, [], 'todo lo que pide la tabla está en ctxInteraccion');
  // los nombres de los módulos, de lo de al lado y de los paneles tienen su caso en main.js
  const fn = (nombre) => main.slice(main.indexOf(`function ${nombre}(`), main.indexOf('\n}\n', main.indexOf(`function ${nombre}(`)));
  const acciones = new Set([...tabla.matchAll(/(?:delModulo|c\.accion|c\.limpiar)\('([a-z]+)'/g)].map((m) => m[1]));
  for (const a of acciones) {
    ok(new RegExp(`case '${a}': return`).test(fn('accionInteraccion')), `accionInteraccion sabe de «${a}»`);
    ok(new RegExp(`case '${a}': cache[A-Za-z]+ = null; break;`).test(fn('limpiarInteraccion')), `limpiarInteraccion sabe de «${a}»`);
  }
  for (const [, a] of tabla.matchAll(/c\.cerca\('([A-Za-z]+)'/g)) ok(new RegExp(`case '${a}': return enE \\? `).test(fn('cercaInteraccion')), `cercaInteraccion sabe de «${a}»`);
  const paneles = main.slice(main.indexOf('const panelesInteraccion'), main.indexOf('};', main.indexOf('const panelesInteraccion')));
  for (const [, a] of tabla.matchAll(/c\.panelAbierto\('([a-z]+)'\)/g)) ok(new RegExp(`\\b${a}: \\(\\) => `).test(paneles), `el panel «${a}» se sabe si está abierto`);
  // el contexto no arma nada por cuadro: getters y funciones ya hechas
  ok(/^const ctxInteraccion = \{$/m.test(main) && !/new [A-Z]/.test(ctx), 'el contexto se arma una vez, sin objetos nuevos adentro');
}

// ---------------------------------------------------------------- 3. la tabla
{
  eq(new Set(IDS).size, IDS.length, 'ids únicos en la tabla de la E');
  eq(new Set(IDS_OTRAS).size, IDS_OTRAS.length, 'y en la de las otras teclas');
  ok(IDS.length >= 60, `la tabla tiene ${IDS.length} interacciones`);
  for (const en of INTERACCIONES) ok(typeof en.cuando === 'function' && typeof en.aviso === 'function', `«${en.id}»: cuándo y aviso`);
  for (const en of OTRAS_TECLAS) ok(en.tecla && en.tecla !== 'E' && typeof en.cuando === 'function' && typeof en.aviso === 'function', `«${en.id}»: otra tecla (${en.tecla})`);
  ok(INTERACCIONES.filter((e) => e.corta).every((e) => IDS.indexOf(e.id) <= IDS.indexOf('tablon-abierto')), 'lo que corta (cable, charla, paneles) va primero');
  ok(IDS.at(-1) === 'objetivo', 'lo que mirás, al final (todo lo de antes pide no mirar nada, o un asiento)');
  ok(main.includes('if (js.enCable) return;') && main.includes('if (tablonJuego?.abierto() && tablonJuego.tecla(codigo)) return;'), 'y la tecla los atiende antes de la tabla');
}

// ---------------------------------------------------------------- 4. escenarios: la E y el aviso dicen lo mismo
const mismo = (est, id, msj) => { const r = que(est); eq([r.e, r.avisoId], [id, id], msj); return r; };
{
  const helecho = { tipo: 'planta', texto: 'Anotar helecho' };
  // el juncal con la hoz: el recurso le gana a «Anotar» (main.js anula `objetivo` antes de la tabla)
  ok(/if \(\(objetivo\?\.tipo === 'planta' \|\| objetivo\?\.tipo === 'arbol'\) && recursosZona\?\.accion\(js\)\?\.gana\) objetivo = null;/.test(main), 'el recurso que gana anula «Anotar» antes de la E y del aviso');
  mismo({ acciones: { recursos: { texto: 'Cortar juncos', gana: true } } }, 'recursos', 'juncal con hoz: cortar (E y aviso)');
  mismo({ acciones: { recursos: { texto: 'El junco se corta con una hoz de junco' } }, objetivo: helecho }, 'objetivo', 'juncal sin hoz, mirando el helecho: anotar');
  // el pehuén en otoño: al pie, los piñones; la semilla del vivero no es de pehuén (arbolParaSemilla lo saltea)
  mismo({ acciones: { recursos: { texto: 'Juntar piñones', gana: true } }, cerca: { semillaArbol: null } }, 'recursos', 'pehuén en otoño: los piñones');
  ok(/a\.especie === 'pehuen'\) continue;/.test(main), 'la semilla del vivero no se junta del pehuén');
  mismo({ cerca: { semillaArbol: { arbol: { especie: 'nire' } } } }, 'semilla', 'otro árbol en otoño: la semilla');
  // el tablón y el vecino: con alguien adelante, hablar; main.js elige de frente cuando el tablón está a mano
  mismo({ vecino: { nombre: 'Jefe de estación' }, acciones: { tablon: true } }, 'vecino', 'con el vecino de frente: hablar');
  mismo({ acciones: { tablon: true } }, 'tablon', 'y si no, el tablón');
  ok(/tablonJuego\?\.accion\(js\) \|\| lugarTapaVecino/.test(main), 'delante del tablón, el vecino de atrás no tapa (se busca de frente)');
  // el mostrador: le gana a la puerta del almacén; hablar le gana al mostrador
  mismo({ cercaDelMostrador: true, puertaCerca: { objetivo: 0, nombre: 'la puerta' } }, 'mostrador', 'el mostrador antes que la puerta');
  mismo({ cercaDelMostrador: true, vecino: { nombre: 'Ercilia' } }, 'vecino', 'Ercilia detrás del mostrador: hablar');
  mismo({ cercaDelMostrador: true, enElAlmacen: true }, 'almacen-abierto', 'con el almacén abierto, E lo cierra');
  // los puestos de ruta: después del puesto de cargas, antes del cantero; a caballo, no
  mismo({ acciones: { puestos: true }, cerca: { cantero: {} } }, 'puestos', 'el puesto de ruta antes que el cantero');
  mismo({ acciones: { puestos: true }, puestoDeCargasCerca: {} }, 'cargas', 'el de cargas antes que el de ruta');
  mismo({ acciones: { puestos: true }, js: { montado: true } }, 'desmontar', 'a caballo, bajarte');
  // sentarse: un asiento no tapa la casa de té, el fuego ni el empleo que sólo informa
  const asiento = { tipo: 'sentarse', texto: 'Sentarte' };
  mismo({ objetivo: asiento }, 'objetivo', 'un asiento solo: sentarte');
  mismo({ objetivo: asiento, enLaCasaDeTe: true }, 'casa-te', 'en la casa de té de la estación: pedir');
  mismo({ objetivo: asiento, cercaDelFuego: true, puedeDormirJuntoAlFuego: true }, 'fuego', 'junto al fuego: dormir');
  mismo({ objetivo: asiento, acciones: { empleo: { tipo: 'info' } } }, 'empleo', 'el cartel de turnos al lado de un asiento');
  mismo({ objetivo: asiento, puedeSentarseALaCita: true }, 'cita', 'tu lugar en la mesa de la cita');
  mismo({ objetivo: asiento, js: { sentado: true }, puertaCerca: { objetivo: 0, nombre: 'la puerta' } }, 'objetivo', 'sentado, la puerta no');
  // más: el tren, el kayak, el caballo, la charla
  mismo({ js: { enTren: true }, puedeConducir: true, feriaCerca: true }, 'tren', 'arriba del tren, lo del tren (4.6.1: ni la feria)');
  mismo({ js: { enKayak: true }, lugarParaBajar: true, kayakCerca: true }, 'kayak', 'en el kayak: bajar');
  mismo({ js: { montado: true }, caballoDicho: () => 'el zaino', jaulaCerca: true }, 'jaula', 'a caballo junto a la jaula');
  eq(que({ charlaNpc: {}, vecino: { nombre: 'x' }, hachaCerca: {} }).aviso, null, 'charlando, ningún aviso');
  eq(que({ js: { enCable: true }, cercaDelMostrador: true }).hechos, [], 'colgado del cable, la tabla no hace nada (y la tecla ni llega)');
  // 4.6.1: los arreglos (ver CAMBIOS_4_6_1.md)
  eq(que({ panelAbierto: (x) => x === 'tablon', hachaCerca: {}, js: { montado: true } }).aviso, null, 'con el tablón abierto, ningún aviso (antes quedaban el del caballo y los de las otras teclas)');
  { const r = que({ enLaCasaDeTe: true, teEnLaAldea: true, kayakCerca: true }); eq([r.e, r.avisoId], ['subir-kayak', 'subir-kayak'], 'el «·» de Ceinwen ya no tapa lo que hace la E'); }
  eq(que({ js: { enKayak: true }, cercaDelFuego: true }).tecla, null, 'en el kayak, la G de cocinar no se ofrece (la G no cocina ahí)');
}

// ---------------------------------------------------------------- 5. al azar: el aviso con E es lo que hace la E
{
  const preguntas = ['cercaDelMostrador', 'caballoCerca', 'feriaCerca', 'puestoDeCargasCerca', 'puertaCerca', 'rastro', 'mirandoAlPerro', 'puedoPedirRastro', 'puedeConducir', 'puedeSubirAlTren',
    'teEnLaAldea', 'enLaCasaDeTe', 'kayakCerca', 'accionVelaOTirolesa', 'enLaSalaDelFaro', 'enLaCarpa', 'puedeDormirJuntoAlFuego', 'dentroDeTuObra', 'cercaDelFuego', 'hayQueCocinar',
    'tendalCerca', 'rastroAlPie', 'ovejaCercana', 'jaulaCerca', 'puenteDelCaballo', 'puedeSentarseALaCita', 'enLasCargas', 'enElBanco', 'enElAlmacen', 'enLaFeria', 'urgente', 'lugarParaBajar',
    'marcaPerro', 'hachaCerca', 'semilla', 'aserrar', 'fuegoPropio', 'puedeArmarCarpa', 'fogonApagadoCerca', 'modoObra', 'charlaNpc', 'usarDesafioCerca'];
  const modulos = ['empleo', 'rincones', 'huevos', 'puestos', 'tablon', 'mecanica', 'granja', 'taller', 'fiesta', 'cantina', 'pena', 'recursos', 'duende'];
  const cercas = ['cantero', 'gallinero', 'telar', 'obraTrabaja', 'obraAldea', 'acopio', 'semillaArbol'];
  let s = 7;
  const azar = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const p = (x) => azar() < x;
  let casos = 0, conE = 0;
  for (let i = 0; i < 20000; i++) {
    const est = { js: { montado: p(0.1), enTren: p(0.08), enKayak: p(0.08), sentado: p(0.1) }, acciones: {}, cerca: {} };
    if (p(0.3)) est.objetivo = { tipo: p(0.3) ? 'sentarse' : 'planta', texto: 'Mirar' };
    if (p(0.15)) est.vecino = { nombre: 'Ercilia', enBase: p(0.5) };
    if (p(0.2)) est.desafio = {};
    for (const q of preguntas) est[q] = p(0.06) ? (q === 'usarDesafioCerca' ? true : { texto: q, hacer() {}, nombre: q, objetivo: 0, R: {}, plano: { id: 'fogon' } }) : (q === 'usarDesafioCerca' ? false : null);
    est.panelAbierto = () => false;
    est.avisoDesafioCerca = est.usarDesafioCerca ? 'Abrir el capullo' : null;   // (en el juego, las dos funciones del Desafío van juntas)
    for (const m of modulos) if (p(0.06)) est.acciones[m] = true;
    for (const c of cercas) if (p(0.06)) est.cerca[c] = {};
    const r = que(est);
    casos++;
    // lo que dice el aviso con la tecla E es lo que hace la E (salvo el capullo del Desafío, que puede no hacer nada)
    if (r.aviso && r.tecla === 'E' && r.avisoId !== 'desafio-cerca') { conE++; assert.equal(r.e, r.avisoId, `al azar (${i}): el aviso dice «${r.avisoId}» y la E hace «${r.e}»`); }
    // y si la E hace algo con texto, el aviso lo dice
    if (r.e && r.e !== 'desafio-cerca' && r.e !== 'huellas') {
      const en = INTERACCIONES[IDS.indexOf(r.e)];
      const c = contexto(est), t = en.aviso(c, en.cuando(c, false));
      if (t) assert.equal(r.avisoId, r.e, `al azar (${i}): la E hace «${r.e}» y el aviso dice «${r.avisoId}»`);
    }
    { const q = queHariaE(contexto(est)); if (q && !INTERACCIONES[IDS.indexOf(q)].sigueE) assert.equal(q, r.e, 'queHariaE elige lo mismo que la E'); }
  }
  n += casos;
  ok(conE > 3000, `al azar: ${casos} estados, ${conE} con aviso de E, todos iguales a lo que hace la E`);
}

// ---------------------------------------------------------------- 6. el texto del vecino (main.js: textoVecinoAviso)
{
  const texto = (est, v = { nombre: 'Ramón', enBase: true }) => funcionDeMain(main, 'textoVecinoAviso', {
    jugador: { estado: { enTren: !!est.enTren, montado: !!est.montado } }, desafio: est.desafio || null, textoOrdenar: (x) => `Darle una orden a ${x.nombre}`,
    amorJuego: { textoAviso: () => est.amor || null }, vecindadJuego: { invitado: () => (est.esperando ? 'esperando' : null), textoSentarse: () => 'Sentarte' },
    socialJuego: { quiereDecir: () => !!est.quiere },
  })(v);
  eq(texto({ desafio: {} }), 'Darle una orden a Ramón', 'en la base del Desafío, una orden');
  eq(texto({ enTren: true, amor: 'Empezar la cita', quiere: true }), 'Hablar con Ramón', 'en el tren, hablar (como antes)');
  eq(texto({ montado: true, quiere: true }), 'Hablar con Ramón', 'a caballo, hablar (o la cita)');
  eq(texto({ quiere: true }), 'Ramón te quiere decir algo', 'el que te vino a buscar');
}

ok(leer('package.json').includes('node pruebas/verificar-4-6-1-interacciones.mjs'), 'la prueba está en npm run verify');
console.log(`verificar-4-6-1-interacciones: ${n} comprobaciones OK · ${IDS.length} interacciones de la E y ${IDS_OTRAS.length} de las otras teclas, en una sola lista`);
