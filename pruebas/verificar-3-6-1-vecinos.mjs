// 3.6.1 (vecinos): los arreglos de los vecinos, la charla y las mecánicas de cada lugar de la aldea
// (la 3.6.0 recién salida). Una sección por bug: cada una falla con el código de la 3.6.0.
// La partida real que acompaña: humo-3-6-1-asientos.cjs (todos los asientos del juego).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
// jugador.js y aldea-mecanicas-mundo.js usan three: en Node, el three local del juego como módulo
{
  const codigo = leer('three-r186-inline.js');
  const caja = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, WeakMap, Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Uint8ClampedArray, ArrayBuffer, DataView, Error, TypeError, Symbol, Promise, Reflect, Proxy };
  vm.runInNewContext(codigo + '\n;this.__claves = Object.keys(THREE);', caja);
  const archivo = path.join(os.tmpdir(), 'hojarasca-three-3-6-1-vecinos.mjs');
  fs.writeFileSync(archivo, codigo + '\nexport const { ' + caja.__claves.join(', ') + ' } = THREE;\n');
  register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(archivo).href)}, shortCircuit: true }; return n(s, c); }`));
}
const THREE = await import('three');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };
const main = leer('src/main.js');

// ============================================================ 1. del sillón de los cuentos no se salía
// Lo encontró el usuario: el sillón es un mueble que frena (una caja de cuatro lados) y el asiento cae
// en su medio. Al levantarte, los lados te empujaban siempre para adentro. Ahora volvés a donde estabas
// parado al sentarte (con las teclas, el mando, R o al despertar), y sentado se guarda ese lugar.
{
  // un jugador de verdad (jugador.js) con un DOM mínimo, un terreno plano y la caja del sillón
  const oyentes = {};
  globalThis.document ??= { addEventListener: (t, f) => { oyentes[t] = f; }, pointerLockElement: null };
  globalThis.window ??= { addEventListener() {}, self: 1, top: 1 };
  globalThis.HTMLElement ??= function HTMLElement() {};
  HTMLElement.prototype.requestPointerLock ??= () => {};
  const { crearJugador } = await import('../src/jugador.js');
  // la caja: de -0.5 a 0.5 en x y en z, con los lados como segmentos finos (como piezas.js `mueble`)
  const lados = [[-0.5, -0.5, 0.5, -0.5], [0.5, -0.5, 0.5, 0.5], [0.5, 0.5, -0.5, 0.5], [-0.5, 0.5, -0.5, -0.5]];
  const empujar = (p, r) => {
    for (const [ax, az, bx, bz] of lados) {
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
      const t = Math.max(0, Math.min(1, ((p.x - ax) * vx + (p.z - az) * vz) / l2));
      const cx = ax + vx * t, cz = az + vz * t, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      const minimo = r + 0.04;
      if (d < minimo && d > 1e-9) { p.x = cx + (dx / d) * minimo; p.z = cz + (dz / d) * minimo; }
    }
  };
  const col = {
    resolver: (p, r) => empujar(p, r), resolverPlataformas() {}, plataformaEn: () => null, plataformaBaja: () => null,
    espacioVerticalLibre: () => true, techoEntre: () => null, paredEntre: () => false,
  };
  const T = { altura: () => 0, normal: () => ({ x: 0, y: 1, z: 0 }), agua: () => null, indice: () => 0, distSendero: [9], bosque: [0], pasto: [0] };
  const camara = new THREE.PerspectiveCamera();
  const J = crearJugador(camara, T, col, { activo: () => true, lienzo: { addEventListener() {} }, sensibilidad: () => 1, invierno: () => 0, otono: () => 0, fov: () => 70 });
  const e = J.estado;
  const paso = (k = 1) => { for (let i = 0; i < k; i++) J.actualizar(0.05); };
  // parado adelante del sillón, como para apretar E
  J.ubicar(0, 1.6, 0, 0); paso(6);
  // E: el cuerpo va al asiento (main.js: objetos.usar → r.sentarse) y te sentás
  e.pos.set(0, 0, 0); e.yaw = Math.PI; J.sentarse(true); paso(4);
  ok(e.sentado && Math.hypot(e.pos.x, e.pos.z) < 0.05, 'sentado en el medio del sillón');
  ok(e.salida && Math.abs(e.salida.z - 1.6) < 0.05, 'la salida: donde estabas parado');
  // te levantás caminando: volvés a la salida, afuera de la caja, y te podés ir
  J.teclas.add('KeyW'); paso(1);
  ok(!e.sentado && e.pos.z > 1 && !e.salida, `al levantarte quedás afuera del sillón (${e.pos.z.toFixed(2)})`);
  J.teclas.clear();
  e.yaw = Math.PI; J.teclas.add('KeyW'); paso(40); J.teclas.clear();
  ok(e.pos.z < -1 || e.pos.z > 2.5 || Math.abs(e.pos.x) > 1, `y te alejás (${e.pos.x.toFixed(2)}, ${e.pos.z.toFixed(2)})`);
  // con R (sentarse(false)) y al despertar (dormir), lo mismo
  J.ubicar(1.6, 0, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); paso(2); J.sentarse(false);
  ok(Math.abs(e.pos.x - 1.6) < 0.05 && !e.sentado, 'con R, también afuera');
  // sentado dos veces seguidas (sentado en un banco junto al fuego, E duerme): vale la primera salida
  J.ubicar(-1.6, 0, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); paso(2); J.sentarse(true); paso(2); J.sentarse(false);
  ok(Math.abs(e.pos.x + 1.6) < 0.05, 'dormir sentado y despertar: la salida de antes');
  // si te llevaron lejos sentado (un teletransporte), no se vuelve a una salida de otro lado
  J.ubicar(0, 1.6, 0, 0); paso(4); e.pos.set(0, 0, 0); J.sentarse(true); e.pos.set(30, 0, 30); J.sentarse(false);
  ok(e.pos.x === 30 && e.pos.z === 30, 'lejos de la salida, te levantás donde estás');
  // el código de la 3.6.0 (sin salida) dejaba al jugador adentro
  ok(/estado\.salida = hayDePie \? dePie\.clone\(\) : estado\.pos\.clone\(\)/.test(leer('src/jugador.js')), 'jugador.js: la salida al sentarse');
  // R, sentado, siempre te levanta; y sentado se guarda la salida (al cargar no aparecés adentro del sillón)
  ok(main.includes('if (js.sentado) jugador.sentarse(false);\n      else if (!js.nadando && !js.enKayak && !js.enTren) jugador.sentarse(true);'), 'R: sentado, te levanta siempre');
  ok(main.includes(': jugador.estado.sentado && jugador.estado.salida ? { x: jugador.estado.salida.x, y: jugador.estado.salida.y, z: jugador.estado.salida.z }'), 'guardar: sentado, la salida');
  ok(fs.existsSync(new URL('./humo-3-6-1-asientos.cjs', import.meta.url)), 'la partida real de todos los asientos');
}

// ============================================================ 2. sentados en la silla de verdad (los chicos en los almohadones)
// Antes la cadera bajaba siempre 37 cm de la figura: un chico (talla 0,6) quedaba 7 cm arriba del
// almohadón de la biblioteca y hundido 18 cm en una silla. Ahora cuenta la altura del asiento de verdad.
{
  const { bajaSentado } = await import('../src/gente.js');
  const G = await import('../src/aldea-gente.js');
  const A = await import('../src/aldea.js');
  const cadera = (asiento, talla) => (0.82 - bajaSentado(asiento, talla)) * talla;   // en el mundo
  ok(Math.abs(bajaSentado(undefined, 1) - 0.37) < 1e-9, 'un grande en una silla común: como antes');
  for (const [asiento, talla, que] of [[0.47, 1, 'un grande en una silla'], [0.47, 0.6, 'un chico en una silla'], [0.2, 0.6, 'un chico en un almohadón'], [0.55, 1, 'la abuela en su sillón'], [0.44, 0.62, 'el nene en el pupitre'], [0.2, 1, 'un grande en un almohadón']]) {
    ok(Math.abs(cadera(asiento, talla) - (asiento - 0.02 * talla)) < 0.005, `${que}: la cadera sobre el asiento (${cadera(asiento, talla).toFixed(3)} m, asiento ${asiento})`);
  }
  ok(G.ALMOHADONES.size === 4 && G.ALTURA_ALMOHADON > 0.15 && G.ALTURA_ALMOHADON < 0.25, 'los cuatro almohadones de la alfombra');
  // el domingo, a los cuentos: los chicos en los almohadones
  const a = A.aldeaNueva();
  ok(G.ALMOHADONES.has(A.rutinaAldea('nene', 10.5, 6, a).punto) && G.ALMOHADONES.has(A.rutinaAldea('nena', 10.5, 6, a).punto), 'el domingo, los chicos en los almohadones');
  ok(!G.ALMOHADONES.has(A.rutinaAldea('padre', 10.5, 6, a).punto), 'y los grandes, en las sillas');
  // aldea-gente pone la altura del asiento (la silla de verdad, o el almohadón)
  const gente = leer('src/aldea-gente.js'), g = leer('src/gente.js');
  ok(gente.includes('npc.asiento = alturaAsiento(d, npc);') && gente.includes('n.asiento = alturaAsiento(d, n);') && g.includes('const b = bajaSentado(g.asiento, g.g?.scale?.y);'), 'la pose usa el asiento');
  ok(main.includes('asientoEn: (x, z, y) =>'), 'main.js: la altura de la silla de la aldea');
}

// ============================================================ 3. la aldea, días enteros a todas las horas
// Una semana de la aldea completa (y de la recién empezada), minuto a minuto, con la gente caminando de
// verdad por las calles (a su paso, con el día de 30 minutos), con sol, lluvia y nieve.
//  · de noche nadie se queda afuera con lluvia o nieve (antes: lo elegido a las 20:10 seguía hasta las
//    22, y los chicos jugaban en la nieve de noche; y lo del horario en la plaza, también con lluvia);
//  · con lluvia o nieve nadie se sienta en un banco de la plaza;
//  · salen con tiempo para lo que les toca: la escuela, el local, el almuerzo (antes llegaban tarde);
//  · si se larga a llover, el que estaba afuera se va a cubierto;
//  · dos nunca en la misma silla; los chicos no van a la escuela cerrada; nadie va a trabajar a un local
//    que todavía no abrió; ningún tramo de camino atraviesa un edificio;
//  · la mesa de la casa de té de una invitación queda para el invitado y para vos.
{
  const A = await import('../src/aldea.js');
  const G = await import('../src/aldea-gente.js');
  const V = await import('../src/vecindad.js');
  const M = A.marcoAldea(A.PARADA_ALDEA);
  const L = { carpintero: 'carpinteria', panadera: 'panaderia', herrero: 'herreria', pescador: 'pescaderia', maestra: 'escuela', enfermera: 'puesto-sanitario', telegrafista: 'estafeta', tejedora: 'hilanderia', apicultor: 'sala-miel', guardaparque: 'seccional', musico: 'salon' };
  const simular = ({ completa, dias, climaDe, citar = null }) => {
    const P = { dia: 1, horas: 0, aldea: A.aldeaNueva(), entradas: {}, materiales: {}, cosas: {} };
    if (completa) { P.aldea.pobladores = Object.keys(L).map((clave) => ({ clave, dia: 1 })); P.aldea.locales = Object.fromEntries(Object.values(L).map((l) => [l, 1])); }
    const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
    const npcs = [{ clave: 'ercilia', nombre: 'Ercilia', pos: vec(0, 0, 0), ruta: [{ ...M.aMundo(-20, 50), quieto: 9 }], historias: [] }];
    const gente = { gente: npcs, agregarPoblador(def) { const n = { ...def, pos: vec(def.pos.x, 0, def.pos.z), camino: [], g: { rotation: {} } }; npcs.push(n); return n; } };
    const c0 = M.aMundo(22, 40);
    const jug = { estado: { pos: vec(c0.x, 0, c0.z) } };
    let clima = 'sol';
    const AG = G.crearAldeaGente({ progreso: () => P, gente: () => gente, jugador: () => jug, tren: () => null, alturaDePie: () => 0, nota() {}, guardar() {}, registrar() {}, climaVecindad: () => clima, ambiente: () => ({ clima, estacion: 'invierno' }), hablandoCon: () => null, segundosPorHora: () => 75 });
    if (citar) AG.citar(citar, { edificio: 'casa-te', punto: 'mesa-2' });
    const r = { nocheAfuera: [], bancoMojado: [], mismaSilla: [], escuelaCerrada: [], localCerrado: [], atraviesa: [], mesaAjena: [], tarde: 0, obligado: 0, mojados: 0 };
    for (let d = 1; d <= dias; d++) {
      for (let m = 0; m < 24 * 60; m++) {
        P.dia = d; P.horas = m / 60;
        clima = climaDe(d, P.horas);
        for (const n of npcs) {
          let quedan = (n.velocidad || 0.85) * 1.25;
          while (quedan > 0 && n.camino?.length) {
            const q = n.camino[0], dx = q.x - n.pos.x, dz = q.z - n.pos.z, dd = Math.hypot(dx, dz);
            if (dd <= quedan) { n.pos.x = q.x; n.pos.z = q.z; n.camino.shift(); quedan -= dd; } else { n.pos.x += (dx / dd) * quedan; n.pos.z += (dz / dd) * quedan; quedan = 0; }
          }
        }
        AG.actualizar(1.25);
        if (m % 5) continue;
        const h = P.horas, ds = A.diaSemanaDe(d), sentados = [];
        for (const [k, st] of AG.personas) {
          const de = st.destino, n = st.npc;
          if (!de || !n) continue;
          const caminando = !!n.camino?.length, t = h - A.desfaseDe(k);
          const malTiempo = clima === 'lluvia' || clima === 'nieve';
          if (n.camino?.length && !n.__visto) {
            n.__visto = true;
            let a = M.aLocal(n.pos.x, n.pos.z);
            for (const q of n.camino) { const b = M.aLocal(q.x, q.z); if (!q.sinChoque && G.atraviesa({ x: a.lx, z: a.lz }, { x: b.lx, z: b.lz })) r.atraviesa.push(`${k} → ${de.edificio}/${de.punto}`); a = b; }
          }
          if (!caminando) n.__visto = false;
          if (!caminando && !de.adentro && malTiempo && (t >= V.NOCHE_AFUERA || t < 6.5) && de.actividad !== 'galeria') r.nocheAfuera.push(`${k} ${de.edificio}/${de.punto} ${de.actividad || 'rutina'} ${h.toFixed(2)} día ${d} (${clima})`);
          if (!caminando && malTiempo && de.edificio === 'plaza' && /^estar-/.test(de.punto)) r.bancoMojado.push(`${k} ${de.punto} ${h.toFixed(2)} (${clima})`);
          if (clima === 'lluvia' && st.act?.e && V.ACTIVIDADES[st.act.e.actividad]?.afuera) r.mojados++;
          if (A.VECINOS_ALDEA[k]?.chico && de.edificio === 'escuela' && !A.localAbierto(P.aldea, 'escuela')) r.escuelaCerrada.push(k);
          if (Object.values(L).includes(de.edificio) && de.lugar !== 'obra' && !A.localAbierto(P.aldea, de.edificio)) r.localCerrado.push(`${k} → ${de.edificio}`);
          if (de.sentado && !caminando) sentados.push({ k, x: de.x, z: de.z, p: `${de.edificio}/${de.punto}` });
          if (citar && k !== citar && de.edificio === 'casa-te' && (de.punto === 'mesa-1' || de.punto === 'mesa-2')) r.mesaAjena.push(`${k} ${de.punto}`);
          if (!V.estaLibre(k, h, ds, P) && !['cama', 'cama-chicos'].includes(de.punto)) { r.obligado++; if (caminando) r.tarde++; }
        }
        for (let i = 0; i < sentados.length; i++) for (let j = i + 1; j < sentados.length; j++) if (Math.hypot(sentados[i].x - sentados[j].x, sentados[i].z - sentados[j].z) < 0.45) r.mismaSilla.push(`${sentados[i].k} y ${sentados[j].k} (${sentados[i].p})`);
      }
    }
    return r;
  };
  const CLIMAS = ['sol', 'nieve', 'lluvia', 'nublado', 'nieve', 'viento', 'lluvia'];
  // el tiempo cambia a la tarde (se larga a llover o a nevar con gente afuera)
  const tiempo = (d, h) => (h < 15 ? CLIMAS[d % 7] : CLIMAS[(d + 3) % 7]);
  const muestra = (l) => (l.length ? `: ${l.slice(0, 3).join('; ')}` : '');
  for (const [nombre, completa] of [['completa', true], ['recién empezada', false]]) {
    const r = simular({ completa, dias: 7, climaDe: tiempo });
    ok(!r.nocheAfuera.length, `aldea ${nombre}: de noche y con mal tiempo, nadie afuera (${r.nocheAfuera.length})${muestra(r.nocheAfuera)}`);
    ok(!r.bancoMojado.length, `aldea ${nombre}: con lluvia o nieve, nadie en los bancos de la plaza (${r.bancoMojado.length})${muestra(r.bancoMojado)}`);
    ok(r.mojados === 0, `aldea ${nombre}: si se larga a llover, lo de afuera se cambia (${r.mojados})`);
    ok(!r.mismaSilla.length && !r.escuelaCerrada.length && !r.localCerrado.length && !r.atraviesa.length, `aldea ${nombre}: sillas, escuela, locales y caminos${muestra([...r.mismaSilla, ...r.escuelaCerrada, ...r.localCerrado, ...r.atraviesa])}`);
    // (con la 3.6.0: 15,8 % la completa y 26,2 % la recién empezada; caminar entre el andén y la plaza
    // lleva media hora del juego, así que algo de camino adentro del horario queda siempre)
    ok(r.tarde / r.obligado < (completa ? 0.135 : 0.235), `aldea ${nombre}: salen con tiempo (caminando ${(100 * r.tarde / r.obligado).toFixed(1)} % del rato que les toca algo)`);
  }
  // lo de afuera termina antes de que oscurezca, y a las 20 ya no se empieza nada afuera
  {
    const est = { aldea: A.aldeaNueva() };
    let afuera = 0;
    for (const k of A.ORDEN_PERSONAS_ALDEA) for (let s = 0; s < 40; s++) for (const h0 of [17.5, 18.6, 19.4, 19.9, 20.2]) {
      const h = h0 + A.desfaseDe(k);
      const e = V.elegirActividad(k, h, 2, ['sol', 'nieve', 'nublado'][s % 3], est, s);
      if (!e.libre || !V.ACTIVIDADES[e.actividad]?.afuera) continue;
      afuera++;
      assert.ok(h0 + e.duracion <= V.NOCHE_AFUERA + 1e-6, `${k} ${h0}: ${e.actividad} hasta las ${(h0 + e.duracion).toFixed(2)}`);
      assert.ok(h0 < V.NOCHE_AFUERA - 0.5, `${k} ${h0}: ${e.actividad} empieza de noche`);
      if (s % 3 === 1) assert.ok(e.actividad !== 'plaza', `${k}: con nieve, al banco de la plaza no`);
    }
    ok(afuera > 100, `lo de afuera, siempre antes de la noche (${afuera} elecciones)`);
  }
  const r = simular({ completa: true, dias: 2, climaDe: () => 'sol', citar: 'jefe' });
  ok(!r.mesaAjena.length, `la mesa de la invitación, libre para el invitado y para vos${muestra(r.mesaAjena)}`);
}

console.log(`OK 3.6.1 vecinos · ${n} verificaciones`);
