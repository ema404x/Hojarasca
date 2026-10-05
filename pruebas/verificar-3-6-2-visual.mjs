// 3.6.2 (visual): lo que quedó pendiente de la 3.6.0 y la 3.6.1 en lo visual.
//  · no llueve debajo de las galerías ni de los aleros (con el jugador afuera): cada techo del juego
//    es una cubierta (techo-lluvia.js) y las gotas que llegan a una se cortan ahí; cuesta centésimas de ms;
//  · los álamos cambian de LOD en un anillo (cada uno a su distancia, como el bosque) y la versión
//    barata tiene la misma silueta angosta (antes era más ancha y petisa: se notaba el cambio a 70 m);
//  · el rótulo «RAMOS GENERALES» del almacén va delante del techo (lo cruzaban las vigas del testero);
//  · la red de la pescadería es una pieza que se mece mientras el pescador trabaja.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(raiz, 'src');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- las cubiertas (puro)
const L = await import(pathToFileURL(path.join(src, 'techo-lluvia.js')).href);
{
  // una galería de 4 × 2 m girada 30°, con el techo a 2,6 m junto a la pared y 2,3 m afuera (cae hacia +z)
  const g = L.cubierta({ x: 10, z: 20 }, Math.PI / 6, -2, 2, 0, 2, 2.6, { az: -0.15 });
  const aMundo = (lx, lz) => ({ x: 10 + lx * Math.cos(Math.PI / 6) + lz * Math.sin(Math.PI / 6), z: 20 - lx * Math.sin(Math.PI / 6) + lz * Math.cos(Math.PI / 6) });
  const p = aMundo(0.5, 1), afuera = aMundo(0.5, 2.6);
  ok(Math.abs(L.techoDeCubierta(g, p.x, p.z) - 2.45) < 1e-9, 'la altura del techo de una cubierta (una agua) en un punto');
  ok(L.techoDeCubierta(g, afuera.x, afuera.z) === null, 'afuera de la cubierta, nada');
  const dos = L.cubierta({ x: 0, z: 0 }, 0, -3, 3, -2, 2, 4, { ab: -0.5 });
  ok(Math.abs(L.techoDeCubierta(dos, 2, 0) - 3) < 1e-9 && Math.abs(L.techoDeCubierta(dos, -2, 1) - 3) < 1e-9, 'a dos aguas: baja igual a los dos lados de la cumbrera');
  const M = L.crearMapaCubiertas();
  M.rehacer(12, 18, [g, dos, null, { x: NaN }]);
  ok(M.hay && M.cubiertas === 2, 'el mapa toma las cubiertas que tocan la grilla (y descarta las rotas)');
  ok(M.tapa(p.x, 1.2, p.z) && !M.tapa(p.x, 2.9, p.z), 'una gota abajo de la galería se corta; arriba del techo sigue');
  ok(!M.tapa(afuera.x, 0.5, afuera.z), 'afuera de la galería llueve');
  ok(!M.tapa(1000, 0, 1000) && M.techo(1000, 1000) === null, 'lejos de la grilla, nada');
  ok(!M.lejos(15, 20) && M.lejos(30, 18), 'se rehace al alejarse la cámara 10 m');
  // el borde: a una celda (0,5 m) de la galería ya llueve
  const borde = aMundo(0.5, 2.7);
  ok(!M.tapa(borde.x, 0.5, borde.z), 'el borde es fino (celdas de medio metro)');
  // el costo: 3.200 gotas por cuadro (y el mapa de una aldea entera, que se rehace cada 10 m)
  const lista = [];
  for (let i = 0; i < 40; i++) lista.push(L.cubierta({ x: (i % 8) * 11 - 40, z: Math.floor(i / 8) * 13 - 30 }, i * 0.4, -4, 4, -3, 5, 3, { az: -0.1 }));
  let t0 = performance.now();
  for (let k = 0; k < 20; k++) M.rehacer(k * 0.1, 0, lista);
  const msRehacer = (performance.now() - t0) / 20;
  const gotas = Float32Array.from({ length: 9600 }, (_, i) => (i % 3 === 1 ? Math.random() * 6 : (Math.random() - 0.5) * 72));
  // (todas a menos de 6 m del suelo, a la altura de los techos: el peor caso; en el juego la mayoría va
  // más arriba que cualquier techo y ni se mira). Primero se calienta el JIT; después, el mejor de 5 tandas.
  let n = 0, msCuadro = Infinity;
  for (let k = 0; k < 100; k++) for (let i = 0; i < 9600; i += 3) M.tapa(gotas[i], gotas[i + 1], gotas[i + 2]);
  for (let tanda = 0; tanda < 5; tanda++) {
    t0 = performance.now(); n = 0;
    for (let k = 0; k < 100; k++) for (let i = 0; i < 9600; i += 3) if (M.tapa(gotas[i], gotas[i + 1], gotas[i + 2])) n++;
    msCuadro = Math.min(msCuadro, (performance.now() - t0) / 100);
  }
  ok(n > 0 && msCuadro < 0.1, `3.200 gotas por cuadro: ${msCuadro.toFixed(4)} ms (tope 0,1 ms)`);
  ok(msRehacer < 3, `el mapa con 40 techos se arma en ${msRehacer.toFixed(2)} ms (cada 10 m, sólo con lluvia)`);
  console.log(`  costo: ${msCuadro.toFixed(4)} ms por cuadro, ${msRehacer.toFixed(2)} ms al rehacer`);
}

