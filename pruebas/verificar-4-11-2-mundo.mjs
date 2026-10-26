// 4.11.2 — geometría y aspecto del mundo (A):
//   G-7  los edificios de oficio propios tienen choque en lo grande que antes se atravesaba (horno, mesas, barriles...) sin tapar la entrada
//   G-8  el pasaje del torreón de piedra (mesa 10 cm al oeste) sigue transitable con todos los giros
//   V10  cada sombra larga de antorcha tiene su opacidad (no la de la más cercana para todas)
//   V7   el suelo de las madrigueras en ladera sigue el terreno (geometría por puesto)
//   V13  los postes del tablero de trofeos llegan al suelo en laderas laterales
// Todo en Node (arnés de construcción, three local); lo que depende de GL se anota en CAMBIOS_4_11_2_A.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mundo, C as CL } from './ayuda-4-0-1-mundo.mjs';
import { paso, R, H } from './ayuda-4-0-3-caminante.mjs';

let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- G-7: choque en los oficios propios
// Para cada cosa grande que se veía y se atravesaba: [id del plano, x local, z local, descripción]. Se pone al jugador parado
// en su centro (sobre el piso del edificio) y se resuelve el choque: si empuja, hay choque.
const COSAS = [
  ['herreria-propia', 1.35, 0.95, 'el barril de agua de la herrería'],
  ['herreria-propia', 0.35, 1.05, 'la mesita de las tenazas de la herrería'],
  ['carpinteria', 1.0, -0.4, 'el caballete con el tronco de la carpintería'],
  ['carpinteria', 1.25, 1.0, 'la pila de tablones de la carpintería'],
  ['panaderia-horno', 1.05, 0.45, 'la mesa de amasar de la panadería'],
  ['panaderia-horno', -0.5, 0.75, 'el horno de barro de la panadería (ya tenía choque)'],
  ['cerveceria', 0.4, -0.7, 'la mesa de degustación de la cervecería'],
  ['cerveceria', 1.55, 0.25, 'el barril suelto de la cervecería'],
  ['telar-grande', -1.2, -0.45, 'el cesto de lana del telar'],
  ['queseria', 0.7, -0.5, 'la mesa de la prensa de la quesería'],
  ['queseria', 0.95, 0.5, 'los tarros de leche de la quesería'],
  ['tienda-campo', -1.4, 0.75, 'el primer barril de la tienda de campo'],
  ['tienda-campo', -0.9, 0.75, 'el segundo barril de la tienda de campo'],
  ['canteria', 1.15, 0.0, 'los bloques apilados de la cantería'],
  ['canteria', 0.95, 1.0, 'las lajas de la cantería'],
  ['canteria', -1.3, -0.7, 'la grúa de mano de la cantería'],
];
// cuánto lo empuja el choque desde el centro de la cosa (0 = atraviesa)
function empuje(id, lx, lz, rot = 0) {
  const w = mundo({ altura: () => 0 }), r = w.terminar(id, 0, 0, rot);
  assert.ok(r.ok, `se arma ${id}`);
  const o = r.o, c = Math.cos(rot), s = Math.sin(rot);
  const x = o.datos.x + lx * c + lz * s, z = o.datos.z - lx * s + lz * c;
  const q = { x, z, y: o.datos.y + 0.18, vy: 0, enSuelo: true, coyote: 0 };
  w.col.resolver(q, R, H);
  w.col.resolverPlataformas(q, R, H, 0.62);
  return Math.hypot(q.x - x, q.z - z);
}
for (const [id, lx, lz, que] of COSAS) {
  for (const rot of [0, Math.PI / 2]) ok(empuje(id, lx, lz, rot) > 0.3, `${que} tiene choque (giro ${Math.round(rot * 180 / Math.PI)})`);
}

