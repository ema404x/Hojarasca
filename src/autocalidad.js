// La calidad automática: el juego se fija cuántos cuadros por segundo está sacando
// de verdad y, si sufre, baja un escalón solo; si le sobra máquina, sube uno.
// Módulo puro (se prueba en Node, sin three ni DOM): acá sólo se mide y se decide.
// Quien aplica la calidad, la guarda y avisa al jugador es main.js.

// Los escalones, del más liviano al más pesado (mismos nombres que config.js).
export const NIVELES_CALIDAD = ['muybaja', 'baja', 'media', 'alta'];

// Cómo le decimos a cada escalón cuando hablamos con el jugador.
export const NOMBRE_CALIDAD = { muybaja: 'Mínima', baja: 'Baja', media: 'Media', alta: 'Alta' };

export const AJUSTES_AUTOCALIDAD = {
  fpsBajar: 45,          // por debajo de esto la cosa se siente pesada
  fpsSubir: 80,          // por arriba de esto sobra máquina
  fpsTirones: 30,        // si el 5% peor baja de acá, son tirones aunque el promedio cierre
  segundosBajar: 3,      // hay que sufrir seguido: un bajón suelto no cuenta
  segundosSubir: 8,      // para subir pedimos más paciencia que para bajar
  gracia: 6,             // después de cada cambio, descanso antes de tocar de nuevo
  calentamiento: 5,      // al cargar el mundo (o tras un cambio) los picos no cuentan
  ventana: 180,          // cuántos cuadros mira la media móvil
  minimoMuestras: 24,    // con menos que esto no opinamos
  fraccionPeor: 0.05,    // el 5% peor de la ventana: eso es lo que se siente como tirón
  bajadasMaximas: 3,     // cuántas veces puede bajar sola en una partida
  minima: 'muybaja',     // tope de abajo
  maxima: 'alta',        // tope de arriba
  dtMinimo: 1 / 1000,    // más rápido que eso es un cuadro fantasma
  dtMaximo: 0.5,         // medio segundo: eso fue un freno (alt+tab, carga), no un cuadro
};

export function indiceCalidad(calidad) {
  return NIVELES_CALIDAD.indexOf(String(calidad));
}

export function nombreCalidad(calidad) {
  return NOMBRE_CALIDAD[calidad] || String(calidad || '');
}

// El escalón de al lado, respetando los topes. Devuelve null si no hay a dónde ir.
export function calidadVecina(calidad, paso, op = AJUSTES_AUTOCALIDAD) {
  const i = indiceCalidad(calidad);
  if (i < 0) return null;
  const piso = Math.max(0, indiceCalidad(op.minima));
  const techo = indiceCalidad(op.maxima) < 0 ? NIVELES_CALIDAD.length - 1 : indiceCalidad(op.maxima);
  const j = i + (paso < 0 ? -1 : 1);
  if (j < piso || j > techo || j < 0 || j >= NIVELES_CALIDAD.length) return null;
  return NIVELES_CALIDAD[j];
}

export function crearEstadoAutocalidad(calidad = 'media', opciones = {}) {
  const op = { ...AJUSTES_AUTOCALIDAD, ...opciones };
  const estado = {
    op,
    activa: true,                                        // el jugador la puede apagar
    calidad: indiceCalidad(calidad) >= 0 ? String(calidad) : 'media',
    muestras: new Array(Math.max(8, op.ventana | 0)).fill(0),
    cursor: 0,
    llenas: 0,
    reloj: 0,            // segundos de juego medidos
    rojo: 0,             // segundos seguidos sufriendo
    verde: 0,            // segundos seguidos con la máquina holgada
    desdeCambio: 0,      // segundos desde el último cambio de calidad
    calentando: op.calentamiento,
    bajadas: 0,
    subidas: 0,
    rebotes: 0,          // veces que tuvimos que volver a bajar después de haber subido
    frenos: 0,           // cuadros descartados por absurdos (pausa, alt+tab, carga)
    orden: [],           // borrador reusado para ordenar: no asignamos memoria por cuadro
  };
  return estado;
}

// Después de cargar el mundo, de salir de la pausa o de cambiar algo pesado:
// tiramos la ventana a la basura y nos tomamos unos segundos sin opinar.
export function reiniciarMedicion(estado, segundos = null) {
  estado.cursor = 0;
  estado.llenas = 0;
  estado.rojo = 0;
  estado.verde = 0;
  estado.calentando = Math.max(0, segundos == null ? estado.op.calentamiento : Number(segundos) || 0);
  return estado;
}

// Cuando el jugador toca la calidad a mano, la autocalidad se pone a tiro y
// arranca de cero (no cuenta como bajada ni como subida nuestra).
export function sincronizarCalidad(estado, calidad) {
  if (indiceCalidad(calidad) >= 0) estado.calidad = String(calidad);
  estado.desdeCambio = 0;
  return reiniciarMedicion(estado);
}

// Un cuadro más. Se llama una vez por frame con el dt real (en segundos).
export function anotarCuadro(estado, dt) {
  const op = estado.op;
  const v = Number(dt);
  if (!Number.isFinite(v) || v <= 0) return estado;
  // Cuadros absurdos: un freno de medio segundo no es rendimiento, es un tranco.
  if (v < op.dtMinimo || v > op.dtMaximo) { estado.frenos++; return estado; }

  estado.reloj += v;
  estado.desdeCambio += v;
  if (estado.calentando > 0) { estado.calentando = Math.max(0, estado.calentando - v); return estado; }

  estado.muestras[estado.cursor] = v;
  estado.cursor = (estado.cursor + 1) % estado.muestras.length;
  estado.llenas = Math.min(estado.muestras.length, estado.llenas + 1);
  if (estado.llenas < op.minimoMuestras) return estado;

  const medio = fpsMedio(estado);
  const peor = fpsPeor(estado);
  if (medio < op.fpsBajar || peor < op.fpsTirones) {
    estado.rojo += v;
    estado.verde = 0;
  } else if (medio > op.fpsSubir && peor > op.fpsBajar) {
    estado.verde += v;
    estado.rojo = 0;
  } else {
    // Zona muerta entre los dos objetivos: lo acumulado se va aflojando solo.
    estado.rojo = Math.max(0, estado.rojo - v);
    estado.verde = Math.max(0, estado.verde - v);
  }
  return estado;
}

