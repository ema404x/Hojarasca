// 4.10.1 · ARREGLOS de la ronda de revisión de los NPC (informe bugs3/zona-NPC.md). Un caso por cada hallazgo, ejecutando la conducta:
//   1  el vecino contratado en dos lugares a la vez (club de lectura y noche de estrellas) · 2  el compadre empleado que viene «de visita» a tu mesa
//   3  comprarle el negocio a quien ya contrataste · 6/7/8  textos con la concordancia rota · 9  la regex con la barra perdida · 10  la lista sin «y»
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { A, G, V, M, J, N, PN, NV, NVJ, NJ, crearMundo, mover, vec } from './ayuda-npc-mundo.mjs';
import { derechaDe, funcion } from './ayuda-codigo.mjs';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
const cal = await import('../src/calendario.js');
const fi = await import('../src/fiestas.js');

// el local de mentira (mismo armado que las pruebas del 4.4)
function armarLocal(W, { evento = () => null } = {}) {
  const { P, jug, gente } = W;
  const o = { plano: { id: 'local-almacen' }, datos: { x: W.c0.x + 20, z: W.c0.z + 70, rot: 0.5, etapas: 1 } };
  const est = N.negocioPropioNuevo(); est.tipo = 'almacen'; est.abierto = true; P.negocioPropio = est; P.empleadosNegocio = M.empleadosNuevo();
  const negocio = { estado: () => P.negocioPropio, cola: N.colaNueva(), local: () => o, distancia: (ob) => Math.hypot(ob.datos.x - jug.estado.pos.x, ob.datos.z - jug.estado.pos.z),
    aMundo: (ob, lx, lz) => { const r = ob.datos.rot || 0, c = Math.cos(r), s = Math.sin(r); return { x: ob.datos.x + lx * c + lz * s, z: ob.datos.z - lx * s + lz * c }; },
    medidas: (ob) => PN.MEDIDAS[ob.plano.id], panelAbierto: () => false, redibujar() {}, atender: () => false };
  const notas = [];
  const JE = J.crearEmpleadosNegocioJuego({ progreso: () => P, negocio: () => negocio, gente: () => gente, nota: (t, s) => notas.push(`${t} | ${s}`), guardar() {}, refrescarBarra() {}, sonido: () => ({ juntar() {} }),
    lluvia: () => 0, alturaDePie: () => 0, msFigura: () => 3, alClic() {}, evento });
  A.fijarOcupacionExterna(JE.ocupacion);
  return { JE, notas, negocio };
}
const amigoDe = (P, k, puntos = 30) => { for (let i = 0; i < 40 && V.puntosAmistad(k, P) < puntos; i++) V.cambiarAmistad(P, k, 5, 1); };

