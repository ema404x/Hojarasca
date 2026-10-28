// 4.15.0: los efectos y las condiciones con nombre que las escenas de la Historia pueden usar (`{ tipo: 'efecto', nombre: 'lazo', args }` y
// `si: { cond: 'decision', args }`). Puro (sin three ni DOM; se prueba en Node). Todos son idempotentes: se anotan en `historia.aplicadas`
// con la escena que los pidió, así un efecto que corre dos veces (la escena saltada y después vuelta a ver) no cuenta doble.
import { cambiarLazo, anotarRaro, marcarObjeto, marcarTema, marcarEntrega, sumarRamal, lazoDe, PERSONAS_LAZO } from './historia.js';

const clave = (...p) => p.map((x) => String(x ?? '')).join(':').slice(0, 63);

// `reg`: { registrarEfecto(nombre, fn), registrarCondicion(nombre, fn) }. `ctx`: { historia: () => h, dia: () => n, estado: () => s }
export function registrarEfectosHistoria(reg, ctx) {
  const una = (h, k) => { if (!h.aplicadas || typeof h.aplicadas !== 'object' || Array.isArray(h.aplicadas)) h.aplicadas = {}; if (Object.hasOwn(h.aplicadas, k)) return false; h.aplicadas[k] = Math.max(1, Math.floor(Number(ctx.dia()) || 1)); return true; };
  const H = () => ctx.historia();
  reg.registrarEfecto('lazo', (a, c) => { const h = H(); if (h && PERSONAS_LAZO.includes(a?.quien) && una(h, clave('lazo', c?.escena, a.quien, a.n))) cambiarLazo(h, a.quien, a.n); });
  reg.registrarEfecto('raro', (a) => { const h = H(); if (h) anotarRaro(h, a?.id, ctx.dia()); });
  reg.registrarEfecto('objeto', (a) => { const h = H(); if (h && typeof a?.id === 'string') marcarObjeto(h, a.id, ctx.dia()); });
  reg.registrarEfecto('dar-objeto', (a) => { const h = H(); if (h && typeof a?.id === 'string') marcarObjeto(h, a.id, ctx.dia()); });
  reg.registrarEfecto('tema', (a) => { const h = H(); if (h && typeof a?.quien === 'string' && typeof a?.tema === 'string') marcarTema(h, a.quien, a.tema, ctx.dia()); });
  reg.registrarEfecto('entrega', (a) => { const h = H(); if (h && typeof a?.quien === 'string' && typeof a?.cosa === 'string') marcarEntrega(h, a.quien, a.cosa, ctx.dia()); });
  reg.registrarEfecto('ramal', (a, c) => { const h = H(); if (h && una(h, clave('ramal', c?.escena, a?.n))) sumarRamal(h, a?.n); });
  reg.registrarEfecto('acompanante', (a) => { const h = H(); if (h) h.acompanante = PERSONAS_LAZO.includes(a?.quien) ? a.quien : null; });
  // condiciones
  reg.registrarCondicion('decision', (c) => { const h = H(); const a = c?.args || {}; return !!h && typeof a.id === 'string' && a.es !== undefined && Object.hasOwn(h.decisiones || {}, a.id) && h.decisiones[a.id] === a.es; });
  reg.registrarCondicion('lazo', (c) => { const h = H(); const a = c?.args || {}; return !!h && lazoDe(h, a.quien) >= (Number(a.min) || 0); });
  reg.registrarCondicion('ramal', (c) => { const h = H(); return !!h && (Number(h.ramal) || 0) >= (Number(c?.args?.min) || 0); });
  reg.registrarCondicion('evento', (c) => { const s = ctx.estado?.(); const a = c?.args || {}; return !!s && s.eventos?.has(a.id) && (a.opcion === undefined || ctx.opcionDeEvento?.(a.id) === a.opcion); });
  reg.registrarCondicion('derrumbe-ayudo', () => ctx.opcionDeEvento?.('derrumbe') === 'ayudar');
  reg.registrarCondicion('acompanante', (c) => { const h = H(); return !!h && h.acompanante === c?.args?.quien; });
}
