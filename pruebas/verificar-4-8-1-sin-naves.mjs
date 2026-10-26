// 4.8.1 (aro): ya no hay naves espaciales. Cada noche del Desafío salen los duendes de un aro de hongos y raíces
// en el suelo del bosque (donde antes bajaba un platillo con haz tractor y reflectores), las ruinas de los
// restos son del bosque (no un casco de metal), la cápsula estrellada es un cofre entre raíces y los puestos no
// largan un haz al cielo. Se comprueba:
//   · `mallaNave()` ya no arma casco, cúpula, luces, haz ni reflectores (por estructura del grupo y por nombres);
//   · las fases, los tiempos y la mecánica de la bajada son los de siempre (4 s, de a uno, 5 s; lo que tardan en salir);
//   · el aro, la ruina y el cofre armados de verdad (en una VM con el three local): pocas mallas, pocos triángulos,
//     sin materiales aditivos de «haz», sin gris metálico, apoyados en el suelo y se cierran del todo;
//   · el sonido nuevo se genera sin errores, dura lo que dice, no satura, es grave y no es un zumbido parejo;
//   · ninguna cadena visible del juego en castellano habla de nave, nodriza, alien, plasma, platillo, ovni, vaina
//     ni generador (con las excepciones justificadas), y las tablas de inglés no se tocaron.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { FASES_ARO, SALIDA_DUENDE, TARDA_EN_SALIR, LUZ_ARO, CADA_CRUJIDO, brotado, tapado, columna, luz, brilloDeHongos, proximoCrujido, luciernaga } from '../src/desafio-aro.js';
import { SONIDOS_ARO, PICO_ARO, TASA_ARO, sintetizarAro, analizarAro, crearSonidosAro } from '../src/desafio-aro-sonido.js';
import { completar } from '../src/sonido-sintesis.js';
import { Sonido } from '../src/sonido.js';
import { cadenasDe, palabrasDeNave, archivosSrc } from './ayuda-textos-visibles.mjs';
import { cargarVM } from './ayuda-vm.mjs';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const cerca = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m} (${a} vs ${b})`);
// el cuerpo de una función de nivel superior o interna (hasta su llave de cierre)
const cuerpo = (src, firma) => {
  const i = src.indexOf(firma);
  if (i < 0) return '';
  let prof = 0, j = src.indexOf('{', i);
  const ini = j;
  for (; j < src.length; j++) { if (src[j] === '{') prof++; else if (src[j] === '}') { prof--; if (prof === 0) break; } }
  return src.slice(ini, j + 1);
};

const desafio = leer('src/desafio.js');

// ============================================================ 1. mallaNave ya no es un platillo
{
  const mn = cuerpo(desafio, 'function mallaNave() {');
  ok(mn.length > 10, 'mallaNave existe');
  for (const prohibida of ['SphereGeometry', 'TorusGeometry', 'ConeGeometry', 'CylinderGeometry', 'AdditiveBlending', 'reflector', 'cupula', 'cúpula', 'casco', 'haz', 'luces', 'tractor', 'anillo', '#8b9197', '#9fe8c8']) {
    ok(!mn.includes(prohibida), `mallaNave ya no arma «${prohibida}»`);
  }
  ok(/mallaAro\(\)/.test(mn), 'mallaNave arma el aro de hongos');
  ok(!/crearMallaNave/.test(desafio), 'se fue crearMallaNave (no la usaba nadie: ni la noche final ni el asedio)');
  ok(!/nave\.(haz|reflectores|luces)/.test(desafio), 'nada del juego mueve ya el haz, los reflectores ni las luces de la nave');
  ok(!/nave\.g\.scale/.test(desafio) && !/S\.zumbido/.test(desafio), 'el aro no se agranda sobre las copas y ya no suena el zumbido de la nave');
  // la luz fija de la nave (sin luces nuevas): la misma, ámbar y tenue
  ok(/const luzNave = new THREE\.PointLight\(0xffb060, 0, 34, 1\.6\);/.test(desafio) && /registrarLuz\(luzNave\);/.test(desafio), 'la luz fija sigue siendo una sola, registrada, y ahora ámbar y de alcance corto');
  ok((desafio.match(/new THREE\.PointLight\(/g) || []).length === 2, 'el Desafío no suma ninguna luz puntual más (la del aro y las dos del fuego de la zanja, como en la 4.8.0)');
  ok(LUZ_ARO.color === 0xffb060 && LUZ_ARO.intensidad <= 6 && LUZ_ARO.intensidad > 0 && LUZ_ARO.distancia <= 40, `la luz del aro es tenue (${LUZ_ARO.intensidad}, antes 80)`);
  // el cofre de los duendes (la cápsula)
  ok(!/#9aa0a6|#9fe8c8|CylinderGeometry\(0\.5, 0\.9, 90/.test(desafio), 'la cápsula ya no tiene casco gris, vidrio verde ni la columna de 90 m');
  ok(/const cofrePistola = mallaCofre\(\);/.test(desafio) && /registrarHalos\(cofrePistola\)/.test(desafio), 'la cápsula es un cofre entre raíces con sus halos');
  ok(!/faroCapsula/.test(desafio) && /cofrePistola\.userData\.haz\.visible = false;/.test(desafio) && /esporasCofre/.test(desafio), 'el cofre de la pistola no tiene hilo de luz (dos pasadas aditivas): suelta esporas que suben apenas');
}

// ============================================================ 2. fases, tiempos y mecánica (las de siempre)
{
  ok(FASES_ARO.llegando === 4 && FASES_ARO.yendo === 5, 'llegando 4 s y yendo 5 s, como la nave');
  const an = cuerpo(desafio, 'function actualizarNave(dt) {');
  ok(/if \(e\.t > FASES_ARO\.llegando\) \{ e\.fase = 'bajando'; e\.t = 0; e\.ritmo = 0; \}/.test(an), 'llegando pasa a bajando a los 4 s');
  ok(/e\.ritmo -= dt;/.test(an) && /if \(e\.ritmo <= 0 && e\.porBajar\.length\)/.test(an) && /e\.porBajar\.shift\(\)/.test(an), 'bajando: de a uno, cada `ritmo`');
  ok(/ataques\.marcarBajada\(item\); bajarAlien\(ataques\.tipoDe\(item\)\);/.test(an) && /e\.ritmo = ataques\.ritmoTras\(item, e\.porBajar\[0\]\);/.test(an), 'la cola, los señuelos y el ritmo son los de 4.8 ataques');
  ok(/if \(!e\.porBajar\.length && e\.t > 1\) \{ e\.fase = 'vigilando'; e\.t = 0; \}/.test(an), 'sin nadie por bajar pasa a vigilando');
  ok(/e\.fase === 'yendo'/.test(an) && /e\.t > FASES_ARO\.yendo/.test(an) && /e\.fase = 'fuera'/.test(an) && /nave\.g\.visible = false/.test(an), 'yendo dura 5 s y se esconde');
  ok(/if \(!nave\.g\.visible\) return;/.test(an), 'sin aro visible no pasa nada (como con la nave)');
  // el punto de bajada y las rutinas de bajarAlien
  const em = cuerpo(desafio, 'function empezarOleada(');
  ok(/estadoNave\.fase = puntoFijo \? 'bajando' : 'llegando'; estadoNave\.t = 0;/.test(em) && /nave\.g\.visible = !puntoFijo;/.test(em), 'empezarOleada: llegando (o bajando con punto fijo) y el aro se ve');
  ok(/const p = puntoFijo \|\| puntoDeAterrizaje\(js, azarDe\(d\.semilla, d\.oleadas, /.test(em), 'el punto sale de puntoDeAterrizaje, con la semilla');
  const pa = cuerpo(desafio, 'function puntoDeAterrizaje(');
  ok(/ataques\.puntoDeEntrada\(js, D\(\)\.oleadas\)/.test(pa) && /anguloDeBajada\(mapaMundo\.mapa, azar\)/.test(pa) && /r = 72 \+ azar\(\) \* 26/.test(pa), 'puntoDeAterrizaje: el lado de la noche, la base y 72 a 98 m, como siempre');
  const ba = cuerpo(desafio, 'function bajarAlien(tipo) {');
  ok(/const ang = Math\.random\(\) \* Math\.PI \* 2, r = Math\.random\(\) \* 3\.5;/.test(ba) && /estadoNave\.x \+ Math\.cos\(ang\) \* r/.test(ba), 'cada duende sale a menos de 3,5 m del centro (adentro de la boca)');
  ok(/a\.estado = 'bajar'; a\.t = 0;/.test(ba) && /a\.brota = true;/.test(ba), 'sale en estado `bajar` y con la marca de que sube de abajo de la tierra (el campo se limpia ahí)');
  ok(/ataques\.salida\(bajada, tipo, estadoNave\)/.test(ba) && /ataques\.lleno\(def, topeOleada\(\)\)/.test(ba), 'las rutinas de 4.8 ataques siguen (señuelo, cupo)');
  const bj = cuerpo(desafio.slice(desafio.indexOf("if (a.estado === 'bajar') {") - 5), "if (a.estado === 'bajar') {");
  ok(/if \(a\.brota && p\.y >= suelo\) a\.brota = false;/.test(bj) && /p\.y = Math\.min\(suelo, p\.y \+ dt \* SALIDA_DUENDE\.vel\)/.test(bj) && /p\.y = Math\.max\(suelo, p\.y - dt \* 8\)/.test(bj), 'los de la boca suben; los que saltan del Coihue siguen bajando a 8 m/s');
  // lo que tardan en salir es lo que tardaban en bajar (16 m a 8 m/s)
  cerca(TARDA_EN_SALIR, 16 / 8, 1e-9, 'salir de la tierra tarda lo mismo que bajar de la nave (2 s)');
  ok(SALIDA_DUENDE.hondo > 1.8, 'salen de bien abajo (no se ven hasta asomar)');
  ok(/aro\.apagar\(\)/.test(desafio) && (desafio.match(/aro\.apagar\(\)/g) || []).length >= 2, 'al irse y al limpiar, el aro se apaga');
}

// ============================================================ 3. las cuentas del aro (puras)
{
  for (const [fase, t, v] of [['llegando', 0, 0], ['llegando', 4, 1], ['bajando', 1, 1], ['vigilando', 30, 1], ['yendo', 0, 1], ['yendo', 2.6, 0], ['fuera', 0, 0]]) cerca(brotado(fase, t), v, 1e-9, `brota: ${fase} ${t}s`);
  let sube = true, baja = true;
  for (let t = 0; t < 4; t += 0.1) if (brotado('llegando', t + 0.1) < brotado('llegando', t)) sube = false;
  for (let t = 0; t < 2.6; t += 0.1) if (brotado('yendo', t + 0.1) > brotado('yendo', t)) baja = false;
  ok(sube && baja, 'brota sin saltos para atrás y se hunde sin saltos para adelante');
  cerca(tapado('llegando', 1), 0, 0, 'no hay tapa mientras brota');
  ok(tapado('yendo', 2.5) > 0.9 && tapado('yendo', 0.5) < 0.05 && tapado('yendo', 5) < 0.001, 'la tapa de tierra y hojas cubre la boca a mitad de camino y al final se hunde (no queda un salto al esconderlo)');
  ok(columna('bajando', 1) === 1 && columna('vigilando', 1) < 0.3 && columna('yendo', 2) === 0 && columna('fuera', 0) === 0, 'la columna de luciérnagas: entera mientras salen, tenue al acechar, apagada al irse');
  ok(luz('fuera', 0) === 0 && luz('vigilando', 3, 0) > 0.6 && luz('yendo', 2.6) === 0, 'la luz late al acechar y se apaga');
  ok(brilloDeHongos('vigilando', 3, 0) > 0.6 && brilloDeHongos('vigilando', 3, 0.9) !== brilloDeHongos('vigilando', 3, 2.9), 'los hongos de luz laten');
  ok(CADA_CRUJIDO[0] > 1.3 && proximoCrujido(0) === CADA_CRUJIDO[0] && proximoCrujido(0.999) <= CADA_CRUJIDO[1], 'el crujido se repite cada 2 a 3 s (la nave zumbaba cada 1,3)');
  for (let i = 0; i < 22; i++) for (let t = 0; t < 60; t += 3.7) {
    const L = luciernaga(i, 22, t, 3.3, 5.2);
    ok(Math.hypot(L.x, L.z) <= 3.3 + 1e-9 && L.y >= 0.29 && L.y <= 5.6 && L.a >= 0 && L.a <= 1 + 1e-9, `luciérnaga ${i}: dentro de la columna de pocos metros`);
  }
}

// ============================================================ 4. el aro, la ruina y el cofre armados de verdad
{
  const { M, THREE } = cargarVM(raiz, ['duendes-modelo.js', 'desafio-valle.js', 'desafio-aro-mundo.js']);
  const DM = M['duendes-modelo'], V = M['desafio-valle'];
  const revisar = (nombre, g, { maxMallas, maxTri }) => {
    let tri = 0, mallas = 0;
    const prohibidos = /casco|cupula|cúpula|haz|reflector|tractor|platillo|nave|ufo|ovni/i;
    g.traverse((o) => {
      ok(!prohibidos.test(o.name || ''), `${nombre}: el objeto «${o.name}» no tiene nombre de nave`);
      if (!o.isMesh) return;
      mallas++;
      tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
      const m = o.material;
      ok(!(m.blending === THREE.AdditiveBlending), `${nombre}: ninguna malla es un haz aditivo`);
      ok(!m.isShaderMaterial, `${nombre}: ningún shader nuevo`);
      // sin gris metálico: ningún color de vértice (ni del material) es un gris frío y parejo
      const C = o.geometry.attributes.color;
      if (C) {
        let grises = 0;
        for (let i = 0; i < C.count; i += 7) { const r = C.getX(i), gg = C.getY(i), b = C.getZ(i), mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); if (mx > 0.3 && (mx - mn) / mx < 0.06 && b >= r) grises++; }
        ok(grises / Math.max(1, C.count / 7) < 0.08, `${nombre}: casi nada de gris frío (${grises})`);
      }
    });
    ok(mallas <= maxMallas, `${nombre}: ${mallas} mallas (máximo ${maxMallas})`);
    ok(tri <= maxTri, `${nombre}: ${Math.round(tri)} triángulos (máximo ${maxTri})`);
    return { tri, mallas };
  };
  const aro = DM.mallaAro();
  const infoAro = revisar('aro', aro, { maxMallas: 5, maxTri: 12000 });
  ok(aro.name === 'aro' && aro.userData.partes && aro.userData.tapa && aro.userData.halos.length > 30 && aro.userData.geos.length === 4, 'el aro: partes, tapa, halos y las geometrías que se pegan al terreno');
  ok(aro.userData.tapa.visible === false, 'la tapa de tierra y hojas no se dibuja hasta que se cierra');
  ok(aro.userData.partes.children.length === 3, 'tierra y hongos, raíces y brillos: tres dibujos');
  ok(aro.userData.halos.filter((h) => h.luci != null).length === DM.ARO.luciernagas, 'las luciérnagas de la columna son halos (un solo dibujo de puntos para todos)');
  ok(DM.ARO.radioBoca >= 3.5 + 0.3 && DM.ARO.radioBoca <= 5, 'la boca cubre el radio de salida de los duendes (3,5 m) con margen');
  // los materiales son los de siempre: el nido y las madrigueras ya compilaron esos programas
  const mats = new Set(); aro.traverse((o) => { if (o.isMesh) mats.add(o.material.type + (o.material.vertexColors ? '+vc' : '')); });
  ok([...mats].every((t) => /^Mesh(Lambert|Basic)Material/.test(t)), `solo materiales Lambert y Basic (${[...mats].join(', ')})`);
  // apoyado en el suelo: nada de la malla queda a más de 0,3 m abajo del suelo ni la loma pasa de 1,2 m de alto (sin los hongos)
  const geoTela = aro.userData.geos[0], geoCort = aro.userData.geos[1];
  let minY = 1e9; for (const g of [geoTela, geoCort]) { const P = g.attributes.position; for (let i = 0; i < P.count; i++) minY = Math.min(minY, P.getY(i)); }
  ok(minY >= -0.3, `el aro no se mete bajo el suelo (${minY.toFixed(2)} m)`);
  // el mundo: se pega al terreno, brota, se hunde y se esconde (sin salto)
  {
    const mundo = M['desafio-aro-mundo'];
    const T = { altura: (x, z) => 10 + 0.2 * x + 0.1 * z };
    const luzFija = { color: { setHex() {} }, intensity: 0, distance: 0, decay: 0, position: { y: 0 } };
    const efectos = { polvos: 0, destellos: 0, polvo() { this.polvos++; }, destello() { this.destellos++; } };
    const oyó = [];
    const sonidos = { brota: () => oyó.push('brota'), crujir: () => oyó.push('crujir'), sale: () => oyó.push('sale'), cierra: () => oyó.push('cierra') };
    const aro2 = DM.mallaAro();
    const A = mundo.crearAroMundo({ T, g: aro2, luzFija, efectos, sonidos });
    ok(aro2.userData.partes.visible === false && luzFija.intensity === 0, 'al crearse está apagado');
    const e = { fase: 'llegando', t: 0, x: 100, z: 50 };
    const paso = (dt) => { e.t += dt; A.actualizar(e, dt); };
    paso(0.05);
    cerca(aro2.position.y, T.altura(100, 50), 1e-9, 'el aro se apoya en la altura del suelo');
    // en la ladera (0,2 de pendiente) la malla sigue al terreno: un vértice lejos del centro sube lo que sube el suelo
    const P = aro2.userData.geos[0].attributes.position, y0 = aro2.userData.geos[0].userData.y0;
    let maxDif = 0; for (let i = 0; i < P.count; i += 11) maxDif = Math.max(maxDif, Math.abs(P.getY(i) - (y0[i] + (T.altura(100 + P.getX(i), 50 + P.getZ(i)) - T.altura(100, 50)))));
    ok(maxDif < 1e-4, 'cada vértice sigue al terreno');
    ok(oyó[0] === 'brota', 'al entrar a llegando suena el crujido de brotar');
    let prev = aro2.userData.partes.position.y;
    for (let i = 0; i < 80; i++) { paso(0.05); ok(aro2.userData.partes.position.y >= prev - 1e-9, 'brota sin bajar'); prev = aro2.userData.partes.position.y; }
    ok(Math.abs(aro2.userData.partes.position.y) < 1e-6 && luzFija.intensity > 0, 'a los 4 s está del todo afuera y con luz');
    ok(efectos.polvos > 3, `brota con polvo y bruma (${efectos.polvos} nubes)`);
    e.fase = 'bajando'; e.t = 0;
    for (let i = 0; i < 40; i++) paso(0.05);
    const lucis = aro2.userData.halos.filter((h) => h.luci != null);
    ok(lucis.some((h) => h.tam > 0.5), 'mientras salen, la columna de luciérnagas se ve');
    ok(lucis.every((h) => Math.hypot(h.p.x, h.p.z) <= 3.9 && h.p.y <= 5.6), 'y sube de la boca: pocos metros');
    A.salio(101, 51);
    ok(efectos.destellos === 1 && oyó.includes('sale'), 'cada duende que sale: polvo, un destello dorado y el ruido de la tierra');
    e.fase = 'vigilando'; e.t = 0;
    for (let i = 0; i < 60; i++) paso(0.05);
    ok(lucis.every((h) => h.tam < 1.0) && oyó.filter((x) => x === 'crujir').length >= 1, 'al acechar, la columna casi se apaga y suena el crujido de las raíces cada tanto');
    const I0 = luzFija.intensity; let vari = false; for (let i = 0; i < 80; i++) { paso(0.05); if (Math.abs(luzFija.intensity - I0) > 0.05) vari = true; }
    ok(vari && luzFija.intensity < LUZ_ARO.intensidad * 1.31, 'la luz late despacio y nunca pasa de lo tenue');
    e.fase = 'yendo'; e.t = 0; paso(0.05);
    ok(oyó.includes('cierra'), 'al irse suena el cierre');
    let vioTapa = false;
    for (let i = 0; i < 100; i++) { paso(0.05); if (aro2.userData.tapa.visible) vioTapa = true; }
    ok(vioTapa, 'se tapa con tierra y hojas');
    ok(aro2.userData.partes.visible === false && aro2.userData.tapa.visible === false && luzFija.intensity === 0, 'a los 5 s todo está bajo tierra y la luz apagada: esconderlo no hace saltos');
    A.apagar();
    ok(aro2.userData.halos.every((h) => h.tam <= 0.0002), 'apagado, ningún halo queda prendido');
  }
  // la ruina del bosque
  const ruina = DM.mallaRuina(V.RUINA, V.paredesRuina());
  revisar('ruina', ruina, { maxMallas: 4, maxTri: 9000 });
  ok(ruina.userData.halos.filter((h) => h.placa != null).length === 3 && ruina.userData.halos.some((h) => h.semilla), 'la ruina: tres placas con esporas y la semilla del premio como halos');
  const cortR = ruina.children.find((m) => m.geometry.attributes.aVeta);
  ok(!!cortR, 'la ruina es de corteza (el material de los troncos, con su veta)');
  // misma huella: lo que se ve entra en lo que chocaba (3,4 × 17 m)
  let xmax = 0, zmax = 0, zmin = 1e9;
  for (const mm of ruina.children) { const P = mm.geometry.attributes.position; for (let i = 0; i < P.count; i++) { xmax = Math.max(xmax, Math.abs(P.getX(i))); zmax = Math.max(zmax, P.getZ(i)); zmin = Math.min(zmin, P.getZ(i)); } }
  ok(xmax <= V.RUINA.ancho / 2 + 0.9 && zmax <= V.RUINA.largo + 0.8 && zmin >= -0.8, `la ruina entra en su huella (${xmax.toFixed(2)} × ${zmin.toFixed(1)}..${zmax.toFixed(1)})`);
  ok(V.RUINA.ancho === 3.4 && V.RUINA.largo === 17 && V.RUINA.alto === 2.4 && V.RUINA.tabiques.join() === '5.8,11.6' && V.RUINA.puerta === 1.5, 'las medidas de la ruina no cambiaron');
  ok(V.paredesRuina().length === 7 && V.PLACA.dano === 14 && V.PLACA.radio === 0.75 && V.PLACA.periodo === 2.6, 'las paredes que chocan y las placas (daño, radio y ritmo) no cambiaron');
  // el cofre de los duendes y el de los restos
  const cofre = DM.mallaCofre();
  ok(cofre.userData.haz && cofre.userData.cofre, 'el cofre tiene su hilo de luz y su caja');
}

// ============================================================ 5. las ruinas en el código (eventos) y los puestos
{
  const ev = leer('src/desafio-eventos.js');
  const ruinas = ev.slice(ev.indexOf('// ---------------- ruinas del bosque'), ev.indexOf('// Las paredes de la ruina chocan'));
  ok(ruinas.length > 500, 'se encontró el bloque de la ruina');
  for (const x of ['matCasco', 'matCascoOscuro', '#6f757a', '#4a4f53', '#3a3d40', '#7dfff0', '#a6ff6e', 'TorusGeometry', 'CylinderGeometry(0.6, 1.4, 80']) ok(!ruinas.includes(x), `la ruina: ya no hay «${x}»`);
  ok(!ev.includes('matCasco') && !ev.includes("'#7dfff0'") && !/destello\([^)]*'#a6ff6e'/.test(ev), 'los destellos de lo que se recupera ya no son cian ni verdes');
  ok(/mallaRuina\(RUINA, paredesRuina\(\)\)/.test(ev) && /registrarHalos\(restos\)/.test(ev), 'eventos arma la ruina del bosque');
  ok(/api\.col\?\.agregar\(\{ seg: true, ax: a\.x, az: a\.z, bx: b\.x, bz: b\.z, r: 0\.12, alturaMin: y - 0\.5, alturaMax: y \+ RUINA\.alto, duenio: DUENIO_RUINA \}\)/.test(ev), 'las paredes chocan igual (mismos segmentos, radio y alto)');
  ok(/api\.herirJugador\?\.\(PLACA\.dano, /.test(ev) && /placaActiva\(t, i \* 0\.83\)/.test(ev), 'las placas hieren igual');
  ok(/const plano = PLANOS_ALIEN\.find\(\(p\) => !d\.planos\.includes\(p\.id\)\);/.test(ev) && /api\.sumarMaterial\('cristal', 3\)/.test(ev), 'el premio es el mismo (un plano y 3 semillas doradas)');
  const pm = leer('src/desafio-puestos-mundo.js');
  for (const x of ['matHaz', 'geoHaz', 'CylinderGeometry', 'AdditiveBlending']) ok(!pm.includes(x), `puestos: ya no hay «${x}» (el haz de 70 m)`);
  ok(/const ESPORAS = 8;/.test(pm) && /h\.esp/.test(pm), 'el hongo alto suelta esporas que suben apenas');
  ok(/vaina: \{ nombre: 'bolsa de esporas'/.test(leer('src/desafio-puestos.js')) && /generador: \{ nombre: 'semilla dorada'/.test(leer('src/desafio-puestos.js')), 'los nombres visibles de las estructuras: bolsa de esporas y semilla dorada');
}

// ============================================================ 6. el sonido nuevo: crujido de raíces y viento grave
{
  const huella = (d) => { let h = 0; for (let i = 0; i < d.length; i += 53) h = (h * 31 + Math.round(d[i] * 1e4)) | 0; return h; };
  const huellas = new Set();
  for (const [nombre, def] of Object.entries(SONIDOS_ARO)) {
    for (let k = 0; k < def.variantes; k++) {
      const t0 = performance.now();
      const d = completar(sintetizarAro(nombre, k));
      const ms = performance.now() - t0;
      const a = analizarAro(d);
      const etiqueta = `${nombre} #${k}`;
      cerca(a.dur, def.dur, 0.001, `${etiqueta}: dura ${def.dur} s`);
      ok(d instanceof Float32Array && d.length === Math.round(def.dur * TASA_ARO), `${etiqueta}: ${d.length} muestras a ${TASA_ARO} Hz`);
      ok(a.nan === 0, `${etiqueta}: ni un NaN`);
      ok(a.pico <= PICO_ARO + 1e-5 && a.pico > 0.5, `${etiqueta}: pico ${a.pico.toFixed(3)} (no satura: tope ${PICO_ARO})`);
      ok(a.rms > 0.05 && a.rms < 0.4, `${etiqueta}: RMS ${a.rms.toFixed(3)} (ni mudo ni a todo volumen)`);
      ok(Math.abs(a.dc) < 0.01, `${etiqueta}: sin continua (${a.dc.toExponential(1)})`);
      let fuertes = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > PICO_ARO * 0.93) fuertes++;
      ok(fuertes / d.length < 0.01, `${etiqueta}: ${(100 * fuertes / d.length).toFixed(2)} % de las muestras cerca del tope`);
      ok(Math.abs(d[0]) < 1e-3 && Math.abs(d[d.length - 1]) < 1e-3, `${etiqueta}: entra y sale sin clic`);
      ok(a.graves > 0.7, `${etiqueta}: es grave (${(100 * a.graves).toFixed(0)} % de la energía abajo de 400 Hz)`);
      // no es un zumbido parejo: el nivel cambia (crujidos, ráfagas) en ventanas de 50 ms
      const ven = Math.round(0.05 * TASA_ARO), niv = [];
      for (let o = 0; o + ven <= d.length; o += ven) { let s = 0; for (let i = 0; i < ven; i++) s += d[o + i] * d[o + i]; niv.push(Math.sqrt(s / ven)); }
      const media = niv.reduce((x, y) => x + y, 0) / niv.length, vari = Math.sqrt(niv.reduce((x, y) => x + (y - media) ** 2, 0) / niv.length) / media;
      ok(vari > 0.25, `${etiqueta}: el nivel cambia (variación ${vari.toFixed(2)}: no es un zumbido parejo)`);
      ok(ms < 400, `${etiqueta}: se genera en ${ms.toFixed(0)} ms`);
      huellas.add(huella(d));
    }
  }
  ok(huellas.size === Object.values(SONIDOS_ARO).reduce((s, d) => s + d.variantes, 0), 'cada variante es distinta');
  const a1 = completar(sintetizarAro('crujido', 0)), a2 = completar(sintetizarAro('crujido', 0));
  ok(huella(a1) === huella(a2), 'y repetible (la misma semilla da lo mismo)');
  ok(SONIDOS_ARO.brota.dur >= FASES_ARO.llegando && SONIDOS_ARO.cierra.dur >= FASES_ARO.yendo, 'brota cubre los 4 s de llegando y cierra los 5 s de yendo');
  let falla = false; try { completar(sintetizarAro('zumbido', 0)); } catch { falla = true; }
  ok(falla, 'un nombre que no existe no suena a cualquier cosa');
  // la fuente no es la sierra del zumbido de antes ni un generador de ondas: sale de ruido filtrado y pulsos
  const fuente = leer('src/desafio-aro-sonido.js');
  ok(!/sawtooth|square|createOscillator|OscillatorNode/.test(fuente), 'sin osciladores: sólo muestras calculadas');
  ok(/from '\.\/sonido-sintesis\.js'/.test(fuente) && !/desafio-sonidos|desafio-musica|desafio-efectos/.test(fuente), 'usa las primitivas de audio del juego y no toca los archivos de sonido de ambiente');

  // con el motor de verdad y un contexto de mentira
  const nodo = () => ({ connect() {}, disconnect() {}, start() { this.comenzo = true; }, stop() {}, addEventListener() {}, gain: { value: 1 }, frequency: { value: 0 }, Q: { value: 0 }, playbackRate: { value: 1 }, buffer: null });
  const S = new Sonido();
  const fuentes = [];
  S.ctx = { currentTime: 5, createBuffer: (c, len, tasa) => ({ duration: len / tasa, length: len, copyToChannel() {} }), createBufferSource: () => { const x = nodo(); fuentes.push(x); return x; }, createGain: nodo, createBiquadFilter: nodo };
  S.bus = { efectos: nodo(), piano: nodo(), musica: nodo() };
  S.previo = new Map(); S.pendientes = new Map(); S.cola = []; S.offline = true;
  const sa = crearSonidosAro(S);
  ok(sa.brota(null) > 3.9 && fuentes.length === 1 && fuentes[0].buffer.duration > 4.1, 'brota: suena, con el buffer de 4,2 s');
  ok(sa.crujir(null) > 2.3 && sa.sale(null) > 1.5 && sa.cierra(null) > 4.9, 'crujido, sale y cierra suenan y duran lo que dicen');
  const vistas = new Set(); for (let i = 0; i < 12; i++) { sa.sale(null); vistas.add(fuentes[fuentes.length - 1].buffer.length); }
  ok(S.previo.size >= 3, `quedan en la caché del motor (${S.previo.size} buffers)`);
  S.relax = true; ok(sa.brota(null) === 0 && sa.crujir(null) === 0, 'en el Relax no suena nada');
  S.relax = false; S.ctx = null; ok(sa.brota(null) === 0 && sa.preparar() === false, 'sin motor de audio todavía, no hace nada (y no rompe)');
}

