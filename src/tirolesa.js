// 2.9: tirolesas y puentes colgantes. Se construyen de a dos puntas (planos
// 'poste-tirolesa' y 'estribo-puente', ver planos-vehiculos.js): cada punta terminada se
// empareja con la más cercana de su tipo que tenga la línea libre (tirolesa-reglas.js) y
// acá se tiende lo del medio: el cable, o el tablero con sus sogas. El puente se camina
// (plataformas de colisiones.js, como el embarcadero o la pasarela colgante); la
// tirolesa se usa con E desde el poste de arriba: el jugador queda `enCable` y el cable
// lo lleva (ver `andar`, que el jugador llama como al kayak) hasta el otro poste.
// Nada de esto se guarda aparte: sale de las obras, que ya se guardan.
import * as THREE from 'three';
import { Constructor } from './geometria.js';
import { materialVegetal } from './materiales.js';
import { TIROLESA, PUENTE, alturaCurva, combaTirolesa, combaPuente, sentidoTirolesa, avanzarCable, emparejar, revisarLinea } from './tirolesa-reglas.js';

const MADERA_OSCURA = '#4a3b2c';
const TABLA = '#8a6b4a';
const SOGA = '#c9b894';
const CABLE = '#8e908b';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const ARRIBA = new THREE.Vector3(0, 1, 0);

// una vara de `a` a `b` (en coordenadas del mundo)
function vara(c, a, b, r, color, tipo = 0) {
  _z.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const largo = _z.length() || 0.01;
  const q = new THREE.Quaternion().setFromUnitVectors(ARRIBA, _z.normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), q, new THREE.Vector3(1, 1, 1));
  c.agregar(new THREE.CylinderGeometry(r, r, largo, 5), { color, tipo, variar: 0.06, matriz: m });
}