// ---------------------------------------------------------------- 1 · club de lectura / noche de estrellas × empleado de turno
{
  const W = crearMundo({ hora: 6, dia: 1, amigos: false });
  const { P, jug, gente, lista } = W;
  const { JE } = armarLocal(W);
  const NJuego = NJ.crearNoticiasJuego({ progreso: () => P, ajustes: () => ({}), desafio: () => false, nota() {}, guardar() {}, registrar() {}, pronostico: () => [], cartaVieja: () => false, concursos: () => null, redibujar() {}, clima: () => null });
  // la línea de main.js que arma `noticiasDestino` para la aldea, evaluada de verdad
  const lineaND = derechaDe(main, 'noticiasDestino: ').replace(/,\s*\/\/.*$/, '');
  const noticiasDestino = new Function('env', `with (env) { return (${lineaND}); }`)({ empleadosNegocioJuego: JE, noticiasJuego: NJuego });
  const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75, noticiasDestino });
  const fd = (x) => { const f = fi.fechaDe(x); return f && f.tipo !== 'cumple-jugador' ? f : null; };
  let dias = 0, contratadosEnClub = 0;
  const dobles = [];
  for (let d = 1; d <= 400 && dias < 12; d++) {
    P.dia = d; P.horas = 7;
    const club = cal.hayClub(d, P.aldea, fd), est2 = cal.hayEstrellas(d, P.aldea, fd);
    if (!club && !est2) continue;
    for (const e of [...P.empleadosNegocio.lista]) JE.__despedir(e.k);
    const asis = cal.asistentes(club ? 'club' : 'estrellas', d, P.aldea).filter((k) => M.esCandidato(k) && !A.esCumpleanos(k, d));
    const quienes = [];
    for (const k of asis.slice(0, 2)) { amigoDe(P, k); JE.__contratar(k); if (M.empleadoDe(P.empleadosNegocio, k)) quienes.push(k); }
    if (!quienes.length) continue;
    dias++; contratadosEnClub += quienes.length;
    for (let m = 15 * 60; m <= 20 * 60 + 40; m++) {
      P.horas = m / 60;
      jug.estado.pos.x = W.c0.x + 3 + (m % 7); jug.estado.pos.z = W.c0.z + 2;
      for (const x of lista) if (!x.dormido) mover(x, 1.25);
      AG.actualizar(1.25); JE.actualizar(1.25);
      for (const q of quienes) {
        const f = lista.filter((x) => !x.dormido && !x.quitado && (x.clave === `aldea-${q}` || x.clave === `poblador-${q}`));
        if (f.some((x) => x.empleadoNegocio) && f.some((x) => !x.empleadoNegocio)) dobles.push(`${q} día ${d} ${(m / 60).toFixed(2)}`);
      }
    }
  }
  ok(dias >= 8 && contratadosEnClub >= 8, `se probaron días de club/estrellas con contratados (${dias} días, ${contratadosEnClub} contratados)`);
  eq(dobles, [], 'ningún vecino contratado aparece a la vez en el club/las estrellas y detrás de tu mostrador');
  // y la regla vale por hora: de turno no va; libre (domingo, o terminado el turno) sí
  const W2 = crearMundo({ hora: 6, dia: 2, amigos: false });
  const L2 = armarLocal(W2);
  amigoDe(W2.P, 'padre'); L2.JE.__contratar('padre');
  const turno = M.empleadoDe(W2.P.empleadosNegocio, 'padre').turno;
  W2.P.dia = 2; W2.P.horas = turno === 1 ? 17 : 12;
  ok(L2.JE.deTurno('padre'), 'de turno a esa hora');
  W2.P.horas = 22; ok(!L2.JE.deTurno('padre'), 'terminado el turno ya no');
  W2.P.dia = 7; W2.P.horas = 12; ok(!L2.JE.deTurno('padre'), 'el domingo no trabaja');
  ok(!L2.JE.deTurno('pescador'), 'quien no es empleado nunca');
  const L3 = armarLocal(W2, { evento: () => ({ lugar: 'cita' }) });
  W2.P.dia = 2; W2.P.horas = turno === 1 ? 17 : 12; ok(!L3.JE.deTurno('padre'), 'si la aldea se lo llevó a una cita o una fiesta, no está de turno (manda la aldea)');
}

