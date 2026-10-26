// 4.8 (ataques): las noches de los duendes ya no se parecen entre sí.
//   1. los lados de entrada (río, monte, camino): el plan de cada base sobre el terreno real, la elección de
//      cada noche (determinista, nunca más de dos seguidas) y lo que se guarda
//   2. las tácticas en grupo (señuelos y rodeo): reglas puras
//   3. el curandero: cura con límite, se queda atrás, huye
//   4. el enjambre: cuántos, de dónde salen, cómo zumban, cuánto cuestan
//   5. la composición por noche y dificultad (y que el techo de siempre se respete)
//   6. el reciclado de los invasores (todo campo nuevo se limpia) y el enganche con el juego
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { generarTerreno } from '../src/terreno.js';
import { SITIOS, BASE_REFUGIO } from '../src/desafio-mapa.js';
import { LIMITE, LAGO } from '../src/config.js';
import { PALABRAS } from '../src/semilla.js';
import * as L from '../src/desafio-lados.js';
import * as TA from '../src/desafio-tacticas.js';
import * as N from '../src/desafio-duendes-nuevos.js';
import { crearAtaques, FUERA_DE_LA_BASE, DISTANCIA_ENTRADA, MAX_INVASORES } from '../src/desafio-ataques.js';
import { TIPOS_ALIEN, composicionOleada, aplicarEspecial, ESPECIALES, sanearDesafio, DIFICULTADES, NOCHE_JEFE, esNocheDeJefe } from '../src/desafio-reglas.js';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const T = generarTerreno();
const lugares = Object.values(T.lugares);
const muestra = L.muestraDelTerreno(T, { lugares });
const BASES = [[BASE_REFUGIO.x, BASE_REFUGIO.z], ...SITIOS.bases].map(([x, z]) => ({ x, z }));
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// ================================================================ 1. los lados
{
  ok(JSON.stringify(L.LADOS) === JSON.stringify(['rio', 'monte', 'camino']), 'los tres lados: río, monte y camino');
  const planes = BASES.map((b) => L.planDeLados(b, muestra));
  planes.forEach((p, i) => {
    const b = BASES[i], ids = Object.keys(p.lados);
    ok(ids.length >= 2, `base ${i}: al menos dos lados (${ids.join(',')})`);
    ok(JSON.stringify(p.disponibles) === JSON.stringify(L.LADOS.filter((l) => p.lados[l])), `base ${i}: disponibles en orden`);
    for (const id of ids) {
      const v = p.lados[id];
      ok(v.puntos.length >= L.MIN_PUNTOS && v.puntos.length <= L.MAX_PUNTOS, `base ${i} ${id}: ${v.puntos.length} puntos`);
      for (const q of v.puntos) {
        ok(muestra.valido(q.x, q.z), `base ${i} ${id}: el punto (${q.x}, ${q.z}) es tierra, plano y dentro del valle`);
        ok(!T.agua(q.x, q.z), `base ${i} ${id}: fuera del agua`);
        ok(Math.abs(q.x) < LIMITE - 25 && Math.abs(q.z) < LIMITE - 25, `base ${i} ${id}: dentro del valle`);
        ok(muestra.caminable(q, b), `base ${i} ${id}: sin lago entre el punto y la base`);
        const d = dist(q, b);
        ok(d >= L.ANILLO.desde - 1 && d <= L.ANILLO.hastaRio + 1, `base ${i} ${id}: a ${Math.round(d)} m de la base`);
        for (const lg of lugares) ok(Math.hypot(lg.x - q.x, lg.z - q.z) >= 22, `base ${i} ${id}: lejos de un lugar del valle`);
      }
    }
    // los lados se distinguen: rumbos separados por más de ~60°
    for (let a = 0; a < ids.length; a++) for (let c = a + 1; c < ids.length; c++) {
      const d = Math.abs(Math.atan2(Math.sin(p.lados[ids[a]].rumbo - p.lados[ids[c]].rumbo), Math.cos(p.lados[ids[a]].rumbo - p.lados[ids[c]].rumbo)));
      ok(d >= 0.9, `base ${i}: ${ids[a]} y ${ids[c]} a ${Math.round(d * 57.3)}° uno del otro`);
    }
    // el plan sólo depende del terreno y de la base: sale igual cada vez
    ok(JSON.stringify(L.planDeLados(b, muestra)) === JSON.stringify(p), `base ${i}: el plan es siempre el mismo`);
  });
  ok(planes.filter((p) => p.disponibles.length === 3).length >= 8, 'la mayoría de las bases tiene los tres lados');
  ok(planes[0].disponibles.length === 3, 'el refugio (la base de siempre) tiene los tres lados');
  // el monte cae en el bosque y el camino cerca de un sendero, de verdad (no sólo un rumbo)
  {
    const p = planes[0];
    const med = (id, f) => p.lados[id].puntos.reduce((s, q) => s + f(q), 0) / p.lados[id].puntos.length;
    ok(med('monte', (q) => T.bosque[T.indice(q.x, q.z)]) > 0.45, 'los puntos del monte están en el bosque');
    ok(med('camino', (q) => T.distSendero[T.indice(q.x, q.z)]) < 22, 'los puntos del camino están cerca de un sendero');
  }

  // ---- las reglas del terreno: el agua y el lago no se pisan ni se cruzan
  {
    ok(!muestra.valido(LAGO.x, LAGO.z), 'el medio del lago no es un punto de entrada');
    ok(!muestra.caminable({ x: LAGO.x - 150, z: LAGO.z }, { x: LAGO.x + 150, z: LAGO.z }), 'no se camina a través del lago');
    ok(muestra.caminable({ x: BASE_REFUGIO.x, z: BASE_REFUGIO.z }, { x: BASE_REFUGIO.x + 40, z: BASE_REFUGIO.z + 40 }), 'pero sí por tierra');
    ok(!muestra.valido(LIMITE, 0) && !muestra.valido(0, -LIMITE + 10), 'ni el borde del valle');
    let agua = null;   // un punto de agua del río (no del lago)
    for (let x = -400; x <= 400 && !agua; x += 4) for (let z = -400; z <= 400 && !agua; z += 4) { const w = T.agua(x, z); if (w && !w.lago) agua = { x, z }; }
    ok(agua && !muestra.valido(agua.x, agua.z), 'el agua del río no es un punto de entrada');
    const empinado = (() => { for (let x = -400; x <= 400; x += 6) for (let z = -400; z <= 400; z += 6) if (!T.agua(x, z) && T.pendiente[T.indice(x, z)] > 0.5) return { x, z }; return null; })();
    ok(empinado && !muestra.valido(empinado.x, empinado.z), 'ni una ladera empinada');
    ok(!muestra.valido(lugares[0].x + 5, lugares[0].z), 'ni pegado a un lugar del valle');
  }
  // ---- el lado de cada noche
  const semillas = [];
  for (let i = 0; i < 40; i++) semillas.push(`${PALABRAS[i % PALABRAS.length]}-${1000 + i * 91}`);
  for (const s of semillas) {
    const sec = L.secuenciaDeLados(s, 60);
    ok(L.secuenciaDeLados(s, 60).join() === sec.join(), `${s}: la misma secuencia cada vez`);
    for (let i = 2; i < sec.length; i++) ok(!(sec[i] === sec[i - 1] && sec[i] === sec[i - 2]), `${s}: noche ${i + 1} repite el lado tres veces seguidas`);
    ok(sec.every((x) => L.LADOS.includes(x)), `${s}: sólo lados que existen`);
    ok(new Set(sec).size === 3, `${s}: en 60 noches aparecen los tres`);
    // ladoDeLaNoche(n) es lo mismo que el n-ésimo de la secuencia
    for (const n of [1, 2, 7, 33, 60]) ok(L.ladoDeLaNoche(s, n) === sec[n - 1], `${s}: la noche ${n} sale igual suelta que en la secuencia`);
  }
  ok(new Set(semillas.map((s) => L.secuenciaDeLados(s, 12).join())).size >= 30, 'cada semilla tiene su propia secuencia');
  ok(L.secuenciaDeLados('COIHUE-4821', 12).join() !== L.secuenciaDeLados('LENGA-12', 12).join(), 'otra semilla, otra secuencia');
  // sin código: siempre la misma (reproducible), también sin repetir tres veces
  { const sec = L.secuenciaDeLados(null, 60); for (let i = 2; i < sec.length; i++) ok(!(sec[i] === sec[i - 1] && sec[i] === sec[i - 2]), 'sin código tampoco'); ok(L.secuenciaDeLados('', 30).join() === L.secuenciaDeLados(null, 30).join(), 'sin código: la misma'); }
  // con dos lados, alternan sin repetir tres veces; con uno, ése; con ninguno, nada
  {
    const sec = L.secuenciaDeLados('PUDU-4253', 80, ['rio', 'camino']);
    ok(sec.every((x) => x === 'rio' || x === 'camino') && new Set(sec).size === 2, 'con dos lados disponibles usa los dos');
    for (let i = 2; i < sec.length; i++) ok(!(sec[i] === sec[i - 1] && sec[i] === sec[i - 2]), 'con dos lados, nunca tres seguidas');
    ok(L.secuenciaDeLados('PUDU-4253', 5, ['monte']).every((x) => x === 'monte'), 'con un solo lado, ése');
    ok(L.ladoDeLaNoche('PUDU-4253', 3, []) === null, 'sin lados, nada');
    ok(L.ladoDeLaNoche('PUDU-4253', 'x') !== undefined && L.ladoDeLaNoche('PUDU-4253', NaN) !== undefined && L.ladoDeLaNoche('PUDU-4253', -4) !== undefined, 'una noche rara no rompe');
  }
  // el lado de distracción: otro, y repetible
  for (const s of semillas.slice(0, 10)) for (let n = 1; n <= 10; n++) {
    const p = L.ladoDeLaNoche(s, n), o = L.ladoDeDistraccion(s, n, p);
    ok(o && o !== p && L.LADOS.includes(o), `${s} noche ${n}: distrae por otro lado`);
    ok(o === L.ladoDeDistraccion(s, n, p), 'y siempre el mismo');
  }
  ok(L.ladoDeDistraccion('X-1', 4, 'rio', ['rio']) === null, 'con un solo lado no hay distracción');

  // ---- el punto de la noche
  {
    const p = planes[0];
    const a = L.ladoNocheNuevo(p, 'COIHUE-4821', 5), b = L.ladoNocheNuevo(p, 'COIHUE-4821', 5);
    ok(JSON.stringify(a) === JSON.stringify(b), 'el lado de la noche es reproducible');
    ok(a.id === L.ladoDeLaNoche('COIHUE-4821', 5, p.disponibles) && a.noche === 5, 'el id y la noche');
    ok(p.lados[a.id].puntos.some((q) => q.x === a.x && q.z === a.z), 'el punto es uno de los del plan');
    ok(Math.abs(a.rumbo - Math.atan2(a.x - p.base.x, a.z - p.base.z)) < 1e-9, 'el rumbo es atan2(dx, dz) desde la base');
    ok(a.otro && a.otro.id !== a.id && p.lados[a.otro.id].puntos.some((q) => q.x === a.otro.x), 'y el otro lado, con su punto');
    // si el primer punto elegido está ocupado, sigue con otro libre
    const ocupado = new Set([`${a.x},${a.z}`]);
    const c = L.ladoNocheNuevo(p, 'COIHUE-4821', 5, (x, z) => !ocupado.has(`${x},${z}`));
    ok(c.x !== a.x || c.z !== a.z, 'un punto ocupado se saltea');
    const nada = L.ladoNocheNuevo(p, 'COIHUE-4821', 5, () => false);
    ok(nada && nada.id === a.id, 'si todo está ocupado, igual hay punto (el primero)');
    ok(L.ladoNocheNuevo({ base: p.base, lados: {}, disponibles: [] }, 'X-1', 3) === null || true, 'un plan vacío no rompe');
    // distintas noches, distintos puntos (no siempre el mismo rincón del lado)
    const pts = new Set(); for (let n = 1; n <= 40; n++) { const q = L.ladoNocheNuevo(p, 'COIHUE-4821', n); pts.add(`${q.id}:${q.x},${q.z}`); }
    ok(pts.size >= 8, `en 40 noches hay variedad de puntos (${pts.size})`);
  }
  // ---- lo que se guarda
  {
    const buena = { id: 'monte', x: -135, z: 292, rumbo: 0.2, noche: 3, otro: { id: 'rio', x: -10, z: 150, rumbo: 2 } };
    ok(JSON.stringify(L.sanearLadoNoche(buena)) === JSON.stringify({ ...buena }), 'un lado bueno pasa tal cual');
    ok(L.sanearLadoNoche({ ...buena, anulado: true }).anulado === true, 'y se acuerda de que se anuló');
    for (const mala of [null, undefined, 5, 'monte', [], {}, { ...buena, id: 'constructor' }, { ...buena, id: '__proto__' }, { ...buena, x: 'a' }, { ...buena, z: null }, { ...buena, x: 99999 }, { ...buena, noche: null }, { ...buena, x: true }]) ok(L.sanearLadoNoche(mala) === null, `un lado malo se descarta: ${JSON.stringify(mala)}`);
    ok(L.sanearLadoNoche({ ...buena, otro: { id: 'monte', x: 1, z: 1 } }).otro === null, 'el otro lado no puede ser el mismo');
    ok(L.sanearLadoNoche({ ...buena, otro: { id: 'x', x: 1, z: 1 } }).otro === null, 'ni inventado');
    ok(L.sanearLadoNoche({ ...buena, rumbo: 'zzz' }).rumbo === 0, 'un rumbo raro queda en 0');
    // dentro de la partida
    ok(sanearDesafio({ ladoNoche: buena }).ladoNoche.id === 'monte', 'sanearDesafio lo conserva');
    ok(sanearDesafio({ ladoNoche: { id: 'x' } }).ladoNoche === null && sanearDesafio(null).ladoNoche === null && sanearDesafio({ ladoNoche: 7 }).ladoNoche === null, 'y descarta lo raro');
  }
}

