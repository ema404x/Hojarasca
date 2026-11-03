// 4.25.0 (B): recorre TODOS los textos de la Historia (escenas, tarjetas, notas, objetivos) y avisa de números de lazo, palabras que no van,
// frases repetidas entre escenas y líneas larguísimas. Uso: node herramientas/auditoria-4-25-0-b-textos.mjs
import { ESC, H } from '../pruebas/ayuda-4-18-4-historia.mjs';
import { readdirSync, readFileSync } from 'node:fs';
const mods = {};
for (const f of readdirSync(new URL('../src/', import.meta.url))) if (/^historia.*\.js$/.test(f) && !/-mundo|presencia|ui\.js|noche-mundo/.test(f)) { try { mods[f] = await import('../src/' + f); } catch (e) { console.error('no importa', f, e.message); } }
const textos = [];   // { donde, t }
const visto = new WeakSet();
function caminar(o, donde, prof = 0) {
  if (o == null || prof > 12) return;
  if (typeof o === 'string') { textos.push({ donde, t: o }); return; }
  if (typeof o !== 'object') return;
  if (visto.has(o)) return; visto.add(o);
  if (Array.isArray(o)) { o.forEach((x, i) => caminar(x, donde + '[' + i + ']', prof + 1)); return; }
  for (const [k, v] of Object.entries(o)) if (!/^(id|quien|plano|clave|hecho|cuenta|cond|requiere|tecla|forma|cap|modo|lugar|hora|efecto|condicion|siDecision|si|salto|ir)$/.test(k) || typeof v === 'object') caminar(v, donde + '.' + k, prof + 1);
}
for (const [f, m] of Object.entries(mods)) for (const [n, v] of Object.entries(m)) if (typeof v === 'object') caminar(v, f + ':' + n);
const lineas = textos.filter((x) => x.t.length > 3 && /[a-záéíóú]{3}/i.test(x.t) && /\s/.test(x.t));
console.log('textos', lineas.length);
const malas = [
  [/\blazo\b[^.]{0,20}[+-]?\d|[+-]\d+\s*(de )?lazo|\(\s*[+-]\d\s*\)|lazo\s*[:=]\s*-?\d/i, 'número de lazo'],
  [/\b(dios|diosa|santo|santa|santos|virgen|iglesia|rezar|rezo|reza|rezamos|bendici|bendec|bendig|ángel|angel|milagro|gauchito|difunta correa|pachamama|cruz(?![a-zñáéíóú])|crucifij|rosario|misa\b|cura(?![a-zñáéíóú])|parroquia|capilla|amén|amen\b|oración|oracion|plegaria|sagrad|divin|demonio|diablo|infierno|cielo santo)/i, 'religioso'],
  [/\b(desnud|sexo|sexual|erótic|erotic|orgasm|gemid|muslo|pecho de ella|senos|besó|beso en la boca|acarici|cama con|hacer el amor|hicimos el amor|amantes)/i, 'sensual explícito'],
  [/\b(the |you |your |okay|ok\b|thanks|hello|please)/i, 'inglés'],
  [/  +|\.\.\.\.|\s,|\s\.|[¿¡]\s/, 'tipografía'],
];
const salida = [];
for (const [re, nom] of malas) for (const x of lineas) if (re.test(x.t)) salida.push(nom + ' | ' + x.donde + ' | ' + x.t.slice(0, 160));
console.log(salida.join('\n') || 'sin hallazgos de palabras');
// repetidas: la misma frase (>= 28 letras) en dos escenas distintas
const soloEscenas = lineas.filter((x) => /ESCENAS_|ESCENAS\./.test(x.donde) && /\.(lineas|texto)/.test(x.donde) && !/resumen|titulo/.test(x.donde));
const por = new Map();
for (const x of soloEscenas) { const k = x.t.trim().toLowerCase(); if (k.length < 28) continue; const raiz = x.donde.split('.').slice(0, 2).join('.'); if (!por.has(k)) por.set(k, new Set()); por.get(k).add(raiz); }
const rep = [...por].filter(([, s]) => s.size > 1);
console.log('--- repetidas entre escenas distintas:', rep.length);
for (const [k, s] of rep.slice(0, 80)) console.log([...s].join(' ; ') + ' | ' + k.slice(0, 120));
