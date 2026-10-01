// 2.8: personalización. Módulo puro (se prueba en Node): el registro de secciones del
// panel "Personalizar" y el guardado de lo elegido en `progreso.personal`.
//
// Cada parte del juego que se puede personalizar (ropa, perro, caballo, refugio, armas…)
// registra su sección con `registrarSeccion`. main.js arma el panel recorriendo
// `secciones()`. Lo elegido vive en `progreso.personal[id]` y se sanea al cargar con el
// `sanear` de cada sección, así una partida vieja o rota nunca rompe nada.
//
// Contrato de una sección:
//   {
//     id: 'perro',                    // clave en progreso.personal (sin eñe)
//     titulo: 'Tu perro',             // lo que ve el jugador
//     orden: 30,                      // posición en el panel (menor primero)
//     porDefecto: () => ({ ... }),    // lo que tiene una partida nueva
//     sanear: (datos) => ({ ... }),   // devuelve SIEMPRE un objeto válido
//     construir: (contenedor, api) => void,  // arma los controles (DOM), sólo en el juego
//     aplicar: (datos, api) => void,  // opcional: lleva lo elegido al mundo (mallas, sonidos)
//   }
// `api` lo da main.js: { progreso, datos, cambiar(parcial), guardar(), mundo }.

const registro = new Map();

export function registrarSeccion(s) {
  if (!s || typeof s.id !== 'string' || !s.id || /ñ/.test(s.id)) throw new Error('sección sin id válido');
  if (typeof s.sanear !== 'function' || typeof s.porDefecto !== 'function') throw new Error(`sección ${s.id}: falta sanear o porDefecto`);
  registro.set(s.id, { orden: 50, titulo: s.id, ...s });
  return s;
}

export function secciones() {
  return [...registro.values()].sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
}

export function seccion(id) { return registro.get(id) || null; }

// Lo guardado, saneado sección por sección. Claves desconocidas se conservan tal cual
// (una versión más nueva pudo agregarlas) pero sólo si son objetos simples.
export function sanearPersonal(p) {
  const fuente = p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  const out = {};
  for (const s of registro.values()) {
    let d = Object.hasOwn(fuente, s.id) ? fuente[s.id] : undefined;
    try { d = s.sanear(d && typeof d === 'object' ? d : s.porDefecto()); } catch { d = s.porDefecto(); }
    out[s.id] = d;
  }
  for (const k of Object.keys(fuente)) {
    if (k === '__proto__' || Object.hasOwn(out, k)) continue;
    const v = fuente[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = JSON.parse(JSON.stringify(v));
  }
  return out;
}

// Ayudas para los `sanear` de cada sección.
export const elegir = (v, opciones, def) => (opciones.includes(v) ? v : def);
export const color = (v, def) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : def);
export const texto = (v, def, max = 24) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) || def : def);
export const numero = (v, def, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
