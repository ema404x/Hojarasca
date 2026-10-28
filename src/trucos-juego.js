// 4.5: la consola de códigos adentro del juego: junta el motor (trucos.js), la ventana (trucos-pantalla.js) y main.js. Aquí vive todo lo
// que toca el juego: abrir y cerrar con Ctrl+Mayús+C (pausando como un menú), las teclas, el modo y el mouse.
//
// Mientras la consola está abierta, `modo` vale 'trucos': el mundo queda quieto (como con la pausa o el cuaderno), el jugador no lee
// teclas y todo lo que se escribe lo toma ESTE módulo antes que nadie (oyente en captura sobre la ventana, registrado al importar el
// archivo para ir antes que los otros): nada de lo que escribís dispara una acción del juego. Cerrada, no hay nada por cuadro.
import { COMANDOS, ejecutar, sugerir, completar, crearHistorial } from './trucos.js';
import { crearTrucosPantalla } from './trucos-pantalla.js';
import { LUGARES_NOMBRE, LUGARES_ALDEA_NOMBRE } from './trucos-textos.js';
import { edificioEnMundo } from './aldea.js';
import { esAlmacen } from './almacen.js';

const EDIFICIOS_ALDEA = { aldea: 'estacion-aldea', plaza: 'plaza', banco: 'banco-pueblo', cantina: 'cantina', biblioteca: 'biblioteca', ramos: 'almacen', 'te-aldea': 'casa-te', escuela: 'escuela', observatorio: 'observatorio' };
const DESDE_QUE_MODOS = ['jugando', 'pausa'];

let instancia = null;   // la consola armada (una por juego); el oyente de teclas es del módulo

// Los lugares a los que se puede ir: los del valle (con su puerta si tienen) y, en el Relax, los de la aldea
export function lugaresDelMapa(T, desafio) {
  const salida = [];
  for (const [clave, nombre] of Object.entries(LUGARES_NOMBRE)) {
    const l = T?.lugares?.[clave];
    if (!l || !Number.isFinite(Number(l.x)) || !Number.isFinite(Number(l.z))) continue;
    const p = l.puerta && Number.isFinite(Number(l.puerta.x)) && Number.isFinite(Number(l.puerta.z)) ? l.puerta : l;
    salida.push({ clave, nombre, x: Number(p.x), z: Number(p.z), yaw: Number.isFinite(Number(l.mira)) && p === l.puerta ? Number(l.mira) : undefined });
  }
  if (desafio) return salida;
  try {
    const plaza = edificioEnMundo('plaza');
    for (const [clave, id] of Object.entries(EDIFICIOS_ALDEA)) {
      const e = edificioEnMundo(id);
      if (!e || !plaza || !Number.isFinite(e.x) || !Number.isFinite(e.z)) continue;
      // a 7 m del edificio, hacia la plaza: siempre afuera, en la calle o la plaza
      const dx = plaza.x - e.x, dz = plaza.z - e.z, d = Math.hypot(dx, dz);
      const paso = id === 'plaza' || d < 1 ? 0 : Math.min(7, d);
      const x = paso ? e.x + dx / d * paso : e.x, z = paso ? e.z + dz / d * paso : e.z;
      salida.push({ clave, nombre: LUGARES_ALDEA_NOMBRE[clave] || clave, x, z });
    }
  } catch { /* sin aldea: sólo los del valle */ }
  return salida;
}

