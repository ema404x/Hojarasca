// Utilidades de rendimiento sin dependencias gráficas.
// Mantienen objetos/posiciones reutilizables en rutas calientes para reducir GC.

export function crearPoolPosicional(crearPosicion, capacidadInicial = 16) {
  const pool = [];
  const activos = [];
  let usados = 0;

  function nuevo() {
    return { tipo: '', id: '', pos: crearPosicion(), vel: 0 };
  }
  for (let i = 0; i < capacidadInicial; i++) pool.push(nuevo());

  function reiniciar() {
    usados = 0;
    activos.length = 0;
  }

  function agregar(tipo, pos, yExtra = 0, id = '', vel = 0) {
    let r = pool[usados];
    if (!r) { r = nuevo(); pool.push(r); }
    usados++;
    r.tipo = tipo;
    r.id = id;
    r.vel = vel;
    if (r.pos?.set) r.pos.set(pos.x, (pos.y || 0) + yExtra, pos.z);
    else { r.pos.x = pos.x; r.pos.y = (pos.y || 0) + yExtra; r.pos.z = pos.z; }
    activos.push(r);
    return r;
  }

  return {
    reiniciar,
    agregar,
    lista: () => activos,
    capacidad: () => pool.length,
  };
}

// Cadencia acumulada: preserva el tiempo transcurrido y evita "perder" dt
// cuando un subsistema se actualiza a una frecuencia inferior al render.
export function crearCadencia(hz = 10, maxDt = 0.25) {
  const paso = 1 / Math.max(1, hz);
  let acumulado = 0;
  return {
    sumar(dt) { acumulado = Math.min(maxDt, acumulado + dt); },
    listo() { return acumulado >= paso; },
    consumir() { const dt = acumulado; acumulado = 0; return dt; },
    reiniciar() { acumulado = 0; },
    get acumulado() { return acumulado; },
    paso,
  };
}

// Desactiva proyectores de sombra reales a distancia sin perder la configuración
// original de cada malla. El traverse sólo ocurre al cruzar el umbral.
export function limitarSombrasPorDistancia(raiz, distancia, limite = 52) {
  if (!raiz) return;
  const activa = distancia < limite;
  if (raiz.userData.__sombrasCerca === activa) return;
  raiz.userData.__sombrasCerca = activa;
  raiz.traverse?.((o) => {
    if (!o.isMesh) return;
    if (o.userData.__castShadowBase === undefined) o.userData.__castShadowBase = !!o.castShadow;
    o.castShadow = !!o.userData.__castShadowBase && activa;
  });
}


// Índice espacial 2D liviano para consultas locales. Evita recorrer listas
// completas cuando un sistema sólo necesita vecinos en un radio pequeño.
export function crearIndiceEspacial2D(tamCelda = 32) {
  // 2.6.1: grilla de dos niveles (columna -> fila) con claves numéricas exactas:
  // la clave de texto armaba un string por celda en cada consulta de cada cuadro.
  const celdas = new Map();
  const scratch = [];
  const coord = (v) => Math.floor(v / tamCelda);
  const celda = (cx, cz) => celdas.get(cx)?.get(cz);

  function limpiar() { celdas.clear(); scratch.length = 0; }

  function insertar(item, x = item?.x ?? item?.pos?.x, z = item?.z ?? item?.pos?.z) {
    if (!Number.isFinite(x) || !Number.isFinite(z) || !item) return item;
    const cx = coord(x), cz = coord(z);
    let columna = celdas.get(cx);
    if (!columna) { columna = new Map(); celdas.set(cx, columna); }
    let lista = columna.get(cz);
    if (!lista) { lista = []; columna.set(cz, lista); }
    lista.push(item);
    return item;
  }

  function reconstruir(lista, getPos = (o) => o?.pos || o) {
    limpiar();
    if (!lista) return;
    for (const item of lista) {
      const p = getPos(item);
      if (p) insertar(item, p.x, p.z);
    }
  }

  function consultar(x, z, radio, salida = scratch) {
    salida.length = 0;
    const r = Math.max(0, radio);
    const r2 = r * r;
    const minX = coord(x - r), maxX = coord(x + r);
    const minZ = coord(z - r), maxZ = coord(z + r);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const lista = celda(cx, cz);
        if (!lista) continue;
        for (const item of lista) {
          const p = item?.pos || item;
          const ix = item?.x ?? p?.x, iz = item?.z ?? p?.z;
          const dx = ix - x, dz = iz - z;
          if (dx * dx + dz * dz <= r2) salida.push(item);
        }
      }
    }
    return salida;
  }

  return { limpiar, insertar, reconstruir, consultar, tamCelda, celdas };
}

