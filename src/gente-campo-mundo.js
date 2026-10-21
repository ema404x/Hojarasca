// 4.6: la gente nueva fuera del pueblo, en el mundo (las reglas en gente-campo.js; la charla en gente-campo-juego.js).
// Fermín en el galpón de esquila, Belisario en el puesto del paso (va y viene por el oeste) y Tobías en la cantera. Son gente
// de gente.js como los demás (E habla con ellos, se paran a mirarte, se visten según la estación), con dos cuidados por el
// rendimiento (la plaza anda al límite de 16,7 ms y ellos viven lejos de ella, a más de 300 m):
//   · se arman recién cuando te acercás (a menos de 220 m) y de a poco (armarPobladorDeAPoco: unos ms por cuadro, uno por vez),
//     así la carga de la partida no cambia y no hay tirón al acercarse;
//   · gente.js ya los apaga a más de 130 m (ni se dibujan ni se mueven) y les recorta la sombra con la distancia.
// Su recorrido se busca en el lugar, con las colisiones de verdad (árboles, rocas, edificios, la pirca y el corral): cada
// tramo se camina sólo si está libre, lejos de la vía y del agua y sin cuesta fuerte. Así no atraviesan nada aunque el
// bosque cambie con la calidad gráfica.
import * as THREE from 'three';
import { PERSONAS_CAMPO, GALPON_RESPALDO, PUESTO_PASO, PUESTO_CANTERA, CANTERA } from './gente-campo.js';

const ARMAR_A = 220;       // a qué distancia se empieza a armar cada uno
const MS_POR_CUADRO = 3;   // lo que se arma por cuadro (como los pobladores de la aldea)
const aMundo = (b, rot, lx, lz) => ({ x: b.x + lx * Math.cos(rot) + lz * Math.sin(rot), z: b.z - lx * Math.sin(rot) + lz * Math.cos(rot) });

