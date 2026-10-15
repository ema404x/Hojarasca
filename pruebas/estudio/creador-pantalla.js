// 4.1 (borrador, F2): la pantalla de creación de Bruno Castellanos, como PROTOTIPO. Dibuja con el motor de cuerpos real (gente-cuerpo.js) y el genoma de la F1
// (creador-personaje.js): la figura gira con luz de atardecer a la izquierda y el panel de papel a la derecha, en las dos pantallas del plan
// (1: su aspecto, 2: su historia). No toca el juego ni main.js: es para ver la pantalla y decidir antes de enchufarla. Lo arma
// pruebas/visor-creador-pantalla.cjs. Los textos de los pros y contras son PROVISORIOS (los escribe quien los escribe; ver TEXTOS_BRUNO.md).
import * as THREE from 'three';
import { __mallaPersona } from '../../src/gente.js';
import { atlasPersonajes, completarAtlas } from '../../src/gente-atlas.js';
import { PERSONALIZACIONES, SISTEMAS, TOPES } from '../../src/creador-catalogo.js';
import { genomaDefecto, sanearGenoma, aspectoDeGenoma, efectosAplicados, efectosBrutos, sistemasAlTope, contribuciones, opcionesAlCrear, PROTAGONISTA } from '../../src/creador-personaje.js';

// ---------------------------------------------------------------- la escena: el valle al atardecer, con la figura a la izquierda
const W = 1600, H = 900;
const lienzo = document.createElement('canvas');
lienzo.width = W; lienzo.height = H; lienzo.style.cssText = 'position:absolute;left:0;top:0;width:100vw;height:100vh';
document.body.style.cssText = 'margin:0;overflow:hidden;background:#d9c6a0;font-family:Georgia,serif';
document.body.appendChild(lienzo);
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const escena = new THREE.Scene();
escena.background = new THREE.Color('#e7cfa0');
escena.fog = new THREE.FogExp2('#e7cfa0', 0.045);
escena.add(new THREE.HemisphereLight(0xffe2b8, 0x6b7a44, 0.95));
const sol = new THREE.DirectionalLight(0xffd08a, 2.4); sol.position.set(-3.2, 3.4, 3.2); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -2, near: 0.5, far: 14 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
escena.add(sol); escena.add(sol.target);
const contra = new THREE.DirectionalLight(0xff9a60, 0.9); contra.position.set(3, 1.6, -3); escena.add(contra);
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
const suelo = new THREE.Mesh(new THREE.CircleGeometry(40, 48), lam('#8a9a58')); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
const camino = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), lam('#b9aa86')); camino.rotation.x = -Math.PI / 2; camino.position.y = 0.004; camino.receiveShadow = true; escena.add(camino);
// el fondo: unos cerros y árboles bajos, sólo para que la luz tenga contra qué
for (let i = 0; i < 9; i++) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(2.6 + (i % 3) * 0.8, 3.4 + (i % 4) * 0.7, 7), lam(['#7d8a78', '#8e9a86', '#6f7f6c'][i % 3]));
  c.position.set(-16 + i * 4.2, 1.2, -13 - (i % 2) * 2); escena.add(c);
}
for (let i = 0; i < 14; i++) {
  const t = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 6), lam('#5a4330')); tr.position.y = 0.7; t.add(tr);
  const co = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 7), lam(['#3e5a34', '#4a6a3a', '#35502e'][i % 3])); co.position.y = 2.3; t.add(co);
  t.position.set(-9 + i * 1.5 + (i % 2) * 0.6, 0, -6.5 - (i % 3) * 1.4); t.scale.setScalar(0.9 + (i % 4) * 0.18); t.traverse((o) => { if (o.isMesh) o.castShadow = true; }); escena.add(t);
}
const camara = new THREE.PerspectiveCamera(34, W / H, 0.05, 80);
camara.setViewOffset(W, H, 215, 0, W, H);   // la figura queda a la izquierda; el panel ocupa la derecha
atlasPersonajes(); completarAtlas();