// ================================================================ 2. las tácticas
{
  const E = { noche: 3, total: 8, hayOtroLado: true, jefe: false, final: false, especial: null };
  ok(TA.hayDistraccion(E), 'noche 3 con ocho duendes y otro lado: hay distracción');
  ok(!TA.hayDistraccion({ ...E, noche: 2 }) && !TA.hayDistraccion({ ...E, noche: 1 }), 'no en las dos primeras noches');
  ok(!TA.hayDistraccion({ ...E, total: 5 }), 'no con menos de seis duendes');
  ok(!TA.hayDistraccion({ ...E, hayOtroLado: false }), 'no sin otro lado');
  ok(!TA.hayDistraccion({ ...E, jefe: true }) && !TA.hayDistraccion({ ...E, final: true }), 'no con el jefe ni en la noche final');
  ok(!TA.hayDistraccion({ ...E, especial: 'silenciosa' }) && !TA.hayDistraccion({ ...E, especial: 'apagon' }), 'no en la silenciosa ni en el apagón');
  ok(TA.hayDistraccion({ ...E, especial: 'roja' }) && TA.hayDistraccion({ ...E, especial: 'eclipse' }), 'sí en la roja y el eclipse');
  ok(TA.hayDistraccion({ ...E, noche: 3.9 }) === true && !TA.hayDistraccion({}), 'noches raras no rompen');

  const lista = ['rastreador', 'rastreador', 'rastreador', 'rastreador', 'bruto', 'tirador', 'tirador', 'saltador', 'saltador', 'escupidor', 'curandero'];
  const r = TA.repartirGrupos(lista, 4);
  ok(r.senuelos >= TA.DISTRACCION.minimo && r.senuelos <= TA.DISTRACCION.maximo, `entre 2 y 6 señuelos (${r.senuelos})`);
  ok(r.lista.length === lista.length, 'la cantidad total no cambia');
  const sen = r.lista.filter((x) => x.endsWith(TA.MARCA_SENUELO)), resto = r.lista.filter((x) => !x.endsWith(TA.MARCA_SENUELO));
  ok(sen.length === r.senuelos && r.lista.slice(0, sen.length).every((x) => x.endsWith(TA.MARCA_SENUELO)), 'los señuelos bajan primero');
  ok(sen.every((x) => TA.SENUELOS.includes(TA.partirItem(x).tipo)), 'sólo un pillo, un saltarín o un hondero puede ser señuelo');
  ok(['bruto', 'escupidor', 'curandero'].every((t) => resto.includes(t)), 'los pesados y el curandero siguen en el grupo principal');
  ok(JSON.stringify([...sen.map((x) => TA.partirItem(x).tipo), ...resto].sort()) === JSON.stringify([...lista].sort()), 'es la misma gente, sólo reordenada');
  ok(TA.partirItem(sen[0]).senuelo === true && TA.partirItem('bruto').senuelo === false && TA.partirItem('bruto').tipo === 'bruto', 'partirItem');
  ok(TA.repartirGrupos(['bruto', 'bruto', 'escupidor'], 4).senuelos === 0, 'sin quién sea señuelo, no hay');
  const grande = TA.repartirGrupos(Array.from({ length: 40 }, () => 'rastreador'), 12);
  ok(grande.senuelos === TA.DISTRACCION.maximo, 'con muchos, el tope de seis');
  // el retraso del grupo principal
  ok(TA.ritmoDeBajada('rastreador:s', 'rastreador:s', 5) === 0.55, 'entre señuelos, el ritmo de siempre');
  ok(TA.ritmoDeBajada('bruto', 'rastreador', 5) === 0.55, 'entre los del grupo, también');
  ok(TA.ritmoDeBajada('rastreador:s', undefined, 5) === 0.55, 'si no sigue nadie, normal');
  const r3 = TA.ritmoDeBajada('rastreador:s', 'bruto', 3), r12 = TA.ritmoDeBajada('rastreador:s', 'bruto', 12);
  ok(r3 >= 5 && r12 <= 9 && r12 > r3, `después del último señuelo el grupo espera ${r3.toFixed(1)}-${r12.toFixed(1)} s (más cuanto más noche)`);
  ok(TA.tiempoDeSenuelo(3) >= 20 && TA.tiempoDeSenuelo(30) <= 40 && TA.tiempoDeSenuelo(12) > TA.tiempoDeSenuelo(3), 'cuánto dura el juego del señuelo, con tope');
  ok(TA.esperaDeRuido(0) === TA.DISTRACCION.ruidoCada[0] && TA.esperaDeRuido(1) === TA.DISTRACCION.ruidoCada[1], 'cada cuánto hacen bulla');
  ok(TA.terminaSenuelo({ t: 50, tiempo: 30, distanciaAlJugador: 90 }) && TA.terminaSenuelo({ t: 3, tiempo: 30, distanciaAlJugador: 10 }) && TA.terminaSenuelo({ t: 3, tiempo: 30, distanciaAlJugador: 90, conBlanco: false }) && !TA.terminaSenuelo({ t: 3, tiempo: 30, distanciaAlJugador: 90 }), 'cuándo se termina el juego');
  // a qué le pegan
  {
    const entrada = { x: 100, z: 100 }, base = { x: 0, z: 0 }, jug = { x: 0, z: 0 };
    const b1 = TA.blancoDelSenuelo(entrada, base, jug, [{ x: 130, z: 100 }, { x: 105, z: 105 }, { x: 400, z: 400 }]);
    ok(b1.tipo === 'obra' && b1.x === 105, 'le pega a la defensa más cercana a su entrada');
    const b2 = TA.blancoDelSenuelo(entrada, base, { x: 105, z: 110 }, [{ x: 105, z: 105 }]);
    ok(b2.tipo === 'punto', 'una defensa pegada a vos no es «lejana»');
    const b3 = TA.blancoDelSenuelo(entrada, base, jug, [{ x: 300, z: 300 }]);
    ok(b3.tipo === 'punto' && Math.abs(Math.hypot(b3.x, b3.z) - TA.DISTRACCION.tropiezo) < 1e-6 && b3.x > 0 && b3.z > 0, 'sin una cerca, un punto de ruido hacia su lado');
    ok(TA.blancoDelSenuelo(entrada, base, jug, []).tipo === 'punto', 'sin defensas, también');
  }
  // rodear
  const R = { noche: 4, vecinos: 3, rompiendo: 1, veces: 0 };
  ok(TA.debeRodear(R), 'con un grupo y uno ya rompiendo, rodea');
  ok(!TA.debeRodear({ ...R, noche: 2 }), 'no antes de la noche 3');
  ok(!TA.debeRodear({ ...R, rompiendo: 0 }), 'si nadie la rompe, el primero la rompe él');
  ok(!TA.debeRodear({ ...R, vecinos: 1 }), 'solo no rodea');
  ok(!TA.debeRodear({ ...R, veces: TA.RODEO.veces }), 'como mucho dos intentos');
  ok(!TA.debeRodear({ ...R, pesado: true }) && !TA.debeRodear({ ...R, aDistancia: true }) && !TA.debeRodear({ ...R, jefe: true }), 'los pesados, los de tiro y el jefe van de frente');
  ok(TA.desvioDeRodeo(1, 0) === TA.RODEO.giro && TA.desvioDeRodeo(1, 1) === -TA.RODEO.giro && TA.desvioDeRodeo(-1, 0) === -TA.RODEO.giro, 'cada uno da la vuelta para su lado y el segundo intento cambia de lado');
}

