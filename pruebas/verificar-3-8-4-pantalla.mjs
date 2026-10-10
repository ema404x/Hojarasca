// 3.8.4 (pantalla): las decisiones 8, 17, 35 y 36 del usuario.
//   8. portada compacta en pantallas bajas (≤ 820 px): título más chico y las teclas detrás del botón «Teclas»
//  17. dos pantallas de escala distinta: la resolución se acomoda sola al pasar de una a la otra
//  35. la calidad gráfica nunca cambia sola: si va lento, pregunta; la primera vez elige según la placa y avisa; perder el
//      contexto 3D baja un escalón y avisa; el presupuesto adaptativo no toca lo que se ve
//  36. los menús en estilo «Cuaderno de campo», el de siempre (sin ?menu=A)
// (las partidas reales: humo-autocalidad, y las capturas con herramientas/menus-fotos.cjs)
import fs from 'node:fs';
import { crearPresupuestoAdaptativo } from '../src/rendimiento.js';
import { crearEstadoAutocalidad, anotarCuadro, decidirCalidad } from '../src/autocalidad.js';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
let n = 0;
const fallas = [];
const ok = (cond, texto) => { n++; if (!cond) fallas.push(texto); };
const main = leer('src/main.js'), html = leer('src/plantilla.html'), armar = leer('armar.mjs');
const sistema = leer('src/menus/sistema.css'), cuaderno = leer('src/menus/cuaderno.css');

// ---------------------------------------------------------------- 35. la calidad nunca cambia sola
ok(!/revisarCalidad\(/.test(main), '35: el bucle ya no aplica la autocalidad sola (revisarCalidad)');
ok(/if \(modo === 'jugando' && ajustes\.autoCalidad !== false\) revisarSiVaLento\(dtReal\);/.test(main), '35: el bucle sólo mide y pregunta');
ok(main.includes("dialogos.confirmar(`El juego va lento: ¿bajar la calidad?\\nDe ${nombreCalidad(cambio.desde)} a ${nombreCalidad(cambio.hasta)}. Se puede volver a subir en Ajustes.`, { si: 'Bajar', no: 'No, gracias' })"), '35: el cartelito, con «Bajar» y «No, gracias»');
ok(/if \(si\) \{ aplicarCambio\(autoCalidad, cambio\); aplicarCalidadAutomatica\(cambio\); \} else preguntaLento\.noMolestar = true;/.test(main), '35: baja sólo si acepta; con «No, gracias» no vuelve a preguntar');
ok(/if \(!preguntaLento\.activa \|\| preguntaLento\.pendiente \|\| preguntaLento\.noMolestar\) return;/.test(main), '35: una pregunta por vez y ninguna después del no');
ok(/if \(cambio\.motivo !== 'bajar'\) \{ autoCalidad\.verde = 0; return; \}/.test(main), '35: nunca sube sola');
ok(/const preguntaLento = \{ activa: !HOJARASCA_DEBUG,/.test(main), '35: en las pruebas (?debug=1) pregunta sólo si la prueba lo pide');
ok(/if \(primeraVez\) \{ ajustes\.calidad = calidadParaEquipo\(nombrePlaca\(\)\); guardarAjustes\(ajustes\); \}\n.*\nconst calidadElegidaAlAbrir = primeraVez \? ajustes\.calidad : null;/.test(main), '35: la primera vez elige según la placa');
ok(/Elegí la calidad \$\{nombreCalidad\(calidadElegidaAlAbrir\)\} según tu placa de video/.test(main) && html.includes('id="aviso-calidad-inicial"'), '35: y avisa cuál eligió, en la portada');
ok(/avisarCalidadInicial\(\);   \/\/ 3\.8\.4/.test(main), '35: el aviso se pone al abrir');
const perdido = main.slice(main.indexOf("lienzo.addEventListener('webglcontextlost'"), main.indexOf("lienzo.addEventListener('webglcontextrestored'"));
ok(/bajarCalidadPorGraficos\(\)/.test(perdido), '35: perder el contexto 3D baja la calidad');
ok(/const hasta = calidadVecina\(ajustes\.calidad, -1\);/.test(main) && /guardarAjustes\(ajustes\);\n\s+sincronizarCalidad\(autoCalidad, hasta\);/.test(main), '35: un escalón, guardado enseguida');
ok(/textoBajadaPorGraficos\(bajada\.hasta\)/.test(main) && /url\.searchParams\.set\('bajo', estadoGraficos\.bajada\.hasta\)/.test(main) && /textoBajadaPorGraficos\(bajo\)/.test(main), '35: y lo avisa al volver o en la portada');
ok(/crearPresupuestoAdaptativo\(\{ objetivoMs: 16\.7, niveles: 3, soloCadencias: true \}\)/.test(main), '35: el presupuesto adaptativo, sólo cadencias');
ok(/const factorEfectos = presupuestoAdaptativo\.soloCadencias \? 1 :/.test(main), '35: las partículas y los pájaros no bajan solos');
{
  const p = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3, soloCadencias: true });
  for (let i = 0; i < 400; i++) p.actualizar(0.05, 16.7);   // 20 fps sostenidos
  ok(p.nivel > 0 && p.intervalo(1) > 1, `35: bajo presión ensancha las cadencias (nivel ${p.nivel})`);
  ok(p.factorDetalle() === 1 && p.factorDetalle(0.78) === 1, '35: pero el detalle que se ve queda igual');
  const viejo = crearPresupuestoAdaptativo({ objetivoMs: 16.7, niveles: 3 });
  for (let i = 0; i < 400; i++) viejo.actualizar(0.05, 16.7);
  ok(viejo.factorDetalle() < 1, '35: (sin soloCadencias, como antes)');
}
{
  // la medición sigue igual: a 25 fps decide «bajar» (y main.js pregunta en vez de aplicarlo)
  const e = crearEstadoAutocalidad('media');
  let c = null;
  for (let i = 0; i < 25 * 30 && !c; i++) { anotarCuadro(e, 1 / 25); c = decidirCalidad(e); }
  ok(c && c.motivo === 'bajar' && c.desde === 'media' && c.hasta === 'baja' && e.calidad === 'media', '35: decidir no cambia nada: la calidad sigue en Media hasta que el jugador acepta');
}
ok(html.includes('<div class="fila-ajuste"><span>Si el juego va lento</span>') && html.includes('<button data-valor="true">Preguntarme si bajo la calidad</button><button data-valor="false">No preguntar</button>'), '35: el ajuste dice lo que hace');

