// 4.4 · Comprar un negocio de un vecino: lo que se ve en el mundo (las reglas, en negocios-vecinos.js; el enganche con el juego, en negocios-vecinos-juego.js).
//   · el cartel del dueño nuevo: un poste con una tabla pintada que dice el nombre del local y «de Bruno», al lado de la puerta del negocio que compraste.
// Una malla por cartel, estática (se arma una vez al comprar o al cargar la partida, y sólo se muestra de cerca). Nada corre por cuadro. La tabla lleva su
// propio dibujo (un lienzo chico) y se ilumina como todo lo demás, así de noche no brilla.
import * as THREE from 'three';

const _tablas = new Map();
// El dibujo de la tabla: madera pintada, el nombre del local arriba y «de …» abajo
export function pintarTabla(g, ancho, alto, linea1, linea2) {
  const fondo = g.createLinearGradient(0, 0, 0, alto);
  fondo.addColorStop(0, '#6f5133'); fondo.addColorStop(1, '#5a4129');
  g.fillStyle = fondo; g.fillRect(0, 0, ancho, alto);
  // las vetas
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(35,22,10,${0.06 + ((i * 7) % 10) / 90})`; g.lineWidth = 1 + (i % 3); const y = (i + 0.5) * (alto / 18); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(ancho * 0.3, y + 2, ancho * 0.7, y - 2, ancho, y); g.stroke(); }
  g.strokeStyle = 'rgba(232,214,170,0.75)'; g.lineWidth = 5; g.strokeRect(10, 10, ancho - 20, alto - 20);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const familia = '"Spectral", Georgia, serif';
  let tam = 66;
  g.font = `700 ${tam}px ${familia}`;
  while (tam > 24 && g.measureText(linea1).width > ancho - 70) { tam -= 3; g.font = `700 ${tam}px ${familia}`; }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillText(linea1, ancho / 2 + 2, alto * 0.37 + 3);
  g.fillStyle = '#f1e2bd'; g.fillText(linea1, ancho / 2, alto * 0.37);
  let t2 = 54;
  g.font = `italic 600 ${t2}px ${familia}`;
  while (t2 > 22 && g.measureText(linea2).width > ancho - 90) { t2 -= 3; g.font = `italic 600 ${t2}px ${familia}`; }
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillText(linea2, ancho / 2 + 2, alto * 0.72 + 3);
  g.fillStyle = '#e8c46a'; g.fillText(linea2, ancho / 2, alto * 0.72);
}

export function crearNegociosVecinosMundo({ escena }) {
  const grupo = new THREE.Group();
  grupo.name = 'negocios-vecinos';
  escena.add(grupo);
  const carteles = new Map();
  const madera = new THREE.MeshLambertMaterial({ color: '#4d3822' });
  const geoPoste = new THREE.CylinderGeometry(0.055, 0.065, 1.7, 6);
  const geoTabla = new THREE.BoxGeometry(1.5, 0.56, 0.07);
  const geoTecho = new THREE.BoxGeometry(1.62, 0.07, 0.16);

  function tabla(linea1, linea2) {
    let material = null;
    if (typeof document !== 'undefined') {
      try {
        const lienzo = document.createElement('canvas');
        lienzo.width = 512; lienzo.height = 192;
        pintarTabla(lienzo.getContext('2d'), 512, 192, linea1, linea2);
        const tex = new THREE.CanvasTexture(lienzo);
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        material = new THREE.MeshLambertMaterial({ map: tex });
      } catch { material = null; }
    }
    return material || new THREE.MeshLambertMaterial({ color: '#6f5133' });
  }
  function armar(linea1, linea2) {
    const c = new THREE.Group();
    const poste = new THREE.Mesh(geoPoste, madera); poste.position.set(0, 0.85, 0);
    const cara = tabla(linea1, linea2);
    const t = new THREE.Mesh(geoTabla, [madera, madera, madera, madera, cara, madera]); t.position.set(0, 1.55, 0.03);
    const techo = new THREE.Mesh(geoTecho, madera); techo.position.set(0, 1.9, 0.03);
    for (const m of [poste, t, techo]) { m.castShadow = false; m.receiveShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); c.add(m); }
    c.userData.cara = cara;
    return c;
  }
  return {
    grupo,
    // el cartel del local `id` en (x, y, z), con la cara hacia `giro`; `l1` y `l2`: las dos líneas de la tabla
    ponerCartel(id, x, y, z, giro, l1, l2) {
      const clave = `${l1}|${l2}`;
      let c = carteles.get(id);
      if (c && c.userData.clave !== clave) { this.quitarCartel(id); c = null; }
      if (!c) { c = armar(l1, l2); c.userData.clave = clave; c.visible = false; carteles.set(id, c); grupo.add(c); }
      c.position.set(x, y, z); c.rotation.y = giro; c.updateMatrix(); c.updateMatrixWorld(true);
    },
    quitarCartel(id) {
      const c = carteles.get(id);
      if (!c) return;
      grupo.remove(c);
      c.userData.cara?.map?.dispose?.(); c.userData.cara?.dispose?.();
      carteles.delete(id);
    },
    verCartel(id, si) { const c = carteles.get(id); if (c && c.visible !== !!si) c.visible = !!si; },
    cartel: (id) => carteles.get(id) || null,
    carteles: () => [...carteles.keys()],
  };
}
