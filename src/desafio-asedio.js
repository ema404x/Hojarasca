// 3.0: el asedio final de varias noches (reglas puras: sin three ni DOM).
//
// La noche final baja la nodriza. Si amanece y sigue en el aire, ya no se va: se asienta
// sobre el valle y clava agujas en cuatro zonas (tu base, la estación, el lago y el
// bosque). Cada aguja le da una capa de escudo y ensucia la zona alrededor.
//
//   · De día se va a una zona, se pelea con los que la cuidan y se revienta la aguja.
//     La zona queda recuperada: se planta una baliza y el escudo pierde una capa.
//   · De noche contraatacan: la oleada baja cerca de la última zona recuperada y va por
//     la baliza. Si aguanta hasta el alba, la zona queda asegurada para siempre; si cae,
//     la aguja vuelve a crecer (a la mitad) y hay que volver a romperla.
//   · Con tres zonas libres el escudo no alcanza a cerrar: se abre el haz de la nave y se
//     puede subir (ver `desafio-nave.js`). Con las cuatro, la nave está más débil adentro.
//
// Nada de esto traba la partida: si caés de noche, la zona sigue recuperada y se vuelve a
// defender la noche siguiente; el haz queda abierto mientras haya tres zonas libres.
import { danoAlLugar } from './desafio-valle.js';

export const ASEDIO = {
  zonasParaAbordar: 3,      // zonas libres (recuperadas o aseguradas) para que se abra el haz
  vidaAncla: 520,           // lo que aguanta cada aguja (por la vida de la dificultad)
  rebrote: 0.5,             // con cuánto vuelve a crecer si recuperan la zona
  vidaBaliza: 300,          // lo que aguanta tu baliza en el contraataque
  radioZona: 16,            // la mancha de la zona tomada (metros)
  cercaGuardia: 48,         // a esta distancia de la aguja salen los que la cuidan
  graciaGuardia: 45,        // segundos de respiro al empezar el asedio
  alturaNave: 52,           // a qué altura queda la nodriza asentada
  cristalesAncla: 4,        // lo que suelta cada aguja rota
  distanciaEntreZonas: 60,
};

// Las cuatro zonas, en el orden en que se muestran. `lugares` son claves de `T.lugares`
// (la primera que exista manda); la base se ubica alrededor del centro de tu base.
export const ZONAS_ASEDIO = [
  { id: 'base', nombre: 'Los alrededores de tu base', corto: 'tu base', lugares: [],
    guardianes: ['rastreador', 'rastreador', 'tirador'] },
  { id: 'estacion', nombre: 'La estación', corto: 'la estación', lugares: ['estacion', 'galpon', 'almacen'],
    guardianes: ['tirador', 'rastreador', 'rastreador', 'bruto'] },
  { id: 'lago', nombre: 'La orilla del lago', corto: 'el lago', lugares: ['muelle', 'faro', 'puente'],
    guardianes: ['escupidor', 'saltador', 'saltador', 'rastreador'] },
  { id: 'bosque', nombre: 'El bosque de arrayanes', corto: 'el bosque', lugares: ['arrayanes', 'mallin', 'mirador'],
    guardianes: ['saltador', 'rastreador', 'tirador', 'bruto'] },
];
const IDS = ZONAS_ASEDIO.map((z) => z.id);
const ESTADOS = ['tomada', 'recuperada', 'asegurada'];
export function defZona(id) { return ZONAS_ASEDIO.find((z) => z.id === id) || null; }

const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const ent = (v, def = 0, max = 1e6) => Math.max(0, Math.min(max, Math.floor(num(v, def))));

