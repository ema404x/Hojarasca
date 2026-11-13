// 4.26.1 (C): el andén, la mochila, los pedidos y los detalles.
//
// 1. campana: `mirandoLaCampana` (campana-anden.js, puro): la E se ofrece sólo mirando la campana a 3 m o menos. main.js `campanaAndenCerca` (con el
//    código de verdad y un mundo de mentira) mira la campana que corresponde: la de la estación de la Aldea (aldea-mecanicas-mundo.js `dondeCampana`)
//    o la chica del poste de las demás paradas; `tocarCampanaAnden`: en la Aldea la campana de la estación se mueve y suena la suya (`tocarCampana`),
//    en las demás suena la de siempre desde el poste. trochita.js: la campanita va en la malla de la parada (`campanaDePoste` sólo agrega piezas al
//    constructor: 0 llamadas de dibujo), en todas las paradas menos la de la Aldea y en los apeaderos.
// 2. pedidos: la línea gris (pedidos.js `REGLA_PEDIDOS`, el texto del brief) va como `pie` de la parte del pedido (los tres avisos: falta, cupo y caja;
//    no al cumplirlo) y aldea.js `servicioDe` la deja en `pies` con el número de la parte del pedido; main.js la muestra en #charla-pie (gris).
// 3. hojarasca: con nieve se tapa por manta (vegetacion.js `hojarascaTapada`/`mantaTapada`) y con nieve plena no queda ninguna; el sotobosque la saca
//    por instancia al rehacer el bloque.
// 4. mariposa (el «objeto naranja» de la plaza en Baja): cada ala tiene las dos caras en la malla (cada una mira a su lado), color por vértice (naranja,
//    la punta negra con su mancha blanca), 5 cm, y usa el material de la fauna (no un Lambert DoubleSide propio).
// 5. nivel: el nombre del nivel del Desafío con las perillas (desafio-perillas.js `nivelDeDificultad`/`textoNivel`) y dónde se muestra.
// 6. ropa: una capa de color por vértice en el pantalón, el chaleco, la campera y el delantal, con el código de verdad de gente-cuerpo.js en una VM: cada capa
//    cambia el color sólo de su prenda y no suma ni un triángulo.
// Cada mutación es una copia de `src` con un archivo cambiado a propósito y tiene que hacer fallar su grupo (un proceso por mutación: la caché de ESM
// sólo mide la primera).
//
// Uso: node pruebas/verificar-4-26-1-c.mjs   (interno: --src <carpeta> --solo <grupo>)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { registrarThree } from './ayuda-three.mjs';
import { funcion, expresion, enUnaLinea } from './ayuda-codigo.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const SRC = arg('--src') ? path.resolve(arg('--src')) : path.join(raiz, 'src');
const SOLO = arg('--solo');
const leer = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const importar = (f) => import(pathToFileURL(path.join(SRC, f)).href);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
registrarThree();
const THREE = await import('three');
const sinExport = (s) => s.replace(/^export (function|const|let) /gm, '$1 ');
// una función con sangría (de adentro de otra): desde `  function nombre(` hasta su `  }`
function interna(fuente, nombre, entorno, sangria = '  ') {
  const i0 = fuente.indexOf(`\n${sangria}function ${nombre}(`);
  assert.ok(i0 >= 0, `el código tiene la función ${nombre}`);
  const i1 = fuente.indexOf(`\n${sangria}}\n`, i0 + 1);
  const cuerpo = fuente.slice(i0 + 1, i1 + sangria.length + 2);
  return new Function('env', `with (env) { return (${cuerpo}); }`)(new Proxy(entorno, { has: (t, k) => typeof k === 'string' && (Object.hasOwn(t, k) || !(k in globalThis)), get: (t, k) => (Object.hasOwn(t, k) ? t[k] : undefined) }));
}
const REGLA = 'Sólo pide lo que se consigue: lo del valle, lo de los puestos que conocés o lo que producís vos.';