// LOD de lógica: las decisiones costosas pueden espaciarse con la distancia
// mientras movimiento/animación continúan usando el dt normal.
export function pasoIAPorDistancia(distancia, urgente = false) {
  if (urgente || distancia < 36) return 0;
  if (distancia < 80) return 1 / 15;
  if (distancia < 140) return 1 / 8;
  return 1 / 4;
}

export function consumirPresupuestoIA(actor, dt, distancia, urgente = false) {
  const paso = pasoIAPorDistancia(distancia, urgente);
  if (paso <= 0) return dt;
  actor.__iaAcum = (actor.__iaAcum || 0) + dt;
  if (actor.__iaAcum + 1e-9 < paso && actor.__iaLista) return 0;
  const usado = actor.__iaAcum || dt;
  actor.__iaAcum = 0;
  actor.__iaLista = true;
  return usado;
}

// RC22: presupuesto adaptativo de trabajo secundario. No altera la simulación
// principal ni el render; sólo ensancha cadencias/culling de detalle cuando
// hay presión sostenida de frametime, con histéresis para evitar oscilaciones.
// 3.8.4 (decisión 35): con `soloCadencias` sólo ensancha las cadencias (cada cuánto se revisa algo); el detalle que se ve
// (el alcance del sotobosque y del pasto, las partículas y los pájaros) no se toca: la calidad nunca cambia sola.
export function crearPresupuestoAdaptativo({ objetivoMs = 16.7, niveles = 3, soloCadencias = false } = {}) {
  let nivel = 0;
  let emaMs = objetivoMs;
  let lento = 0;
  let holgado = 0;

  function actualizar(dtReal, objetivoActualMs = objetivoMs) {
    const ms = Math.max(0, Math.min(200, (dtReal || 0) * 1000));
    const objetivo = Math.max(8, objetivoActualMs || objetivoMs);
    emaMs += (ms - emaMs) * 0.08;

    if (emaMs > objetivo * 1.18) {
      lento += Math.max(0, dtReal || 0);
      holgado = Math.max(0, holgado - (dtReal || 0) * 2);
    } else if (emaMs < objetivo * 0.94) {
      holgado += Math.max(0, dtReal || 0);
      lento = Math.max(0, lento - (dtReal || 0));
    } else {
      lento = Math.max(0, lento - (dtReal || 0) * 0.5);
      holgado = Math.max(0, holgado - (dtReal || 0) * 0.25);
    }

    if (lento >= 0.35 && nivel < niveles) {
      nivel++;
      lento = 0;
      holgado = 0;
    } else if (holgado >= 1.5 && nivel > 0) {
      nivel--;
      lento = 0;
      holgado = 0;
    }
    return nivel;
  }

  function intervalo(base, maxFactor = 2) {
    const factor = Math.min(maxFactor, 1 + nivel * 0.35);
    return base * factor;
  }

  function factorDetalle(minimo = 0.72) {
    if (soloCadencias) return 1;
    return Math.max(minimo, 1 - nivel * 0.09);
  }

  return {
    actualizar,
    intervalo,
    factorDetalle,
    get nivel() { return nivel; },
    get emaMs() { return emaMs; },
    soloCadencias,
  };
}


