// Banco de pruebas: un recorrido guionado por el valle, siempre el mismo, midiendo
// cuadros por segundo en los lugares que cuestan distinto (bosque cerrado, vista larga
// desde el mirador, agua, estructuras, noche con luces). Sirve para comparar máquinas
// y para saber si un cambio mejoró o empeoró, en vez de ir a ojo.
// Módulo puro (se prueba en Node): el recorrido, las cuentas y el informe.

// Cada tramo dice de dónde a dónde va la cámara, en coordenadas relativas a un lugar
// del valle, a qué hora del día y cuánto dura. `mira` es hacia dónde apunta.
export const RECORRIDO = [
  { id: 'bosque', nombre: 'Bosque cerrado', dur: 14, hora: 11.5, alto: 2.0,
    desde: { lugar: 'refugio', dx: 26, dz: 22 }, hasta: { lugar: 'refugio', dx: -24, dz: -18 },
    texto: 'caminando entre los árboles, que es donde hay más de todo' },
  { id: 'sendero', nombre: 'Sendero y mallín', dur: 12, hora: 9, alto: 2.0,
    desde: { lugar: 'refugio' }, hasta: { lugar: 'mallin' },
    texto: 'terreno abierto con niebla baja' },
  { id: 'mirador', nombre: 'Vista larga', dur: 12, hora: 13, alto: 6,
    desde: { lugar: 'mirador', dx: -14 }, hasta: { lugar: 'mirador', dx: 14 }, mira: { lugar: 'muelle' },
    texto: 'medio valle a la vista: lo más caro de dibujar' },
  { id: 'lago', nombre: 'Orilla del lago', dur: 12, hora: 17.5, alto: 3,
    desde: { lugar: 'muelle', dx: -20 }, hasta: { lugar: 'muelle', dz: 16 },
    texto: 'agua, reflejos y sol bajo' },
  { id: 'pueblo', nombre: 'Estructuras', dur: 12, hora: 12, alto: 2.4,
    desde: { lugar: 'galpon', dx: 24, dz: 18 }, hasta: { lugar: 'almacen' },
    texto: 'galpón, almacén y todo lo construido' },
  { id: 'noche', nombre: 'Noche', dur: 14, hora: 22.3, alto: 2.0,
    desde: { lugar: 'refugio', dx: 20, dz: -16 }, hasta: { lugar: 'refugio', dx: -6, dz: 8 },
    texto: 'luces, sombras y niebla de noche' },
];

export const CALENTAMIENTO = 3;      // segundos que no se miden al entrar a cada tramo
export const DT_MAXIMO = 0.5;        // un parpadeo del sistema no es un cuadro lento

export function duracionBanco(recorrido = RECORRIDO) {
  return recorrido.reduce((s, t) => s + t.dur + CALENTAMIENTO, 0);
}

// ---------------------------------------------------------------- las cuentas
export function estadisticas(muestras) {
  const buenas = muestras.filter((d) => Number.isFinite(d) && d > 0 && d <= DT_MAXIMO);
  if (!buenas.length) return { cuadros: 0, fps: 0, p1: 0, peorMs: 0, medioMs: 0 };
  const total = buenas.reduce((s, d) => s + d, 0);
  const ord = buenas.slice().sort((a, b) => a - b);
  // el 1% peor: el cuadro que tardó más que el 99% de los demás
  const peor1 = ord[Math.min(ord.length - 1, Math.floor(ord.length * 0.99))];
  return {
    cuadros: buenas.length,
    fps: buenas.length / total,
    p1: 1 / peor1,
    peorMs: ord[ord.length - 1] * 1000,
    medioMs: (total / buenas.length) * 1000,
  };
}

// El estado de una corrida: en qué tramo va y qué lleva medido.
export function crearCorrida(recorrido = RECORRIDO) {
  return {
    recorrido,
    tramo: 0,
    t: 0,
    calentando: CALENTAMIENTO,
    muestras: [],
    tramos: [],
    terminada: false,
  };
}