// `zonas`: [{ id, x, z }] ya ubicadas en el mundo; `nave`: { x, z } donde se asienta.
export function asedioNuevo(zonas, nave, vidaAncla = ASEDIO.vidaAncla) {
  const lista = (Array.isArray(zonas) ? zonas : [])
    .filter((z) => z && IDS.includes(z.id) && Number.isFinite(Number(z.x)) && Number.isFinite(Number(z.z)));
  if (!lista.length || !nave || !Number.isFinite(Number(nave.x)) || !Number.isFinite(Number(nave.z))) return null;
  const vida = Math.max(1, Math.round(num(vidaAncla, ASEDIO.vidaAncla)));
  return {
    activo: true, ganado: false,
    nave: { x: Number(nave.x), z: Number(nave.z) },
    zonas: lista.map((z) => ({ id: z.id, x: Number(z.x), z: Number(z.z), estado: 'tomada', vida, vidaMax: vida, baliza: 0, orden: 0, guardia: -1 })),
    contra: null,      // índice de la zona que contraatacan esta noche
    noches: 0,         // noches de asedio resistidas
    recuperadas: 0,    // contador para saber cuál es la última
    abordajes: 0, derrotasNave: 0,
  };
}

export function sanearAsedio(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const nave = x.nave && Number.isFinite(Number(x.nave.x)) && Number.isFinite(Number(x.nave.z)) ? { x: Number(x.nave.x), z: Number(x.nave.z) } : null;
  if (!nave) return null;
  const vistas = new Set();
  const zonas = [];
  for (const z of Array.isArray(x.zonas) ? x.zonas : []) {
    if (!z || typeof z !== 'object' || !IDS.includes(z.id) || vistas.has(z.id)) continue;
    if (!Number.isFinite(Number(z.x)) || !Number.isFinite(Number(z.z))) continue;
    vistas.add(z.id);
    const vidaMax = Math.max(1, Math.round(num(z.vidaMax, ASEDIO.vidaAncla)));
    const estado = ESTADOS.includes(z.estado) ? z.estado : 'tomada';
    zonas.push({
      id: z.id, x: Number(z.x), z: Number(z.z), estado,
      vida: estado === 'tomada' ? Math.max(1, Math.min(vidaMax, Math.round(num(z.vida, vidaMax)))) : 0,
      vidaMax,
      baliza: estado === 'recuperada' ? Math.max(0, Math.min(ASEDIO.vidaBaliza, num(z.baliza, ASEDIO.vidaBaliza))) : 0,
      orden: ent(z.orden, 0), guardia: Number.isFinite(Number(z.guardia)) ? Math.floor(Number(z.guardia)) : -1,
    });
  }
  if (!zonas.length) return null;
  const contra = Number.isInteger(x.contra) && zonas[x.contra]?.estado === 'recuperada' ? x.contra : null;
  return {
    activo: x.activo === undefined ? true : !!x.activo, ganado: !!x.ganado, nave, zonas, contra,
    noches: ent(x.noches, 0), recuperadas: ent(x.recuperadas, 0), abordajes: ent(x.abordajes, 0), derrotasNave: ent(x.derrotasNave, 0),
  };
}

export const asedioActivo = (a) => !!a && a.activo && !a.ganado;
export const zonasLibres = (a) => (a?.zonas || []).filter((z) => z.estado !== 'tomada').length;
export const zonasTomadas = (a) => (a?.zonas || []).filter((z) => z.estado === 'tomada').length;
// Las capas del escudo de la nave: una por aguja en pie.
export const capasEscudo = (a) => zonasTomadas(a);
export function puedeAbordar(a) {
  return asedioActivo(a) && zonasLibres(a) >= Math.min(ASEDIO.zonasParaAbordar, (a.zonas || []).length);
}
// Cuánto la debilitaste de más: con las cuatro zonas libres, la de adentro arranca con un
// ojo menos (ver `naveNueva`).
export function debilidadNave(a) { return Math.max(0, zonasLibres(a) - ASEDIO.zonasParaAbordar); }

// Un golpe a la aguja. Sólo de día: de noche la aguja se cierra en su caparazón.
export function danarAncla(a, i, dano, deDia = true) {
  const z = a?.zonas?.[i];
  if (!asedioActivo(a) || !z || z.estado !== 'tomada' || !deDia || !(dano > 0)) return { ok: false, rota: false };
  z.vida = Math.max(0, z.vida - dano);
  if (z.vida > 0) return { ok: true, rota: false };
  z.estado = 'recuperada';
  z.baliza = ASEDIO.vidaBaliza;
  a.recuperadas = (a.recuperadas || 0) + 1;
  z.orden = a.recuperadas;
  return { ok: true, rota: true, zona: z.id, abrePaso: puedeAbordar(a) && zonasLibres(a) === ASEDIO.zonasParaAbordar };
}