// RC23: perfilador por subsistema sin asignaciones por cuadro. Sólo toma tiempos
// cuando F3/debug está activo; el camino normal se reduce a dos ramas rápidas.
export function crearPerfiladorSubsistemas(reloj = () => performance.now()) {
  const stats = new Map();
  function iniciar(activo = true) { return activo ? reloj() : 0; }
  function terminar(nombre, inicio, activo = true) {
    if (!activo || !inicio) return 0;
    const ms = Math.max(0, reloj() - inicio);
    let s = stats.get(nombre);
    if (!s) { s = { nombre, ema: 0, pico: 0, muestras: 0 }; stats.set(nombre, s); }
    s.ema = s.muestras ? s.ema * 0.88 + ms * 0.12 : ms;
    s.pico = Math.max(ms, s.pico * 0.985);
    s.muestras++;
    return ms;
  }
  function resumen(limite = 4) {
    return Array.from(stats.values())
      .sort((a, b) => b.ema - a.ema)
      .slice(0, limite)
      .map((s) => `${s.nombre} ${s.ema.toFixed(2)}ms`)
      .join(' · ');
  }
  function limpiar() { stats.clear(); }
  return { iniciar, terminar, resumen, limpiar, stats };
}

// Factor continuo para efectos visuales secundarios. Se usa en shaders/Points
// para reducir trabajo de fragmentos/partículas antes de tocar contenido base.
export function factorEfectosPorPresupuesto(nivel = 0, minimo = 0.58) {
  return Math.max(minimo, 1 - Math.max(0, nivel) * 0.11);
}


// RC24: planificador anti-tirones. Distribuye tareas secundarias pesadas entre
// cuadros consecutivos y evita iniciarlas justo después de un frame lento.
// Los acumuladores de cada subsistema conservan su deuda, así que una tarea
// pospuesta se ejecuta en el siguiente cuadro disponible sin perder tiempo.
// 3.5: ninguna tarea pesada espera para siempre. Si la placa no llega nunca al objetivo (33 ms
// con el límite en 60, o 'libre' en una integrada), todos los cuadros eran "lentos" y la
// vegetación, el ambiente, la visibilidad y las sombras no corrían NUNCA: el bosque cercano no
// se actualizaba y las cosas aparecían de golpe al lado del jugador. Ahora una tarea pesada que
// lleva ESPERA_MAXIMA_S pidiendo turno pasa aunque el cuadro sea lento (de a una por cuadro).
export const ESPERA_MAXIMA_S = 0.3;
export function crearPlanificadorAntitirones({ objetivoMs = 16.7, maxPesadas = 1, maxSecundarias = 3 } = {}) {
  let cuadro = 0;
  let pesadas = 0;
  let secundarias = 0;
  let frameLento = false;
  let picoEMA = objetivoMs;
  let nivel = 0;
  let reloj = 0;                 // 3.5: segundos de cuadros vistos
  const esperando = new Map();   // 3.5: tarea pesada → reloj del primer pedido sin turno

  function comenzarCuadro(dtReal = 0, nivelPresupuesto = 0, objetivoActualMs = objetivoMs) {
    cuadro++;
    pesadas = 0;
    secundarias = 0;
    nivel = Math.max(0, nivelPresupuesto | 0);
    const ms = Math.max(0, Math.min(200, dtReal * 1000));
    reloj += ms / 1000;
    const objetivo = Math.max(8, objetivoActualMs || objetivoMs);
    picoEMA += (ms - picoEMA) * 0.18;
    frameLento = ms > objetivo * 1.28 || picoEMA > objetivo * 1.45;
  }

  function permitir(clave = '', { pesada = false, urgente = false } = {}) {
    if (urgente) return true;
    if (pesada) {
      if (!esperando.has(clave)) esperando.set(clave, reloj);
      const hambrienta = reloj - esperando.get(clave) >= ESPERA_MAXIMA_S;
      // Tras un frame realmente malo no arrancamos trabajo diferible pesado (salvo el que ya
      // esperó demasiado: 3.5)
      if (frameLento && !hambrienta) return false;
      const max = nivel >= 2 ? 1 : maxPesadas;
      if (pesadas >= max) return false;
      pesadas++;
      secundarias++;
      esperando.delete(clave);
      return true;
    }
    const max = Math.max(1, maxSecundarias - (nivel >= 2 ? 1 : 0));
    if (secundarias >= max) return false;
    secundarias++;
    return true;
  }

  return {
    comenzarCuadro,
    permitir,
    get cuadro() { return cuadro; },
    get frameLento() { return frameLento; },
    get picoEMA() { return picoEMA; },
    get pesadas() { return pesadas; },
  };
}