// ---------------------------------------------------------------- la figura
let genoma = genomaDefecto(), figura = null, ultimoAspecto = '', giro = 0.55, girar = true;
function armarFigura() {
  const huella = JSON.stringify(aspectoDeGenoma(genoma));
  if (huella === ultimoAspecto && figura) return;
  ultimoAspecto = huella;
  if (figura) { escena.remove(figura.g); figura.soltar?.(); }
  figura = __mallaPersona({}, 'gen-bruno', false, { aspecto: aspectoDeGenoma(genoma) });
  figura.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  figura.g.rotation.y = giro;
  figura.__gesto = 'neutral'; figura.__cerca = true; figura.__quietud = null;
  figura.fase = 0; figura.pose = null; figura.pos = figura.g.position; figura.clave = 'gen-bruno';   // (lo que espera `alPosar`, como en el estudio)
  figura.brazos[0].rotation.z = -0.05; figura.brazos[1].rotation.z = 0.05;
  escena.add(figura.g);
}
function posar(dt = 1 / 60) {
  if (!figura) return;
  escena.updateMatrixWorld(true);
  figura.cabeza.rotation.set(0, 0, 0); figura.torso.rotation.set(0, 0, 0);
  if (figura.alPosar) figura.alPosar(figura, dt, camara, false, false);
}
function dibujar(dt = 1 / 60) {
  if (figura) figura.g.rotation.y = giro;
  camara.position.set(0, 1.18, 3.85); camara.lookAt(0, 0.95, 0);
  posar(dt); renderer.render(escena, camara);
}
let antes = performance.now();
(function bucle(t) { const dt = Math.min(0.05, (t - antes) / 1000); antes = t; if (girar) giro += dt * 0.35; dibujar(dt); requestAnimationFrame(bucle); })(antes);
let arrastre = null;
lienzo.addEventListener('pointerdown', (e) => { arrastre = e.clientX; girar = false; });
addEventListener('pointerup', () => { arrastre = null; });
addEventListener('pointermove', (e) => { if (arrastre !== null) { giro += (e.clientX - arrastre) * 0.01; arrastre = e.clientX; } });

// ---------------------------------------------------------------- el panel de papel
const css = document.createElement('style');
css.textContent = `
#panel{position:absolute;right:28px;top:24px;bottom:24px;width:760px;background:#f1e8d3;border:2px solid #b49a6a;border-radius:6px;box-shadow:0 10px 30px rgba(60,40,10,.35);
  display:flex;flex-direction:column;color:#3a2e1e;overflow:hidden}
#panel header{padding:12px 26px 8px;border-bottom:1px solid #cdb98c;background:#ead9b4}
#panel h1{margin:0;font-size:30px;letter-spacing:.5px}
#panel .sub{margin:2px 0 0;font-size:16px;color:#6b573a;font-style:italic}
#panel .paso{margin-top:7px;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a2e;display:flex;gap:14px;align-items:center}
#panel .paso b{padding:3px 10px;border:1px solid #a68a52;border-radius:12px;background:#f7efdc}
#panel .paso b.act{background:#8a6a2e;color:#f7efdc;border-color:#8a6a2e}
#cuerpo{flex:1;overflow:hidden;padding:6px 26px 2px;display:flex;flex-direction:column;gap:2px}
.bloque{border-bottom:1px dashed #cdb98c;padding:4px 0 5px}
.bloque:last-child{border-bottom:0}
.bloque h2{margin:0 0 2px;font-size:17px;color:#5a431f}
.fila{display:flex;align-items:center;gap:8px;margin:2px 0;flex-wrap:wrap}
.fila label{min-width:104px;font-size:14px;color:#6b573a}
.chip{font:inherit;font-size:14px;padding:3px 11px;border:1px solid #b49a6a;border-radius:15px;background:#f9f2e1;color:#3a2e1e;cursor:pointer}
.chip.sel{background:#8a6a2e;color:#f9f2e1;border-color:#6b4f1a;font-weight:bold}
.muestra{width:25px;height:25px;border-radius:50%;border:2px solid #b49a6a;cursor:pointer;padding:0}
.muestra.sel{outline:3px solid #8a6a2e;outline-offset:2px}
#pie{display:flex;justify-content:space-between;align-items:center;padding:12px 26px;border-top:1px solid #cdb98c;background:#ead9b4}
#pie .izq{display:flex;gap:10px}
.boton{font:inherit;font-size:17px;padding:9px 22px;border-radius:5px;border:1px solid #8a6a2e;background:#f9f2e1;color:#5a431f;cursor:pointer}
.boton.principal{background:#8a6a2e;color:#f9f2e1;font-weight:bold}
#ficha{position:absolute;left:24px;top:24px;bottom:24px;width:300px;background:#f1e8d3;border:2px solid #b49a6a;border-radius:6px;box-shadow:0 10px 30px rgba(60,40,10,.35);padding:16px 18px;color:#3a2e1e;overflow:hidden;display:flex;flex-direction:column;gap:6px}
#ficha h2{margin:0 0 2px;font-size:20px;color:#5a431f}
#ficha .nota{font-size:12px;color:#8a7650;font-style:italic;margin-bottom:4px}
.resumen{display:flex;flex-direction:column;gap:8px;margin-top:2px}
.resumen h3{margin:0 0 4px;font-size:15px;color:#8a6a2e;text-transform:uppercase;letter-spacing:1px}
.resumen ul{margin:0;padding:0;list-style:none;font-size:13.5px;line-height:1.4}
.resumen li.pro::before{content:'+ ';color:#4a7a3a;font-weight:bold}
.resumen li.con::before{content:'− ';color:#a8452e;font-weight:bold}
.resumen li small{color:#8a7650}
.barras{display:flex;flex-direction:column;gap:7px;margin-top:6px}
.barra{font-size:13px;color:#6b573a}
.barra .riel{position:relative;height:10px;background:#e0d1a8;border-radius:5px;margin-top:3px}
.barra .riel::after{content:'';position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:#8a7650}
.barra .val{position:absolute;top:0;bottom:0;border-radius:5px}
.barra .al{color:#a8452e;font-size:12px}
#aviso{position:absolute;left:30px;bottom:18px;font-size:13px;color:#fff8e6;background:rgba(60,40,10,.55);padding:4px 10px;border-radius:4px}
`;
document.head.appendChild(css);
const panel = document.createElement('div'); panel.id = 'panel'; document.body.appendChild(panel);
const aviso = document.createElement('div'); aviso.id = 'aviso'; aviso.textContent = 'Prototipo de la pantalla de creación · textos provisorios'; document.body.appendChild(aviso);

