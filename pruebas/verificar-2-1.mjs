// 2.1: las diez mejoras (cinco del Relax, cinco del Desafío), en lo que tienen de
// lógica pura. Las partidas reales están en `pruebas/humo-2-1.cjs`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as G from '../src/grabador.js';
import * as R from '../src/rastros.js';
import * as P from '../src/pronostico.js';
import * as A from '../src/almanaque.js';
import * as C from '../src/conservas.js';
import * as V from '../src/desafio-valle.js';
import { TIPOS_ALIEN, composicionOleada, RECETAS, sanearDesafio, CATEGORIAS_TALLER } from '../src/desafio-reglas.js';
import { TRUEQUES, NOMBRE_COSA } from '../src/trueque.js';
import { ENTRADAS } from '../src/cuaderno.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js'), des = leer('src/desafio.js');
const ENTRADA = Object.fromEntries(ENTRADAS.map((e) => [e.id, e]));

// ======================================================== 1. el grabador de cantos
{
  // cada canto grabable existe en el cuaderno y tiene su método de sonido
  const son = leer('src/sonido.js');
  for (const [esp, c] of Object.entries(G.CANTOS)) {
    assert.ok(ENTRADA[esp], `${esp} está en el cuaderno`);
    assert.match(son, new RegExp(`\\n  ${c.metodo}\\(`), `el motor sabe hacer cantar ${esp} (${c.metodo})`);
    assert.equal(G.ESPECIE_DE_METODO[c.metodo], esp);
  }
  const cantos = [];
  G.anotarCanto(cantos, 'chucao', { x: 30, z: 0 }, 10);
  G.anotarCanto(cantos, 'carpintero', { x: 10, z: 0 }, 10);
  G.anotarCanto(cantos, 'zorzal', { x: 1, z: 0 }, 10);
  assert.equal(cantos.length, 2, 'lo que no se puede grabar no se anota');
  const aca = { x: 0, z: 0 };
  assert.deepEqual(G.queGrabar(cantos, aca, 11, { chucao: {}, carpintero: {} }, {}), { especie: 'carpintero' }, 'el más cercano');
  assert.deepEqual(G.queGrabar(cantos, aca, 11, { chucao: {}, carpintero: {} }, { carpintero: {} }), { especie: 'chucao' }, 'lo que falta grabar va primero');
  assert.deepEqual(G.queGrabar(cantos, aca, 11, { chucao: {} }, {}), { especie: 'chucao' }, 'lo no anotado queda para después');
  assert.deepEqual(G.queGrabar(cantos, aca, 11, {}, {}), { especie: 'carpintero', motivo: 'sinAnotar' });
  assert.equal(G.queGrabar(cantos, aca, 30, { chucao: {} }, {}), null, 'un canto viejo ya pasó');
  assert.equal(G.queGrabar(cantos, { x: 500, z: 0 }, 11, { chucao: {} }, {}), null, 'lejos, sólo viento');
  // se pasa de a una grabación, en orden, y vuelve a empezar
  const gr = { chucao: { dia: 1 }, cisne: { dia: 2 } };
  assert.equal(G.siguienteGrabacion(gr, null), 'chucao');
  assert.equal(G.siguienteGrabacion(gr, 'chucao'), 'cisne');
  assert.equal(G.siguienteGrabacion(gr, 'cisne'), 'chucao');
  assert.equal(G.siguienteGrabacion({}, null), null);
  // contesta el más cercano de su especie, y de lejos nadie
  const s = [{ tipo: 'cisne', pos: { x: 100, z: 0 } }, { tipo: 'cisne', pos: { x: 40, z: 0 } }, { tipo: 'pato', pos: { x: 5, z: 0 } }];
  const q = G.quienContesta('cisne', s, aca, () => 0.5);
  assert.equal(q.d, 40); assert.ok(q.demora > 1 && q.demora < 4);
  assert.equal(G.quienContesta('cisne', [{ tipo: 'cisne', pos: { x: 900, z: 0 } }], aca), null);
  // el que viene se queda a unos metros, del lado de donde venía
  const v = G.adondeViene({ x: 60, z: 0 }, aca, () => 0.5);
  assert.ok(v.x > 8 && v.x < 17 && Math.abs(v.z) < 1e-9);
  assert.deepEqual(G.sanearGrabaciones({ chucao: { dia: 3 }, dragon: {} }), { chucao: { dia: 3 } });
  assert.match(main, /case 'grabador': usarGrabador\(\); break;/);
  assert.match(leer('src/fauna.js'), /function llamar\(especie, pos\)/, 'el carpintero y las cachañas vienen');
  assert.match(leer('src/guardado.js'), /grabaciones: sanearGrabaciones\(p\.grabaciones\)/);
}

