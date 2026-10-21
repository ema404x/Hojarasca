// 4.6 recursos: lo que se ve y se usa con E de los recursos de zona (las reglas están en recursos-zona.js).
//
//   · la VETA de la cantera: un frente de roca al pie de la loma del suroeste, con la piedra labrada al pie cuando hay;
//   · el JUNCAL y las HIERBAS del mallín, junto al puente de troncos: cortados quedan al ras y vuelven a crecer;
//   · la BARRANCA DE ARCILLA en la boca del arroyo, con los panes de arcilla cuando hay;
//   · los PEHUENES del mirador: no se dibuja nada nuevo, E al pie del tronco junta los piñones en otoño.
//
// Rendimiento: cuatro mallas en total (una por punto, más la pila de lo que se junta), geometría fundida y con el
// material de la gente y los animales (MAT_FAUNA: el mismo programa, ningún shader nuevo), sin sombras ni luces; a más de
// 170 m no se dibujan. Lo que cambia se revisa una vez por segundo. Coordenadas fijas.
//
// `ctx`: { T, escena, col, progreso(), estacion(), pehuenes(), nota(t, sub, nueva), guardar(), sonido, registrar(id),
//          sumarMaterial(k, n), sumarEntrada(id, n), nivel(id), ganarOficio(id, xp), refrescarBarra() }
import * as THREE from 'three';
import { MAT_FAUNA } from './vida.js';
import { generador, hashTexto } from './semilla.js';
import { PUNTOS_ZONA, PUNTO_ZONA, MATERIALES_ZONA, IDS_MATERIALES_ZONA, IDS_HERRAMIENTAS_ZONA, estadoZona, puntoCerca, avisoPunto, usarPunto, faltaPara, textoDa, pehuenCerca, avisoPehuen, juntarPehuen, entradaDeMaterial } from './recursos-zona.js';

const LEJOS = 170;
const RADIO_PEHUENAL = 140;   // los 8 pehuenes están a menos de 80 m del mirador: más allá ni se buscan

// ---------------------------------------------------------------- geometría
// Junta piezas (con su color) en una sola geometría sin índice: una llamada de dibujo por malla.
// Las piezas con `apoya` (las que van sobre el suelo) quedan anotadas en `userData.apoyos` ([desde, cuántos] vértices): las
// pruebas miran que ninguna flote.
function juntar(partes) {
  const pos = [], nor = [], col = [], apoyos = [];
  for (const { g, color, variar = 0.08, apoya = false } of partes) {
    const n = g.index ? g.toNonIndexed() : g;
    if (apoya) apoyos.push([pos.length / 3, n.attributes.position.count]);
    n.computeVertexNormals();
    const c = new THREE.Color(color), p = n.attributes.position.array, q = n.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]); nor.push(q[i], q[i + 1], q[i + 2]);
      const k = 1 - variar + variar * 2 * (((i * 7919) % 17) / 17);
      col.push(c.r * k, c.g * k, c.b * k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeBoundingSphere();
  g.userData.apoyos = apoyos;
  return g;
}
const roca = (r, e, sx, sy, sz) => new THREE.IcosahedronGeometry(e, 0).scale(sx, sy, sz).rotateY(r() * 6.28);

// `s(dx, dz)`: la altura del suelo en ese punto, medida desde la base de la malla (cada pieza se apoya en su suelo: en la
// ladera o en la orilla del arroyo nada queda flotando ni enterrado de más). `sMin`: lo más bajo bajo una huella.
const sMin = (s, dx, dz, rad) => Math.min(s(dx, dz), s(dx + rad, dz), s(dx - rad, dz), s(dx, dz + rad), s(dx, dz - rad));

