// 4.6.1: ayuda para las pruebas de la tecla E y el aviso (ver src/interacciones.js).
//
// Desde la 4.6.1 la E y el aviso recorren una sola tabla (INTERACCIONES): las pruebas ya no buscan las dos cadenas de
// `if` en main.js, sino que preguntan a la tabla:
//   · `antes('a', 'b')`: la entrada `a` va antes que `b` (la E la prueba primero y el aviso también).
//   · `que({...})`: con un contexto falso (lo que no se da, no está), qué hace la E y qué dice el aviso.
//   · `enganche(main, 'nombre')`: el contexto de main.js (`ctxInteraccion`) le da a la tabla esa función del juego.
import assert from 'node:assert/strict';
import { INTERACCIONES, OTRAS_TECLAS, avisoDe, hacerConE } from '../src/interacciones.js';
import { mundoDeMentira } from './ayuda-codigo.mjs';

export { INTERACCIONES, OTRAS_TECLAS };
export const IDS = INTERACCIONES.map((e) => e.id);
export const IDS_OTRAS = OTRAS_TECLAS.map((e) => e.id);

export function pos(id) {
  const i = IDS.indexOf(id);
  assert.ok(i >= 0, `no hay una interacción «${id}» en la tabla`);
  return i;
}
export function antes(a, b, msj) { assert.ok(pos(a) < pos(b), msj || `«${a}» va antes que «${b}»`); }
export function enOrden(ids, msj) { for (let i = 1; i < ids.length; i++) antes(ids[i - 1], ids[i], msj); }
export function entrada(id) { return INTERACCIONES[pos(id)]; }

// Un contexto falso. `estado` da:
//   · js (se completa con lo de a pie), objetivo, vecino, desafio;
//   · `acciones: { rincones: true, empleo: { tipo: 'info' } … }`: lo que devuelven los módulos (`c.accion(n)`), con texto;
//   · `cerca: { cantero: {…}, acopio: true … }`: lo de al lado (`c.cerca(n)`);
//   · cualquier otra función del contexto por su nombre: un valor (se devuelve) o una función.
// Las funciones que no se dan devuelven nada, salvo los textos (`texto…`, `aviso…`), que devuelven su nombre entre <>.
// `c.hechos` anota lo que la E hizo.
export function contexto(estado = {}) {
  const hechos = [];
  const js = { enTren: false, enKayak: false, enVela: false, montado: false, sentado: false, enCable: false, enSulky: false, enSuelo: true, nadando: false, pos: { x: 0, y: 0, z: 0 }, ...(estado.js || {}) };
  const memo = {};
  const control = { anotar: false };
  const anotar = (x) => { if (control.anotar) hechos.push(x); };
  const base = {
    js, objetivo: estado.objetivo || null, vecino: estado.vecino || null, desafio: estado.desafio || null, hechos, control,
    accion: (n) => (Object.hasOwn(memo, n) ? memo[n] : (memo[n] = accionDe(n))),
    cerca: (n) => estado.cerca?.[n] || null,
    limpiar: (n) => anotar(`limpiar(${n})`),
  };
  function accionDe(n) {
    const a = estado.acciones?.[n];
    if (!a) return null;
    return { texto: `<${n}>`, tipo: n, hacer: () => anotar(`${n}.hacer`), ...(a === true ? {} : a) };
  }
  return new Proxy(base, {
    get(t, k) {
      if (typeof k !== 'string') return undefined;
      if (Object.hasOwn(t, k)) return t[k];
      if (Object.hasOwn(estado, k)) {
        const v = estado[k];
        return typeof v === 'function' ? (...a) => { anotar(k); return v(...a); } : (...a) => { anotar(k); return v; };
      }
      if (/^(texto|aviso)/.test(k)) return () => `<${k}>`;
      return () => { anotar(k); return undefined; };
    },
  });
}

// Qué hace la E y qué dice el aviso con ese estado: { e, hechos, aviso, avisoId, texto }. `hechos`: lo que llamó el
// `hacer` de la entrada elegida (sin las preguntas que la E fue haciendo para elegirla).
export function que(estado = {}) {
  const ce = contexto(estado);
  const e = hacerConE(ce);
  if (e) { const c2 = contexto(estado); const en = entrada(e); const hit = en.cuando(c2, true); c2.control.anotar = true; en.hacer(c2, hit); ce.hechos.push(...c2.hechos); }
  const ca = contexto(estado);
  const info = {};
  const aviso = avisoDe(ca, info);
  return { e, hechos: ce.hechos, aviso, avisoId: info.id, texto: aviso ? aviso.texto : null, tecla: aviso ? aviso.tecla : null };
}

// Una interacción de un módulo (`modulo.accion(js)` → { texto, hacer }): la E hace `hacer` y vuelve a buscar, el aviso
// dice su texto; ni en el tren, ni en el kayak, ni mirando algo para juntar.
export function revisarModulo(id, nombre) {
  const acciones = { [nombre]: true };
  const r = que({ acciones });
  assert.equal(r.e, id, `E: ${id}`);
  assert.ok(r.hechos.includes(`${nombre}.hacer`) && r.hechos.includes(`limpiar(${nombre})`), `E: ${nombre}.hacer() y se vuelve a buscar (${r.hechos})`);
  assert.equal(r.avisoId, id, `el aviso: ${id}`);
  assert.equal(r.texto, `<${nombre}>`, 'el aviso dice el texto de la acción');
  for (const js of [{ enTren: true }, { enKayak: true }]) assert.notEqual(que({ js, acciones }).e, id, `${id}: ni en el tren ni en el kayak`);
  assert.notEqual(que({ acciones, objetivo: { tipo: 'planta', texto: 'Anotar' } }).e, id, `${id}: mirando algo, eso`);
}

// Una función de main.js (`function nombre(…) { … }`, hasta su `}` en la columna 0), lista para llamarla con un entorno
// falso: lo que no se da en `entorno` se busca afuera (Math, etc.). Sirve para probar lo que hace, no cómo está escrita.
export function funcionDeMain(main, nombre, entorno = {}) {
  const i0 = main.indexOf(`\nfunction ${nombre}(`);
  assert.ok(i0 >= 0, `main.js tiene la función ${nombre}`);
  const i1 = main.indexOf('\n}\n', i0 + 1);
  const fuente = main.slice(i0 + 1, i1 + 2);
  const armar = new Function('env', `with (env) { return (${fuente}); }`);
  return armar(mundoDeMentira(entorno));
}

// El contexto de main.js: el bloque `const ctxInteraccion = { … };`
export function bloqueCtx(main) {
  const i0 = main.indexOf('const ctxInteraccion = {');
  assert.ok(i0 >= 0, 'main.js arma el contexto de la tabla (ctxInteraccion)');
  const i1 = main.indexOf('\n};', i0);
  return main.slice(i0, i1 + 3);
}
// Lo que el contexto le da a la tabla con ese nombre: desde `nombre:` hasta el fin de esa línea (o hasta el cierre de
// la función, si sigue en las líneas de abajo)
export function enganche(main, nombre) {
  const b = bloqueCtx(main);
  const m = new RegExp('(?:^|[\\s,{])' + nombre + '\\s*[:,]').exec(b);
  assert.ok(m, `ctxInteraccion le da a la tabla «${nombre}»`);
  let fin = b.indexOf('\n', m.index + 1);
  // una función de varias líneas: hasta su `},`
  if (/\{\s*$/.test(b.slice(m.index, fin))) fin = b.indexOf('\n  },', m.index) + 5;
  return b.slice(m.index, fin);
}