// Al caer la noche: contraatacan la última zona recuperada que todavía no está asegurada.
export function elegirContraataque(a) {
  if (!asedioActivo(a)) return null;
  let mejor = null;
  (a.zonas || []).forEach((z, i) => { if (z.estado === 'recuperada' && (mejor === null || z.orden > a.zonas[mejor].orden)) mejor = i; });
  a.contra = mejor;
  if (mejor !== null && !(a.zonas[mejor].baliza > 0)) a.zonas[mejor].baliza = ASEDIO.vidaBaliza;
  return mejor;
}
// Los invasores que le están pegando a la baliza esta noche (mismo ritmo que el lugar
// de un vecino en un rescate). Devuelve si la baliza cayó en este golpe.
export function desgastarBaliza(a, atacantes, dt, mult = 1) {
  const z = a?.contra !== null && a?.contra !== undefined ? a.zonas?.[a.contra] : null;
  if (!asedioActivo(a) || !z || z.estado !== 'recuperada' || !(atacantes > 0)) return { consumido: !!z && z.estado === 'recuperada', cayo: false };
  z.baliza = Math.max(0, z.baliza - danoAlLugar(atacantes, dt, mult));
  if (z.baliza > 0) return { consumido: true, cayo: false };
  // cayó: la aguja vuelve a crecer, a la mitad
  z.estado = 'tomada';
  z.vida = Math.max(1, Math.round(z.vidaMax * ASEDIO.rebrote));
  z.baliza = 0;
  z.guardia = -1;
  a.contra = null;
  return { consumido: true, cayo: true, zona: z.id };
}
// Al amanecer (o si caíste). Con la noche resistida y la baliza en pie, la zona queda
// asegurada. Si caíste, la zona sigue recuperada: se defiende de nuevo la noche que viene.
export function cerrarNocheAsedio(a, sobrevivida) {
  if (!asedioActivo(a)) return { asegurada: null };
  const z = a.contra !== null && a.contra !== undefined ? a.zonas[a.contra] : null;
  let asegurada = null;
  if (sobrevivida) {
    a.noches = (a.noches || 0) + 1;
    if (z && z.estado === 'recuperada' && z.baliza > 0) { z.estado = 'asegurada'; asegurada = z.id; }
  }
  a.contra = null;
  return { asegurada };
}
// La guardia de cada zona sale una vez por día, cuando te acercás a la aguja.
export function tocaGuardia(a, i, dia, distancia) {
  const z = a?.zonas?.[i];
  return asedioActivo(a) && !!z && z.estado === 'tomada' && z.guardia !== dia && distancia < ASEDIO.cercaGuardia;
}
export function guardianesDe(id, libres = 0) {
  const def = defZona(id);
  if (!def) return [];
  // cuantas más zonas perdieron, más cuidan las que quedan
  const extra = Math.min(2, Math.max(0, Math.floor(libres)));
  const lista = [...def.guardianes];
  for (let i = 0; i < extra; i++) lista.push(i % 2 ? 'tirador' : 'rastreador');
  return lista;
}
export function ganarAsedio(a) {
  if (!a) return false;
  a.ganado = true; a.activo = false; a.contra = null;
  for (const z of a.zonas) if (z.estado === 'recuperada') z.estado = 'asegurada';
  return true;
}

