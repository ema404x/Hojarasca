// 2.9: el molino de agua, el aserradero, la estación meteorológica y la radio.
// Reglas puras (molino.js, meteo.js, radio.js), los planos (planos-maquinas.js, cargados
// con construccion.js de verdad sobre un arroyo de mentira), el clima siguiendo el
// programa (clima.js en una máquina virtual con el three local) y el cableado de main.js.
// Uso: node pruebas/verificar-2-9-maquinas.mjs
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import * as M from '../src/meteo.js';
import * as Mo from '../src/molino.js';
import * as R from '../src/radio.js';
import { azarDe } from '../src/semilla.js';
import { nocheEspecial, esNocheDeJefe, NOCHE_FINAL, desafioNuevo } from '../src/desafio-reglas.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const paso = (t) => { pasos++; console.log(`✓ ${t}`); };

// ---------------------------------------------------------------- meteo: el programa del tiempo
{
  assert.equal(M.sanearMeteo({ semilla: 77 }).semilla, 77);
  const nueva = M.sanearMeteo('basura', () => 0.5);
  assert.ok(nueva.semilla > 0 && Number.isInteger(nueva.semilla), 'una partida sin semilla recibe una');
  assert.notEqual(M.sanearMeteo({ semilla: -3 }, () => 0.1).semilla, -3);
  const s = 4242;
  // el mismo tramo da siempre lo mismo
  for (let k = 0; k < 50; k++) assert.equal(M.tipoEnTramo(s, k), M.tipoEnTramo(s, k));
  // la proporción de siempre: la mitad despejado, un quinto con agua
  const c = { despejado: 0, nublado: 0, lluvia: 0 };
  for (let k = 0; k < 16000; k++) c[M.tipoEnTramo(s, k)]++;
  assert.ok(c.despejado / 16000 > 0.42 && c.despejado / 16000 < 0.6, `despejado ${c.despejado}`);
  assert.ok(c.lluvia / 16000 > 0.12 && c.lluvia / 16000 < 0.26, `lluvia ${c.lluvia}`);
  for (let k = 0; k < 200; k++) assert.equal(M.tipoEnTramo(s, k, 'despejado'), 'despejado', 'con el ajuste «despejado» no llueve');
  let ll = 0; for (let k = 0; k < 4000; k++) if (M.tipoEnTramo(s, k, 'lluvioso') === 'lluvia') ll++;
  assert.ok(ll / 4000 > 0.62 && ll / 4000 < 0.78, 'con «lluvioso», siete de cada diez');
  // otra semilla, otro tiempo
  let distintos = 0; for (let k = 0; k < 200; k++) if (M.tipoEnTramo(s, k) !== M.tipoEnTramo(s + 1, k)) distintos++;
  assert.ok(distintos > 40, 'cada partida tiene su tiempo');
  assert.equal(M.tramoDe(M.horaAbsoluta(3, 7.5)), 3 * 8 + 2);
  assert.equal(M.diaDeTramo(3 * 8 + 7), 3);
  paso('el tiempo sale de la semilla, tramo por tramo, con la proporción de siempre');

  // el pronóstico dice lo que el programa va a hacer
  for (let dia = 1; dia < 40; dia++) {
    const d = M.pronosticoDia(s, dia, { estacion: 'auto' });
    const conAgua = d.tramos.filter((t) => t.tipo === 'lluvia');
    assert.equal(d.lluvia, conAgua.length > 0, `día ${dia}: lluvia en el pronóstico`);
    assert.deepEqual(d.partesLluvia, [...new Set(conAgua.map((t) => Math.floor(t.desde / 6)))].sort());
    for (const t of d.tramos) assert.equal(t.tipo, M.tipoEnTramo(s, t.k));
    if (d.lluvia) assert.match(d.texto, M.inviernoDelDia(dia, 'auto') ? /^Nevada/ : /^Lluvia con tormenta/);
    if (d.viento === 'fuerte') assert.match(d.texto, /viento fuerte/);
  }
  const hoy = M.pronostico(s, 5, 20);
  assert.equal(hoy[0].cuando, 'Hoy'); assert.equal(hoy[0].tramos.length, 2, 'de hoy, sólo lo que queda (18 a 24 h)');
  assert.deepEqual(hoy.map((d) => d.cuando), ['Hoy', 'Mañana', 'Pasado mañana']);
  assert.equal(M.pronostico(s, 5, 23.5, { dias: 2 }).length, 2);
  assert.equal(M.pronosticoDia(s, 9, { estacion: 'invierno', modo: 'lluvioso' }).nieve, true, 'en invierno, la lluvia es nevada');
  assert.equal(M.pronosticoDia(s, 9, { estacion: 'verano', modo: 'despejado' }).texto, 'Despejado');
  // el invierno de «auto», como en main.js
  assert.equal(M.inviernoDelDia(1, 'auto'), false); assert.equal(M.inviernoDelDia(10, 'auto'), true); assert.equal(M.inviernoDelDia(13, 'auto'), false);
  assert.match(leer('src/main.js'), /inv = smoothstep\(0\.63, 0\.73, fase\) \* \(1 - smoothstep\(0\.96, 1\.0, fase\)\)/, 'si cambian las estaciones, cambiar también inviernoDelDia');
  // el programa: segundos hasta el tramo siguiente
  let ahora = 3 * 24 + 7.5;
  const prog = M.crearPrograma({ ahora: () => ahora, segundosPorHora: () => 75, semilla: () => s, modo: () => 'variable' });
  assert.equal(prog.tramo(), 26);
  assert.equal(prog.segundosHasta(27), 1.5 * 75);
  assert.equal(prog.tipo(27), M.tipoEnTramo(s, 27));
  assert.equal(prog.firma(), `${s}`);
  ahora += 3; assert.equal(prog.tramo(), 27);
  paso('el pronóstico de la estación es el programa: hoy, mañana y pasado, con nieve y viento');
}

