// Fusionar lo que no se mueve.
//
// Dibujar cuesta por objeto, no por triángulo. Un poste de corral son doce triángulos
// —nada— pero es una llamada de dibujo entera, igual que el galpón de ocho mil. El
// galpón tenía dieciocho postes sueltos: dieciocho llamadas para 216 triángulos.
//
// Esto junta las mallas hermanas que comparten material en una sola. No es una
// optimización a ciegas: sólo toca lo que no puede moverse ni consultarse desde
// afuera, y deja intacto todo lo demás.
//
// Una malla se fusiona solamente si:
//   · no tiene nombre (las que tienen nombre se buscan desde el juego),
//   · no tiene hijos ni datos propios (`userData`),
//   · no está instanciada ni es un sprite,
//   · comparte la MISMA instancia de material con otra hermana —no el mismo color: la
//     misma instancia—, porque el juego le cambia el color al material para prender las
//     ventanas de noche, y eso tiene que seguir funcionando,
//   · tiene los mismos atributos de geometría y las mismas banderas de sombra.
import * as THREE from 'three';

const _m3 = new THREE.Matrix3();

// Los atributos que se saben copiar. Si una geometría trae otro, no se fusiona.
const ATRIBUTOS = ['position', 'normal', 'uv', 'color'];

function firma(m) {
  const mat = Array.isArray(m.material) ? null : m.material;
  if (!mat) return null;
  const atrib = Object.keys(m.geometry.attributes).sort();
  if (atrib.some((a) => !ATRIBUTOS.includes(a))) return null;
  return [mat.uuid, atrib.join('+'), m.castShadow ? 1 : 0, m.receiveShadow ? 1 : 0, m.renderOrder | 0, m.frustumCulled ? 1 : 0].join('|');
}

function fusionable(m) {
  return m.isMesh && !m.isInstancedMesh && !m.isSkinnedMesh
    && m.visible && !m.name && m.children.length === 0
    && !Array.isArray(m.material) && !!m.geometry
    && Object.keys(m.userData || {}).length === 0
    && !!m.geometry.attributes.position;
}

// Junta las geometrías de varias mallas en una sola, llevando cada una a su lugar.
function unir(mallas) {
  const atrib = Object.keys(mallas[0].geometry.attributes);
  const partes = {};
  for (const a of atrib) partes[a] = [];
  for (const m of mallas) {
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    m.updateMatrix();
    const normales = _m3.getNormalMatrix(m.matrix);
    for (const a of atrib) {
      const at = geo.attributes[a];
      if (!at) return null;                       // una trae menos que las otras: no se fusiona
      const v = new THREE.Vector3();
      for (let i = 0; i < at.count; i++) {
        if (a === 'position') {
          v.fromBufferAttribute(at, i).applyMatrix4(m.matrix);
          partes[a].push(v.x, v.y, v.z);
        } else if (a === 'normal') {
          v.fromBufferAttribute(at, i).applyMatrix3(normales).normalize();
          partes[a].push(v.x, v.y, v.z);
        } else {
          for (let k = 0; k < at.itemSize; k++) partes[a].push(at.getComponent(i, k));
        }
      }
    }
    if (geo !== m.geometry) geo.dispose();
  }
  const g = new THREE.BufferGeometry();
  for (const a of atrib) {
    const tam = mallas[0].geometry.attributes[a].itemSize;
    g.setAttribute(a, new THREE.Float32BufferAttribute(partes[a], tam));
  }
  g.computeBoundingSphere();
  return g;
}

// Recorre un objeto y fusiona, en cada nivel, las mallas hermanas que comparten
// material. Devuelve cuántas llamadas de dibujo se ahorraron.
export function fusionarPorMaterial(raiz, { minimo = 2 } = {}) {
  if (!raiz) return 0;
  let ahorro = 0;
  const grupos = [];
  raiz.traverse((o) => { if (o.children && o.children.length > 1) grupos.push(o); });
  for (const padre of grupos) {
    const porFirma = new Map();
    for (const h of padre.children) {
      if (!fusionable(h)) continue;
      const f = firma(h);
      if (!f) continue;
      if (!porFirma.has(f)) porFirma.set(f, []);
      porFirma.get(f).push(h);
    }
    for (const mallas of porFirma.values()) {
      if (mallas.length < minimo) continue;
      const geo = unir(mallas);
      if (!geo) continue;
      const modelo = mallas[0];
      const juntas = new THREE.Mesh(geo, modelo.material);
      juntas.castShadow = modelo.castShadow;
      juntas.receiveShadow = modelo.receiveShadow;
      juntas.renderOrder = modelo.renderOrder;
      juntas.frustumCulled = modelo.frustumCulled;
      for (const m of mallas) { padre.remove(m); m.geometry.dispose(); }
      padre.add(juntas);
      ahorro += mallas.length - 1;
    }
  }
  return ahorro;
}

// Cuántas mallas visibles cuelgan de algo: sirve para medir el antes y el después.
export function contarMallas(raiz) {
  let n = 0;
  if (raiz) raiz.traverse((o) => { if (o.isMesh && o.visible) n++; });
  return n;
}
