// 4.25.0 (B): ¿qué objetivos esperan una hora (la escena que los cumple sólo sale en una ventana de hora) y no tienen `espera: true`?
// Sin `espera`, sentado el reloj no se acelera y el panel no avisa. Uso: node herramientas/auditoria-4-25-0-b-esperas.mjs
import { H, D } from '../pruebas/ayuda-4-18-4-historia.mjs';
const ids = (src) => [...String(src).matchAll(/escena\(\s*'([a-z0-9-]+)'/g)].map((m) => m[1]);
const cuerpo = (o) => String(o.hecho) + String(o.cuenta || '');
let n = 0;
for (const c of H.CAPITULOS) for (const o of c.objetivos) {
  const esc = ids(cuerpo(o));
  const ventanas = esc.map((e) => [e, Object.values(D.DISPARADORES).find((d) => (d.escena || '') === e) || D.DISPARADORES[e]]).filter(([, d]) => d?.hora);
  const llevaHora = ventanas.length > 0 || /\b(entre las|antes de las|a las \d|de noche|a la madrugada|a la mañana|al amanecer|al anochecer|a la tarde)\b/i.test(o.texto || '');
  if (llevaHora || o.espera) { n++; console.log(`${c.id}:${o.id}`.padEnd(34), o.espera ? 'espera ' : 'SIN esp.', ventanas.map(([e, d]) => `${e} ${d.hora.join('-')}`).join(' ; ') || '(texto)', '|', (o.texto || '').slice(0, 90)); }
}
console.log(n, 'objetivos con hora');
