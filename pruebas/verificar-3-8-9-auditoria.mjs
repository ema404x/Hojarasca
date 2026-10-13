// 3.8.9 · Lo que dejó la auditoría de la entrega (la que miró si el zip trae todo lo pedido):
//   · el listón del taller ferroviario no cruza la puerta ni la ventana del cuarto (antes no tenía prueba);
//   · el jornal no toca las horas del juego y el préstamo vencido «sin embargo»: no se pierde nada, ni casas ni obras ni cosas;
//   · la versión sube (3.8.9) y el build lleva una huella del contenido, a la vista en la portada;
//   · la segunda copia del juego avisa en vez de cerrarse sola; si un edificio de la aldea no se arma, va al registro de caídas;
//   · los guiones de Playwright no están donde la suite de partidas reales (Electron) los correría;
//   · el aviso de la portada sobre dónde están la aldea y los pesos;
//   · el juego lleva hasta el banco: la pista al llegar a la aldea, el rótulo en el mapa y la guía (antes ningún texto lo nombraba).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { registrarThree } from './ayuda-three.mjs';

registrarThree();
const AR = await import('../src/aldea-arquitectura.js');
const E = await import('../src/economia.js');
const N = await import('../src/negocios.js');
const T = await import('../src/trabajos.js');
const B = await import('../src/prestamos.js');
const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// ---------------------------------------------------------------- 1. el listón del taller
{
  const W = AR.TALLER_TREN.ancho / 2, puerta = AR.TALLER_TREN.puerta;
  const huecoPuerta = { a: puerta - 0.5, b: puerta + 0.5 }, ventanaCuarto = { a: 6.5, b: 7.5 };
  const tramos = AR.tramosDeListon(W, [huecoPuerta, ventanaCuarto]);
  eq(tramos.map(([a, b]) => [+a.toFixed(2), +b.toFixed(2)]), [[-8.55, 2.42], [3.58, 6.42], [7.58, 8.55]], 'el frente: tres tramos, de punta a punta menos la puerta y la ventana del cuarto');
  const cruza = (t, h) => t[0] < h.b && t[1] > h.a;
  ok(tramos.every((t) => !cruza(t, huecoPuerta) && !cruza(t, ventanaCuarto)), 'ningún tramo cruza la puerta ni la ventana del cuarto');
  ok(tramos.every((t) => t[1] - t[0] > 0.05) && tramos.every((t, i) => i === 0 || t[0] >= tramos[i - 1][1]), 'sin tramos vacíos ni encimados');
  ok(Math.abs(tramos[0][0] + W + 0.05) < 1e-9 && Math.abs(tramos.at(-1)[1] - (W + 0.05)) < 1e-9, 'llega a las dos esquinas (el último tramo no se queda corto)');
  eq(AR.tramosDeListon(W, []), [[-W - 0.05, W + 0.05]], 'el fondo, sin huecos: de una punta a la otra');
  eq(AR.tramosDeListon(W, [{ a: -W - 1, b: -W + 0.2 }]).length, 1, 'un hueco en la esquina no deja tramos vacíos');
  ok(leer('src/aldea-arquitectura.js').includes('tramosDeListon(W, s > 0 ? [huecoPuerta, ventanaCuarto] : [])'), 'el taller usa esos tramos');
}

// ---------------------------------------------------------------- 2. las decisiones: jornal sin horas, atraso «sin embargo»
{
  const partida = (extra = {}) => ({ modo: 'relax', dia: 5, horas: 12, cosas: { frasco: 2 }, materiales: { tronco: 7 }, entradas: {}, economia: E.economiaNueva(), ...extra });
  const p = partida();
  const antes = JSON.stringify({ horas: p.horas, dia: p.dia });
  const r = T.cumplirJornal(p, 'carpintero', 5, 'Tito');
  ok(r.ok && JSON.stringify({ horas: p.horas, dia: p.dia }) === antes, 'el jornal paga y no toca la hora ni el día del juego (sólo tiene tope por día)');
  ok(!/horas/.test(leer('src/trabajos.js').replace(/\/\/.*$/gm, '')), 'trabajos.js no maneja horas');
  // el préstamo vencido: sube el interés y deja de prestar, pero no se pierde nada
  const q = partida();
  q.negocios = N.negociosNuevo();
  q.negocios.casas = { poseidas: { cabana: 1, casona: 1 }, alquiladas: { cabana: { inquilino: 'Tito', desde: 2, renta: 300, cuantas: 1 } }, cobrado: 900, puesto: null };
  q.obras = [{ plano: 'casa-etapas', etapas: 8 }];
  const foto = JSON.stringify({ cosas: q.cosas, materiales: q.materiales, obras: q.obras, poseidas: q.negocios.casas.poseidas, alquiladas: q.negocios.casas.alquiladas, horas: q.horas });
  B.pedirPrestamo(q, 5, 3000, 3);
  for (let d = 6; d <= 200; d++) B.pasarDiaBanco(q, d);
  ok(B.prestamoDe(q).tasa === 0.03 && N.negociosDe(q).banco.sinConfianza, 'vencido: interés del 3 % y sin confianza');
  ok(B.prestamoDe(q).debe <= 1e7, 'la deuda tiene tope (no se va al infinito)');
  eq(JSON.stringify({ cosas: q.cosas, materiales: q.materiales, obras: q.obras, poseidas: q.negocios.casas.poseidas, alquiladas: q.negocios.casas.alquiladas, horas: q.horas }), foto, 'después de 195 días de atraso no se perdió nada: ni cosas, ni materiales, ni obras, ni casas, ni alquileres, ni horas');
  eq(B.puedePedir(q, 200, 500).motivo, 'debe', 'sólo deja de prestar');
}