// RC24: reloj de frame-pacing independiente del dt de simulación. Evita que un
// límite de 60 FPS en monitores de 144/165 Hz termine cayendo accidentalmente
// a 48/55 FPS por saltar siempre el mismo número de VSyncs.
export function crearRelojCadencia(inicioMs = 0) {
  let ultimoRender = inicioMs;
  let siguiente = inicioMs;
  // 3.2: lo que el dt entero de vsyncs le debe al reloj de verdad (ver decidirVsync)
  let deriva = 0;

  function decidir(ahoraMs, fps = 0) {
    const ahora = Number.isFinite(ahoraMs) ? ahoraMs : ultimoRender;
    const libre = !fps || fps <= 0;
    if (libre) {
      const dtReal = Math.max(0, (ahora - ultimoRender) / 1000);
      ultimoRender = ahora;
      siguiente = ahora;
      return { dibujar: true, dtReal, pasoMs: 0 };
    }
    const pasoMs = 1000 / Math.max(1, fps);
    if (siguiente <= ultimoRender) siguiente = ultimoRender + pasoMs;
    // Tras volver de background o un stall enorme, resincronizamos sin intentar
    // "recuperar" decenas de cuadros atrasados.
    if (ahora - siguiente > pasoMs * 4) siguiente = ahora;
    if (ahora + 0.35 < siguiente) return { dibujar: false, dtReal: 0, pasoMs };

    const dtReal = Math.max(0, (ahora - ultimoRender) / 1000);
    ultimoRender = ahora;
    siguiente += pasoMs;
    // Si el VSync nos hizo pasar más de una fecha objetivo, saltamos sólo las
    // fechas vencidas; nunca desplazamos la cadencia al instante actual.
    while (siguiente < ahora - pasoMs * 0.35) siguiente += pasoMs;
    return { dibujar: true, dtReal, pasoMs };
  }

  // 3.2: cadencia pareja, como en RAGE. Con el sello del cuadro (el de requestAnimationFrame,
  // que cae en el vsync) se cuentan los refrescos enteros desde el último dibujo y se dibuja
  // cada `k`: 144 Hz con k = 2 son 72 cuadros, todos de 13,9 ms. Nunca se saltea un pedazo de
  // vsync (lo que con 60 sobre 144 Hz daba cuadros de 2 y de 3 refrescos alternados: el temblor).
  // El dt que sale es un número entero de refrescos: la simulación avanza exactamente lo que
  // va a durar el cuadro en pantalla. Lo que el sello real se aparta de eso (el sello tiembla
  // unas décimas de ms y el período medido puede errar por poco) se devuelve de a poco, así
  // el reloj del juego no adelanta ni atrasa a la larga.
  function decidirVsync(ahoraMs, periodoMs, k = 1) {
    const ahora = Number.isFinite(ahoraMs) ? ahoraMs : ultimoRender;
    const P = periodoMs > 0 ? periodoMs : 1000 / 60;
    const cada = Math.max(1, Math.round(k) || 1);
    const transcurrido = ahora - ultimoRender;
    const vsyncs = Math.round(transcurrido / P);
    if (vsyncs < cada) return { dibujar: false, dtReal: 0, pasoMs: P * cada, vsyncs };
    ultimoRender = ahora;
    siguiente = ahora + P * cada;
    deriva = Math.max(-P, Math.min(P, deriva + transcurrido - vsyncs * P));
    const devolver = deriva * 0.125;
    deriva -= devolver;
    return { dibujar: true, dtReal: Math.max(0, (vsyncs * P + devolver) / 1000), pasoMs: P * cada, vsyncs };
  }

  function resincronizar(ahoraMs) {
    ultimoRender = ahoraMs;
    siguiente = ahoraMs;
    deriva = 0;
  }

  return { decidir, decidirVsync, resincronizar, get ultimoRender() { return ultimoRender; }, get siguiente() { return siguiente; }, get deriva() { return deriva; } };
}