// El frente de roca: bloques angulosos apilados que asoman de la loma (la cara mira al este, de donde se llega), con
// una franja más clara (la veta). Mide ~7 m de ancho y ~3,5 m de alto; la base queda enterrada.
function geoVeta(r, s) {
  const partes = [];
  const grises = ['#6f6c66', '#7a766e', '#66635e', '#837e74'];
  for (let i = 0; i < 9; i++) {
    const z0 = -3.2 + (i % 5) * 1.6 + (r() - 0.5) * 0.6, fila = i < 5 ? 0 : 1, z = fila ? z0 * 0.8 : z0;
    const e = 1.25 + r() * 0.45, alto = e * (fila ? 1.1 : 1.6), x = -1.2 - fila * 0.9 - r() * 0.4;
    const g = new THREE.BoxGeometry(e * 1.5, alto, e * 1.25).rotateY((r() - 0.5) * 0.5).rotateZ((r() - 0.5) * 0.16);
    const piso = sMin(s, x, z, e * 0.75);
    g.translate(x, piso + (fila ? 2.3 + r() * 0.4 : alto / 2 - 0.45 + r() * 0.2), z);
    partes.push({ g, color: grises[i % grises.length], variar: 0.12, apoya: !fila });
  }
  // la veta: una franja clara que cruza el frente
  partes.push({ g: new THREE.BoxGeometry(0.5, 0.42, 6.4).rotateZ(0.12).translate(-0.55, sMin(s, -0.55, 0, 3) + 1.55, 0), color: '#b9b3a4', variar: 0.06 });
  // derrubio al pie: lajas chicas
  for (let i = 0; i < 6; i++) { const x = 0.4 + r() * 1.2, z = -3 + r() * 6; partes.push({ g: roca(r, 0.22 + r() * 0.2, 1.2, 0.5, 1).translate(x, s(x, z) - 0.03, z), color: '#7d786e', apoya: true }); }
  return juntar(partes);
}
// La piedra labrada al pie del frente (se ve cuando la veta tiene para dar)
function geoPilaCantera(r, s) {
  const partes = [];
  const piso = sMin(s, 1.45, 1.65, 0.9);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BoxGeometry(0.5, 0.3, 0.34).rotateY((r() - 0.5) * 0.6);
    g.translate(0.9 + (i % 3) * 0.55, piso + 0.13 + Math.floor(i / 3) * 0.3, 1.6 + (r() - 0.5) * 0.2 + (i >= 3 ? 0.1 : 0));
    partes.push({ g, color: '#a7a297', variar: 0.06, apoya: i < 3 });
  }
  return juntar(partes);
}
// El juncal: tallos finos y altos, verdes con la punta parda. Cortado: los mismos tallos, al ras
function geoJuncal(r, s) {
  const tallos = Array.from({ length: 64 }, () => {
    const a = r() * 6.28, d = Math.sqrt(r()) * 2.4;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d * 0.7, h: 1.0 + r() * 0.7, rx: (r() - 0.5) * 0.25, rz: (r() - 0.5) * 0.25, color: r() < 0.25 ? '#8a8a46' : '#5e7a36', espiga: r() < 0.14 };
  });
  const armar = (corte) => juntar(tallos.flatMap((t) => {
    const h = t.h * corte, y = s(t.x, t.z) - 0.05;
    const p = [{ g: new THREE.CylinderGeometry(corte < 1 ? 0.012 : 0.004, 0.022, h, 3, 1).translate(0, h / 2, 0).rotateX(t.rx).rotateZ(t.rz).translate(t.x, y, t.z), color: corte < 1 ? '#8a7a46' : t.color, variar: 0.1, apoya: true }];
    if (t.espiga && corte === 1) p.push({ g: new THREE.ConeGeometry(0.03, 0.12, 4).translate(t.x, y + h * 0.82, t.z), color: '#6a4a2a' });
    return p;
  }));
  return { lleno: armar(1), ras: armar(0.18) };
}
// Las hierbas: matas bajas, con alguna flor lila. Cortadas: matas chicas, sin flor
function geoHierbas(r, s) {
  const matas = Array.from({ length: 14 }, () => {
    const a = r() * 6.28, d = Math.sqrt(r()) * 2.0;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, e: 0.18 + r() * 0.14, color: r() < 0.5 ? '#5f8a42' : '#6f9a4a', flor: r() < 0.5, giro: r() * 6.28 };
  });
  const armar = (k) => juntar(matas.flatMap((m) => {
    const e = m.e * k, y = s(m.x, m.z);
    const p = [{ g: new THREE.IcosahedronGeometry(e, 0).scale(1.3, 0.9, 1.3).rotateY(m.giro).translate(m.x, y + e * 0.45, m.z), color: m.color, variar: 0.12, apoya: true }];
    if (m.flor && k === 1) p.push({ g: new THREE.IcosahedronGeometry(0.05, 0).translate(m.x, y + e * 1.3, m.z), color: '#b48ac0' });
    return p;
  }));
  return { lleno: armar(1), ras: armar(0.45) };
}
// La barranca: un lomo de barro rojizo con el corte a la vista
function geoBarranca(r, s) {
  const partes = [];
  for (let i = 0; i < 5; i++) {
    const x = -1.2 + i * 0.6 + (r() - 0.5) * 0.4, z = (i - 2) * 1.0, e = 1.2 + r() * 0.5;
    const g = new THREE.IcosahedronGeometry(e, 1).scale(1.4, 0.45, 1).rotateY(r() * 6.28);
    g.translate(x, sMin(s, x, z, e) + 0.05, z);
    partes.push({ g, color: i % 2 ? '#8e5e42' : '#9b6a4a', variar: 0.1, apoya: true });
  }
  partes.push({ g: new THREE.BoxGeometry(0.3, 0.7, 3.2).translate(0.9, sMin(s, 0.9, 0, 1.6) + 0.22, 0), color: '#a5714e', variar: 0.06 });
  return juntar(partes);
}
// Los panes de arcilla recién cortados (se ven cuando hay para sacar)
function geoPanes(r, s) {
  const partes = [];
  for (let i = 0; i < 4; i++) {
    const x = 1.5 + (i % 2) * 0.4, z = -0.6 + i * 0.4;
    partes.push({ g: new THREE.BoxGeometry(0.34, 0.2, 0.24).rotateY((r() - 0.5) * 0.8).translate(x, s(x, z) + 0.08, z), color: '#b27c58', variar: 0.05, apoya: true });
  }
  return juntar(partes);
}