// ---------------------------------------------------------------- las noches del Desafío
{
  const d = { ...desafioNuevo(), oleadas: 5, semilla: 'COIHUE-4821' };
  // con código, el mismo azar de siempre (el de semilla.js)
  for (let n = 1; n < 30; n++) assert.equal(M.azarEspecial(d, null, n), azarDe('COIHUE-4821', n, 'especial')());
  // sin código, sale de la semilla del tiempo, siempre igual
  const sin = { ...d, semilla: null };
  assert.equal(M.azarEspecial(sin, { semilla: 99 }, 7), M.azarEspecial(sin, { semilla: 99 }, 7));
  assert.notEqual(M.azarEspecial(sin, { semilla: 99 }, 7), M.azarEspecial(sin, { semilla: 100 }, 7));
  // la estación anuncia lo que desafio.js va a decidir (la misma cadena: nunca dos seguidas)
  for (const meteo of [{ semilla: 5 }, { semilla: 6 }, { semilla: 71 }]) for (let ol = 0; ol < 22; ol++) {
    const x = { ...desafioNuevo(), oleadas: ol, especialAnterior: ol % 4 === 0 ? 'roja' : null, oleadaNoche: 3 };
    const [a, b] = M.nochesQueVienen(x, meteo, 4, 11);
    const n = ol + 1;
    const final = n >= NOCHE_FINAL;
    const esp1 = final ? null : nocheEspecial(n, M.azarEspecial(x, meteo, n), x.especialAnterior);
    assert.equal(a.n, n); assert.equal(a.clave, 4); assert.equal(a.cuando, 'Esta noche');
    assert.equal(a.tipo, final ? 'final' : esNocheDeJefe(n) ? 'jefe' : esp1 || 'comun', `noche ${n}`);
    const esp2 = n + 1 >= NOCHE_FINAL ? null : nocheEspecial(n + 1, M.azarEspecial(x, meteo, n + 1), esp1);
    assert.equal(b.especial ?? null, esp2, `la de mañana (${n + 1}) sigue la cadena`);
    assert.equal(b.cuando, 'Mañana a la noche');
  }
  // de noche, con la oleada ya en curso, la que viene es la de mañana
  const enCurso = { ...desafioNuevo(), oleadas: 6, especial: 'roja', oleadaNoche: 4 };
  const [c1] = M.nochesQueVienen(enCurso, { semilla: 5 }, 4, 22);
  assert.equal(c1.clave, 5); assert.equal(c1.n, 7); assert.equal(c1.cuando, 'Mañana a la noche');
  assert.equal(c1.especial ?? null, null, 'después de una noche roja no viene otra especial');
  // decidida una hora antes: se anuncia la decidida
  const decidida = { ...desafioNuevo(), oleadas: 6, especial: 'eclipse', oleadaNoche: 3 };
  assert.equal(M.nochesQueVienen(decidida, { semilla: 5 }, 4, 20)[0].tipo, 'eclipse');
  // con el nido reventado, calma
  const fin = { ...desafioNuevo(), oleadas: 25, victoria: true, nido: { caido: true } };
  assert.equal(M.nochesQueVienen(fin, { semilla: 5 }, 30, 10)[0].tipo, 'calma');
  assert.equal(M.nochesQueVienen({ ...desafioNuevo(), oleadas: 4 }, { semilla: 5 }, 4, 10)[0].tipo, 'jefe');
  assert.match(M.textoPronostico(M.pronostico(5, 4, 10), M.nochesQueVienen({ ...desafioNuevo(), oleadas: 4 }, { semilla: 5 }, 4, 10)), /Esta noche: Sale un mandamás\./);   // 3.8.0: el jefe de nido es el mandamás
  const des = leer('src/desafio.js');
  assert.match(des, /nocheEspecial\(d\.oleadas \+ 1, azarEspecial\(d, p\.meteo, d\.oleadas \+ 1\), d\.especialAnterior\)/, 'desafio.js decide la noche con el mismo azar');
  assert.match(des, /^import \{ azarEspecial \} from '\.\/meteo\.js';$/m);
  paso('en el Desafío, la estación anuncia la noche del jefe, la final y las especiales, y acierta');
}