// 3.2: el período del monitor, medido con los sellos de requestAnimationFrame. Los sellos son
// múltiplos del refresco (cuando el cuadro no se atrasa, uno por vsync). Se toma el grupo de
// intervalos más cortos que junta al menos un quinto de la ventana (el 5% más corto se tira:
// sellos apurados después de un tirón). Devuelve 0 si no hay un grupo claro.
export function estimarPeriodo(deltas, n = deltas.length, orden = null) {
  const m = Math.min(n, deltas.length);
  if (m < 8) return 0;
  const o = orden && orden.length >= m ? orden : new Float64Array(m);
  for (let i = 0; i < m; i++) o[i] = deltas[i];
  const vista = o.subarray ? o.subarray(0, m) : o.slice(0, m);
  vista.sort((a, b) => a - b);
  const base = vista[Math.floor(m * 0.05)];
  if (!(base > 0)) return 0;
  let suma = 0, cuantos = 0;
  for (let i = 0; i < m; i++) {
    const x = vista[i];
    if (x < base * 0.9) continue;
    if (x > base * 1.12) break;
    suma += x; cuantos++;
  }
  if (cuantos < m * 0.2) return 0;
  return suma / cuantos;
}

// 3.2: medidor del refresco que se sigue revisando toda la partida (la ventana puede pasar a
// otro monitor). `pistaHz` es lo que dice el sistema (Electron: displayFrequency de la
// pantalla donde está la ventana): si lo medido es un múltiplo de esa pista, vale la pista
// (así un juego que venía dibujando cada dos refrescos no confunde 72 con 144 Hz). Un cambio
// grande se acepta recién con dos mediciones seguidas que coinciden.
export function crearMedidorRefresco({ ventana = 90, cada = 30, pistaHz = 0 } = {}) {
  const deltas = new Float64Array(ventana);
  const orden = new Float64Array(ventana);
  let n = 0, i = 0, ultimo = -1, nuevos = 0;
  let periodo = 0, candidato = 0, confirmaciones = 0, pista = pistaHz > 0 ? pistaHz : 0;
  function ajustarAPista(p) {
    if (!(pista > 0)) return p;
    const pp = 1000 / pista, r = p / pp, k = Math.round(r);
    return k >= 1 && k <= 4 && Math.abs(r - k) < 0.07 * k ? pp : p;
  }
  function recalcular() {
    const est = estimarPeriodo(deltas, n, orden);
    if (!est) return;
    const p = ajustarAPista(est);
    if (!periodo) { periodo = p; return; }
    if (Math.abs(p - periodo) / periodo < 0.03) { periodo += (p - periodo) * 0.25; candidato = 0; confirmaciones = 0; return; }
    if (candidato && Math.abs(p - candidato) / candidato < 0.04) {
      if (++confirmaciones >= 2) { periodo = p; candidato = 0; confirmaciones = 0; }
    } else { candidato = p; confirmaciones = 1; }
  }
  function anotar(tMs) {
    if (!Number.isFinite(tMs)) return periodo;
    if (ultimo >= 0) {
      const d = tMs - ultimo;
      // más de 60 ms entre sellos no es un refresco: es un tirón, una pausa o una carga
      if (d > 2 && d < 60) { deltas[i] = d; i = (i + 1) % ventana; n = Math.min(ventana, n + 1); nuevos++; }
    }
    ultimo = tMs;
    if (nuevos >= cada && n >= Math.min(ventana, 30)) { nuevos = 0; recalcular(); }
    return periodo;
  }
  function ponerPista(hz) {
    const v = Number(hz);
    pista = Number.isFinite(v) && v >= 24 && v <= 500 ? v : 0;
    if (pista && periodo) periodo = ajustarAPista(periodo);
  }
  return {
    anotar, ponerPista,
    get periodoMs() { return periodo; },
    get hz() { return periodo ? 1000 / periodo : 0; },
    get pistaHz() { return pista; },
  };
}

// 3.2: cuántos refrescos por cuadro (k) caben en el objetivo automático: el más chico con el
// que el juego llega con margen, entre un techo (no más de `fpsMax` cuadros) y un piso (no
// menos de `fpsMin`). 144 Hz → 144 o 72 o 48...; 60 Hz → 60 o 30; 165 Hz → 165, 82,5, 55...
export function rangoDivisores(periodoMs, { fpsMax = 165, fpsMin = 28 } = {}) {
  const P = periodoMs > 0 ? periodoMs : 1000 / 60;
  const kMin = Math.max(1, Math.ceil(1000 / fpsMax / P - 1e-3));
  const kMax = Math.max(kMin, Math.floor(1000 / fpsMin / P + 1e-3));
  return { kMin, kMax };
}