// ================================================================ 3. el curandero
{
  const C = TIPOS_ALIEN.curandero;
  ok(C && C.cura === true && C.nombre === 'curandero', 'el tipo curandero existe y cura');
  ok(C.vida < TIPOS_ALIEN.rastreador.vida, 'pocos puntos de vida (menos que un rastreador)');
  ok(C.altura >= 0.6 && C.altura <= 0.8, 'chiquito: de 60 a 80 cm');
  ok(C.dano <= TIPOS_ALIEN.rastreador.dano / 2, 'casi no pega');
  ok(Array.isArray(C.cristales) && C.cristales[1] >= 1, 'da semillas: vale la pena ir a buscarlo');
  // curar
  ok(N.vidaCurada(10, 100) === 10 + 100 * N.CURA.porcentaje, 'cura un porcentaje de la vida máxima');
  ok(N.vidaCurada(80, 100) === 85, 'pero no pasa del techo');
  ok(N.vidaCurada(90, 100) === 90 && N.vidaCurada(100, 100) === 100, 'ni baja la vida de uno que ya está por encima');
  const c = (id, vida, d, extra = {}) => ({ id, vida, vidaMax: 100, distancia: d, jefe: false, cura: false, ...extra });
  const cand = [c(1, 30, 5), c(2, 10, 8), c(3, 50, 3), c(4, 20, 12), c(5, 95, 2), c(6, 5, 4, { cura: true }), c(7, 5, 4, { jefe: true }), c(8, 0, 4), c(9, 40, 9)];
  const el = N.elegirCurados(cand);
  ok(el.length === N.CURA.objetivos, 'cura a tres como mucho');
  ok(el.map((x) => x.id).join() === '2,1,9', 'los más lastimados primero, dentro del radio');
  ok(!el.some((x) => x.id === 4), 'el de afuera del radio no');
  ok(!el.some((x) => x.id === 5), 'el sano no');
  ok(!el.some((x) => x.id === 6 || x.id === 7 || x.id === 8), 'ni otro curandero, ni el jefe, ni el muerto');
  ok(N.elegirCurados([]).length === 0 && N.elegirCurados([null, undefined, {}]).length === 0, 'sin candidatos, nadie');
  ok(N.elegirCurados(cand, 20, 10).length === 5, 'con más radio y más cupo, a todos los heridos');
  // se cansa
  ok(N.puedeCurar(N.CURA.cada, 0) && !N.puedeCurar(N.CURA.cada - 0.1, 0) && !N.puedeCurar(99, N.CURA.veces), 'espera entre curas y se cansa');
  // una simulación: un herido a quien cura cada tanto
  {
    let vida = 5, curas = 0, t = 0;
    for (let i = 0; i < 4000; i++) { t += 0.05; if (N.puedeCurar(t, curas)) { const e = N.elegirCurados([{ id: 1, vida, vidaMax: 100, distancia: 3 }]); if (e.length) { vida = N.vidaCurada(vida, 100); curas++; t = 0; } } }
    ok(vida <= 85 && vida > 5, `con el tiempo lo deja en ${vida} (nunca sano)`);
    ok(curas <= N.CURA.veces, 'y no da más de las curas que puede');
  }
  // dónde se para y cómo se mueve
  {
    const ret = N.puestoDeRetaguardia({ x: 50, z: 0 }, { x: 0, z: 0 });
    ok(Math.abs(ret.x - (50 + N.CURA.detras)) < 1e-9 && Math.abs(ret.z) < 1e-9, 'detrás del grupo, del lado opuesto a vos');
    ok(Number.isFinite(N.puestoDeRetaguardia({ x: 1, z: 1 }, { x: 1, z: 1 }).x), 'con el grupo encima tuyo no da NaN');
    const m = (dist, aliados, pos = { x: 40, z: 0 }) => N.movimientoCurandero({ dist, aliados, pos, retaguardia: { x: 58, z: 0 }, jugador: { x: 0, z: 0 } });
    ok(m(3, 5).modo === 'huir' && m(3, 5).vel === N.CURA.velHuida, 'si lo alcanzás, huye (más rápido)');
    ok(m(3, 5).rumboHacia.x > 40, 'y huye para el lado opuesto a vos');
    ok(m(60, 5).modo === 'ir' && m(60, 5).rumboHacia.x === 58, 'va a su lugar atrás del grupo');
    ok(m(60, 5, { x: 58, z: 0 }).modo === 'quedarse', 'y ahí se queda');
    ok(m(10, 0).modo === 'huir' && m(40, 0).modo === 'quedarse', 'solo, se aleja y se esconde');
  }
}

