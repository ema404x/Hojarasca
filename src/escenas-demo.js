// 4.14.0: la escena de demostración «Llegada de Josefina». NO está en el juego normal: sólo se registra y se dispara con la consola de
// códigos («escena demo», ver trucos.js). Sirve de ejemplo de cómo se escribe una escena (CAMBIOS_4_14_0.md) y de prueba del motor:
// cuatro planos, siete u ocho líneas de diálogo, una elección que ramifica, gestos de Josefina y un efecto.
// Es efímera: no marca la escena como vista ni guarda la elección (se puede repetir todas las veces que se quiera).

export const ID_ESCENA_DEMO = 'demo-llegada-josefina';

// Josefina viene de atrás tuyo y a un costado, sale del bosque. `frente` es relativo a hacia dónde mirás.
const LLEGADA = { frente: 'jugador', dist: 17, lado: 8 };
const ENFRENTE = { frente: 'jugador', dist: 3.3, lado: 0.6 };
const SE_VA = { frente: 'jugador', dist: 15, lado: -7 };

export const ESCENA_DEMO = {
  id: ID_ESCENA_DEMO,
  titulo: 'Llegada de Josefina',
  efimera: true,
  resumen: 'Josefina pasó a saludarte y siguió su camino por el bosque.',
  personajes: { josefina: { clave: 'ema', nombre: 'Josefina', color: '#a8c97a' } },
  pasos: [
    // 1) ella aparece entre los árboles y camina hacia vos; la cámara la acompaña al costado (travelling)
    { tipo: 'gesto', quien: 'josefina', accion: 'aparecer', a: LLEGADA, mira: 'jugador' },
    { tipo: 'hora', mas: 0.2, dur: 14, sinEsperar: true },
    { tipo: 'plano', plano: 'travelling', a: 'josefina', desde: 'jugador', dist: 5.5, alto: 1.5, dur: 6, sinEsperar: true },
    { tipo: 'gesto', quien: 'josefina', accion: 'caminar', a: ENFRENTE, vel: 1.9, mira: 'jugador' },
    // 2) llega y saluda con la mano: plano medio
    { tipo: 'plano', plano: 'medio', a: 'josefina', desde: 'jugador', mezcla: 0.8, dur: 0.6, sinEsperar: true },
    { tipo: 'gesto', quien: 'josefina', accion: 'posar', pose: 'saludo', dur: 2.2, sinEsperar: true },
    { tipo: 'sonido', id: 'anotar' },
    { tipo: 'dialogo', quien: 'josefina', lineas: [
      { texto: '¡Buenas! Vi el humo desde el mirador y dije: o es el refugio, o es un incendio.' },
      // 3) sobre el hombro: contraplano de ella hablando con vos
      { texto: 'Soy Josefina, la guardaparque. Hace años que nadie vivía acá abajo.', plano: { plano: 'hombro', desde: 'jugador', a: 'josefina', mezcla: 0.5, dur: 30, sinEsperar: true } },
      { texto: 'Ese techo no va a aguantar el invierno, pero la chimenea tira bien. Eso ya es algo.', gesto: { accion: 'posar', pose: 'senalar', dur: 1.8 } },
      { texto: 'Yo vivo del otro lado del mirador, en una casita con más goteras que la tuya.' },
      { texto: 'Don Ramón dice que sos de afuera. Yo digo que eso se arregla con el tiempo.' },
    ] },
    // 4) vos contestás: la elección ramifica con `si`
    { tipo: 'eleccion', id: 'saludo', pregunta: '¿Qué le contestás?', opciones: [
      { id: 'quedarme', texto: 'Vine a quedarme, si el valle me deja.' },
      { id: 'dudo', texto: 'Todavía no sé cuánto me quedo.' },
      { id: 'mate', texto: '¿Querés un mate?' },
    ] },
    { tipo: 'dialogo', quien: 'josefina', si: { eleccion: 'saludo', es: 'quedarme' }, lineas: ['El valle no deja ni echa: te mira un rato largo y después decide.'] },
    { tipo: 'dialogo', quien: 'josefina', si: { eleccion: 'saludo', es: 'dudo' }, lineas: ['Sincero. Acá nadie sabe cuánto se queda, y igual terminan quedándose.'] },
    { tipo: 'dialogo', quien: 'josefina', si: { eleccion: 'saludo', es: 'mate' }, lineas: [{ texto: 'Uy, un mate. Ya me caés bien.', gesto: { accion: 'posar', pose: 'asentir', dur: 1.2 } }] },
    { tipo: 'dialogo', quien: 'josefina', lineas: ['Pasá por el mirador cuando quieras. Y avisame si ves algo raro entre los helechos.'] },
    // 5) se va caminando y la cámara se abre: plano general
    { tipo: 'gesto', quien: 'josefina', accion: 'posar', pose: 'saludo', dur: 1.6, sinEsperar: true },
    { tipo: 'plano', plano: 'general', a: 'josefina', desde: 'jugador', dist: 10, alto: 3, mezcla: 1.2, dur: 5, sinEsperar: true },
    { tipo: 'gesto', quien: 'josefina', accion: 'caminar', a: SE_VA, vel: 1.7 },
    { tipo: 'efecto', nombre: 'demo-nota', args: { titulo: 'Escena de demostración', texto: 'Josefina siguió su camino' } },
  ],
};
