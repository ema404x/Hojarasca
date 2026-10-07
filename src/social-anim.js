// 3.7.4: las animaciones de la vida social, sobre el esqueleto de gente-cuerpo.js (los mismos grupos que mueven posar y
// la quietud: torso, cabeza, brazos con su codo, piernas con su rodilla). Sin piezas nuevas ni dibujos de más: sólo
// giran y mueven lo que ya hay. gente.js llama a `animarSocial` en cada pose, al final (después de posar, la quietud y
// los gestos del amor), si la persona tiene `animSocial` (lo pone `empezarAnim`). Entra y sale suave (un cuarto de
// segundo) y se termina sola.
//
// Las que se hacen de a dos (el abrazo, el beso, chocar los cinco, de la mano, bailar lento, la cachetada) acercan a la
// persona a su compañero (`hacia`: un punto, el otro o vos) hasta la distancia del gesto, y al terminar vuelve a donde
// estaba. Mientras dura mira a su compañero (gente.js usa `animSocial.mira`).
// Sin three (se prueba en Node con figuras de mentira).

// Los ids son EXACTAMENTE los de vecindad-social.js (ANIM_VECINO; los de ANIM_JUGADOR que no tienen figura van a tus
// manos, social-mundo.js). 'pose': cuál de las poses de abajo usa (varias comparten); 'cerca': cuánto se acerca al otro.
const A = (pose, dur, extra = {}) => ({ pose, dur, ...extra });
export const ANIMACIONES = {
  saludar: A('saludar', 2), abrazar: A('abrazar', 2.6, { cerca: 0.5 }), 'chocar-cinco': A('cinco', 1.7, { cerca: 0.72 }), festejar: A('festejar', 2.2, { gesto: 'risa' }),
  suspirar: A('consolado', 2.4, { gesto: 'neutral' }), asentir: A('asentir', 2), hablar: A('charlar', 3), contar: A('chiste', 3.2), pensar: A('pensar', 2.6, { gesto: 'neutral' }),
  reir: A('reir', 2.6, { gesto: 'risa' }), 'mirar-raro': A('mirar-raro', 2, { gesto: 'neutral' }), negar: A('negar', 2, { gesto: 'neutral' }), encogerse: A('encoger', 2),
  'cruzarse-brazos': A('enojarse', 3, { gesto: 'neutral' }), 'irse-ofendido': A('irse', 2.6, { gesto: 'neutral' }), 'cachetada-suave': A('cachetada', 1.8, { cerca: 0.62, gesto: 'neutral' }),
  sonrojarse: A('timido', 2.6, { gesto: 'sonrisa' }), discutir: A('discutir', 3.4, { gesto: 'neutral' }), burlarse: A('burlarse', 2.6, { gesto: 'risa' }), sorprenderse: A('sorprenderse', 2),
  susurrar: A('susurrar', 2.6, { cerca: 0.55 }), 'abrazo-largo': A('abrazar', 4.4, { cerca: 0.46, largo: true }), 'tomar-mano': A('mano', 3.4, { cerca: 0.6 }),
  'bailar-lento': A('bailar-lento', 6, { cerca: 0.46, gesto: 'sonrisa' }), besar: A('beso', 2.6, { cerca: 0.42, gesto: 'sonrisa' }), 'cebar-mate': A('mate', 4), 'tomar-mate': A('mate', 4),
  'jugar-cartas': A('cartas', 6), pescar: A('pescar', 5), caminar: A('charlar', 2), posar: A('foto', 3, { gesto: 'sonrisa' }), 'patear-pelota': A('pelota', 3), bailar: A('bailar', 5, { gesto: 'sonrisa' }),
  // las tuyas que también puede hacer alguien (entre vecinos)
  aplaudir: A('aplaudir', 2.2, { gesto: 'sonrisa' }), 'palmada-hombro': A('consolar', 3, { cerca: 0.62 }), 'hacer-broma': A('chiste', 3), 'hacer-morisqueta': A('burlarse', 2.4, { gesto: 'risa' }),
  quejarse: A('discutir', 3, { gesto: 'neutral' }), ignorar: A('irse', 2.4, { gesto: 'neutral' }), 'pedir-perdon': A('consolado', 3), piropo: A('timido', 2.6, { gesto: 'sonrisa' }),
};
export function animDe(id) {
  const k = String(id || '');
  return Object.hasOwn(ANIMACIONES, k) ? k : null;
}
// las que se hacen pegados al otro
export const DE_A_DOS = new Set(Object.keys(ANIMACIONES).filter((k) => ANIMACIONES[k].cerca));

