// 2.7.4: luces sin tirones y postproceso sin borrados de más, sin cambiar un píxel.
//
// Lo visual se verificó con capturas deterministas (diferencia máxima 0 en media, alta y
// muy baja, de día y de noche, con el tren y las casas prendidas). Esto cuida que el
// código siga armado como se verificó.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const leer = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const luces = leer('src/luces.js');
const main = leer('src/main.js');
const post = leer('src/postproceso.js');

// ============================================================ 1. la cantidad de luces no se toca
// Una luz de más (aunque sume 0) cambia cómo compila el driver y mueve algún píxel: las
// luces siguen prendiéndose, apagándose y ocultándose como antes.
assert.ok(!/layers\.disableAll\(\)/.test(luces), 'las luces del juego no se sacan de la vista de three');
// 3.3: el usuario eligió la fluidez: ahora hay un presupuesto fijo de luces (ver
// verificar-3-3-fluidez.mjs). Las intensidades del juego no se tocan: sólo las de las fijas.
assert.ok(!/\b(l|luz|f|fuente)\.intensity\s*=/.test(luces), 'luces.js no toca las intensidades de las luces del juego');
assert.ok(luces.includes('escena.add(grupo);') && (luces.match(/escena\.add\(/g) || []).length === 1, 'luces.js sólo agrega el grupo de las luces fijas');
assert.ok(luces.includes('function compilarUno(') && luces.includes('renderer.compile(o, camara, muestra)'), 'se compila contra una escena de muestra');
assert.ok(luces.includes('for (const [u, v] of valores) if (u) u.value = v;'), 'los uniformes de luces del material vuelven a los de la escena');
assert.ok(luces.includes('m.version = version;'), 'la versión del material queda como estaba');
assert.ok(luces.includes('function sinAzar('), 'la escena de muestra no toma números de Math.random');

// ============================================================ 2. todas las luces anotadas
const registran = {
  'src/estructuras.js': 'grupo.traverse((o) => { if (o.isLight) registrarLuz(o); });',
  'src/trochita.js': 'registrarLuz(luzFaro); registrarLuz(luzCoche);',
  'src/clima.js': 'registrarLuz(luzFuego);',
  'src/construccion.js': 'registrarLuz(luz);',
  'src/desafio.js': 'registrarLuz(luzNave);',
  'src/desafio-defensas.js': 'registrarLuz(l);',
  'src/main.js': 'registrarLuz(linterna);',
};
for (const [f, t] of Object.entries(registran)) assert.ok(leer(f).includes(t), `${f} anota sus luces`);
assert.ok(leer('src/trochita.js').includes('registrarLuz(luz);'), 'la luz de cada estación está anotada');
assert.ok(leer('src/desafio.js').includes('return registrarLuz(l); });'), 'las luces de la zanja están anotadas');
assert.ok(leer('src/construccion.js').includes('olvidarLuz(obra.luzInterior)'), 'el farol de una obra desarmada se olvida');
// ninguna luz puntual o foco nuevo sin anotar
for (const f of fs.readdirSync(new URL('../src/', import.meta.url)).filter((x) => x.endsWith('.js') && x !== 'luces.js')) {
  const t = leer(`src/${f}`);
  const n = (t.match(/new THREE\.(PointLight|SpotLight)\(/g) || []).length;
  if (n) assert.ok(/registrarLuz\(/.test(t), `${f} crea luces y no las anota`);
}

// ============================================================ 3. main: carga, LOD, tren y cuadro
assert.ok(main.includes("import { crearVariantesLuces, registrarLuz } from './luces.js';"));
assert.ok(main.includes('objetivo: () => (post && ajustes.post !== \'apagado\' ? post.destino : null),'), 'se compila contra la salida del postproceso');
assert.ok(main.includes('variantesLuces.compilarCarga(jugador.estado.pos);'), 'la carga compila para el jugador');
assert.ok(main.includes('Math.min(calidad.lejos + 60 + c.radio, c.distanciaMax)') && main.includes('(p) => Math.hypot(p.x - ch.x, p.z - ch.z) < calidad.lejos + 60);'), 'mismos cortes que actualizarVisibilidad');
assert.ok(main.includes('const corte = calidad.lejos + 60;') && main.includes('const limite = Math.min(corte + c.radio, c.distanciaMax);'), 'el LOD sigue con ese corte');
assert.ok(main.includes('tren.visibleDesde(jugador.estado.pos)'), 'el tren avisa');
assert.ok(leer('src/trochita.js').includes('const visible = lejos < 340 || est.subido;') && leer('src/trochita.js').includes('< 340,'), 'el tren se oculta a la misma distancia que se predice');
assert.ok(main.includes("variantesLuces.actualizar(performance.now(), modo === 'inicio' ? jugador.estado.pos : null);"), 'el trabajo va en cada cuadro, después de dibujar');

// ============================================================ 4. postproceso
assert.ok(post.includes('renderer.autoClear = false;') && post.includes('renderer.autoClear = borrar;'), 'las pasadas no borran lo que van a tapar');
assert.ok(post.includes('if (!renderer.autoClear) renderer.clear();'), 'la escena se borra una vez');
assert.ok(post.includes('return { render, redimensionar, uniforms: matComponer.uniforms, destino };'));
// la composición sigue siendo una sola pasada: curva, paleta, viñeta y grano en ese orden
const iComp = post.indexOf('const COMPONER');
for (const [a, b] of [['c = filmico(c);', '// viñeta'], ['// viñeta', '// grano fino'], ['// grano fino', 'gl_FragColor = vec4(c, 1.0);']]) {
  assert.ok(post.indexOf(a, iComp) > 0 && post.indexOf(a, iComp) < post.indexOf(b, iComp), `orden en la composición: ${a} antes que ${b}`);
}
assert.ok(post.includes('float g = fract(sin(dot(vUv * uTiempo, vec2(12.9898, 78.233))) * 43758.5453);'), 'el grano con la misma semilla');

console.log('OK 2.7.4 luces · la cantidad de luces no cambia · variantes compiladas antes · postproceso sin borrados de más');