// ---------------------------------------------------------------- 3. la versión y la huella del build
{
  const pkg = JSON.parse(leer('package.json')), lock = JSON.parse(leer('package-lock.json'));
  ok(/^\d+\.\d+\.\d+$/.test(pkg.version) && lock.version === pkg.version && lock.packages[''].version === pkg.version, `package.json y package-lock.json, en la misma versión (${pkg.version})`);
  ok(pkg.version !== '3.8.8', 'la versión ya no es la 3.8.8: un paquete armado antes (sin el banco) no se confunde con éste');
  const armar = leer('armar.mjs'), plantilla = leer('src/plantilla.html');
  ok(/const huella = crypto\.createHash\('sha256'\)\.update\(html\)\.digest\('hex'\)\.slice\(0, 8\);/.test(armar), 'armar.mjs saca la huella del contenido (sin fecha: dos armados iguales dan lo mismo)');
  ok(armar.includes('HOJARASCA BUILD ${pkg.version} · huella ${huella}') && armar.includes("split('__HOJARASCA_HUELLA__').join(huella)"), 'la deja en el comentario del build y en la plantilla');
  ok(plantilla.includes("const BUILD_HUELLA = '__HOJARASCA_HUELLA__';") && plantilla.includes('`Hojarasca · ${v || VERSION_FALLBACK} · build ${BUILD_HUELLA}`'), 'la portada muestra «Hojarasca · versión · build huella»');
  ok(plantilla.includes('id="version-completa">Versión __HOJARASCA_VERSION__<'), '(y «Créditos y versión» sigue con sólo la versión: otros módulos la leen)');
  if (fs.existsSync(new URL('../index.html', import.meta.url))) {
    const index = leer('index.html');
    const m = /<!-- HOJARASCA BUILD (\S+) · huella ([0-9a-f]{8}) -->/.exec(index);
    ok(m && m[1] === pkg.version, 'index.html: el comentario trae la versión y la huella');
    ok(index.includes(`const BUILD_HUELLA = '${m[2]}';`) && !index.includes('__HOJARASCA_HUELLA__'), 'y la portada la lleva, sin marcador sin reemplazar');
    // la huella es la del contenido: se deshace lo que armar.mjs le agrega (el comentario y el valor en la portada) y se vuelve a calcular
    const crudo = index.replace(m[0], '<!--HOJARASCA_BUILD-->').split(m[2]).join('__HOJARASCA_HUELLA__');
    ok(crypto.createHash('sha256').update(crudo).digest('hex').slice(0, 8) === m[2], `la huella (${m[2]}) es la del contenido del juego: rehecha desde el index.html sale la misma`);
  }
  const cache = leer('src/cache-carga.js');
  ok(cache.includes('/HOJARASCA BUILD (\\S+)/'), 'la versión del build se sigue leyendo bien con la huella detrás');
}

