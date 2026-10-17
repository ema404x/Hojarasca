// 4.1 (F4): el prólogo de Bruno Castellanos: 5 tarjetas de texto que se ven al empezar una partida NUEVA del Relax, justo después de crear a Bruno.
// Sólo DOM (sin three): una capa a pantalla completa con un fondo de color por escena. Los textos y los botones están en creador-textos.js
// (propuestos por Claude, a revisar por el usuario; el texto de las cinco pantallas lo eligió el usuario).
//   · Enter, Espacio o flecha derecha: siguiente (la última tarjeta termina el prólogo y lleva a la llegada al refugio); flecha izquierda: volver; Escape: saltarlo.
//   · No hay mando todavía (deuda con fecha, igual que la pantalla de creación).
// `alTerminar(saltado)` se llama una sola vez, al llegar al final o al saltarlo.
import { PROLOGO, BOTONES_PROLOGO } from './creador-textos.js';

// un fondo por escena (ciudad gris, mañana fría, viaje, valle al atardecer, noche tibia)
const FONDOS = [
  'linear-gradient(160deg,#4b4f57 0%,#2f3239 100%)',
  'linear-gradient(160deg,#4a525c 0%,#6f757b 100%)',
  'linear-gradient(160deg,#3b5563 0%,#6b8470 100%)',
  'linear-gradient(160deg,#3f6270 0%,#8c6c3e 100%)',
  'linear-gradient(160deg,#1f2c44 0%,#4a3b30 100%)',
];
const CSS = `
#prologo-bruno{position:fixed;inset:0;z-index:2100;display:flex;align-items:center;justify-content:center;font-family:Georgia,'Spectral',serif;color:#f6efdc;user-select:none}
#prologo-bruno .pb-tarjeta{width:min(780px,88vw);box-sizing:border-box;max-height:calc(100vh - 150px);display:flex;flex-direction:column;gap:clamp(10px,2.2vh,22px);padding:26px 30px 28px;margin-bottom:70px;background:rgba(14,12,10,.28);border-radius:10px;animation:pb-entra .6s ease both}
#prologo-bruno .pb-num{font-size:clamp(12px,1.5vw,15px);letter-spacing:3px;text-transform:uppercase;opacity:.75}
#prologo-bruno h1{margin:0;font-size:clamp(26px,3.6vw,40px);font-weight:normal;letter-spacing:1px}
#prologo-bruno .pb-texto{margin:0;font-size:clamp(19px,2.5vw,28px);line-height:1.55;text-shadow:0 1px 8px rgba(0,0,0,.35)}
#prologo-bruno .pb-puntos{display:flex;gap:10px;margin-top:4px}
#prologo-bruno .pb-puntos i{width:11px;height:11px;border-radius:50%;border:1.5px solid #f6efdc;opacity:.6}
#prologo-bruno .pb-puntos i.act{background:#f6efdc;opacity:1}
#prologo-bruno .pb-pie{position:absolute;left:0;right:0;bottom:clamp(14px,4vh,40px);display:flex;flex-direction:column;align-items:center;gap:10px}
#prologo-bruno .pb-botones{display:flex;gap:12px;align-items:center}
#prologo-bruno .pb-boton{font:inherit;font-size:clamp(15px,1.7vw,19px);padding:9px 24px;border-radius:5px;border:1px solid rgba(246,239,220,.7);background:rgba(0,0,0,.28);color:#f6efdc;cursor:pointer}
#prologo-bruno .pb-boton.principal{background:#f6efdc;color:#2f2a22;font-weight:bold}
#prologo-bruno .pb-boton.suave{border-color:transparent;opacity:.8}
#prologo-bruno button:focus-visible{outline:3px solid #9cc7ee;outline-offset:2px}
#prologo-bruno .pb-ayuda{font-size:13px;opacity:.65}
@keyframes pb-entra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){#prologo-bruno .pb-tarjeta{animation:none}}
`;
const h = (tag, atr = {}, ...hijos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(atr)) { if (k === 'class') n.className = v; else if (k === 'onclick') n.addEventListener('click', v); else n.setAttribute(k, v); }
  for (const x of hijos.flat()) if (x !== null && x !== undefined) n.append(x);
  return n;
};

