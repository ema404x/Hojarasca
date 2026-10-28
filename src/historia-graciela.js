// 4.15.0: Graciela Pugh, la ingeniera de la Administración del Ramal (de Trevelin): sobretodo gris, rodete, botas que no son para el barro y la
// tablilla en la mano (el portafolios). Una persona armada con lo que ya hay (`gente.js`: `armarPobladorDeAPoco`, la tablilla de `darPlanilla`;
// su ropa está en `gente-ropa.js`, ASPECTO.graciela): ningún programa de shader ni luz nuevos. Llega en la trochita en el capítulo 4.
//
// Mientras el capítulo 4 está en curso existe en el mundo (se arma de a poco, unos ms por cuadro, y espera «dormida», sin verse). Cuando la
// escena del andén («anden-graciela») está vista, aparece en el andén de la Estación del Valle con su tablilla y se queda ahí; si una escena la
// está usando (la escena la «toma» y después la suelta como estaba), este módulo no la toca. Al cerrar el capítulo se queda en el hospedaje de la
// aldea (se saca del mundo). En las versiones que siguen vuelve en los capítulos 7 y 13.
//
// El módulo no importa three: lo que necesita del juego llega por `ctx`. Las reglas puras (`debeExistir`, `debeVerse`) se prueban en Node.
import { capituloActual } from './historia.js';

export const CLAVE_GRACIELA = 'graciela';
export const CAPITULOS_GRACIELA = ['ramal'];
export const ESCENA_ANDEN = 'anden-graciela';

export const DEF_GRACIELA = {
  clave: CLAVE_GRACIELA, nombre: 'Graciela Pugh', oficio: 'ingeniera de la Administración del Ramal', mano: 'planilla',
  colores: { ropa: '#d8d0c0', abrigo: '#6a6d72', pelo: '#3a2c24', bufanda: '#9a7a8a', gorro: null },
  saludo: 'Cuarenta toneladas por mes. Ustedes cargan doce. Disculpe, estoy anotando.',
  despedida: 'Voy a seguir contando.',
  velocidad: 1.0,
};

// ¿Existe en el mundo? Mientras el capítulo de su llegada está en curso (con la tarjeta de entrada cerrada o abierta, y hasta que se cierra).
export const debeExistir = (h) => !!h?.activa && h.fase !== 'fin' && CAPITULOS_GRACIELA.includes(capituloActual(h).id);
// ¿Se la ve? Una vez que bajó del tren (la escena del andén está vista) y mientras dure el capítulo.
export const debeVerse = (h) => debeExistir(h) && !!h.escenas?.vistas && Object.hasOwn(h.escenas.vistas, ESCENA_ANDEN);

// `ctx`: { gente: () => gente (de gente.js), historia: () => h, anden: () => { x, z, mira: { x, z } } | null, altura: (x, z) => y,
//          tomada: () => ¿una escena la está usando?, ms: () => ms para armar por cuadro (0: no ahora) }
export function crearGracielaMundo(ctx) {
  let npc = null, tarea = null, puesta = false;
  const quitar = () => { const g = ctx.gente?.(); if (npc && g?.quitar) g.quitar(npc); npc = null; tarea = null; puesta = false; };
  function poner() {
    const a = ctx.anden?.();
    if (!a || !npc) return false;
    npc.pos.set(a.x, ctx.altura ? ctx.altura(a.x, a.z) : npc.pos.y, a.z);
    npc.camino = []; npc.vel = 0;
    if (a.mira) { const r = Math.atan2(a.mira.x - a.x, a.mira.z - a.z); npc.rumbo = npc.rumboObjetivo = r; npc.miraFinal = r; if (npc.g) npc.g.rotation.y = r; }
    return true;
  }
  function actualizar() {
    const g = ctx.gente?.();
    if (!g?.armarPobladorDeAPoco) return;
    const h = ctx.historia();
    if (!debeExistir(h)) { if (npc || tarea) quitar(); return; }
    if (!npc) {
      const a = ctx.anden?.();
      if (!a) return;
      const ms = ctx.ms ? ctx.ms() : 3;
      if (!(ms > 0)) return;
      if (!tarea) tarea = g.armarPobladorDeAPoco({ ...DEF_GRACIELA, pos: { x: a.x, z: a.z }, mira: a.mira || { x: a.x, z: a.z + 1 }, camino: [] });
      if (tarea.avanzar(ms)) {
        npc = tarea.npc; tarea = null;
        if (npc) { npc.dormido = true; npc.sinFrenar = true; npc.camino = []; npc.velocidad = 1.0; puesta = false; }
      }
      return;
    }
    if (ctx.tomada?.()) return;   // una escena la tiene: ni se mueve ni se esconde
    if (debeVerse(h)) {
      if (!puesta || npc.dormido) { if (poner()) { npc.dormido = false; puesta = true; } }
    } else if (!npc.dormido) { npc.dormido = true; puesta = false; }
  }
  return { actualizar, quitar, npc: () => npc, armando: () => !!tarea };
}