// Lo que dice el HUD, corto.
export function textoAsedio(a) {
  if (!asedioActivo(a)) return '';
  const n = (a.zonas || []).length, libres = zonasLibres(a);
  const contra = a.contra !== null && a.contra !== undefined ? a.zonas[a.contra] : null;
  const def = contra ? defZona(contra.id) : null;
  if (contra && def) return `Asedio · defendé la baliza de ${def.corto} (${Math.ceil(contra.baliza / ASEDIO.vidaBaliza * 100)}%)`;
  if (puedeAbordar(a)) return `Asedio · ${libres}/${n} zonas libres · el haz de la nave está abierto`;
  return `Asedio · ${libres}/${n} zonas libres · escudo ${capasEscudo(a)}`;
}
// Para el mapa: las agujas en pie, las balizas y la nave.
export function marcasAsedio(a) {
  if (!asedioActivo(a)) return [];
  const m = [];
  for (const z of a.zonas || []) {
    const def = defZona(z.id);
    const nombre = z.estado === 'tomada' ? `aguja · ${def?.corto || z.id}` : z.estado === 'recuperada' ? `baliza · ${def?.corto || z.id}` : `${def?.corto || z.id} (libre)`;
    m.push({ x: z.x, z: z.z, nombre, estado: z.estado });
  }
  m.push({ x: a.nave.x, z: a.nave.z, nombre: puedeAbordar(a) ? 'la nave (haz abierto)' : 'la nave nodriza', estado: 'nave' });
  return m;
}

// ---------------------------------------------------------------- dónde va cada cosa
// Puntos candidatos en un anillo, en orden estable (la semilla manda el arranque).
function anillo(c, r0, r1, azar, n = 48) {
  const salida = [];
  const a0 = azar() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = a0 + i * 2.39996;   // ángulo dorado: cubre el anillo sin repetir
    const r = r0 + ((i * 0.618034) % 1) * (r1 - r0);
    salida.push({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r });
  }
  return salida;
}
// `lugares`: T.lugares; `centro`: el centro de tu base; `esBueno(x, z)`: tierra firme,
// poca pendiente, sin obras; `azar`: el de la partida. Devuelve [{ id, x, z }].
export function ubicarZonas(lugares, centro, esBueno, azar = Math.random) {
  const hechas = [];
  const lejosDeOtras = (p) => hechas.every((q) => Math.hypot(q.x - p.x, q.z - p.z) >= ASEDIO.distanciaEntreZonas);
  for (const def of ZONAS_ASEDIO) {
    let p = null;
    if (def.id === 'base') {
      p = anillo(centro, 38, 58, azar).find((q) => esBueno(q.x, q.z) && lejosDeOtras(q)) || null;
    } else {
      for (const clave of def.lugares) {
        const L = lugares?.[clave];
        if (!L || !Number.isFinite(L.x) || !Number.isFinite(L.z)) continue;
        if (Math.hypot(L.x - centro.x, L.z - centro.z) < 80) continue;   // pegado a tu base no
        p = anillo(L, 18, 34, azar).find((q) => esBueno(q.x, q.z) && lejosDeOtras(q)) || null;
        if (p) break;
      }
      // si el mapa no tiene ese lugar (o queda encima de tu base), un punto lejos de la base
      if (!p) p = anillo(centro, 150, 240, azar, 72).find((q) => esBueno(q.x, q.z) && lejosDeOtras(q)) || null;
    }
    if (p) hechas.push({ id: def.id, x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10 });
  }
  return hechas;
}
// Dónde se asienta la nave: entre tu base y el centro del valle, sobre un llano (adentro
// de la nave se camina sobre un piso que está justo arriba: ver `desafio-nave.js`).
// `llano(x, z)` devuelve la pendiente máxima alrededor, o Infinity si no sirve.
export function ubicarNave(centro, llano, azar = Math.random) {
  const hacia = Math.atan2(-centro.z, -centro.x);
  let mejor = null, nota = Infinity;
  for (let i = 0; i < 64; i++) {
    const a = hacia + (i % 2 ? 1 : -1) * Math.floor((i + 1) / 2) * 0.19 + (azar() - 0.5) * 0.05;
    for (const r of [120, 150, 180, 100]) {
      const x = centro.x + Math.cos(a) * r, z = centro.z + Math.sin(a) * r;
      const p = llano(x, z);
      if (!Number.isFinite(p)) continue;
      const q = p + i * 0.002;   // a igual pendiente, la que mira al centro del valle
      if (q < nota) { nota = q; mejor = { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 }; }
    }
    if (mejor && nota < 0.12) break;
  }
  return mejor;
}