// ======================================================== 2. rastros que se pueden seguir
{
  for (const r of Object.values(R.RASTROS)) assert.ok(ENTRADA[r.entrada]?.seccion === 'rastros', `${r.entrada} tiene ficha`);
  const jug = { x: 0, z: 0 };
  const suj = [
    { tipo: 'huemul', pos: { x: 100, z: 0 } }, { tipo: 'zorro', pos: { x: 20, z: 0 } }, { tipo: 'pudu', pos: { x: 400, z: 0 } }, { tipo: 'cisne', pos: { x: 90, z: 0 } },
  ];
  assert.equal(R.elegirRastro(suj, jug, {}, () => 0.1).tipo, 'huemul', 'sólo animales con rastro y a la distancia justa');
  assert.equal(R.elegirRastro([suj[1]], jug, {}), null, 'demasiado cerca no deja rastro que seguir');
  const huellas = R.trazarRastro({ x: 0, z: 0 }, { x: 0, z: 60 }, 'huemul', { azar: () => 0.3 });
  assert.ok(huellas.length > 40, `una hilera larga (${huellas.length})`);
  const ultima = huellas[huellas.length - 1];
  assert.ok(ultima.z > 50 && ultima.z < 56, 'termina a unos pasos del animal');
  // alternan de lado y apuntan hacia adelante
  assert.ok(huellas.every((h) => Math.cos(h.rumbo) > 0.5), 'cada huella mira hacia donde va el animal');
  const pasos = huellas.slice(1).map((h, i) => Math.hypot(h.x - huellas[i].x, h.z - huellas[i].z));
  assert.ok(pasos.every((p) => p > 0.4 && p < 1.6), 'el paso del huemul');
  assert.ok(R.trazarRastro({ x: 0, z: 0 }, { x: 0, z: 60 }, 'pudu').length > huellas.length, 'el pudú da pasitos');
  // no pisa el agua
  const seco = R.trazarRastro({ x: 0, z: 0 }, { x: 0, z: 60 }, 'zorro', { tierra: (x, z) => z < 30 });
  assert.ok(seco.every((h) => h.z < 30));
  assert.ok(R.huellaCerca(huellas, { x: huellas[10].x + 0.5, z: huellas[10].z }));
  assert.equal(R.huellaCerca(huellas, { x: 50, z: 0 }), null);
  const va = R.haciaDondeVa(huellas);
  assert.ok(va.z > 40);
  assert.ok(R.hayQueAlargar(huellas, { x: ultima.x, z: ultima.z - 3 }, { x: 0, z: 90 }), 'llegaste y el animal siguió: se alarga');
  assert.ok(!R.hayQueAlargar(huellas, { x: 0, z: 0 }, { x: 0, z: 90 }), 'desde el principio, no');
  assert.ok(R.envejecer(0, 1, 1) > R.envejecer(0, 1, 0), 'la lluvia borra más rápido');
  const arr = R.arranque(jug, { x: 100, z: 0 }, () => 0.5);
  assert.ok(arr.x > 5 && arr.x < 25, 'arranca cerca tuyo, del lado del animal');
  assert.match(main, /if \(!objetivo && mirarRastro\(\)\) break;/);
}

