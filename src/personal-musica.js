// 2.8: "Tu música": el tocadiscos del refugio y las melodías que vas encontrando por el
// valle. Módulo puro (se prueba en Node): acá están las melodías, lo guardado, la sección
// del panel y el que las toca. El tocadiscos se dibuja y las partituras se esconden en
// `objetos.js`; el motor de audio (`sonido.js`) llama a `actualizarTocadiscos` en cada
// cuadro y deja de tirar las frases sueltas del piano mientras suena un disco.
//
// Una melodía se escribe como "nota:tiempos" separadas por espacios (R es silencio) y
// `bajos` es la nota grave de cada compás. Son todas propias, en re, como la música
// del valle (ver `musica-relax.js`), para que suenen al mismo lugar.
import { registrarSeccion, elegir } from './personalizacion.js';
import { campoElegir, campoSi, subtitulo, nota, boton, fila, enLinea, refDelMundo } from './personal-campos.js';

export const MELODIAS = [
  { id: 'refugio', nombre: 'Vals del refugio', instrumento: 'guitarra', pulso: 108, compas: 3, inicial: true,
    pista: 'La sabés de siempre.',
    notas: 'A4:1 D5:2 C#5:1 B4:1 A4:1 F#4:2 A4:1 G4:3 E4:1 G4:2 F#4:1 E4:1 D4:1 E4:2 F#4:1 A4:3 A4:1 D5:2 C#5:1 B4:1 A4:1 B4:2 G4:1 E4:3 F#4:1 A4:1 G4:1 E4:1 C#4:1 E4:1 D4:3 R:3',
    bajos: [50, 45, 50, 43, 45, 50, 45, 45, 50, 45, 43, 45, 50, 45, 50, 0] },
  { id: 'zamba', nombre: 'Zamba del lago', instrumento: 'guitarra', pulso: 160, compas: 6, lugar: 'muelle',
    pista: 'Dicen que se voló una hoja de cancionero cerca del muelle.',
    notas: 'F#4:2 A4:1 D5:2 C#5:1 B4:3 A4:3 G4:2 B4:1 E5:2 D5:1 C#5:6 A4:2 C#5:1 E5:2 D5:1 C#5:3 B4:3 A4:2 G4:1 F#4:2 E4:1 D4:6',
    bajos: [50, 43, 43, 45, 45, 45, 45, 50], vueltas: 2 },
  { id: 'milonga', nombre: 'Milonga del puente', instrumento: 'guitarra', pulso: 200, compas: 4, lugar: 'puente',
    pista: 'Alguien la tocaba sentado en el puente de troncos.',
    notas: 'D4:1.5 F#4:1.5 A4:1 G4:1.5 B4:1.5 D5:1 C#5:1 B4:1 A4:1 G4:1 F#4:4 E4:1.5 G4:1.5 B4:1 A4:1.5 C#5:1.5 E5:1 D5:1 C#5:1 B4:1 C#5:1 D5:4',
    bajos: [50, 43, 45, 50, 52, 45, 45, 50], vueltas: 3 },
  { id: 'huella', nombre: 'Huella del mallín', instrumento: 'guitarra', pulso: 190, compas: 6, lugar: 'mallin',
    pista: 'Quedó una partitura mojada en el mallín.',
    notas: 'A4:1 A4:1 B4:1 C#5:1 D5:2 B4:1 A4:1 G4:2 F#4:2 E4:1 F#4:1 G4:1 A4:1 B4:2 A4:6 A4:1 B4:1 C#5:1 D5:1 E5:2 D5:1 C#5:1 B4:2 A4:2 G4:1 F#4:1 E4:1 F#4:1 E4:2 D4:6',
    bajos: [50, 43, 45, 50, 45, 43, 45, 50], vueltas: 2 },
  { id: 'cuna', nombre: 'Canción de cuna del faro', instrumento: 'quena', pulso: 150, compas: 6, lugar: 'faro',
    pista: 'La del farero: se le perdió cerca del faro.',
    notas: 'F#5:2 E5:1 D5:3 E5:2 F#5:1 A4:3 B4:2 D5:1 E5:2 F#5:1 E5:6 F#5:2 A5:1 G5:2 F#5:1 E5:2 D5:1 B4:3 A4:2 B4:1 D5:2 E5:1 D5:6',
    bajos: [50, 45, 43, 45, 50, 43, 45, 50], vueltas: 2 },
  { id: 'vidala', nombre: 'Vidala de la nieve', instrumento: 'quena', pulso: 132, compas: 6, lugar: 'mirador',
    pista: 'Una hoja trajinada, allá arriba en el mirador.',
    notas: 'D5:2 F5:1 E5:2 D5:1 C5:3 A4:3 A4:2 C5:1 D5:2 F5:1 E5:6 F5:2 G5:1 A5:2 F5:1 E5:2 D5:1 C5:3 D5:2 E5:1 C5:2 A4:1 D5:6',
    bajos: [50, 45, 50, 45, 53, 48, 45, 50], vueltas: 2 },
  { id: 'arrayan', nombre: 'Aire del arrayán', instrumento: 'quena', pulso: 150, compas: 6, lugar: 'arrayanes',
    pista: 'Entre los troncos color canela, en el bosque de arrayanes.',
    notas: 'A4:1 D5:1 E5:2 G5:2 E5:1 D5:1 E5:4 A4:1 C5:1 D5:2 E5:1 D5:1 A4:6 D5:1 E5:1 G5:2 A5:2 G5:1 E5:1 D5:4 C5:1 A4:1 G4:2 A4:1 C5:1 D5:6',
    bajos: [50, 50, 45, 45, 50, 50, 43, 50], vueltas: 2 },
];
export const MELODIA = Object.fromEntries(MELODIAS.map((m) => [m.id, m]));
export const IDS_MELODIAS = MELODIAS.map((m) => m.id);
export const MODOS_TOCADISCOS = [
  { id: 'una', nombre: 'La elegida, una y otra vez' },
  { id: 'todas', nombre: 'Todas las que tengas, en orden' },
];