export function abrirPrologo({ alTerminar } = {}) {
  let i = 0, cerrado = false;
  const raiz = h('div', { id: 'prologo-bruno', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Prólogo' });
  const estilo = h('style'); estilo.textContent = CSS;
  raiz.append(estilo);
  document.body.appendChild(raiz);

  function terminar(saltado) {
    if (cerrado) return;
    cerrado = true;
    window.removeEventListener('keydown', alTeclear, true); window.removeEventListener('keyup', alSoltarTecla, true);
    raiz.remove();
    alTerminar?.(saltado);
  }
  const siguiente = () => { if (i >= PROLOGO.length - 1) terminar(false); else { i++; pintar(); } };
  const volver = () => { if (i > 0) { i--; pintar(); } };

  function pintar() {
    const e = PROLOGO[i], ultima = i === PROLOGO.length - 1;
    raiz.style.background = FONDOS[i % FONDOS.length];
    raiz.querySelectorAll('.pb-tarjeta,.pb-pie').forEach((n) => n.remove());
    raiz.append(
      h('div', { class: 'pb-tarjeta' }, h('div', { class: 'pb-num' }, `${i + 1} de ${PROLOGO.length}`), h('h1', {}, e.titulo), h('p', { class: 'pb-texto' }, e.texto),
        h('div', { class: 'pb-puntos', 'aria-hidden': 'true' }, PROLOGO.map((_, k) => h('i', { class: k === i ? 'act' : '' })))),
      h('div', { class: 'pb-pie' },
        h('div', { class: 'pb-botones' },
          h('button', { class: 'pb-boton suave', onclick: () => terminar(true) }, BOTONES_PROLOGO.saltar),
          i > 0 ? h('button', { class: 'pb-boton', onclick: volver }, BOTONES_PROLOGO.volver) : null,
          h('button', { class: 'pb-boton principal', onclick: siguiente }, ultima ? BOTONES_PROLOGO.llegar : BOTONES_PROLOGO.siguiente)),
        h('div', { class: 'pb-ayuda' }, BOTONES_PROLOGO.ayuda)),
    );
    raiz.querySelector('.pb-boton.principal')?.focus({ preventScroll: true });
  }
  // mientras está abierto, el resto del juego no recibe teclas; sobre un botón, Enter y Espacio hacen lo del botón
  function alTeclear(e) {
    e.stopPropagation();
    if (e.key === 'Tab') {   // 4.0.2: el foco no se va a los botones de la portada que están detrás: con Tab (y Mayús+Tab) da la vuelta adentro
      const fs = [...raiz.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
      if (fs.length) {
        const k = fs.indexOf(document.activeElement);
        if (k < 0 || (!e.shiftKey && k === fs.length - 1) || (e.shiftKey && k === 0)) { e.preventDefault(); fs[k < 0 || !e.shiftKey ? 0 : fs.length - 1].focus({ preventScroll: true }); }
      }
    }
    if (e.repeat && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); return; }   // 4.0.1: Enter sostenido al cerrar la creación pasaba las cinco tarjetas
    const enBoton = !!e.target?.closest?.('button');
    if ((e.key === 'Enter' || e.key === ' ') && enBoton) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); siguiente(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); volver(); }
    else if (e.key === 'Escape') { e.preventDefault(); terminar(true); }
  }
  const alSoltarTecla = (e) => e.stopPropagation();
  window.addEventListener('keydown', alTeclear, true); window.addEventListener('keyup', alSoltarTecla, true);
  pintar();
  return { cerrar: () => terminar(true), indice: () => i, siguiente, volver };
}