// ================================================================ 4. el enjambre
{
  const E = TIPOS_ALIEN.enjambre;
  ok(E && E.enjambre === true, 'el tipo enjambre existe');
  ok(E.altura >= 0.25 && E.altura <= 0.4, 'duendecitos de ~30 cm');
  ok(E.vida <= 10 && E.dano <= 2 && E.danoObra <= 2, 'de a uno no son nada: casi sin vida ni daño');
  ok(E.cristales[0] === 0 && E.cristales[1] === 0, 'no sueltan semillas (son muchos)');
  ok(E.vida * 12 < TIPOS_ALIEN.rastreador.vida * 12, 'una docena junta menos vida que una docena de pillos');
  ok(E.dano * 12 / E.cadencia < 20, 'una docena pegando a la vez no te mata de golpe');
  let max = 0;
  for (const dif of Object.keys(DIFICULTADES)) for (let n = 1; n <= 60; n++) {
    const k = N.enjambreEnLaNoche(n, false, DIFICULTADES[dif].cantidad);
    max = Math.max(max, k);
    ok(k === 0 || (n >= 6 && (n - 6) % 3 === 0 && k >= 4 && k <= N.MAX_ENJAMBRE), `${dif} noche ${n}: ${k}`);
    ok(N.enjambreEnLaNoche(n, true, DIFICULTADES[dif].cantidad) === 0, 'nunca con el jefe');
  }
  ok(max === N.MAX_ENJAMBRE, 'la implacable llega al tope');
  ok(N.enjambreEnLaNoche(6) === 8 && N.enjambreEnLaNoche(12) === 11 && N.enjambreEnLaNoche(18) === 12, 'normal: 8, 11, 12...');
  ok(N.enjambreEnLaNoche(6, false, DIFICULTADES.tranquila.cantidad) < N.enjambreEnLaNoche(6) && N.enjambreEnLaNoche(6) < N.enjambreEnLaNoche(6, false, DIFICULTADES.implacable.cantidad), 'más duendes con la dificultad');
  ok(N.enjambreEnLaNoche(NaN) === 0 && N.enjambreEnLaNoche('x') === 0 && N.enjambreEnLaNoche(6, false, -3) >= 4, 'noches y dificultades raras no rompen');
  // salen en montón
  const pts = Array.from({ length: 12 }, (_, i) => N.manchaDelEnjambre(i, 12));
  ok(pts.every((p) => Math.hypot(p.dx, p.dz) <= 2.2 + 1e-9), 'todos en una mancha de 2 m');
  ok(new Set(pts.map((p) => `${p.dx.toFixed(2)},${p.dz.toFixed(2)}`)).size === 12, 'cada uno en su lugar');
  ok(N.manchaDelEnjambre(0, 1).dx === 0 && Number.isFinite(N.manchaDelEnjambre(0, 0).dx), 'uno solo no rompe');
  let zmax = 0; for (let t = 0; t < 50; t += 0.1) for (let k = 0; k < 12; k++) zmax = Math.max(zmax, Math.abs(N.zumbidoDelEnjambre(t, k)));
  ok(zmax <= 0.45 * 1.35 + 1e-9 && zmax > 0.2, `zumban sin irse del rumbo (${zmax.toFixed(2)} rad)`);
  ok(N.zumbidoDelEnjambre(3, 1) !== N.zumbidoDelEnjambre(3, 2), 'cada uno a su ritmo');
}