// ======================================================== 3. el tiempo que se ve venir
{
  assert.equal(P.horasHasta(75, 30), 1, 'con días de 30 minutos, 75 segundos son una hora');
  assert.equal(P.frente('despejado', 'lluvia', 10), 0, 'falta mucho: no se ve');
  assert.ok(P.frente('despejado', 'lluvia', 0.5) > 0.7, 'ya encima: el frente cargado');
  assert.ok(P.frente('despejado', 'nublado', 0.5) < P.frente('despejado', 'lluvia', 0.5), 'un nublado se ve menos que la lluvia');
  assert.equal(P.frente('lluvia', 'lluvia', 0), 0);
  assert.equal(P.frente('lluvia', 'despejado', 0), 0, 'lo que se va no se dibuja como frente');
  for (const q of ['ramon', 'nicanor', 'ema', 'guarda', 'ercilia']) {
    assert.ok(P.frasePronostico(q, 'despejado', 'lluvia', 1, () => 0), `${q} anuncia la lluvia`);
    assert.ok(P.frasePronostico(q, 'lluvia', 'despejado', 1, () => 0), `${q} anuncia que para`);
  }
  assert.equal(P.frasePronostico('ramon', 'despejado', 'lluvia', 9), null, 'falta mucho: nadie dice nada');
  assert.equal(P.frasePronostico('ramon', 'despejado', 'despejado', 1), null);
  assert.equal(P.acerto({ proximo: 'lluvia' }, 0.8), true);
  assert.equal(P.acerto({ proximo: 'lluvia' }, 0.1), false);
  assert.match(leer('src/clima.js'), /estado\.objetivo = estado\.proximo; estado\.proximo = elegirClima\(\)/, 'el clima se decide con un cambio de anticipación');
  assert.match(leer('src/cielo.js'), /uniform float uFrente/);
  assert.match(leer('src/cielo.js'), /smoothstep\(0\.15, -0\.85, d\.x\)/, 'entra por el oeste (-x), sobre la cordillera');
  assert.match(main, /frasePronostico\(npc\.clave/);
  const { crearDiario } = await import('../src/diario.js');
  const d = crearDiario(); d.anotar('pronostico', { quien: 'Don Ramón', proximo: 'lluvia' }); d.clima(1, { lluvia: 0.9, viento: 0.2 }, 0);
  assert.match(d.cerrar(4, 'verano', () => 0).texto, /Don Ramón dijo que llovía, y llovió\./);
}

// ======================================================== 4. lo que llega y lo que se va
{
  assert.equal(A.cuandoSeVe(ENTRADA.picaflor), A.ALMANAQUE.picaflor.cuando);
  assert.equal(A.cuandoSeVe(ENTRADA.huemul), A.TODO_EL_ANIO);
  assert.equal(A.cuandoSeVe(ENTRADA.coihue), null, 'sólo fauna');
  // lo que dice el almanaque es lo que hace el juego: los que "se van" no aparecen en invierno
  const vida = leer('src/vida.js'), bichos = leer('src/bichos.js');
  assert.match(vida, /hayPicaflor = deDia && m\.invierno < 0\.5/);
  assert.match(vida, /hayBandurrias = [^\n]*m\.invierno < 0\.5/);
  assert.match(bichos, /hayCauquen = deDia && m\.invierno < 0\.5/);
  assert.match(bichos, /hayMurcielagos = [^\n]*m\.invierno < 0\.5/);
  const nombres = { picaflor: 'el picaflor', bandurria: 'las bandurrias', cauquen: 'el cauquén' };
  const ida = A.avisoDeEstacion('otono', 'invierno', { picaflor: {}, cauquen: {} }, nombres);
  assert.equal(ida.titulo, 'Se fueron al norte');
  assert.match(ida.texto, /el picaflor y el cauquén/);
  assert.equal(A.avisoDeEstacion('invierno', 'verano', { bandurria: {} }, nombres).titulo, 'Volvieron');
  assert.equal(A.avisoDeEstacion('verano', 'otono', { picaflor: {} }, nombres), null, 'del verano al otoño no se va nadie');
  assert.equal(A.avisoDeEstacion('otono', 'invierno', {}, nombres), null, 'sólo nombra lo que anotaste');
  // la V de la bandada
  assert.deepEqual(A.lugarEnLaV(0), { lateral: 0, atras: 0 });
  assert.ok(A.lugarEnLaV(1).lateral > 0 && A.lugarEnLaV(2).lateral < 0 && A.lugarEnLaV(3).atras > A.lugarEnLaV(1).atras);
  assert.match(leer('src/fauna.js'), /function actualizarMigracion/, 'en otoño pasan los cauquenes');
  assert.match(main, /Cuándo: \$\{cuando\}/);
}

// ======================================================== 5. de la huerta a la mesa
{
  for (const id of Object.keys(C.CONSERVAS)) assert.ok(ENTRADA[id]?.seccion === 'recetas', `${id} tiene ficha`);
  const e = { calafate: { cantidad: 6 }, llaollao: { cantidad: 3 } };
  const t = C.tendalVacio();
  assert.equal(C.avisoTendal(t, e), 'Colgar a secar (5 calafates)');
  assert.deepEqual(C.usarTendal(t, e), { accion: 'colgar', conserva: 'calafate-seco' });
  assert.equal(e.calafate.cantidad, 1, 'se gastan al colgar');
  assert.equal(C.usarTendal(t, e).accion, 'secando');
  C.avanzarSecado(t, 6, { lluvia: 0.8 });
  assert.equal(t.horas, 0, 'con lluvia no seca');
  C.avanzarSecado(t, 6, { noche: 1 });
  assert.equal(t.horas, 1.5, 'de noche, mucho menos');
  C.avanzarSecado(t, 20, {});
  assert.ok(C.listo(t));
  assert.deepEqual(C.usarTendal(t, e), { accion: 'descolgar', conserva: 'calafate-seco' });
  assert.equal(t.colgado, null, 'el tendal queda libre');
  assert.equal(C.queColgar(e), 'hongos-secos', 'después, el llao llao');
  assert.deepEqual(C.sanearTendal({ colgado: 'frasco-frutilla', horas: 3 }), C.tendalVacio(), 'el dulce no se seca: se cocina');
  assert.equal(C.queAbrir({ 'hongos-secos': { cantidad: 1 }, 'frasco-frutilla': { cantidad: 0 } }), 'hongos-secos');
  for (const id of Object.keys(C.CONSERVAS)) assert.ok(C.AL_ABRIR[id]);
  // el almacén: dos cosas nuevas que sólo se consiguen con conservas
  const grab = TRUEQUES.find((x) => x.id === 'grabador'), botas = TRUEQUES.find((x) => x.id === 'botas');
  assert.ok(grab.pide.some(([k]) => k === 'frasco-frutilla'));
  assert.ok(botas.pide.some(([k]) => k === 'calafate-seco'));
  for (const [k] of [...grab.pide, ...botas.pide]) assert.ok(NOMBRE_COSA[k], `${k} tiene nombre visible`);
  // las botas: el agua no chapotea
  const { firmaSonoraJugador } = await import('../src/percepcion.js');
  const conBotas = firmaSonoraJugador({ velocidadActual: 3, superficie: 'agua', botas: true });
  const sinBotas = firmaSonoraJugador({ velocidadActual: 3, superficie: 'agua' });
  assert.ok(conBotas < sinBotas * 0.6);
  // el llao llao se junta una vez anotado; el almacén atiende con las teclas 5 a 8 y con clic
  assert.match(leer('src/objetos.js'), /juntableTrasAnotar: true/);
  // 2.2: con once cambios van de a nueve por página (Tab), y el número es de la página
  assert.match(main, /if \(enElAlmacen\) \{ cambiarDeLaPagina\(Number\(codigo\.slice\(5\)\)\); break; \}/);
  // (3.6.2: el clic va con mousedown, ver alClicHud en main.js: el click no llegaba)
  assert.match(main, /alClicHud\(li, \(\) => cambiar\(i\)\)/);
  assert.match(main, /cambiar: 'Conseguido', rastrear: 'Rastreado'/, 'las fichas del almacén ya no dicen «undefined»');
}

// ======================================================== 6. rescates
{
  assert.equal(V.nocheDeRescate(2, { azar: () => 0 }), null, 'antes de la noche 3, no');
  assert.equal(V.nocheDeRescate(5, { azar: () => 0, esJefe: true }), null, 'la del jefe, no');
  assert.equal(V.nocheDeRescate(6, { azar: () => 0, especial: 'roja' }), null);
  assert.equal(V.nocheDeRescate(6, { azar: () => 0.9 }), null, 'no todas las noches');
  assert.ok(V.RESCATES[V.nocheDeRescate(6, { azar: () => 0 })]);
  assert.equal(V.nocheDeRescate(6, { azar: () => 0, lugares: ['puesto'], anterior: 'puesto' }), null, 'nunca el mismo dos veces seguidas');
  const pr = V.premioRescate(9);
  assert.ok(pr.tronco > 3 && pr.tabla > 3 && pr.cristal === 2);
  assert.ok(V.sigueEnojado({ ramon: 8 }, 'ramon', 7) && !V.sigueEnojado({ ramon: 8 }, 'ramon', 8));
  for (const r of Object.values(V.RESCATES)) assert.ok(V.SALUDO_ENOJADO[r.vecino], `${r.vecino} sabe enojarse`);
  assert.deepEqual(V.sanearRescates({ enojados: { ramon: 9, zorro: 3 }, hechos: '2' }), { enojados: { ramon: 9 }, hechos: 2 });
  assert.deepEqual(sanearDesafio({ rescate: { lugar: 'puesto', vida: 99 } }).rescate, { lugar: 'puesto', vida: 99, caido: false });
  assert.match(des, /function cerrarRescate\(\)/);
  assert.match(main, /charla\.enojado = !!desafio\?\.enojado\?\.\(npc\.clave\)/);
}

// ======================================================== 7. el excavador
{
  assert.ok(TIPOS_ALIEN.excavador?.excava);
  assert.ok(composicionOleada(6).every((t) => t !== 'excavador'), 'antes de la noche 7 no viene');
  assert.ok(composicionOleada(10).includes('excavador'), 'después sí');
  assert.ok(V.debeCavar({ distancia: 20, obraEnMedio: true }) && !V.debeCavar({ distancia: 20, obraEnMedio: false }) && !V.debeCavar({ distancia: 4, obraEnMedio: true }));
  const s = V.puntoDeSalida({ x: 20, z: 0 }, { x: 0, z: 0 });
  assert.ok(Math.abs(s.x - V.SALE_A) < 1e-9 && !s.bloqueado, 'asoma a unos metros tuyos, del lado por donde venía');
  const conLosa = V.puntoDeSalida({ x: 20, z: 0 }, { x: 0, z: 0 }, (x) => x < 6);
  assert.ok(conLosa.x >= 6 && conLosa.bloqueado, 'donde hay losa no asoma: sale más atrás');
  assert.match(leer('src/construccion.js'), /id: 'losa-piedra'/);
  // 3.8.0: el excavador es el duende topo (con su pala)
  assert.match(leer('src/duendes-modelo.js'), /excavador: \(\) => \(\{/, 'tiene cuerpo propio');
  assert.match(des, /if \(a\.estado === 'bajoTierra'\) return;/, 'bajo tierra no le llega nada');
  assert.match(leer('src/desafio-noche2.js'), /excavador: \{/, 'y ficha en el bestiario');
}

// ======================================================== 8. un jefe distinto cada vez
{
  assert.equal(V.varianteJefe(5), 'clasico');
  assert.equal(V.varianteJefe(10), 'llamador');
  assert.equal(V.varianteJefe(15), 'sombra');
  assert.equal(V.varianteJefe(20), 'artillero');
  assert.equal(V.varianteJefe(25), 'clasico', 'y vuelve a empezar');
  for (const v of V.VARIANTES_JEFE) assert.ok(V.NOMBRE_JEFE[v] && V.AVISO_JEFE[v]);
  assert.ok(!V.sombraVisible({ distancia: 20 }), 'la sombra no se ve');
  assert.ok(V.sombraVisible({ reflejo: 1, distancia: 20 }), 'con el haz encima, sí');
  assert.ok(V.sombraVisible({ distancia: 3 }) && V.sombraVisible({ distancia: 20, flash: 0.5 }));
  // el tiro con arco cae donde apunta
  const v = V.tiroParabolico({ x: 0, y: 3, z: 0 }, { x: 30, y: 1, z: 0 }, 22);
  const t = 30 / 22, y = 3 + v.y * t - 0.5 * 9.8 * t * t;
  assert.ok(Math.abs(y - 1) < 1e-6, `la piedra cae a la altura del blanco (${y.toFixed(3)})`);
  assert.match(des, /a\.variante = varianteJefe\(D\(\)\.oleadas\)/);
  assert.match(des, /function tirarRoca\(a, js\)/);
}

// ======================================================== 9. restos para explorar
{
  const d = V.disposicionRuina(() => 0.5);
  assert.equal(d.placas.length, 3);
  assert.ok(d.dormidos.length >= 2);
  assert.ok(d.premio.z > V.RUINA.tabiques[1], 'el premio está en la última cámara');
  // las paredes dejan una puerta en cada tabique
  const segs = V.paredesRuina();
  for (const z of V.RUINA.tabiques) {
    const enZ = segs.filter((s) => s[1] === z && s[3] === z);
    assert.equal(enZ.length, 2, 'cada tabique son dos tramos');
    assert.ok(Math.abs((enZ[1][0] - enZ[0][2]) - V.RUINA.puerta) < 1e-9, 'con la puerta en el medio');
  }
  assert.ok(V.placaActiva(0.1) && !V.placaActiva(1.5), 'las placas se prenden y se apagan');
  assert.ok(V.despierta({ distancia: 2, agachado: true, corriendo: false }), 'encima se despierta igual');
  assert.ok(!V.despierta({ distancia: 5, agachado: true, corriendo: false }), 'agachado se pasa a unos metros');
  assert.ok(V.despierta({ distancia: 5, agachado: false, corriendo: false }));
  assert.ok(V.despierta({ distancia: 9, agachado: false, corriendo: true }), 'corriendo se oye de lejos');
  const w = V.aMundo({ x: 0, z: 10 }, 100, 100, 0);
  assert.deepEqual(w, { x: 100, z: 110 });
  const w2 = V.aMundo({ x: 0, z: 10 }, 0, 0, Math.PI / 2);
  assert.ok(Math.abs(w2.x - 10) < 1e-9 && Math.abs(w2.z) < 1e-9, 'girada, el pasillo apunta para donde mira');
  assert.match(leer('src/desafio-eventos.js'), /api\.col\?\.agregar\(\{ seg: true/, 'las paredes chocan');
  assert.match(des, /a\.estado !== 'dormido'\) n\+\+/, 'los dormidos no impiden dormir');
}

// ======================================================== 10. la forja de cristal
{
  assert.ok(CATEGORIAS_TALLER.some((c) => c.clave === 'forja'));
  for (const [clave, f] of Object.entries(V.FORJA)) {
    const r = RECETAS.find((x) => x.da?.cosa === clave);
    assert.ok(r && r.cat === 'forja' && r.requiere === f.arma && r.pide.cristal > 0, `${clave} se fabrica en la forja`);
    assert.equal(V.efectoDeArma(f.arma, { [clave]: 1 }), f.efecto);
  }
  assert.equal(V.efectoDeArma('lanza', {}), null);
  assert.ok(V.eficacia('hielo', 'rastreador') > V.eficacia('hielo', 'bruto'), 'el hielo sirve contra los rápidos');
  assert.ok(V.eficacia('empuje', 'tirador') > V.eficacia('empuje', 'jefe'), 'el empuje contra los que tiran');
  const cadena = V.cadenaDeRayo({ x: 0, z: 0 }, [{ x: 3, z: 0 }, { x: 5, z: 0 }, { x: 40, z: 0 }, { x: 7, z: 0 }]);
  assert.deepEqual(cadena.map((c) => c.x), [3, 5], 'salta a los dos más cercanos, de uno en uno');
  assert.equal(V.cadenaDeRayo({ x: 0, z: 0 }, [{ x: 30, z: 0 }]).length, 0, 'lejos, no salta');
  assert.match(des, /p\.efecto = efectoDeArma\(id, progreso\(\)\.cosas\)/);
  // 2.6: el "desde" va en su propio vector (herirAlien usa _v por dentro)
  assert.match(des, /if \(q\.efecto\) aplicarForja\(q\.efecto, a, _desde\.copy\(_p0\), q\.dano\)/);
  assert.match(des, /aplicarForja\(efectoDeArma\(id, progreso\(\)\.cosas\), a, js\.pos/);
}

// ---------------- el lugar del vecino aguanta lo suficiente para llegar
// (en partida, trece invasores lo tiraban en diez segundos)
{
  const caeEn = (n) => V.VIDA_LUGAR / (V.danoAlLugar(n, 1, 1));
  assert.ok(caeEn(13) > 90 && caeEn(13) < 180, `una oleada entera tira el lugar en ${caeEn(13).toFixed(0)} s`);
  assert.ok(caeEn(4) > caeEn(13) && caeEn(4) < 300, `cuatro lo tiran en ${caeEn(4).toFixed(0)} s`);
  assert.equal(V.danoAlLugar(0, 1), 0);
  assert.equal(V.danoAlLugar(5, -1), 0);
}

// ---------------- nombres que el armador entiende
// `TODO_EL_AÑO` pasaba todas las pruebas en Node y en el index.html armado quedaba
// `TODO_EL_A`: el juego no arrancaba. El armador reconoce identificadores con \w, así
// que nada que se exporte o se importe puede llevar acentos ni eñes.
{
  const raro = /[^\x00-\x7F]/;
  const dir = new URL('../src/', import.meta.url);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(new URL(f, dir), 'utf8');
    for (const m of s.matchAll(/export\s+(?:async\s+)?(?:const|let|function\*?|class)\s+([^\s=(]+)/g)) {
      assert.ok(!raro.test(m[1]), `${f}: «${m[1]}» se exporta con un carácter que el armador corta`);
    }
    for (const m of s.matchAll(/(?:export|import)\s*\{([^}]*)\}/g)) {
      for (const n of m[1].split(',')) assert.ok(!raro.test(n), `${f}: «${n.trim()}» se exporta o importa con un carácter que el armador corta`);
    }
  }
}

console.log('2.1: ok · las diez mejoras (grabador, rastros, pronóstico, almanaque, conservas · rescates, excavador, jefes, restos, forja)');