export function crearGenteCampoMundo({ T, col, gente }) {
  const figuras = {};   // clave → { def, tarea, npc }
  const _p = new THREE.Vector3();
  let rielCerca = null;
  // ¿Se puede parar ahí una persona? Sin choque (radio `r`), fuera del agua, a más de 4 m de la vía
  function libre(x, z, r = 0.7) {
    if (Math.abs(x) > 460 || Math.abs(z) > 460) return false;
    if (T.agua?.(x, z)) return false;
    const y = T.altura(x, z);
    _p.set(x, y + 0.05, z);
    col.resolver(_p, r, 1.6);
    if (Math.hypot(_p.x - x, _p.z - z) > 0.02) return false;
    for (const q of rielCerca || []) if (Math.hypot(q.x - x, q.z - z) < 4) return false;
    return true;
  }
  const cuesta = (a, b) => Math.abs(T.altura(b.x, b.z) - T.altura(a.x, a.z)) / Math.max(0.01, Math.hypot(b.x - a.x, b.z - a.z));
  // El punto libre más cercano a `p` (en espiral, hasta `max` metros), o null
  function cercaLibre(p, max = 14) {
    if (libre(p.x, p.z, 1.0)) return { x: p.x, z: p.z };
    for (let r = 1; r <= max; r += 1) for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (libre(x, z, 1.0)) return { x, z };
    }
    return null;
  }
  // Desde `a` hacia `hacia`, lo más lejos que se pueda caminar derecho (hasta `largo` m), o null si no se avanza ni `minimo`
  function tramo(a, hacia, largo, minimo = 4) {
    const dx = hacia.x - a.x, dz = hacia.z - a.z, d = Math.hypot(dx, dz) || 1;
    const ux = dx / d, uz = dz / d;
    let ultimo = null, prev = a;
    for (let s = 1; s <= Math.min(largo, d); s += 1) {
      const q = { x: a.x + ux * s, z: a.z + uz * s };
      if (!libre(q.x, q.z, 0.75) || cuesta(prev, q) > 0.55) break;
      ultimo = q; prev = q;
    }
    if (!ultimo || Math.hypot(ultimo.x - a.x, ultimo.z - a.z) < minimo) return null;
    // un metro antes del obstáculo
    const back = Math.max(minimo, Math.hypot(ultimo.x - a.x, ultimo.z - a.z) - 1);
    return { x: a.x + ux * back, z: a.z + uz * back };
  }
  function rielesCerca(c, radio = 90) { rielCerca = (T.riel || []).filter((q) => Math.hypot(q.x - c.x, q.z - c.z) < radio); }

  // Lo que necesita gente.agregarPoblador: { clave, nombre, oficio, saludo, despedida, colores, pos, mira, ruta, velocidad, mano }
  function definir(k) {
    const P = PERSONAS_CAMPO[k];
    const base = { clave: k, nombre: P.nombre, oficio: P.oficio, saludo: P.saludos.manana, despedida: P.despedida };
    if (k === 'fermin') {
      // al costado del portón del galpón, mirando el corral, y a la vuelta del corral (el galpón se sortea con la calidad)
      const g = T.lugares?.galpon || { ...GALPON_RESPALDO, rot: 0 };
      const rot = g.rot ?? 0;
      rielesCerca(g);
      const corral = aMundo(g, rot, -2, -15.6);
      const a = cercaLibre(aMundo(g, rot, 2.6, -5.4), 6) || cercaLibre(aMundo(g, rot, 6, -3), 10);
      if (!a) return null;
      const b = tramo(a, aMundo(g, rot, 10.5, -13), 16, 3) || a;
      const c = tramo(a, aMundo(g, rot, 7.5, -2.5), 8, 2) || a;
      const ruta = [
        { ...a, quieto: 28, mirar: corral },
        { ...b, quieto: 20, mirar: corral },
        { ...a, quieto: 12, mirar: corral },
        { ...c, quieto: 14, mirar: aMundo(g, rot, 30, 0) },
      ];
      return { ...base, colores: { poncho: true }, pos: a, mira: corral, ruta, velocidad: 0.7, mano: 'mate' };
    }
    if (k === 'belisario') {
      // su lugar, unos metros al este del puesto del paso (el puesto lo arma el agente «puestos»: que no quede adentro); va y
      // viene por el oeste, hacia la parada del mallín y hacia el mirador, por donde el bosque lo deja pasar
      rielesCerca(PUESTO_PASO, 120);
      const casa = cercaLibre({ x: PUESTO_PASO.x + 8, z: PUESTO_PASO.z + 3 }, 14);
      if (!casa) return null;
      const sur = tramo(casa, { x: -347, z: -159 }, 48, 6) || casa;
      const norte = tramo(casa, { x: -292, z: 36 }, 48, 6) || casa;
      const ruta = [
        { ...casa, quieto: 26, mirar: PUESTO_PASO },
        { ...sur, quieto: 9 },
        { ...casa, quieto: 6 },
        { ...norte, quieto: 11 },
      ];
      return { ...base, colores: {}, pos: casa, mira: PUESTO_PASO, ruta, velocidad: 1.05, mano: 'mate' };
    }
    if (k === 'tobias') {
      // a un costado de la veta (la arma el agente «recursos»), del lado del puesto de la cantera: pica, y cada tanto
      // camina unos pasos hacia el puesto a mirar lo que sacó
      rielesCerca(CANTERA, 120);
      const hacia = { x: PUESTO_CANTERA.x - CANTERA.x, z: PUESTO_CANTERA.z - CANTERA.z }, dh = Math.hypot(hacia.x, hacia.z);
      const junto = cercaLibre({ x: CANTERA.x + (hacia.x / dh) * 11, z: CANTERA.z + (hacia.z / dh) * 11 }, 12);
      if (!junto) return null;
      const lejos = tramo(junto, PUESTO_CANTERA, 14, 3) || junto;
      const ruta = [
        { ...junto, quieto: 30, mirar: CANTERA, pose: 'hachar' },
        { ...lejos, quieto: 10, mirar: CANTERA },
        { ...junto, quieto: 22, mirar: CANTERA, pose: 'hachar' },
        { ...lejos, quieto: 8, mirar: PUESTO_CANTERA },
      ];
      return { ...base, colores: {}, pos: junto, mira: CANTERA, ruta, velocidad: 0.75, mano: null };
    }
    return null;
  }
  // Dónde está (aproximado) cada uno, para decidir cuándo armarlo, sin buscar nada todavía
  function dondeAprox(k) {
    if (k === 'fermin') return T.lugares?.galpon || GALPON_RESPALDO;
    if (k === 'belisario') return PUESTO_PASO;
    return CANTERA;
  }

  let armando = null;
  function actualizar(dt, js, hablando = null) {
    if (!js?.pos) return;
    if (armando) {
      // uno por vez y de a poco
      const f = armando;
      if (f.tarea.avanzar(MS_POR_CUADRO)) {
        const npc = f.tarea.npc;
        npc.poblador = false;   // no es de la aldea (aldea-gente.js no lo maneja)
        npc.campo = true;       // (gente-campo-juego.js: la charla)
        npc.historias = [];     // (las historias van por el menú: gente-campo.js)
        f.npc = npc;
        armando = null;
      }
    } else {
      for (const k of Object.keys(PERSONAS_CAMPO)) {
        if (figuras[k]) continue;
        const c = dondeAprox(k);
        if (Math.hypot(c.x - js.pos.x, c.z - js.pos.z) > ARMAR_A) continue;
        const def = definir(k);
        figuras[k] = { def, tarea: null, npc: null };
        if (!def) continue;   // (sin lugar libre: no aparece, mejor que atravesado)
        figuras[k].tarea = gente.armarPobladorDeAPoco(def);
        armando = figuras[k];
        break;
      }
    }
    // la pose de lo que hace en cada parada (Tobías pica), sólo quieto y si no le estás hablando
    for (const k in figuras) {
      const n = figuras[k].npc;
      if (!n || !n.g.visible) continue;
      const e = n.ruta?.[n.etapa % n.ruta.length];
      const pose = e?.pose && hablando !== n && n.espera > 0 && n.vel < 0.05 ? e.pose : null;
      if (n.pose !== pose) n.pose = pose;
    }
  }
  const npcDe = (k) => figuras[k]?.npc || null;
  const lista = () => Object.values(figuras).map((f) => f.npc).filter(Boolean);
  return { actualizar, npcDe, lista, definir, libre, __figuras: figuras };
}
