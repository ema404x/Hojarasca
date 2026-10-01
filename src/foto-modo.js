// Modo foto: la cámara se suelta del cuerpo, el HUD se va y quedan a mano los cuatro
// o cinco controles que hacen una foto distinta (hora, encuadre, luz y grano).
// Módulo puro (se prueba en Node): los controles, sus límites y el panel.

export const CONTROLES_FOTO = [
  { id: 'hora', etiqueta: 'Hora del día', min: 0, max: 23.9, paso: 0.1, unidad: 'h', sufijo: (v) => relojCorto(v) },
  { id: 'fov', etiqueta: 'Campo de visión', min: 35, max: 95, paso: 1, unidad: '°' },
  { id: 'exposicion', etiqueta: 'Exposición', min: 0.55, max: 1.75, paso: 0.01 },
  { id: 'bloom', etiqueta: 'Brillo de las luces', min: 0, max: 1.2, paso: 0.01 },
  { id: 'vineta', etiqueta: 'Viñeta', min: 0, max: 1, paso: 0.01 },
  { id: 'grano', etiqueta: 'Grano', min: 0, max: 1.6, paso: 0.01 },
];

export const GUIAS = [
  { id: 'ninguna', nombre: 'Sin guías' },
  { id: 'tercios', nombre: 'Tercios' },
  { id: 'centro', nombre: 'Centro' },
];

export function relojCorto(h) {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round((((h % 24) + 24) % 24 - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
}

export function estadoFotoInicial({ hora = 12, fov = 70, bloom = 0.4, vineta = 0.5, grano = 0.35 } = {}) {
  return { activo: false, congelado: true, guias: 'tercios', hora, fov, exposicion: 1, bloom, vineta, grano };
}

const acotar = (v, min, max) => (v < min ? min : v > max ? max : v);

// Devuelve el estado nuevo, con el valor acotado a lo que el control permite.
export function aplicarControl(estado, id, valor) {
  const c = CONTROLES_FOTO.find((x) => x.id === id);
  if (!c) return estado;
  const n = Number(valor);
  if (!Number.isFinite(n)) return estado;
  return { ...estado, [id]: acotar(n, c.min, c.max) };
}

export function textoControl(estado, id) {
  const c = CONTROLES_FOTO.find((x) => x.id === id);
  if (!c) return '';
  const v = estado[id];
  if (c.sufijo) return c.sufijo(v);
  return c.unidad ? `${Math.round(v)}${c.unidad}` : v.toFixed(2);
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function htmlPanelFoto(estado) {
  const filas = CONTROLES_FOTO.map((c) => `<label class="foto-fila">
    <span>${esc(c.etiqueta)}</span>
    <input type="range" data-foto="${c.id}" min="${c.min}" max="${c.max}" step="${c.paso}" value="${estado[c.id]}">
    <b data-foto-valor="${c.id}">${esc(textoControl(estado, c.id))}</b>
  </label>`).join('');
  const guias = GUIAS.map((g) => `<button data-foto-guia="${g.id}" aria-pressed="${estado.guias === g.id}">${esc(g.nombre)}</button>`).join('');
  return `${filas}
    <div class="foto-fila foto-botones"><span>Guías</span><div class="foto-guias">${guias}</div></div>
    <div class="foto-fila foto-botones"><span>El mundo</span><div class="foto-guias">
      <button data-foto-congelar="1" aria-pressed="${estado.congelado}">Congelado</button>
      <button data-foto-congelar="0" aria-pressed="${!estado.congelado}">En movimiento</button>
    </div></div>`;
}

export function nombreArchivoFoto(fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `hojarasca-${fecha.getFullYear()}${p(fecha.getMonth() + 1)}${p(fecha.getDate())}-${p(fecha.getHours())}${p(fecha.getMinutes())}${p(fecha.getSeconds())}.png`;
}

export const AYUDA_FOTO = 'WASD vuela · Espacio y Shift suben y bajan · Shift corre · P saca la foto · F2 sale';

export const CSS_FOTO = `
#foto-panel { position: fixed; right: 16px; top: 50%; transform: translateY(-50%); width: 280px; background: rgba(12,16,13,.82); border-radius: 12px; padding: 12px 14px; }
#foto-panel h3 { margin: 0 0 2px; font-size: 15px; }
#foto-panel .ayuda { margin: 0 0 10px; font-size: 12px; opacity: .65; line-height: 1.35; }
.foto-fila { display: grid; grid-template-columns: 96px 1fr 44px; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 6px; }
.foto-fila b { text-align: right; font-variant-numeric: tabular-nums; opacity: .8; }
.foto-fila input[type=range] { width: 100%; }
.foto-botones { grid-template-columns: 96px 1fr; }
.foto-guias { display: flex; gap: 4px; flex-wrap: wrap; }
.foto-guias button { padding: 3px 8px; font-size: 12px; border-radius: 6px; background: rgba(255,255,255,.08); opacity: .6; }
.foto-guias button[aria-pressed="true"] { opacity: 1; outline: 1px solid currentColor; }
#foto-guias-capa { position: fixed; inset: 0; pointer-events: none; }
#foto-guias-capa i { position: absolute; background: rgba(255,255,255,.28); }
#foto-guias-capa i.h { left: 0; right: 0; height: 1px; }
#foto-guias-capa i.v { top: 0; bottom: 0; width: 1px; }
`;
