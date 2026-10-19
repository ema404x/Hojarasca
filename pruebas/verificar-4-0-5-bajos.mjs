// 4.0.5 · Bajos de la 4.0.1 y la 4.0.3 que quedaban: F7 (la estación al cargar), G15 (el mouse en el banco de pruebas),
// E8 (Chela y Rubén: una sola persona con vos) y F9 (la lagartija que huye apoya en el suelo de ahí).
// Lo que se puede probar sin el mundo 3D se prueba andando (la cuenta de la estación y los textos del visitante); lo demás, en el texto de las fuentes.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const leer = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const main = leer('src/main.js');
const tiene = (texto, trozo, que) => assert.ok(texto.includes(trozo), que);
const ok = (cond, que) => { assert.ok(cond, que); console.log('✓', que); };

// ---------------------------------------------------------------- F7: la estación «auto» arranca ya en la de la fecha
{
  const m = main.match(/function estacionObjetivo\(\) \{[\s\S]*?\n\}\n/);
  assert.ok(m, 'existe estacionObjetivo()');
  const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const crear = (ajustes, progreso) => new Function('ajustes', 'progreso', 'DIAS_ANIO', 'smoothstep', `${m[0]}; return estacionObjetivo;`)(ajustes, progreso, 12, smoothstep);
  // la cuenta de siempre (la que estaba escrita en cada cuadro)
  const vieja = (dia, horas) => {
    const fase = (((dia - 1 + horas / 24) % 12) + 12) % 12 / 12;
    return { oto: smoothstep(0.30, 0.40, fase) * (1 - smoothstep(0.63, 0.73, fase)), inv: smoothstep(0.63, 0.73, fase) * (1 - smoothstep(0.96, 1.0, fase)) };
  };
  const ajustes = { estacion: 'auto' }, progreso = { dia: 1, horas: 9 };
  const f = crear(ajustes, progreso);
  let hayOto = false, hayInv = false;
  for (let dia = 1; dia <= 30; dia++) for (const h of [0, 7, 13.5, 22]) {
    progreso.dia = dia; progreso.horas = h;
    const a = f(), b = vieja(dia, h);
    assert.ok(Math.abs(a.oto - b.oto) < 1e-12 && Math.abs(a.inv - b.inv) < 1e-12, `auto: día ${dia} ${h} h igual que la cuenta de siempre`);
    if (a.oto > 0.5) hayOto = true;
    if (a.inv > 0.5) hayInv = true;
  }
  ok(hayOto && hayInv, 'en el año del juego hay días de otoño y de invierno (la cuenta no es trivial)');
  progreso.dia = 10; progreso.horas = 12;
  ok(f().inv > 0.9, 'el día 10 de una partida en «auto» ya es invierno de entrada');
  ajustes.estacion = 'otono'; ok(f().oto === 1 && f().inv === 0, 'fija en otoño: otoño');
  ajustes.estacion = 'invierno'; ok(f().oto === 0 && f().inv === 1, 'fija en invierno: invierno');
  ajustes.estacion = 'verano'; ok(f().oto === 0 && f().inv === 0, 'fija en verano: verano');
  // al cargar el mundo se arranca en esa estación, y cada cuadro usa la misma cuenta
  tiene(main, "const e0 = ajustes.estacion === 'auto' ? estacionObjetivo() : null;", 'construir: «auto» arranca en la estación de la fecha');
  tiene(main, 'const { oto, inv } = estacionObjetivo();', 'cada cuadro: la misma cuenta');
}

// ---------------------------------------------------------------- G15: en el banco de pruebas el mouse no es tuyo
{
  tiene(main, "if (modo !== 'jugando' || mochilaAbierta || foto.activo || banco.activa) return;   // 4.0.5 (G15)", 'la rueda no cambia de ranura en el banco');
  tiene(main, "if (e.button !== 2 || modo !== 'jugando' || mochilaAbierta || foto.activo || banco.activa) return;", 'el clic derecho no usa lo que tenés en la mano en el banco');
  tiene(main, "desafio.caido || foto.activo || banco.activa) return;", 'el clic izquierdo no ataca en el banco');
  tiene(main, "if (jugador && modo === 'jugando' && !banco.activa && !jugador.bloqueado()) jugador.pedirBloqueo();", 'el clic en el lienzo no bloquea el mouse en el banco');
}

// ---------------------------------------------------------------- E8: Chela y Rubén (Rubén se quedó en el tren)
{
  const V = await import('../src/aldea-vida.js');
  const tx = (id) => V.textosVisitante({ id, lugar: 'mirador', estado: 'anden', dia: 1 });
  ok(tx('chela').corto === 'Chela' && tx('chela').nombre === 'Chela y Rubén', 'Chela y Rubén: la que te sigue es Chela (el nombre completo sigue para el cuaderno)');
  ok(tx('chela').lleva === 'Llevala' && tx('lena').lleva === 'Llevala' && tx('ana').lleva === 'Llevala', 'ellas: «Llevala»');
  ok(tx('tomas').lleva === 'Llevalo' && tx('kenji').lleva === 'Llevalo' && tx('mateo').lleva === 'Llevalo', 'ellos: «Llevalo»');
  for (const v of V.VISITANTES) ok(typeof tx(v.id).corto === 'string' && tx(v.id).corto.length > 0, `${v.nombre}: tiene nombre corto`);
  ok(V.visitanteDef('chela').plural === true && !V.VISITANTES.filter((v) => v.id !== 'chela').some((v) => v.plural), 'sólo el matrimonio va en plural');
  const g = leer('src/aldea-gente.js');
  tiene(g, '`${tx.corto} te sigue`, `${tx.lleva} hasta', 'la nota de «te sigue» usa el nombre corto y el «llevala/llevalo» que toca');
  tiene(g, '`${tx.corto} se vuelve a la estación`', 'y «se vuelve a la estación»');
  tiene(g, "${def.plural ? 'preguntan' : 'pregunta'} por", 'el aviso de que bajó concuerda');
  assert.ok(!/\$\{tx\.nombre\} (te sigue|se vuelve)/.test(g), 'no queda el nombre del matrimonio con verbo en singular');
}

// ---------------------------------------------------------------- F9: la lagartija corrida de lugar apoya en el suelo de ahí
{
  const b = leer('src/bichos.js');
  tiene(b, 'l.pos.z += Math.cos(l.rumbo) * 0.6;\n        l.pos.y = T.altura(l.pos.x, l.pos.z) + 0.35;', 'al huir, la altura sale del terreno donde queda');
}

console.log('OK 4.0.5 bajos');
