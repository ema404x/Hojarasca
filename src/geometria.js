// Ensamblado de geometrías con color por vértice, tipo de material y normales suaves
import * as THREE from 'three';

const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

export function h3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

export function matriz(pos = [0, 0, 0], rot = [0, 0, 0], esc = [1, 1, 1]) {
  _e.set(rot[0], rot[1], rot[2], 'YXZ');
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(...pos), _q.clone(), new THREE.Vector3(...esc));
}

// Deforma una geometría de forma consistente (vértices iguales se mueven igual)
export function abollar(geo, fuerza, escala = 1.7) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const kx = Math.round(x * 1000) / 1000, ky = Math.round(y * 1000) / 1000, kz = Math.round(z * 1000) / 1000;
    const d = (h3(kx * escala, ky * escala, kz * escala) - 0.5) * 2 * fuerza;
    const l = Math.hypot(x, y, z) || 1;
    p.setXYZ(i, x + (x / l) * d, y + (y / l) * d, z + (z / l) * d);
  }
  return geo;
}

// 2.7: normales suaves con ángulo de quiebre. Promedia la normal de las caras que
// comparten un vértice (por posición, así también cose la costura de los cilindros y
// los icosaedros, que vienen sin índice) sólo si forman menos de `quiebre` radianes
// con la cara propia: un tronco o una piedra dejan de verse facetados, pero la tapa
// de un cilindro o la arista de una caja siguen siendo aristas.
function normalesSuaves(geo, quiebre = 1.05) {
  const p = geo.attributes.position, n = p.count;
  const fn = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    b.sub(a); c.sub(a); b.cross(c);   // sin normalizar: pondera por área
    for (let k = 0; k < 3; k++) { fn[(i + k) * 3] = b.x; fn[(i + k) * 3 + 1] = b.y; fn[(i + k) * 3 + 2] = b.z; }
  }
  const grupos = new Map();
  const clave = (i) => Math.round(p.getX(i) * 1e4) + '|' + Math.round(p.getY(i) * 1e4) + '|' + Math.round(p.getZ(i) * 1e4);
  for (let i = 0; i < n; i++) { const k = clave(i); let g = grupos.get(k); if (!g) grupos.set(k, g = []); g.push(i); }
  const cosQ = Math.cos(quiebre), out = new Float32Array(n * 3);
  for (const g of grupos.values()) {
    for (const i of g) {
      const ix = fn[i * 3], iy = fn[i * 3 + 1], iz = fn[i * 3 + 2];
      const il = Math.hypot(ix, iy, iz) || 1;
      let sx = 0, sy = 0, sz = 0;
      for (const j of g) {
        const jx = fn[j * 3], jy = fn[j * 3 + 1], jz = fn[j * 3 + 2];
        const jl = Math.hypot(jx, jy, jz) || 1;
        if ((ix * jx + iy * jy + iz * jz) / (il * jl) >= cosQ) { sx += jx; sy += jy; sz += jz; }
      }
      const l = Math.hypot(sx, sy, sz) || 1;
      out[i * 3] = sx / l; out[i * 3 + 1] = sy / l; out[i * 3 + 2] = sz / l;
    }
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
}