// ---------------------------------------------------------------- 17. dos pantallas de escala distinta
ok(/function acomodarEscalaPantalla\(redimensionar = true\) \{/.test(main), '17: hay quien acomode la escala');
ok(/const base = relacionPixelPara\(window\.devicePixelRatio, calidad\.pixelRatio\);/.test(main), '17: con el tope de la calidad, como al arrancar');
ok(/renderer\.setPixelRatio\(relacionPixelBase \* escalaFluida\);/.test(main), '17: respetando el modo fluido');
ok(/window\.matchMedia\(`\(resolution: \$\{window\.devicePixelRatio \|\| 1\}dppx\)`\)/.test(main) && /vigilarEscalaPantalla\(\);\n/.test(main), '17: se escucha el cambio de escala');
ok(/window\.addEventListener\('resize', \(\) => \{\n\s+acomodarEscalaPantalla\(false\);/.test(main), '17: y en cada resize');
ok(/let relacionPixelBase = renderer\.getPixelRatio\(\);/.test(main), '17: la relación de base ya no es fija');

// ---------------------------------------------------------------- 36. «Cuaderno de campo», para siempre
ok(html.includes('<html lang="es" data-menu="cuaderno">'), '36: la plantilla lleva el estilo');
ok(!/proto-menu|menu=A/.test(main) && !fs.existsSync(new URL('../src/proto-menu', import.meta.url)), '36: sin la maqueta (?menu=A)');
ok(html.includes('/*MENUS*/') && /\.replace\('\/\*MENUS\*\/', \(\) => menus\)/.test(armar) && /\['sistema\.css', 'cuaderno\.css'\]/.test(armar), '36: armar.mjs mete los CSS de los menús');
ok(!/@import/.test(sistema) && !/@import/.test(cuaderno) && /:root\[data-menu="cuaderno"\] \{/.test(cuaderno), '36: el estilo pone sus valores (sin @import)');
ok(/--ancho-angosto: 560px; --ancho-medio: 780px; --ancho-ancho: 1000px;/.test(sistema), '36: un panel en tres anchos');
ok(/--t-chico: 14px; --t-base: 17px; --t-medio: 22px; --t-grande: 36px;/.test(cuaderno) && /--e-1: 4px; --e-2: 8px; --e-3: 12px; --e-4: 16px; --e-5: 24px; --e-6: 32px; --e-7: 48px;/.test(sistema), '36: escala de letra y de espacios');
ok(/'Ink Free'/.test(cuaderno) && /--pincel:/.test(cuaderno) && /--papel: #efe3c3;/.test(cuaderno), '36: papel crema, letra de pluma, trazos de pincel');
for (const panel of ['.trueque', '.charla', '.obra', '.rueda-info', '.cuaderno', '.hoja-mapa', '.mochila']) ok(sistema.includes(panel), `36: el panel ${panel} con el estilo`);
const portada = html.slice(html.indexOf('<section id="inicio"'), html.indexOf('</section>', html.indexOf('<section id="inicio"')));
const teclas = (portada.match(/<dl class="controles">([\s\S]*?)<\/dl>/) || [])[1] || '';
ok((teclas.match(/<dt>/g) || []).length === 6, `36: en la portada, sólo las 6 teclas básicas (${(teclas.match(/<dt>/g) || []).length})`);
const completos = html.slice(html.indexOf('<dl class="controles-completos">'), html.indexOf('</dl>', html.indexOf('<dl class="controles-completos">')));
ok((completos.match(/<div><dt>/g) || []).length >= 33, '36: las 33 están en Controles');
for (const t of ['agacharte y moverte en silencio', 'con los planos abiertos: teñir la pared', 'prender una antorcha apagada', 'estado de la base: qué defensa está dañada']) ok(completos.includes(t), `36: Controles tiene «${t}»`);
ok(/<div class="build-info" id="build-info">/.test(portada) && /#inicio \.build-info \{ position: fixed; right: var\(--e-4\); bottom: var\(--e-3\);/.test(sistema), '36: la versión, abajo a la derecha');

// ---------------------------------------------------------------- 8. portada compacta
ok(portada.includes('<button class="boton-teclas" id="btn-teclas-portada" aria-expanded="false" aria-controls="teclas-basicas">Teclas</button>'), '8: el botón «Teclas»');
const bajas = sistema.slice(sistema.indexOf('@media (max-height: 820px)'));
ok(/\.portada \.titulo \{ font-size: calc\(var\(--t-logo\) \* \.62\); \}/.test(bajas), '8: en pantallas bajas el título es más chico');
ok(/#inicio \.boton-teclas \{ display: inline-flex; \}/.test(bajas) && /#inicio \.teclas-basicas \{ display: none; \}/.test(bajas) && /#inicio\.ver-teclas \.teclas-basicas \{ display: grid; position: absolute;/.test(bajas), '8: y las teclas detrás del botón');
ok(/\$\('btn-teclas-portada'\)\?\.addEventListener\('click', \(\) => verTeclas\(!\$\('inicio'\)\?\.classList\.contains\('ver-teclas'\)\)\);/.test(html), '8: el botón abre y cierra las teclas');

if (fallas.length) { console.log('FALLAS 3.8.4 (pantalla):\n  ' + fallas.join('\n  ')); process.exit(1); }
console.log(`OK 3.8.4 (pantalla) · ${n} comprobaciones · calidad que no cambia sola, escala de pantalla, portada compacta y menús «Cuaderno de campo»`);