const GRUPOS = {
  // ------------------------------------------------------------------ 1. la campana
  async campana() {
    const C = await importar('campana-anden.js');
    const J = (x, z, yaw) => ({ pos: { x, z }, yaw });
    const b = { x: 0, z: 0 };
    ok(C.CAMPANA_ANDEN.alcance === 3, 'el alcance es de 3 m');
    ok(C.mirandoLaCampana(J(0, 2, 0), b) && C.mirandoLaCampana(J(0, 2.95, 0), b), 'mirándola a 2 m y a 2,95 m, sí');
    ok(!C.mirandoLaCampana(J(0, 3.2, 0), b) && !C.mirandoLaCampana(J(0, 4.5, 0), b), 'a 3,2 m o a 4,5 m, no');
    ok(!C.mirandoLaCampana(J(0, 2, Math.PI), b) && !C.mirandoLaCampana(J(0, 2, Math.PI / 2), b), 'de espaldas o de costado, no');
    ok(C.mirandoLaCampana(J(0, 2, 0.5), b) && !C.mirandoLaCampana(J(0, 2, 0.75), b), 'unos 29° corrida sí; 43°, no');
    ok(!C.mirandoLaCampana(J(0, 2, 0), null) && !C.mirandoLaCampana(J(0, 2, 0), { x: NaN, z: 0 }), 'sin campana, no');
    // main.js: el aviso (campanaAndenCerca) con un mundo de mentira
    const main = leer('main.js');
    const mundo = (o) => ({
      jugador: { estado: { pos: { x: o.px, z: o.pz }, yaw: o.yaw ?? 0, enTren: false, sentado: false } },
      tren: { estadoDelLlamado: () => ({ espera: 300 }), paradaCerca: () => o.parada, estacion: null },
      progreso: { historia: null, entradas: {} }, esDesafio: false, desafio: null, CAPITULOS: [{ id: 'llave' }],
      CAMPANA_ANDEN: C.CAMPANA_ANDEN, campanaDeElsa: C.campanaDeElsa, umbralDeCampana: C.umbralDeCampana, vueltaHecha: C.vueltaHecha, decidirCampana: C.decidirCampana, ofreceCampana: C.ofreceCampana, mirandoLaCampana: C.mirandoLaCampana,
      mecanicasAldea: o.mec || null,
    });
    const cerca = (o) => funcion(main, 'campanaAndenCerca', mundo(o))();
    const chica = { anden: { x: 0, z: 0 }, campana: { x: 1, y: 2, z: 0 } };
    ok(cerca({ parada: chica, px: 1, pz: 2 })?.motivo === 'viene', 'parada chica: mirando la campanita a 2 m, la E la ofrece');
    ok(cerca({ parada: chica, px: 1, pz: 4.2 }) === null, 'parada chica: a 4,2 m de la campana (y a 4,3 del centro del andén), no');
    ok(cerca({ parada: chica, px: 1, pz: 2, yaw: Math.PI }) === null, 'parada chica: de espaldas, no');
    ok(cerca({ parada: { anden: { x: 0, z: 0 } }, px: 0, pz: 1 }) === null, 'una parada sin campana no la ofrece');
    const aldea = { aldea: true, anden: { x: 0, z: 0 } };
    const mec = { dondeCampana: () => ({ x: -1, y: 2.3, z: 0 }) };
    ok(cerca({ parada: aldea, mec, px: -1, pz: 2 })?.motivo === 'viene', 'Aldea: mirando la campana de la estación a 2 m, sí');
    ok(cerca({ parada: aldea, mec, px: 2, pz: 2 }) === null, 'Aldea: a 3,6 m de la campana, no');
    ok(cerca({ parada: aldea, mec: { dondeCampana: () => null }, px: -1, pz: 2 }) === null, 'Aldea sin la campana armada: no');
    // tocarCampanaAnden: qué se mueve y qué suena
    const tocar = (p, d) => {
      const r = { aldea: 0, sonido: [], fundido: 0, notas: [] };
      funcion(main, 'tocarCampanaAnden', {
        campanaAndenCerca: () => ({ ...d, parada: p }), textoCampana: C.textoCampana, CAMPANA_ANDEN: C.CAMPANA_ANDEN,
        mecanicasAldea: { tocarCampana: () => { r.aldea++; return { x: -1, y: 2.3, z: 0 }; } },
        sonido: { campana: (pos) => r.sonido.push(pos) }, fundirCorto: () => { r.fundido++; }, nota: (t) => r.notas.push(t),
        jugador: { estado: { pos: { y: 0 }, enTren: false } }, tren: {}, fallaSistema: () => {},
      })();
      return r;
    };
    const viene = C.decidirCampana({ espera: 300 }), nieve = C.decidirCampana({ espera: 300, nieve: true });
    const ra = tocar(aldea, viene);
    ok(ra.aldea === 1 && ra.sonido.length === 0 && ra.fundido === 1 && /^Tocaste/.test(ra.notas[0]), `Aldea: se mueve y suena la de la estación (y no la de la locomotora), y la trochita viene (${JSON.stringify(ra)})`);
    const rc = tocar(chica, viene);
    ok(rc.aldea === 0 && rc.sonido.length === 1 && rc.sonido[0].x === 1 && rc.sonido[0].y === 2 && rc.fundido === 1, 'parada chica: suena desde la campanita del poste y la trochita viene');
    const rn = tocar(chica, nieve);
    ok(rn.sonido.length === 1 && rn.fundido === 0 && /nieve/.test(rn.notas[0]), 'con la vía nevada suena pero no viene');
    // aldea-mecanicas-mundo.js: tocarCampana mueve y suena
    const am = leer('aldea-mecanicas-mundo.js');
    const est = { campana: 0 }; let sonadas = 0;
    const t = interna(am, 'tocarCampana', { dondeCampana: () => ({ x: 4, y: 5, z: 6 }), estado: est, campanaAnden: () => { sonadas++; } });
    const pt = t();
    ok(pt && pt.x === 4 && est.campana === 3.2 && sonadas === 1, 'la campana de la estación: vaivén de 3,2 s y sus cuatro golpes');
    ok(interna(am, 'tocarCampana', { dondeCampana: () => null, estado: { campana: 0 }, campanaAnden: () => { throw new Error('no'); } })() === null, 'sin campana armada no hace nada');
    ok(/dondeCampana, tocarCampana/.test(am), 'las dos se exponen');
    // trochita.js: la campanita del poste, fundida en la malla de la parada
    const tro = leer('trochita.js');
    const piezas = [];
    const c = { agregar: (geo, o) => piezas.push({ geo, o }) };
    const ent = { THREE, matriz: (p) => p, MADERA_OSCURA: '#3a2c20', CAMPANA_POSTE: expresion(tro, 'export const CAMPANA_POSTE = '), PERFIL_CAMPANA: expresion(tro, 'const PERFIL_CAMPANA = ') };
    ent.palito = funcion(tro, 'palito', ent);
    const boca = funcion(tro, 'campanaDePoste', ent)(c, [-1.6, 1.75], [0, 1], 0.115);
    ok(Math.abs(boca[0] + 1.6) < 1e-9 && Math.abs(boca[2] - (1.75 + ent.CAMPANA_POSTE.sale)) < 1e-9 && boca[1] > 1.9 && boca[1] < ent.CAMPANA_POSTE.alto, `la campana cuelga de la ménsula, hacia el andén (${boca.map((v) => v.toFixed(2))})`);
    ok(piezas.length >= 6 && piezas.some((q) => q.geo.type === 'LatheGeometry' && q.o.degradado), `todo va al constructor de la parada (${piezas.length} piezas, la campana de bronce en torno)`);
    const fuenteCampana = tro.slice(tro.indexOf('function palito('), tro.indexOf('// ---------------------------------------------------------------- la estación'));
    ok(!/new THREE\.Mesh\b|escena\.add/.test(fuenteCampana), 'sin mallas propias: 0 llamadas de dibujo nuevas');
    ok(enUnaLinea(tro, ['const bocaCampana = conCampana ? campanaDePoste(c,']) && enUnaLinea(tro, ['campana: bocaCampana ? {']), 'las paradas la llevan (y dicen dónde está)');
    ok(enUnaLinea(tro, ['construirParada(T, escena, col, mat, opciones.cartel, opciones.sentaderos, sitio.i, nombre, sitio !== principal, !deLaAldea)']), 'menos la de la Aldea (que tiene la de la estación)');
    ok(enUnaLinea(tro, ['const bocaCampana = campanaDePoste(c, [posteX, posteZ]']) && enUnaLinea(tro, ['campana: { ...w(bocaCampana[0], bocaCampana[2])']), 'y los apeaderos, en un poste propio');
  },

  // ------------------------------------------------------------------ 2. los pedidos
  async pedidos() {
    const Pd = await importar('pedidos.js');
    const { BIENES } = await importar('comercio.js');
    const { negociosNuevo } = await importar('negocios.js');
    ok(Pd.REGLA_PEDIDOS === REGLA, 'la regla, con el texto del brief');
    const nuevo = () => ({ modo: 'relax', economia: { pesos: 0 }, negocios: { ...negociosNuevo(), rep: { panadera: 20 }, fijos: {} }, granja: {}, entradas: {}, cosas: {}, materiales: {}, aldea: { pobladores: [{ clave: 'panadera', dia: 1 }], locales: { panaderia: 1 }, obras: {}, descubierta: 1 } });
    const p = nuevo();
    const falta = Pd.ofertaDePedido(p, 'panadera', 19, 'Rosa');
    ok(falta && /^Ando necesitando/.test(falta.partes[0]) && falta.pie === REGLA, 'falta: el pedido lleva la línea');
    const q = Pd.pedidoDe(p, 'panadera', 19), b = BIENES[q.k];
    const tener = (pp) => { if (b.donde === 'material') pp.materiales[q.k] = q.n; else if (b.donde === 'entrada') pp.entradas[q.k] = { cantidad: q.n }; else pp.cosas[q.k] = q.n; };
    tener(p); p.negocios.hoy = { dia: 19, pedidos: 2 };
    const cupo = Pd.ofertaDePedido(p, 'panadera', 19);
    ok(cupo && /ya entregaste dos/.test(cupo.partes[0]) && cupo.pie === REGLA, 'cupo: también');
    p.negocios.hoy = { dia: 0 }; p.negocios.cajas.panadera = 0;
    const caja = Pd.ofertaDePedido(p, 'panadera', 19);
    ok(caja && /no tengo con qué pagarte/.test(caja.partes[0]) && caja.pie === REGLA, 'caja: también');
    delete p.negocios.cajas.panadera;
    const cumple = Pd.ofertaDePedido(p, 'panadera', 19);
    ok(cumple && cumple.efectos && !cumple.pie, 'al cumplirlo, no');
    // aldea.js: la línea queda en la parte del pedido
    const A = await importar('aldea.js');
    const s = A.servicioDe('panadera', nuevo(), 19, {});
    const i = s.partes.findIndex((x) => /^Ando necesitando/.test(x));
    ok(i >= 1 && s.pies && s.pies[i] === REGLA && Object.keys(s.pies).length === 1, `servicioDe: la línea va en la parte del pedido (${i}: ${JSON.stringify(s.pies)})`);
    // main.js y la plantilla
    const main = leer('main.js'), html = leer('plantilla.html');
    ok(enUnaLinea(main, ["charla.historia.pies?.[charla.parte]", "$('charla-pie')", "classList.toggle('oculto', !pie)"]), 'mostrarCharla pone la línea debajo de lo que dice (y la esconde si no hay)');
    ok(/function dibujarMenuCharla\(\) \{[\s\S]{0,200}\$\('charla-pie'\)\?\.classList\.add\('oculto'\)/.test(main), 'el menú la esconde');
    ok(/<p class="dicho" id="charla-texto"><\/p>\s*<p class="pie oculto" id="charla-pie"><\/p>/.test(html), 'en la charla, debajo del texto');
    const css = /\.charla \.pie \{[^}]*color: #([0-9a-f]{6})/.exec(html);
    const [r, g, bl] = css ? [0, 2, 4].map((k) => parseInt(css[1].slice(k, k + 2), 16)) : [0, 0, 255];
    ok(css && Math.max(r, g, bl) - Math.min(r, g, bl) < 24 && r > 110 && r < 170, `y gris (${css && css[1]})`);
    ok(enUnaLinea(leer('aldea-gente.js'), ['pies: s.partes.length ? s.pies || null : null']), 'aldea-gente la pasa a la charla');
  },

  // ------------------------------------------------------------------ 3. la hojarasca con nieve
  async hojarasca() {
    const veg = leer('vegetacion.js');
    const { h3 } = await importar('geometria.js');
    const HOJARASCA_NIEVE = expresion(veg, 'export const HOJARASCA_NIEVE = ');
    const tapada = funcion(sinExport(veg), 'hojarascaTapada', { HOJARASCA_NIEVE });
    const manta = expresion(veg, 'export const mantaTapada = ', { h3 });
    ok(tapada(0) === 0 && tapada(0.15) === 0 && tapada(0.5) === 1 && tapada(1) === 1, 'sin nieve nada; con la nieve a la mitad o más, toda');
    let antes = -1, escalonada = true;
    for (let v = 0; v <= 1.0001; v += 0.01) { const t = tapada(v); if (t < antes || Math.abs(t * 8 - Math.round(t * 8)) > 1e-9) escalonada = false; antes = t; }
    ok(escalonada, 'crece con la nieve, en octavos (el bloque se rehace pocas veces)');
    let n0 = 0, n1 = 0, nm = 0;
    for (let i = 0; i < 2000; i++) { const x = (i * 37.3) % 900 - 450, z = (i * 91.7) % 900 - 450; if (manta(x, z, 0)) n0++; if (manta(x, z, 1)) n1++; if (manta(x, z, 0.5)) nm++; }
    ok(n0 === 0 && n1 === 2000 && nm > 700 && nm < 1300, `por manta: ninguna, todas, y la mitad a mitad de camino (${nm} de 2000)`);
    ok(enUnaLinea(veg, ["nieve: /^hojarasca\\d$/.test(nombre)"]), 'sólo los bloques de hojarasca');
    ok(enUnaLinea(veg, ['tapada >= 1 ? [] : chunksSoto']) && enUnaLinea(veg, ['if (tapada > 0 && mantaTapada(M[o + 12], M[o + 14], tapada)) continue;']), 'el sotobosque las saca por instancia al rehacer el bloque');
    ok(enUnaLinea(veg, ['if (hojarascaTapada(U.uInvierno.value) !== sotoTapada) sotoSucio = true;']), 'y lo rehace cuando la nieve tapa otro escalón');
  },

  // ------------------------------------------------------------------ 4. la mariposa
  async mariposa() {
    const bi = leer('bichos.js');
    const ini = bi.indexOf('const ALA_MARIPOSA'), fin = bi.indexOf('function mallaMariposa()');
    ok(ini > 0 && fin > ini, 'el ala de la mariposa');
    const MAT = { marca: 'MAT_FAUNA' };
    const alaMariposa = new Function('THREE', 'MAT_FAUNA', bi.slice(ini, fin) + '\nreturn alaMariposa;')(THREE, MAT);
    for (const l of [-1, 1]) {
      const m = alaMariposa(l), g = m.geometry, P = g.attributes.position, I = g.index.array, Cc = g.attributes.color;
      let bien = 0, mal = 0;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
      for (let t = 0; t < I.length; t += 3) { a.fromBufferAttribute(P, I[t]); b.fromBufferAttribute(P, I[t + 1]); d.fromBufferAttribute(P, I[t + 2]); const n = b.clone().sub(a).cross(d.clone().sub(a)); if (Math.sign(n.y) === Math.sign(a.y) && n.y !== 0) bien++; else mal++; }
      ok(mal === 0 && bien > 20, `ala ${l}: cada cara mira hacia su lado (${bien} triángulos)`);
      g.computeBoundingBox();
      const ancho = g.boundingBox.max.x - g.boundingBox.min.x;
      ok(ancho > 0.035 && ancho < 0.06 && Math.sign(g.boundingBox.max.x + g.boundingBox.min.x) === l, `ala ${l}: de ${(ancho * 100).toFixed(1)} cm, hacia su lado`);
      ok(m.material === MAT, 'con el material de la fauna');
      const lum = []; for (let i = 0; i < Cc.count; i++) lum.push(0.3 * Cc.getX(i) + 0.59 * Cc.getY(i) + 0.11 * Cc.getZ(i));
      const naranja = [...Array(Cc.count).keys()].filter((i) => Cc.getX(i) > 2 * Cc.getZ(i) + 0.15 && Cc.getX(i) > Cc.getY(i) * 1.6).length;
      ok(Math.min(...lum) < 0.02 && Math.max(...lum) > 0.6 && naranja > Cc.count / 3, 'naranja, con la punta negra y su mancha blanca');
    }
    const malla = bi.slice(fin, bi.indexOf('function mallaPanal('));
    ok(!/DoubleSide|#d9752a/.test(malla) && /piv\.add\(alaMariposa\(l\)\)/.test(malla), 'ni el Lambert de dos caras ni los trapecios naranjas de antes');
  },

  // ------------------------------------------------------------------ 5. el nombre del nivel
  async nivel() {
    const D = await importar('desafio-perillas.js');
    const { DIFICULTADES } = await importar('desafio-reglas.js');
    const todo = (v) => ({ cantidad: v, vida: v, dano: v });
    const n = (dif, p) => D.nivelDeDificultad(DIFICULTADES[dif], p);
    ok(n('normal', todo(0)).nombre === 'Normal' && n('normal', todo(0)).n === 3, 'Normal sin perillas: Normal (3 de 5)');
    ok(n('tranquila', todo(0)).n === 1 && n('implacable', todo(0)).n === 5, 'Tranquila y Implacable en sus puntas');
    ok(n('normal', todo(2)).nombre === 'Implacable' && n('normal', todo(-2)).nombre === 'Tranquila', 'Normal con todo en +2 es una Implacable; con todo en −2, una Tranquila');
    ok(D.textoNivel(DIFICULTADES.implacable, todo(2)) === 'Nivel de la noche: más dura que Implacable (5 de 5).', 'Implacable con todo en +2: más dura que Implacable');
    ok(D.textoNivel(DIFICULTADES.tranquila, todo(-2)) === 'Nivel de la noche: más suave que Tranquila (1 de 5).', 'Tranquila con todo en −2: más suave que Tranquila');
    let sube = true;
    for (const k of ['cantidad', 'vida', 'dano']) { let a = 0; for (let v = -2; v <= 2; v++) { const x = n('normal', { cantidad: 0, vida: 0, dano: 0, [k]: v }).n; if (x < a) sube = false; a = x; } }
    ok(sube, 'cada perilla sube (o deja igual) el nivel');
    ok(['cantidad', 'vida', 'dano'].every((k) => [-1, 1].every((v) => Math.abs(n('normal', { cantidad: 0, vida: 0, dano: 0, [k]: v }).n - 3) <= 1)), 'una perilla sola lo corre a lo sumo un escalón');
    const main = leer('main.js'), html = leer('plantilla.html');
    ok(enUnaLinea(main, ["querySelectorAll('[data-nivel-noche]')", 'textoNivel(DIFICULTADES[ajustes.dificultad] || DIFICULTADES.normal, perillasDeAjustes(ajustes))']), 'sincronizarAjustes lo escribe');
    ok((html.match(/data-nivel-noche/g) || []).length === 2 && /<p class="modo-texto" data-perillas data-nivel-noche><\/p>/.test(html) && /data-perillas="ajustes"><small data-nivel-noche>/.test(html), 'en la portada del Desafío y en los ajustes, con las perillas');
  },

  // ------------------------------------------------------------------ 6. la ropa
  async ropa() {
    const E = await cargarGente();
    const ASP = E.R.ASPECTO;
    const elegir = (f) => Object.keys(ASP).filter((k) => ASP[k]?.R && f(ASP[k].R)).slice(0, 2);
    const casos = {
      pantalon: elegir((R) => R.arremangado && !R.pollera && !R.tajo),
      chaleco: elegir((R) => R.chaleco && !R.chamal && !R.jumper && (!R.telaChaleco || R.telaChaleco === 'lana')),
      campera: elegir((R) => !R.chaleco && (R.abierta || R.botones || (!R.delantal && !R.pechera))),
      delantal: elegir((R) => R.delantal && !R.delantalSinPechera),
    };
    if (args.includes('--tris')) { const t = {}; for (const ks of Object.values(casos)) for (const k of ks) t[k] = armarGente(E, k).tris; console.log(JSON.stringify(t)); return; }
    const Sin = await cargarGente(SIN_CAPAS);
    for (const [capa, ks] of Object.entries(casos)) {
      ok(ks.length > 0, `hay quien lleve ${capa}`);
      for (const k of ks) {
        const a = armarGente(E, k), b = armarGente(Sin, k);
        ok(a.tris === b.tris && (!Object.hasOwn(TRIS_4260, k) || a.tris === TRIS_4260[k]), `${k}: 0 triángulos de más (${a.tris}; 4.26.0: ${TRIS_4260[k]})`);
        const cambio = {};
        for (let i = 0; i < a.piezas.length; i++) {
          const pa = a.piezas[i], pb = b.piezas[i];
          if (!pa.color || !pb.color || pa.color.length !== pb.color.length) continue;
          let n = 0; for (let j = 0; j < pa.color.length; j += 3) if (Math.abs(pa.color[j] - pb.color[j]) + Math.abs(pa.color[j + 1] - pb.color[j + 1]) + Math.abs(pa.color[j + 2] - pb.color[j + 2]) > 0.006) n++;
          if (n) cambio[pa.rol || 'otra'] = (cambio[pa.rol || 'otra'] || 0) + n;
        }
        const rolDe = { pantalon: 'otra', chaleco: 'chaleco', campera: 'campera', delantal: 'delantal' }[capa];
        ok((cambio[rolDe] || 0) > 3, `${k}: la capa del ${capa} cambia el color de su prenda (${JSON.stringify(cambio)})`);
        if (capa === 'delantal' || capa === 'chaleco') ok(Object.keys(cambio).every((r) => r === rolDe || r === 'otra' || r === 'campera' || r === 'chaleco' || r === 'delantal'), `${k}: y nada fuera de la ropa`);
      }
    }
  },
};

// ---------------------------------------------------------------- la gente en una VM (como verificar-4-25-0-c)
// los triángulos de cada uno con el código de la 4.26.0 (medidos con --tris sobre gente-cuerpo.js y gente-ropa.js de la 4.26.0)
const TRIS_4260 = { ema: 16218, tobias: 14147, ramon: 14539, fermin: 13226, nicanor: 13848, ercilia: 15422 };
const SIN_CAPAS = [
  ['costuras(c, p); rodillera(c, p, -0.41);', 'costuras(c, p);'],
  ['costuras(c, p); rodillera(c, p, -0.04); });', 'costuras(c, p); });'],
  ['      if (forroCh && p.z < -0.004)', '      if (false)'],
  ['      if (R.abierta && (col === 0 || col === lados) && p.y < 0.5) c.multiplyScalar(0.62);\n      else if (col === colCruce && p.y < 0.5) c.multiplyScalar(0.55);\n      else if (tapeta && (col === 0 || col === lados) && p.y > 0.0 && p.y < 0.5) c.multiplyScalar(0.72);\n', ''],
  ['        if (col === 0 || col === ladosD) c.multiplyScalar(0.55);\n', ''],
];
const GANCHO = ['  const malla = yield* continuoPasos(f);\n  g.scale.setScalar(f.escala);', '  globalThis.__ult = f; if (globalThis.__antes) globalThis.__antes(f);\n  const malla = yield* continuoPasos(f);\n  g.scale.setScalar(f.escala);'];
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
async function cargarGente(reemplazos = []) {
  const info = new Map(), orden = [], visto = new Set();
  const archivo = path.join(SRC, 'gente-cuerpo.js');
  const visitar = (f) => {
    f = path.resolve(f);
    if (visto.has(f)) return;
    visto.add(f);
    let texto = fs.readFileSync(f, 'utf8');
    if (f === archivo) for (const [a, b] of [GANCHO, ...reemplazos]) { assert.ok(texto.includes(a), `el reemplazo apunta a algo que existe: ${a.slice(0, 70)}`); texto = texto.replace(a, b); }
    for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
    info.set(f, texto); orden.push(f);
  };
  visitar(archivo);
  const transformar = (f, t) => {
    const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
    t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
    t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
      `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).map((x) => x.replace(/\s+as\s+/, ': ')).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
    t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
    return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
  };
  let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
  for (const f of orden) code += transformar(f, info.get(f)) + '\n';
  code += `\n;globalThis.__C = ${idModulo(archivo)}; globalThis.__THREE = THREE;`;
  const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Uint8ClampedArray, Error, Symbol, globalThis: null };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'gente-cuerpo-vm.js' });
  const R = await importar('gente-ropa.js');
  const A = await importar('aldea.js');
  return { C: ctx.__C, ctx, R, A };
}
function armarGente(E, k) {
  const def = k.startsWith('aldea-') ? E.A.VECINOS_ALDEA[k.slice(6)] : k.startsWith('poblador-') ? E.A.POBLADORES_ALDEA[k.slice(9)] : null;
  let snap = [];
  E.ctx.__antes = (f) => { f.g.updateMatrixWorld(true); f.g.traverse((o) => { if (o.isMesh) snap.push(o); }); };
  const p = E.C.crearPersona(def?.colores || {}, k, def?.mano === 'mate' || k === 'ramon', {}, { talla: def?.talla });
  let tris = 0; p.g.traverse((o) => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  const piezas = snap.map((m) => ({ rol: m.userData.rol || null, color: m.geometry.attributes.color ? Array.from(m.geometry.attributes.color.array) : null }));
  return { tris, piezas };
}

// ---------------------------------------------------------------- correr
const nombres = SOLO ? [SOLO] : Object.keys(GRUPOS);
for (const g of nombres) { await GRUPOS[g](); if (!SOLO) console.log(`✓ ${g}`); }
if (SOLO) process.exit(0);

// ---------------------------------------------------------------- mutaciones: una copia de src por mutación, un proceso por copia
const MUTACIONES = [
  ['campana', 'campana-anden.js', '  alcance: 3,', '  alcance: 8,', 'el alcance de 3 m'],
  ['campana', 'campana-anden.js', '>= CAMPANA_ANDEN.frente;', '>= -1;', 'mirándola (no de espaldas)'],
  ['campana', 'main.js', 'const campana = p.aldea ? mecanicasAldea?.dondeCampana?.() : p.campana;', 'const campana = p.campana;', 'la campana de la estación en la Aldea'],
  ['campana', 'main.js', '  if (!mirandoLaCampana(js, campana)) return null;\n', '', 'el aviso sólo mirándola'],
  ['campana', 'main.js', 'if (d.suena && !(p.aldea && mecanicasAldea?.tocarCampana?.()))', 'if (d.suena)', 'en la Aldea suena la suya y no la de la locomotora'],
  ['campana', 'aldea-mecanicas-mundo.js', '    estado.campana = 3.2;\n    campanaAnden(p);\n', '    estado.campana = 3.2;\n', 'la campana de la estación suena'],
  ['campana', 'trochita.js', 'sitio !== principal, !deLaAldea);', 'sitio !== principal, true);', 'la Aldea sin campanita en el poste'],
  ['pedidos', 'pedidos.js', "con un extra por la rapidez' : ''}.`], aviso: true, pie: REGLA_PEDIDOS };", "con un extra por la rapidez' : ''}.`], aviso: true };", 'la línea debajo del pedido'],
  ['pedidos', 'aldea.js', '{ [base.partes.length + aviso.length - 1]: pedido.pie }', '{ [base.partes.length + aviso.length]: pedido.pie }', 'la línea en la parte del pedido'],
  ['hojarasca', 'vegetacion.js', 'export const HOJARASCA_NIEVE = { desde: 0.15, hasta: 0.5, pasos: 8 };', 'export const HOJARASCA_NIEVE = { desde: 0.15, hasta: 1.5, pasos: 8 };', 'con nieve plena no queda ninguna'],
  ['hojarasca', 'vegetacion.js', '          if (tapada > 0 && mantaTapada(M[o + 12], M[o + 14], tapada)) continue;   // 4.26.1: bajo la nieve\n', '', 'se saca por instancia'],
  ['mariposa', 'bichos.js', 'if (l * cara > 0) idx.push(base + a, base + b, base + d);', 'if (l * cara < 0) idx.push(base + a, base + b, base + d);', 'las caras del ala'],
  ['mariposa', 'bichos.js', '  return new THREE.Mesh(geo, MAT_FAUNA);', "  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));", 'el material de la fauna'],
  ['mariposa', 'bichos.js', "[0.05, 0.036, '#ece6d8']", "[0.05, 0.036, '#1c1713']", 'la mancha blanca'],
  ['nivel', 'desafio-perillas.js', 'export const CORTES_NIVEL = [-1.0, -0.33, 0.215, 0.645];', 'export const CORTES_NIVEL = [-1.0, -0.33, 0.215, 0.9];', 'los escalones del nivel'],
  ['ropa', 'gente-cuerpo.js', 'costuras(c, p); rodillera(c, p, -0.41);', 'costuras(c, p);', 'la capa del pantalón'],
  ['ropa', 'gente-cuerpo.js', '      if (forroCh && p.z < -0.004)', '      if (false)', 'la capa del chaleco'],
  ['ropa', 'gente-cuerpo.js', '        if (col === 0 || col === ladosD) c.multiplyScalar(0.55);\n', '', 'la capa del delantal'],
  ['ropa', 'gente-cuerpo.js', '      if (R.abierta && (col === 0 || col === lados) && p.y < 0.5) c.multiplyScalar(0.62);\n      else if (col === colCruce && p.y < 0.5) c.multiplyScalar(0.55);\n      else if (tapeta && (col === 0 || col === lados) && p.y > 0.0 && p.y < 0.5) c.multiplyScalar(0.72);\n', '', 'la capa de la campera'],
  ['ropa', 'gente-cuerpo.js', "const forroCh = !R.chamal && !R.jumper && (!R.telaChaleco || R.telaChaleco === 'lana') ? colorDe(mezcla(abrigo, '#1e1b19', 0.5)) : null", "const forroCh = !R.chamal && !R.jumper && (!R.telaChaleco || R.telaChaleco === 'lana') ? colorDe(mezcla(abrigo, '#1e1b19', 0.5)) : null; for (let q = 0; q < 2; q++) torso.add(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01)))", 'sin triángulos de más'],
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v4261c-'));
fs.cpSync(path.join(raiz, 'src'), path.join(tmp, 'src'), { recursive: true });
let atrapadas = 0;
try {
  for (const [grupo, archivo, a, b, que] of MUTACIONES) {
    const f = path.join(tmp, 'src', archivo), orig = fs.readFileSync(f, 'utf8');
    assert.ok(orig.includes(a), `la mutación «${que}» apunta a algo que existe (${archivo}: ${a.slice(0, 60)})`);
    fs.writeFileSync(f, orig.replace(a, b));
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--src', path.join(tmp, 'src'), '--solo', grupo], { encoding: 'utf8', timeout: 240000 });
    fs.writeFileSync(f, orig);
    assert.notEqual(r.status, 0, `la mutación «${que}» (${archivo}) tenía que hacer fallar «${grupo}»`);
    atrapadas++;
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(`verificar-4-26-1-c: ${pasos} comprobaciones en verde; ${atrapadas} de ${MUTACIONES.length} mutaciones atrapadas`);
