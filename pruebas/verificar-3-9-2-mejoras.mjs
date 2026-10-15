// 3.9.2 · LAS MEJORAS (Dalia y el banco del pueblo):
//   1. Dalia: la falda en A con el tajo limpio (sin sacar triángulos), cinta de contraste, cuerpo y poses sin tocar;
//   2. el banco por fuera y por dentro: más detalle, sin luces nuevas y dentro de los presupuestos;
//   3. Amadeo: lo que dice según tus deudas, tus negocios, el día, la hora y la estación; la historia en seis partes que se abren con la amistad;
//   4. el guardado y las partidas de antes (nada nuevo en el guardado: lo que no existía, no hace falta migrarlo).
// Sólo castellano: el inglés de lo nuevo queda para después (a pedido del usuario); los textos nuevos de Amadeo están listados en banco-textos.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

// ---------------------------------------------------------------- 1. Dalia
{
  const gc = leer('src/gente-cuerpo.js'), gr = leer('src/gente-ropa.js');
  ok(/const abrirTajo = tajoV &&/.test(gc) && gc.includes('const ph = tajoV.a + h + (i / ladosFalda) * (Math.PI * 2 - 2 * h);'), 'el tajo se abre repartiendo las columnas del torno (sin sacar triángulos)');
  ok(!/geo\.setIndex\(nuevo\)/.test(gc) && !/marca\[i\] = 1/.test(gc), 'ya no se sacan triángulos de la falda (el borde dentado)');
  ok(/huso\(cinta, pts, rad, 8, 5\)/.test(gc), 'los dos bordes del tajo llevan una cinta de contraste');
  ok(/\[0\.292, -0\.66\]/.test(gc) && /piernasX/.test(gc), 'la falda cae en A con vuelo y sigue menos a las piernas (no parece un pantalón en el tango)');
  ok(/faldaMalla\.userData\.piernas = curvas \? 0\.95 : 1;/.test(gc), 'las demás faldas siguen a las piernas como siempre');
  const R = await import('../src/gente-ropa.js');
  const d = R.ASPECTO['aldea-bailarina'];
  ok(d.cuerpo.busto === 2.7 && d.cuerpo.cadera === 1.17 && d.cuerpo.cintura === 0.92, 'busto grande y caderas anchas, como el usuario las pidió (4.1: más busto, 2,7)');
  ok(d.R.curvas && d.R.tajoV && d.R.tacos && d.R.florPelo, 'el vestido, el tajo, los tacos y la flor');
  ok(/\/\/ 3\.9\.2:/.test(gc), 'los comentarios llevan la versión');
}