// ---------------------------------------------------------------- la lluvia y quién aporta techos
{
  const clima = leer('src/clima.js');
  ok(/const techos = mundo\.techos && mundo\.techos\.hay \? mundo\.techos : null;/.test(clima)
    && clima.includes('(techos && techos.tapa(x - inc, y - 0.55, z - inc * 0.3))'), 'clima.js: la gota que llega a un techo vuelve a salir de arriba');
  const main = leer('src/main.js');
  ok(main.includes('const mapaLluvia = crearMapaCubiertas();') && /function revisarMapaLluvia\(cam, dt\)/.test(main), 'main.js: el mapa de techos de alrededor');
  ok(main.includes("...(est?.cubiertas || [])") && main.includes('p.cubiertas') && main.includes('aldeaMundo.cubiertas()') && main.includes('obras.cubiertasLluvia(cam, 70)'), 'los techos del valle, las estaciones, la aldea y tus obras');
  ok(/if \(clima\.estado\.lluvia > 0\.05 && U\.uInvierno\.value <= 0\.5 && !bajoTecho\) \{ try \{ revisarMapaLluvia/.test(main), 'sólo mientras llueve (y con el jugador afuera)');
  const est = leer('src/estructuras.js');
  ok((est.match(/cubre: \{ sitio/g) || []).length >= 5, 'estructuras.js: el refugio, las cabañas, la casa de té, el almacén y el galpón');
  ok((est.match(/cubiertas\.push\(cubierta\(/g) || []).length >= 4, 'y la galería de las cabañas, los aleros de la casa de té y del almacén y el cobertizo del galpón');
  ok(/return \{ grupo, conjuntos, sentaderos, carteles, mat, cabañas, cubiertas,/.test(est), 'estructuras.js las devuelve');
  const tr = leer('src/trochita.js');
  ok(/cubiertas: \[\n\s+cubierta\(p, rot,/.test(tr), 'trochita.js: el galpón y el alero del andén de cada parada');
  const con = leer('src/construccion.js');
  ok(/function cubiertasLluvia\(pos, radio = 70\)/.test(con) && con.includes("P.snap?.tipo === 'techo'") && con.includes('P.cubreArea'), 'construccion.js: los techos de tus obras (galerías, invernaderos, módulos, refugios)');
  const am = leer('src/aldea-mundo.js');
  ok(/function cubiertas\(\)/.test(am) && am.includes('cubiertasHechas = null; versionCubiertas++;'), 'aldea-mundo.js: los techos de la aldea, rehechos cuando cambia un edificio');
}

// ---------------------------------------------------------------- la arquitectura de la aldea, en una VM
const idModulo = (f) => '__mod_' + path.basename(f, '.js').replace(/[^A-Za-z0-9_$]/g, '_');
const normalizar = (desde, spec) => path.resolve(path.dirname(desde), spec);
const info = new Map(), orden = [], visto = new Set();
const visitar = (f) => {
  f = path.resolve(f);
  if (visto.has(f)) return;
  visto.add(f);
  const texto = fs.readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/^import\s+(.+?)\s+from\s+['"](.+?)['"]\s*;\s*$/gm)) if (m[2] !== 'three') visitar(normalizar(f, m[2]));
  info.set(f, texto); orden.push(f);
};
visitar(path.join(src, 'aldea-arquitectura.js'));
const transformar = (f, t) => {
  const ex = [...t.matchAll(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  t = t.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]\s*;\s*$/gm, '');
  t = t.replace(/^import\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]\s*;\s*$/gm, (_x, n, spec) =>
    `const { ${n.split(',').map((x) => x.trim()).filter(Boolean).join(', ')} } = ${idModulo(normalizar(f, spec))};`);
  t = t.replace(/^export\s+(?=(?:const|let|var|function|class)\b)/gm, '');
  return `const ${idModulo(f)}=(()=>{\n${t}\nreturn {${[...new Set(ex)].join(',')}};\n})();\n`;
};
let code = fs.readFileSync(path.join(raiz, 'three-r186-inline.js'), 'utf8') + '\n';
for (const f of orden) code += transformar(f, info.get(f)) + '\n';
code += '\n;globalThis.__A = __mod_aldea_arquitectura;';
const ctx = { console, Math, Date, JSON, Array, Object, Number, String, Map, Set, Float32Array, Uint16Array, Uint32Array, Int32Array, Uint8Array, Error, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'aldea-arquitectura-vm.js' });
const A = ctx.__A;

// las galerías de la aldea: el cuerpo y la galería, con su altura
{
  const ed = A.armarEdificio('casa-jefe', 4);
  const cs = ed.techo?.cubiertas || [];
  ok(cs.length === 2, 'casa del jefe: el techo del cuerpo y el de la galería');
  const gal = cs[1], s = { x: 0, z: 0, rot: 0 };
  const c = L.cubierta(s, 0, gal.x0, gal.x1, gal.z0, gal.z1, gal.y, { az: gal.az });
  const zm = (gal.z0 + gal.z1) / 2, h = L.techoDeCubierta(c, 0, zm);
  ok(h > 2.2 && h < 3.4 && gal.z1 > ed.fondo / 2 + 1, `la galería cubre ${(gal.z1 - gal.z0).toFixed(1)} m al frente, con el techo a ${h.toFixed(2)} m`);
  ok(A.armarEdificio('panaderia', 2).techo == null && (A.armarEdificio('escuela', 3).techo?.cubiertas || []).length === 1, 'sin techo, nada; con la galería sin terminar, sólo el cuerpo');
}
// el álamo lejano: la misma silueta (alto y ancho) que el de cerca, y barato
{
  const ac = A.armarAccesorio('alamo', { semilla: 3 });
  // (las cartas se abren en el shader, de frente a la cámara: cada esquina se corre aCarta.xy en el plano de
  // la vista; el ancho de la silueta es lo más afuera del eje más ese corrimiento, y el alto lo mismo)
  const silueta = (g) => {
    const p = g.attributes.position, k = g.attributes.aCarta;
    let ancho = 0, alto = 0;
    for (let i = 0; i < p.count; i++) {
      const ox = k ? Math.abs(k.getX(i)) : 0, oy = k ? k.getY(i) : 0;
      ancho = Math.max(ancho, Math.hypot(p.getX(i), p.getZ(i)) + ox);
      alto = Math.max(alto, p.getY(i) + oy);
    }
    return { ancho: ancho * 2, alto };
  };
  const sc = silueta(ac.exterior.follaje), sl = silueta(ac.lod.follaje);
  const anchoC = sc.ancho, anchoL = sl.ancho, altoC = sc.alto, altoL = sl.alto;
  ok(anchoL <= anchoC * 1.05, `el álamo lejano no es más ancho que el de cerca (${anchoL.toFixed(2)} contra ${anchoC.toFixed(2)} m)`);
  ok(Math.abs(altoL - altoC) < 1.2, `ni más petiso (${altoL.toFixed(1)} contra ${altoC.toFixed(1)} m)`);
  const tris = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
  const cartas = ac.lod.follaje.attributes.aCarta;
  let n = 0;
  for (let i = 0; i < cartas.count; i++) if (Math.abs(cartas.getX(i)) + Math.abs(cartas.getY(i)) > 1e-6) n++;
  ok(n / 6 >= 50 && tris(ac.lod.estructura) + tris(ac.lod.follaje) < 200, `y barato: ${n / 6} cartas, ${tris(ac.lod.estructura) + tris(ac.lod.follaje)} triángulos`);
  const t = leer('src/aldea-arquitectura.js');
  ok(t.includes('cartas: 60, tamCarta: 1.6, afuera: [0.3, 0.72]'), 'cartas más chicas y hacia adentro');
}
// el anillo del LOD de los álamos (el truco del bosque), sin dibujos ni programas nuevos
{
  const am = leer('src/aldea-mundo.js');
  ok(/export const ALAMO_LOD = 70, ALAMO_BANDA = 10;/.test(am), 'el LOD de los álamos a 70 m, con un anillo de ±10 m');
  ok(am.includes('alamoCerca: alamo(1), alamoLejos: alamo(2)') && am.includes("prepararFollajeAldea(materialVegetal({ flex: 1, copa: true, lod: lodAlamo(modo) }), { cartas: follaje.userData.cartas })"), 'cerca y lejos con los uniformes del LOD del bosque (los mismos programas)');
  ok(am.includes('c = (d2 < r1 ? 1 : 0) | (d2 > r0 ? 2 : 0)') && am.includes('if (cerca[i] & 1)') && am.includes('if (cerca[i] & 2)'), 'en el anillo cada álamo va en las dos mallas: el shader elige uno');
  ok(/crear\(proto\.exterior\.estructura, mce\), crear\(proto\.exterior\.follaje, mcf\)/.test(am) && /crear\(proto\.lod\?\.estructura, mle\), crear\(proto\.lod\?\.follaje, mlf\)/.test(am), 'siguen siendo cuatro mallas instanciadas');
  const mat = leer('src/materiales.js');
  ok(mat.includes('float mascaraLod = hash12(floor(vRaizVeg * 4.0) + 17.0);'), 'el umbral por árbol del shader del bosque');
}
// el rótulo del almacén delante del techo
{
  const est = leer('src/estructuras.js');
  const D = 5.5, vueloZ = Number(/alzada: 1\.3, vueloX: 0\.52, vueloZ: ([\d.]+),/.exec(est)?.[1]);
  const zF = Number(/const zFronton = -D \/ 2 - ([\d.]+);/.exec(est)?.[1]);
  ok(Number.isFinite(vueloZ) && Number.isFinite(zF), 'el frontón y el techo del almacén');
  const frenteTecho = -(D / 2 + vueloZ) - 0.06;   // el testero: la punta de la cumbrera (los remates, 1 cm menos)
  const atrasFronton = -D / 2 - zF + 0.11;
  ok(atrasFronton < frenteTecho, `el frontón (desde ${atrasFronton.toFixed(2)} m) queda delante del testero del techo (${frenteTecho.toFixed(2)} m): las vigas no cruzan el rótulo`);
  ok(est.includes('rotulo.position.set(0, H + 1.05, zFronton - 0.185);') && est.includes("caja(c, [0, H + 1.05, zFronton - 0.14], [W - 0.4, 0.9, 0.06], '#3f5a52');"), 'el rótulo y la tabla verde van con el frontón');
}
// la red de la pescadería
{
  const ed = A.armarEdificio('pescaderia', 4);
  const red = ed.animables.find((a) => a.id === 'redes');
  ok(red && red.geometria.attributes.position.count > 0 && red.eje.join() === '0,0,1' && red.pivote.ly > 1.6, 'la pescadería: la red es una pieza animable colgada de su vara');
  const b = (red.geometria.computeBoundingBox(), red.geometria.boundingBox);
  ok(b.max.y <= 0.05 && b.min.y < -0.6, 'cuelga por debajo del pivote (gira sobre la vara)');
  const m = leer('src/aldea-mecanicas.js'), mm = leer('src/aldea-mecanicas-mundo.js');
  ok(m.includes("pescaderia: { quien: 'pescador', piezas: ['redes']"), 'el gesto del pescador: la red');
  ok(mm.includes("anim.redes = preparar(todas.find((a) => a.id === 'redes'));") && mm.includes('const viento = g.pescaderia ? (ctx.ambiente?.()?.viento ?? 0.4) : 0;'), 'se mece con el viento mientras el pescador trabaja');
}

// lo barato de la medición: las mallas instanciadas vacías no se mandan a la placa
{
  const main = leer('src/main.js');
  ok(/if \(o\.isInstancedMesh && o\.visible && o\.count === 0\) \{ o\.visible = false; vaciasApagadas\.push\(o\); \}/.test(main), 'las instanciadas sin instancias se apagan mientras se dibuja el cuadro');
  ok(/function dibujar\(luz, noche\) \{\n  apagarVacias\(\);\n  try \{ dibujarCuadro\(luz, noche\); \} finally \{ prenderVacias\(\); \}/.test(main), 'y se vuelven a prender después (aunque falle el dibujo)');
}

console.log(`verificar-3-6-2-visual: ${pasos} comprobaciones en verde`);
