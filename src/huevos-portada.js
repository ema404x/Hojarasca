// 4.2 (huevos de pascua): el código secreto de la portada. ↑ ↑ ↓ ↓ ← → ← → B A (huevos.js: CODIGO_PORTADA) y caen hojas de colores unos
// segundos sobre la portada, con tres notas suaves si el sonido ya está andando (si no, en silencio: acá no se arranca el audio).
// Una sola capa de hojas (<i> con una animación de CSS: la hace la compositora, no el juego) que se saca sola; mientras cae, el código no
// la repite. Sólo en la portada (con «reducir movimiento», pocas hojas que se apagan sin girar). No toca la partida.
import { teclaDelCodigo, planHojas, SEGUNDOS_HOJAS } from './huevos.js';

// `ctx`: { enPortada() → sí/no, sonido, calmo() → sí/no (reducir movimiento), documento }
export function crearHuevosPortada(ctx) {
  const doc = ctx.documento || document;
  const memoria = [];
  let capa = null, vuelta = 0, quitar = 0;

  function lluvia() {
    if (capa) return false;   // ya están cayendo
    const calmo = !!ctx.calmo?.();
    capa = doc.createElement('div');
    capa.className = 'huevo-hojas';
    capa.setAttribute('aria-hidden', 'true');
    for (const h of planHojas(44, ++vuelta, calmo)) {
      const i = doc.createElement('i');
      i.style.cssText = `left:${h.x}%;width:${h.tam}px;height:${Math.round(h.tam * 1.35)}px;background:${h.color};--dur:${h.dur}s;--espera:${h.espera}s;--mece:${h.mece};--giro:${calmo ? 0 : h.giro}`;
      capa.appendChild(i);
    }
    doc.body.appendChild(capa);
    const s = ctx.sonido;
    if (s?.ctx && s.ctx.state === 'running' && s.bus?.efectos && s.pulsar) {
      [[69, 0], [72, 0.22], [76, 0.44], [81, 0.8]].forEach(([m, t]) => s.pulsar(m, { cuando: t, dur: 1.6, vol: 0.045, destino: s.bus.efectos }));
    }
    quitar = setTimeout(sacar, SEGUNDOS_HOJAS * 1000);
    return true;
  }
  function sacar() { clearTimeout(quitar); capa?.remove(); capa = null; }

  function alTecla(e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (!ctx.enPortada?.()) { memoria.length = 0; return; }
    if (teclaDelCodigo(memoria, e.code)) { memoria.length = 0; lluvia(); }
  }
  doc.addEventListener('keydown', alTecla);
  return { lluvia, sacar, activa: () => !!capa, memoria };
}
