// 4.0.2 · los bugs bajos de los informes de revisión (trabajo/bugs/zona-A a zona-D) que eran triviales y seguros. Cada uno con su comprobación:
//   A4 vasos de la peña que no se vuelven a poner · A5 avisos de la borrachera con el efecto apagado · A6 la madrugada de la peña es noche de sábado
//   B7 notas de primera vez al entrar de verdad · B10 un número guardado como objeto raro · B13 el foco no se escapa de las capas del creador y del prólogo
//   B14 la copia a la carpeta que falla avisa y espera · C6 halos de la galería de la casa de té sólo de noche · C7 el charco de la cantina sobre sus tablas
//   D16 «Girar» en el cuaderno · D17 la altura al juntar armas y golpear puestos y capullos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registrarThree } from './ayuda-three.mjs';

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
for (const f of ['cantina-juego', 'cantina', 'pena-juego', 'main', 'guardado', 'creador-prologo', 'creador-pantalla', 'casa-te-luz', 'aldea-mundo', 'personal-cuaderno', 'desafio-arsenal-mundo', 'desafio-puestos-mundo', 'desafio']) {
  ok(!leer(`src/${f}.js`).includes('\r'), `${f}.js: fines de línea LF`);
  ok(/4\.0\.2:/.test(leer(`src/${f}.js`)), `${f}.js: el cambio lleva el comentario 4.0.2`);
}

// ---------------------------------------------------------------- A6: la afluencia de la madrugada
registrarThree();
const C = await import('../src/cantina.js');
const SAB = 13, DOM = 14;   // (el 13 es sábado: ver verificar-3-9-1-pena.mjs)
ok(Math.abs(C.afluencia(0.5, DOM) - 0.75) < 1e-9, `domingo a las 0:30 (la noche del sábado de peña): ${C.afluencia(0.5, DOM).toFixed(2)}, no el 0,26 del «domingo flojo»`);
ok(C.afluencia(22, SAB) === 1 && C.afluencia(12, SAB) === 0, 'sábado a las 22: lleno; de día, cerrada (sin cambio)');
ok(C.afluencia(0.5, SAB + 3) < C.afluencia(0.5, DOM), 'y la madrugada de un martes sigue más tranquila que la de la peña');

// ---------------------------------------------------------------- A5, A4: por texto (cada uno es una condición dentro de la máquina de la cantina y de la peña)
const cj = leer('src/cantina-juego.js'), pj = leer('src/pena-juego.js');
ok(/function avisarFase\(antes, ahora\) \{\n    faseAntes = ahora;\n    if \(multEbrio\(\) <= 0\.01\) return;/.test(cj), 'A5: con la borrachera apagada, avisarFase no dice nada (pero guarda la fase)');
ok(/const falta = typeof v\.enMesa\?\.has === 'function' && !v\.enMesa\.has\(`p-\$\{s\.punto\}`\);/.test(pj) && /if \(!ya \|\| ya\.clave !== s\.clave \|\| falta\)/.test(pj), 'A4: el vaso se vuelve a poner si la cantina vació las mesas');

// ---------------------------------------------------------------- B7, B13, B14: el arranque, las capas y la carpeta
const main = leer('src/main.js');
ok(/avisosAlEntrar\.push\(\(\) => nota\('El juego se recuperó'/.test(main) && /avisosAlEntrar\.push\(\(\) => nota\(`Calidad \$\{nombreCalidad\(calidadElegidaAlAbrir\)\}/.test(main), 'B7: las dos notas de primera vez esperan a entrar al juego');
ok(/if \(avisosAlEntrar\.length\) for \(const f of avisosAlEntrar\.splice\(0\)\) setTimeout\(f, 1200\);/.test(main) && !/btn-entrar'\)\?\.addEventListener\('click', \(\) => setTimeout\(\(\) => nota\(/.test(main), 'B7: se disparan desde volverAlJuego y no desde el primer clic');
for (const f of ['src/creador-prologo.js', 'src/creador-pantalla.js']) {
  const t = leer(f);
  ok(/if \(e\.key === 'Tab'\) \{/.test(t) && /e\.shiftKey/.test(t) && /querySelectorAll\('button, input, select, textarea/.test(t), `B13: ${f} da la vuelta con Tab adentro`);
}
ok(/else if \(r === false\) \{/.test(main) && /ultimaCopiaSync = Date\.now\(\) \+ 10 \* 60 \* 1000;/.test(main) && /avisoSyncFallo/.test(main), 'B14: la copia que falla avisa una vez y espera 10 minutos');

// ---------------------------------------------------------------- B10: un número guardado como objeto raro
{
  const datos = new Map();
  globalThis.localStorage = { getItem: (k) => (datos.has(k) ? datos.get(k) : null), setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k) };
  const G = await import('../src/guardado.js?bajos=' + Date.now());
  const roto = { ...G.progresoNuevo(), dia: 7, pos: { x: { toString: 1 }, z: 3 } };
  datos.set('hojarasca-v1', JSON.stringify(roto));
  const r = G.cargarProgreso();
  ok(r && r.dia === 7, 'B10: una partida con `"toString": 1` en un número carga (antes devolvía null y arrancaba de cero)');
  ok(r.pos === null || (Number.isFinite(r.pos.x) && Number.isFinite(r.pos.z)), `B10: y esa posición queda sana o descartada (${JSON.stringify(r.pos)}): arranca en el lugar de siempre`);
  datos.set('hojarasca-v1', JSON.stringify(G.progresoNuevo()));
  ok(G.cargarProgreso() !== null, 'B10: una partida normal carga igual');
}

// ---------------------------------------------------------------- C6, C7: luces
const ct = leer('src/casa-te-luz.js'), am = leer('src/aldea-mundo.js');
ok(/for \(const g of gal\) lista\.push\(\{ pos: \[g\.x, g\.y, g\.z\], radio: 0\.85, fluctua: 0\.3, soloNoche: true \}\)/.test(ct), 'C6: los halos de los faroles de la galería, sólo de noche');
ok(/yG = b\.sitio\.y \+ 0\.33/.test(am) && (am.match(/charcos\.push\(\{ pts: w4\(/g) || []).length === 2, 'C7: el charco de la cantina, en dos pedazos (las tablas de la galería a 30 cm y el suelo)');
ok(!/const y0 = b\.sitio\.y \+ 0\.08, esq = \[\[-1\.7, f \+ 0\.2\]/.test(am), 'C7: ya no queda el charco único que las tablas tapaban');

// ---------------------------------------------------------------- D16, D17
ok(/d\.adornos\[i\] = a; guardarAdornos\(\); dibujarVista\(\); \};/.test(leer('src/personal-cuaderno.js')), 'D16: al soltar un sello se vuelve a dibujar (el primer «Girar» ya anda)');
ok(/Math\.abs\(js\.pos\.y - r\.malla\.position\.y\) > 6/.test(leer('src/desafio-arsenal-mundo.js')), 'D17: juntar armas mira la altura');
ok(/Math\.abs\(b\.pos\.y - js\.pos\.y\) > 12/.test(leer('src/desafio-puestos-mundo.js')), 'D17: golpear puestos mira la altura');
ok(/Math\.abs\(T\.altura\(c\.x, c\.z\) - js\.pos\.y\) > 12/.test(leer('src/desafio.js')), 'D17: golpear capullos mira la altura');

console.log(`OK 4.0.2 bajos · ${n} comprobaciones · A4 A5 A6 B7 B10 B13 B14 C6 C7 D16 D17`);