// Empieza una animación en `g` (una persona de gente.js). `opciones`: { hacia: { x, z } (o un objeto con `pos`), dur,
// rol, cerca (la distancia del gesto, si es de a dos: con vos, un poco más lejos) }. Devuelve si arrancó.
export function empezarAnim(g, id, opciones = {}) {
  const k = animDe(id);
  if (!g || !k || !g.torso || !g.brazos) { if (g) terminarAnim(g); return false; }
  if (g.animSocial) terminarAnim(g, true);
  const def = ANIMACIONES[k];
  const hacia = opciones.hacia?.pos || opciones.hacia || null;
  g.animSocial = {
    id: k, inicio: Number(g.fase) || 0, dur: Number.isFinite(opciones.dur) && opciones.dur > 0.4 ? opciones.dur : def.dur, w: 0,
    hacia: hacia && Number.isFinite(hacia.x) ? hacia : null, cerca: def.cerca ? (Number.isFinite(opciones.cerca) ? opciones.cerca : def.cerca) : 0, origen: g.pos ? { x: g.pos.x, z: g.pos.z } : null,
    mira: NaN, gestoAntes: g.__gesto, gesto: def.gesto || null, mateAntes: null, rol: opciones.rol || null,
  };
  if (def.gesto) g.__gesto = def.gesto;
  return true;
}
// Corta la animación (`ya`: sin volver a su lugar, porque arranca otra)
export function terminarAnim(g, ya = false) {
  const a = g?.animSocial;
  if (!a) return;
  if (g.__gesto === a.gesto) g.__gesto = a.gestoAntes;
  if (a.mateAntes !== null && g.mate) { g.mate.visible = a.mateAntes; g.__mateDejado = false; }
  if (!ya && a.origen && a.hacia && g.pos && a.cerca) g.__volverA = { x: a.origen.x, z: a.origen.z };
  g.animSocial = null;
}
export const animando = (g) => !!g?.animSocial;

