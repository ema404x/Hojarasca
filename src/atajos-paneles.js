// 4.10.2: reglas puras de la interfaz (sin three ni DOM) para que se puedan probar en Node con un mundo de mentira.
//
// Regla única: con un panel modal abierto (el almacén, la feria, las cargas, el banco, el local, la carta de la cantina o
// de la casa de té, la cocina, el taller, las fiestas, el tablón, el taller K o la mochila), los atajos que abren OTRO
// panel no valen: antes la I abría la mochila escondida debajo del panel del local (y el primer Esc cerraba esa mochila
// invisible), la O abría los planos encima del tablón y los números 1 a 4 seguían tomando encargos.

// ¿Hay que ignorar esta tecla porque abriría otro panel encima del que está abierto?
//   · `mochila`: la mochila está abierta; `otroPanel`: hay otro panel abierto (no la mochila); `modoObra`: los planos están abiertos.
//   · I: con otro panel abierto no abre la mochila (con la mochila abierta, la cierra: eso sí vale).
//   · O: con cualquier panel abierto no abre los planos (si ya están abiertos, la O que los cierra sí pasa).
export function atajoBloqueadoPorPanel(codigo, { mochila = false, otroPanel = false, modoObra = false } = {}) {
  if (codigo === 'KeyI') return !!otroPanel && !mochila;
  if (codigo === 'KeyO') return (!!otroPanel || !!mochila) && !modoObra;
  return false;
}

// F2 (el modo foto): se puede apagar siempre; prender, sólo desde el juego, la pausa, el cuaderno o el mapa y sin logros, modos
// ni un panel de los que están FUERA del HUD (banco, local, cantina, casa de té: el modo foto esconde el HUD pero no esos paneles,
// que quedaban tapando la escena y los controles de la foto).
export function fotoPosible({ fotoActiva = false, modo = 'jugando', logrosOculto = true, modosAbierto = false, panelFueraDelHud = false } = {}) {
  if (fotoActiva) return true;
  return (modo === 'jugando' || modo === 'pausa' || modo === 'cuaderno' || modo === 'mapa') && !!logrosOculto && !modosAbierto && !panelFueraDelHud;
}

// La mano sigue a lo elegido por lo que es (3.8.6), pero la barra sólo dibuja `visibles` casillas: si lo elegido pasó a un
// lugar de la lista más allá de la última casilla visible (porque apareció algo que ordena antes), la mano ya no está en la
// barra. Se trata como cuando se termina: la casilla queda vacía hasta que elijas otra cosa (antes `elegida` pasaba a 8, 9…,
// la barra no marcaba nada y la mochila hablaba de la «casilla 10»).
// Devuelve { elegida, hueco }: la casilla elegida y si hay que dejar un hueco en esa casilla (como cuando se termina).
export function seguirElegida(ranuras, elegida, idElegido, visibles = 8) {
  if (!idElegido || ranuras[elegida]?.id === idElegido) return { elegida, hueco: false };
  const j = ranuras.findIndex((r) => r?.id === idElegido);
  if (j >= 0 && j < visibles) return { elegida: j, hueco: false, seguir: true };
  return { elegida, hueco: true };
}

// ¿Una cosa de la lista de la mochila se puede poner en la barra? Las recetas anotadas (armarGuardado) y lo que no tiene
// ranura, no.
export function seOfreceParaLaBarra(cosa) {
  return !!cosa && cosa.anotada !== true;
}

// Los textos de avisos y paneles que nombran la E o la F (y no son el <kbd> del aviso) siguen la tecla propia del jugador. Sin teclas
// cambiadas, el texto queda IGUAL (así no se pierde la traducción de los textos de fábrica). `visible(t)` da la tecla escrita
// (teclaVisible en main.js).
export function conTeclasPropias(texto, visible) {
  if (typeof texto !== 'string' || !texto) return texto;
  const e = visible('E'), f = visible('F');
  let t = texto;
  if (e !== 'E') t = t.replace(/mantené E(?![A-Za-zÁ-ú])/g, `mantené ${e}`).replace(/\bcon E(?![A-Za-zÁ-ú])/g, `con ${e}`).replace(/(^|· )E o Escape/, `$1${e} o Escape`);
  if (f !== 'F') t = t.replace(/\(F para /g, `(${f} para `);
  return t;
}

// 4.11.1 (U10): los pies de la carta, el banco y el local ya no están escritos fijos en la plantilla: se arman desde acá con la
// tecla de interactuar del jugador. Con la E de fábrica el texto es IDÉNTICO al de antes (así sigue valiendo la traducción hecha).
export const PIES_PANELES = {
  'pie-banco': 'E o Escape para salir del mostrador',
  'pie-carta': 'E o Escape para cerrar la carta',
  'pie-local': 'E o Escape para cerrar el panel · los clientes se atienden con E',
};
// Devuelve { id: texto } con la tecla propia (`visible(t)` da la tecla escrita; ver teclaVisible en main.js).
export function piesDePaneles(visible) {
  const r = {};
  for (const id of Object.keys(PIES_PANELES)) r[id] = conTeclasPropias(PIES_PANELES[id], visible);
  return r;
}