// ---------------------------------------------------------------- molino y aserradero
{
  const a = Mo.sanearAserradero({ troncos: 99, tablas: -3, avance: 'x', hora: 'nada' });
  assert.deepEqual(a, { troncos: Mo.MOLINO.capacidad, avance: 0, tablas: 0, hora: null });
  assert.deepEqual(Mo.sanearAserradero(null), Mo.aserraderoVacio());
  assert.deepEqual(Mo.sanearMuela([1, 2]), Mo.muelaVacia());
  // la primera mirada no cuenta; después, las horas que pasaron, con tope
  const e = Mo.aserraderoVacio();
  assert.equal(Mo.horasDesde(e, 100), 0); assert.equal(e.hora, 100);
  assert.equal(Mo.horasDesde(e, 103.5), 3.5);
  assert.equal(Mo.horasDesde(e, 1000), Mo.MOLINO.topeHoras, 'a lo sumo dos días de una vez');
  assert.equal(Mo.horasDesde(e, 10), 0, 'si el reloj vuelve atrás, no cuenta');
  // aserrar: cinco tablas por tronco, más rápido con el arroyo crecido y lento en invierno
  const b = Mo.aserraderoVacio();
  let r = Mo.usarAserradero(b, 20, true);
  assert.deepEqual(r, { accion: 'cargar', troncos: Mo.MOLINO.capacidad, sinMolino: false });
  assert.equal(Mo.avanzarAserradero(b, Mo.MOLINO.horasPorTronco * 3 + 0.1, 1), 3);
  assert.equal(b.tablas, 15); assert.equal(b.troncos, 9);
  assert.equal(Mo.fuerzaDelAgua({ invierno: 1 }), 0.5); assert.ok(Mo.fuerzaDelAgua({ crecida: 1 }) > 1.4);
  assert.equal(Mo.avanzarAserradero(b, Mo.MOLINO.horasPorTronco * 2, 0.5), 1, 'en invierno, a media máquina');
  r = Mo.usarAserradero(b, 0, true);
  assert.deepEqual(r, { accion: 'sacar', tablas: 20 }); assert.equal(b.tablas, 0);
  assert.equal(Mo.usarAserradero(b, 0, true).accion, 'aserrando');
  assert.equal(Mo.usarAserradero(b, 0, false).accion, 'sinMolino');
  Mo.avanzarAserradero(b, 48, 1);
  assert.equal(b.troncos, 0); assert.equal(b.avance, 0); assert.equal(b.tablas, 40);
  // lleno de tablas, la sierra para
  const lleno = { troncos: 5, avance: 0, tablas: Mo.MOLINO.topeTablas - 2, hora: 0 };
  assert.equal(Mo.avanzarAserradero(lleno, 20, 1), 0); assert.equal(Mo.aserrando(lleno), false);
  assert.match(Mo.avisoAserradero(Mo.aserraderoVacio(), 3, true), /Cargar troncos en el aserradero \(3\)/);
  assert.match(Mo.avisoAserradero(Mo.aserraderoVacio(), 0, false), /no hay un molino de agua cerca/);
  assert.match(Mo.avisoAserradero({ troncos: 0, tablas: 7 }, 3, true), /Sacar las tablas del aserradero \(7\)/);
  // la muela: dos habas, una medida de harina
  const m = Mo.muelaVacia();
  assert.equal(Mo.usarMolino(m, 1).accion, 'girando', 'con una haba sola no alcanza');
  assert.deepEqual(Mo.usarMolino(m, 5), { accion: 'cargar', habas: 5 });
  assert.equal(Mo.avanzarMuela(m, 10, 1), 2); assert.equal(m.habas, 1); assert.equal(m.avance, 0);
  assert.deepEqual(Mo.usarMolino(m, 0), { accion: 'sacar', harina: 2 });
  assert.equal(Mo.avisoMolino(Mo.muelaVacia(), 0), 'Molino de agua: la rueda gira');
  assert.match(Mo.avisoMolino(Mo.muelaVacia(), 4), /Echar habas a la muela \(4\)/);
  // el molino que mueve al aserradero: el más cercano, a menos de 14 m
  assert.equal(Mo.molinoQueMueve({ x: 0, z: 0 }, [{ x: 20, z: 0 }]), null);
  assert.deepEqual(Mo.molinoQueMueve({ x: 0, z: 0 }, [{ x: 12, z: 0 }, { x: 5, z: 5 }]), { x: 5, z: 5 });
  paso('el aserradero y la muela trabajan solos, se ponen al día con tope y paran llenos');
}

