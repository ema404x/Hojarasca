// 3.9.0 · LA CANTINA, lo que se ve: el vaso, la jarra o el plato sobre la mesa (se arman por código, una sola vez, y se reusan), la bandeja de la
// moza (la malla es de gente-cuerpo.js: acá sólo se pide con cuántos vasos), el sorbo y el bocado en primera persona (el vaso sube hacia la cara
// inclinándose, el tenedor lleva el bocado) y el murmullo de las otras mesas (las voces de siempre, de lejos y bajito).
// Barato: geometrías y materiales compartidos, un grupo por cosa servida (a lo sumo uno por mesa), nada de luces ni de sombras propias.
import * as THREE from 'three';
import { vozDe, planBalbuceo } from './social-voz.js';
import { crearFormasNuevas } from './cantina-formas.js';

const GRIS = '#b8d4cc';
const MESA_Y = 0.32 + 0.78;   // el piso de adentro más la altura de la mesa (aldea-arquitectura.js: PISO + 0,76 + el mantel)

export function crearCantinaMundo(ctx) {
  const escena = ctx.escena;
  const geos = new Map(), mats = new Map();
  const geo = (clave, hace) => { let g = geos.get(clave); if (!g) { g = hace(); geos.set(clave, g); } return g; };
  const mat = (color, opts = {}) => { const k = `${color}|${opts.opacidad ?? 1}`; let m = mats.get(k); if (!m) { m = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.22), ...(opts.opacidad < 1 ? { transparent: true, opacity: opts.opacidad } : {}) }); mats.set(k, m);   // (3.9.2: un resplandor propio chico: de noche, adentro, lo que hay en la mesa no se va a negro) } return m; };
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = false; return o; };
  const cilindro = (r0, r1, h, lados = 8) => geo(`cil|${r0}|${r1}|${h}|${lados}`, () => new THREE.CylinderGeometry(r1, r0, h, lados, 1));
  const caja = (x, y, z) => geo(`caja|${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
  const bola = (r) => geo(`bola|${r}`, () => new THREE.SphereGeometry(r, 8, 6));

  // ---------------------------------------------------------------- lo que se sirve
  // Cada forma devuelve un grupo con sus `piezas` (lo que se va comiendo o tomando) y su `liquido` (si tiene)
  const FORMAS = {
    vaso(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.026, 0.032, 0.09), mat(GRIS, { opacidad: 0.78 }), 0, 0.045, 0));
      const liq = mesh(cilindro(0.024, 0.029, 0.07), mat(it.color), 0, 0.037, 0);
      g.add(liq); g.userData.liquido = liq; g.userData.altoLiquido = 0.07; g.userData.boca = 0.09;
      return g;
    },
    jarra(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.04, 0.046, 0.13), mat(GRIS, { opacidad: 0.78 }), 0, 0.065, 0));
      const liq = mesh(cilindro(0.038, 0.043, 0.1), mat(it.color), 0, 0.055, 0);
      g.add(liq);
      const espuma = mesh(bola(0.042), mat('#f4ecd4'), 0, 0.12, 0); espuma.scale.set(1, 0.4, 1); g.add(espuma);
      g.add(mesh(caja(0.015, 0.09, 0.02), mat(GRIS, { opacidad: 0.78 }), 0.056, 0.07, 0));
      g.userData.liquido = liq; g.userData.altoLiquido = 0.1; g.userData.espuma = espuma; g.userData.boca = 0.13;
      return g;
    },
    taza(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.03, 0.04, 0.075), mat('#e8e0d0'), 0, 0.0375, 0));
      const liq = mesh(cilindro(0.036, 0.036, 0.008), mat(it.color), 0, 0.066, 0);
      g.add(liq);
      g.add(mesh(caja(0.016, 0.04, 0.012), mat('#e8e0d0'), 0.049, 0.04, 0));
      g.userData.liquido = liq; g.userData.altoLiquido = 0.008; g.userData.boca = 0.075; g.userData.plano = true;
      return g;
    },
    'plato-empanadas'(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.1, 0.12, 0.016, 12), mat('#ece4d2'), 0, 0.008, 0));
      for (let i = 0; i < 4; i++) { const e = mesh(bola(0.045), mat(i % 2 ? '#c8863a' : '#d49a4a'), (i % 2 ? 0.05 : -0.045), 0.04, (i < 2 ? -0.03 : 0.04)); e.scale.set(1.4, 0.55, 1); e.rotation.y = i * 0.5; e.name = `pieza-${i}`; g.add(e); }
      return g;
    },
    tabla(it) {
      const g = new THREE.Group();
      g.add(mesh(caja(0.36, 0.02, 0.22), mat('#7a5230'), 0, 0.01, 0));
      let n = 0;
      for (let i = 0; i < 6; i++) { const c = mesh(caja(0.04, 0.025, 0.04), mat(i % 2 ? '#e4c060' : '#f0d878'), -0.13 + (i % 3) * 0.05, 0.032, -0.06 + Math.floor(i / 3) * 0.05); c.name = `pieza-${n++}`; g.add(c); }
      for (let i = 0; i < 4; i++) { const s = mesh(cilindro(0.022, 0.022, 0.008, 8), mat(i % 2 ? '#8a3030' : '#a84a40'), 0.0 + (i % 2) * 0.05, 0.03 + i * 0.002, 0.05 + Math.floor(i / 2) * 0.04); s.name = `pieza-${n++}`; g.add(s); }
      for (let i = 0; i < 4; i++) { const p = mesh(caja(0.05, 0.02, 0.04), mat('#d8b070'), 0.1, 0.03 + i * 0.006, -0.05 + i * 0.03); p.rotation.y = i * 0.3; p.name = `pieza-${n++}`; g.add(p); }
      g.userData.cantidad = n;
      return g;
    },
    cuenco(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.055, 0.09, 0.06, 12), mat('#8a5a3a'), 0, 0.03, 0));
      const guiso = mesh(cilindro(0.082, 0.082, 0.006, 12), mat(it.color), 0, 0.056, 0);
      g.add(guiso); g.userData.liquido = guiso; g.userData.altoLiquido = 0.006;
      g.add(mesh(caja(0.14, 0.01, 0.014), mat('#b8b4a8'), 0.05, 0.075, 0.03));
      return g;
    },
    'plato-tortas'(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.1, 0.12, 0.016, 12), mat('#ece4d2'), 0, 0.008, 0));
      for (let i = 0; i < 3; i++) { const t = mesh(cilindro(0.06, 0.06, 0.016, 10), mat(i === 1 ? '#c8944a' : '#d8a860'), (i - 1) * 0.045, 0.024 + i * 0.016, (i - 1) * 0.01); t.name = `pieza-${i}`; g.add(t); const a = mesh(cilindro(0.04, 0.04, 0.003, 8), mat('#f8f4e8'), t.position.x, t.position.y + 0.01, t.position.z); a.name = `pieza-${i}`; g.add(a); }
      return g;
    },
    'plato-trucha'(it) {
      const g = new THREE.Group();
      g.add(mesh(cilindro(0.11, 0.13, 0.016, 12), mat('#ece4d2'), 0, 0.008, 0));
      const pez = mesh(bola(0.08), mat('#c89a6a'), -0.01, 0.04, 0); pez.scale.set(1.9, 0.38, 0.62); g.add(pez);
      for (let i = 0; i < 4; i++) { const f = mesh(caja(0.03, 0.012, 0.05), mat(i % 2 ? '#b88a5a' : '#d8aa7a'), -0.07 + i * 0.045, 0.06, 0); f.name = `pieza-${i}`; g.add(f); }
      const limon = mesh(bola(0.025), mat('#e8d84a'), 0.1, 0.03, 0.04); limon.scale.set(1.2, 0.7, 1); g.add(limon);
      return g;
    },
  };
  // 3.9.2: los platos y bebidas nuevos de la cantina y de la casa de té (cantina-formas.js)
  Object.assign(FORMAS, crearFormasNuevas({ mesh, mat, cilindro, caja, bola, geo, GRIS }));
  const matBocado = new THREE.MeshLambertMaterial({ color: '#c8863a' });
  const tenedor = (() => {
    const g = new THREE.Group();
    g.add(mesh(caja(0.012, 0.008, 0.14), mat('#b8b8b0'), 0, 0, 0.07));
    g.add(mesh(caja(0.03, 0.006, 0.03), mat('#b8b8b0'), 0, 0, -0.01));
    const b = mesh(bola(0.02), matBocado, 0, 0.016, -0.01); b.name = 'bocado'; g.add(b);
    g.visible = false;
    return g;
  })();
  escena.add(tenedor);

  // ---------------------------------------------------------------- las mesas
  const enMesa = new Map();   // mesa.id → { g, item, silla, base: Vector3, total }
  // dónde queda lo tuyo en la mesa: adelante tuyo, apenas corrido a la derecha
  function lugarEnMesa(silla) {
    const dx = Math.sin(silla.mira), dz = Math.cos(silla.mira);
    // (3.9.2: cada mesa trae su altura: la de la galería de la casa de té no es la del salón ni la de la cantina)
    const y = Number.isFinite(silla.mesa?.y) ? silla.mesa.y : ctx.pisoY ? ctx.pisoY() + 0.78 : MESA_Y;
    const k = Number.isFinite(silla.mesa?.adelante) ? silla.mesa.adelante : 0.5;   // (a qué distancia de la silla: en la casa de té queda un poco más cerca, por lo que ya hay sobre las mesas)
    return new THREE.Vector3(silla.x + dx * k + dz * 0.1, y, silla.z + dz * k - dx * 0.1);
  }
  function ponerEnMesa(mesa, silla, item, restantes) {
    quitarDeMesa(mesa);
    const g = (FORMAS[item.forma] || FORMAS.vaso)(item);
    const base = lugarEnMesa(silla);
    g.position.copy(base);
    g.rotation.y = silla.mira;
    escena.add(g);
    // el posavasos de cuero (queda en la mesa cuando el vaso sube): se ve sobre el mantel
    let posavasos = null;
    if (/^(vaso|vaso-alto|jarra|taza)$/.test(item.forma)) { posavasos = mesh(cilindro(0.062, 0.062, 0.006, 12), mat('#3a2418'), base.x, base.y + 0.003, base.z); escena.add(posavasos); }
    const piezas = []; g.traverse((c) => { if (/^pieza-/.test(c.name)) piezas.push(c); });
    // lo caliente echa vapor (tres volutas que suben de la taza o el plato)
    const vapor = item.caliente ? crearVapor(g) : null;
    enMesa.set(mesa.id, { g, item, silla, base, total: item.porciones, piezas, posavasos, vapor, f: 1 });
    nivel(mesa, restantes, item);
  }
  function quitarDeMesa(mesa) {
    const e = enMesa.get(mesa.id);
    if (!e) return;
    escena.remove(e.g); if (e.posavasos) escena.remove(e.posavasos);
    if (e.vapor) for (const v of e.vapor) escena.remove(v);
    enMesa.delete(mesa.id);
    if (sorbo && sorbo.e === e) cancelarSorbo();
  }
  function limpiarTodo() { for (const e of [...enMesa.values()]) { escena.remove(e.g); if (e.posavasos) escena.remove(e.posavasos); if (e.vapor) for (const v of e.vapor) escena.remove(v); } enMesa.clear(); cancelarSorbo(); }
  // Lo que queda: el líquido baja y las piezas se van comiendo
  function nivel(mesa, restantes) {
    const e = enMesa.get(mesa.id);
    if (!e) return;
    const f = Math.max(0, Math.min(1, restantes / e.total));
    e.f = f;
    const liq = e.g.userData.liquido;
    if (liq) { liq.scale.y = Math.max(0.02, f); liq.position.y = (liq.userData.y0 ??= liq.position.y) - (e.g.userData.altoLiquido * (1 - f)) / 2; liq.visible = f > 0.01; }
    if (e.g.userData.espuma) e.g.userData.espuma.visible = f > 0.4;
    const n = e.piezas.length;
    if (n) { const quedan = Math.ceil(n * f); e.piezas.forEach((p, i) => { p.visible = i < quedan; }); }
  }

  // ---------------------------------------------------------------- 3.9.2: el vapor de lo caliente
  // (una voluta blanda: un círculo difuso dibujado por código; sin DOM —en las pruebas—, un cuadradito translúcido)
  const texVapor = (() => { try { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const r = g.createRadialGradient(16, 16, 1, 16, 16, 15); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); } catch { return null; } })();
  const matVapor = new THREE.MeshBasicMaterial({ color: '#f4f0e8', transparent: true, opacity: texVapor ? 0.5 : 0.16, depthWrite: false, ...(texVapor ? { map: texVapor } : {}) });
  const planoVapor = new THREE.PlaneGeometry(0.07, 0.09);
  function crearVapor(g) {
    const o = g.userData.vapor || [0, (g.userData.boca || 0.08) + 0.01, 0];
    const lista = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(planoVapor, matVapor);
      m.userData = { fase: i / 3, ox: o[0], oy: o[1], oz: o[2] };
      m.castShadow = false; m.receiveShadow = false; m.visible = false; m.frustumCulled = false;
      escena.add(m); lista.push(m);
    }
    return lista;
  }
  const vp = new THREE.Vector3();
  let relojVapor = 0;
  function moverVapor(dt, camara) {
    if (!camara) return;
    relojVapor += dt;
    for (const e of enMesa.values()) {
      if (!e.vapor) continue;
      const cerca = e.f > 0.02 && Math.hypot(camara.position.x - e.base.x, camara.position.z - e.base.z) < 9 && !(sorbo && sorbo.e === e);
      for (const m of e.vapor) {
        m.visible = cerca;
        if (!cerca) continue;
        const u = (relojVapor * 0.35 + m.userData.fase) % 1;
        vp.set(m.userData.ox, m.userData.oy + u * 0.2, m.userData.oz).applyEuler(e.g.rotation);
        m.position.set(e.base.x + vp.x + Math.sin(relojVapor * 1.7 + m.userData.fase * 9) * 0.012, e.base.y + vp.y, e.base.z + vp.z);
        m.scale.setScalar(0.6 + u * 1.5);
        m.quaternion.copy(camara.quaternion);
      }
    }
  }

  // ---------------------------------------------------------------- el sorbo y el bocado
  let sorbo = null;   // { e, t, dur, tipo, comida }
  const DUR = 1.7;
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), qy = new THREE.Quaternion(), qt = new THREE.Quaternion();
  const eje = new THREE.Vector3(1, 0, 0), arriba = new THREE.Vector3(0, 1, 0), adelante = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  function empezarSorbo(mesa, silla, item) {
    const e = enMesa.get(mesa.id);
    if (!e) return;
    cancelarSorbo();
    sorbo = { e, t: 0, comida: item.tipo === 'comida', base: e.base.clone(), alz: null };
    if (sorbo.comida) { matBocado.color.set(item.color || '#c8863a'); tenedor.visible = true; tenedor.position.copy(e.base); }
    // (3.9.2: en la tetera y el mate sube sólo la taza o la calabaza: se saca un rato del grupo y vuelve al terminar)
    else if (e.g.userData.alzable) {
      const alz = e.g.userData.alzable;
      sorbo.alz = alz; sorbo.alzLocal = alz.position.clone();
      escena.attach(alz);
      sorbo.base.copy(alz.position);
    }
  }
  function cancelarSorbo() {
    if (!sorbo) return;
    const { e } = sorbo;
    if (sorbo.alz) { e.g.add(sorbo.alz); sorbo.alz.position.copy(sorbo.alzLocal); sorbo.alz.rotation.set(0, 0, 0); sorbo.alz.quaternion.identity(); }
    else { e.g.position.copy(e.base); e.g.rotation.set(0, e.silla.mira, 0); }
    tenedor.visible = false;
    sorbo = null;
  }
  // 0 → 1 → 0: sube a la boca, se queda un instante y vuelve
  const curva = (u) => { const s = u < 0.45 ? u / 0.45 : u < 0.58 ? 1 : 1 - (u - 0.58) / 0.42; const x = Math.max(0, Math.min(1, s)); return x * x * (3 - 2 * x); };
  function actualizar(dt, camara) {
    moverVapor(dt, camara);
    if (sorbo && camara) {
      sorbo.t += dt;
      const u = Math.min(1, sorbo.t / DUR), k = curva(u);
      // la boca: adelante de la cámara y un poco abajo
      camara.getWorldDirection(adelante);
      b.copy(camara.position).addScaledVector(adelante, 0.32); b.y -= 0.1;
      const objeto = sorbo.comida ? tenedor : sorbo.alz || sorbo.e.g;
      a.copy(sorbo.base); if (sorbo.comida) a.y += 0.03;
      objeto.position.lerpVectors(a, b, k);
      // mirando para donde mirás (sólo el giro) y, el vaso, inclinándose hacia la boca
      qy.setFromAxisAngle(arriba, Math.atan2(adelante.x, adelante.z) + Math.PI);
      if (sorbo.comida) { qt.setFromAxisAngle(eje, -0.55 * k); objeto.quaternion.copy(qy).multiply(qt); objeto.quaternion.setFromAxisAngle(arriba, Math.atan2(adelante.x, adelante.z) + Math.PI); }
      else {
        q0.setFromAxisAngle(arriba, sorbo.e.silla.mira); qt.setFromAxisAngle(eje, 1.15 * k * (sorbo.e.g.userData.plano ? 0.45 : 1));
        q1.copy(qy).multiply(qt);
        objeto.quaternion.copy(q0).slerp(q1, k);
      }
      if (u >= 1) cancelarSorbo();
    }
  }

  // ---------------------------------------------------------------- la bandeja de la moza (la malla es de gente-cuerpo.js)
  // 3.9.2: lo que lleva se ve de verdad (el vaso, la tetera con su taza, el plato del día) sobre la bandeja de la moza o de la galesa: se arman como en la mesa, más chicos, y se
  // cuelgan del grupo de la bandeja (el de gente-cuerpo.js), que ya viene horizontal. `recoger`: lleva lo que levantó de la mesa (ya usado)
  const ESCALA_BANDEJA = { tetera: 0.62, 'servicio-te': 0.4, mate: 0.7, 'plato-asado': 0.62, 'plato-milanesa': 0.7, 'plato-tarta': 0.72, 'torta-negra': 0.8 };
  const DE_BEBER = /^(vaso|vaso-alto|jarra|taza)$/;
  function bandeja(npc, item, recoger = false) {
    const B = npc?.bandeja;
    if (!B) return;
    for (const x of B.extras || []) x.parent?.remove(x);
    B.extras = [];
    if (!item) { B.visible(false); B.vasos(0); return; }
    B.visible(true);
    B.vasos(0);
    const forma = FORMAS[item.forma] ? item.forma : 'vaso';
    const copias = DE_BEBER.test(forma) ? (recoger || item.porciones > 2 ? 2 : 1) : 1;
    const esc = DE_BEBER.test(forma) ? 0.85 : ESCALA_BANDEJA[forma] ?? 0.7;
    for (let i = 0; i < copias; i++) {
      const g = FORMAS[forma](item);
      g.scale.setScalar(esc);
      g.position.set(copias === 2 ? (i ? 0.055 : -0.055) : 0, 0.014, 0);
      // lo que ya se usó (al levantar la mesa): lo de adentro, bajo
      if (recoger) g.traverse((c) => { if (c.name === 'bocado') c.visible = false; });
      B.g.add(g); B.extras.push(g);
    }
  }
  function traerTodo(npc) { bandeja(npc, null); }

  // ---------------------------------------------------------------- el murmullo (las otras mesas, de lejos)
  const VOCES = ['oeste', 'sur', 'este', 'rincón', 'barra'].map((k, i) => vozDe(`cantina-${k}`, { edad: 28 + i * 9, mujer: i % 3 === 0 }));
  const FRASES = ['Eso fue anoche, no te hagas el que no sabe.', '¿Y vos qué hacés con el truco, che?', 'Ja ja, no me digas.', 'Servime otra, Lucre.', 'Mañana llueve, ya vas a ver.', 'Eso no se lo cree nadie.', 'Mmm, puede ser.'];
  function murmullo(sonido, centro, intensidad = 0.5) {
    if (!sonido?.balbuceo) return false;
    const i = Math.floor(Math.random() * VOCES.length);
    const ang = Math.random() * Math.PI * 2, r = 2 + Math.random() * 3;
    const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
    sonido.balbuceo(planBalbuceo(frase, VOCES[i], Math.floor(Math.random() * 1e6)), { pos: { x: centro.x + Math.cos(ang) * r, y: centro.y ?? 1.5, z: centro.z + Math.sin(ang) * r }, vol: 0.02 + 0.03 * intensidad });
    return true;
  }
  return { ponerEnMesa, quitarDeMesa, limpiarTodo, nivel, empezarSorbo, cancelarSorbo, actualizar, bandeja, murmullo, enMesa, sorboActivo: () => !!sorbo, formas: FORMAS, mat, mesh, cilindro, caja, bola, geo, traerTodo };
}