// lo que no puede pasar: tapar la entrada. Desde afuera, de frente, se llega a menos de 1,3 m del centro del edificio (donde se usa con E)
const DIRS = [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
function alcance(id, rot, listo = () => false) {
  const w = mundo({ altura: () => 0 }), r = w.terminar(id, 0, 0, rot);
  assert.ok(r.ok, `se arma ${id}`);
  const o = r.o, D = CL.PLANO[id].fondo, ca = Math.cos(rot), sa = Math.sin(rot);
  const loc = (lx, lz) => ({ x: o.datos.x + lx * ca + lz * sa, z: o.datos.z - lx * sa + lz * ca });
  const toLoc = (x, z) => ({ lx: (x - o.datos.x) * ca - (z - o.datos.z) * sa, lz: (x - o.datos.x) * sa + (z - o.datos.z) * ca });
  const llevar = (a, dx, dz) => { const t = { x: a.x, y: a.y, z: a.z, vy: a.vy, enSuelo: a.enSuelo, coyote: a.coyote }; for (let i = 0; i < 6; i++) paso(w, t, dx / 6, dz / 6); return t; };
  const asentar = (p) => { let i = 0; while (!p.enSuelo && i++ < 90) paso(w, p, 0, 0); return p; };
  const s0 = loc(0.013, -D / 2 - 2.483), q = asentar({ x: s0.x, z: s0.z, y: 0, vy: 0, enSuelo: false, coyote: 0 });
  const cel = 0.12, cx = o.datos.x, cz = o.datos.z, clave = (p) => `${Math.round((p.x - cx + 4.6) / cel)},${Math.round((p.z - cz + 4.6) / cel)},${Math.round(p.y / 0.2)}`;
  const vis = new Map([[clave(q), q]]), cola = [q];
  let minCentro = 99, hondo = -9;   // hondo: lo más al fondo (z local) que se llega adentro del edificio
  while (cola.length && vis.size < 60000) {
    const a = cola.shift();
    const l = toLoc(a.x, a.z);
    minCentro = Math.min(minCentro, Math.hypot(l.lx, l.lz));
    if (a.y - o.datos.y < 1.0 && Math.abs(l.lx) < 2.0 && Math.abs(l.lz) < 2.0 && l.lz > hondo) hondo = l.lz;
    if (listo({ minCentro, hondo })) break;
    for (const [dx, dz] of DIRS) {
      const b = llevar(a, dx * cel, dz * cel);
      if (Math.abs(b.x - cx) > 4.6 || Math.abs(b.z - cz) > 4.6 || Math.hypot(b.x - a.x, b.z - a.z) < cel * 0.35) continue;
      if (!b.enSuelo) { asentar(b); if (!b.enSuelo) continue; }
      const k = clave(b); if (!vis.has(k)) { vis.set(k, b); cola.push(b); }
    }
  }
  return { minCentro, hondo, celdas: vis.size };
}
const OFICIOS = ['herreria-propia', 'carpinteria', 'panaderia-horno', 'cerveceria', 'telar-grande', 'queseria', 'tienda-campo', 'canteria'];
// lo que se llegaba antes de G-7 (medido en la 4.11.1), para no empeorarlo: se anota en CAMBIOS_4_11_2_A.md
const resumen = [];
for (const id of OFICIOS) {
  for (const ri of [0, 3]) {
    const a = alcance(id, ri * Math.PI / 4, (r) => r.minCentro < 1.3);
    ok(a.minCentro < 1.3, `${id} (giro ${ri * 45}): desde afuera se llega a ${a.minCentro.toFixed(2)} m del centro (donde se usa con E)`);
    if (ri === 0) resumen.push(`${id}: centro a ${a.minCentro.toFixed(2)} m`);
  }
}
console.log('  G-7:', resumen.join(' | '));

// ---------------------------------------------------------------- G-8: el pasaje del torreón (la mesa 10 cm al oeste)
{
  const pl = leer('src/planos-ampliar.js');
  ok(pl.includes('mesas: [{ x: 0.2, z: -0.4 }]') && pl.includes('alfombras: [{ x: 0.2, z: -0.4, w: 1.9, d: 1.5 }]') && pl.includes('farolColgante(c, 0.2, py + 1.9, -0.4)'), 'torreón: la mesa, la alfombra y el farol colgante de la planta baja siguen juntos en x = 0,2');
  // el pasaje entre la mesa (cuerpo de 0,70) y el hogar: se mide con el choque real, con cuatro giros
  const id = 'torreon-piedra', Dd = CL.PLANO[id].fondo;
  for (const ri of [0, 3]) {
    const a = alcance(id, ri * Math.PI / 4, (r) => r.hondo > 1.3);
    ok(a.hondo > 1.3, `torreón, giro ${ri * 45}: se llega al fondo de la planta baja (z local ${a.hondo.toFixed(2)}; fondo ${Dd})`);
  }
}


// ---------------------------------------------------------------- lo que sigue usa el three de verdad (como verificar-4-10-3-visual)
import { registrarThree } from './ayuda-three.mjs';
registrarThree();
const THREE = await import('three');
{
  // un lienzo de mentira para las texturas
  const noop = () => {};
  const ctx2d = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), measureText: () => ({ width: 10 }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }, { get: (t, p) => (p in t ? t[p] : noop), set: () => true });
  globalThis.document = globalThis.document || { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctx2d }) };
}

