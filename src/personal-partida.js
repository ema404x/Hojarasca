// 2.8: "Tu partida". Módulo puro (se prueba en Node): cómo arranca la próxima partida
// nueva y las recetas guardadas con nombre para repetirla.
//
// La estación, el clima y la dificultad son los mismos ajustes de siempre (portada y
// pausa): la receta sólo los deja puestos al empezar ("Como está" no los toca). La
// cantidad de animales y las visitas de los vecinos son de cada partida: se fijan al
// empezarla y viven en `actual` (una partida vieja queda como era: normal y con vecinos).
//
// Lo personal (tu ropa, tu bandera, estas recetas) pasa de una partida a la nueva.
import { registrarSeccion, elegir, texto } from './personalizacion.js';
import { fila, segmentos, siNo, parrafo, campoTexto, boton } from './personal-controles.js';

export const OPCIONES_PARTIDA = {
  estacion: [
    { valor: 'igual', texto: 'Como está' }, { valor: 'verano', texto: 'Verano' }, { valor: 'otono', texto: 'Otoño' },
    { valor: 'invierno', texto: 'Invierno' }, { valor: 'auto', texto: 'Que pasen solas' },
  ],
  clima: [
    { valor: 'igual', texto: 'Como está' }, { valor: 'variable', texto: 'Cambiante' }, { valor: 'despejado', texto: 'Despejado' }, { valor: 'lluvioso', texto: 'Lluvioso' },
  ],
  dificultad: [
    { valor: 'igual', texto: 'Como está' }, { valor: 'tranquila', texto: 'Tranquila' }, { valor: 'normal', texto: 'Normal' }, { valor: 'implacable', texto: 'Implacable' },
  ],
  animales: [
    { valor: 'pocos', texto: 'Pocos' }, { valor: 'normal', texto: 'Los de siempre' }, { valor: 'muchos', texto: 'Muchos' },
  ],
};
// Cuántos pudúes y carpinteros hay, contra los de siempre (ver crearFauna).
export const FACTOR_ANIMALES = { pocos: 0.5, normal: 1, muchos: 1.5 };
export const MAX_RECETAS = 12;

const valores = (k) => OPCIONES_PARTIDA[k].map((o) => o.valor);
export const recetaDefecto = () => ({ estacion: 'igual', clima: 'igual', dificultad: 'igual', animales: 'normal', vecinos: true });
export function sanearReceta(r) {
  const x = r && typeof r === 'object' ? r : {};
  const b = recetaDefecto();
  return {
    estacion: elegir(x.estacion, valores('estacion'), b.estacion),
    clima: elegir(x.clima, valores('clima'), b.clima),
    dificultad: elegir(x.dificultad, valores('dificultad'), b.dificultad),
    animales: elegir(x.animales, valores('animales'), b.animales),
    vecinos: typeof x.vecinos === 'boolean' ? x.vecinos : b.vecinos,
  };
}
export const partidaDefecto = () => ({ proxima: recetaDefecto(), actual: { animales: 'normal', vecinos: true }, recetas: [] });
export function sanearPartida(d) {
  const x = d && typeof d === 'object' ? d : {};
  const a = x.actual && typeof x.actual === 'object' ? x.actual : {};
  const vistos = new Set();
  const recetas = [];
  for (const r of Array.isArray(x.recetas) ? x.recetas : []) {
    if (!r || typeof r !== 'object') continue;
    const nombre = texto(r.nombre, '', 28);
    if (!nombre || vistos.has(nombre.toLowerCase())) continue;
    vistos.add(nombre.toLowerCase());
    recetas.push({ nombre, ...sanearReceta(r) });
    if (recetas.length >= MAX_RECETAS) break;
  }
  return {
    proxima: sanearReceta(x.proxima),
    actual: { animales: elegir(a.animales, valores('animales'), 'normal'), vecinos: typeof a.vecinos === 'boolean' ? a.vecinos : true },
    recetas,
  };
}

// Guardar la próxima como receta con nombre (la de igual nombre se reemplaza).
export function guardarReceta(d, nombre) {
  const x = sanearPartida(d);
  const n = texto(nombre, '', 28);
  if (!n) return { ok: false, datos: x, motivo: 'Ponele un nombre' };
  const otras = x.recetas.filter((r) => r.nombre.toLowerCase() !== n.toLowerCase());
  if (otras.length >= MAX_RECETAS) return { ok: false, datos: x, motivo: `Caben ${MAX_RECETAS}: borrá alguna` };
  return { ok: true, datos: { ...x, recetas: [...otras, { nombre: n, ...x.proxima }] } };
}
export function usarReceta(d, nombre) {
  const x = sanearPartida(d);
  const r = x.recetas.find((q) => q.nombre === nombre);
  if (!r) return x;
  const { nombre: _n, ...receta } = r;
  return { ...x, proxima: sanearReceta(receta) };
}
export function borrarReceta(d, nombre) {
  const x = sanearPartida(d);
  return { ...x, recetas: x.recetas.filter((r) => r.nombre !== nombre) };
}

