// 4.1 (F2): la pantalla de creación de Bruno Castellanos, DENTRO del juego. Sale del prototipo de pruebas/estudio/creador-pantalla.js.
//
// Una capa a pantalla completa con su propio dibujante (un WebGLRenderer chico que se libera al cerrar): la figura real del juego (gente-cuerpo.js) gira con luz de
// atardecer a la izquierda, y a la derecha el panel de papel con las dos pantallas del plan (1: su aspecto; 2: su historia). Los pros y contras van en una tarjeta a la
// izquierda, en texto y sin números, con una barra por sistema.
//   · modo 'crear': las dos pantallas; «Empezar» entrega el genoma completo. No se puede cerrar sin crear (es obligatorio para empezar).
//   · modo 'rehacer': sólo el aspecto (el carácter queda fijo y la ropa de abrigo es la de «Tu personaje»); «Listo» y «Cancelar».
// Los textos (frases, pros y contras) viven en creador-textos.js: propuestos por Claude, a revisar por el usuario.
import * as THREE from 'three';
import { crearPersona, soltarPersona } from './gente-cuerpo.js';
import { PERSONALIZACIONES, SISTEMAS, TOPES } from './creador-catalogo.js';
import { sanearGenoma, aspectoDeGenoma, efectosAplicados, efectosBrutos, sistemasAlTope, opcionesAlCrear, PROTAGONISTA } from './creador-personaje.js';
import { aspectoJugadorBruno } from './personal-bruno.js';
import { lineasDeBruno, fraseDe, TARJETAS, NOMBRE_SISTEMA } from './creador-textos.js';

const ETIQUETA = { cara: 'Forma de la cara', ojos: 'Ojos', piel: 'Tono', pelo: 'Color', peinado: 'Peinado', barba: 'Barba', contextura: 'Contextura', estatura: 'Estatura', campera: 'Campera', accesorio: 'Accesorio', personalidad: 'Es', oficio: 'Trabajaba de', gustos: 'Le gusta (dos)', hobby: 'En su tiempo libre', virtud: 'Su virtud', defecto: 'Su defecto' };