// ---------------------------------------------------------------- V10: cada sombra larga con su opacidad
{
  const A = await import('../src/desafio-ambiente.js');
  // las reglas: tres niveles que crecen con la oscuridad (alfa) y cubren todo el rango de la regla vieja (0,62 a 0,87)
  ok(A.OPACIDAD_SOMBRA.length === 3 && A.OPACIDAD_SOMBRA[0] < A.OPACIDAD_SOMBRA[1] && A.OPACIDAD_SOMBRA[1] < A.OPACIDAD_SOMBRA[2], 'tres niveles de opacidad, de menos a más');
  ok(A.OPACIDAD_SOMBRA.every((v) => v >= 0.62 && v <= 0.87), 'dentro del rango que tenían las sombras (0,62 a 0,87)');
  ok(A.nivelDeSombra(0) === 0 && A.nivelDeSombra(0.1) === 0 && A.nivelDeSombra(0.25) === 1 && A.nivelDeSombra(0.45) === 2 && A.nivelDeSombra(0.5) === 2, 'alfa baja, media y alta caen en el nivel 0, 1 y 2');
  ok(A.nivelDeSombra(-1) === 0 && A.nivelDeSombra(9) === 2 && A.nivelDeSombra(NaN) === 0 && A.nivelDeSombra(undefined) === 0, 'valores raros no se salen de los niveles');
  // la sombra de una antorcha cercana es más oscura que la de una lejana, y los niveles lo reflejan
  const cerca = A.sombraDeAntorcha(2, 1.75), lejos = A.sombraDeAntorcha(10, 1.75);
  ok(A.nivelDeSombra(cerca.alfa) > A.nivelDeSombra(lejos.alfa), `de cerca (alfa ${cerca.alfa.toFixed(2)}) cae en un nivel más oscuro que de lejos (alfa ${lejos.alfa.toFixed(2)})`);

  // el mundo: una antorcha prendida, vos al lado y un duende lejos: dos sombras con opacidades DISTINTAS
  const { crearAmbienteMundo } = await import('../src/desafio-ambiente-mundo.js');
  const escena = new THREE.Scene();
  const T = { altura: () => 0, agua: () => false, lugares: {}, rio: [] };
  const col = { cercanos: () => [] };
  const antorcha = { datos: { x: 0, z: 0 } };
  const duende = (x, z) => ({ estado: 'avanzar', def: { altura: 1.2, radio: 0.4 }, m: { g: { position: { x, y: 0, z }, } , esc: 1 } });
  let duendes = [];
  const amb = crearAmbienteMundo({ T, escena, S: {}, col, defensas: { prendidas: [antorcha] }, musica: {}, sonido: null, aliens: () => duendes, nota() {}, centroBase: () => ({ x: 0, z: 0 }), camara: () => ({ fov: 60 }), lado: () => null, perroPos: () => null });
  const grupo = escena.children.find((o) => o.name === 'sombras-antorcha');
  ok(grupo && grupo.children.length === 3, 'las sombras son un grupo de tres mallas (una por nivel)');
  const mats = grupo.children.map((m) => m.material.opacity);
  ok(new Set(mats).size === 3 && mats[0] < mats[1] && mats[1] < mats[2], `cada nivel tiene su opacidad (${mats.join(', ')})`);
  ok(grupo.children.every((m) => m.material.map === grupo.children[0].material.map && m.material.transparent && m.material.type === 'MeshBasicMaterial'), 'mismo material base (mismo programa de shader), sólo cambia la opacidad');
  const dir = new THREE.Vector3(0, 0, -1);
  // (el cuadro se acota a 0,25 s y las antorchas se vuelven a mirar cada segundo: cinco cuadros)
  const avanzar = (a, ee) => { for (let i = 0; i < 5; i++) a.actualizar(0.25, ee); };
  const e = (js) => ({ activo: true, fase: 'ataque', horas: 0, noche: 1, nocheN: 1, vivos: duendes.length, js, mira: dir, especial: null, sinFin: false, vista: 1, dibujando: true });
  const js = { pos: { x: 3, y: 0, z: 0 }, yaw: 0 };   // a 3 m de la antorcha
  duendes = [duende(11, 0)];                          // y un duende a 11 m
  avanzar(amb, e(js));
  const vis = grupo.children.filter((m) => m.visible && m.count > 0);
  ok(amb.sombrasVivas === 2, `dos sombras vivas (hay ${amb.sombrasVivas})`);
  ok(vis.length === 2, `van a dos mallas distintas (${vis.length})`);
  const op = vis.map((m) => m.material.opacity).sort((a, b) => a - b);
  ok(op[0] < op[1], `con dos opacidades distintas (${op.join(' y ')}): la de la lejana no copia la de la cercana`);
  ok(grupo.visible === true, 'el grupo se ve');
  // la del jugador (cerca) está en un nivel más oscuro que la del duende (lejos)
  const nivelDe = (m) => grupo.children.indexOf(m);
  ok(Math.max(...vis.map(nivelDe)) > Math.min(...vis.map(nivelDe)), 'niveles distintos');
  // sin duendes y de día: nada
  duendes = [];
  avanzar(amb, { ...e(js), noche: 0.1, fase: 'calma' });
  ok(!grupo.visible && grupo.children.every((m) => !m.visible && m.count === 0), 'sin noche, ninguna sombra a la vista');
  // caído: se esconden
  avanzar(amb, e(js));
  ok(grupo.visible, 'otra vez de noche, vuelve a verse');
  amb.actualizar(0.2, { ...e(js), activo: false });
  ok(!grupo.visible && amb.sombrasVivas === 0, 'inactivo: se esconden');
  // 8 sombras repartidas: nunca pasa del tope total
  duendes = Array.from({ length: 12 }, (_, i) => duende(2 + i, 1));
  avanzar(amb, e(js));
  ok(amb.sombrasVivas <= 8, `con 12 duendes hay como mucho 8 sombras (${amb.sombrasVivas})`);
  ok(grupo.children.reduce((s, m) => s + (m.visible ? m.count : 0), 0) === amb.sombrasVivas, 'las mallas suman las sombras vivas');
  amb.limpiar();
  ok(!grupo.visible, 'limpiar las esconde');
}

