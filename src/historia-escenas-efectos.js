// 4.15.0: los efectos y las condiciones con nombre que las escenas de la Historia pueden usar (`{ tipo: 'efecto', nombre: 'lazo', args }` y
// `si: { cond: 'decision', args }`). Puro (sin three ni DOM; se prueba en Node). Todos son idempotentes: se anotan en `historia.aplicadas`
// con la escena que los pidió, así un efecto que corre dos veces (la escena saltada y después vuelta a ver) no cuenta doble.
import { cambiarLazo, anotarRaro, marcarObjeto, marcarTema, marcarEntrega, sumarRamal, lazoDe, anotarCharla, PERSONAS_LAZO, ACOMPANANTES, PRESTADOS, DECISIONES } from './historia.js';
import { parsearEfecto } from './historia-escenas-util.js';

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
  reg.registrarEfecto('acompanante', (a) => { const h = H(); if (h) h.acompanante = ACOMPANANTES.includes(a?.quien) ? a.quien : null; });
  // condiciones
  reg.registrarCondicion('decision', (c) => { const h = H(); const a = c?.args || {}; const d = a.d ?? a.id; if (!h || typeof d !== 'string' || a.es === undefined) return false; const v = Object.hasOwn(h.decisiones || {}, d) ? h.decisiones[d] : null; return a.es === 'ninguna' ? v == null : v === a.es; });
  reg.registrarCondicion('lazo', (c) => { const h = H(); const a = c?.args || {}; if (!h) return false; const l = lazoDe(h, a.quien); return l >= (a.min === undefined || a.min === null ? -9 : Number(a.min)) && l <= (a.max === undefined || a.max === null ? 9 : Number(a.max)); });
  reg.registrarCondicion('ramal', (c) => { const h = H(); return !!h && (Number(h.ramal) || 0) >= (Number(c?.args?.min) || 0); });
  reg.registrarCondicion('evento', (c) => { const s = ctx.estado?.(); const a = c?.args || {}; return !!s && s.eventos?.has(a.id) && (a.opcion === undefined || ctx.opcionDeEvento?.(a.id) === a.opcion); });
  reg.registrarCondicion('derrumbe-ayudo', () => ctx.opcionDeEvento?.('derrumbe') === 'ayudar');
  reg.registrarCondicion('acompanante', (c) => { const h = H(); return !!h && h.acompanante === c?.args?.quien; });
  // 4.16.0: esa persona ya vive en la aldea (los pobladores que llegaron con la construcción): Rosa es la panadera
  reg.registrarCondicion('presente', (c) => { const s = ctx.estado?.(); const q = c?.args?.quien; const clave = q === 'rosa' ? 'panadera' : q; return !!s && typeof clave === 'string' && !!s.pobladores?.has(clave); });
}

// 4.15.0 (A+B): los efectos con la sintaxis de las escenas del acto I (`lazo:ema:-1`, `decision:bolsa:a`, `raro:ronda-ramitas`, `objeto:puertita`,
// `mundo:ronda-ramitas`, `duende:pillo-cruza`…; ver historia-escenas-util.js). `nombres`: la lista exacta (EFECTOS_ACTO1). `ctx` suma, opcionales:
// `dar(cosa, n)`, `mundo(id, args, escena)` y `duende(id, args)` (lo visible lo hace main.js). Idempotentes por escena (se anotan en `aplicadas`).
export function registrarEfectosActo1(reg, ctx, nombres) {
  const H = () => ctx.historia();
  const una = (h, k) => { if (!h.aplicadas || typeof h.aplicadas !== 'object' || Array.isArray(h.aplicadas)) h.aplicadas = {}; if (Object.hasOwn(h.aplicadas, k)) return false; h.aplicadas[k] = Math.max(1, Math.floor(Number(ctx.dia()) || 1)); return true; };
  for (const nombre of nombres) {
    const p = parsearEfecto(nombre);
    if (!p) continue;
    const clave = (c) => `e:${c?.escena || '?'}:${nombre}`.slice(0, 63);
    reg.registrarEfecto(nombre, (args, c) => {
      const h = H();
      if (!h) return;
      switch (p.tipo) {
        case 'lazo': if (PERSONAS_LAZO.includes(p.quien) && una(h, clave(c))) cambiarLazo(h, p.quien, p.n); break;
        case 'decision': if (DECISIONES.includes(p.d)) { if (!h.decisiones || typeof h.decisiones !== 'object') h.decisiones = {}; h.decisiones[p.d] = p.v; } break;
        case 'ramal': if (una(h, clave(c))) sumarRamal(h, p.n); break;
        case 'raro': anotarRaro(h, p.id, ctx.dia()); break;
        case 'objeto': case 'entrega': (p.tipo === 'objeto' ? marcarTema : marcarEntrega)(h, 'obj', p.id, ctx.dia()); break;
        case 'dar': if (una(h, clave(c))) ctx.dar?.(p.cosa, p.n); break;
        case 'quitar': if (una(h, clave(c))) ctx.quitar?.(p.cosa, p.n); break;
        case 'prestado': if (PRESTADOS.includes(p.id) && h.prestado) h.prestado[p.id] = true; break;
        case 'mundo': marcarTema(h, 'mundo', p.id, ctx.dia()); ctx.mundo?.(p.id, args, c?.escena); break;
        case 'duende': ctx.duende?.(p.id, args); break;
        case 'optativa': marcarTema(h, 'optativa', p.id, ctx.dia()); break;
        case 'hablado': anotarCharla(h, p.id); break;
        default: break;
      }
    });
  }
}
