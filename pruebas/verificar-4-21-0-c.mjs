// 4.21.0 (C): luz y atmósfera. Sólo valores, colores y geometría: 0 programas de shader nuevos, 0 capas de pantalla completa, sin llamadas de dibujo nuevas en la plaza.
//
// 1. Las ventanas de las casas armadas se encienden de noche (`ventanasDeCasa`, casa-viva.js): la pose sale de la misma cuenta con la que `planos-casas.js` arma su
//    vidrio (se contrasta con la geometría real de una casa); adentro de la casa no se encienden; la casilla (que no usa la fábrica) tiene la suya. Un solo dibujo de
//    vidrios (el InstancedMesh de siempre, con lugar de sobra) y el halo de las ventanas del valle.
// 2. Los valores de la noche de exterior (cielo.js), las luciérnagas (clima.js, tamaño y cantidad), la lluvia (gota, cielo, niebla, color apagado) y el contraste del día.
// 3. Las reglas del presupuesto: la cuenta de programas de shader del código no sube (18 como en la 4.20.0), los puntos de clima siguen siendo los mismos dibujos, el
//    postproceso no suma pasadas, el cielo no suma mallas y los vidrios de las casas no suman objetos nuevos a la escena.
// Cada mutación es una copia del archivo con otro nombre (sin la caché de ESM, un proceso por copia) y tiene que hacer fallar su comprobación.
//
// Uso: node pruebas/verificar-4-21-0-c.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallas = 0, total = 0;
const ok = (c, t) => { total++; if (c) console.log('✓ ' + t); else { fallas++; console.log('✗ ' + t); } };
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const casi = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// ---------------------------------------------------------------- modo hijo: una copia mutada de casa-viva.js corre la comprobación y dice 1 o 0
if (process.argv[2] === '--hijo') {
  const CV = await import(pathToFileURL(process.argv[3]).href);
  const casa = { plano: 'casa-galeria', x: 100, y: 5, z: -40, rot: 0 };
  const plano = { ancho: 7.8, fondo: 5.6, ventanas: [{ orient: 'z', s: -1, cx: -2.2, cz: -2.8 }, { orient: 'x', s: -1, cx: -3.9, cz: 0 }] };
  const v = CV.ventanasDeCasa(casa, plano, null);
  const alto = CV.ventanasDeCasa(casa, { ...plano, ventanas: [{ orient: 'z', s: -1, cx: 0, cz: -2.8, dy: 2.3 }] }, null);
  const girada = { ...casa, rot: 0.5 };   // 3 m al este y 2 m al sur del centro: con la casa girada 0,5 rad, afuera (por el fondo); con la cuenta al revés, adentro
  const bien = v.length === 2 && alto.length === 1 && casi(alto[0].y, 5 + 1.62 + 2.3)
    && CV.ventanasDeCasa(girada, plano, { x: 103, z: -38 }).length === 2
    && CV.ventanasDeCasa(girada, plano, { x: 100 + 3.5 * Math.cos(0.5), z: -40 - 3.5 * Math.sin(0.5) }).length === 0
    && v.length === 2
    && casi(v[0].x, 100 - 2.2) && casi(v[0].y, 5 + 1.62) && casi(v[0].z, -40 - 2.8 - 0.09) && casi(v[0].rot, 0)
    && casi(v[1].x, 100 - 3.9 - 0.09) && casi(v[1].z, -40) && casi(v[1].rot, Math.PI / 2)
    && CV.ventanasDeCasa(casa, plano, { x: 100, z: -40 }).length === 0
    && CV.ventanasDeCasa(casa, plano, { x: 130, z: -40 }).length === 2;
  console.log(bien ? '1' : '0');
  process.exit(0);
}

const cv = await import(pathToFileURL(path.join(raiz, 'src/casa-viva.js')).href);