// ---------------------------------------------------------------- 2 · la visita del compadre empleado
{
  const W = crearMundo({ amigos: false, hora: 16.5, dia: 3 });
  const { P, jug, gente, lista } = W;
  const { JE } = armarLocal(W);
  for (let i = 0; i < 12; i++) V.cambiarAmistad(P, 'madre', 20, 1);   // compadre
  JE.__contratar('madre');
  ok(M.empleadoDe(P.empleadosNegocio, 'madre'), 'la madre quedó contratada');
  const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75 });
  for (let i = 0; i < 80; i++) { P.horas += 1.25 / 75; jug.estado.pos.x = W.c0.x + 3; jug.estado.pos.z = W.c0.z + 2; for (const x of lista) if (!x.dormido) mover(x, 1.25); AG.actualizar(1.25); JE.actualizar(1.25); }
  ok(JE.deTurno('madre'), 'a las 17 está de turno');
  const entorno = { gente: { gente: lista }, aldeaGente: AG, charla: { npc: null }, empleadosNegocioJuego: JE };
  const rest = derechaDe(main, 'puedeVenir: ').replace(/,\s*\/\/.*$/, '');
  const puedeVenir = new Function('env', `with (env) { return (${rest}); }`)(entorno);
  ok(AG.figura('madre') || lista.some((x) => (x.claveAldea || x.clave) === 'aldea-madre' || x.claveAldea === 'madre'), 'la figura de la aldea de la madre existe (el caso del informe)');
  eq(puedeVenir('madre'), false, 'de turno detrás del mostrador, el compadre no «puede venir» a tu mesa');
  // traerVisita real: devuelve falso y no deja a nadie de visita
  const ent2 = { ...entorno, visitante: null };
  const traer = funcion(main, 'traerVisita', ent2);
  eq(traer('madre', { mesa: { x: 0, z: 0 } }, true), false, 'traerVisita se niega con el empleado de turno');
  eq(ent2.visitante, null, 'no queda registrada ninguna visita');
  ok(!lista.some((x) => x.deVisita), 'ninguna figura quedó «de visita»');
  // terminado el turno vuelve a poder venir
  P.horas = 22.5;
  ok(!JE.deTurno('madre'), 'a las 22:30 ya no está de turno');
  const otro = { ...entorno, empleadosNegocioJuego: { deTurno: () => false } };
  ok(new Function('env', `with (env) { return (${rest}); }`)(otro)('madre'), 'libre del turno, puede venir a tu mesa como siempre');
}

// ---------------------------------------------------------------- 3 · comprarle el negocio a un empleado tuyo
{
  const W = crearMundo({ amigos: true, hora: 10, dia: 40 });
  const { P } = W;
  P.economia.pesos = 900000;
  const notas = [];
  const L = armarLocal(W);
  const JE = L.JE;
  const NVJu = NVJ.crearNegociosVecinosJuego({ progreso: () => P, desafio: () => false, nota: (t, s) => notas.push(`${t} | ${s}`), guardar() {}, refrescarBarra() {}, sonido: () => ({ anotar() {} }),
    liberarEmpleado: (k, motivo) => JE.liberar(k, motivo) });
  JE.__contratar('panadera');
  eq(P.empleadosNegocio.lista.map((x) => x.k), ['panadera'], 'Rosa quedó contratada');
  P.vecindad.personas.panadera.hist = 3;
  NVJu.elegir({ clave: 'panadera' }, 'negocios:comprar');
  const antes = P.economia.pesos;
  const r = NVJu.elegir({ clave: 'panadera' }, 'negocios:cerrar');
  ok(r.comprado === 'panaderia' && NV.esTuyo(P, 'panaderia'), 'la compra se cerró');
  eq(P.empleadosNegocio.lista.map((x) => x.k), [], 'al cerrar la compra Rosa deja de ser empleada tuya (no cobra dos sueldos)');
  ok(notas.some((t) => /Rosa dejó de trabajar en tu local/.test(t)), 'el aviso de la compra lo dice');
  ok(L.notas.some((t) => /Le compraste su negocio/.test(t)), 'y el aviso del empleo también');
  const rut = A.rutinaAldea('panadera', 10, 2, P.aldea, 41);
  ok(rut.lugar !== null, 'a las 10 de un día hábil Rosa vuelve a su panadería (ya no queda «fuera» por el turno)');
  const libro0 = P.economia.libro.length;
  for (let d = 41; d < 45; d++) { P.dia = d; P.horas = 22; JE.__tick(2); NV.pasarDia(P, d); }
  ok(!P.economia.libro.slice(libro0).some((l) => /^Sueldo: Rosa/.test(l.motivo)), 'no se le paga el sueldo del local después de la compra');
  ok(!JE.enLaAldea('panadera'), 'y sigue sin poder contratársela (la guarda del 4.4.2)');
  ok(antes - P.economia.pesos >= 0, 'se pagó la compra');
}