// Media móvil de la ventana, en cuadros por segundo.
export function fpsMedio(estado) {
  const n = estado.llenas;
  if (!n) return 0;
  let suma = 0;
  for (let i = 0; i < n; i++) suma += estado.muestras[i];
  return suma > 0 ? n / suma : 0;
}

// Los peores cuadros de la ventana (por defecto el 5%): esto es lo que el
// jugador siente como tirón, aunque el promedio cierre lindo.
export function fpsPeor(estado, fraccion = null) {
  const n = estado.llenas;
  if (!n) return 0;
  const f = Math.min(1, Math.max(0, fraccion == null ? estado.op.fraccionPeor : fraccion));
  const orden = estado.orden;
  orden.length = 0;
  for (let i = 0; i < n; i++) orden.push(estado.muestras[i]);
  orden.sort((a, b) => b - a);            // primero los dt largos, que son los peores
  const cuantas = Math.max(1, Math.round(n * f));
  let suma = 0;
  for (let i = 0; i < cuantas; i++) suma += orden[i];
  return suma > 0 ? cuantas / suma : 0;
}

export function resumenFps(estado) {
  return {
    medio: fpsMedio(estado),
    peor: fpsPeor(estado),
    muestras: estado.llenas,
    listo: estado.llenas >= estado.op.minimoMuestras && estado.calentando <= 0,
  };
}

// Cuánto hay que aguantar holgado para animarse a subir. Si ya subimos y tuvimos
// que volver a bajar, la próxima vez desconfiamos el doble (y así).
export function segundosParaSubir(estado) {
  return estado.op.segundosSubir * (1 + estado.rebotes);
}

// LA decisión. Es pura: mira el estado acumulado y no lo toca (el único borrador
// que usa es `estado.orden`, que existe para no asignar memoria por cuadro).
// Devuelve null si no hay nada que hacer, o { motivo, desde, hasta, fps, aviso }.
export function decidirCalidad(estado) {
  const op = estado.op;
  if (!estado.activa) return null;
  if (estado.calentando > 0) return null;                 // recién cargado: los picos no cuentan
  if (estado.desdeCambio < op.gracia) return null;        // recién tocamos: dejalo asentar
  if (estado.llenas < op.minimoMuestras) return null;

  const fps = { medio: fpsMedio(estado), peor: fpsPeor(estado) };

  if (estado.rojo >= op.segundosBajar) {
    if (estado.bajadas >= op.bajadasMaximas) return null;  // ya bajamos bastante, no rebotemos más
    const hasta = calidadVecina(estado.calidad, -1, op);   // nunca más de un escalón por vez
    if (!hasta) return null;                               // ya estamos en lo más liviano
    return { motivo: 'bajar', desde: estado.calidad, hasta, fps, aviso: avisoCalidad(estado.calidad, hasta) };
  }

  if (estado.verde >= segundosParaSubir(estado)) {
    const hasta = calidadVecina(estado.calidad, 1, op);
    if (!hasta) return null;                               // ya estamos en lo más lindo
    return { motivo: 'subir', desde: estado.calidad, hasta, fps, aviso: avisoCalidad(estado.calidad, hasta) };
  }

  return null;
}

// Tomar la decisión: mueve el escalón, cuenta y se toma el tiempo de gracia.
export function aplicarCambio(estado, cambio) {
  if (!cambio || indiceCalidad(cambio.hasta) < 0) return estado;
  if (cambio.motivo === 'bajar') {
    estado.bajadas++;
    if (estado.subidas > 0) estado.rebotes++;
  } else {
    estado.subidas++;
  }
  estado.calidad = cambio.hasta;
  estado.desdeCambio = 0;
  reiniciarMedicion(estado);
  return estado;
}

// El avisito para el jugador, cortito y en criollo.
export function avisoCalidad(desde, hasta) {
  const titulo = 'Calidad automática';
  const nombre = nombreCalidad(hasta);
  if (indiceCalidad(hasta) < indiceCalidad(desde)) {
    const texto = hasta === 'muybaja'
      ? `Bajé la calidad a ${nombre}: es lo más liviano que tengo. Si igual va duro, probá achicar la ventana.`
      : `Bajé la calidad a ${nombre} para que vaya más fluido. Lo podés cambiar a mano en Ajustes.`;
    return { titulo, texto };
  }
  const texto = hasta === 'alta'
    ? `Subí la calidad a ${nombre}: tu máquina daba de sobra.`
    : `Subí la calidad a ${nombre}: venía sobrando aire.`;
  return { titulo, texto };
}

// Una línea para el panel de depuración (F3).
export function textoFps(estado) {
  const r = resumenFps(estado);
  return `${Math.round(r.medio)} fps · 5% peor ${Math.round(r.peor)} · calidad ${nombreCalidad(estado.calidad)}`;
}

// Atajo para el bucle: anota el cuadro y, si corresponde, devuelve el cambio ya
// aplicado al estado (o null). main.js se encarga de guardar el ajuste y avisar.
export function revisarCalidad(estado, dt) {
  anotarCuadro(estado, dt);
  const cambio = decidirCalidad(estado);
  if (cambio) aplicarCambio(estado, cambio);
  return cambio;
}