// ---------------------------------------------------------------- el sistema
export function crearRecursosZonaMundo(ctx) {
  const { T, escena } = ctx;
  const grupo = new THREE.Group();
  grupo.name = 'recursos-zona';
  escena.add(grupo);
  const r = generador(hashTexto('recursos-zona-4.6'));
  // cada punto: la malla fija, la de lo que hay para juntar y (el juncal y las hierbas) la de lo cortado al ras
  const mallas = {};
  function poner(id, armar) {
    const p = PUNTO_ZONA[id];
    const y0 = T.altura(p.x, p.z);
    const s = (dx, dz) => T.altura(p.x + dx, p.z + dz) - y0;
    const geos = armar(s);
    const hacer = (g, nombre) => {
      if (!g) return null;
      const m = new THREE.Mesh(g, MAT_FAUNA);
      m.position.set(p.x, y0, p.z);
      m.castShadow = false; m.receiveShadow = false;
      m.name = nombre;
      m.updateMatrix(); m.matrixAutoUpdate = false;
      grupo.add(m);
      return m;
    };
    // (nacen visibles: así la carga compila su programa con todo lo demás; el primer repaso esconde lo lejano)
    mallas[id] = { fija: hacer(geos.fija, `zona-${id}`), cambia: hacer(geos.lleno, `zona-${id}-hay`), ras: hacer(geos.ras, `zona-${id}-ras`), x: p.x, z: p.z, lleno: true };
  }
  poner('cantera', (s) => ({ fija: geoVeta(r, s), lleno: geoPilaCantera(r, s) }));
  poner('juncal', (s) => geoJuncal(r, s));
  poner('hierbas', (s) => geoHierbas(r, s));
  poner('arcilla', (s) => ({ fija: geoBarranca(r, s), lleno: geoPanes(r, s) }));
  // el frente de roca no se atraviesa: un segmento a lo largo de los bloques (la cara mira al este, x creciente)
  const V = PUNTO_ZONA.cantera;
  ctx.col?.agregar?.({ seg: true, ax: V.x - 1.8, az: V.z - 3.6, bx: V.x - 1.8, bz: V.z + 3.6, r: 1.3 });

  const prog = () => ctx.progreso();
  const dia = () => Math.floor(Number(prog()?.dia) || 1);
  let reloj = 0, firma = '';
  let pehuenes = null;
  const golpes = new Map();   // los golpes dados a la veta (no se guardan: como el pico en una roca)

  function listaPehuenes() {
    if (!pehuenes) pehuenes = (ctx.pehuenes?.() || []).filter((a) => a && a.especie === 'pehuen').map((a) => ({ x: a.x, z: a.z, r: Math.min(1.2, Number(a.r) || 0.6) }));
    return pehuenes;
  }
  const enElPehuenal = (pos) => listaPehuenes().some((a) => Math.abs(a.x - pos.x) < RADIO_PEHUENAL && Math.abs(a.z - pos.z) < RADIO_PEHUENAL);

  // Lo que se ve: lo lejano no se dibuja; lo juntado queda al ras (el juncal y las hierbas) o sin la pila (la veta y la barranca)
  function refrescar(pos) {
    const p = prog();
    if (!p) return;
    const est = estadoZona(p);
    for (const [id, m] of Object.entries(mallas)) {
      const cerca = !pos || Math.hypot(pos.x - m.x, pos.z - m.z) < LEJOS;
      const lleno = faltaPara(est, id, dia()) === 0;
      if (m.fija) m.fija.visible = cerca;
      if (m.cambia) m.cambia.visible = cerca && lleno;
      if (m.ras) m.ras.visible = cerca && !lleno;
      m.lleno = lleno;
    }
  }
  // Una vez por segundo: lo que se ve, lo nuevo en el cuaderno (el cuero del pastor, una herramienta comprada) y la barra
  function actualizar(dt, pos) {
    reloj -= dt;
    if (reloj > 0) return;
    reloj = 1;
    refrescar(pos);
    const p = prog();
    if (!p) return;
    const M = p.materiales || {}, C = p.cosas || {};
    const f = IDS_MATERIALES_ZONA.map((k) => (Number(M[k]) > 0 ? 1 : 0)).join('') + IDS_HERRAMIENTAS_ZONA.map((k) => (Number(C[k]) > 0 ? 1 : 0)).join('');
    if (f !== firma) {
      const antes = firma;
      firma = f;
      for (const k of IDS_MATERIALES_ZONA) if (Number(M[k]) > 0 && !p.entradas?.[entradaDeMaterial(k)]) ctx.registrar?.(entradaDeMaterial(k));
      for (const k of IDS_HERRAMIENTAS_ZONA) if (Number(C[k]) > 0 && !p.entradas?.[k]) ctx.registrar?.(k);
      if (antes) ctx.refrescarBarra?.();
    }
  }

  // ---------------------------------------------------------------- la E (y el aviso, con la misma función)
  function usarVeta(p, punto) {
    const est = estadoZona(p);
    const n = (golpes.get(punto.id) || 0) + 1;
    const donde = { x: punto.x - 1, y: T.altura(punto.x, punto.z) + 1.2, z: punto.z };
    ctx.sonido?.picazo?.(donde, Math.min(1, n / punto.golpes));
    if (n < punto.golpes) {
      golpes.set(punto.id, n);
      ctx.ganarOficio?.('picapedrero', 1);
      ctx.nota?.(`Golpe ${n} de ${punto.golpes}`, 'Seguí labrando con E');
      return;
    }
    golpes.delete(punto.id);
    const u = usarPunto(est, punto, dia(), p.cosas);
    if (!u.ok) return;
    entregar(p, punto, u.da);
    ctx.ganarOficio?.('picapedrero', 8);
  }
  function entregar(p, punto, da) {
    for (const [k, n] of Object.entries(da)) ctx.sumarMaterial?.(k, n);
    const k0 = Object.keys(da)[0];
    ctx.nota?.(`+${textoDa(da)}`, `Llevás ${Number(p.materiales?.[k0]) || 0} · vuelve a dar en ${punto.cada === 1 ? 'un día' : `${punto.cada} días`}`);
    for (const k of Object.keys(da)) if (MATERIALES_ZONA[k]) ctx.registrar?.(entradaDeMaterial(k));
    ctx.registrar?.(punto.herramienta);
    refrescar(null);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }
  function usar(punto) {
    const p = prog();
    if (!p) return;
    const est = estadoZona(p);
    const falta = faltaPara(est, punto, dia());
    if (falta > 0 || !(Number(p.cosas?.[punto.herramienta]) > 0)) { ctx.nota?.(punto.nombre, avisoPunto(est, punto, dia(), p.cosas)); return; }
    if (punto.golpes > 1) { usarVeta(p, punto); return; }
    const u = usarPunto(est, punto, dia(), p.cosas);
    if (!u.ok) return;
    if (punto.id === 'arcilla') ctx.sonido?.paso?.('tierra', 1); else ctx.sonido?.juntar?.();
    entregar(p, punto, u.da);
  }
  function usarPehuen(a) {
    const p = prog();
    if (!p) return;
    const est = estadoZona(p);
    const r0 = juntarPehuen(est, a, dia(), p.horas, ctx.estacion?.() || 'auto');
    if (!r0.ok) { ctx.nota?.('Pehuén', avisoPehuen(est, a, dia(), p.horas, ctx.estacion?.() || 'auto')); return; }
    const total = ctx.sumarEntrada?.('pinon', r0.pinones);
    ctx.sonido?.juntar?.();
    ctx.nota?.(`+${r0.pinones} piñones`, `Llevás ${total ?? r0.pinones}. El pehuén vuelve a dar el otoño que viene`);
    ctx.refrescarBarra?.();
    ctx.guardar?.();
  }
  // { texto, hacer } o null, según dónde estás (`js.pos`)
  function accion(js) {
    const p = prog();
    if (!p || !js?.pos) return null;
    const pos = js.pos;
    const punto = puntoCerca(pos.x, pos.z);
    if (punto) {
      const est = estadoZona(p);
      const n = golpes.get(punto.id) || 0;
      const texto = n > 0 && faltaPara(est, punto, dia()) === 0 && Number(p.cosas?.[punto.herramienta]) > 0 ? `Seguir labrando la veta (golpe ${n + 1} de ${punto.golpes})` : avisoPunto(est, punto, dia(), p.cosas);
      return { tipo: 'zona', id: punto.id, texto, hacer: () => usar(punto) };
    }
    if (enElPehuenal(pos)) {
      const a = pehuenCerca(listaPehuenes(), pos.x, pos.z);
      if (a) return { tipo: 'pehuen', texto: avisoPehuen(estadoZona(p), a, dia(), p.horas, ctx.estacion?.() || 'auto'), hacer: () => usarPehuen(a) };
    }
    return null;
  }

  return {
    actualizar, accion, refrescar,
    get mallas() { return mallas; },
    pehuenes: () => listaPehuenes(),
    puntos: PUNTOS_ZONA,
    // para probar (?debug=1): todo vuelve a dar ya
    reponer: () => { const p = prog(); if (!p) return; const est = estadoZona(p); est.usos = {}; est.pehuenes = {}; golpes.clear(); refrescar(null); },
  };
}
