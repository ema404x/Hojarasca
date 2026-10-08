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
  const geoPlaca = new THREE.BoxGeometry(0.34, 0.42, 0.07);
  const mats = {};
  const matDe = (clase) => {
    if (mats[clase]) return mats[clase];
    const A = ASPECTO_CLASE[clase] || ASPECTO_CLASE.cuerpo;
    const borde = new THREE.Color(A.borde);
    return (mats[clase] = new THREE.MeshLambertMaterial({ color: A.placa, emissive: borde, emissiveIntensity: 0.28 }));
  };
  function ponerPlacas(a, clase) {
    let g = a.m.placas;
    if (!g) {
      g = new THREE.Group();
      g.name = 'placas-adaptado';
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(geoPlaca, matDe(clase));
        const ang = (i / 5) * Math.PI * 2 + 0.3;
        m.userData.ang = ang;
        m.userData.alto = i % 2 ? 0.52 : 0.68;
        g.add(m);
      }
      a.m.g.add(g);
      a.m.placas = g;
    }
    const r = a.def.radio * 0.85, h = a.def.altura;
    const esc = Math.max(0.7, Math.min(2.4, a.def.radio / 0.45));
    for (const m of g.children) {
      m.material = matDe(clase);
      const ang = m.userData.ang;
      m.position.set(Math.sin(ang) * r, h * m.userData.alto, Math.cos(ang) * r);
      m.rotation.set(-0.15, ang, (m.userData.alto > 0.6 ? 0.2 : -0.2));
      m.scale.setScalar(esc);
    }
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
    texto: () => textoAdaptaciones(evo()),
    get estado() { return evo(); },
  };
}