// ---------------------------------------------------------------- 5 · el chico que estudia afuera no va al concurso
{
  const CO = await import('../src/concursos.js');
  const COJ = await import('../src/concursos-juego.js');
  let dia = 0, id = null;
  for (let d = 1; d < 200; d++) { const c = CO.concursoDeFecha(fi.fechaDe(d), d); if (c && (CO.CONCURSOS[c].compiten.nene || CO.CONCURSOS[c].compiten.nena)) { dia = d; id = c; break; } }
  ok(dia > 0, 'hay un concurso donde compite un chico (' + id + ', día ' + dia + ')');
  const chico = CO.CONCURSOS[id].compiten.nene ? 'nene' : 'nena';
  const armar = (afuera) => {
    const W = crearMundo({ amigos: false, dia, hora: 16.2 });
    if (afuera) { W.P.aldea.chicos = W.P.aldea.chicos || {}; W.P.aldea.chicos[chico] = { ...(W.P.aldea.chicos[chico] || {}), afuera: dia + 2, oficio: null, carrera: null }; }
    const CJ = COJ.crearConcursosJuego({ progreso: () => W.P, desafio: () => false, nota() {}, guardar() {}, cobrar() {}, redibujar() {}, nombresFoto: () => ({}), fiestaEnCurso: () => false });
    const NJu = NJ.crearNoticiasJuego({ progreso: () => W.P, ajustes: () => ({}), desafio: () => false, nota() {}, guardar() {}, registrar() {}, pronostico: () => [], cartaVieja: () => false, concursos: () => CJ, redibujar() {}, clima: () => null });
    const AG = G.crearAldeaGente({ progreso: () => W.P, gente: () => W.gente, jugador: () => W.jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => 'sol', ambiente: () => ({ clima: 'sol', estacion: 'verano' }), hablandoCon: () => null, segundosPorHora: () => 75, noticiasDestino: (k) => NJu.destino(k) });
    return { W, CJ, NJu, AG };
  };
  const sim = (x) => { x.W.P.horas = 16.5; for (let i = 0; i < 400; i++) { x.W.jug.estado.pos.x = x.W.c0.x + 3; x.W.jug.estado.pos.z = x.W.c0.z + 2; for (const q of x.W.lista) if (!q.dormido) mover(q, 1.25); x.AG.actualizar(1.25); } };
  const con = armar(false); sim(con);
  ok(con.CJ.destinos().has(chico), 'control: con el chico en casa, la última hora va a la plaza');
  eq(con.AG.personas.get(chico)?.destino?.edificio, 'plaza', 'control: y la aldea lo lleva a la plaza');
  const sin = armar(true); sim(sin);
  ok(A.chicoAfuera(sin.W.P.aldea, chico), 'el chico está estudiando afuera');
  ok(!sin.CJ.destinos().has(chico), 'estudiando afuera, el concurso no lo manda a la plaza');
  ok(!sin.AG.personas.get(chico)?.destino, 'y la aldea no le da destino');
  ok(sin.AG.personas.get(chico)?.npc?.dormido !== false, 'su figura no está a la vista');
}