// ---------------------------------------------------------------- la radio
{
  const r = R.sanearRadio({ dia: 'x', oidos: ['r-luces', 'inventado', '__proto__'], pedido: '__proto__', hechos: 7, ultimo: { de: 1 } });
  assert.deepEqual(r, { dia: 0, oidos: ['r-luces'], pedido: null, hechos: [], ultimo: null });
  assert.equal(R.pedidoRadio('constructor'), null); assert.equal(R.nombreEstacionRadio('toString'), 'Alguien, lejos');
  const radio = R.radioNueva();
  assert.equal(R.escucharRadio(radio, { dia: 1, horas: 5 }).nuevo, false, 'de madrugada, estática');
  assert.equal(radio.dia, 0);
  const tiempos = M.pronostico(8, 1, 12);
  const uno = R.escucharRadio(radio, { dia: 1, horas: 12, pronostico: tiempos });
  assert.ok(uno.nuevo && uno.de && uno.texto.length > 20);
  const otra = R.escucharRadio(radio, { dia: 1, horas: 18, pronostico: tiempos });
  assert.equal(otra.nuevo, false, 'una vez por día'); assert.equal(otra.texto, uno.texto, 'se repite lo último');
  // pocos: en veinte días no se agotan de golpe ni se repite un rumor
  const vistos = [];
  for (let d = 2; d < 22; d++) { const o = R.escucharRadio(radio, { dia: d, horas: 12, pronostico: M.pronostico(8, d, 12) }); vistos.push(o); }
  assert.ok(vistos.every((o) => o.nuevo));
  assert.equal(new Set(radio.oidos).size, radio.oidos.length);
  // los avisos del tiempo son ciertos: sólo si el pronóstico trae agua o viento
  const soloSol = [{ cuando: 'Mañana', lluvia: false, viento: 'calmo', texto: 'Despejado' }];
  const sinAviso = R.escucharRadio(R.radioNueva(), { dia: 2, horas: 12, pronostico: soloSol });
  assert.doesNotMatch(sinAviso.texto, /Anuncian|barómetro|sombrero/);
  const conAgua = [{ cuando: 'Mañana', lluvia: true, nieve: false, viento: 'fuerte', texto: 'Lluvia con tormenta a la tarde' }];
  assert.match(R.escucharRadio(R.radioNueva(), { dia: 2, horas: 12, pronostico: conAgua }).texto, /lluvia y tormenta para mañana/);
  // en el Desafío avisa la noche especial
  const noche = [{ cuando: 'Esta noche', tipo: 'roja', texto: 'Noche roja: el cielo del oeste se tiñe de rojo' }];
  assert.match(R.escucharRadio(R.radioNueva(), { dia: 3, horas: 12, noches: noche, desafio: true }).texto, /noche roja/);
  // un pedido: se anuncia, se junta y se manda
  const q = R.radioNueva();
  const o = R.escucharRadio(q, { dia: 1, horas: 12, pronostico: soloSol });
  assert.equal(o.pedido, 'p-techo'); assert.equal(q.pedido, 'p-techo');
  const mats = { tabla: 5 }, cosas = {};
  assert.equal(R.cumplirPedido(q, mats, cosas), null, 'faltan tablas');
  mats.tabla = 10;
  const p = R.cumplirPedido(q, mats, cosas);
  assert.equal(p.id, 'p-techo'); assert.equal(mats.tabla, 2); assert.equal(q.pedido, null); assert.deepEqual(q.hechos, ['p-techo']);
  assert.ok(p.premio.cuenta.yerba > 0);
  assert.equal(R.textoPide(R.pedidoRadio('p-harina')), '2 medidas de harina');
  assert.ok(R.alcanzaPedido(R.pedidoRadio('p-harina'), {}, { harina: 2 }));
  assert.ok(R.PEDIDOS_RADIO.length <= 6 && R.RUMORES.length <= 8, 'la radio es compañía, no un noticiero');
  paso('la radio: una vez por día, avisos del tiempo ciertos, rumores y pedidos que se mandan con la trochita');
}