// ================================================================ 5. la composición
{
  const cuenta = (l, t) => l.filter((x) => x === t).length;
  // el tamaño de cada oleada en la 4.7.0, medido en main antes de tocar nada (de la noche 1 a la 40)
  const BASE_47 = {
    tranquila: [2, 3, 4, 5, 7, 8, 9, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
    normal: [3, 5, 7, 9, 11, 13, 15, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
    implacable: [4, 7, 10, 13, 15, 18, 21, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24],
  };
  const base = (n, dif) => BASE_47[dif][n - 1];
  for (const dif of Object.keys(DIFICULTADES)) {
    let anterior = 0;
    for (let n = 1; n <= 40; n++) {
      const l = composicionOleada(n, dif), sinEnj = l.filter((t) => t !== 'enjambre');
      ok(l.every((t) => Object.hasOwn(TIPOS_ALIEN, t)), `${dif} ${n}: sólo tipos que existen`);
      // el total de siempre se mantiene: lo nuevo sale de los rastreadores y el enjambre va aparte
      ok(sinEnj.length === base(n, dif), `${dif} ${n}: ${sinEnj.length} comunes contra ${base(n, dif)} de siempre (el curandero ocupa un lugar; el enjambre va aparte)`);
      ok(sinEnj.length <= 24 && sinEnj.length >= anterior - (esNocheDeJefe(n) ? 99 : 0), `${dif} ${n}: sin pasar el techo (${sinEnj.length})`);
      if (!esNocheDeJefe(n)) anterior = sinEnj.length;
      const cur = cuenta(l, 'curandero'), enj = cuenta(l, 'enjambre');
      const topeCur = Math.max(1, Math.floor(base(n, dif) / 5));
      ok(cur === (n < 4 || esNocheDeJefe(n) ? 0 : Math.min(topeCur, n >= 20 ? 3 : n >= 12 ? 2 : 1)), `${dif} ${n}: ${cur} curanderos`);
      ok(enj === N.enjambreEnLaNoche(n, esNocheDeJefe(n), DIFICULTADES[dif].cantidad), `${dif} ${n}: ${enj} del enjambre`);
      if (l.includes('jefe')) { ok(l[l.length - 1] === 'jefe' && cur === 0 && enj === 0, `${dif} ${n}: el jefe va último, sin curandero ni enjambre`); }
      // el curandero y el enjambre van al final (antes del jefe): lo que recorta la cola los deja afuera primero
      const sinJefe = l.filter((t) => t !== 'jefe');
      const primero = sinJefe.findIndex((t) => t === 'curandero' || t === 'enjambre');
      if (primero >= 0) ok(sinJefe.slice(primero).every((t) => t === 'curandero' || t === 'enjambre'), `${dif} ${n}: los nuevos al final`);
      if (n <= 3) ok(cur === 0 && enj === 0, `${dif} ${n}: nada de esto en las primeras noches`);
      ok(cuenta(l, 'rastreador') >= 1, `${dif} ${n}: siempre queda algún pillo`);
    }
  }
  // desde cuándo
  const primera = (t) => { for (let n = 1; n <= 40; n++) if (composicionOleada(n).includes(t)) return n; return null; };
  ok(primera('curandero') === 4, `el curandero aparece en la noche ${primera('curandero')}`);
  ok(primera('enjambre') === 6, `el enjambre aparece en la noche ${primera('enjambre')}`);
  ok([1, 2, 3].every((n) => !composicionOleada(n).some((t) => t === 'curandero' || t === 'enjambre')), 'no en la primera noche');
  ok(!composicionOleada(NOCHE_JEFE).some((t) => t === 'curandero' || t === 'enjambre'), 'ni con el jefe');
  ok([6, 9, 12, 18, 21, 24].every((n) => composicionOleada(n).includes('enjambre')), 'una noche de cada tres: 6, 9, 12, 18, 21, 24');
  ok([7, 8, 11, 13, 14, 16, 17].every((n) => !composicionOleada(n).includes('enjambre')), 'y las otras no');
  ok(!composicionOleada(15).includes('enjambre') && !composicionOleada(15).includes('curandero'), 'la 15 es del jefe');
  // con la dificultad
  ok(cuenta(composicionOleada(9, 'tranquila'), 'enjambre') < cuenta(composicionOleada(9, 'normal'), 'enjambre') && cuenta(composicionOleada(9, 'normal'), 'enjambre') < cuenta(composicionOleada(9, 'implacable'), 'enjambre'), 'más enjambre con la dificultad');
  ok(composicionOleada(9, 'inventada').join() === composicionOleada(9, 'normal').join(), 'una dificultad inventada es la normal');
  // las noches especiales y el recorte de la cola
  for (const esp of Object.keys(ESPECIALES)) for (const n of [4, 6, 9, 12]) {
    const l = aplicarEspecial(composicionOleada(n), esp);
    ok(l.every((t) => Object.hasOwn(TIPOS_ALIEN, t)) && l.length >= 2, `especial ${esp} noche ${n}: lista válida`);
    ok(l.length <= 24 + N.MAX_ENJAMBRE + 6, `especial ${esp} noche ${n}: ${l.length} no se desmadra`);
  }
  ok(aplicarEspecial(composicionOleada(9), 'silenciosa').every((t) => t === 'tirador'), 'la silenciosa sigue siendo de tiradores');
}

// ================================================================ 6. el juego: reciclado, cupos, decisiones
{
  const src = leer('src/desafio-ataques.js'), des = leer('src/desafio.js');
  // todo campo nuevo por invasor se limpia en bajarAlien (a través de limpiar)
  const cuerpoLimpiar = src.slice(src.indexOf('function limpiar(a) {'), src.indexOf('// ------------------------------------------------------------ cada cuadro'));
  const asignados = new Set();
  for (const m of src.matchAll(/\b(?:a|c)\.([A-Za-z]+)\s*(?:=(?!=)|\+=|-=)/g)) asignados.add(m[1]);
  const bajar = des.slice(des.indexOf('function bajarAlien(tipo) {'), des.indexOf('// ---------------- 3.8.0: el robo de los traviesos'));
  const yaLimpios = new Set([...bajar.matchAll(/\ba\.([A-Za-z]+)\s*=(?!=)/g)].map((m) => m[1]));
  for (const f of asignados) ok(new RegExp(`a\\.${f}\\s*=`).test(cuerpoLimpiar) || yaLimpios.has(f) || ['estado', 'obra', 'cd', 't', 'desvio', 'desvioT', 'atasco', 'vida'].includes(f), `el campo «${f}» que agrega desafio-ataques.js se limpia en bajarAlien`);
  ok(/ataques\.limpiar\(a\);/.test(bajar), 'bajarAlien llama a ataques.limpiar');
  ok(/const bajada = ataques\.consumirBajada\(\);/.test(bajar) && /ataques\.alNacer\(a, bajada\);/.test(bajar), 'bajarAlien consume la marca de la cola y avisa del nacimiento');
  ok(/ataques\.lleno\(def, topeOleada\(\)\)/.test(bajar), 'el cupo de bajada es el de ataques (el enjambre tiene el suyo)');
  ok(/ataques\.salida\(bajada, tipo, estadoNave\)/.test(bajar), 'y la salida (señuelo por otro lado, enjambre en montón)');
  ok(/ataques\.decidir\(d\.oleadas \+ 1\);/.test(des), 'el lado se decide al caer la tarde (con decidirNoche)');
  ok(/const e = ataques\.puntoDeEntrada\(js, D\(\)\.oleadas\); if \(e\) return e;/.test(des), 'puntoDeAterrizaje usa el lado de la noche');
  ok(/tipos = ataques\.alEmpezar\(tipos, nuevaNoche, retomada, puntoFijo\);/.test(des), 'empezarOleada reparte los grupos');
  ok(/ataques\.marcarBajada\(item\); bajarAlien\(ataques\.tipoDe\(item\)\);/.test(des) && /e\.ritmo = ataques\.ritmoTras\(item, e\.porBajar\[0\]\);/.test(des), 'la nave baja con la marca de señuelo y el retraso del grupo');
  ok(/ataques\.actualizar\(dt, js\);/.test(des) && /ataques\.guiar\(a, dt, js, dist, rumboObj\)/.test(des) && /ataques\.rodear\(a, o\)/.test(des), 'el cuadro, el rumbo y el rodeo están enganchados');
  ok(/aliados\.alertaPerro \|\| ataques\.alertaDeLaTarde\(/.test(des), 'a la tarde el perro mira hacia el lado de la noche');
  ok(/get ataques\(\) \{ return ataques; \}/.test(des), 'el Desafío expone `ataques`');
  ok(!/ñ/.test([...src.matchAll(/^export (?:const|let|function|class) ([^\s(=]+)/gm)].map((m) => m[1]).join('')), 'sin ñ en lo exportado');
  for (const f of ['src/desafio-lados.js', 'src/desafio-tacticas.js', 'src/desafio-duendes-nuevos.js', 'src/desafio-ataques.js', 'src/duendes-modelo-nuevos.js']) {
    const t = leer(f);
    ok(!t.includes('\r'), `${f}: fines de línea LF`);
    for (const m of t.matchAll(/^import .*$/gm)) ok(/^import \{[^}]+\} from '[^']+';$/.test(m[0]), `${f}: import en una línea y sin comentario atrás (armar.mjs)`);
    ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(t), `${f}: sin caracteres de control (barras invertidas perdidas)`);
    ok(!/^export (async function|function\*)|^export .* from /m.test(t), `${f}: export que armar.mjs no entiende`);
  }
  ok(!/from 'three'/.test(src) && !/from 'three'/.test(leer('src/desafio-lados.js')) && !/from 'three'/.test(leer('src/desafio-tacticas.js')) && !/from 'three'/.test(leer('src/desafio-duendes-nuevos.js')), 'lo puro no importa three');

  // ---- un mundo de mentira para `crearAtaques`
  const base = { ...BASE_REFUGIO };
  const mundo = (extra = {}) => {
    const D = { oleadas: 2, semilla: 'COIHUE-4821', ladoNoche: null, especial: null, rescate: null, ...(extra.D || {}) };
    const aliens = [];
    const registro = { notas: [], risas: [], curas: [], polvos: 0 };
    let bloqueada = false, final = false, porBajar = 0;
    const api = {
      T, D: () => D, aliens, limite: LIMITE, base: () => base,
      libre: () => true, blancoNoche: () => (bloqueada ? { x: 0, z: 0 } : null), esFinal: () => final,
      nota: (t, s) => registro.notas.push([t, s]), jugador: () => ({ estado: { pos: { x: base.x, y: 0, z: base.z } } }),
      defensas: () => extra.defensas || [], obraViva: (o) => !o.muerta, porBajar: () => porBajar,
      polvo: () => { registro.polvos++; }, risa: (p, a) => registro.risas.push(a), destelloCura: (p) => registro.curas.push(p), efectoCurandero: (p, c) => c.m.chillar(),
    };
    const A = crearAtaques(api);
    return { A, D, aliens, registro, api, bloquear: (v) => { bloqueada = v; }, final: (v) => { final = v; }, porBajar: (n) => { porBajar = n; } };
  };
  let seq = 0;
  const bicho = (tipo, x, z, extra = {}) => {
    const def = TIPOS_ALIEN[tipo];
    const a = { id: ++seq, tipo, def, estado: 'avanzar', vida: def.vida, vidaMax: def.vida, fase: Math.random() * 6, sentido: 1, desvio: 0, desvioT: 0, atasco: 0, cd: 1, rumbo: 0, obra: null,
      m: { g: { position: { x, y: 0, z } }, esc: 1, viejo: false, chillar() { this.risas = (this.risas || 0) + 1; } }, ...extra };
    return a;
  };

  // la decisión de la tarde
  {
    const w = mundo();
    const l = w.A.decidir(3);
    ok(l && l.noche === 3 && w.D.ladoNoche === l && L.LADOS.includes(l.id), 'decidir deja D().ladoNoche');
    ok(w.A.decidir(3) === l, 'decidir es idempotente: si ya está para esa noche, queda ese');
    ok(w.A.decidir(4).noche === 4, 'y otra noche es otro lado');
    ok(w.A.ladoDe(4).id === w.D.ladoNoche.id, 'ladoDe lo lee');
    ok(w.A.nombreDelLado(4) === L.NOMBRE_LADO[w.D.ladoNoche.id] && w.A.nombreDelLado(5) === null, 'el nombre: «el monte»');
    // después de las noches reales: 12 seguidas, sin tres iguales
    const ids = []; for (let n = 1; n <= 30; n++) ids.push(w.A.decidir(n).id);
    for (let i = 2; i < ids.length; i++) ok(!(ids[i] === ids[i - 1] && ids[i] === ids[i - 2]), 'por el juego tampoco se repite tres veces');
    ok(ids.join() === L.secuenciaDeLados('COIHUE-4821', 30, w.A.planActual().disponibles).join(), 'y es la secuencia de la semilla');
  }
  // por dónde bajan
  {
    const w = mundo();
    const js = { pos: { x: base.x + 5, y: 0, z: base.z - 5 } };
    const l = w.A.decidir(3);
    const p = w.A.puntoDeEntrada(js, 3);
    ok(p && p.x === l.x && p.z === l.z, 'en la base, bajan en el punto del lado');
    const lejos = { pos: { x: base.x + 300, y: 0, z: base.z } };
    const q = w.A.puntoDeEntrada(lejos, 3);
    ok(q && Math.abs(dist(q, lejos.pos) - DISTANCIA_ENTRADA) < 0.01, `lejos de la base, a ${DISTANCIA_ENTRADA} m de vos`);
    ok(Math.abs(Math.atan2(q.x - lejos.pos.x, q.z - lejos.pos.z) - l.rumbo) < 0.9, 'y por el rumbo del lado');
    ok(!T.agua(q.x, q.z), 'fuera del agua');
    ok(FUERA_DE_LA_BASE === 220, 'más allá de 220 m de la base');
    w.bloquear(true);
    ok(w.A.puntoDeEntrada(js, 3) === null && w.D.ladoNoche.anulado === true, 'una noche de rescate (o de trochita o de asedio) el lado no vale');
    ok(w.A.nombreDelLado(3) === null && w.A.alertaDeLaTarde(20, 20.5, 5000) === null, 'ni el nombre ni la pista de la tarde');
  }
  // la pista de la tarde
  {
    const w = mundo({ D: { oleadas: 2 } });
    ok(w.A.alertaDeLaTarde(19.7, 20.5, 5000) === null, 'sin lado decidido, nada');
    const l = w.A.decidir(3);
    const t = w.A.alertaDeLaTarde(20.0, 20.5, 5000);
    ok(t && t.x === l.x && t.z === l.z, 'a la tarde el perro mira hacia el punto del lado');
    ok(w.A.alertaDeLaTarde(20.0, 20.5, 5000 + 20000) === null && w.A.alertaDeLaTarde(20.0, 20.5, 5000 + 45000) !== null, 'un rato sí, un rato no (no se queda duro toda la hora)');
    ok(w.A.alertaDeLaTarde(18.0, 20.5, 5000) === null && w.A.alertaDeLaTarde(20.6, 20.5, 5000) === null, 'sólo en la última hora de la tarde');
    w.D.oleadas = 5;
    ok(w.A.alertaDeLaTarde(20.0, 20.5, 5000) === null, 'y sólo para la noche que viene (no la de anoche)');
  }
  // la cola de bajada y los grupos
  {
    const w = mundo({ D: { oleadas: 3 } });
    const l = w.A.decidir(3);
    const tipos = ['rastreador', 'rastreador', 'rastreador', 'saltador', 'tirador', 'bruto', 'bruto', 'curandero'];
    const sal = w.A.alEmpezar(tipos, true, false, null);
    ok(sal.length === tipos.length && sal.some((x) => x.endsWith(':s')) && sal[0].endsWith(':s'), 'la noche 3 reparte señuelos al principio de la cola');
    ok(w.A.distraccion && w.A.distraccion.lado === l.otro.id, 'anota la distracción');
    ok(w.A.alEmpezar(tipos, false, false, null) === tipos && w.A.alEmpezar(tipos, true, true, null) === tipos && w.A.alEmpezar(tipos, true, false, { x: 1, z: 1 }) === tipos, 'refuerzos, retomadas y puntos fijos: sin grupos');
    ok(w.A.alEmpezar([...tipos, 'jefe'], true, false, null).join() === [...tipos, 'jefe'].join(), 'con el jefe, sin señuelos');
    w.final(true); ok(w.A.alEmpezar(tipos, true, false, null) === tipos, 'la noche final, tampoco'); w.final(false);
    w.D.oleadas = 2; w.A.decidir(2);
    ok(w.A.alEmpezar(tipos, true, false, null) === tipos, 'noche 2: sin señuelos');
    w.D.oleadas = 3; w.D.especial = 'silenciosa';
    ok(w.A.alEmpezar(tipos, true, false, null) === tipos, 'la silenciosa: sin señuelos');
    w.D.especial = null; w.bloquear(true);
    ok(w.A.alEmpezar(tipos, true, false, null) === tipos, 'noche de rescate: sin señuelos');
    // marcar, consumir, ritmo
    w.A.marcarBajada('rastreador:s');
    ok(w.A.tipoDe('rastreador:s') === 'rastreador' && w.A.tipoDe('bruto') === 'bruto', 'tipoDe');
    const b1 = w.A.consumirBajada(), b2 = w.A.consumirBajada();
    ok(b1.senuelo === true && b1.tipo === 'rastreador' && b2 === null, 'la marca se consume una sola vez (los invocados a mano no son señuelos)');
    ok(w.A.ritmoTras('rastreador:s', 'bruto') > 0.55 && w.A.ritmoTras('bruto', 'bruto') === 0.55, 'el grupo espera después de los señuelos');
  }
  // los cupos: el enjambre no le quita lugar a nadie
  {
    const w = mundo();
    for (let i = 0; i < MAX_INVASORES; i++) w.aliens.push(bicho('rastreador', 0, 0));
    ok(w.A.lleno(TIPOS_ALIEN.rastreador, 24) && !w.A.lleno(TIPOS_ALIEN.enjambre, 24), 'con 24 comunes: lleno para los comunes, no para el enjambre');
    for (let i = 0; i < N.MAX_ENJAMBRE - 1; i++) w.aliens.push(bicho('enjambre', 0, 0));
    ok(!w.A.lleno(TIPOS_ALIEN.enjambre, 24), 'el enjambre entra hasta el tope');
    w.aliens.push(bicho('enjambre', 0, 0));
    ok(w.A.lleno(TIPOS_ALIEN.enjambre, 24) && w.A.lleno(TIPOS_ALIEN.rastreador, 24), 'y se llena');
    w.aliens.length = 0;
    for (let i = 0; i < N.MAX_ENJAMBRE; i++) w.aliens.push(bicho('enjambre', 0, 0));
    ok(!w.A.lleno(TIPOS_ALIEN.rastreador, 24), 'un enjambre entero no le quita el lugar a los comunes');
    for (let i = 0; i < 23; i++) w.aliens.push(bicho('bruto', 0, 0));
    ok(!w.A.lleno(TIPOS_ALIEN.rastreador, 24), '14 del enjambre y 23 comunes: todavía entra uno común');
    w.aliens.push(bicho('bruto', 0, 0));
    ok(w.A.lleno(TIPOS_ALIEN.rastreador, 24) && w.A.lleno(TIPOS_ALIEN.enjambre, 24), 'con 24 comunes ya no entra otro (el enjambre también está en su tope)');
  }
  // salida de cada uno
  {
    const w = mundo({ D: { oleadas: 3 } });
    const l = w.A.decidir(3);
    const s = w.A.salida({ tipo: 'rastreador', senuelo: true }, 'rastreador', { x: 1000, z: 1000 });
    ok(s && s.alPie && dist(s, l.otro) < 4, 'el señuelo sale por el otro lado, a pie');
    ok(w.A.salida(null, 'rastreador', { x: 0, z: 0 }) === null && w.A.salida({ tipo: 'bruto', senuelo: false }, 'bruto', { x: 0, z: 0 }) === null, 'los comunes salen de la nave');
    w.A.alEmpezar(Array.from({ length: 12 }, () => 'enjambre'), true, false, null);
    const nave = { x: 500, z: -200 };
    const ps = Array.from({ length: 12 }, () => w.A.salida(null, 'enjambre', nave));
    ok(ps.every((p) => dist(p, nave) <= 2.2 + 1e-9 && !p.alPie), 'el enjambre sale en montón alrededor de la nave');
  }
  // el nacimiento y la limpieza del reciclado
  {
    const w = mundo({ D: { oleadas: 3 }, defensas: [{ x: base.x + 40, z: base.z + 10, o: { muerta: false } }] });
    const l = w.A.decidir(3);
    const a = bicho('rastreador', l.otro.x, l.otro.z, { estado: 'bajar' });
    w.aliens.push(a);
    w.A.alNacer(a, { tipo: 'rastreador', senuelo: true });
    ok(a.senuelo && a.estado === 'avanzar' && a.senuelo.blanco && a.senuelo.tiempo >= 20, 'el señuelo nace a pie, con su blanco y su tiempo');
    ok(w.registro.risas.includes(a) && w.registro.polvos === 1, 'y con su risita y su polvo');
    const c = bicho('curandero', 10, 10);
    w.A.alNacer(c, null);
    ok(c.curas === 0 && c.aliados === 1 && c.retaX === 10 && c.retaZ === 10, 'el curandero nace con sus cuentas');
    a.rodeoT = 3; a.rodeos = 2; a.curas = 5; a.tCura = 3; a.tSolo = 9; a.retaX = 5; a.retaZ = 5; a.aliados = 3;
    w.A.limpiar(a);
    ok(a.senuelo === null && a.rodeoT === 0 && a.rodeos === 0 && a.curas === 0 && a.tCura === 0 && a.tSolo === 0 && a.retaX === 0 && a.retaZ === 0 && a.aliados === 0, 'limpiar deja todo en cero');
  }
  // los señuelos: tiempo, bulla, fin
  {
    const obra = { muerta: false };
    const w = mundo({ D: { oleadas: 3 }, defensas: [{ x: base.x - 30, z: base.z + 60, o: obra }] });
    const l = w.A.decidir(3);
    const a = bicho('rastreador', l.otro.x, l.otro.z);
    w.aliens.push(a);
    w.A.alNacer(a, { tipo: 'rastreador', senuelo: true });
    const js = { pos: { x: base.x, y: 0, z: base.z } };
    const b = a.senuelo.blanco;
    // va hacia el blanco
    const g = w.A.guiar(a, 0.05, js, 90, 0);
    ok(g && g.mult > 0 && g.mult < 1.01, 'el señuelo va a lo suyo');
    ok(Math.abs(g.rumbo - Math.atan2(b.x - a.m.g.position.x, b.z - a.m.g.position.z)) < 1e-9, 'hacia el blanco');
    // al llegar a la defensa, la rompe
    if (b.tipo === 'obra') {
      a.m.g.position.x = b.x - 1; a.m.g.position.z = b.z;
      const g2 = w.A.guiar(a, 0.05, js, 90, 0);
      ok(a.estado === 'romper' && a.obra === obra && g2.mult === 0, 'al llegar a la defensa, la rompe');
      a.estado = 'avanzar'; a.obra = null; a.m.g.position.x = l.otro.x; a.m.g.position.z = l.otro.z;
    }
    // hace bulla de a ratos
    const antes = w.registro.risas.length;
    for (let i = 0; i < 400; i++) w.A.actualizar(0.05, js);
    ok(w.registro.risas.length > antes + 2, 'hace bulla cada tanto');
    ok(a.senuelo === null, 'se le acaba el tiempo y deja el juego');
    // si te le acercás, se termina
    const a2 = bicho('rastreador', base.x + 8, base.z); w.aliens.push(a2);
    w.A.alNacer(a2, { tipo: 'rastreador', senuelo: true });
    w.A.actualizar(0.05, js);
    ok(a2.senuelo === null, 'si te le acercás, deja el juego');
    // si la defensa cae, también
    const obra2 = { muerta: false };
    const w2 = mundo({ D: { oleadas: 3 }, defensas: [{ x: base.x - 30, z: base.z + 60, o: obra2 }] });
    const l2 = w2.A.decidir(3);
    const a3 = bicho('rastreador', l2.otro.x, l2.otro.z); w2.aliens.push(a3);
    w2.A.alNacer(a3, { tipo: 'rastreador', senuelo: true });
    if (a3.senuelo.blanco.tipo === 'obra') {
      a3.estado = 'romper'; a3.obra = obra2; obra2.muerta = true;
      w2.A.actualizar(0.05, js);
      ok(a3.senuelo === null && a3.estado === 'avanzar', 'si su defensa ya no está, vuelve a lo de siempre');
    } else pasos++;
  }
  // el rodeo
  {
    const w = mundo({ D: { oleadas: 5 } });
    const obra = { id: 'empalizada' };
    const a = bicho('rastreador', 0, 0), b = bicho('rastreador', 1, 1, { estado: 'romper', obra }), c = bicho('rastreador', -1, 1), d = bicho('bruto', 1, -1);
    w.aliens.push(a, b, c, d);
    ok(w.A.rodear(a, obra) === true && a.rodeos === 1 && a.rodeoT > 0 && a.desvioT > 0 && Math.abs(a.desvio) === TA.RODEO.giro && a.atasco === 0, 'rodea: da la vuelta por un costado');
    const rumbos = [];
    for (let i = 0; i < 80; i++) { w.A.guiar(a, 0.05, { pos: { x: 50, z: 0 } }, 50, 0); a.desvioT = 0; rumbos.push(a.desvio); }
    ok(a.rodeoT <= 0 && new Set(rumbos).size <= 2, 'sigue la vuelta un rato y se termina');
    a.rodeoT = 0;
    ok(w.A.rodear(a, obra) === true && a.rodeos === 2 && Math.sign(a.desvio) === -Math.sign(TA.desvioDeRodeo(a.sentido, 0)), 'el segundo intento cambia de lado');
    ok(w.A.rodear(a, obra) === false, 'no más de dos veces');
    ok(w.A.rodear(d, obra) === false, 'el bruto va de frente');
    ok(w.A.rodear(bicho('rastreador', 100, 100), obra) === false, 'solo, no rodea');
    w.D.oleadas = 2; ok(w.A.rodear(c, obra) === false, 'noche 2: no');
  }
  // el curandero, de verdad
  {
    const w = mundo({ D: { oleadas: 6 } });
    const js = { pos: { x: 0, y: 0, z: 0 } };
    const cur = bicho('curandero', 57, 0), herido1 = bicho('rastreador', 50, 0), herido2 = bicho('bruto', 52, 2), lejos = bicho('rastreador', 120, 0), sano = bicho('rastreador', 51, 3), jefe = bicho('jefe', 54, 0);
    herido1.vida = 5; herido2.vida = 20; lejos.vida = 5; jefe.vida = 100;
    w.aliens.push(cur, herido1, herido2, lejos, sano, jefe);
    w.A.alNacer(cur, null);
    // se queda atrás del grupo, del lado opuesto a vos
    for (let i = 0; i < 5; i++) w.A.actualizar(0.05, js);
    // los cuatro compañeros que tiene más cerca: x = 50, 51, 52 y 54 → su centro, 51,75; y 7 m más atrás
    ok(Math.abs(cur.retaX - (51.75 + N.CURA.detras)) < 0.6 && Math.abs(cur.retaZ) < 3, `su lugar queda atrás de los que tiene cerca, del lado opuesto a vos (${cur.retaX.toFixed(1)}, ${cur.retaZ.toFixed(1)})`);
    // cura a los heridos cercanos cada tanto, con límite
    const v1 = herido1.vida;
    let t = 0;
    for (let i = 0; i < 160; i++) { w.A.actualizar(0.05, js); t += 0.05; }
    ok(herido1.vida > v1 && herido2.vida > 20, 'cura a los heridos que tiene cerca');
    ok(lejos.vida === 5, 'al de afuera del radio, no');
    ok(jefe.vida === 100 && sano.vida === sano.vidaMax, 'ni al jefe ni al sano');
    ok(herido1.vida <= herido1.vidaMax * N.CURA.techo + 1e-9 && herido2.vida <= herido2.vidaMax * N.CURA.techo + 1e-9, 'nunca los deja por encima del techo');
    ok(cur.curas >= 1 && cur.curas <= Math.ceil(t / N.CURA.cada) + 1, `da una cura por vez cada ${N.CURA.cada} s (${cur.curas} en ${t.toFixed(0)} s)`);
    ok(w.registro.curas.length >= 2 && cur.m.risas >= 1, 'y se ve y se oye (destello en cada curado, risita del curandero)');
    // se cansa
    herido1.vida = 5; cur.curas = N.CURA.veces; cur.tCura = 99;
    w.A.actualizar(0.05, js);
    ok(herido1.vida === 5, 'después de sus curas, se cansa');
    // huye si lo alcanzás
    const m = w.A.guiar(cur, 0.05, { pos: { x: cur.m.g.position.x - 4, y: 0, z: 0 } }, 4, 0);
    ok(m.mult > 1 && Math.sin(m.rumbo) > 0.9, 'si lo alcanzás, huye (más rápido y para el lado opuesto)');
    // solo, se asusta y se rinde (la noche se puede terminar)
    const w2 = mundo({ D: { oleadas: 6 } });
    const solo = bicho('curandero', 50, 0); w2.aliens.push(solo); w2.A.alNacer(solo, null);
    for (let i = 0; i < 400; i++) w2.A.actualizar(0.05, js);
    ok(solo.tSolo >= N.CURA.soloSeVa, 'sin nadie a quien curar, cuenta el tiempo solo');
    ok(w2.A.guiar(solo, 0.05, js, 50, 0).mult === 0, 'y se queda quieto, rendido');
    // con refuerzos por bajar, no está solo
    const w3 = mundo({ D: { oleadas: 6 } }); const s3 = bicho('curandero', 50, 0); w3.aliens.push(s3); w3.A.alNacer(s3, null); w3.porBajar(3);
    for (let i = 0; i < 400; i++) w3.A.actualizar(0.05, js);
    ok(s3.tSolo === 0, 'si todavía bajan más, no está solo');
  }
  // el enjambre guía
  {
    const w = mundo();
    const e = bicho('enjambre', 10, 10);
    const g = w.A.guiar(e, 0.05, { pos: { x: 0, y: 0, z: 0 } }, 14, 1.0);
    ok(g && Math.abs(g.rumbo - 1.0) <= 0.45 * 1.35 + 1e-9 && g.mult === 1, 'el enjambre zumba alrededor del rumbo');
    ok(w.A.guiar(bicho('rastreador', 0, 0), 0.05, { pos: { x: 0, y: 0, z: 0 } }, 5, 1.0) === null, 'un común sigue con lo suyo');
  }
}

// ================================================================ 7. los modelos
{
  const mod = leer('src/duendes-modelo-nuevos.js'), des = leer('src/desafio-duendes.js');
  ok(/DUENDES\.curandero = /.test(mod) && /DUENDES\.enjambre = /.test(mod), 'los modelos se anotan en el registro de DUENDES');
  ok(/registrarDuendesNuevos\(\);/.test(des) && /from '\.\/duendes-modelo-nuevos\.js';/.test(des), 'desafio-duendes.js los registra');
  ok(/objeto: 'calabaza'/.test(mod) && /ojos: \{[^}]*brillo: '#ffd84a'/.test(mod), 'el curandero con su calabaza y el enjambre con ojos de ámbar');
  ok(!/(Santo|Santa|Cristo|Virgen|Dios|ángel|angel|cruz|Diablo|Gauchito|Difunta|Pachamama)/i.test(mod + leer('src/desafio-duendes-nuevos.js')), 'nada religioso ni figuras sagradas');
}
console.log(`OK 4.8 ataques · ${pasos} comprobaciones · lados (${BASES.length} bases), tácticas, curandero, enjambre, composición y reciclado`);