// ---------------------------------------------------------------- 6/7/8 · textos de los negocios y de la contratación
{
  const feos = [];
  const lint = (t, ctx) => {
    const x = String(t);
    if (/\b(de|a) el\b/i.test(x)) feos.push('«de el» ' + ctx + ' :: ' + x.slice(0, 120));
    if (/Eso ya no es tuya/.test(x)) feos.push('«Eso … tuya» ' + ctx);
    if (/su (panadera|herrero|guardaparque|modista|fotógrafa|pescador)\b/.test(x)) feos.push('«deja su <oficio>» ' + ctx + ' :: ' + x.slice(0, 120));
    if (/undefined|NaN|\{[a-z]+\}/.test(x)) feos.push('texto roto ' + ctx + ' :: ' + x.slice(0, 120));
  };
  const textos = (r) => { const o = []; if (!r) return o; for (const q of r.renglones || []) o.push(q); if (r.sub) { o.push(r.sub.texto); for (const q of r.sub.opciones || []) o.push(q.titulo); } return o; };
  eq([NV.deNegocio('el almacén'), NV.deNegocio('la panadería de Rosa'), NV.deNegocio('el almacén de Ercilia')], ['del almacén', 'de la panadería de Rosa', 'del almacén de Ercilia'], 'deNegocio contrae «de el» y deja «de la»');
  eq([NV.loDe('almacen'), NV.loDe('panaderia')], ['lo', 'la'], 'loDe: «al comprarlo» / «al comprarla»');
  for (const id of NV.IDS_NEGOCIOS) {
    const W = crearMundo({ amigos: false, hora: 10, dia: 60 });
    const Pn = W.P; Pn.economia.pesos = 900000;
    const N0 = NV.NEGOCIOS[id];
    for (let i = 0; i < 80 && V.puntosAmistad(N0.vecino, Pn) < 200; i++) V.cambiarAmistad(Pn, N0.vecino, 20, 1);
    (Pn.vecindad.personas[N0.vecino] ||= {}).hist = 3;
    const notas = [];
    const Jn = NVJ.crearNegociosVecinosJuego({ progreso: () => Pn, desafio: () => false, nota: (t, q) => notas.push(t, q), guardar() {}, refrescarBarra() {}, sonido: () => ({ anotar() {} }), liberarEmpleado: () => false });
    const sc = { clave: N0.vecino };
    // vender sin ser tuyo: el texto de «Eso ya no es tuyo»
    const sinSerTuyo = textos(Jn.elegir(sc, 'negocios:vendido'));
    for (const t of sinSerTuyo) lint(t, id + ' vendido sin ser tuyo');
    ok(sinSerTuyo.some((t) => /^Eso ya no es tuyo: no hay nada que vender\.$/.test(t)), id + ': «Eso ya no es tuyo» (neutro)');
    // socio, aviso de retiro, el cuaderno, el libro
    const pasos = ['negocios', 'negocios:socio', 'negocios:socio:' + NV.montosDeAporte(id)[0], 'negocios:aporte', 'negocios:retiro', 'negocios:seguir', 'negocios:retiro'];
    for (const q of pasos) for (const t of textos(Jn.elegir(sc, q))) lint(t, id + ' ' + q);
    for (let d = 61; d < 80; d++) { Pn.dia = d; NV.pasarDia(Pn, d); }
    Pn.economia.pesos = 900000; Pn.dia = 81;
    for (const q of ['negocios:comprar', 'negocios:cerrar', 'negocios:cuentas', 'negocios:caja', 'negocios:vender', 'negocios:vendido']) for (const t of textos(Jn.elegir(sc, q))) lint(t, id + ' ' + q);
    for (let i = 0; i < notas.length; i++) lint(notas[i], id + ' nota');
    const e = (tag, cls, txt) => ({ tag, cls, txt, hijos: [], appendChild(x) { this.hijos.push(x); return x; } });
    const ficha = e('div'); Jn.paginaCuaderno().dibujar(ficha, e);
    const walk = (nd) => { if (nd.txt) lint(nd.txt, id + ' cuaderno'); nd.hijos.forEach(walk); }; walk(ficha);
    for (const l of Pn.economia.libro || []) lint(l.motivo, id + ' libro');
  }
  eq(feos, [], 'los textos de los negocios no tienen «de el», «Eso … tuya» ni placeholders (los ocho negocios, compra, sociedad, retiro, venta, cuaderno y libro)');
  // el libro de cuentas dice «del almacén» y «al comprarlo»
  const W = crearMundo({ amigos: true, hora: 10, dia: 40 });
  W.P.economia.pesos = 900000; W.P.vecindad.personas.ercilia.hist = 3;
  const Ja = NVJ.crearNegociosVecinosJuego({ progreso: () => W.P, desafio: () => false, nota() {}, guardar() {}, refrescarBarra() {}, sonido: () => ({ anotar() {} }), liberarEmpleado: () => false });
  Ja.elegir({ clave: 'ercilia' }, 'negocios:socio:' + NV.rangoDeAporte('almacen').min);
  ok(NV.leerNegociosVecinos(W.P).socios.almacen, 'quedó de socia del almacén');
  W.P.dia = 50; NV.pasarDia(W.P, 50);
  Ja.elegir({ clave: 'ercilia' }, 'negocios:comprar'); Ja.elegir({ clave: 'ercilia' }, 'negocios:cerrar');
  const motivos = W.P.economia.libro.map((l) => l.motivo);
  ok(motivos.every((m) => !/\bde el\b/.test(m)), 'ningún asiento dice «de el»: ' + motivos.join(' | '));
  ok(motivos.every((m) => !/al comprarla$/.test(m)), 'la caja de socio del almacén no dice «al comprarla»');
  // la nota al contratar no dice «deja su <oficio>»
  const Wc = crearMundo({ amigos: false, hora: 10, dia: 3 });
  const Lc = armarLocal(Wc);
  for (const k of ['panadera', 'guardaparque', 'herrero']) { amigoDe(Wc.P, k, 60); Lc.JE.__contratar(k); }
  const contratos = Lc.notas.filter((t) => /trabaja para vos/.test(t));
  ok(contratos.length >= 2 && contratos.every((t) => /En ese horario deja lo que hacía\./.test(t)), 'al contratar: «En ese horario deja lo que hacía» (no «su panadera»): ' + contratos[0]);
}