// ============================================================ 7. nada visible habla de naves
{
  // cadenas con más de una palabra (las de una sola son identificadores internos: `nave-hud`, `plasmaAliado`, `vaina`...)
  const permitidas = [
    /vaina de suela/i,                                   // la funda de un cuchillo (el cuaderno, la gente del campo y los recursos)
    /uniform sampler2D|void main|gl_FragColor|varying /, // código de shader (postproceso.js)
    /e\.data\.generadores/,                              // el código del worker de texturas (texturas-datos.js)
  ];
  const malas = [];
  let revisadas = 0;
  for (const f of archivosSrc(raiz)) {
    for (const c of cadenasDe(fs.readFileSync(f, 'utf8'))) {
      revisadas++;
      if (!palabrasDeNave.test(c.texto) || !/\s/.test(c.texto.trim())) continue;
      if (permitidas.some((p) => p.test(c.texto))) continue;
      malas.push(`${path.basename(f)}:${c.linea}: ${c.texto.replace(/\s+/g, ' ').slice(0, 90)}`);
    }
  }
  ok(revisadas > 20000, `se revisaron ${revisadas} cadenas del código`);
  ok(malas.length === 0, `ninguna cadena visible habla de nave, nodriza, alien, plasma, platillo, ovni, vaina ni generador:\n  ${malas.join('\n  ')}`);
  // lo que más se vería: los textos que cambiaron
  const trucos = leer('src/trucos-textos.js');
  ok(/en las ruinas del bosque/.test(trucos) && !/restos de las naves/.test(trucos), 'los planos se ganan en las ruinas del bosque');
  ok(!/cayó del cielo|columna de luz verde/.test(leer('src/main.js')) && /hilo de luz dorada/.test(leer('src/main.js')), 'el tutorial ya no manda a buscar una columna verde que cayó del cielo');
  // las otras cadenas con restos de ciencia ficción
  for (const f of archivosSrc(raiz)) {
    for (const c of cadenasDe(fs.readFileSync(f, 'utf8'))) {
      if (!/\s/.test(c.texto.trim()) || /sampler2D|void main|#include/.test(c.texto)) continue;
      ok(!/\b(platillos?|ovnis?|extraterrestres?|astronaves?|nave espacial|rayo tractor|haz tractor|nave nodriza)\b/i.test(c.texto), `${path.basename(f)}:${c.linea}: ciencia ficción en un texto`);
    }
  }
  // el Coihue y el asedio siguen siendo el Coihue (alturaNave: 52) y no se tocaron
  ok(/alturaNave: 52/.test(leer('src/desafio-asedio.js')), 'el Coihue Viejo del asedio sigue con su alturaNave de 52');
  // las tablas de inglés no se tocaron
  // (contra la 4.8.0 juntada, aa9d4b5; si la carpeta no es un repositorio —un zip— se saltea)
  let cambiadas = null;
  try { cambiadas = execFileSync('git', ['diff', '--name-only', 'aa9d4b5', '--', 'src'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/).filter(Boolean); } catch { cambiadas = null; }
  if (cambiadas) ok(!cambiadas.some((f) => /idioma-en/.test(f)), `las tablas de inglés (idioma-en*.js) no se tocaron (${cambiadas.length} archivos de src cambiados)`);
  // y los archivos y nombres internos siguen
  for (const f of ['src/desafio-nave.js', 'src/desafio-nave-mundo.js']) ok(fs.existsSync(path.join(raiz, f)), `${f} sigue en su lugar (no se renombran archivos internos)`);
}

console.log(`OK 4.8.1 sin naves · ${n} comprobaciones · el aro, las fases, el sonido, las ruinas y los textos`);
