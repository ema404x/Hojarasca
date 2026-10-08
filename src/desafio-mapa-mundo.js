// 3.0: los lugares del mapa de la semilla, en el valle (ver desafio-mapa.js): la cantera,
// los cristales, la leña caída y los alijos. Se usan con E, como los capullos y el fortín
// (desafio.js los suma a `usarCercaDe` y `avisoCercaDe`, en ese orden, así el aviso y la
// tecla siguen la misma prioridad).
//
// Una malla por lugar, con la geometría y el material compartidos por tipo; lejos (más
// de 170 m) no se dibujan.
import * as THREE from 'three';
import { lam } from './vida.js';
import { mapaDePartida, mapaGuardadoNuevo, avisoSitio, usarSitio, faltaPara, marcasDelMapa, RADIO_USAR, RECURSOS } from './desafio-mapa.js';
import { generador, hashTexto } from './semilla.js';

const LEJOS = 170;

// Junta varias geometrías (sin índice) en una sola: una llamada de dibujo por lugar.
function juntar(partes) {
  const pos = [];
  for (const p of partes) { const g = p.index ? p.toNonIndexed() : p; pos.push(...g.attributes.position.array); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function geometrias() {
  const r = generador(hashTexto('mapa-mundo'));
  // piedras sueltas al pie de la ladera
  const rocas = juntar(Array.from({ length: 7 }, (_, i) => {
    const e = 0.35 + r() * 0.55, a = i * 0.9 + r(), d = i ? 0.8 + r() * 1.6 : 0;
    return new THREE.IcosahedronGeometry(e, 0).scale(1, 0.7, 1).translate(Math.cos(a) * d, e * 0.35, Math.sin(a) * d);
  }));
  // cristales que asoman de la tierra (conos de cinco caras, de a pares)
  const cristales = juntar(Array.from({ length: 6 }, (_, i) => {
    const h = 0.5 + r() * 0.9, a = i * 1.05, d = i ? 0.35 + r() * 0.7 : 0;
    const g = new THREE.ConeGeometry(0.16 + r() * 0.1, h, 5).translate(0, h / 2 - 0.05, 0);
    g.rotateZ((r() - 0.5) * 0.6); g.rotateX((r() - 0.5) * 0.6);
    return g.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
  }));
  // troncos caídos, cruzados
  const troncos = juntar(Array.from({ length: 4 }, (_, i) => {
    const l = 2.4 + r() * 1.4, rr = 0.18 + r() * 0.1;
    const g = new THREE.CylinderGeometry(rr, rr * 1.1, l, 7).rotateZ(Math.PI / 2).rotateY(i * 0.8 + r() * 0.4);
    return g.translate((r() - 0.5) * 1.2, rr + (i > 1 ? rr * 1.6 : 0), (r() - 0.5) * 1.2);
  }));
  // el alijo: un cajón con la tapa atada
  const alijo = juntar([new THREE.BoxGeometry(1.1, 0.7, 0.8).translate(0, 0.35, 0), new THREE.BoxGeometry(1.2, 0.08, 0.9).translate(0, 0.74, 0),
    new THREE.BoxGeometry(0.06, 0.74, 0.92).translate(-0.3, 0.37, 0), new THREE.BoxGeometry(0.06, 0.74, 0.92).translate(0.3, 0.37, 0)]);
  return { cantera: rocas, cristal: cristales, madera: troncos, alijo };
}

// `ctx`: { D, dia, nota, sumarMaterial, guardar, sonido }
export function crearMapaMundo(T, escena, ctx) {
  const grupo = new THREE.Group();
  grupo.name = 'mapa-semilla';
  escena.add(grupo);
  let geos = null, mats = null;
  let mallas = [];            // { sitio, mesh }
  let clave = null, mapa = null, reloj = 0;
  const usos = () => ctx.D().mapa?.usos || {};

  function armar() {
    if (!geos) {
      geos = geometrias();
      mats = {
        cantera: lam('#8a837a'),
        cristal: new THREE.MeshLambertMaterial({ color: '#5fd6c8', emissive: '#2fb8a8', emissiveIntensity: 0.55 }),
        madera: lam('#6b5238'),
        alijo: lam('#8a6a44'),
      };
    }
    for (const m of mallas) grupo.remove(m.mesh);
    mallas = [];
    for (const s of mapa.sitios) {
      const mesh = new THREE.Mesh(geos[s.tipo], mats[s.tipo]);
      mesh.position.set(s.x, T.altura(s.x, s.z) - 0.05, s.z);
      mesh.rotation.y = (hashTexto(s.id) % 628) / 100;
      mesh.castShadow = false;   // cosas chicas y lejos: no pagan una pasada de sombra
      mesh.name = `mapa-${s.tipo}`;
      grupo.add(mesh);
      mallas.push({ sitio: s, mesh });
    }
  }
  // Rehace las mallas si cambió el código o la base (al entrar a una partida nueva).
  function sincronizar() {
    const d = ctx.D();
    const k = `${d.semilla || ''}|${JSON.stringify(d.mapa?.base || null)}|${d.mapa?.deAntes ? 1 : 0}`;
    if (k !== clave) { clave = k; mapa = mapaDePartida(d); armar(); }
    return mapa;
  }
  function visibles(pos) {
    const u = usos(), dia = ctx.dia();
    for (const { sitio, mesh } of mallas) {
      const usado = faltaPara(u, sitio, dia) > 0;
      mesh.visible = !usado && (!pos || Math.hypot(pos.x - sitio.x, pos.z - sitio.z) < LEJOS);
    }
  }
  function actualizar(dt, js) {
    reloj -= dt;
    if (reloj > 0 && mapa) return;
    reloj = 1;
    sincronizar();
    visibles(js?.pos);
  }
  function cerca(pos) {
    if (!mapa) sincronizar();
    let mejor = null, d0 = RADIO_USAR;
    for (const s of mapa.sitios) {
      const d = Math.hypot(s.x - pos.x, s.z - pos.z);
      if (d < d0) { d0 = d; mejor = s; }
    }
    return mejor;
  }
  function avisoCerca(pos) {
    const s = cerca(pos);
    return s ? avisoSitio(usos(), s, ctx.dia()) : null;
  }
  function usarCerca(pos) {
    const s = cerca(pos);
    if (!s) return false;
    const d = ctx.D();
    // una partida de antes de la 3.0 empieza a recordar lo que juntó (sigue siendo de antes)
    if (!d.mapa) d.mapa = mapaGuardadoNuevo(null, true);
    const r = usarSitio(d.mapa.usos, s, ctx.dia());
    if (!r.ok) { ctx.nota(RECURSOS[s.tipo].nombre, avisoSitio(d.mapa.usos, s, ctx.dia())); return true; }
    const NOMBRES = { piedra: 'piedras', cristal: 'semillas doradas', tronco: 'troncos', tabla: 'tablas' };
    const partes = [];
    for (const [k, n] of Object.entries(r.da)) {
      if (Object.hasOwn(NOMBRES, k)) { ctx.sumarMaterial(k, n); partes.push(`+${n} ${NOMBRES[k]}`); }
      else if (k === 'emplastos') { d.emplastos = (d.emplastos || 0) + n; partes.push(`+${n} ${n === 1 ? 'emplasto' : 'emplastos'}`); }
    }
    ctx.sonido?.juntar?.();
    const r0 = RECURSOS[s.tipo];
    ctx.nota(r0.nombre.charAt(0).toUpperCase() + r0.nombre.slice(1), `${partes.join(' · ')}${r0.rebrota ? ` · vuelve a dar en ${r0.rebrota} días` : ''}`);
    visibles(null);
    ctx.guardar();
    return true;
  }
  return {
    actualizar, sincronizar, avisoCerca, usarCerca, cerca,
    get mapa() { return mapa || sincronizar(); },
    // para el mapa de papel (chinches.js → mapa.js)
    marcas: () => marcasDelMapa(mapa || sincronizar(), usos(), ctx.dia()),
    get mallas() { return mallas; },
  };
}