// El primer k, antes de saber cuánto cuesta un cuadro: el más chico que no pasa de 90 cuadros
// por segundo (144 Hz → 72, 120 Hz → 60, 165 Hz → 82,5, 60 Hz → 60, 240 Hz → 80).
export function divisorInicial(periodoMs, op = {}) {
  const P = periodoMs > 0 ? periodoMs : 1000 / 60;
  const { kMin, kMax } = rangoDivisores(P, op);
  let k = kMin;
  while (k < kMax && 1000 / (P * k) > 90.5) k++;
  return k;
}

// 3.2: el objetivo automático. Con cada cuadro dibujado se anota su costo (lo que tardó la
// CPU y, si se puede medir, la placa: el mayor de los dos) y cuántos refrescos duró. Se sube
// k (menos cuadros, todos parejos) cuando el cuadro no entra: cuadros que se pasan de su turno
// o un costo que roza el presupuesto, sostenido un rato. Se baja k sólo cuando el costo cabe
// con mucho margen en el presupuesto más chico durante varios segundos seguidos, y cada vez
// que una bajada hubo que deshacerla enseguida, la próxima se pide con el doble de paciencia
// (como la calidad automática, pero doblando): nunca oscila.
export const AJUSTES_RITMO = {
  fpsMax: 165, fpsMin: 28,
  margenBajar: 0.7,      // para bajar k: el 90% de los cuadros cabe en el 70% del presupuesto nuevo
  perdidosBajar: 0.05,   // y (sin la placa medida) casi ninguno se pasa de su turno
  margenSubir: 0.95,     // para subir k: tres de cada cuatro cuadros ya usan el 95% del presupuesto
  perdidosSubir: 0.5,    // sin poder medir la placa: la mitad de los cuadros se pasa de su turno.
                         // Con la placa medida no se sube por cuadros pasados: tirones sueltos o
                         // en racha (el driver compilando, otra cosa usando la máquina) no se
                         // arreglan dibujando menos, y el ritmo se quedaba abajo sin motivo
  segundosSubir: 1.5,
  segundosBajar: 3,
  gracia: 1.5,           // después de un cambio, un rato sin opinar
  rebotesMax: 6,         // cada rebote duplica la espera para volver a bajar: 3, 6, 12... hasta 192 s
  ventana: 120,
};

