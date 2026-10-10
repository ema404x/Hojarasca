// 3.8.6 (duendes): el pase de bugs de La noche de los duendes.
//  1. La salpicadura del escupitajo y de la piedra del artillero no pasa a través de una pared.
//  2. Los refuerzos de madrugada se guardan (`refuerzoNoche`): guardar y abrir los mandaba otra vez.
//  3. Si el reloj salta la hora del aviso (una siesta, la hora de tu reloj), la noche especial se decide igual.
//  4. El Rey Duende que cae no revive si se cierra el juego en los segundos en que se viene abajo el Coihue.
// Donde se puede, el código de verdad corre en una VM con lo mínimo alrededor.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const raiz = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
// el texto de una función interna (de `function nombre(` hasta la llave que la cierra, contando llaves)
function extraer(texto, nombre) {
  const i = texto.indexOf(`function ${nombre}(`);
  assert.ok(i >= 0, `no encontré ${nombre}`);
  let n = 0, j = texto.indexOf(') {', i) + 2;
  for (; j < texto.length; j++) { if (texto[j] === '{') n++; else if (texto[j] === '}' && --n === 0) break; }
  return texto.slice(i, j + 1);
}
const des = leer('src/desafio.js');
const nave = leer('src/desafio-nave-mundo.js');
const R = await import('../src/desafio-reglas.js');
const A = await import('../src/desafio-asedio.js');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

// ---------------------------------------------------------------- 1. la salpicadura no pasa a través de una pared
{
  class V3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { return this.set(v.x, v.y, v.z); }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    length() { return Math.hypot(this.x, this.y, this.z); }
  }
  // la pared más fina como la ve obraEnPunto (de 16 cm, cuenta como de 36: ±18 cm), de 0 a 2,3 m de alto
  ok(des.includes('Math.abs(lz) <= Math.max(0.2, (P.fondo || 1) / 2) + margen'), 'obraEnPunto mide igual que esta prueba');
  const pared = (x, y, z) => (Math.abs(z) <= 0.18 && y >= 0 && y <= 2.3 ? { pared: true } : null);
  const ctxVm = { THREE: { Vector3: V3 }, alturaSuelo: () => 0, obraEnPunto: pared };
  const i0 = des.indexOf('const _salA = new THREE.Vector3()');
  ok(i0 > 0, 'la salpicadura mira las paredes');
  const tapada = vm.runInNewContext([des.slice(i0, des.indexOf('\n', i0)), extraer(des, 'hayObraEntre'), extraer(des, 'salpicaduraTapada'), 'salpicaduraTapada'].join('\n'), ctxVm);
  // el escupitajo revienta contra la pared viniendo de z negativo: el punto del impacto es una muestra del tiro
  // (de a 35 cm), así que puede quedar de 0 a 35 cm adentro de la pared
  for (const hondo of [0, 0.1, 0.2, 0.34]) {
    const q = { pos: new V3(0, 1.1, -0.18 + hondo), vel: new V3(0, -2, 15) };
    ok(tapada(q, { pos: { x: 0.3, y: 0, z: 0.6 } }), `del otro lado de la pared no te salpica (${hondo})`);
    ok(!tapada(q, { pos: { x: 0.3, y: 0, z: -0.7 } }), `del mismo lado, sí (${hondo})`);
  }
  // revienta en el suelo afuera, con vos adentro: tapado; en el suelo de tu lado: no
  ok(tapada({ pos: new V3(0.2, 0, -0.9), vel: new V3(0, -8, 3) }, { pos: { x: 0, y: 0, z: 0.6 } }), 'en el suelo de afuera no salpica adentro');
  ok(!tapada({ pos: new V3(0.2, 0, 1.4), vel: new V3(0, -8, 3) }, { pos: { x: 0, y: 0, z: 0.6 } }), 'en el suelo de adentro, sí');
  ok(des.includes('Math.abs(js.pos.y - q.pos.y) < 2.4 && !salpicaduraTapada(q, js)) herirJugador(q.dano * 0.5, q.pos);'), 'el escupitajo');
  ok(des.includes('Math.abs(js.pos.y - q.pos.y) < 2.4 && !salpicaduraTapada(q, js)) herirJugador(q.dano * 0.6, q.pos);'), 'la piedra del artillero');
  ok(des.includes('n = Math.max(1, Math.ceil(L / 0.35))'), 'el tiro avanza de a 35 cm (la cuenta de arriba)');
}