export function crearTirolesas(T, escena, col, veg, sonido, ctx = {}) {
  const mat = materialVegetal({ flex: 0 });
  const grupo = new THREE.Group();
  escena.add(grupo);
  let lineas = [], sueltas = new Map(), firma = null, revision = 0, revisionGuia = 0, viaje = null;

  // la roldana con su manija: se ve arriba de la cabeza mientras se viaja
  const roldana = new THREE.Group();
  {
    const metal = new THREE.MeshLambertMaterial({ color: '#6e706c' });
    const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), metal);
    rueda.rotation.z = Math.PI / 2;
    const placa = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.16), metal);
    placa.position.y = -0.1;
    const manija = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), new THREE.MeshLambertMaterial({ color: '#3c2f24' }));
    manija.rotation.z = Math.PI / 2;
    manija.position.y = -0.34;
    for (const s of [-1, 1]) {
      const cuerda = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 4), new THREE.MeshLambertMaterial({ color: SOGA }));
      cuerda.position.set(s * 0.12, -0.2, 0);
      cuerda.rotation.z = s * 0.45;
      roldana.add(cuerda);
    }
    roldana.add(rueda, placa, manija);
  }
  roldana.visible = false;
  escena.add(roldana);

  // la guía del modo obra: de la punta suelta más cercana al fantasma (verde o roja)
  const guiaGeo = new THREE.BufferGeometry();
  guiaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(17 * 3), 3));
  const guiaMat = new THREE.LineBasicMaterial({ color: 0x78c987, transparent: true, opacity: 0.85 });
  const guia = new THREE.Line(guiaGeo, guiaMat);
  guia.frustumCulled = false;
  guia.visible = false;
  escena.add(guia);

  const terminadas = (id) => (ctx.obras?.()?.obras || []).filter((o) => o.plano.id === id && o.datos.etapas >= o.plano.etapas.length);
  // el suelo, o el agua si está más alta
  const suelo = (x, z) => { const h = T.altura(x, z), a = T.agua(x, z); return a ? Math.max(h, a.nivel) : h; };
  function arbolEn(ax, az, bx, bz, margen) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, largo = Math.sqrt(l2);
    const x0 = Math.min(ax, bx) - margen - 2, x1 = Math.max(ax, bx) + margen + 2, z0 = Math.min(az, bz) - margen - 2, z1 = Math.max(az, bz) + margen + 2;
    for (const a of veg.arboles || []) {
      if (a.sacado || a.x < x0 || a.x > x1 || a.z < z0 || a.z > z1) continue;
      const t = ((a.x - ax) * dx + (a.z - az) * dz) / l2;
      // junto a las puntas no cuenta: ahí ya se despejó para armarlas
      if (t * largo < 1.2 || (1 - t) * largo < 1.2) continue;
      const d = Math.hypot(ax + dx * t - a.x, az + dz * t - a.z);
      if (d < margen + Math.min(0.6, (a.r || 0.3) * 0.5)) return true;
    }
    return false;
  }
  const idDe = (o) => `${o.datos.x.toFixed(2)},${o.datos.z.toFixed(2)}`;
  const cableDe = (o) => ({ x: o.datos.x, y: o.datos.y + TIROLESA.altoCable, z: o.datos.z });
  const pisoDe = (o) => ({ x: o.datos.x, y: o.datos.y + PUENTE.altoPiso, z: o.datos.z });
  // las puntas del tablero: en el borde de cada estribo
  function bordes(a, b) {
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1, ux = (b.x - a.x) / l, uz = (b.z - a.z) / l, R = PUENTE.radioEstribo;
    return [{ x: a.x + ux * R, y: a.y, z: a.z + uz * R }, { x: b.x - ux * R, y: b.y, z: b.z - uz * R }];
  }
  const revisarTirolesa = (a, b) => revisarLinea('tirolesa', a, b, suelo, arbolEn);
  const revisarPuente = (a, b) => { const [p, q] = bordes(a, b); return revisarLinea('puente', p, q, suelo, arbolEn); };

  function quitar(l) {
    col.eliminarPorDuenio?.(l.duenio);
    if (l.malla) { grupo.remove(l.malla); l.malla.geometry.dispose(); }
  }

  // ------------------------------------------------------------------ el armado
  function armarTirolesa(l) {
    const c = new Constructor();
    const n = Math.max(8, Math.ceil(l.largo / 2));
    for (let i = 0; i < n; i++) {
      const p = punto(l, i / n), q = punto(l, (i + 1) / n);
      vara(c, p, q, 0.014, CABLE, 4);
    }
    // la mordaza en cada poste
    for (const e of [l.A, l.B]) c.agregar(new THREE.BoxGeometry(0.2, 0.14, 0.2), { color: '#5e605c', tipo: 4, matriz: new THREE.Matrix4().makeTranslation(e.x, e.y, e.z) });
    return c;
  }

  function armarPuente(l) {
    const c = new Constructor();
    const ux = (l.B.x - l.A.x) / l.largo, uz = (l.B.z - l.A.z) / l.largo;
    const lat = (s, p, dy = 0) => ({ x: p.x - uz * s, y: p.y + dy, z: p.z + ux * s });
    const n = Math.max(4, Math.round(l.largo / 0.3));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, p = punto(l, t);
      const p0 = punto(l, Math.max(0, t - 0.02)), p1 = punto(l, Math.min(1, t + 0.02));
      _z.set(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z).normalize();
      _x.crossVectors(ARRIBA, _z).normalize();
      _y.crossVectors(_z, _x);
      const m = new THREE.Matrix4().makeBasis(_x, _y, _z).setPosition(p.x, p.y - 0.025, p.z);
      c.agregar(new THREE.BoxGeometry(PUENTE.ancho, 0.05, 0.24), { color: i % 3 ? TABLA : '#795f44', tipo: 4, variar: 0.12, matriz: m });
    }
    // largueros de soga bajo las tablas, pasamanos y péndolas
    const tramos = Math.max(6, Math.ceil(l.largo / 1.2));
    for (let i = 0; i < tramos; i++) {
      const p = punto(l, i / tramos), q = punto(l, (i + 1) / tramos);
      for (const s of [-0.42, 0.42]) vara(c, lat(s, p, -0.06), lat(s, q, -0.06), 0.03, SOGA);
      for (const s of [-0.58, 0.58]) {
        vara(c, lat(s, p, 1.0), lat(s, q, 1.0), 0.02, SOGA);
        if (i > 0) vara(c, lat(s * 0.9, p, -0.03), lat(s, p, 1.0), 0.008, SOGA);
      }
    }
    // los horcones de cada punta, donde se atan las sogas
    for (const [e, suelo0] of [[l.A, l.pieA], [l.B, l.pieB]]) for (const s of [-0.62, 0.62]) {
      const p = lat(s, e);
      vara(c, { x: p.x, y: suelo0 - 0.1, z: p.z }, { x: p.x, y: e.y + 1.15, z: p.z }, 0.07, MADERA_OSCURA);
    }
    return c;
  }

  // el tablero se pisa: una plataforma cada medio metro, a la altura de la comba, y las
  // sogas de los costados frenan (no te caés al arroyo)
  function fisicaPuente(l) {
    const ang = Math.atan2(l.B.z - l.A.z, l.B.x - l.A.x);
    const ux = Math.cos(ang), uz = Math.sin(ang);
    const m = Math.max(4, Math.ceil(l.largo / 0.5));
    for (let i = 0; i < m; i++) {
      const p = punto(l, (i + 0.5) / m);
      col.agregarPlataforma({ duenio: l.duenio, x: p.x, z: p.z, ang, largo: l.largo / m + 0.08, ancho: PUENTE.ancho + 0.05, alto: p.y + 0.005, espesor: 0.12, escalonMax: 0.45 });
    }
    const k = Math.max(3, Math.ceil(l.largo / 1.5));
    for (let i = 0; i < k; i++) {
      const p = punto(l, i / k), q = punto(l, (i + 1) / k);
      for (const s of [-0.6, 0.6]) col.agregar({ duenio: l.duenio, seg: true, ax: p.x - uz * s, az: p.z + ux * s, bx: q.x - uz * s, bz: q.z + ux * s, r: 0.05,
        alturaMin: Math.min(p.y, q.y) + 0.15, alturaMax: Math.max(p.y, q.y) + 1.15 });
    }
  }

  function punto(l, t) {
    return { x: l.A.x + (l.B.x - l.A.x) * t, y: alturaCurva(l.A.y, l.B.y, t, l.comba), z: l.A.z + (l.B.z - l.A.z) * t };
  }

  function tender(tipo, oa, ob, A, B) {
    const largo = Math.hypot(B.x - A.x, B.z - A.z);
    const l = { tipo, oa, ob, A, B, largo, comba: tipo === 'tirolesa' ? combaTirolesa(largo) : combaPuente(largo), duenio: { tendido: tipo }, malla: null,
      pieA: oa.datos.y, pieB: ob.datos.y };
    l.duenio.linea = l;
    const c = tipo === 'tirolesa' ? armarTirolesa(l) : armarPuente(l);
    const m = new THREE.Mesh(c.geometria(), mat);
    m.castShadow = true; m.receiveShadow = true;
    // quieto: su matriz (la identidad) se calcula una vez
    m.updateMatrix(); m.matrixAutoUpdate = false;
    grupo.add(m);
    l.malla = m;
    if (tipo === 'puente') fisicaPuente(l);
    return l;
  }

  function reconstruir(jugador) {
    for (const l of lineas) quitar(l);
    lineas = [];
    sueltas = new Map();
    for (const [tipo, plano, altura, revisar, R] of [['tirolesa', TIROLESA.plano, cableDe, revisarTirolesa, TIROLESA], ['puente', PUENTE.plano, pisoDe, revisarPuente, PUENTE]]) {
      const obras = terminadas(plano);
      const porId = new Map(obras.map((o) => [idDe(o), o]));
      const puntas = obras.map((o) => ({ id: idDe(o), ...altura(o) }));
      const r = emparejar(puntas, R.largoMin, R.largoMax, revisar);
      for (const par of r.pares) {
        const oa = porId.get(par.a.id), ob = porId.get(par.b.id);
        let A = altura(oa), B = altura(ob);
        if (tipo === 'puente') [A, B] = bordes(A, B);
        lineas.push(tender(tipo, oa, ob, A, B));
      }
      for (const [id, motivo] of r.sueltas) sueltas.set(porId.get(id), motivo);
    }
    // si se desarmó la tirolesa en la que se viajaba, se suelta ahí
    if (viaje && !lineas.some((l) => l.oa === viaje.linea.oa && l.ob === viaje.linea.ob && l.tipo === 'tirolesa')) soltar(jugador || viaje.jugador);
    else if (viaje) viaje.linea = lineas.find((l) => l.oa === viaje.linea.oa && l.ob === viaje.linea.ob);
  }

  function firmaActual() {
    let f = '';
    for (const id of [TIROLESA.plano, PUENTE.plano]) for (const o of terminadas(id)) f += `${id}:${idDe(o)},${(o.datos.y || 0).toFixed(2)}|`;
    return f;
  }

  // ------------------------------------------------------------------ el viaje
  // `s` avanza desde la punta de salida; `dir` dice si se sale de A (1) o de B (-1)
  function enCable(v, s) {
    const t = v.dir > 0 ? s / v.linea.largo : 1 - s / v.linea.largo;
    return punto(v.linea, Math.min(1, Math.max(0, t)));
  }

  function empezar(l, desdeA, jugador) {
    const js = jugador.estado;
    viaje = { linea: l, dir: desdeA ? 1 : -1, s: 0.8, v: TIROLESA.arranque, jugador, ruido: 0, maxV: 0 };
    js.enCable = true;
    js.sentado = false; js.agachado = false;
    js.vel.set(0, 0, 0);
    roldana.visible = true;
    sonido?.carrete?.();
    andar(0, jugador);
  }

  function soltar(jugador) {
    const js = jugador?.estado;
    viaje = null;
    roldana.visible = false;
    if (js) { js.enCable = false; jugador.ubicar(js.pos.x, js.pos.z, js.yaw); }
  }

  function llegar(jugador) {
    const v = viaje, js = jugador.estado;
    const p = enCable(v, v.linea.largo - 1.6);
    viaje = null;
    roldana.visible = false;
    js.enCable = false;
    // 3.8.3: a la altura del pie del poste de llegada: sin cota, con el poste arriba de un piso o una torre, aparecías en
    // la plataforma más baja de ese punto (abajo del deck, o adentro de lo que hubiera debajo)
    jugador.ubicar(p.x, p.z, js.yaw, pieDeLlegada(v));
    sonido?.golpeKayak?.();
    ctx.alLlegar?.(v.linea, v.maxV);
    ctx.nota?.('Llegaste al otro poste', `${Math.round(v.linea.largo)} m de tirolesa · ${Math.round(v.maxV * 3.6)} km/h de punta`);
  }

  // un cuadro colgado del cable (lo llama el jugador, como `alKayak`)
  function andar(dt, jugador) {
    const js = jugador.estado;
    if (!viaje || !viaje.linea) { if (js.enCable) soltar(jugador); return; }
    const v = viaje, L = v.linea.largo;
    const p0 = enCable(v, v.s), p1 = enCable(v, Math.min(L, v.s + 0.5));
    const pend = (p1.y - p0.y) / 0.5;
    const r = avanzarCable(v.s, v.v, dt, pend, L - 1.3 - v.s);
    v.s = r.s; v.v = r.v; v.maxV = Math.max(v.maxV, r.v);
    const p = enCable(v, Math.min(L, v.s));
    js.pos.set(p.x, p.y - TIROLESA.colgado, p.z);
    js.velocidadActual = r.v;
    roldana.position.set(p.x, p.y, p.z);
    roldana.rotation.set(0, Math.atan2(v.linea.B.x - v.linea.A.x, v.linea.B.z - v.linea.A.z), 0);
    // la roldana zumba más cuanto más rápido
    if ((v.ruido -= dt * (0.6 + r.v * 0.25)) <= 0) { v.ruido = 1; if (r.v > 2) sonido?.carrete?.(); }
    if (v.s >= L - 1.3) llegar(jugador);
  }

  // ------------------------------------------------------------------ E y el aviso
  function accion(jugador) {
    const js = jugador.estado;
    if (viaje || js.enKayak || js.enTren || js.montado || js.nadando) return null;
    let poste = null, d0 = 2.4;
    for (const o of terminadas(TIROLESA.plano)) {
      const d = Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z);
      if (d < d0 && Math.abs(js.pos.y - o.datos.y) < 1.6) { d0 = d; poste = o; }
    }
    if (poste) {
      const l = lineas.find((x) => x.tipo === 'tirolesa' && (x.oa === poste || x.ob === poste));
      if (!l) {
        const motivo = sueltas.get(poste) || 'Falta la otra punta';
        return { texto: 'Poste de tirolesa: falta la otra punta', hacer: () => ctx.nota?.('La tirolesa no está tendida', motivo) };
      }
      const desdeA = l.oa === poste;
      const sentido = sentidoTirolesa(desdeA ? l.A.y : l.B.y, desdeA ? l.B.y : l.A.y);
      if (sentido === 'sube') return { texto: 'La tirolesa sube desde acá', hacer: () => ctx.nota?.('Desde acá la tirolesa sube', 'Sin alguien que tire no anda: largate desde el otro poste') };
      return { texto: sentido === 'llano' ? 'Colgarse de la tirolesa (es pareja: va a mano)' : 'Largarse por la tirolesa', hacer: () => empezar(l, desdeA, jugador) };
    }
    for (const o of terminadas(PUENTE.plano)) {
      if (!sueltas.has(o) || Math.hypot(o.datos.x - js.pos.x, o.datos.z - js.pos.z) > 1.4 || Math.abs(js.pos.y - o.datos.y) > 1.6) continue;
      const motivo = sueltas.get(o);
      return { texto: 'Estribo: falta el otro lado del puente', hacer: () => ctx.nota?.('El puente no está tendido', motivo) };
    }
    return null;
  }

  // ------------------------------------------------------------------ cada cuadro
  function vistaPrevia() {
    const O = ctx.obras?.(), plano = O?.plano, sitio = O?.estadoSitio;
    if (!plano || !sitio || (plano.id !== TIROLESA.plano && plano.id !== PUENTE.plano)) { guia.visible = false; return; }
    const esTirolesa = plano.id === TIROLESA.plano, R = esTirolesa ? TIROLESA : PUENTE;
    const y0 = Number.isFinite(sitio.base) ? sitio.base : T.altura(sitio.x, sitio.z);
    const aca = { x: sitio.x, y: y0 + (esTirolesa ? TIROLESA.altoCable : PUENTE.altoPiso), z: sitio.z };
    let otra = null, d0 = R.largoMax + 10;
    for (const o of terminadas(plano.id)) {
      const d = Math.hypot(o.datos.x - aca.x, o.datos.z - aca.z) - (sueltas.has(o) ? 1000 : 0);
      if (d < d0) { d0 = d; otra = o; }
    }
    if (!otra) { guia.visible = false; return; }
    let A = esTirolesa ? cableDe(otra) : pisoDe(otra), B = aca;
    const r = esTirolesa ? revisarTirolesa(A, B) : revisarPuente(A, B);
    if (!esTirolesa) [A, B] = bordes(A, B);
    const largo = Math.hypot(B.x - A.x, B.z - A.z);
    const l = { A, B, largo, comba: esTirolesa ? combaTirolesa(largo) : combaPuente(largo) };
    const arr = guiaGeo.attributes.position.array;
    for (let i = 0; i <= 16; i++) { const p = punto(l, i / 16); arr[i * 3] = p.x; arr[i * 3 + 1] = p.y + 0.05; arr[i * 3 + 2] = p.z; }
    guiaGeo.attributes.position.needsUpdate = true;
    guiaMat.color.setHex(r.ok ? 0x78c987 : 0xd26f68);
    guia.visible = true;
  }

  function actualizar(dt, jugador) {
    if ((revision -= dt) <= 0) {
      revision = 0.4;
      const f = firmaActual();
      if (f !== firma) { firma = f; reconstruir(jugador); }
    }
    if ((revisionGuia -= dt) <= 0) { revisionGuia = 0.15; vistaPrevia(); }
  }

  // guardando colgado del cable: se aparece en el poste de llegada
  // el pie del poste al que se llega (null si no se sabe)
  function pieDeLlegada(v) {
    const fin = v.dir > 0 ? v.linea.ob : v.linea.oa, y = Number(fin?.datos?.y);
    return Number.isFinite(y) ? y : null;
  }
  function posParaGuardar() {
    if (!viaje) return null;
    const p = enCable(viaje, viaje.linea.largo - 1.6), y = pieDeLlegada(viaje);
    return y === null ? { x: p.x, z: p.z } : { x: p.x, y, z: p.z };   // 3.8.3: con la altura de la llegada, como en `llegar`
  }

  // ¿se tendería entre dos pies (x, y, z del suelo)? Lo usa la guía y sirve para probar
  function probarLinea(tipo, pa, pb) {
    const alto = tipo === 'tirolesa' ? TIROLESA.altoCable : PUENTE.altoPiso;
    const a = { x: pa.x, y: pa.y + alto, z: pa.z }, b = { x: pb.x, y: pb.y + alto, z: pb.z };
    return tipo === 'tirolesa' ? revisarTirolesa(a, b) : revisarPuente(a, b);
  }

  return { actualizar, andar, accion, posParaGuardar, probarLinea, reconstruir: (j) => { firma = firmaActual(); reconstruir(j); },
    get lineas() { return lineas; }, get sueltas() { return sueltas; }, get viaje() { return viaje; }, guia, roldana };
}