// Al empezar una partida nueva: los ajustes que cambia la receta y lo personal de la
// partida nueva (lo de la vieja, con `actual` puesto según la receta).
export function empezarConReceta(personal, ajustes) {
  const p = personal && typeof personal === 'object' ? personal : {};
  const d = sanearPartida(p.partida);
  const r = d.proxima;
  const nuevosAjustes = { ...(ajustes || {}) };
  for (const k of ['estacion', 'clima', 'dificultad']) if (r[k] !== 'igual') nuevosAjustes[k] = r[k];
  return {
    ajustes: nuevosAjustes,
    personal: { ...p, partida: { ...d, actual: { animales: r.animales, vecinos: r.vecinos } } },
  };
}
export const factorAnimales = (progreso) => FACTOR_ANIMALES[sanearPartida(progreso?.personal?.partida).actual.animales] || 1;
export const vecinosActivos = (progreso) => sanearPartida(progreso?.personal?.partida).actual.vecinos;

const nombreDe = (k, v) => (OPCIONES_PARTIDA[k].find((o) => o.valor === v) || {}).texto || v;
export function resumenReceta(r) {
  const x = sanearReceta(r);
  const partes = [];
  if (x.estacion !== 'igual') partes.push(nombreDe('estacion', x.estacion));
  if (x.clima !== 'igual') partes.push(`clima ${nombreDe('clima', x.clima).toLowerCase()}`);
  if (x.dificultad !== 'igual') partes.push(`dificultad ${nombreDe('dificultad', x.dificultad).toLowerCase()}`);
  partes.push(x.animales === 'normal' ? 'animales de siempre' : `${nombreDe('animales', x.animales).toLowerCase()} animales`);
  partes.push(x.vecinos ? 'con visitas' : 'sin visitas');
  return partes.join(' · ');
}

function construir(cont, api) {
  const d = api.datos;
  const redibujar = () => { cont.innerHTML = ''; construir(cont, api); };
  const cambiarProxima = (parcial) => { api.cambiar({ proxima: { ...d.proxima, ...parcial } }); redibujar(); };
  cont.appendChild(parrafo('Cómo arranca la próxima partida nueva de este modo. La que estás jugando no cambia: '
    + `hoy tiene ${d.actual.animales === 'normal' ? 'los animales de siempre' : `${nombreDe('animales', d.actual.animales).toLowerCase()} animales`} y ${d.actual.vecinos ? 'visitas de los vecinos' : 'sin visitas'}.`));
  fila(cont, 'Estación', segmentos(OPCIONES_PARTIDA.estacion, d.proxima.estacion, (v) => cambiarProxima({ estacion: v })));
  fila(cont, 'Clima', segmentos(OPCIONES_PARTIDA.clima, d.proxima.clima, (v) => cambiarProxima({ clima: v })));
  fila(cont, 'Dificultad de La noche de los duendes', segmentos(OPCIONES_PARTIDA.dificultad, d.proxima.dificultad, (v) => cambiarProxima({ dificultad: v })));
  fila(cont, 'Animales', segmentos(OPCIONES_PARTIDA.animales, d.proxima.animales, (v) => cambiarProxima({ animales: v })), 'Pudúes y carpinteros en el bosque.');
  fila(cont, 'Vecinos', siNo(d.proxima.vecinos, (v) => cambiarProxima({ vecinos: v }), ['Que vengan', 'Solo']),
    'En el Relax te visitan en tu mesa; en La noche de los duendes se suman a tu base.');

  const nombre = campoTexto('', 28, (v) => guardar(v), 'Nombre de la receta');
  const aviso = parrafo('', 'personal-nota personal-aviso');
  const guardar = (v) => {
    const r = guardarReceta(api.datos, v);
    if (!r.ok) { aviso.textContent = r.motivo; return; }
    api.cambiar(r.datos); redibujar();
  };
  const filaNombre = document.createElement('div');
  filaNombre.className = 'personal-linea';
  filaNombre.append(nombre, boton('Guardar receta', () => guardar(nombre.value)));
  fila(cont, 'Guardar esta receta', filaNombre);
  cont.appendChild(aviso);

  if (d.recetas.length) {
    const lista = document.createElement('div');
    lista.className = 'personal-recetas';
    for (const r of d.recetas) {
      const f = document.createElement('div');
      f.className = 'personal-receta';
      const t = document.createElement('div');
      const b = document.createElement('b'); b.textContent = r.nombre;
      const s = document.createElement('small'); s.textContent = resumenReceta(r);
      t.append(b, s);
      f.append(t,
        boton('Usar', () => { api.cambiar(usarReceta(api.datos, r.nombre)); redibujar(); }),
        boton('Borrar', () => { api.cambiar(borrarReceta(api.datos, r.nombre)); redibujar(); }, 'borrar'));
      lista.appendChild(f);
    }
    fila(cont, 'Tus recetas', lista);
  }
  const nueva = api.mundo?.empezarPartidaNueva;
  if (typeof nueva === 'function') {
    const acciones = document.createElement('div');
    acciones.className = 'personal-linea';
    acciones.appendChild(boton('Empezar una partida nueva con esto', () => nueva(), 'principal'));
    fila(cont, 'Partida nueva', acciones, 'Borra la partida de este lugar (te pregunta antes). Tu ropa, tu bandera y tus recetas pasan a la nueva.');
  }
}

export const SECCION_PARTIDA = registrarSeccion({
  id: 'partida',
  titulo: 'Tu partida',
  orden: 40,
  porDefecto: partidaDefecto,
  sanear: sanearPartida,
  construir,
  aplicar: (datos, api) => { api?.mundo?.partida?.aplicar?.(datos); },
});
