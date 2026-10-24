// 3.0: los invasores que evolucionan, en el mundo: las placas sobre los adaptados, el
// golpe que entra a medias y los avisos. Las reglas están en desafio-evolucion.js.
import * as THREE from 'three';
import { evolucionNueva, claseDeDano, anotarDano, cerrarNocheEvolucion, elegirAdaptacion, factorResistencia, avisoAtardecer, avisoAprendizaje, textoAdaptaciones, ASPECTO_CLASE, RESISTENTES } from './desafio-evolucion.js';

export function crearEvolucionMundo(efectos, sonido, api) {
  const evo = () => {
    const d = api.D();
    if (!d.evolucion || typeof d.evolucion !== 'object') d.evolucion = evolucionNueva();
    return d.evolucion;
  };

  // ---------------- las placas: una costra de cinco placas alrededor del torso, del
  // color de lo que aguantan. Cuelgan del grupo del invasor, como las alas del volador.
  // 3.8.0: en los duendes la costra es de corteza: lajas curvas y desparejas sobre los hombros y la
  // espalda (y el que aprendió viene más grande: ver etapaDe en desafio-duendes-reglas.js)
  const geoPlaca = (() => {
    const g = new THREE.BoxGeometry(0.34, 0.42, 0.07, 4, 3, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) - x * x * 1.4); p.setY(i, y + 0.025 * Math.sin(x * 23)); p.setX(i, x * (1 - 0.15 * (y + 0.21))); }
    g.computeVertexNormals();
    return g;
  })();
  const mats = {};
  const matDe = (clase) => {
    if (mats[clase]) return mats[clase];
    const A = ASPECTO_CLASE[clase] || ASPECTO_CLASE.cuerpo;
    const borde = new THREE.Color(A.borde);
    return (mats[clase] = new THREE.MeshLambertMaterial({ color: A.placa, emissive: borde, emissiveIntensity: 0.28 }));
  };
  // 4.10.3 (V3): las cinco placas de un duende, fundidas en UNA malla (antes eran cinco `Mesh` sueltas por duende adaptado: hasta ~190 dibujos de más en la noche más cargada).
  // La forma sólo depende del radio y la altura del modelo (unos diez), así que la geometría se arma una vez por modelo y se comparte.
  const ANGULOS_PLACA = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2 + 0.3);
  const geoPlacasDe = new Map();
  function placasFundidas(radio, altura) {
    const clave = `${radio.toFixed(3)}|${altura.toFixed(3)}`;
    let geo = geoPlacasDe.get(clave);
    if (geo) return geo;
    const r = radio * 0.6, esc = Math.max(0.3, Math.min(1.2, altura / 1.6));
    const origen = geoPlaca.attributes.position, normales = geoPlaca.attributes.normal, indice = geoPlaca.index;
    const pos = [], nor = [], idx = [];
    const v = new THREE.Vector3(), q = new THREE.Quaternion(), m = new THREE.Matrix4();
    ANGULOS_PLACA.forEach((ang, i) => {
      const alto = i % 2 ? 0.36 : 0.47;   // 3.8.0: el torso del duende queda más abajo (arriba es todo gorro)
      q.setFromEuler(new THREE.Euler(-0.15, ang, alto > 0.6 ? 0.2 : -0.2));
      m.compose(new THREE.Vector3(Math.sin(ang) * r, altura * alto, Math.cos(ang) * r), q, new THREE.Vector3(esc, esc, esc));
      const base = pos.length / 3;
      for (let k = 0; k < origen.count; k++) {
        v.fromBufferAttribute(origen, k).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(normales, k).applyQuaternion(q); nor.push(v.x, v.y, v.z);
      }
      for (let k = 0; k < indice.count; k++) idx.push(base + indice.getX(k));
    });
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    geoPlacasDe.set(clave, geo);
    return geo;
  }
  function ponerPlacas(a, clase) {
    let g = a.m.placas;
    // (3.8.0: los duendes son chiquitos: la costra va pegada al cuerpo y en proporción)
    const geo = placasFundidas(a.def.radio || 0.5, a.def.altura || 1.6);
    if (!g) {
      g = new THREE.Mesh(geo, matDe(clase));
      g.name = 'placas-adaptado';
      a.m.g.add(g);
      a.m.placas = g;
    }
    g.geometry = geo;
    g.material = matDe(clase);
    g.visible = true;
    // y el borde de la piel, del mismo color (se devuelve al bajar de nuevo)
    const u = a.m.uniformes?.();
    if (u?.uBorde) {
      if (!a.m.bordeOriginal) a.m.bordeOriginal = u.uBorde.value.clone();
      u.uBorde.value.set(ASPECTO_CLASE[clase]?.borde || '#ffffff');
    }
  }
  function sacarPlacas(a) {
    if (a.m.placas) a.m.placas.visible = false;
    const u = a.m.uniformes?.();
    if (u?.uBorde && a.m.bordeOriginal) u.uBorde.value.copy(a.m.bordeOriginal);
  }

  // Al bajar (desde bajarAlien, con el invasor ya reiniciado): ¿viene adaptado?
  function alBajar(a) {
    a.resiste = null; a.nivelResiste = 0;
    sacarPlacas(a);
    const e = evo();
    const clase = elegirAdaptacion(e, Math.random, !!a.def.jefe);
    if (!clase) return;
    a.resiste = clase;
    a.nivelResiste = e.niveles[clase] || 1;
    ponerPlacas(a, clase);
  }

  // En herirAlien: se anota con qué le pegaste y, si lo resiste, entra menos.
  let avisoNoche = -1;
  const _p = { x: 0, y: 0, z: 0 };
  function golpe(a, dano, fuente, detalle = null) {
    const clase = claseDeDano(fuente, detalle);
    if (!clase || !(dano > 0)) return dano;
    anotarDano(evo(), clase, dano);
    const k = factorResistencia(a.resiste, clase, a.nivelResiste);
    if (k >= 1) return dano;
    // el golpe rebota en las placas: chispas del color de la costra
    if (dano * k >= 3 && Math.random() < 0.6) {
      const p = a.m.g.position;
      _p.x = p.x; _p.y = p.y + a.def.altura * a.m.esc * 0.6; _p.z = p.z;
      efectos.chispas?.(_p, 4);
      if (fuente === 'jugador' || fuente === 'lanza') sonido.golpeRuido?.({ dur: 0.1, frec: 3200, q: 4, vol: 0.12, destino: sonido.bus?.efectos });
    }
    const d = api.D();
    if (avisoNoche !== d.oleadas && (fuente === 'jugador' || fuente === 'lanza')) {
      avisoNoche = d.oleadas;
      api.nota('Ese viene preparado', `Tiene costra de corteza: ${RESISTENTES[clase]}. Probá con otra cosa`);
    }
    return dano * k;
  }

  // Al amanecer: lo de la noche se aprende (o se olvida) y se avisa.
  function alAmanecer() {
    const d = api.D();
    const cambio = cerrarNocheEvolucion(evo(), d.oleadas);
    const t = avisoAprendizaje(cambio);
    if (t) setTimeout(() => api.nota(t.titulo, t.texto), 7500);
    return cambio;
  }
  // Una hora antes de que baje la nave.
  function alAtardecer() {
    const t = avisoAtardecer(evo());
    if (t) setTimeout(() => api.nota(t.titulo, t.texto, true), 3500);
    return t;
  }

  return {
    alBajar, golpe, alAmanecer, alAtardecer,
    sacarPlacas,   // 4.10.3 (V3): al morir o irse, las placas se van con él (no quedan paradas en el aire mientras cae y se deshace)
    texto: () => textoAdaptaciones(evo()),
    get estado() { return evo(); },
  };
}