const SEMITONO = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// "F#4:1.5" → { midi: 66, t: 1.5 }; "R:2" → { midi: null, t: 2 }. Lo que no se entiende, se salta.
export function leerNotas(s) {
  const out = [];
  for (const parte of String(s || '').trim().split(/\s+/)) {
    const m = /^(?:(R)|([A-G])(#|b)?(\d)):(\d+(?:\.\d+)?)$/.exec(parte);
    if (!m) continue;
    const t = Number(m[5]);
    if (!(t > 0)) continue;
    if (m[1]) { out.push({ midi: null, t }); continue; }
    const midi = 12 * (Number(m[4]) + 1) + SEMITONO[m[2]] + (m[3] === '#' ? 1 : m[3] === 'b' ? -1 : 0);
    out.push({ midi, t });
  }
  return out;
}

// Los golpes de una melodía, en segundos desde que empieza: la melodía, los bajos de
// cada compás y las vueltas. Se arma una vez por melodía.
const cacheEventos = new Map();
export function eventosDe(id) {
  if (cacheEventos.has(id)) return cacheEventos.get(id);
  const m = Object.hasOwn(MELODIA, id) ? MELODIA[id] : null;
  if (!m) return null;
  const seg = 60 / m.pulso;
  const notas = leerNotas(m.notas);
  const largo = notas.reduce((a, n) => a + n.t, 0) * seg;
  const ev = [];
  for (let v = 0; v < (m.vueltas || 1); v++) {
    const base = v * largo;
    let c = 0;
    for (const n of notas) {
      if (n.midi !== null) ev.push({ cuando: base + c * seg, midi: n.midi, dur: n.t * seg, bajo: false });
      c += n.t;
    }
    (m.bajos || []).forEach((b, k) => {
      if (b > 0) ev.push({ cuando: base + k * m.compas * seg, midi: b, dur: m.compas * seg, bajo: true });
    });
  }
  ev.sort((a, b) => a.cuando - b.cuando);
  const r = { eventos: ev, duracion: largo * (m.vueltas || 1), instrumento: m.instrumento };
  cacheEventos.set(id, r);
  return r;
}

// ---------------------------------------------------------------- lo guardado
export function musicaPorDefecto() {
  return { elegida: 'refugio', modo: 'una', encendido: true, halladas: [] };
}
export function sanearMusica(d) {
  const b = musicaPorDefecto();
  const v = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const halladas = Array.isArray(v.halladas)
    ? [...new Set(v.halladas.filter((id) => typeof id === 'string' && Object.hasOwn(MELODIA, id) && !MELODIA[id].inicial))]
    : [];
  return {
    elegida: elegir(v.elegida, IDS_MELODIAS, b.elegida),
    modo: elegir(v.modo, MODOS_TOCADISCOS.map((m) => m.id), b.modo),
    encendido: v.encendido !== false,
    halladas,
  };
}
// las que se pueden poner: la de siempre y las encontradas, en el orden del disco
export function disponibles(datos) {
  const h = new Set(datos?.halladas || []);
  return MELODIAS.filter((m) => m.inicial || h.has(m.id)).map((m) => m.id);
}
// la que suena después de `id` en el tocadiscos; null = apagado
export function siguienteDisco(datos, id) {
  const lista = disponibles(datos);
  if (!id) return lista[0] || null;
  const i = lista.indexOf(id);
  return i >= 0 && i < lista.length - 1 ? lista[i + 1] : null;
}
// Anotar una partitura encontrada en la partida. Devuelve la melodía si es nueva.
export function anotarPartitura(progreso, id) {
  if (!progreso || typeof progreso !== 'object' || !Object.hasOwn(MELODIA, id) || MELODIA[id].inicial) return null;
  if (!progreso.personal || typeof progreso.personal !== 'object' || Array.isArray(progreso.personal)) progreso.personal = {};
  const d = sanearMusica(progreso.personal.musica);
  if (d.halladas.includes(id)) { progreso.personal.musica = d; return null; }
  d.halladas.push(id);
  // la primera que encontrás queda puesta, para escucharla al volver al refugio
  if (d.elegida === 'refugio' && d.halladas.length === 1) d.elegida = id;
  progreso.personal.musica = d;
  tocadiscos.datos = d;
  return MELODIA[id];
}

// ---------------------------------------------------------------- el tocadiscos
// Estado compartido: `objetos.js` pone dónde está y el disco (para hacerlo girar), la
// sección y `objetos.js` ponen qué está elegido, y `sonido.js` lo hace sonar.
export const tocadiscos = { pos: null, radio: 6.5, disco: null, datos: null, sonando: null, proxima: 0, indice: 0, ultimaElegida: null, acum: 0, nota: null, guardar: null };
const PAUSA = 7;        // segundos entre disco y disco
const ADELANTO = 1.2;   // cuánto se programa por adelantado

export const tocadiscosSuena = () => !!tocadiscos.sonando;

function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// Empieza a tocar una melodía: devuelve lo que hace falta para seguir programándola.
export function empezarMelodia(sonido, id, vol = 1) {
  const ev = eventosDe(id);
  if (!ev || !sonido?.ctx || !sonido.bus?.musica) return null;
  const ctx = sonido.ctx;
  const destino = ctx.createGain(); destino.gain.value = 0.85 * vol;
  destino.connect(sonido.bus.musica);
  let rv = null;
  if (sonido.envioReverb) { rv = ctx.createGain(); rv.gain.value = 0.9; destino.connect(rv); rv.connect(sonido.envioReverb); }
  return { id, destino, rv, t0: ctx.currentTime + 0.2, i: 0, ev, fin: ctx.currentTime + 0.2 + ev.duracion + 1.5 };
}
// Programa lo que toca en el próximo tramo. Devuelve false cuando ya no queda nada.
export function seguirMelodia(sonido, s) {
  if (!s || !sonido?.ctx) return false;
  const ahora = sonido.ctx.currentTime;
  const hasta = ahora + ADELANTO - s.t0;
  const quena = s.ev.instrumento === 'quena';
  while (s.i < s.ev.eventos.length && s.ev.eventos[s.i].cuando <= hasta) {
    const e = s.ev.eventos[s.i++];
    const cuando = Math.max(0, s.t0 + e.cuando - ahora);
    if (e.bajo) sonido.pulsar?.(e.midi, { cuando, dur: Math.max(1.2, e.dur * 1.4), vol: 0.07, destino: s.destino });
    else if (quena) sonido.quena?.(hz(e.midi), { cuando, dur: Math.max(0.3, e.dur * 0.94), vol: 0.03, destino: s.destino });
    else sonido.pulsar?.(e.midi, { cuando, dur: Math.max(1.4, e.dur * 2), vol: 0.13 * Math.pow(2, (e.midi - 57) / 24), destino: s.destino });
  }
  return s.i < s.ev.eventos.length || ahora < s.fin;
}
// Se apaga despacio y se suelta del bus cuando ya no suena.
export function callarMelodia(sonido, s, rapido = false) {
  if (!s || !sonido?.ctx) return;
  const t = sonido.ctx.currentTime;
  try { s.destino.gain.cancelScheduledValues(t); s.destino.gain.setTargetAtTime(0, t, rapido ? 0.08 : 0.5); } catch {}
  s.i = s.ev.eventos.length;
  const falta = Math.max(0, s.fin - t) + 1;
  setTimeout(() => { try { s.destino.disconnect(); s.rv?.disconnect(); } catch {} }, Math.min(falta, rapido ? 1 : 4) * 1000 + 200);
}

// Una muestra para el panel o al encontrar la partitura: suena corta, desde donde estés.
let muestra = null;
export function escucharMuestra(sonido, id, segundos = 9) {
  if (!sonido?.ctx) return false;
  if (muestra) { callarMelodia(sonido, muestra, true); muestra = null; }
  const s = empezarMelodia(sonido, id, 0.9);
  if (!s) return false;
  s.fin = Math.min(s.fin, s.t0 + segundos);
  s.ev = { ...s.ev, eventos: s.ev.eventos.filter((e) => e.cuando < segundos - 0.5) };
  muestra = s;
  const seguir = () => {
    if (muestra !== s) return;
    if (seguirMelodia(sonido, s)) setTimeout(seguir, 400);
    else { callarMelodia(sonido, s); muestra = null; }
  };
  seguir();
  return true;
}

// Cada cuadro, desde `sonido.actualizar`. `e.cam` es dónde está el oído y `e.espacio`
// si estás adentro de algo. El disco suena sólo con vos adentro del refugio.
export function actualizarTocadiscos(sonido, dt, e) {
  const T = tocadiscos;
  if (T.disco && T.sonando) T.disco.rotation.y -= dt * 3.5;   // 33 vueltas por minuto
  T.acum += dt;
  if (T.acum < 0.2) return;
  T.acum = 0;
  if (!sonido?.ctx) return;
  const ahora = sonido.ctx.currentTime;
  const d = T.datos;
  const cam = e?.cam;
  const cerca = !!(T.pos && cam && Math.hypot(cam.x - T.pos.x, cam.z - T.pos.z) < T.radio && Math.abs((cam.y ?? T.pos.y) - T.pos.y) < 4
    && (e.espacio === 'adentro' || e.bajoTecho));
  const lista = d ? disponibles(d) : [];
  // si cambió la elegida, el disco arranca por ahí
  if (d && d.elegida !== T.ultimaElegida) {
    T.ultimaElegida = d.elegida;
    const i = lista.indexOf(d.elegida);
    T.indice = i >= 0 ? i : 0;
    if (T.sonando && T.sonando.id !== d.elegida) { callarMelodia(sonido, T.sonando); T.sonando = null; T.proxima = ahora + 0.8; }
  }
  const puede = cerca && d && d.encendido && lista.length && sonido.musicaActiva !== false;
  const toca = !puede ? null : d.modo === 'todas' ? lista[T.indice % lista.length] : (lista.includes(d.elegida) ? d.elegida : lista[0]);
  if (T.sonando && (!toca || T.sonando.id !== toca)) {
    callarMelodia(sonido, T.sonando);
    T.sonando = null;
    T.proxima = ahora + (toca ? 0.8 : 0);
  }
  if (T.sonando) {
    if (!seguirMelodia(sonido, T.sonando)) {
      T.sonando = null;
      T.proxima = ahora + PAUSA;
      if (d?.modo === 'todas') T.indice = (T.indice + 1) % Math.max(1, lista.length);
    }
    return;
  }
  if (toca && ahora >= T.proxima) {
    T.sonando = empezarMelodia(sonido, toca);
    if (T.sonando) seguirMelodia(sonido, T.sonando);
  }
}

// ---------------------------------------------------------------- el panel
export const SECCION_MUSICA = registrarSeccion({
  id: 'musica',
  titulo: 'Tu música',
  orden: 70,
  porDefecto: musicaPorDefecto,
  sanear: sanearMusica,
  construir(cont, api) {
    const d = sanearMusica(api.datos);
    const lista = disponibles(d);
    nota(cont, 'El tocadiscos está sobre la mesa del refugio: suena mientras estés adentro. Las partituras que encuentres por el valle se suman al disco.');
    const opciones = lista.map((id) => ({ id, nombre: MELODIA[id].nombre }));
    campoElegir(cont, 'Qué suena', opciones, lista.includes(d.elegida) ? d.elegida : lista[0], (v) => api.cambiar({ elegida: v }));
    campoElegir(cont, 'Cómo', MODOS_TOCADISCOS, d.modo, (v) => api.cambiar({ modo: v }));
    campoSi(cont, 'Tocadiscos encendido', d.encendido, (v) => api.cambiar({ encendido: v }));
    subtitulo(cont, `Partituras: ${d.halladas.length} de ${MELODIAS.length - 1}`);
    const sonido = refDelMundo(api, 'sonido');
    for (const m of MELODIAS) {
      const tengo = m.inicial || d.halladas.includes(m.id);
      const f = enLinea(fila(cont, tengo ? m.nombre : '¿?'));
      const p = (cont.ownerDocument || document).createElement('small');
      p.className = 'personal-pista';
      p.textContent = tengo ? (m.instrumento === 'quena' ? 'con quena' : 'con guitarra') : m.pista;
      f.appendChild(p);
      if (tengo && sonido) boton(f, 'Escuchar', () => escucharMuestra(sonido, m.id));
    }
  },
  aplicar(datos, api) {
    tocadiscos.datos = sanearMusica(datos);
    // para avisar y guardar cuando se encuentra una partitura (ver `objetos.js`)
    const nota = refDelMundo(api, 'nota');
    tocadiscos.nota = typeof nota === 'function' ? nota : null;
    tocadiscos.guardar = typeof api?.guardar === 'function' ? api.guardar : null;
  },
});