const suave = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const mezcla = (a, b, w) => a + (b - a) * w;
// un brazo: x (adelante, negativo), z (abrirlo, positivo hacia afuera), codo (doblar, negativo), yl (girarlo sobre su eje)
function brazo(g, s, d, w) {
  const b = g.brazos[s];
  if (!b || !d) return;
  const l = s ? 1 : -1;
  b.rotation.order = 'XZY';
  b.rotation.x = mezcla(b.rotation.x, d.x, w);
  b.rotation.z = mezcla(b.rotation.z, l * (d.z || 0), w);
  b.rotation.y = mezcla(b.rotation.y, l * (d.yl || 0), w);
  const cd = b.userData?.codo;
  if (cd && Number.isFinite(d.codo)) cd.rotation.x = mezcla(cd.rotation.x, d.codo, w);
}
// La pose de cada una a los `s` segundos (u: de 0 a 1). Devuelve { izq, der, tx, tz, ty, cx, cy, cz, baja, sube, sentado }.
// (izq es brazos[0] y der brazos[1], como en posar)
function pose(id, s, u, def = {}) {
  const sin = Math.sin;
  switch (id) {
    case 'saludar': {
      const k = sin(s * 10) * 0.28;
      return { der: { x: -0.35, z: 2.35 + k, codo: -0.55 }, cz: -0.08 };
    }
    case 'abrazar': {
      const cierra = suave(Math.min(1, s / 0.6));
      const mece = def.largo ? sin(s * 1.6) * 0.05 : 0;
      const d = { x: -1.15, z: mezcla(0.7, 0.32, cierra), codo: mezcla(-0.4, -1.05, cierra), yl: -1.35 };
      return { izq: d, der: d, tx: 0.12, tz: mece, cx: 0.1, cz: 0.16 + mece };
    }
    case 'reir': {
      const k = sin(s * 15) * 0.045;
      return { izq: { x: -0.45, z: 0.1, codo: -1.7, yl: -1.0 }, der: { x: -0.2 + k * 2, z: 0.25, codo: -0.9 }, tx: -0.1 + k, cx: -0.22 + k, sube: Math.abs(k) * 0.3 };
    }
    case 'chiste': {
      const final = s > 2.2;
      if (final) return { izq: { x: -0.7, z: 0.9, codo: -0.5 }, der: { x: -0.7, z: 0.9, codo: -0.5 }, cx: -0.18, tx: -0.05 };
      return { izq: { x: -0.85 + sin(s * 5) * 0.3, z: 0.25, codo: -1.4 }, der: { x: -0.6 + sin(s * 5 + 2) * 0.4, z: 0.45, codo: -1.1 + sin(s * 6) * 0.3 }, cx: sin(s * 3) * 0.1, cy: sin(s * 1.7) * 0.15 };
    }
    case 'cinco': {
      // sube, choca (un golpecito a la mitad) y baja
      const sube = suave(Math.min(1, s / 0.55)), baja = s > 1.1 ? suave((s - 1.1) / 0.5) : 0, golpe = Math.max(0, 1 - Math.abs(s - 0.6) / 0.12);
      return { der: { x: mezcla(-0.2, -2.55, sube * (1 - baja)) + golpe * 0.18, z: 0.25, codo: -0.25 }, tx: -0.04 * sube, cx: -0.12 * sube };
    }
    case 'discutir': {
      const k = sin(s * 7.5);
      return { izq: { x: 0.08, yl: -1.4, z: 0.5, codo: -1.6 }, der: { x: -1.15 + k * 0.45, z: 0.3, codo: -1.2 + k * 0.3 }, tx: 0.1 + Math.abs(k) * 0.04, cy: sin(s * 9) * 0.18, cx: -0.05 };
    }
    case 'enojarse': case 'irse': {
      const d = { x: -0.68, yl: -1.34, z: -0.05, codo: -2 };
      return { izq: d, der: d, cy: 0.45, ty: 0.25, cx: -0.12 };
    }
    case 'cachetada': {
      // el brazo viene de afuera y cruza (suave: es una cachetada de comedia), después las manos en la cintura
      const k = s < 0.35 ? suave(s / 0.35) : 1, cruza = s >= 0.35 && s < 0.6 ? suave((s - 0.35) / 0.25) : s >= 0.6 ? 1 : 0;
      if (s > 1) return { izq: { x: 0.08, yl: -1.4, z: 0.5, codo: -1.6 }, der: { x: 0.08, yl: -1.4, z: 0.5, codo: -1.6 }, cx: -0.1, cy: 0.2 };
      return { der: { x: -1.3 * k, z: mezcla(1.25, -0.25, cruza), codo: -0.35 }, ty: mezcla(-0.3, 0.25, cruza) * k, cx: -0.05 };
    }
    case 'mano': {
      return { der: { x: -0.4, z: 0.14, codo: -0.15 }, cy: -0.25 + sin(s * 0.8) * 0.08, cz: 0.06 };
    }
    case 'beso': {
      const k = suave(Math.min(1, s / 0.7)) * (s > 2 ? 1 - suave((s - 2) / 0.5) : 1);
      const d = { x: -1.25, z: 0.32, codo: -0.95 };
      return { izq: d, der: d, tx: 0.16 * k, cx: 0.18 * k, cz: 0.22 * k };
    }
    case 'bailar-lento': {
      const k = sin(s * 1.9);
      return { izq: { x: -1.38, z: 0.42, codo: -1.0 }, der: { x: -1.0, z: 0.22, codo: -1.25 }, tz: k * 0.07, cz: -k * 0.05 + 0.1, tx: 0.06, paso: k };
    }
    case 'consolar': {
      return { der: { x: -1.45 + sin(s * 4) * 0.05, z: 0.05, codo: -0.45 }, cz: 0.18, cx: 0.12, tx: 0.05 };
    }
    case 'consolado': {
      const d = { x: -0.5, z: -0.05, codo: -1.55, yl: -1.1 };
      return { izq: d, der: d, cx: 0.35, tx: 0.08 };
    }
    case 'cartas': {
      const tira = Math.max(0, sin(s * 1.7)) ** 6;
      return { izq: { x: -0.95, z: 0.12, codo: -1.05 }, der: { x: -0.85 - tira * 0.5, z: 0.18, codo: -1.0 + tira * 0.5 }, cx: 0.3, sentado: true };
    }
    case 'foto': {
      return { der: { x: -2.05, z: 0.65, codo: -1.85 }, izq: { x: 0.08, yl: -1.4, z: 0.5, codo: -1.6 }, cz: -0.12 };
    }
    case 'sacar-foto': {
      const d = { x: -1.45, z: 0.15, codo: -1.35 };
      return { izq: d, der: d, cx: 0.15 };
    }
    case 'charlar': {
      return { izq: { x: -0.35 + sin(s * 3.5) * 0.25, z: 0.1, codo: -0.9 }, der: { x: -0.3 - sin(s * 3.5) * 0.2, z: 0.12, codo: -0.8 }, cx: sin(s * 4) * 0.05 };
    }
    case 'encoger': {
      const k = Math.sin(Math.min(1, s / 1.2) * Math.PI);
      const d = { x: -0.35, z: 0.55 * k + 0.1, codo: -1.5 * k };
      return { izq: d, der: d, cz: 0.18 * k, sube: 0.02 * k };
    }
    case 'timido': {
      const d = { x: 0.5, yl: -1.45, z: 0.08, codo: -1.3 };
      return { izq: d, der: d, cx: 0.3, cy: -0.2, tz: sin(s * 2.4) * 0.04 };
    }
    case 'festejar': { const k = sin(s * 9) * 0.2; const d = { x: -0.3, z: 2.6 + k, codo: -0.3 }; return { izq: d, der: { ...d, z: 2.6 - k }, cx: -0.2, sube: Math.abs(sin(s * 6)) * 0.04 }; }
    case 'asentir': return { cx: sin(s * 6) * 0.14, der: { x: -0.3, z: 0.1, codo: -0.9 } };
    case 'negar': return { cy: sin(s * 8) * 0.3, izq: { x: 0.08, yl: -1.4, z: 0.5, codo: -1.6 } };
    case 'pensar': return { der: { x: -1.05, yl: -0.62, z: -0.12, codo: -2.5 }, izq: { x: -0.62, yl: -1.3, z: -0.06, codo: -2.05 }, cx: -0.15, cz: 0.12 };
    case 'mirar-raro': return { cx: -0.12, cz: 0.28, tx: -0.08, izq: { x: 0.2, z: 0.15, codo: -0.4 }, der: { x: 0.2, z: 0.15, codo: -0.4 } };
    case 'sorprenderse': { const k = suave(Math.min(1, s / 0.3)); const d = { x: -0.9 * k, z: 0.6 * k, codo: -1.4 * k }; return { izq: d, der: d, tx: -0.1 * k, cx: -0.15 * k }; }
    case 'susurrar': return { der: { x: -1.25, yl: -0.6, z: 0.1, codo: -2.3 }, tx: 0.14, cz: 0.2, cx: 0.08 };
    case 'burlarse': { const k = sin(s * 10) * 0.15; const d = { x: -1.6, z: 1.3 + k, codo: -2.3 }; return { izq: d, der: { ...d, z: 1.3 - k }, cz: sin(s * 5) * 0.15 }; }
    case 'mate': { const k = Math.max(0, sin(s * 1.6)); return { der: { x: -0.4 - 1.1 * k, yl: -0.4 * k, z: 0.1, codo: -0.8 - 1.2 * k }, izq: { x: -0.5, z: 0.1, codo: -1.3 }, cx: -0.1 * k }; }
    case 'pescar': { const k = sin(s * 0.9) * 0.08; const d = { x: -0.95 + k, z: 0.1, codo: -0.6 }; return { izq: d, der: { ...d, x: -1.05 + k }, cx: 0.1 }; }
    case 'pelota': { const k = Math.max(0, sin(s * 3)); return { izq: { x: 0.3, z: 0.5, codo: -0.4 }, der: { x: -0.4, z: 0.5, codo: -0.4 }, tx: -0.08 * k, patada: k }; }
    case 'bailar': { const k = sin(s * 5.5); return { izq: { x: -0.9 + k * 0.4, z: 0.6, codo: -1.4 }, der: { x: -0.9 - k * 0.4, z: 0.6, codo: -1.4 }, tz: k * 0.1, cz: -k * 0.06, sube: Math.abs(k) * 0.04, paso: k * 2 }; }
    case 'aplaudir': { const k = Math.abs(sin(s * 9)); const d = { x: -1.2, yl: -0.5, z: 0.05 + k * 0.25, codo: -1.0 }; return { izq: d, der: d }; }
    default: return {};
  }
}

