// 4.10 coihue: los lugares del valle que toman los duendes, en el mundo (las reglas, en `desafio-valle.js` §11).
// Cada lugar tomado se ve oscurecido (una mancha que sigue el terreno, con vetas de moho), con hongos de luz
// que van creciendo con cada escalón y una bruma baja que gira despacio. Poca geometría: por lugar, un tinte
// (que se funde con la bruma en dos mallas translúcidas) y un solo racimo de hongos; ni luces ni materiales
// nuevos (los mismos de las raíces del asedio y de las semillas doradas). Sólo se arman al tomarse el lugar.
import * as THREE from 'three';
import { LIMITE } from './config.js';
import { azarDe } from './semilla.js';
import { ubicarZonas } from './desafio-asedio.js';
import { TOMADAS, valleNuevo, zonasTomadasDelValle, tomarAlAmanecer, nidosDeZona, lugarNidoDeZona, extraDeZona, abrirseNidoDeZona, sacaronNidoDeZona, cerrarValle, tomadaEn, marcasValle, nombreTomada, defTomada, } from './desafio-valle.js';

const _c = new THREE.Color();

export function crearTomadasMundo(T, escena, a) {
  const D = () => a.D();
  const cercaDeLugar = (x, z) => Object.values(T.lugares || {}).some((l) => l && Number.isFinite(l.x) && Math.hypot(l.x - x, l.z - z) < 14);
  function esBueno(x, z) {
    if (Math.abs(x) > LIMITE - 30 || Math.abs(z) > LIMITE - 30 || T.agua(x, z)) return false;
    const k = T.indice(x, z);
    if ((T.pendiente?.[k] ?? 0) > 0.3 || (T.distRiel?.[k] ?? 999) < 22 || (T.distSendero?.[k] ?? 999) < 4 || cercaDeLugar(x, z)) return false;
    return !a.obraEnPunto?.(x, T.altura(x, z) + 0.5, z);
  }
  const nocheQueViene = () => D().oleadas + 1;

  // ---------------------------------------------------------------- las reglas, con el juego
  // Los puntos son los mismos de las raíces del asedio (misma función y mismo azar): el lugar tomado antes es el lugar
  // donde después brota la raíz.
  function asegurar() {
    const d = D();
    if (d.valle || d.asedio || d.victoria) return d.valle || null;
    const c = a.centroBase();
    d.valle = valleNuevo(ubicarZonas(T.lugares, c, esBueno, azarDe(d.semilla, 'asedio')));
    return d.valle;
  }
  // Los nidos de cada lugar tomado, en la lista de los nidos del bosque (en el lugar: la lista es la misma de la noche).
  function sembrarNidos() {
    const d = D(), v = d.valle;
    if (!v) return;
    const lista = d.capullos || (d.capullos = []);
    for (let i = lista.length - 1; i >= 0; i--) if (lista[i].zona && !(defTomada(v, lista[i].zona)?.nivel > 0)) lista.splice(i, 1);
    for (const z of zonasTomadasDelValle(v)) {
      let hay = lista.filter((c) => c.zona === z.id).length;
      for (; hay < nidosDeZona(z); hay++) {
        const p = lugarNidoDeZona(z, lista, esBueno, azarDe(d.semilla, nocheQueViene(), `nido-${z.id}-${hay}`));
        if (p) lista.push({ x: p.x, z: p.z, golpes: 0, zona: z.id });
      }
    }
    a.sincronizarCapullos();
  }
  // Al amanecer (después de sembrar los nidos del bosque): ¿toman un lugar? ¿tiene su nido cada uno?
  function alAmanecer() {
    const d = D();
    if (d.asedio || d.victoria) return;
    const noche = nocheQueViene();
    if (noche < TOMADAS.desdeNoche) return;
    const v = asegurar();
    if (!v || v.cerrado) return;
    const hechos = tomarAlAmanecer(v, noche, azarDe(d.semilla, noche, 'valle-toman'));
    sembrarNidos();
    const js = a.jugador().estado;
    for (const h of hechos) {
      const z = defTomada(v, h.id);
      setTimeout(() => a.nota(`Los duendes tomaron ${nombreTomada(h.id)}`, `Está ${a.rumboTexto(js.pos, z)}: se oscureció y le crecen hongos. Mientras siga así no se pueden talar árboles ni picar piedra ahí, y de noche salen duendes de ese lugar. Sacá su nido de hongos de día (mirá el mapa)`, true), 5200);
    }
    if (hechos.length) a.guardar();
  }
  // Un nido de un lugar tomado se abre (nadie lo sacó): el lugar se oscurece más y salen más duendes. Devuelve qué más sale.
  function alAbrirseNido(c) {
    const v = D().valle;
    if (!v || !c?.zona) return [];
    const r = abrirseNidoDeZona(v, c.zona);
    if (!r.ok) return [];
    const z = defTomada(v, c.zona);
    if (r.nivel >= TOMADAS.nivelMax) a.nota(`${nombreTomada(c.zona)} se cerró del todo`.replace(/^./, (m) => m.toUpperCase()), 'Los duendes se afirmaron: ahora hay dos nidos. Salen más de ahí', false);
    return z ? extraDeZona(z) : [];
  }
  // Sacaron un nido (quemado o roto a golpes): ya no está en la lista. ¿Se recuperó el lugar?
  function alQuitarNido(c) {
    const d = D(), v = d.valle;
    if (!v || !c?.zona) return;
    const quedan = (d.capullos || []).filter((q) => q.zona === c.zona).length;
    const r = sacaronNidoDeZona(v, c.zona, quedan, nocheQueViene());
    if (!r.ok) return;
    if (r.recuperada) {
      a.sumarMaterial?.('cristal', r.premio);
      a.nota(`Recuperaste ${nombreTomada(c.zona)}`, `Se despejó la bruma y vuelve a haber recursos. Unas noches no lo vuelven a tomar · +${r.premio} semillas doradas`, true);
    } else if (r.baja) a.nota(`${nombreTomada(c.zona)}: un escalón menos`.replace(/^./, (m) => m.toUpperCase()), 'Sacaste un nido, pero el lugar sigue tomado: mañana crece otro. Seguí', false);
    else a.nota('Sacaste un nido del lugar tomado', 'Falta el otro para que se despeje', false);
    a.guardar();
  }
  // Empieza el asedio: las raíces del Coihue ocupan su lugar y esto se cierra.
  function cerrar() {
    const d = D();
    if (!d.valle) return;
    cerrarValle(d.valle);
    if (d.capullos) for (let i = d.capullos.length - 1; i >= 0; i--) if (d.capullos[i].zona) d.capullos.splice(i, 1);
    a.sincronizarCapullos();
  }
  const bloquea = (x, z) => tomadaEn(D().valle, x, z, 1.5);

  // ---------------------------------------------------------------- las mallas
  const sitios = new Map();   // id → { g, tinte, bruma, hongos, k (0 a 1, lo que se ve ahora) }
  const matTinte = () => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const ruido = (x, z) => Math.sin(x * 0.37 + z * 0.21) * Math.sin(z * 0.43 - x * 0.17);
  // un disco que sigue el terreno, con el borde que se desvanece; `y0`: a qué altura del suelo
  function disco(z, radio, y0, color, alfa, venas) {
    const g = new THREE.RingGeometry(0.3, radio, 40, 7);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 4);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), zz = p.getZ(i), r = Math.hypot(x, zz) / radio;
      const rr = 1 - r * r * (0.9 + 0.1 * ruido(x * 1.3, zz * 1.3));
      const vena = venas && Math.abs(Math.sin(x * 0.8 + Math.sin(zz * 0.5) * 2) * Math.sin(zz * 0.7 + Math.sin(x * 0.4) * 1.7)) < 0.1 ? 0.5 : 0;
      _c.setRGB(color[0] + vena * 0.1, color[1] + vena * 0.38, color[2] + vena * 0.3, THREE.SRGBColorSpace);
      col[i * 4] = _c.r; col[i * 4 + 1] = _c.g; col[i * 4 + 2] = _c.b; col[i * 4 + 3] = Math.max(0, rr) * alfa * (1 + vena * 0.5);
      p.setY(i, T.altura(z.x + x, z.z + zz) - T.altura(z.x, z.z) + (y0 === 0 ? 0.1 : y0 + 0.3 * ruido(x * 0.7, zz * 0.7)));
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    g.computeBoundingSphere();
    return g;
  }
  // los hongos: un racimo de pie y sombrero, todos en una sola geometría (se muestran de a más con el escalón)
  function hongos(z, sem) {
    const pos = [], col = [], idx = [];
    const azar = (() => { let s = (Math.abs(Math.floor(sem)) * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();   // (siempre positivo: con la x o la z del lugar negativas daba índices de menos)
    const colores = [[0.88, 0.6, 0.3], [0.64, 0.82, 0.4], [0.42, 0.7, 0.66], [0.8, 0.44, 0.3]];
    const N = 16;
    for (let k = 0; k < N; k++) {
      const an = azar() * Math.PI * 2, rad = 2.2 + Math.pow(azar(), 0.8) * (TOMADAS.radio - 5), cx = Math.cos(an) * rad, cz = Math.sin(an) * rad;
      const s = 1.5 + azar() * 2.2, y0 = T.altura(z.x + cx, z.z + cz) - T.altura(z.x, z.z);
      const c0 = colores[Math.floor(azar() * colores.length)];
      const alto = 0.36 * s, rc = 0.34 * s, lados = 8;
      const base = pos.length / 3;
      // el pie: un tubito, y el sombrero: un domo bajo
      for (let j = 0; j <= 1; j++) for (let l = 0; l < lados; l++) {
        const a2 = (l / lados) * Math.PI * 2, rr = 0.07 * s * (1 - 0.3 * j);
        pos.push(cx + Math.cos(a2) * rr, y0 + j * alto, cz + Math.sin(a2) * rr);
        _c.setRGB(0.78 - 0.18 * j, 0.74 - 0.16 * j, 0.62 - 0.12 * j, THREE.SRGBColorSpace); col.push(_c.r, _c.g, _c.b);
      }
      for (let l = 0; l < lados; l++) { const l2 = (l + 1) % lados; idx.push(base + l, base + l2, base + lados + l, base + l2, base + lados + l2, base + lados + l); }
      const b2 = pos.length / 3;
      const aros = [[1, 0], [0.82, 0.55], [0.4, 0.92], [0, 1]];
      for (let r = 0; r < aros.length; r++) for (let l = 0; l < lados; l++) {
        const a2 = (l / lados) * Math.PI * 2;
        pos.push(cx + Math.cos(a2) * rc * aros[r][0], y0 + alto + aros[r][1] * rc * 0.62 - 0.02, cz + Math.sin(a2) * rc * aros[r][0]);
        const luz = 0.55 + aros[r][1] * 0.45;
        _c.setRGB(c0[0] * luz, c0[1] * luz, c0[2] * luz, THREE.SRGBColorSpace); col.push(_c.r, _c.g, _c.b);
      }
      for (let r = 0; r < aros.length - 1; r++) for (let l = 0; l < lados; l++) {
        const l2 = (l + 1) % lados, p0 = b2 + r * lados;
        idx.push(p0 + l, p0 + l2, p0 + lados + l, p0 + l2, p0 + lados + l2, p0 + lados + l);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.userData.porHongo = idx.length / N;
    g.userData.N = N;
    g.computeBoundingSphere();
    return g;
  }
  // junta geometrías con posición y color de 4 canales (translúcidas) en una sola
  function fundirGeos(lista) {
    let nv = 0, ni = 0;
    for (const g of lista) { nv += g.attributes.position.count; ni += g.index.count; }
    const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 4), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const g of lista) {
      pos.set(g.attributes.position.array, ov * 3); col.set(g.attributes.color.array, ov * 4);
      for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + ov;
      ov += g.attributes.position.count; oi += g.index.count;
    }
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('color', new THREE.BufferAttribute(col, 4)); r.setIndex(new THREE.BufferAttribute(idx, 1));
    r.computeBoundingSphere();
    return r;
  }
  // una columna de esporas: un tubo que se afina y se desvanece hacia arriba
  function columna(cx, cz, alto, rad, sem) {
    const lados = 9, anillos = 6, pos = [], col = [], idx = [];
    for (let a = 0; a <= anillos; a++) {
      const u = a / anillos, r = rad * (1 - 0.7 * u) * (1 + 0.15 * Math.sin(sem + u * 5));
      for (let l = 0; l < lados; l++) {
        const an = (l / lados) * Math.PI * 2, x = cx + Math.cos(an) * r + Math.sin(u * 4 + sem) * 0.4 * u, zz = cz + Math.sin(an) * r;
        pos.push(x, u * alto, zz);
        _c.setRGB(0.74, 0.82, 0.52, THREE.SRGBColorSpace); col.push(_c.r, _c.g, _c.b, 0.3 * (1 - u) * (a === 0 ? 0.4 : 1));
      }
    }
    for (let a = 0; a < anillos; a++) for (let l = 0; l < lados; l++) {
      const l2 = (l + 1) % lados, p0 = a * lados, p1 = (a + 1) * lados;
      idx.push(p0 + l, p0 + l2, p1 + l, p0 + l2, p1 + l2, p1 + l);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
    return g;
  }
  function armarSitio(z) {
    const g = new THREE.Group();
    g.position.set(z.x, T.altura(z.x, z.z), z.z);
    // el suelo oscuro y, a media altura del pasto, una sombra violeta que lo tapa (el pasto es más alto que el suelo)
    const tinte = new THREE.Mesh(fundirGeos([disco(z, TOMADAS.radio, 0, [0.07, 0.06, 0.09], 0.88, true), disco(z, TOMADAS.radio * 0.96, 0.6, [0.12, 0.09, 0.17], 0.5, false)]), matTinte());
    tinte.renderOrder = 1;
    // la bruma baja (gris verdosa) y unas columnas de esporas que se ven de lejos
    const cols = [];
    for (let k = 0; k < 4; k++) { const an = k * 1.7 + 0.6, r = 3 + k * 2.3, cx = Math.cos(an) * r, cz = Math.sin(an) * r; const c = columna(cx, cz, 5.5 + k, 0.9 + (k % 2) * 0.4, k * 2.1); const P = c.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + T.altura(z.x + cx, z.z + cz) - T.altura(z.x, z.z)); cols.push(c); }
    const bruma = new THREE.Mesh(fundirGeos([disco(z, TOMADAS.radio * 1.1, 1.3, [0.58, 0.62, 0.68], 0.34, false), ...cols]), matTinte());
    bruma.renderOrder = 2;
    const h = new THREE.Mesh(hongos(z, z.x * 7 + z.z * 3), new THREE.MeshBasicMaterial({ vertexColors: true }));
    h.frustumCulled = true;
    g.add(tinte, bruma, h);
    g.visible = false;
    escena.add(g);
    return { g, tinte, bruma, hongos: h, k: 0 };
  }
  function actualizar(dt, js) {
    const v = D().valle;
    const t = performance.now() / 1000;
    for (const z of v && !v.cerrado ? v.zonas : []) {
      let s = sitios.get(z.id);
      if (!s && z.nivel > 0) { s = armarSitio(z); sitios.set(z.id, s); }
      if (!s) continue;
      // lo que se ve se acerca al escalón (sube y baja de a poco)
      const meta = z.nivel / TOMADAS.nivelMax;
      s.k += (meta - s.k) * Math.min(1, dt * 0.8);
      if (Math.abs(meta - s.k) < 0.004) s.k = meta;
      const lejos = Math.hypot(js.pos.x - z.x, js.pos.z - z.z) > 300;
      s.g.visible = s.k > 0.01 && !lejos;
      if (!s.g.visible) continue;
      s.tinte.material.opacity = Math.min(1, 0.4 + s.k * 0.7);
      s.bruma.material.opacity = Math.min(1, 0.3 + s.k * 0.9) * (0.8 + Math.sin(t * 0.6 + z.x) * 0.2);
      s.bruma.rotation.y = t * 0.03 + z.z;
      const n = Math.max(1, Math.round(s.k * s.hongos.geometry.userData.N));
      s.hongos.geometry.setDrawRange(0, n * s.hongos.geometry.userData.porHongo);
    }
    // los que ya no existen (se cerró el valle)
    if (!v || v.cerrado) for (const s of sitios.values()) s.g.visible = false;
  }
  function limpiar() {
    for (const s of sitios.values()) { escena.remove(s.g); s.tinte.geometry.dispose(); s.bruma.geometry.dispose(); s.hongos.geometry.dispose(); }
    sitios.clear();
  }

  return {
    asegurar, alAmanecer, alAbrirseNido, alQuitarNido, cerrar, bloquea, actualizar, limpiar,
    marcas: () => marcasValle(D().valle),
    get estado() { return D().valle || null; },
    get sitios() { return sitios; },
  };
}