// ---------------------------------------------------------------- 1. las ventanas de las casas armadas
{
  const obra = { plano: 'casa-galeria', x: 100, y: 5, z: -40, rot: 0 };
  const plano = { ancho: 7.8, fondo: 5.6, ventanas: [{ orient: 'z', s: -1, cx: -2.2, cz: -2.8 }, { orient: 'x', s: -1, cx: -3.9, cz: 0 }] };
  const v = cv.ventanasDeCasa(obra, plano, null);
  ok(v.length === 2, 'cada ventana de la casa da un vidrio encendido');
  ok(casi(v[0].y, 5 + 1.62) && casi(v[0].x, 97.8) && casi(v[0].z, -40 - 2.8 - 0.09), 'la ventana del frente queda 9 cm afuera de la pared, a 1,62 m del pie');
  ok(casi(v[1].x, 100 - 3.9 - 0.09) && casi(v[1].rot, Math.PI / 2), 'la ventana del costado gira un cuarto de vuelta (su pared corre por z)');
  const girada = cv.ventanasDeCasa({ ...obra, rot: Math.PI / 2 }, plano, null);
  ok(casi(girada[0].x, 100 + (-2.8 - 0.09)) && casi(girada[0].z, -40 + 2.2) && casi(girada[0].rot, Math.PI / 2), 'con la casa girada, la ventana gira con ella');
  const gruesa = cv.ventanasDeCasa(obra, { ...plano, ventanas: [{ orient: 'z', s: -1, cx: 0, cz: -2.8, t: 0.42, dy: 2.3 }] }, null);
  ok(casi(gruesa[0].z, -40 - 2.8 - 0.09 - 0.16) && casi(gruesa[0].y, 5 + 1.62 + 2.3), 'la pared gruesa de piedra corre el vidrio y el piso de arriba lo sube (`t` y `dy`)');
  ok(cv.ventanasDeCasa(obra, plano, { x: 100, z: -40 }).length === 0, 'adentro de la casa las ventanas no se encienden (se vería un vidrio anaranjado tapando la noche)');
  ok(cv.ventanasDeCasa(obra, plano, { x: 112, z: -40 }).length === 2, 'afuera sí');
  ok(cv.ventanasDeCasa({ plano: 'sin-ventanas', x: 0, y: 0, z: 0 }, { ancho: 3, fondo: 3 }, null).length === 0, 'una obra sin ventanas no inventa luz');
  const cas = cv.ventanasDeCasa({ plano: 'casilla', x: 10, y: 2, z: 10, rot: 0 }, { ancho: 4.4, fondo: 3.6 }, null);
  ok(cas.length === 1 && casi(cas[0].x, 12.29) && casi(cas[0].y, 3.58) && casi(cas[0].z, 10.45) && casi(cas[0].rot, Math.PI / 2), 'la casilla (que no usa la fábrica de casas) tiene su ventana del lado +x');

  // la misma cuenta que la geometría real: el centro de la ventana de la fábrica de casas cae donde esta función pone el vidrio
  const casas = leer('src/planos-casas.js');
  ok(/const yc = 1\.62 \+ \(v\.dy \|\| 0\), wv = 0\.95, hv = 0\.9;/.test(casas) && /parte\(0, yc, 0\.06, wv, hv, 0\.035, VIDRIO/.test(casas), 'planos-casas.js sigue armando el vidrio a 1,62 m, 0,95 × 0,90 m y a 6 cm de la pared (lo que esta cuenta supone)');
  ok(cv.VENTANA_CASA.y === 1.62 && cv.VENTANA_CASA.ancho === 0.95 && cv.VENTANA_CASA.alto === 0.9 && cv.VENTANA_CASA.fuera > 0.06 + 0.0175, 'el vidrio encendido queda más afuera que la cara de afuera del vidrio (6 cm + 1,75 cm)');
  ok(/if \(!luces\.length\)|if \(luces\.length\)/.test(leer('src/main.js')) && cv.ventanasEncendidas([{ plano: 'pared-ventana', x: 0, y: 0, z: 0, rot: 0 }], []).length === 0, 'las paredes modulares siguen encendiéndose sólo con una luz cerca (no se tocó)');

  const main = leer('src/main.js');
  ok(/for \(const o of obras\.obras\) \{ if \(o === obras\.editando \|\| !obraTerminada\(o\)\) continue; for \(const v of ventanasDeCasa\(lugarObra\(o\), o\.plano, jugador\.estado\.pos\)\) lista\.push\(v\); \}/.test(main), 'main.js suma las ventanas de las casas terminadas (menos la que estás moviendo) a la lista de las encendidas');
  ok(/if \(brillo > 0\) \{[\s\S]{0,700}ventanasDeCasa\(/.test(main), '… y sólo de noche (cuando el brillo de las ventanas es mayor que 0)');
  ok(/halosValle\.fijar\('casas', lista\.map/.test(main), 'cada ventana encendida lleva su halo del valle (la lista es la misma)');
  const vm = leer('src/ventanas-mundo.js');
  ok(/crearVentanas\(escena, max = 128\)/.test(vm) && (vm.match(/new THREE\.InstancedMesh/g) || []).length === 1 && (vm.match(/new THREE\./g) || []).length <= 8, 'los vidrios siguen siendo un solo InstancedMesh (una llamada de dibujo) y con lugar para 128 ventanas');
}

// ---------------------------------------------------------------- 2. los valores de la luz y la atmósfera
const cielo = leer('src/cielo.js'), clima = leer('src/clima.js'), post = leer('src/postproceso.js');
{
  ok(/const AMBIENTE_NOCHE = C\('#34426a'\);/.test(cielo), 'el ambiente de la noche sube a #34426a (era #2c3752)');
  ok(/LUZ_LUNA = C\('#9bb6f0'\)/.test(cielo), 'la luz de la luna, azul plateada: #9bb6f0 (era #8aa2d6)');
  ok(/intensidad = 0\.98 \* smoothstep\(-0\.02, 0\.2, -solDir\.y\)/.test(cielo), 'la luna alumbra 0,98 (era 0,7): las casas y el suelo se leen');
  ok(/hemi\.intensity = 0\.9 \+ 0\.7 \* dia \+ 0\.4 \* lunaK \* \(1 - dia\)/.test(cielo), 'el ambiente: de noche 0,9 (era 0,78), de día 1,6 (era 1,73)');
  ok(/intensidad = 3\.6 \* smoothstep\(-0\.04, 0\.22, solDir\.y\) \* \(1 - nub \* 0\.8\)/.test(cielo), 'el sol: 3,6 (era 3,4) y con cielo cubierto se tapa más (0,8; era 0,72)');
  // el contraste del día: sol sobre ambiente de mediodía, antes y ahora (con la altura del sol del juego)
  const antes = (3.4 * 0.92) / 1.73, ahora = (3.6 * 0.92) / 1.6;
  ok(ahora / antes > 1.1, `el cociente sol/ambiente del mediodía sube ${(100 * (ahora / antes - 1)).toFixed(0)} % (más sombra en el follaje, la misma luz total)`);
  ok(casi(3.6 * 0.92 + 1.6 * 0.85, 3.4 * 0.92 + 1.73 * 0.85, 0.35), 'la luz total del mediodía queda igual (±0,35): el contraste sube sin cambiar la exposición');
  ok(/cenit\.lerp\(tmp, nub \* 0\.86\);/.test(cielo) && /horiz\.lerp\(tmp, nub \* 0\.78\);/.test(cielo), 'con lluvia el cielo se va más al gris (0,86 y 0,78; eran 0,75 y 0,65)');
  ok(/clima\.lluvia \* 0\.0040/.test(cielo), 'la lluvia espesa la niebla: 0,0040 por unidad de lluvia (era 0,0028)');
  ok(/c = mix\(vec3\(luma\), c, 1\.06 - uNoche \* 0\.06 - uHumedad \* 0\.18\);/.test(post), 'con lluvia los colores se apagan un 18 % (el postproceso usa la humedad que ya recibía)');

  ok(/const NLUCI = 240, TAM_LUCI = 0\.3;/.test(clima), 'luciérnagas: 240 puntos de 0,3 (eran 160 de 0,9)');
  ok(/crearNube\(NLUCI, puntosMaterial\(\{ color: '#f0ffa8', tam: TAM_LUCI, aditivo: true, forma: 'brillo' \}\), 40, 3\)/.test(clima) && /uTam\.value = TAM_LUCI;/.test(clima) && !/uTam\.value = 0\.9/.test(clima), 'el tamaño de las luciérnagas se fija en un solo lugar, también el que se repone en cada cuadro');
  ok(/for \(let i = 0; i < NLUCI; i\+\+\)/.test(clima), 'el movimiento recorre las 240');
  // el tamaño en pantalla de una luciérnaga a 3 m con el tamaño viejo y el nuevo: gl_PointSize = uTam * (0,6 + az * 0,8) * 300 / distancia
  const px = (tam, d) => tam * 1.0 * 300 / d;
  ok(px(0.3, 3) < 35 && px(0.9, 3) > 80, `a 3 m una luciérnaga mide ${px(0.3, 3).toFixed(0)} px (antes ${px(0.9, 3).toFixed(0)}: el halo del tamaño de una cabeza)`);
  ok(/LARGO_GOTA = 0\.9/.test(clima) && /mLluvia\.opacity = 0\.5 \* precip;/.test(clima) && !/y - 0\.55/.test(clima), 'la gota mide 0,9 m y tiene opacidad 0,5 (era 0,55 m y 0,35), también en el reciclado y en el corte bajo techo');
}

// ---------------------------------------------------------------- 3. las reglas del presupuesto
{
  let cuentaShader = 0;
  const recorrer = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) recorrer(p); else if (e.name.endsWith('.js') && !e.name.startsWith('ultra'))   /* 4.28.0: lo de Ultra (src/ultra*.js) sí puede traer shaders y destinos nuevos */ cuentaShader += (fs.readFileSync(p, 'utf8').match(/new THREE\.(Raw)?ShaderMaterial\(/g) || []).length; } };
  recorrer(path.join(raiz, 'src'));
  ok(cuentaShader === 18, `programas de shader: ${cuentaShader} construcciones de ShaderMaterial en el código (18 como en la 4.20.0: ninguna nueva)`);
  ok((clima.match(/crearNube\(/g) || []).length === 6, 'clima.js arma los mismos puntos de antes (la definición y cinco usos: nieve, hojas, luciérnagas, humo y fuegos): sin dibujos nuevos');
  ok((cielo.match(/new THREE\.Mesh\(/g) || []).length === 2, 'el cielo arma las mismas 2 mallas de siempre (el domo y la cordillera): ninguna capa de pantalla completa nueva');
  ok((clima.match(/new THREE\.(Mesh|Points|LineSegments)\(/g) || []).length === 5, 'clima.js arma los mismos 5 objetos dibujables de antes (lluvia, nubes de puntos, fuegos, leña y brasas)');
  ok((post.match(/= material\(/g) || []).length === 4 && (post.match(/pasada\(/g) || []).length === 6, 'el postproceso sigue con sus cuatro materiales y sus seis llamadas a pasada: ninguna pasada nueva (cada una vale ~0,85 ms)');  const casaViva = leer('src/casa-viva.js');
  ok(!/from 'three'|THREE\./.test(casaViva), 'casa-viva.js sigue puro (sin three): las ventanas nuevas no crean objetos de escena');
  ok(!/\b(ñ|Ñ)/.test(Object.keys(cv).join(' ')), 'los nombres exportados no llevan ñ');
}

// ---------------------------------------------------------------- mutaciones de la cuenta de las ventanas (una copia con otro nombre por cada una; un proceso por copia)
{
  const fuente = leer('src/casa-viva.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoj-4210c-'));
  const correr = (nombre, texto) => {
    const f = path.join(dir, nombre + '.mjs');
    fs.writeFileSync(f, texto);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--hijo', f], { encoding: 'utf8' });
    return (r.stdout || '').trim() === '1';
  };
  ok(correr('original', fuente), 'mutación 0: la copia sin tocar pasa la comprobación');
  const muta = [
    ['sin-fuera', "const VENTANA_CASA = { ancho: 0.95, alto: 0.9, y: 1.62, pared: 0.1, fuera: 0.09 }", "const VENTANA_CASA = { ancho: 0.95, alto: 0.9, y: 1.62, pared: 0.1, fuera: 0 }"],
    ['altura', 'y: 1.62, pared', 'y: 1.2, pared'],
    ['giro-lateral', "(v.orient === 'x' ? Math.PI / 2 : 0)", '0'],
    ['sin-dy', 'VENTANA_CASA.y + (v.dy || 0)', 'VENTANA_CASA.y'],
    ['adentro-se-enciende', 'if (dentroDeCasa(obra, plano, jugador)) return salida;', ''],
    ['huella-al-reves', 'const lx = dx * c - dz * s, lz = dx * s + dz * c;', 'const lx = dx * c + dz * s, lz = -dx * s + dz * c;'],
  ];
  for (const [n, de, a] of muta) {
    if (!fuente.includes(de) && !fuente.includes(de.replace('export const', 'const'))) { ok(false, `mutación ${n}: el texto a cambiar existe`); continue; }
    ok(!correr(n, fuente.replace(de.replace('const VENTANA_CASA', 'export const VENTANA_CASA'), a.replace('const VENTANA_CASA', 'export const VENTANA_CASA')).replace(de, a)), `mutación «${n}» hace fallar la comprobación`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
