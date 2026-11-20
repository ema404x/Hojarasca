// 4.31.1 (junta): el contexto de la E tiene que traer accionarPuerta en su propia línea (un comentario se lo había comido y ninguna puerta abría)
import fs from 'node:fs';
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const lineas = main.split('\n');
const fallas = [];
if (!lineas.some((l) => /^\s*accionarPuerta: \(p\) => puertas\.accionar\(p\),/.test(l))) fallas.push('accionarPuerta no está como propiedad del contexto');
for (const l of lineas) { const i = l.indexOf('//'); if (i >= 0 && /\b[a-zA-Z]+: \([a-z, ]*\) =>/.test(l.slice(i)) && /^\s*[a-zA-Z]+: /.test(l)) fallas.push(`propiedad tragada por un comentario: ${l.trim().slice(0, 120)}`); }
if (fallas.length) { console.error('FALLA verificar-4-31-1-junta:\n  ' + fallas.join('\n  ')); process.exit(1); }
console.log('OK verificar-4-31-1-junta: accionarPuerta en el contexto, ninguna propiedad tragada por un comentario');