const h = (tag, atr = {}, ...hijos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(atr)) { if (k === 'class') n.className = v; else if (k === 'onclick') n.addEventListener('click', v); else if (k === 'style') n.style.cssText = v; else n.setAttribute(k, v); }
  for (const x of hijos.flat()) if (x !== null && x !== undefined) n.append(x);
  return n;
};
const ETIQUETA = { cara: 'Forma de la cara', ojos: 'Ojos', piel: 'Tono', pelo: 'Color', peinado: 'Peinado', barba: 'Barba', contextura: 'Contextura', estatura: 'Estatura', campera: 'Campera', accesorio: 'Accesorio', personalidad: 'Es', oficio: 'Trabajaba de', gustos: 'Le gusta (dos)', hobby: 'En su tiempo libre', virtud: 'Su virtud', defecto: 'Su defecto' };
const NOMBRE_SISTEMA = { abrigo: 'el abrigo', afecto: 'el trato con los vecinos', pesca: 'la pesca', cuaderno: 'el cuaderno' };
let pantalla = 1;

function cambiar(campo, id) {
  if (campo === 'gustos') {
    const g = new Set(genoma.gustos);
    if (g.has(id)) { if (g.size > 1) g.delete(id); } else { if (g.size >= 2) g.delete([...g][0]); g.add(id); }
    genoma = sanearGenoma({ ...genoma, gustos: [...g] });
  } else genoma = sanearGenoma({ ...genoma, [campo]: id });
  armarFigura(); pintar();
}
function opciones(campo, lista) {
  const elegido = (id) => (campo === 'gustos' ? genoma.gustos.includes(id) : genoma[campo] === id);
  const lis = campo === 'campera' ? opcionesAlCrear('campera') : lista;
  return lis.map((o) => (o.color
    ? h('button', { class: 'muestra' + (elegido(o.id) ? ' sel' : ''), style: `background:${o.color}`, title: o.nombre, onclick: () => cambiar(campo, o.id) })
    : h('button', { class: 'chip' + (elegido(o.id) ? ' sel' : ''), onclick: () => cambiar(campo, o.id) }, o.nombre)));
}
function bloque(p) {
  return h('section', { class: 'bloque' }, h('h2', {}, p.nombre), p.campos.map((c) => h('div', { class: 'fila' }, h('label', {}, ETIQUETA[c.campo]), opciones(c.campo, c.lista))));
}
// los pros y contras, en texto claro y sin números (los textos definitivos los escribe el autor: acá van provisorios)
function lineas() {
  const todas = contribuciones(genoma), pros = [], contras = [];
  const nombre = { personalidad: 'Su forma de ser', oficio: 'Su oficio', hobby: 'Su hobby', gustos: 'Lo que le gusta', virtud: 'Su virtud', defecto: 'Su defecto' };
  for (const c of todas) {
    if (c.sistema === null && c.lado === 'contra' && c.clase !== 'gustos') { contras.push(h('li', { class: 'con' }, `${nombre[c.clase]}: se nota en el día a día`)); continue; }
    if (c.sistema === null) { if (c.lado === 'pro') pros.push(h('li', { class: 'pro' }, `${nombre[c.clase]}: se nota en el día a día`)); continue; }
    (c.pasos > 0 ? pros : contras).push(h('li', { class: c.pasos > 0 ? 'pro' : 'con' }, `${nombre[c.clase]}: ${c.pasos > 0 ? 'mejora' : 'empeora'} ${NOMBRE_SISTEMA[c.sistema]}`));
  }
  return [pros, contras];
}
function barras() {
  const a = efectosAplicados(genoma), b = efectosBrutos(genoma), tope = new Set(sistemasAlTope(genoma));
  return h('div', { class: 'barras' }, SISTEMAS.map((s) => {
    const v = a[s] / TOPES[s], ancho = Math.abs(v) * 50;
    const val = h('div', { class: 'val', style: `${v >= 0 ? 'left:50%' : `right:50%`};width:${ancho}%;background:${v >= 0 ? '#6a9a4a' : '#c4684a'}` });
    return h('div', { class: 'barra' }, NOMBRE_SISTEMA[s][0].toUpperCase() + NOMBRE_SISTEMA[s].slice(1), h('div', { class: 'riel' }, val), tope.has(s) ? h('div', { class: 'al' }, b[s] > 0 ? 'ya está al máximo' : 'ya no empeora más') : null);
  }));
}
// la tarjeta de la izquierda (sólo en la pantalla 2): los pros y contras de lo que se va eligiendo, y cuánto pesa cada sistema
function pintarFicha() {
  document.getElementById('ficha')?.remove();
  if (pantalla !== 2) return;
  const [pros, contras] = lineas();
  const f = h('div', { id: 'ficha' }, h('h2', {}, 'Pros y contras de Bruno'), h('div', { class: 'nota' }, 'Textos provisorios'),
    h('div', { class: 'resumen' }, h('div', {}, h('h3', {}, 'A su favor'), h('ul', {}, pros)), h('div', {}, h('h3', {}, 'En su contra'), h('ul', {}, contras))), barras());
  document.body.appendChild(f);
}
function pintar() {
  panel.innerHTML = '';
  panel.append(
    h('header', {}, h('h1', {}, `${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}`), h('p', { class: 'sub' }, `${PROTAGONISTA.edad} años · llega al valle buscando paz, lejos del ruido de la ciudad`),
      h('div', { class: 'paso' }, h('b', { class: pantalla === 1 ? 'act' : '' }, '1 · Su aspecto'), h('b', { class: pantalla === 2 ? 'act' : '' }, '2 · Su historia'))),
  );
  const cuerpo = h('div', { id: 'cuerpo' });
  if (pantalla === 1) cuerpo.append(...PERSONALIZACIONES.filter((p) => p.pantalla === 'aspecto').map(bloque));
  else {
    cuerpo.append(...PERSONALIZACIONES.filter((p) => p.pantalla === 'historia').map(bloque));
  }
  pintarFicha();
  panel.append(cuerpo, h('div', { id: 'pie' },
    h('div', { class: 'izq' }, pantalla === 2 ? h('button', { class: 'boton', onclick: () => { pantalla = 1; pintar(); } }, 'Volver') : null, h('button', { class: 'boton', onclick: () => { azar(); } }, 'Al azar')),
    pantalla === 1 ? h('button', { class: 'boton principal', onclick: () => { pantalla = 2; pintar(); } }, 'Siguiente') : h('button', { class: 'boton principal' }, 'Empezar')));
}
// al azar: una elección válida de cada personalización (con una semilla, para que la prueba sea repetible)
function azar(sem) {
  let s = sem ?? Math.floor(Math.random() * 1e9);
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const g = { ...genoma };
  for (const p of PERSONALIZACIONES) if (p.pantalla === (pantalla === 1 ? 'aspecto' : 'historia')) for (const c of p.campos) {
    const lis = c.campo === 'campera' ? opcionesAlCrear('campera') : c.lista;
    if (c.campo === 'gustos') { const a = lis[Math.floor(rnd() * lis.length)].id; let b = a; while (b === a) b = lis[Math.floor(rnd() * lis.length)].id; g.gustos = [a, b]; } else g[c.campo] = lis[Math.floor(rnd() * lis.length)].id;
  }
  genoma = sanearGenoma(g); armarFigura(); pintar();
}

armarFigura(); pintar();
window.estudioListo = true;
// el control de la prueba
window.creador = {
  pantalla(n) { pantalla = n; pintar(); },
  genoma(g) { genoma = sanearGenoma({ ...genomaDefecto(), ...g }); armarFigura(); pintar(); },
  azar(sem) { azar(sem); },
  giro(a) { giro = a; girar = false; },
  actual: () => JSON.parse(JSON.stringify(genoma)),
  foto() { dibujar(); return lienzo.toDataURL('image/png'); },
};