export function crearRitmoAuto(opciones = {}) {
  const op = { ...AJUSTES_RITMO, ...opciones };
  const costos = new Float32Array(op.ventana);
  const orden = new Float32Array(op.ventana);
  let nC = 0, iC = 0, p90 = 0, p75 = 0, desdeOrden = 0;
  let k = 0, periodo = 0;
  let perdidos = 0, apretado = 0, holgado = 0, desdeCambio = 0, reloj = 0, ultimaBajada = -1e9, rebotes = 0;
  let cambios = 0;

  function reiniciar() { nC = 0; iC = 0; p90 = 0; p75 = 0; perdidos = 0; apretado = 0; holgado = 0; desdeCambio = 0; }
  function limitar(P) {
    const { kMin, kMax } = rangoDivisores(P, op);
    if (!k) k = divisorInicial(P, op);
    k = Math.min(kMax, Math.max(kMin, k));
    return { kMin, kMax };
  }
  function objetivo(periodoMs) {
    const P = periodoMs > 0 ? periodoMs : 1000 / 60;
    if (periodo && Math.abs(P - periodo) / periodo > 0.05) { k = 0; reiniciar(); }   // otro monitor: de nuevo
    periodo = P;
    limitar(P);
    return k;
  }
  function ordenarCostos() {
    for (let i = 0; i < nC; i++) orden[i] = costos[i];
    const v = orden.subarray(0, nC);
    v.sort();
    p90 = v[Math.min(nC - 1, Math.floor(nC * 0.9))];
    p75 = v[Math.min(nC - 1, Math.floor(nC * 0.75))];
  }
  // `vsyncs`: cuántos refrescos pasaron desde el cuadro anterior; `costoMs`: lo que costó éste.
  function anotar(costoMs, vsyncs, periodoMs, conPlaca = false) {
    objetivo(periodoMs);
    const P = periodo;
    const { kMin, kMax } = limitar(P);
    // una pausa, la ventana escondida o una carga: no es rendimiento
    if (!(vsyncs >= 1) || vsyncs > k + 8) return k;
    const dt = vsyncs * P / 1000;
    reloj += dt; desdeCambio += dt;
    // la fracción de cuadros que se pasaron de turno, cuadro a cuadro (no por tiempo: un tirón
    // suelto de 50 ms pesa lo mismo que un cuadro apenas tarde, y no alcanza para subir k)
    const perdido = vsyncs > k ? 1 : 0;
    perdidos += (perdido - perdidos) / 45;
    // un cuadro que costó más del triple del presupuesto es un tirón (el driver compilando, una
    // carga): no entra en la cuenta del costo. Dibujar menos cuadros no lo arregla, y en las
    // rachas de tirones (un edificio que aparece) el ritmo se quedaba en 30 sin motivo.
    if (Number.isFinite(costoMs) && costoMs >= 0 && costoMs <= k * P * 3) {
      costos[iC] = costoMs; iC = (iC + 1) % costos.length; nC = Math.min(costos.length, nC + 1);
    }
    if (++desdeOrden >= 10 && nC) { desdeOrden = 0; ordenarCostos(); }
    if (desdeCambio < op.gracia || nC < 20) return k;
    const presupuesto = k * P;
    if ((!conPlaca && perdidos > op.perdidosSubir) || p75 > presupuesto * op.margenSubir) apretado += dt;
    else apretado = Math.max(0, apretado - dt * 0.5);
    if (k > kMin && p90 < (k - 1) * P * op.margenBajar && (conPlaca || perdidos < op.perdidosBajar)) holgado += dt;
    else holgado = 0;
    if (apretado >= op.segundosSubir && k < kMax) {
      // si recién bajamos y no aguantó, la próxima bajada pide más paciencia
      if (reloj - ultimaBajada < op.segundosBajar * 2) rebotes = Math.min(op.rebotesMax, rebotes + 1);
      let nuevo = k + 1;
      while (nuevo < kMax && p75 > nuevo * P * 0.85) nuevo++;
      k = nuevo; cambios++;
      apretado = 0; holgado = 0; desdeCambio = 0; perdidos = 0;
    } else if (holgado >= op.segundosBajar * 2 ** rebotes) {
      k--; cambios++;
      ultimaBajada = reloj;
      apretado = 0; holgado = 0; desdeCambio = 0; perdidos = 0;
    }
    return k;
  }
  return {
    objetivo, anotar, reiniciar,
    get k() { return k; },
    get fps() { return periodo && k ? 1000 / (periodo * k) : 0; },
    get p90() { return p90; },
    get p75() { return p75; },
    get perdidos() { return perdidos; },
    get rebotes() { return rebotes; },
    get cambios() { return cambios; },
  };
}

// 3.2: qué hace el bucle con el límite que eligió el jugador. 'auto' sigue al monitor; un
// número fijo que divide justo al refresco (60 en 120 Hz, 60 en 60 Hz, 120 en 240 Hz) también
// se pasa a contar vsyncs enteros; uno que no lo divide (60 en 144 Hz) queda con el reloj de
// siempre, que promedia bien pero no puede ser parejo. 'libre' dibuja en cada refresco.
export function planCadencia(limite, periodoMs, kAuto = 0) {
  if (limite === 'libre') return { modo: 'libre', k: 1, fps: 0 };
  const P = periodoMs > 0 ? periodoMs : 0;
  if (limite === 'auto') {
    if (!P) return { modo: 'fijo', k: 0, fps: 60 };   // todavía sin medir el monitor
    const k = Math.max(1, kAuto | 0 || divisorInicial(P));
    return { modo: 'vsync', k, fps: 1000 / (P * k) };
  }
  const fps = Math.max(30, Number(limite) || 60);
  if (P) {
    const r = 1000 / fps / P, k = Math.round(r);
    if (k >= 1 && Math.abs(r - k) < 0.03 * k) return { modo: 'vsync', k, fps: 1000 / (P * k) };
  }
  return { modo: 'fijo', k: 0, fps };
}