// ctx: { esDesafio, progreso(), ajustes(), jugador(), T, limite, obras(), modo(), ponerModo(m), volverAlJuego(sinMouse), panelHudAbierto(),
//        ocupado(), alCambiarClima(), alCambiarEstacion(), refrescar(), guardar(), moverCamara(), nota() }
export function crearTrucosJuego(ctx) {
  const pantalla = crearTrucosPantalla(document);
  if (!pantalla) return null;
  const reloj = { congelado: false };
  const historial = crearHistorial();
  let modoAntes = null, agachadoAntes = null, tCtrl = 0, ciclo = null;

  const mundo = {
    get desafio() { return !!ctx.esDesafio; },
    progreso: () => ctx.progreso(),
    ajustes: () => ctx.ajustes(),
    jugador: () => ctx.jugador()?.estado,
    reloj,
    limite: ctx.limite,
    lugares: () => lugaresDelMapa(ctx.T, ctx.esDesafio),
    ir(x, z, yaw, y) {
      const j = ctx.jugador();
      j.ubicar(x, z, Number.isFinite(yaw) ? yaw : j.estado.yaw, Number.isFinite(y) ? y : null);
      j.desencajar?.();
      ctx.moverCamara?.();
    },
    depositos: () => (ctx.obras()?.obras || []).filter((o) => esAlmacen(o?.plano?.id) && o.datos && o.datos.etapas >= o.plano.etapas.length),
    rehacerObra: (o) => ctx.obras()?.rehacer?.(o),
    alSaltarElTiempo: (d, h) => ctx.alSaltarElTiempo?.(d, h),   // 4.10.1
    alCambiarClima: () => ctx.alCambiarClima?.(),
    alCambiarEstacion: () => ctx.alCambiarEstacion?.(),
    refrescar: () => ctx.refrescar?.(),
    guardar: () => ctx.guardar?.(),
    escena: (id) => ctx.escena?.(id) === true,   // 4.14.0: «escena demo»
    limpiar: () => pantalla.limpiar(),
    salir: () => {},
  };

  const abierta = () => pantalla.abierto();
  function abrir() {
    if (abierta()) return false;
    const m = ctx.modo();
    if (!DESDE_QUE_MODOS.includes(m) || ctx.ocupado?.()) return false;
    modoAntes = m;
    ctx.ponerModo('trucos');   // primero el modo: así soltar el mouse no abre la pausa y el jugador deja de leer teclas
    const js = ctx.jugador()?.estado;
    // Ctrl ya agachó al jugador antes de la C: se lo deja como estaba
    if (js && agachadoAntes !== null && Date.now() - tCtrl < 3000) js.agachado = agachadoAntes;
    agachadoAntes = null;
    ctx.jugador()?.soltar();
    pantalla.abrir();
    pantalla.poner('');
    actualizarSugerencias();
    return true;
  }
  function cerrar() {
    if (!abierta()) return false;
    pantalla.cerrar();
    ciclo = null;
    if (ctx.modo() === 'trucos') {
      const vuelta = modoAntes || 'jugando';
      modoAntes = null;
      ctx.ponerModo(vuelta);
      // con un panel del HUD abierto debajo (el almacén, la cocina…), el mouse queda suelto para seguir usándolo
      if (vuelta === 'jugando') ctx.volverAlJuego(ctx.panelHudAbierto?.() === true);
    }
    return true;
  }
  const alternar = () => (abierta() ? cerrar() : abrir());

  function actualizarSugerencias(indice = -1) {
    const lista = sugerir(pantalla.valor(), mundo);
    pantalla.sugerencias(lista, indice);
    return lista;
  }
  function ejecutarLinea() {
    const linea = pantalla.valor().trim();
    ciclo = null;
    if (!linea) return;
    historial.agregar(linea);
    const r = ejecutar(linea, mundo);
    pantalla.responder(linea, r);
    pantalla.poner('');
    pantalla.sugerencias([]);
    if (r.cerrar) cerrar();
  }
  function tab() {
    if (!ciclo) ciclo = { base: pantalla.valor(), vuelta: 0 }; else ciclo.vuelta++;
    const r = completar(ciclo.base, mundo, ciclo.vuelta);
    pantalla.poner(r.linea);
    pantalla.sugerencias(r.opciones, r.indice);
  }
  pantalla.cuandoElige((s) => { pantalla.poner(s.completa); ciclo = null; pantalla.enfocar(); actualizarSugerencias(); });
  pantalla.entrada.addEventListener('input', () => { ciclo = null; historial.reiniciar(); actualizarSugerencias(); });

  // Las teclas con la consola abierta. Devuelve verdadero si las tomó (el oyente de la ventana corta ahí).
  function alTecla(e) {
    if (e.code === 'F11' || e.code === 'F12') return false;   // pantalla completa y herramientas: son de la ventana
    switch (e.code) {
      case 'Escape': e.preventDefault(); cerrar(); return true;
      case 'Enter': case 'NumpadEnter': e.preventDefault(); if (!e.repeat) ejecutarLinea(); return true;
      case 'Tab': e.preventDefault(); tab(); return true;
      case 'ArrowUp': e.preventDefault(); ciclo = null; pantalla.poner(historial.anterior(pantalla.valor())); actualizarSugerencias(); return true;
      case 'ArrowDown': e.preventDefault(); ciclo = null; pantalla.poner(historial.siguiente(pantalla.valor())); actualizarSugerencias(); return true;
      default: return true;   // lo demás se escribe en la línea (la acción por defecto sigue), pero el juego no se entera
    }
  }

  instancia = { abrir, cerrar, alternar, abierta, alTecla, reloj, mundo, pantalla, historial, ejecutar: (l) => { pantalla.poner(l); ejecutarLinea(); },
    recordarCtrl(js) { agachadoAntes = !!js?.agachado; tCtrl = Date.now(); } };
  return instancia;
}

// El oyente de las teclas: UNO por ventana, en captura y registrado al importar el módulo (antes que el de los otros: el del deseo
// de la estrella fugaz, por ejemplo, tomaba 1, 2 y 3 aunque estuvieras escribiendo en una línea de texto).
function oyente(e) {
  const t = instancia;
  if (!t) return;
  if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.code === 'KeyC') {
    e.preventDefault(); e.stopImmediatePropagation();   // ni agacharse (la C) ni las herramientas de la ventana
    if (!e.repeat) t.alternar();
    return;
  }
  if (!t.abierta()) {
    // el Ctrl solo agacha al jugador: se anota cómo estaba para dejarlo igual si lo que venía era Ctrl+Mayús+C
    if ((e.code === 'ControlLeft' || e.code === 'ControlRight') && !e.repeat) t.recordarCtrl(t.mundo.jugador());
    return;
  }
  if (t.alTecla(e)) e.stopImmediatePropagation();
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('keydown', oyente, true);
export const codigosDeLaConsola = () => COMANDOS.map((c) => c.nombre);