// ---------------------------------------------------------------- 2. el edificio
const AR = await import('../src/aldea-arquitectura.js');
const A = await import('../src/aldea.js');
{
  const d = AR.armarEdificio('banco-pueblo', 4);
  const P = AR.PRESUPUESTO_ALDEA;
  ok(d.medidas.triangulos.exterior <= P.local.exterior && d.medidas.triangulos.interior <= P.local.interior, `dentro del presupuesto (${d.medidas.triangulos.exterior} + ${d.medidas.triangulos.interior})`);
  ok(d.medidas.dibujos.exterior <= P.dibujos.exterior && d.medidas.dibujos.interior <= P.dibujos.interior, 'los mismos dibujos de siempre');
  ok(d.medidas.triangulos.interior > 3500, `adentro hay bastante más que antes (${d.medidas.triangulos.interior}; eran 2058)`);
  eq(d.luces.length, 5, 'sin luces nuevas: las mismas cinco de siempre (la lámpara del mostrador pesa más de noche)');
  const lamp = d.luces.find((l) => l.cuarto === 'banco' && l.fuerza >= 5);
  ok(lamp && lamp.radio >= 13, 'la lámpara de arriba del gerente alumbra todo el cuarto de noche (como la de la cantina)');
  const fuente = leer('src/aldea-arquitectura.js');
  for (const t of ['function farolPared(', 'function ficus(', 'function bancoDetalle(', 'bancoDetalle(K, tab);']) ok(fuente.includes(t), `el detalle del banco: ${t}`);
  ok(/caja\(K\.bra, E\.p\(0\.38, 0\.28, -0\.15\)/.test(fuente), 'la lámpara de banquero brilla de noche (con las brasas, no con una luz)');
  ok(AR.CARTELES_ALDEA.length <= Math.floor(AR.ATLAS_CARTELES.alto / AR.ATLAS_CARTELES.celdaAlto) * AR.ATLAS_CARTELES.columnas, 'el atlas de carteles alcanza');
  // todo adentro es de tipo 0 (sin nieve) y no hay NaN
  const sinNaN = (g) => !g || ![...(g.attributes?.position?.array || [])].some((v) => !Number.isFinite(v));
  ok(Object.values(d.exterior).every(sinNaN) && Object.values(d.interior).every(sinNaN), 'ni un NaN en la geometría');
  ok(d.puntos.nombrados.adentro && d.puntos.nombrados.puerta && d.puntos.nombrados.cama, 'el gerente, la puerta y la cama siguen en su lugar');
  ok(d.colisiones.obstaculos.length > 12, `con más muebles que frenan (${d.colisiones.obstaculos.length})`);
}

// ---------------------------------------------------------------- 3. Amadeo
{
  const E = await import('../src/economia.js');
  const N = await import('../src/negocios.js');
  const B = await import('../src/prestamos.js');
  const BV = await import('../src/banco-voces.js');
  const BT = await import('../src/banco-textos.js');
  const V = await import('../src/vecindad.js');
  const VZ = await import('../src/vecindad-voces.js');
  const nueva = (extra = {}) => { const p = { dia: 10, horas: 10, entradas: {}, cosas: {}, materiales: {}, ...extra }; p.economia = E.economiaNueva(); p.negocios = N.negociosNuevo(); return p; };
  const texto = (l) => l.join(' ');
  const base = { dia: 10, hora: 10, temporada: 'otono', n: 0, amistad: 'conocido' };
  // sin deudas ni negocios
  let p = nueva();
  const s0 = BV.saludoDelGerente(p, base);
  ok(Array.isArray(s0) && s0.length >= 1 && s0.every((t) => typeof t === 'string' && t.length > 20), 'un saludo de una o dos frases');
  ok(/Bienvenido|primera vez|banco|Buenas|Pase|interés|huerta/i.test(texto(s0)), 'sin historia con el banco: el saludo de bienvenida o el general');
  // con una deuda en curso
  p = nueva(); B.pedirPrestamo(p, 10, 2000, 12);
  ok(/\$?2\.000|Debe/.test(texto(BV.saludoDelGerente(p, { ...base, dia: 12 }))) || /préstamo|deuda|Debe/i.test(texto(BV.saludoDelGerente(p, { ...base, dia: 12 }))), 'con un préstamo en curso, lo menciona');
  ok(/días/.test(texto(BV.saludoDelGerente(p, { ...base, dia: 20 }))), 'cerca del vencimiento, los días que quedan');
  ok(/hoy|último día/i.test(texto(BV.saludoDelGerente(p, { ...base, dia: 22 }))), 'el día del vencimiento, que vence hoy');
  const atrasado = [0, 1, 2, 3, 4, 5].map((k) => texto(BV.saludoDelGerente(p, { ...base, dia: 30, n: k })));
  ok(atrasado.every((t) => /vencid|plazo|gotera|reclam|aritmética/i.test(t)), 'con el préstamo vencido, siempre el reclamo (amable)');
  ok(new Set(atrasado).size >= 2, 'y no dice siempre lo mismo');
  // con negocios: alquiler, puesto, casas
  p = nueva(); p.negocios.casas.alquiladas = { casona: { inquilino: 'una familia', desde: 1, renta: 800, cuantas: 1 } }; p.negocios.casas.poseidas = { casona: 1 };
  ok(/alquiler|inquilino|techo|casa/i.test(texto([...Array(6)].map((_x, k) => texto(BV.saludoDelGerente(p, { ...base, n: k })))) ), 'con una casa en alquiler, lo comenta');
  p = nueva(); p.negocios.casas.puesto = { desde: 1, caja: 4000, stock: {}, dia: 10 };
  ok([...Array(6)].some((_x, k) => /puesto|feria|caja/i.test(texto(BV.saludoDelGerente(p, { ...base, n: k })))), 'con un puesto en la feria, lo comenta');
  p = nueva(); p.negocios.banco.rep = 12; p.negocios.banco.hechos = 5;
  ok([...Array(6)].some((_x, k) => /socio|libreta|confianza|reputación|buen pagador/i.test(texto(BV.saludoDelGerente(p, { ...base, n: k })))), 'con la confianza del banco alta, te trata de socio');
  // según el día, la hora, la estación y la amistad
  p = nueva();
  const todos = new Set();
  for (let dia = 1; dia <= 14; dia++) for (const hora of [9, 15, 17.5]) for (const temporada of ['verano', 'otono', 'invierno']) for (const k of [0, 1, 2]) todos.add(texto(BV.saludoDelGerente(p, { dia, hora, temporada, n: k })));
  ok(todos.size >= 25, `una gran variedad de cosas para decir (${todos.size} combinaciones distintas)`);
  const sab = [...Array(6)].map((_x, k) => texto(BV.saludoDelGerente(p, { dia: 6, hora: 10, temporada: 'verano', n: k })));
  ok(sab.some((t) => /sábado|baile|cuatro/i.test(t)), 'el sábado habla del baile y de cerrar temprano');
  ok([...Array(8)].some((_x, k) => /compadre/.test(texto(BV.saludoDelGerente(p, { ...base, amistad: 'compadre', n: k })))), 'con un compadre, otro trato');
  // lo que dice al terminar cada operación
  for (const ev of ['prestamo', 'pago', 'saldado', 'abasto', 'alquiler', 'puesto', 'caja']) ok(BV.comentarioDe(ev, { dia: 3, n: 1 }).length > 20, `comenta ${ev}`);
  ok(BV.comentarioDe('cosa-rara', {}) === '', 'una operación que no conoce no inventa nada');
  p = nueva(); B.pedirPrestamo(p, 10, 1000, 6);
  ok(/plazo ya se pasó/.test(BV.lineaDeSolapa('prestamos', p, { dia: 40, n: 1 })), 'en Préstamos, vencido, lo urgente va siempre');
  ok(/^Amadeo Lezcano: «/.test(BV.lineaDeSolapa('abasto', nueva(), { dia: 3, n: 0 })), 'una línea suya en cada solapa');
  // la historia, en seis partes que se abren con la amistad
  const voz = VZ.VOCES.gerente;
  ok(voz.historia.partes.length === 6, 'la historia de Amadeo tiene seis partes');
  ok(BT.HISTORIA_EXTRA_GERENTE.length === 3 && voz.historia.partes.slice(3).every((t, i) => t === BT.HISTORIA_EXTRA_GERENTE[i]), 'las tres nuevas van al final');
  ok(voz.historia.partes.some((t) => /Esquel/.test(t)) && voz.historia.partes.slice(3).every((t) => /Esquel|reloj|préstamo/.test(t)), 'sobre su sucursal de Esquel');
  ok(voz.sobremesa.length >= 14 && VZ.VOCES.gerente.sobremesa.includes(BT.SOBREMESA_EXTRA_GERENTE[0]), `más sobremesa y más humor (${voz.sobremesa.length})`);
  ok(A.VECINOS_ALDEA.gerente.charla.length === 9 && A.VECINOS_ALDEA.gerente.charla.includes(BT.CHARLA_EXTRA_GERENTE[0]), 'más charla de mostrador (nueve)');
  const todosLosTextos = [...BT.SIN_INGLES_392, ...todos];
  ok(!todosLosTextos.some((t) => /\|\|\s*'escuela'|undefined|\[object|NaN/.test(t)), 'ningún texto roto');
  ok(!todosLosTextos.some((t) => /\b(Dios|Señor|iglesia|rezar|bendic|misa|santo|cielo santo|amén)\b/i.test(t)), 'nada religioso');
  // la amistad: las partes de más allá de la tercera piden más que ser compadre
  const k = 'gerente';
  const e = { dia: 1, vecindad: V.vecindadNueva(), aldea: A.aldeaNueva() };
  V.charlar(k, e, 1);
  const ficha = e.vecindad.personas[k];
  const historia = () => V.temasDeCharla(k, e, { dia: 40 }).find((x) => x.id === 'historia');
  ficha.p = 145; ficha.max = 2;
  for (let i = 0; i < 3; i++) { const t = V.elegirTema(k, 'historia', e, { dia: 40 + i }); eq(t.renglones, [voz.historia.partes[i]], `con compadre, la parte ${i + 1}`); }
  ok(ficha.hist === 3, 'ya contó tres');
  ficha.p = 145;
  ok(historia().bloqueada && VZ.FRASES.historiaCompadre.includes(historia().renglones[0]), 'la cuarta pide más que compadre (145 puntos no alcanzan)');
  ficha.p = V.PUNTOS_HISTORIA_EXTRA[0];
  eq(V.elegirTema(k, 'historia', e, { dia: 50 }).renglones, [voz.historia.partes[3]], 'con 150 puntos, la cuarta (la sucursal que cerró)');
  ok(historia().bloqueada, 'la quinta, todavía no');
  ficha.p = V.PUNTOS_HISTORIA_EXTRA[1];
  eq(V.elegirTema(k, 'historia', e, { dia: 51 }).renglones, [voz.historia.partes[4]], 'con 165, la quinta (el reloj del escribano)');
  ficha.p = V.PUNTOS_HISTORIA_EXTRA[2];
  eq(V.elegirTema(k, 'historia', e, { dia: 52 }).renglones, [voz.historia.partes[5]], 'con 180, la sexta (el préstamo que nunca anotó)');
  ok(VZ.FRASES.historiaFin.includes(V.elegirTema(k, 'historia', e, { dia: 53 }).renglones[0]), 'y después, que ya te contó todo');
  // las demás voces siguen con tres partes y se abren como siempre
  ok(Object.entries(VZ.VOCES).every(([c, v]) => v.historia.partes.length === (c === 'gerente' ? 6 : 3)), 'sólo Amadeo tiene seis');
  // el guardado: la ficha con las seis partes se sanea sin perder lo contado
  const guardada = JSON.parse(JSON.stringify(e.vecindad));
  const E2 = { dia: 60, vecindad: guardada, aldea: A.aldeaNueva() };
  ok(V.temasDeCharla(k, E2, { dia: 60 }).find((x) => x.id === 'historia').renglones.length >= 1, 'la ficha guardada se vuelve a leer');
  ok(guardada.personas[k].hist === 6, 'y las seis partes contadas quedan guardadas');
}

// ---------------------------------------------------------------- 4. el mostrador
{
  const fuente = leer('src/banco-mundo.js'), gente = leer('src/aldea-gente.js'), main = leer('src/main.js');
  ok(fuente.includes("dicho('prestamo')") && fuente.includes("'saldado' : 'pago'") && fuente.includes("dicho('alquiler')") && fuente.includes("dicho('caja')") && fuente.includes('lineaDeSolapa('), 'el mostrador comenta cada operación y cada solapa');
  ok(gente.includes('saludoDelGerente(progreso()'), 'el saludo del gerente sale de su situación');
  ok(/abrirBanco: \(\) => \{ bancoDelPueblo\(\)\.abrir\(\); setTimeout\(\(\) => \{ if \(enElBanco\(\)\) cerrarCharla\(\); \}, 0\); \}/.test(main), 'al pasar al mostrador se cierra la charla (la rueda de temas se quedaba detrás del panel)');
  ok(!/\|\| 'escuela'/.test(fuente + gente), 'ni un || \'escuela\'');
  for (const f of ['src/banco-voces.js', 'src/banco-textos.js', 'src/banco-mundo.js']) ok(!leer(f).includes('\r'), `${f}: fines de línea LF`);
  ok(!/^import .*;[ \t]*\/\//m.test(leer('src/banco-voces.js') + fuente + gente), 'armar.mjs: los imports van sin comentario al final de la línea');
}

console.log(`verificar-3-9-2-mejoras: ${n} verificaciones ok`);