// ---------------------------------------------------------------- 4 · NO CONFIRMADO: Lena, Chela, Ana y Susana SÍ se arman como mujer en el juego (el arnés del informe probaba con R = {})
{
  const C = await import('../src/gente-cuerpo.js');
  const GE = await import('../src/gente.js');
  const AV = await import('../src/aldea-vida.js');
  const hash = (r) => { let h = 0, c = 0; r.g.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position) { const q = o.geometry.attributes.position.array; for (let i = 0; i < q.length; i += 7) h = (h * 31 + Math.round(q[i] * 1000)) | 0; c += q.length; } }); return h + '/' + c; };
  const comoSeArma = (clave, col) => { const R = GE.__ROPA[clave] || {}; const a = hash(C.crearPersona(col, clave, false, R, {})); return a === hash(C.crearPersona(col, clave, false, { ...R, mujer: true }, {})) ? 'mujer' : a === hash(C.crearPersona(col, clave, false, { ...R, mujer: false }, {})) ? 'varon' : '?'; };
  for (const v of AV.VISITANTES) eq(comoSeArma('visitante-' + v.id, v.colores), v.genero === 'f' ? 'mujer' : 'varon', 'el visitante ' + v.nombre + ' se arma con el cuerpo que dice su género');
  eq(comoSeArma('familia-mama', AV.FAMILIA.mama.colores), 'mujer', 'Susana (tu mamá) se arma como mujer');
  eq(comoSeArma('familia-hermano', AV.FAMILIA.hermano.colores), 'varon', 'Facundo se arma como varón');
}

// ---------------------------------------------------------------- 9 · la regex con la barra perdida (vecindad.js)
{
  const fuenteV = leer('src/vecindad.js');
  ok(!fuenteV.includes('const m = /@(d+)$/') && fuenteV.includes('const m = /@(\\d+)$/'), 'la regex de lo comentado lleva \\d');
  const Wv = crearMundo({ amigos: false, hora: 10, dia: 30 });
  const v = Wv.P.vecindad;
  (v.personas.panadera ||= {});
  v.personas.panadera.coment = ['regalo:panadera@2', 'regalo:otro@29', 'sinfecha'];
  V.comentarioSobreVos('panadera', v, 30);
  ok(!v.personas.panadera.coment.includes('regalo:panadera@2'), 'lo comentado de un día viejo se olvida');
  ok(v.personas.panadera.coment.includes('regalo:otro@29') && v.personas.panadera.coment.includes('sinfecha'), 'lo reciente y lo sin fecha se queda');
}

// ---------------------------------------------------------------- 10 · «Los vecinos se suman a la noche» con «y»
{
  const f = leer('src/desafio-vecinos-mundo.js');
  ok(f.includes("quienes.slice(0, -1).join(', ')} y ${quienes[quienes.length - 1]}"), 'la lista de los que se suman lleva «y» antes del último');
}

console.log(`verificar-4-10-1-npc: ${n} comprobaciones OK`);