// 3.2: cuánto tarda la placa en dibujar un cuadro (EXT_disjoint_timer_query_webgl2), sin
// esperarla nunca: la consulta de un cuadro se lee dos o tres cuadros después, cuando está
// lista. Sin la extensión devuelve null y el objetivo automático se arregla con la CPU y con
// los cuadros que se pasan de turno. Sólo se usa con el límite en 'auto', el modo fluido o F3.
export function crearCronometroGpu(gl) {
  const ext = gl?.getExtension?.('EXT_disjoint_timer_query_webgl2');
  if (!ext || !gl.createQuery) return null;
  const libres = [], enVuelo = [];
  let activa = null, ultimoMs = -1;
  function empezar() {
    if (activa || enVuelo.length >= 4) return false;
    const q = libres.pop() || gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    activa = q;
    return true;
  }
  function terminar() {
    if (!activa) return;
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    enVuelo.push(activa);
    activa = null;
  }
  function leer() {
    // si la placa cambió de reloj en el medio (disjunto), lo que hay en vuelo no sirve
    const disjunto = gl.getParameter(ext.GPU_DISJOINT_EXT);
    while (enVuelo.length) {
      const q = enVuelo[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      enVuelo.shift();
      if (!disjunto) ultimoMs = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
      libres.push(q);
    }
    return ultimoMs;
  }
  return { empezar, terminar, leer, get ms() { return ultimoMs; } };
}

// 3.3: modo fluido (opcional, apagado de fábrica): resolución dinámica entre 70% y 100%
// para sostener el ritmo. Mira lo que cuesta cada cuadro (la placa si se puede medir: es lo
// que baja con la resolución) contra lo que dura el cuadro en pantalla. Con histéresis y sin
// cambiar el tamaño en cada cuadro: a lo sumo un escalón (10%) cada 2 s para bajar y cada
// 4 s para subir, y sólo sube si con el escalón de más (el costo crece con el área) igual
// queda margen. Los tirones sueltos no cuentan (se mira el percentil 75, no el peor).
export const AJUSTES_FLUIDO = { min: 0.7, max: 1, paso: 0.1, bajarCadaMs: 2000, subirCadaMs: 4000, alto: 0.88, margenSubir: 0.8, muestras: 90, minimoMuestras: 45 };
export function percentil(valores, n, p) {
  if (n <= 0) return 0;
  const ord = Array.prototype.slice.call(valores, 0, n).sort((a, b) => a - b);
  return ord[Math.min(n - 1, Math.floor(p * n))];
}
export function crearEscalaFluida(opciones = {}) {
  const A = { ...AJUSTES_FLUIDO, ...opciones };
  const razones = new Float32Array(A.muestras);
  let n = 0, i = 0, escala = A.max, ultimoCambio = -1e12;
  const redondear = (x) => Math.round(x * 100) / 100;
  // `costoMs`: lo que costó el cuadro; `objetivoMs`: lo que dura en pantalla; `ahora` en ms.
  // Devuelve la escala nueva si cambió, o null.
  function anotar(costoMs, objetivoMs, ahora) {
    if (!(costoMs > 0) || !(objetivoMs > 0)) return null;
    razones[i] = costoMs / objetivoMs; i = (i + 1) % A.muestras; n = Math.min(A.muestras, n + 1);
    if (n < A.minimoMuestras) return null;
    const p75 = percentil(razones, n, 0.75);
    const desde = ahora - ultimoCambio;
    let nueva = escala;
    if (p75 > A.alto && escala > A.min && desde >= A.bajarCadaMs) nueva = Math.max(A.min, redondear(escala - A.paso));
    else if (escala < A.max && desde >= A.subirCadaMs) {
      const arriba = Math.min(A.max, redondear(escala + A.paso));
      const crece = (arriba * arriba) / (escala * escala);
      if (p75 * crece < A.margenSubir) nueva = arriba;
    }
    if (nueva === escala) return null;
    escala = nueva; ultimoCambio = ahora; n = 0; i = 0;   // lo medido era con la otra escala
    return escala;
  }
  function reiniciar() { escala = A.max; n = 0; i = 0; ultimoCambio = -1e12; }
  return { anotar, reiniciar, get escala() { return escala; }, ajustes: A };
}