// Se llama una vez por cuadro. Devuelve qué hacer: seguir, cambiar de tramo o terminar.
export function anotarCuadro(corrida, dt) {
  if (corrida.terminada) return { estado: 'fin' };
  const tramo = corrida.recorrido[corrida.tramo];
  if (corrida.calentando > 0) {
    corrida.calentando -= dt;
    return { estado: 'calentando', tramo, avance: 0 };
  }
  corrida.t += dt;
  if (Number.isFinite(dt) && dt > 0) corrida.muestras.push(dt);
  if (corrida.t < tramo.dur) return { estado: 'midiendo', tramo, avance: corrida.t / tramo.dur };
  // tramo terminado: se guarda lo medido y se pasa al siguiente
  corrida.tramos.push({ id: tramo.id, nombre: tramo.nombre, ...estadisticas(corrida.muestras) });
  corrida.muestras = [];
  corrida.t = 0;
  corrida.calentando = CALENTAMIENTO;
  corrida.tramo++;
  if (corrida.tramo >= corrida.recorrido.length) {
    corrida.terminada = true;
    return { estado: 'fin', tramo };
  }
  return { estado: 'cambio', tramo: corrida.recorrido[corrida.tramo], avance: 0 };
}

export function resumenCorrida(corrida) {
  const tramos = corrida.tramos.filter((t) => t.cuadros > 0);
  if (!tramos.length) return { cuadros: 0, fps: 0, p1: 0, peorMs: 0, peorTramo: null };
  const cuadros = tramos.reduce((s, t) => s + t.cuadros, 0);
  const tiempo = tramos.reduce((s, t) => s + t.cuadros / t.fps, 0);
  const peorTramo = tramos.slice().sort((a, b) => a.fps - b.fps)[0];
  return {
    cuadros,
    fps: cuadros / tiempo,
    p1: Math.min(...tramos.map((t) => t.p1)),
    peorMs: Math.max(...tramos.map((t) => t.peorMs)),
    peorTramo: peorTramo.nombre,
  };
}

// ---------------------------------------------------------------- el veredicto
export function veredicto(fps, p1) {
  if (!fps) return 'No se llegó a medir nada.';
  if (fps >= 75 && p1 >= 45) return 'Va holgado: se puede subir la calidad un escalón.';
  if (fps >= 55 && p1 >= 30) return 'Va bien con esta calidad.';
  if (fps >= 40) return 'Se juega, pero justo: conviene bajar un escalón o achicar la ventana.';
  return 'No llega: bajá la calidad o achicá la ventana.';
}

const numero = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const relleno = (texto, ancho) => String(texto).padEnd(ancho, ' ');

export function informeBanco(corrida, equipo = {}) {
  const r = resumenCorrida(corrida);
  const lineas = [];
  lineas.push('HOJARASCA · BANCO DE PRUEBAS');
  lineas.push('='.repeat(64));
  lineas.push(`Versión ${equipo.version || '?'} · calidad ${equipo.calidad || '?'} · modo ${equipo.modo || '?'}`);
  if (equipo.resolucion) lineas.push(`Ventana ${equipo.resolucion}${equipo.pixelRatio ? ` · escala ${equipo.pixelRatio}` : ''}`);
  if (equipo.gpu) lineas.push(`Placa de video: ${equipo.gpu}`);
  if (equipo.limiteFps) lineas.push(`Límite de cuadros: ${equipo.limiteFps}`);
  if (equipo.cuando) lineas.push(`Medido el ${equipo.cuando}`);
  lineas.push('');
  lineas.push(`${relleno('Tramo', 20)}${relleno('cuadros/s', 11)}${relleno('1% peor', 10)}${relleno('ms medio', 10)}peor cuadro`);
  lineas.push('-'.repeat(64));
  for (const t of corrida.tramos) {
    lineas.push(relleno(t.nombre, 20) + relleno(numero(t.fps), 11) + relleno(numero(t.p1), 10)
      + relleno(numero(t.medioMs, 1), 10) + `${numero(t.peorMs, 1)} ms`);
  }
  lineas.push('-'.repeat(64));
  lineas.push(relleno('TODO EL RECORRIDO', 20) + relleno(numero(r.fps), 11) + relleno(numero(r.p1), 10)
    + relleno('', 10) + `${numero(r.peorMs, 1)} ms`);
  lineas.push('');
  if (r.peorTramo) lineas.push(`Lo más pesado: ${r.peorTramo}.`);
  lineas.push(veredicto(r.fps, r.p1));
  if (equipo.escena) lineas.push('');
  if (equipo.escena) lineas.push(`Escena: ${equipo.escena}`);
  return lineas.join('\n');
}

export function nombreArchivoBanco(equipo = {}, fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const sello = `${fecha.getFullYear()}${p(fecha.getMonth() + 1)}${p(fecha.getDate())}-${p(fecha.getHours())}${p(fecha.getMinutes())}`;
  return `hojarasca-banco-${equipo.calidad || 'x'}-${sello}.txt`;
}