// ---------------------------------------------------------------- 2. los refuerzos de madrugada
{
  ok(!/refuerzoHecho/.test(des), 'sin la marca en memoria');
  ok(/!d\.oleadaTerminada && d\.refuerzoNoche !== d\.oleadas && d\.oleadas >= 3/.test(des), 'se miran en la partida');
  ok(/d\.refuerzoNoche = d\.oleadas;\n\s*const refuerzo = sinJefe/.test(des), 'y se anotan al mandarlos');
  ok(R.desafioNuevo().refuerzoNoche === -1, 'una partida nueva no los tuvo');
  ok(R.sanearDesafio({ refuerzoNoche: 7 }).refuerzoNoche === 7, 'se guardan');
  ok(R.sanearDesafio(JSON.parse(JSON.stringify(R.sanearDesafio({ refuerzoNoche: 12 })))).refuerzoNoche === 12, 'ida y vuelta por JSON');
  ok(R.sanearDesafio({}).refuerzoNoche === -1 && R.sanearDesafio({ refuerzoNoche: null }).refuerzoNoche === -1 && R.sanearDesafio({ refuerzoNoche: 'x' }).refuerzoNoche === -1, 'una partida vieja o rara: -1');
}

// ---------------------------------------------------------------- 3. el aviso salteado
{
  const rev = extraer(des, 'revisarHorario');
  ok(/function decidirNoche\(clave\) \{[\s\S]*?avisada = clave;[\s\S]*?d\.especial = esNocheFinal\(\) \? null/.test(des), 'la noche se decide en un solo lugar');
  ok(/avisada !== p\.dia && d\.oleadaNoche !== p\.dia\) \{\n\s*decidirNoche\(p\.dia\);/.test(rev), 'en el aviso');
  ok(/if \(d\.oleadaNoche !== noche\) \{[\s\S]{0,500}?if \(avisada !== noche && !d\.especial\) decidirNoche\(noche\);\n\s*d\.oleadaNoche = noche;/.test(rev), 'y al empezar la noche si el aviso no pasó (y no hay una ya decidida)');
  // la siesta del Desafío suma dos horas: desde las 18:30 pasa por encima de toda la hora del aviso
  const { HORA_ATAQUE } = R;
  ok(18.6 + 2 >= HORA_ATAQUE && 18.6 < HORA_ATAQUE - 1, 'una siesta a las 18:36 saltea el aviso');
  // y el azar de la especial es fijo con el código (decidirla tarde da la misma que habría anunciado el aviso)
  const M = await import('../src/meteo.js');
  const d = { semilla: 'COIHUE-4821' };
  ok(M.azarEspecial(d, null, 7) === M.azarEspecial(d, null, 7), 'mismo azar con el mismo código');
}

// ---------------------------------------------------------------- 4. el Rey que cae
{
  const a = A.asedioNuevo([{ id: 'base', x: 1, z: 2 }], { x: 3, z: 4 });
  ok(!('reyCaido' in A.sanearAsedio(a)), 'sin caer, nada');
  ok(A.sanearAsedio({ ...a, reyCaido: true }).reyCaido === true, 'el Rey caído se guarda');
  ok(!('reyCaido' in A.sanearAsedio({ ...a, reyCaido: true, ganado: true })), 'con el asedio ganado ya no hace falta');
  ok(R.sanearDesafio({ asedio: { ...a, reyCaido: true } }).asedio.reyCaido === true, 'pasa por el saneado del Desafío');
  const fin = extraer(nave, 'empezarFinal');
  ok(/if \(asedio\) asedio\.reyCaido = true;\n\s*api\.guardar\(\);/.test(fin), 'se anota antes de guardar, al caer');
  ok(/if \(D\(\)\.asedio\?\.reyCaido && !D\(\)\.asedio\.ganado && !D\(\)\.victoria\) ganarAsedio\(D\(\)\.asedio\);\n\s*if \(D\(\)\.asedio\?\.ganado && !D\(\)\.victoria\) vencer\(\{ nave: true \}\);/.test(des), 'al abrir, el asedio se gana y llega la victoria');
  ok(/^import \{ ganarAsedio \} from '\.\/desafio-asedio\.js';$/m.test(des), 'importado en una línea (armar.mjs)');
  const g = A.sanearAsedio({ ...a, reyCaido: true });
  A.ganarAsedio(g);
  ok(g.ganado && !A.asedioActivo(g), 'ganarAsedio lo cierra');
}

console.log(`verificar-3-8-6-duendes: ${n} comprobaciones OK`);