const CSS = `
#creador-bruno{position:fixed;inset:0;z-index:2000;background:#e7cfa0;font-family:Georgia,'Spectral',serif;color:#3a2e1e;user-select:none}
#creador-bruno canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#creador-bruno .cb-panel{position:absolute;right:28px;top:24px;bottom:24px;width:min(760px,52vw);background:#f1e8d3;border:2px solid #b49a6a;border-radius:6px;box-shadow:0 10px 30px rgba(60,40,10,.35);display:flex;flex-direction:column;overflow:hidden}
#creador-bruno .cb-panel header{padding:12px 26px 8px;border-bottom:1px solid #cdb98c;background:#ead9b4}
#creador-bruno h1{margin:0;font-size:30px;letter-spacing:.5px}
#creador-bruno .cb-sub{margin:2px 0 0;font-size:16px;color:#6b573a;font-style:italic}
#creador-bruno .cb-paso{margin-top:7px;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a2e;display:flex;gap:14px;align-items:center}
#creador-bruno .cb-paso b{padding:3px 10px;border:1px solid #a68a52;border-radius:12px;background:#f7efdc}
#creador-bruno .cb-paso b.act{background:#8a6a2e;color:#f7efdc;border-color:#8a6a2e}
#creador-bruno .cb-cuerpo{flex:1;overflow:auto;padding:6px 26px 2px;display:flex;flex-direction:column;gap:2px}
#creador-bruno .cb-bloque{border-bottom:1px dashed #cdb98c;padding:4px 0 5px}
#creador-bruno .cb-bloque:last-child{border-bottom:0}
#creador-bruno .cb-bloque h2{margin:0 0 2px;font-size:17px;color:#5a431f}
#creador-bruno .cb-fila{display:flex;align-items:center;gap:8px;margin:2px 0;flex-wrap:wrap}
#creador-bruno .cb-fila label{min-width:104px;font-size:14px;color:#6b573a}
#creador-bruno .cb-chip{font:inherit;font-size:14px;padding:3px 11px;border:1px solid #b49a6a;border-radius:15px;background:#f9f2e1;color:#3a2e1e;cursor:pointer}
#creador-bruno .cb-chip.sel{background:#8a6a2e;color:#f9f2e1;border-color:#6b4f1a;font-weight:bold}
#creador-bruno .cb-muestra{width:25px;height:25px;border-radius:50%;border:2px solid #b49a6a;cursor:pointer;padding:0}
#creador-bruno .cb-muestra.sel{outline:3px solid #8a6a2e;outline-offset:2px}
#creador-bruno .cb-pie{display:flex;justify-content:space-between;align-items:center;padding:12px 26px;border-top:1px solid #cdb98c;background:#ead9b4}
#creador-bruno .cb-izq{display:flex;gap:10px}
#creador-bruno .cb-boton{font:inherit;font-size:17px;padding:9px 22px;border-radius:5px;border:1px solid #8a6a2e;background:#f9f2e1;color:#5a431f;cursor:pointer}
#creador-bruno .cb-boton.principal{background:#8a6a2e;color:#f9f2e1;font-weight:bold}
#creador-bruno button:focus-visible{outline:3px solid #3a6ea5;outline-offset:2px}
#creador-bruno .cb-ficha{position:absolute;left:24px;top:24px;bottom:24px;width:300px;background:#f1e8d3;border:2px solid #b49a6a;border-radius:6px;box-shadow:0 10px 30px rgba(60,40,10,.35);padding:16px 18px;overflow:auto;display:flex;flex-direction:column;gap:6px}
#creador-bruno .cb-ficha h2{margin:0 0 2px;font-size:20px;color:#5a431f}
#creador-bruno .cb-nota{font-size:12px;color:#8a7650;font-style:italic;margin-bottom:4px}
#creador-bruno .cb-resumen{display:flex;flex-direction:column;gap:8px;margin-top:2px}
#creador-bruno .cb-resumen h3{margin:0 0 4px;font-size:15px;color:#8a6a2e;text-transform:uppercase;letter-spacing:1px}
#creador-bruno .cb-resumen ul{margin:0;padding:0;list-style:none;font-size:13.5px;line-height:1.4}
#creador-bruno .cb-resumen li.pro::before{content:'+ ';color:#4a7a3a;font-weight:bold}
#creador-bruno .cb-resumen li.con::before{content:'− ';color:#a8452e;font-weight:bold}
#creador-bruno .cb-frase{margin:0 0 3px 112px;font-size:13px;line-height:1.3;color:#7a6642;font-style:italic}
#creador-bruno .cb-barras{display:flex;flex-direction:column;gap:7px;margin-top:6px}
#creador-bruno .cb-barra{font-size:13px;color:#6b573a}
#creador-bruno .cb-riel{position:relative;height:10px;background:#e0d1a8;border-radius:5px;margin-top:3px}
#creador-bruno .cb-riel::after{content:'';position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:#8a7650}
#creador-bruno .cb-val{position:absolute;top:0;bottom:0;border-radius:5px}
#creador-bruno .cb-al{color:#a8452e;font-size:12px}
@media (max-width:1100px){#creador-bruno .cb-ficha{display:none}}
`;

const h = (tag, atr = {}, ...hijos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(atr)) { if (k === 'class') n.className = v; else if (k === 'onclick') n.addEventListener('click', v); else n.setAttribute(k, v); }
  for (const x of hijos.flat()) if (x !== null && x !== undefined) n.append(x);
  return n;
};
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });

// `opciones`: { genoma, modo: 'crear' | 'rehacer', ropa (lo de «Tu personaje», para ver la ropa de abrigo en 'rehacer'), alAceptar(genoma), alCancelar() }. Devuelve { cerrar }.
export function abrirCreador({ genoma: inicial, modo = 'crear', ropa = null, alAceptar, alCancelar }) {
  let genoma = sanearGenoma(inicial), pantalla = 1, figura = null, ultimoAspecto = '', giro = 0.55, girar = true, arrastre = null, cerrado = false, cuadro = 0;
  const raiz = h('div', { id: 'creador-bruno', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Crear a ${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}` });
  const estilo = h('style'); estilo.textContent = CSS;
  const lienzo = document.createElement('canvas');
  const panel = h('div', { class: 'cb-panel' });
  raiz.append(estilo, lienzo, panel);

  // ---------------------------------------------------------------- la escena (su propio dibujante: se libera al cerrar)
  // 4.0.1: si no hay un segundo contexto 3D (placa que se cayó, demasiados contextos), no se cuelga la capa beige: devuelve null y quien lo abrió entra con el genoma de partida
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true }); } catch (e) { console.warn('creador: sin contexto 3D', e); return null; }
  document.body.appendChild(raiz);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#e7cfa0');
  escena.fog = new THREE.FogExp2('#e7cfa0', 0.045);
  escena.add(new THREE.HemisphereLight(0xffe2b8, 0x6b7a44, 0.95));
  const sol = new THREE.DirectionalLight(0xffd08a, 2.4); sol.position.set(-3.2, 3.4, 3.2); sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024); Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -2, near: 0.5, far: 14 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  escena.add(sol); escena.add(sol.target);
  const contra = new THREE.DirectionalLight(0xff9a60, 0.9); contra.position.set(3, 1.6, -3); escena.add(contra);
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(40, 40), lam('#8a9a58')); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
  const camino = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), lam('#b9aa86')); camino.rotation.x = -Math.PI / 2; camino.position.y = 0.004; camino.receiveShadow = true; escena.add(camino);
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
  const camara = new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 80);
  function ajustar() {
    const W = Math.max(320, window.innerWidth), H = Math.max(240, window.innerHeight);
    renderer.setSize(W, H, false);
    camara.aspect = W / H;
    camara.setViewOffset(W, H, Math.round(W * 0.134), 0, W, H);   // la figura queda entre la tarjeta de la izquierda y el panel
    camara.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- la figura
  const aspectoActual = () => (modo === 'rehacer' && ropa ? aspectoJugadorBruno({ ...genoma, creado: true }, ropa) : aspectoDeGenoma(genoma));
  function armarFigura() {
    const aspecto = aspectoActual(), huella = JSON.stringify(aspecto);
    if (huella === ultimoAspecto && figura) return;
    ultimoAspecto = huella;
    if (figura) { escena.remove(figura.g); soltarPersona(figura); figura = null; }
    figura = crearPersona({}, 'bruno-creador', false, {}, { aspecto });
    figura.g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    figura.__gesto = 'neutral'; figura.__cerca = true; figura.__quietud = null;
    figura.fase = 0; figura.pose = null; figura.pos = figura.g.position; figura.clave = 'bruno-creador';
    figura.brazos[0].rotation.z = -0.05; figura.brazos[1].rotation.z = 0.05;
    escena.add(figura.g);
  }
  let antes = performance.now();
  function bucle(t) {
    if (cerrado) return;
    const dt = Math.min(0.05, (t - antes) / 1000); antes = t;
    if (girar) giro += dt * 0.35;
    if (figura) {
      figura.g.rotation.y = giro;
      escena.updateMatrixWorld(true);
      figura.cabeza.rotation.set(0, 0, 0); figura.torso.rotation.set(0, 0, 0);
      if (figura.alPosar) figura.alPosar(figura, dt, camara, false, false);
    }
    camara.position.set(0, 1.18, 3.85); camara.lookAt(0, 0.95, 0);
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(bucle);
  }
  const alBajar = (e) => { arrastre = e.clientX; girar = false; };
  const alSoltar = () => { arrastre = null; };
  const alMover = (e) => { if (arrastre !== null) { giro += (e.clientX - arrastre) * 0.01; arrastre = e.clientX; } };
  lienzo.addEventListener('pointerdown', alBajar); addEventListener('pointerup', alSoltar); addEventListener('pointermove', alMover);

  // ---------------------------------------------------------------- el panel
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
      ? h('button', { class: 'cb-muestra' + (elegido(o.id) ? ' sel' : ''), style: `background:${o.color}`, title: o.nombre, 'aria-label': `${ETIQUETA[campo]}: ${o.nombre}`, 'aria-pressed': String(elegido(o.id)), onclick: () => cambiar(campo, o.id) })
      : h('button', { class: 'cb-chip' + (elegido(o.id) ? ' sel' : ''), 'aria-pressed': String(elegido(o.id)), onclick: () => cambiar(campo, o.id) }, o.nombre)));
  }
  // en 'rehacer' la ropa de abrigo es la de «Tu personaje»: no se elige acá
  const bloquesDe = (p) => (modo === 'rehacer' ? p.id !== 'ropa' : true);
  // la frase de lo elegido (sólo en el carácter): una línea chica bajo la fila; con los dos gustos, las dos
  function frases(campo) {
    if (!TARJETAS[campo]) return null;
    const ids = campo === 'gustos' ? genoma.gustos : [genoma[campo]];
    return h('p', { class: 'cb-frase' }, ids.map((id) => fraseDe(campo, id)).filter(Boolean).join(' '));
  }
  function bloque(p) {
    return h('section', { class: 'cb-bloque' }, h('h2', {}, p.nombre), p.campos.flatMap((c) => [h('div', { class: 'cb-fila' }, h('label', {}, ETIQUETA[c.campo]), opciones(c.campo, c.lista)), frases(c.campo)]));
  }
  function lineas() {
    const { pros, contras } = lineasDeBruno(genoma);
    return [pros.map((t) => h('li', { class: 'pro' }, t)), contras.map((t) => h('li', { class: 'con' }, t))];
  }
  function barras() {
    const a = efectosAplicados(genoma), b = efectosBrutos(genoma), tope = new Set(sistemasAlTope(genoma));
    return h('div', { class: 'cb-barras' }, SISTEMAS.map((s) => {
      const v = a[s] / TOPES[s], ancho = Math.abs(v) * 50;
      const val = h('div', { class: 'cb-val', style: `${v >= 0 ? 'left:50%' : 'right:50%'};width:${ancho}%;background:${v >= 0 ? '#6a9a4a' : '#c4684a'}` });
      return h('div', { class: 'cb-barra' }, NOMBRE_SISTEMA[s][0].toUpperCase() + NOMBRE_SISTEMA[s].slice(1), h('div', { class: 'cb-riel' }, val), tope.has(s) ? h('div', { class: 'cb-al' }, b[s] > 0 ? 'ya está al máximo' : 'ya no empeora más') : null);
    }));
  }
  function pintarFicha() {
    raiz.querySelector('.cb-ficha')?.remove();
    if (modo !== 'crear' || pantalla !== 2) return;
    const [pros, contras] = lineas();
    raiz.appendChild(h('div', { class: 'cb-ficha' }, h('h2', {}, 'Pros y contras de Bruno'),       h('div', { class: 'cb-resumen' }, h('div', {}, h('h3', {}, 'A su favor'), h('ul', {}, pros)), h('div', {}, h('h3', {}, 'En su contra'), h('ul', {}, contras))), barras()));
  }
  function azar() {
    let s = Math.floor(Math.random() * 1e9);
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const g = { ...genoma };
    for (const p of PERSONALIZACIONES) if (bloquesDe(p) && p.pantalla === (pantalla === 1 ? 'aspecto' : 'historia')) for (const c of p.campos) {
      const lis = c.campo === 'campera' ? opcionesAlCrear('campera') : c.lista;
      if (c.campo === 'gustos') { const a = lis[Math.floor(rnd() * lis.length)].id; let b = a; while (b === a) b = lis[Math.floor(rnd() * lis.length)].id; g.gustos = [a, b]; } else g[c.campo] = lis[Math.floor(rnd() * lis.length)].id;
    }
    genoma = sanearGenoma(g); armarFigura(); pintar();
  }
  // El retrato: la cara, de frente y un poco de costado, en una foto chica (240 × 300) en JPEG. Se saca ANTES de cerrar (todavía hay dibujante) y se guarda en la partida.
  function sacarRetrato() {
    try {
      if (!figura) return '';
      const alto = aspectoActual().cuerpo.alto || 1;
      renderer.setPixelRatio(1);   // 4.0.1: con la escala de Windows en 150 o 200 % el retrato salía de 360x450 o 480x600 y pasaba el tope del guardado (se descartaba sin avisar)
      renderer.setSize(240, 300, false);
      camara.aspect = 240 / 300; camara.clearViewOffset(); camara.fov = 24; camara.updateProjectionMatrix();
      figura.g.rotation.y = 0.28;
      escena.updateMatrixWorld(true);
      camara.position.set(0.18 * alto, 1.56 * alto, 1.35); camara.lookAt(0, 1.5 * alto, 0);
      renderer.render(escena, camara);
      return lienzo.toDataURL('image/jpeg', 0.82);
    } catch { return ''; }
  }
  function aceptar() { const g = sanearGenoma(genoma); const retrato = sacarRetrato(); cerrar(); alAceptar?.(g, retrato); }
  function cancelar() { cerrar(); alCancelar?.(); }
  function pintar() {
    panel.innerHTML = '';
    const pasos = modo === 'crear'
      ? h('div', { class: 'cb-paso' }, h('b', { class: pantalla === 1 ? 'act' : '' }, '1 · Su aspecto'), h('b', { class: pantalla === 2 ? 'act' : '' }, '2 · Su historia'))
      : h('div', { class: 'cb-paso' }, h('b', { class: 'act' }, 'Su aspecto'));
    panel.append(h('header', {}, h('h1', {}, `${PROTAGONISTA.nombre} ${PROTAGONISTA.apellido}`), h('p', { class: 'cb-sub' }, `${PROTAGONISTA.edad} años · llega al valle buscando paz, lejos del ruido de la ciudad`), pasos));
    const cuerpo = h('div', { class: 'cb-cuerpo' });
    cuerpo.append(...PERSONALIZACIONES.filter((p) => bloquesDe(p) && p.pantalla === (pantalla === 1 ? 'aspecto' : 'historia')).map(bloque));
    pintarFicha();
    const principal = modo === 'rehacer' ? h('button', { class: 'cb-boton principal', onclick: aceptar }, 'Listo')
      : pantalla === 1 ? h('button', { class: 'cb-boton principal', onclick: () => { pantalla = 2; pintar(); } }, 'Siguiente') : h('button', { class: 'cb-boton principal', onclick: aceptar }, 'Empezar');
    panel.append(cuerpo, h('div', { class: 'cb-pie' }, h('div', { class: 'cb-izq' },
      modo === 'rehacer' ? h('button', { class: 'cb-boton', onclick: cancelar }, 'Cancelar') : null,
      pantalla === 2 ? h('button', { class: 'cb-boton', onclick: () => { pantalla = 1; pintar(); } }, 'Volver') : null,
      h('button', { class: 'cb-boton', onclick: azar }, 'Al azar')), principal));
    panel.querySelector('.cb-boton.principal')?.focus({ preventScroll: true });
  }
  // mientras está abierta, el resto del juego no recibe teclas (sí los botones: Tab, Enter y Espacio); Escape cancela sólo al rehacer
  const alTeclear = (e) => {
    e.stopPropagation();
    if (e.key === 'Tab') {   // 4.0.2: el foco no se va a los botones de la portada que están detrás: con Tab (y Mayús+Tab) da la vuelta adentro
      const fs = [...raiz.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
      if (fs.length) {
        const k = fs.indexOf(document.activeElement);
        if (k < 0 || (!e.shiftKey && k === fs.length - 1) || (e.shiftKey && k === 0)) { e.preventDefault(); fs[k < 0 || !e.shiftKey ? 0 : fs.length - 1].focus({ preventScroll: true }); }
      }
    }
    if (e.key === 'Escape' && modo === 'rehacer') { e.preventDefault(); cancelar(); }
  };
  const alSoltarTecla = (e) => e.stopPropagation();
  window.addEventListener('keydown', alTeclear, true); window.addEventListener('keyup', alSoltarTecla, true);

  function cerrar() {
    if (cerrado) return;
    cerrado = true;
    cancelAnimationFrame(cuadro);
    window.removeEventListener('keydown', alTeclear, true); window.removeEventListener('keyup', alSoltarTecla, true); removeEventListener('pointerup', alSoltar); removeEventListener('pointermove', alMover); removeEventListener('resize', ajustar);
    if (figura) { escena.remove(figura.g); soltarPersona(figura); figura = null; }
    escena.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.()); });
    renderer.dispose(); renderer.forceContextLoss?.();
    raiz.remove();
  }
  addEventListener('resize', ajustar);
  try { ajustar(); armarFigura(); pintar(); } catch (e) { console.warn('creador: no se pudo armar la figura', e); cerrar(); return null; }   // 4.0.1
  cuadro = requestAnimationFrame(bucle);
  return { cerrar, genoma: () => genoma, pantalla: (n) => { pantalla = n; pintar(); }, elegir: cambiar };
}