// ---------------------------------------------------------------- los planos, con construccion.js de verdad
const idModulo = (archivo) => '__mod_' + path.basename(archivo, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
function cargar(raices, final) {
  const info = new Map(), orden = [], visitando = new Set(), visitado = new Set();
  const visitar = (archivo) => {
    archivo = path.resolve(archivo); if (visitado.has(archivo)) return;
    if (visitando.has(archivo)) throw Error('ciclo ' + archivo); visitando.add(archivo);
    const texto = fs.readFileSync(archivo, 'utf8'), deps = [];
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') deps.push(path.resolve(path.dirname(archivo), m[2]));
    info.set(archivo, texto); for (const d of deps) visitar(d);
    visitando.delete(archivo); visitado.add(archivo); orden.push(archivo);
  };
  for (const r of raices) visitar(path.join(raiz, 'src', r));
  let code = leer('three-r186-inline.js') + '\n';
  for (const f of orden) {
    let t = info.get(f); const ex = [];
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) ex.push(m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, nombres, spec) => {
      const partes = nombres.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return b ? `${a.trim()}: ${b.trim()}` : a.trim(); });
      return `const { ${partes.join(', ')} } = ${idModulo(path.resolve(path.dirname(f), spec))};`;
    });
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    code += `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  }
  code += final;
  const ctx = { console, performance, setTimeout, clearTimeout, Math, Date, globalThis: null };
  ctx.globalThis = ctx; ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'maquinas-vm.js' });
  // del otro reino a éste (los arreglos de la máquina virtual no son los de acá)
  const r = ctx.__R;
  return JSON.parse(JSON.stringify({ ...r, tipo: undefined }));
}
{
  const r = cargar(['construccion.js', 'planos-maquinas.js', 'molino-mundo.js', 'meteo-mundo.js'], `
  globalThis.__R = (() => {
    const C = __mod_construccion, P = __mod_planos_maquinas;
    const ids = C.PLANOS.map((p) => p.id);
    // un arroyo de mentira: agua al este de x = 10 (nivel -0.6), tierra plana al oeste
    const T = { altura: (x) => (x > 10 ? -1.2 : 0), agua: (x) => (x > 10 ? { nivel: -0.6, prof: 0.6, lago: false } : null),
      normal: () => new THREE.Vector3(0, 1, 0), indice: () => 0, distRiel: [999], distSendero: [999], lugares: {}, rio: [] };
    const obs = [];
    const col = { agregar: (o) => obs.push(o), agregarPlataforma() {}, eliminarPorDuenio(d) { for (let i = obs.length - 1; i >= 0; i--) if (obs[i].duenio === d) obs.splice(i, 1); } };
    const s = C.crearConstruccion(T, new THREE.Scene(), col, { arboles: [], despejar() {} }, { agregar() {}, agregarPostigos() {}, eliminarPorDuenio() {} });
    const mats = { tronco: 999, tabla: 999, piedra: 999, lana: 99 };
    const intentar = (id, x, z, yaw = 0) => {
      s.elegir(C.PLANO[id]); const f = s.fundar(x, z, yaw);
      if (!f.ok) { s.elegir(null); return { ok: false, motivo: f.motivo }; }
      while (f.obra.datos.etapas < f.obra.plano.etapas.length) { const k = s.avanzar(f.obra, mats); if (!k.ok) throw Error(id + ': ' + k.motivo); }
      s.elegir(null);
      return { ok: true, obra: f.obra };
    };
    const lejos = intentar('molino-agua', -20, 0);
    const alReves = intentar('molino-agua', 8.5, 0, Math.PI);
    const bien = intentar('molino-agua', 8.5, 0, 0);
    const aserradero = intentar('aserradero', 0, 6);
    const estacion = intentar('estacion-meteo', -6, -6);
    const radio = intentar('radio-refugio', -10, 8);
    // qué tipos de material usa cada plano (sólo madera/piedra: 0 y 4)
    const tipos = {};
    for (const p of P.PLANOS_MAQUINAS) {
      const vistos = new Set();
      const c = { agregar: (g, o) => { vistos.add(o.tipo); } };
      for (const e of p.etapas) e.arma(c, p);
      tipos[p.id] = [...vistos];
    }
    // lo que se mueve
    const MM = __mod_molino_mundo.crearMolinoMundo(T, new THREE.Scene());
    MM.sincronizar([{ datos: bien.obra.datos, vel: 0.9 }], [{ datos: aserradero.obra.datos, trabajando: true }]);
    const rueda = MM.ruedas.get(bien.obra.datos), sierra = MM.sierras.get(aserradero.obra.datos);
    const x0 = rueda.giro.rotation.x; MM.animar(0.5); MM.animar(0.5);
    const giro = rueda.giro.rotation.x - x0, sierraGira = sierra.vel > 0;
    MM.sincronizar([], []);
    const MT = __mod_meteo_mundo.crearMeteoMundo(T, new THREE.Scene());
    MT.sincronizar([estacion.obra.datos]); MT.animar(0.3, 0.8, 0.1);
    const cazoletas = [...MT.estaciones.values()][0].cazoletas.rotation.y;
    return {
      ids, lejos, alReves, bien: bien.ok, datosBien: bien.ok && { x: bien.obra.datos.x, rot: bien.obra.datos.rot },
      aserradero: aserradero.ok, estacion: estacion.ok, radio: radio.ok, tipos, obs: obs.length,
      ruedaY: rueda.g.position.y, ruedaX: rueda.g.position.x, giro, sierraGira, quedan: MM.ruedas.size + MM.sierras.size, cazoletas,
      categorias: Object.fromEntries(P.PLANOS_MAQUINAS.map((p) => [p.id, C.PLANO[p.id].categoria])),
    };
  })();`);
  for (const id of ['molino-agua', 'aserradero', 'estacion-meteo', 'radio-refugio']) assert.ok(r.ids.includes(id), `plano ${id}`);
  assert.equal(new Set(r.ids).size, r.ids.length, 'ningún id de plano repetido');
  assert.ok(r.ids.includes('puesto') && r.ids.includes('colmena') && r.ids.includes('galponcito'), 'los planos de antes siguen');
  assert.equal(r.lejos.ok, false); assert.match(r.lejos.motivo, /arroyo/);
  assert.equal(r.alReves.ok, false); assert.match(r.alReves.motivo, /Girala/);
  assert.ok(r.bien, 'el molino en la orilla, con la rueda sobre el agua');
  assert.ok(r.aserradero && r.estacion && r.radio, 'el aserradero, la estación y la radio se levantan');
  for (const [id, t] of Object.entries(r.tipos)) assert.deepEqual(t.filter((x) => x !== 0 && x !== 4), [], `${id}: sólo madera (0) y piedra (4)`);
  assert.ok(r.obs >= 7, 'las máquinas tienen cuerpo');
  assert.ok(Math.abs(r.ruedaX - (8.5 + 1.85)) < 0.01 && Math.abs(r.ruedaY - (-0.6 + 1.15 - 0.3)) < 0.01, 'la rueda cae sobre el agua, hundida un poco');
  assert.ok(r.giro < -0.5, 'la rueda gira'); assert.ok(r.sierraGira, 'la sierra arranca'); assert.equal(r.quedan, 0, 'lo que no está se suelta');
  assert.ok(r.cazoletas > 1, 'el anemómetro gira con el viento');
  assert.deepEqual(r.categorias, { 'molino-agua': 'trabajo', aserradero: 'trabajo', 'estacion-meteo': 'exterior', 'radio-refugio': 'mobiliario' });
  paso('los planos: el molino sólo en la orilla del arroyo, todos con madera y piedra, y lo que se mueve se mueve');
}

// ---------------------------------------------------------------- el clima sigue el programa
{
  const r = cargar(['clima.js', 'meteo.js'], `
  globalThis.__R = (() => {
    const Me = __mod_meteo;
    const T = { indice: () => 0, estepa: [0], bosque: [1], altura: () => 0, val: () => 0 };
    const ajustes = { clima: 'variable' };
    const clima = __mod_clima.crearClima(new THREE.Scene(), T, ajustes);
    const P = { dia: 3, horas: 9.2 }, semilla = 31337;
    clima.usarPrograma(Me.crearPrograma({ ahora: () => P.dia * 24 + P.horas, segundosPorHora: () => 75, semilla: () => semilla, modo: () => ajustes.clima }));
    const mundo = { invierno: 0, otono: 0, noche: 0, sonido: { trueno() {} }, chimenea: { x: 0, y: 0, z: 0 } };
    const cam = { x: 0, y: 1, z: 0 };
    const salida = [];
    // un día y medio de juego, de a 0,5 s (el reloj corre como en main.js: 75 s por hora)
    for (let i = 0; i < 36 * 150; i++) {
      P.horas += 0.5 / 75; if (P.horas >= 24) { P.horas -= 24; P.dia++; }
      clima.actualizar(0.5, cam, mundo);
      if (i % 50 === 0) salida.push({ k: Me.tramoDe(P.dia * 24 + P.horas), objetivo: clima.estado.objetivo, proximo: clima.estado.proximo, t: clima.estado.t });
    }
    // dormir: el reloj salta ocho horas y el clima se pone al día
    P.horas += 8; if (P.horas >= 24) { P.horas -= 24; P.dia++; }
    clima.actualizar(0.05, cam, mundo);
    const despues = { k: Me.tramoDe(P.dia * 24 + P.horas), objetivo: clima.estado.objetivo };
    ajustes.clima = 'despejado'; clima.actualizar(0.05, cam, mundo);
    const despejado = clima.estado.objetivo;
    return { salida, despues, despejado, tipo: (k) => Me.tipoEnTramo(semilla, k) , tipos: salida.map((x) => [Me.tipoEnTramo(semilla, x.k), Me.tipoEnTramo(semilla, x.k + 1)]), tipoDespues: Me.tipoEnTramo(semilla, despues.k) };
  })();`);
  let bien = 0;
  r.salida.forEach((x, i) => {
    const [ahora, luego] = r.tipos[i];
    // en el borde del tramo puede ir un cuadro adelantado: se tolera el primero
    if (x.objetivo === ahora && x.proximo === luego) bien++;
    assert.ok(x.t > 0 && x.t <= 3 * 75 + 1, 'el cambio que viene está a menos de un tramo');
  });
  assert.ok(bien >= r.salida.length - 2, `el clima es el del programa (${bien} de ${r.salida.length})`);
  assert.equal(r.despues.objetivo, r.tipoDespues, 'al despertar, el tiempo es el del tramo de ahora');
  assert.equal(r.despejado, 'despejado', 'el ajuste «despejado» sigue mandando');
  const clima = leer('src/clima.js');
  assert.match(clima, /estado\.objetivo = estado\.proximo; estado\.proximo = elegirClima\(\)/, 'el cambio con anticipación de la 2.1 sigue');
  paso('el clima sigue el programa tramo a tramo, se pone al día al dormir y respeta el ajuste');
}

// ---------------------------------------------------------------- el cableado
{
  const main = leer('src/main.js'), cons = leer('src/construccion.js');
  assert.match(cons, /^import \{ PLANOS_MAQUINAS \} from '\.\/planos-maquinas\.js';$/m);
  assert.match(cons, /^PLANOS\.push\(\.\.\.PLANOS_MAQUINAS\);$/m);
  assert.match(cons, /plano\.revisarLugar\(\{ T, x, z, rot, base, sobrePlataforma \}\)/);
  assert.match(main, /^OBRAS_QUE_TRABAJAN\.push\(\.\.\.MAQUINAS_QUE_TRABAJAN\);$/m);
  assert.match(main, /case 'molino-agua': case 'aserradero': case 'estacion-meteo': case 'radio-refugio': return avisoMaquina\(o\);/, 'el aviso');
  assert.match(main, /if \(usarMaquina\(o\)\) \{ refrescarBarra\(true\); guardar\(\); return; \}/, 'la tecla E, por el mismo camino');
  assert.match(main, /clima\.usarPrograma\(programaDelTiempo\(\)\);/);
  assert.match(main, /if \(modo === 'jugando'\) actualizarMaquinas\(dt\);/);
  const handle = main.slice(main.indexOf('if (HOJARASCA_DEBUG) Object.assign(window.__hojarasca, {'));
  assert.equal(handle.split('__maquinas:').length - 1, 1);
  // los identificadores exportados sin eñe (los cargadores de las pruebas usan [\w$])
  for (const f of ['molino.js', 'meteo.js', 'radio.js', 'planos-maquinas.js', 'molino-mundo.js', 'meteo-mundo.js']) {
    const t = leer(`src/${f}`);
    for (const m of t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([^\s(=]+)/gm)) assert.match(m[1], /^[\w$]+$/, `${f}: ${m[1]}`);
    assert.doesNotMatch(t, /^export\s+(async\s+function|function\*|\{|.*\bfrom\b)/m, `${f}: armar.mjs no lo entiende`);
    // el three local no trae todas las geometrías
    for (const g of t.matchAll(/new THREE\.(\w+Geometry)/g)) assert.ok(['BoxGeometry', 'CylinderGeometry', 'IcosahedronGeometry', 'ConeGeometry', 'TorusGeometry', 'CircleGeometry', 'SphereGeometry', 'PlaneGeometry', 'RingGeometry'].includes(g[1]), `${f}: ${g[1]}`);
  }
  for (const f of ['molino.js', 'meteo.js', 'radio.js']) assert.doesNotMatch(leer(`src/${f}`), /from 'three'|document\.|window\./, `${f} es puro`);
  const pkg = JSON.parse(leer('package.json'));
  assert.match(pkg.scripts.verify, /node pruebas\/verificar-2-9-maquinas\.mjs/);
  paso('el cableado: los planos, la tecla E y el aviso, el clima y el handle de depuración');
}

console.log(`\n2.9 máquinas: ${pasos} grupos de pruebas en verde`);
