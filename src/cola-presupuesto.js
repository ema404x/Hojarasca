// 4.3.1: cola de trabajo con presupuesto de milisegundos por cuadro (lógica pura, sin three ni DOM).
// Sirve para repartir entre varios cuadros un trabajo que hoy se hace de un tirón (por ejemplo, rehacer los
// bloques del sotobosque de a un tipo por vez). Cada tarea tiene una clave (volver a pedir la misma
// reemplaza a la anterior, así un cambio nuevo no apila trabajo viejo) y una prioridad (menor = antes: la
// distancia al jugador, o el rumbo de avance). `procesar` hace siempre al menos una tarea (nada espera para
// siempre) y sigue mientras quede presupuesto.
export function crearColaPresupuesto({ presupuestoMs = 1.2, reloj = () => performance.now() } = {}) {
  const tareas = new Map();   // clave → { clave, prioridad, fn, orden }
  let orden = 0;
  const stats = { hechas: 0, cuadros: 0, ms: 0, pico: 0, reemplazadas: 0 };
  function encolar(clave, prioridad, fn) {
    if (tareas.has(clave)) stats.reemplazadas++;
    tareas.set(clave, { clave, prioridad, fn, orden: orden++ });
  }
  function cancelar(clave) { return tareas.delete(clave); }
  function siguiente() {
    let mejor = null;
    for (const t of tareas.values()) if (!mejor || t.prioridad < mejor.prioridad || (t.prioridad === mejor.prioridad && t.orden < mejor.orden)) mejor = t;
    return mejor;
  }
  // Devuelve cuántas tareas hizo. `presupuesto` (opcional) pisa el de la cola en este cuadro.
  function procesar(presupuesto = presupuestoMs) {
    if (!tareas.size) return 0;
    const t0 = reloj();
    let n = 0;
    while (tareas.size) {
      const t = siguiente();
      tareas.delete(t.clave);
      t.fn();
      n++;
      if (reloj() - t0 >= presupuesto) break;
    }
    const ms = reloj() - t0;
    stats.hechas += n; stats.cuadros++; stats.ms += ms; stats.pico = Math.max(stats.pico, ms);
    return n;
  }
  return { encolar, cancelar, procesar, get pendientes() { return tareas.size; }, stats, vaciar: () => tareas.clear() };
}