// ---------------------------------------------------------------- V7: el suelo de las madrigueras sigue el terreno
{
  const PM = await import('../src/desafio-puestos-mundo.js');
  const { mallaMadriguera } = await import('../src/duendes-modelo.js');
  const { puestoNuevo, puestosNuevos } = await import('../src/desafio-puestos.js');
  const { generarTerreno } = await import('../src/terreno.js');
  const MB = (g) => g.children.reduce((s, m) => s + Object.values(m.geometry.attributes).reduce((a, at) => a + at.array.byteLength, 0), 0);
  const verts = (g) => g.children.reduce((s, m) => s + m.geometry.attributes.position.count, 0);

  // la regla: en llano, nada (las geometrías siguen compartidas); en ladera, copia propia con los vértices sobre el terreno
  {
    const llano = mallaMadriguera('suelo'), geoLlano = llano.children.map((m) => m.geometry);
    const r0 = PM.calzarSuelo(llano, () => 5, 10, 10, 5);
    ok(r0.copias === 0 && r0.bytes === 0 && llano.children.every((m, i) => m.geometry === geoLlano[i]), 'en llano el suelo sigue usando la geometría compartida (no cuesta memoria)');
    const suave = mallaMadriguera('suelo');
    ok(PM.calzarSuelo(suave, (x, z) => 0.01 * x, 0, 0, 0).copias === 0, 'con una pendiente de 1 % (7 cm en el borde) tampoco');

    const k = 0.35, alt = (x, z) => k * x + 0.1 * z;
    const ladera = mallaMadriguera('suelo'), compartidas = ladera.children.map((m) => m.geometry);
    const orig = compartidas.map((g) => g.attributes.position.array.slice());
    const r = PM.calzarSuelo(ladera, alt, 0, 0, 0);
    ok(r.copias === ladera.children.length && r.copias >= 2, `en una ladera cada malla del suelo tiene su copia (${r.copias})`);
    ok(ladera.children.every((m, i) => m.geometry !== compartidas[i] && m.geometry.userData.propia === true), 'la copia es otra geometría, marcada como propia');
    ok(ladera.children.every((m, i) => m.geometry.attributes.color === compartidas[i].attributes.color && m.geometry.index === compartidas[i].index), 'el color y los índices se siguen compartiendo');
    ok(compartidas.every((g, i) => g.attributes.position.array.every((v, j) => v === orig[i][j])), 'la geometría compartida no se tocó (los otros puestos siguen igual)');
    // cada vértice quedó a la altura del terreno de su lugar (más lo que ya tenía)
    let peor = 0, n = 0;
    ladera.children.forEach((m, i) => {
      const P = m.geometry.attributes.position;
      for (let v = 0; v < P.count; v++) { peor = Math.max(peor, Math.abs(P.getY(v) - (orig[i][v * 3 + 1] + alt(P.getX(v), P.getZ(v))))); n++; }
    });
    ok(peor < 1e-4, `los ${n} vértices siguen el terreno (error ${peor.toExponential(1)})`);
    // las normales siguen siendo unitarias y se inclinan hacia abajo de la ladera (la pendiente sube con x)
    let unit = true, sumaNx = 0, total = 0;
    for (const m of ladera.children) {
      const N = m.geometry.attributes.normal;
      if (!N) continue;
      const esMonticulo = m === ladera.children[0];   // (el primero es el montículo de tierra: casi todo mira hacia arriba)
      for (let v = 0; v < N.count; v++) {
        if (Math.abs(Math.hypot(N.getX(v), N.getY(v), N.getZ(v)) - 1) > 1e-3) unit = false;
        if (esMonticulo && Math.abs(N.getY(v)) > 0.9) { total++; sumaNx += N.getX(v) * Math.sign(N.getY(v)); }   // (hacia arriba o hacia abajo según el sentido de la malla)
      }
    }
    ok(unit && total > 100 && sumaNx / total < -0.25, `las normales siguen unitarias y las del montículo miran cuesta abajo (x medio ${(sumaNx / total).toFixed(2)} en ${total} vértices; en llano sería 0)`);
    ok(r.bytes > 0 && r.bytes === ladera.children.reduce((s, m) => s + m.geometry.attributes.position.array.byteLength + (m.geometry.attributes.normal?.array.byteLength || 0), 0), 'se informa lo que pesa la copia');
    ok(Number.isFinite(PM.calzarSuelo(mallaMadriguera('suelo'), () => NaN, 0, 0, 0).bytes), 'un terreno roto (NaN) no rompe nada');
    console.log(`  V7: el suelo de un puesto son ${verts(ladera)} vértices; la copia propia pesa ${(r.bytes / 1024).toFixed(0)} KB (la geometría compartida completa pesa ${(MB(llano) / 1024).toFixed(0)} KB y se comparte entre todos los puestos)`);
  }

  // el enganche: un puesto creado en una ladera real usa copia propia, uno en llano comparte, y al salir de la lista se suelta la copia
  {
    const real = generarTerreno();
    // el terreno real casi no tiene llanos de 14 m (el mejor se aparta 14 cm): para el puesto del llano, un pedazo plano pegado encima
    const LL = { x: 40, z: 40 };
    const T = { ...real, altura: (x, z) => (Math.hypot(x - LL.x, z - LL.z) < 30 ? 7 : real.altura(x, z)), agua: (x, z) => real.agua(x, z) };
    const desnivel = (x, z) => { let m = 0; const y = T.altura(x, z); for (let a = 0; a < 8; a++) m = Math.max(m, Math.abs(T.altura(x + Math.cos(a * 0.785) * 7, z + Math.sin(a * 0.785) * 7) - y)); return m; };
    // busca en el terreno real un sitio de ladera (a 7 m del centro se aparta entre 1,5 y 3,5 m)
    const llano = { ...LL, d: desnivel(LL.x, LL.z) };
    let ladera = null;
    for (let x = -300; x <= 300 && !ladera; x += 17) for (let z = -300; z <= 300; z += 17) {
      if (real.agua(x, z) || real.altura(x, z) < 1 || Math.hypot(x - LL.x, z - LL.z) < 60) continue;
      const d = desnivel(x, z);
      if (d > 1.5 && d < 3.5) { ladera = { x, z, d }; break; }
    }
    ok(llano.d === 0 && ladera, 'hay un sitio llano (el pedazo plano) y uno de ladera en el terreno real');
    const escena = new THREE.Scene();
    const est = puestosNuevos();
    const p1 = puestoNuevo(1, llano, 3, () => 0.5, null), p2 = puestoNuevo(2, ladera, 3, () => 0.5, null);
    est.lista.push(p1, p2);
    const D = { puestos: est };
    const api = { D: () => D, rumboTexto: () => 'al norte', centroBase: () => ({ x: 0, z: 0 }), nota() {}, guardar() {} };
    const pm = crearPuestosMundoDe(PM, T, escena, api);
    pm.sincronizar();
    const grupos = escena.children.filter((o) => o.name === 'puesto-invasor');
    ok(grupos.length === 2, 'se arman las dos madrigueras');
    const geos = (g) => g.children[0].children.map((m) => m.geometry);
    const gLlano = geos(grupos[0]), gLadera = geos(grupos[1]);
    ok(gLlano.every((g) => !g.userData.propia) && gLadera.every((g) => g.userData.propia), `el puesto del llano (desnivel ${llano.d.toFixed(2)} m) comparte; el de la ladera (${ladera.d.toFixed(2)} m) tiene copia propia`);
    // los vértices del puesto de la ladera quedan sobre el terreno real (a lo sumo lo que sobresalen el montículo y los lomos de las raíces); con la geometría compartida se iban a metros
    {
      const desvio = (grupoPuesto, geoDe) => {
        let peor = 0;
        const base = grupoPuesto.position.y + grupoPuesto.children[0].position.y;
        grupoPuesto.children[0].children.forEach((m, i) => {
          const P = geoDe(m, i).attributes.position;
          for (let v = 0; v < P.count; v++) peor = Math.max(peor, Math.abs(base + P.getY(v) - T.altura(ladera.x + P.getX(v), ladera.z + P.getZ(v))));
        });
        return peor;
      };
      const compartida = mallaMadriguera('suelo');
      const conCopia = desvio(grupos[1], (m) => m.geometry), sinCopia = desvio(grupos[1], (m, i) => compartida.children[i].geometry);
      ok(conCopia < 0.6, `el suelo de la madriguera de la ladera nunca se aleja del terreno más de 0,6 m (${conCopia.toFixed(2)})`);
      ok(sinCopia > 1.0, `(con la geometría compartida de antes se alejaba ${sinCopia.toFixed(2)} m: la prueba discrimina)`);
    }
    // al salir de la lista (rotos viejos) la copia se suelta
    let soltadas = 0;
    for (const g of gLadera) g.addEventListener('dispose', () => soltadas++);
    est.lista.length = 0; est.lista.push(p1);
    pm.sincronizar();
    ok(soltadas === gLadera.length, `al salir el puesto de la lista se sueltan sus copias (${soltadas})`);
    ok(!gLlano.some((g) => g.userData.propia) && grupos[0].visible !== undefined, 'y la compartida queda');
    const sinPuestos = escena.children.filter((o) => o.name === 'puesto-invasor').length;
    ok(sinPuestos === 1, 'la madriguera sale de la escena');
  }
}
function crearPuestosMundoDe(PM, T, escena, api) {
  return PM.crearPuestosMundo(T, escena, { chispas() {}, sangre() {}, explosion() {}, polvo() {} }, { golpeRuido() {}, fuente: () => null, bus: {} }, api);
}