// ---------------------------------------------------------------- 4. la segunda copia avisa, y lo que falla en la aldea queda anotado
{
  const main = leer('main.cjs');
  ok(/const primeraInstancia = app\.requestSingleInstanceLock\(\);\nif \(!primeraInstancia\) app\.quit\(\);/.test(main), 'sigue pidiendo ser la única copia (y la segunda se cierra)');
  ok(/if \(!primeraInstancia\) \{\n  try \{\n    dialog\.showErrorBox\('Hojarasca ya está abierto/.test(main) && main.includes('Administrador de tareas') && main.includes('Task Manager'), 'pero ahora la segunda copia avisa (en español y en inglés) qué hacer con un Hojarasca viejo abierto');
  const am = leer('src/aldea-mundo.js');
  ok(am.includes('avisarFalla(`no se pudo armar ${b.id}`, err);') && am.includes('avisarFalla(`falló el montaje de ${q.tipo}`, err);'), 'si un edificio de la aldea no se arma, se avisa');
  ok(!/console\.error\('aldea-mundo: (no se pudo armar|falló el montaje)/.test(am) && am.includes('globalThis.window?.hojarasca?.reportarError?.(mensaje)'), 'y va al registro de caídas, no sólo a la consola (el juego empaquetado no tiene)');
}

// ---------------------------------------------------------------- 5. los guiones de Playwright, fuera de la suite de partidas reales
{
  const humos = fs.readdirSync(new URL('../pruebas/', import.meta.url)).filter((f) => /^humo-.*\.cjs$/.test(f));
  const conPlaywright = humos.filter((f) => /require\(['"](?:\/opt\/node-tools\/node_modules\/)?playwright['"]\)/.test(leer('pruebas/' + f)));
  eq(conPlaywright, [], `ninguno de los ${humos.length} humo-*.cjs usa Playwright (la suite los corre con Electron)`);
  for (const f of ['partida-real-economia.cjs', 'recorrido-revision.cjs']) {
    ok(fs.existsSync(new URL('../herramientas/' + f, import.meta.url)) && leer('herramientas/' + f).includes('OJO: no es parte de la suite de partidas reales'), `herramientas/${f}: aparte, con el aviso de que usa Playwright`);
  }
  ok(!fs.existsSync(new URL('../pruebas/humo-economia.cjs', import.meta.url)) && !fs.existsSync(new URL('../pruebas/humo-revision.cjs', import.meta.url)), 'y ya no están en pruebas/');
}

// ---------------------------------------------------------------- 6. el aviso de la portada
{
  const main = leer('src/main.js'), plantilla = leer('src/plantilla.html');
  ok(plantilla.includes('<p class="modo-texto" id="modo-aviso"></p>'), 'la portada tiene el renglón del aviso');
  ok(main.includes("'Acá no hay aldea, banco ni pesos: eso es del modo Relax.'") && main.includes("'En el Relax están la aldea (se llega en tren), el mercado, el banco del pueblo y tus pesos.'"), 'dice dónde están (y que en la noche de los duendes no)');
}

// ---------------------------------------------------------------- 7. el juego lleva hasta el banco (antes nada lo nombraba)
{
  const main = leer('src/main.js'), guia = leer('src/guia.js'), am = leer('src/aldea-mundo.js');
  ok(/const PISTA_BANCO = 'En la aldea, saliendo de la plaza hacia el este, está el Banco del Pueblo[^']*8:30 a 12:30 y de 14:30 a 18';/.test(main), 'hay un texto que dice dónde está el banco y a qué hora atiende');
  ok(/\{ id: 'p-banco', cuando: \(js, p\) => !desafio && hayEconomia\(p\) && !!p\.aldea\?\.descubierta, titulo: 'El Banco del Pueblo', texto: PISTA_BANCO \}/.test(main), 'sale como pista una vez que llegaste a la aldea, sólo en el Relax');
  ok(main.includes("if (aldeaMundo && !desafio) { const b = aldeaMundo.lugarBanco(); marcas.push({ x: b.x, z: b.z, tipo: 'parada', nombre: b.nombre });"), 'el mapa lo rotula (sólo en el Relax)');
  ok(/const lugarBanco = \(\) => \{ const e = EDIFICIOS_ALDEA\['banco-pueblo'\], w = marcoAldea\(parada\)\.aMundo\(e\.x, e\.z\);/.test(am) && am.includes('zonasObjetos, lugarBanco, lugarCantina, montar'), 'aldea-mundo.js dice dónde cae el banco en el valle');
  ok(guia.includes("['Los pesos',") && guia.includes("['El Banco del Pueblo', 'Al este de la plaza de la aldea (también en el mapa)") && guia.includes('de 8:30 a 12:30 y de 14:30 a 18.'), 'la guía (F1, sólo del Relax) explica los pesos y el banco');
  // los textos nuevos tienen su inglés
  const EN = (await import('../src/idioma-en.js')).default || (await import('../src/idioma-en.js')).EN;
  const tiene = (t) => !!EN && Object.hasOwn(EN, t);
  const pista = /const PISTA_BANCO = '([^']*)';/.exec(main)[1];
  ok(tiene(pista) && tiene('El Banco del Pueblo') && tiene('Banco del Pueblo') && tiene('Los pesos'), 'la pista, el título, el nombre del mapa y la guía, con inglés');
}

console.log(`verificar-3-8-9-auditoria: ${n} verificaciones ok`);
