// 4.0 (prototipo) · LA ALDEA DE NOCHE: halos aditivos en las ventanas, los faroles, la puerta de la cantina y el reloj de la plaza, y charcos de luz
// cálida en el suelo bajo cada farol (y frente a la puerta de la cantina). SIN luces dinámicas nuevas (el motor sigue con las fijas de luces.js): son dos
// mallas aditivas baratas, un dibujo cada una, que reutilizan los halos y el charco de la casa de té (casa-te-luz.js). Sólo con `calidad.post` (media y
// alta); en baja quedan los vidrios emisivos de siempre. aldea-mundo.js arma las listas (`reconstruir`) cuando cambian los locales y llama a `actualizar`.
// Módulo de render: no se prueba en Node. Sin textos.
import * as THREE from 'three';
import { crearMaterialHalo, geoHalos, geoPlano, lienzo, pintarCharco } from './casa-te-luz.js';

// un charco cuadrado en el suelo: `esquinas` = 4 puntos [x, y, z] en el orden de las esquinas del uv
export function crearLuzAldeaNoche(escena) {
  const { mat: matHalo, uniforms } = crearMaterialHalo();
  const matCharco = new THREE.MeshBasicMaterial({ map: lienzo(128, 128, pintarCharco, false), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  let halos = null, charcos = null;
  const soltar = (m) => { if (!m) return; escena.remove(m); m.geometry.dispose(); };
  // `listaHalos`: [{ pos, radio, fluctua, soloNoche }]; `listaCharcos`: [{ pts, col }] (ver geoPlano de casa-te-luz.js)
  function reconstruir(listaHalos, listaCharcos) {
    soltar(halos); soltar(charcos); halos = charcos = null;
    if (listaHalos.length) {
      halos = new THREE.Mesh(geoHalos(listaHalos), matHalo);
      halos.name = 'halos-aldea-noche'; halos.frustumCulled = false; halos.renderOrder = 3; halos.visible = false;
      escena.add(halos);
    }
    if (listaCharcos.length) {
      charcos = new THREE.Mesh(geoPlano(listaCharcos), matCharco);
      charcos.name = 'charcos-aldea-noche'; charcos.renderOrder = 2; charcos.frustumCulled = false; charcos.visible = false;
      escena.add(charcos);
    }
  }
  // `enc`: 0 a 1, qué tan prendido el alumbrado; `pleno`: calidad con postproceso; `cerca`: con la aldea a tiro
  function actualizar({ enc, pleno, tiempo, cerca }) {
    const ver = pleno && cerca && enc > 0.02;
    if (halos) halos.visible = ver;
    if (charcos) { charcos.visible = ver; matCharco.color.setScalar(0.1 + 0.4 * enc); }
    uniforms.uEnc.value = enc; uniforms.uBrillo.value = 0; uniforms.uTiempo.value = tiempo;
  }
  return { reconstruir, actualizar, malla: () => ({ halos, charcos }) };
}