// ---------------------------------------------------------------- V13: los postes del tablero de trofeos llegan al suelo
{
  const medir = (k, rot = 0) => {
    const w = mundo({ altura: (x, z) => k * x });
    const r = w.terminar('tablero-trofeos', 0, 0, rot);
    assert.ok(r.ok, `se arma el tablero en una ladera de ${k}`);
    const g = r.o.malla.geometry; g.computeBoundingBox();
    return { minY: g.boundingBox.min.y, verts: g.attributes.position.count };
  };
  const llano = medir(0);
  ok(Math.abs(llano.minY) < 0.01, `en llano los postes arrancan en el pie (${llano.minY.toFixed(3)})`);
  for (const k of [0.15, 0.25, 0.3]) {
    const m = medir(k), baja = k * 1.64;   // el poste de abajo está en x = -1,58 (y su huella llega a -1,64)
    ok(m.minY <= -baja + 1e-3, `ladera lateral de ${k}: el poste de abajo llega al suelo (baja ${(-m.minY).toFixed(2)} m; el terreno está ${baja.toFixed(2)} m más abajo)`);
    ok(m.minY >= -baja - 0.35, `y no se pasa de largo (${(-m.minY).toFixed(2)} m)`);
    ok(m.verts > llano.verts && m.verts - llano.verts <= 48, `sólo se suma un poste (una caja: ${m.verts - llano.verts} vértices más)`);
  }
  // una ladera de frente (a lo largo de z) afecta a los dos postes por igual (se arman en z = 0): nada que calzar
  { const w = mundo({ altura: (x, z) => 0.2 * z }); const r = w.terminar('tablero-trofeos', 0, 0, 0); ok(r.ok, 'se arma en una ladera de frente'); const g = r.o.malla.geometry; g.computeBoundingBox(); ok(g.boundingBox.min.y > -0.12, 'en una ladera de frente los postes (de 14 cm de fondo) no necesitan alargarse'); }
  // la regla pura
  const F = await import('../src/desafio-trofeos-formas.js');
  ok(F.alturaDelPoste(null, -1.58) === 0 && F.alturaDelPoste(() => 0, 1) === 0 && F.alturaDelPoste(() => 0.5, 1) === 0, 'sin suelo, en llano o con el suelo más arriba: nada');
  ok(Math.abs(F.alturaDelPoste((x) => 0.2 * x, -1.58) - 0.2 * 1.64) < 1e-9, 'con suelo más abajo: lo más bajo de la huella del poste');
  ok(F.alturaDelPoste(() => NaN, 1) === 0, 'un terreno roto no rompe el tablero');
}

console.log(`verificar-4-11-2-mundo: ${pasos} pasos ok`);