export class Constructor {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.tipo = []; }

  // opciones: color (hex o Color), tipo, matriz, variar, sombraAbajo [y0,y1], esferica (true usa centro local)
  // 2.7: suave (normales suaves con quiebre), esferica numérica (peso de la normal esférica),
  // centro ([x,y,z] local para la normal esférica). (3.2: se fueron las cartas de hojas con
  // uv y recorte por alfa: el follaje es de bultos pintados.)
  // 3.2: degradado ([colorBajo, colorAlto]): el color va de uno al otro según la altura local
  // (rangoY [y0, y1], o la caja de la pieza) o según `tono(x, y, z)` → 0..1 en coordenadas
  // locales. Es el sombreado pintado de las copas: base oscura y fría, puntas claras y cálidas.
  agregar(geoOriginal, o) {
    let geo = geoOriginal.index ? geoOriginal.toNonIndexed() : geoOriginal.clone();
    const esferica = o.esferica;
    const pesoEsf = esferica === true ? 0.9 : (Number(esferica) || 0);
    const local = geo.attributes.position;
    const centroides = esferica ? new THREE.Vector3(...(o.centro || [0, 0, 0])) : null;
    const suave = o.suave ?? geoOriginal.userData?.suave;
    if (suave) normalesSuaves(geo, suave === true ? 1.05 : suave);
    else geo.computeVertexNormals();
    const nLocal = geo.attributes.normal;
    const M = o.matriz || new THREE.Matrix4();
    const NM = new THREE.Matrix3().getNormalMatrix(M);
    const base = new THREE.Color(o.color);
    const variar = o.variar ?? 0.12;
    const grad = o.degradado ? [new THREE.Color(o.degradado[0]), new THREE.Color(o.degradado[1])] : null;
    let gy0 = 0, gy1 = 1;
    if (grad && !o.tono) {
      if (o.rangoY) [gy0, gy1] = o.rangoY;
      else { geo.computeBoundingBox(); gy0 = geo.boundingBox.min.y; gy1 = geo.boundingBox.max.y; }
    }
    for (let i = 0; i < local.count; i++) {
      _v.fromBufferAttribute(local, i);
      const tGrad = grad ? THREE.MathUtils.clamp(o.tono ? o.tono(_v.x, _v.y, _v.z) : THREE.MathUtils.smoothstep(_v.y, gy0, gy1), 0, 1) : 0;
      if (esferica) {
        const plano = _n.fromBufferAttribute(nLocal, i);
        const esf = _v.clone().sub(centroides).normalize();
        _n.copy(esf.multiplyScalar(pesoEsf).add(plano.multiplyScalar(1 - pesoEsf))).normalize();
      } else {
        _n.fromBufferAttribute(nLocal, i);
      }
      const yLocal = _v.y;
      _v.applyMatrix4(M);
      _n.applyMatrix3(NM).normalize();
      this.pos.push(_v.x, _v.y, _v.z);
      this.nor.push(_n.x, _n.y, _n.z);
      let f = 1 - variar + 2 * variar * h3(_v.x * 3.1, _v.y * 2.7, _v.z * 3.9);
      if (o.sombraAbajo) f *= 0.5 + 0.5 * THREE.MathUtils.smoothstep(yLocal, o.sombraAbajo[0], o.sombraAbajo[1]);
      if (grad) {
        _c.copy(grad[0]).lerp(grad[1], tGrad).multiplyScalar(f);
      } else if (o.colorArriba && _n.y > 0.35) {
        const t = THREE.MathUtils.smoothstep(_n.y, 0.35, 0.85);
        _c.copy(base).lerp(new THREE.Color(o.colorArriba), t).multiplyScalar(f);
      } else {
        _c.copy(base).multiplyScalar(f);
      }
      this.col.push(_c.r, _c.g, _c.b);
      this.tipo.push(o.tipo ?? 0);
    }
    geo.dispose();
    return this;
  }

  // 3.2: `soldar` junta los vértices idénticos (posición, normal, color y tipo) en una
  // geometría con índice: la placa procesa cada vértice una vez y no seis. Se usa en la
  // vegetación (bultos suaves y troncos: casi todo se comparte). Lo que se ve es lo mismo.
  geometria({ soldar = false } = {}) {
    const g = new THREE.BufferGeometry();
    if (soldar) {
      const mapa = new Map(), ind = [], P = [], Nn = [], Cc = [], Tt = [];
      const q = (v, k) => Math.round(v * k);
      for (let i = 0, n = this.pos.length / 3; i < n; i++) {
        const i3 = i * 3;
        const clave = q(this.pos[i3], 1e4) + ',' + q(this.pos[i3 + 1], 1e4) + ',' + q(this.pos[i3 + 2], 1e4) + '|'
          + q(this.nor[i3], 1e3) + ',' + q(this.nor[i3 + 1], 1e3) + ',' + q(this.nor[i3 + 2], 1e3) + '|'
          + q(this.col[i3], 1e3) + ',' + q(this.col[i3 + 1], 1e3) + ',' + q(this.col[i3 + 2], 1e3) + '|' + this.tipo[i];
        let j = mapa.get(clave);
        if (j === undefined) {
          j = P.length / 3; mapa.set(clave, j);
          P.push(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]); Nn.push(this.nor[i3], this.nor[i3 + 1], this.nor[i3 + 2]);
          Cc.push(this.col[i3], this.col[i3 + 1], this.col[i3 + 2]); Tt.push(this.tipo[i]);
        }
        ind.push(j);
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
      g.setAttribute('aTipo', new THREE.Float32BufferAttribute(Tt, 1));
      g.setIndex(ind);
    } else {
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
      g.setAttribute('aTipo', new THREE.Float32BufferAttribute(this.tipo, 1));
    }
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

// Tronco curvo y ahusado a lo largo de una curva
export function troncoCurvo(alto, r0, r1, curva = [0, 0], segs = 7, filas = 5) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, segs, filas, true);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) + 0.5;
    const r = r0 + (r1 - r0) * t;
    const x = p.getX(i) * r + curva[0] * t * t;
    const z = p.getZ(i) * r + curva[1] * t * t;
    p.setXYZ(i, x, t * alto, z);
  }
  // 2.7: un tronco es redondo: se sombrea con normales suaves (ver `normalesSuaves`)
  geo.userData.suave = true;
  return geo;
}

// Lámina curvada (fronda de helecho, hoja de colihue)
export function lamina(largo, ancho, arco, segs = 6, puntaFina = true) {
  const pos = [];
  const punto = (t, lado) => {
    const w = ancho * (puntaFina ? Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.3) : 1 - t * 0.5);
    const y = arco * (t * 1.4 - t * t * 1.25) * largo;
    return [lado * w * 0.5, y, t * largo];
  };
  for (let s = 0; s < segs; s++) {
    const t0 = s / segs, t1 = (s + 1) / segs;
    const a = punto(t0, -1), b = punto(t0, 1), c = punto(t1, -1), d = punto(t1, 1);
    pos.push(...a, ...c, ...b, ...b, ...c, ...d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