// Cada pose (gente.js, después de lo demás). `dt`: el del cuadro.
const CADERA = 0.82, CANILLA = 0.44;
export function animarSocial(g, dt = 0.016) {
  const a = g?.animSocial;
  if (!a) return;
  const s = (Number(g.fase) || 0) - a.inicio;
  // si arrancó a caminar (lo llamó su horario), se corta
  if (g.vel > 0.05 && !a.hacia) { terminarAnim(g); return; }
  const fin = a.dur;
  if (s >= fin + 0.3) { terminarAnim(g); return; }
  const w = suave(Math.min(1, s / 0.25)) * (s > fin ? 1 - suave((s - fin) / 0.3) : 1);
  a.w = w;
  // el mate, guardado mientras tanto (las manos están ocupadas)
  if (g.mate && a.mateAntes === null) { a.mateAntes = g.mate.visible !== false; g.mate.visible = false; g.__mateDejado = true; }
  // acercarse al compañero (y mirarlo)
  if (a.hacia && g.pos) {
    const dx = a.hacia.x - g.pos.x, dz = a.hacia.z - g.pos.z, d = Math.hypot(dx, dz);
    a.mira = Math.atan2(dx, dz);
    const po = ANIMACIONES[a.id].pose;
    if (po === 'irse' || po === 'enojarse') a.mira += Math.PI * (po === 'irse' ? 1 : 0.35);
    if (a.cerca && d > a.cerca + 0.02 && s < fin) {
      const paso = Math.min(d - a.cerca, 0.9 * Math.min(0.1, dt));
      g.pos.x += (dx / d) * paso; g.pos.z += (dz / d) * paso;
    }
  }
  const P = pose(ANIMACIONES[a.id].pose, s, Math.min(1, s / fin), ANIMACIONES[a.id]);
  if (P.izq) brazo(g, 0, P.izq, w);
  if (P.der) brazo(g, 1, P.der, w);
  if (P.tx) g.torso.rotation.x += P.tx * w;
  if (P.tz) g.torso.rotation.z += P.tz * w;
  if (P.ty) g.torso.rotation.y += P.ty * w;
  if (g.cabeza) {
    if (P.cx) g.cabeza.rotation.x += P.cx * w;
    if (P.cy) g.cabeza.rotation.y += P.cy * w;
    if (P.cz) g.cabeza.rotation.z += P.cz * w;
  }
  if (P.sube) { g.torso.position.y += P.sube * w; if (g.cabeza) g.cabeza.position.y += P.sube * w; }
  if (P.paso && g.patas) g.patas.forEach((p, i) => { p.rotation.x += (i ? 1 : -1) * P.paso * 0.08 * w; });
  if (P.patada && g.patas?.[1]) g.patas[1].rotation.x -= P.patada * 0.9 * w;
  // las cartas, sentados en el piso: la cadera baja y las piernas van estiradas adelante (como el almohadón de la biblioteca)
  if (P.sentado && g.patas) {
    const b = (CADERA - 0.12) * w, cadera = CADERA - b;
    const recoge = cadera < CANILLA ? Math.acos(Math.max(0, cadera - 0.02) / CANILLA) : 0;
    g.torso.position.y -= b; if (g.cabeza) g.cabeza.position.y -= b;
    for (const br of g.brazos) br.position.y -= b;
    for (const p of g.patas) {
      p.position.y -= b; p.rotation.x = mezcla(p.rotation.x, -1.45, w);
      if (p.userData?.rodilla) p.userData.rodilla.rotation.x = mezcla(p.userData.rodilla.rotation.x, 1.45 - recoge, w);
    }
  }
}
// Al terminar una de a dos, vuelve de a poco a donde estaba (gente.js la llama cada cuadro si hay `__volverA`)
export function volverDeAnim(g, dt = 0.016) {
  const v = g?.__volverA;
  if (!v || !g.pos) return;
  if (g.animSocial || g.vel > 0.05) { g.__volverA = null; return; }
  const dx = v.x - g.pos.x, dz = v.z - g.pos.z, d = Math.hypot(dx, dz);
  if (d < 0.02) { g.__volverA = null; return; }
  const paso = Math.min(d, 0.8 * Math.min(0.1, dt));
  g.pos.x += (dx / d) * paso; g.pos.z += (dz / d) * paso;
}
