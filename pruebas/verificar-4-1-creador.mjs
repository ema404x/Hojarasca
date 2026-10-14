// 4.1 (borrador, F1): el creador de personaje de Bruno Castellanos (src/creador-catalogo.js y src/creador-personaje.js). Módulos puros: se prueban en Node.
//  · son exactamente DIEZ personalizaciones (cinco de aspecto y cinco de carácter) y 32 opciones de carácter, con ids sin repetir y sin ñ;
//  · `sanearGenoma` devuelve siempre un genoma válido (con basura, vacío o a medias), nunca deja pasar ids inventados y siempre trae dos gustos distintos;
//  · el aspecto sale en la forma que espera el motor (la de `aspectoGente`), masculino y de 27 años; cada opción de aspecto se ve distinta;
//  · el balance: en personalidad, oficio y hobby el pro y el contra pesan lo mismo y caen en sistemas distintos (los dos de sabor o los dos con efecto);
//    virtud sólo tiene pro y defecto sólo contra, y todas llevan efecto (ninguna combinación regala un pro sin su contra);
//  · el tope: recorriendo TODAS las combinaciones de rasgos, ningún sistema pasa de su tope, para arriba ni para abajo;
//  · los gustos y la afinidad con los vecinos (el mate vale la mitad) y el afecto con el tope;
//  · la precarga desde «Tu personaje» (partidas viejas) y los tintes que piden anotaciones: al crear, sólo los que no piden nada.
// El recuento de las combinaciones se imprime: sirve para decidir el balance con números.
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const K = await import(pathToFileURL(path.join(raiz, 'src', 'creador-catalogo.js')).href);
const C = await import(pathToFileURL(path.join(raiz, 'src', 'creador-personaje.js')).href);
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };

// ---------------------------------------------------------------- 1. las diez personalizaciones
ok(K.PERSONALIZACIONES.length === 10, 'son diez personalizaciones antes de empezar');
ok(new Set(K.PERSONALIZACIONES.map((p) => p.id)).size === 10, 'sin personalizaciones repetidas');
ok(K.PERSONALIZACIONES.filter((p) => p.pantalla === 'aspecto').length === 5 && K.PERSONALIZACIONES.filter((p) => p.pantalla === 'historia').length === 5, 'cinco de aspecto y cinco de carácter, en dos pantallas');
const carac = [K.PERSONALIDADES, K.OFICIOS, K.GUSTOS, K.HOBBIES, K.VIRTUDES, K.DEFECTOS];
ok(carac.reduce((s, l) => s + l.length, 0) === 32, 'son 32 opciones de carácter (5 + 6 + 6 + 5 + 5 + 5)');
ok([5, 6, 6, 5, 5, 5].every((n, i) => carac[i].length === n), 'la cantidad de opciones de cada rasgo de carácter');
const campos = K.PERSONALIZACIONES.flatMap((p) => p.campos.map((c) => c.campo));
ok(new Set(campos).size === campos.length, 'ningún campo del genoma está en dos personalizaciones');
for (const p of K.PERSONALIZACIONES) for (const c of p.campos) {
  ok(c.lista.length >= 2, `${c.campo}: al menos dos opciones`);
  ok(new Set(c.lista.map((x) => x.id)).size === c.lista.length, `${c.campo}: ids sin repetir`);
  ok(c.lista.every((x) => typeof x.nombre === 'string' && x.nombre && !/ñ/.test(x.id)), `${c.campo}: nombres y ids válidos (sin ñ en los ids)`);
}
ok(C.PROTAGONISTA.nombre === 'Bruno' && C.PROTAGONISTA.apellido === 'Castellanos' && C.PROTAGONISTA.edad === 27, 'el protagonista: Bruno Castellanos, 27 años');
const def = C.genomaDefecto();
ok(Object.keys(def).sort().join() === ['version', ...campos].sort().join(), 'el genoma por defecto trae todos los campos y la versión, y nada más');

// ---------------------------------------------------------------- 2. sanear
ok(JSON.stringify(C.sanearGenoma(def)) === JSON.stringify(def), 'el genoma por defecto ya está saneado');
const validos = (s) => K.PERSONALIZACIONES.every((p) => p.campos.every((c) => (c.campo === 'gustos'
  ? Array.isArray(s.gustos) && s.gustos.length === 2 && s.gustos[0] !== s.gustos[1] && s.gustos.every((id) => c.lista.some((x) => x.id === id))
  : c.lista.some((x) => x.id === s[c.campo]))));
for (const raro of [undefined, null, 5, 'hola', [], {}, { piel: 'verde' }, { cara: {}, ojos: null }, { gustos: 'mate' }, { gustos: ['mate', 'mate'] }, { gustos: ['xx', 'yy', 'zz'] }, { gustos: [1, 2] }, { oficio: ['contador'] }, JSON.parse('{"__proto__": {"piel": "morena"}}')]) {
  const s = C.sanearGenoma(raro);
  ok(validos(s), `con ${JSON.stringify(raro)}: todas las elecciones son válidas`);
  ok(s.version === C.VERSION_GENOMA, 'lleva la versión');
}
ok(C.sanearGenoma({ piel: 'morena', sexo: 'f', nombre: 'otro' }).piel === 'morena', 'lo válido se conserva');
ok(!('sexo' in C.sanearGenoma({ sexo: 'f' })) && !('nombre' in C.sanearGenoma({ nombre: 'otro' })), 'el sexo y el nombre no se eligen: no se guardan');
ok(C.sanearGenoma({ gustos: ['asado'] }).gustos.includes('asado') && C.sanearGenoma({ gustos: ['asado'] }).gustos.length === 2, 'un solo gusto se completa hasta dos');
ok(C.sanearGenoma({ gustos: ['libros', 'asado', 'trenes'] }).gustos.join() === 'libros,asado', 'de tres gustos quedan los dos primeros');

// ---------------------------------------------------------------- 3. el aspecto
const A = C.aspectoDeGenoma(def);
ok(A.conocido === true && A.R.mujer === false && A.edad === 27, 'el aspecto es masculino y de 27 años');
for (const k of ['colores', 'R', 'cuerpo', 'cara', 'guardas']) ok(A[k] && typeof A[k] === 'object', `el aspecto trae ${k}`);
ok(/^#[0-9a-f]{6}$/i.test(A.colores.piel) && /^#[0-9a-f]{6}$/i.test(A.colores.pelo) && /^#[0-9a-f]{6}$/i.test(A.cara.iris), 'los colores son hex válidos');
const huella = (g) => JSON.stringify(C.aspectoDeGenoma(g));
const deAspecto = ['cara', 'ojos', 'piel', 'pelo', 'peinado', 'barba', 'contextura', 'estatura', 'campera', 'accesorio'];
for (const campo of deAspecto) {
  const lista = K.PERSONALIZACIONES.flatMap((p) => p.campos).find((c) => c.campo === campo).lista;
  const vistas = new Set(lista.map((x) => huella({ ...def, [campo]: x.id })));
  ok(vistas.size === lista.length, `${campo}: cada opción se ve distinta (${vistas.size} de ${lista.length})`);
}
for (const campo of ['personalidad', 'oficio', 'hobby', 'virtud', 'defecto']) {
  const lista = K.PERSONALIZACIONES.flatMap((p) => p.campos).find((c) => c.campo === campo).lista;
  ok(new Set(lista.map((x) => huella({ ...def, [campo]: x.id }))).size === 1, `${campo}: el carácter no cambia la figura (sólo el aspecto la cambia)`);
}
const ve = (g) => C.aspectoDeGenoma({ ...def, ...g });
ok(!ve({ accesorio: 'ninguno' }).guardas.cuello && !ve({ accesorio: 'gorro' }).guardas.cuello && !!ve({ accesorio: 'bufanda' }).guardas.cuello, 'la guarda del cuello sólo va con la bufanda');
ok(ve({ accesorio: 'anteojos' }).colores.anteojos === true && !ve({ accesorio: 'gorro' }).colores.anteojos, 'los anteojos sólo con ese accesorio');
ok(!ve({ barba: 'ninguna' }).colores.barba && ve({ barba: 'barba' }).colores.barba === ve({ barba: 'barba' }).colores.pelo, 'la barba es del color del pelo');
ok(ve({ barba: 'bigote' }).R.bigote === true && !ve({ barba: 'barba' }).R.bigote, 'el bigote es sólo bigote (sin barba)');
ok(ve({ pelo: 'canoso' }).R.canas > 0 && ve({ pelo: 'negro' }).R.canas === 0, 'el pelo canoso trae canas');
ok(ve({ estatura: 'alta' }).cuerpo.alto > ve({ estatura: 'baja' }).cuerpo.alto, 'la estatura alta es más alta que la baja');
ok(ve({ contextura: 'robusta' }).cuerpo.ancho > ve({ contextura: 'delgada' }).cuerpo.ancho, 'la contextura robusta es más ancha que la delgada');
ok(K.CARAS.length <= 6 && new Set(K.CARAS.map((c) => JSON.stringify(c.cara))).size === K.CARAS.length, 'pocas caras base y todas distintas (cada una es un molde de cráneo)');
for (const c of K.CARAS) for (const [k, v] of Object.entries(c.cara)) ok(Number.isFinite(v) && v > 0 && v < 2, `cara ${c.id}.${k} razonable`);

// ---------------------------------------------------------------- 4. el balance de cada opción
const peso = (ef) => (ef ? Math.abs(ef.pasos) : 0);
for (const [nombre, lista] of [['personalidad', K.PERSONALIDADES], ['oficio', K.OFICIOS], ['hobby', K.HOBBIES]]) for (const o of lista) {
  ok(!!o.pro === !!o.contra, `${nombre} ${o.id}: o los dos con efecto o los dos de sabor`);
  ok(peso(o.pro) === peso(o.contra), `${nombre} ${o.id}: el pro y el contra pesan lo mismo`);
  if (o.pro) {
    ok(o.pro.pasos > 0 && o.contra.pasos < 0, `${nombre} ${o.id}: el pro suma y el contra resta`);
    ok(o.pro.sistema !== o.contra.sistema, `${nombre} ${o.id}: el pro y el contra caen en sistemas distintos (si no, se anulan)`);
  }
}
for (const o of K.VIRTUDES) ok(o.pro && o.pro.pasos > 0 && !('contra' in o) && K.SISTEMAS.includes(o.pro.sistema), `virtud ${o.id}: sólo pro, con efecto`);
for (const o of K.DEFECTOS) ok(o.contra && o.contra.pasos < 0 && !('pro' in o) && K.SISTEMAS.includes(o.contra.sistema), `defecto ${o.id}: sólo contra, con efecto`);
ok(K.VIRTUDES.every((v) => peso(v.pro) === peso(K.DEFECTOS[0].contra)) && K.DEFECTOS.every((d) => peso(d.contra) === peso(K.VIRTUDES[0].pro)), 'toda virtud pesa lo mismo que todo defecto');
for (const o of K.GUSTOS) ok((o.afinidad === 0.5 || o.afinidad === 1) && (o.contra === null || o.contra.pasos < 0), `gusto ${o.id}: afinidad y contra válidos`);
ok(K.GUSTOS.find((g) => g.id === 'mate').afinidad === 0.5, 'el mate vale la mitad: lo comparte casi todo el pueblo');
for (const lista of carac) for (const o of lista) for (const ef of [o.pro, o.contra]) if (ef) ok(K.SISTEMAS.includes(ef.sistema) && Number.isInteger(ef.pasos) && ef.pasos !== 0, `${o.id}: efecto con sistema válido y pasos enteros`);
// el reparto de pros y contras por sistema: parejo (a lo sumo una diferencia)
const reparto = Object.fromEntries(K.SISTEMAS.map((s) => [s, { pros: 0, contras: 0 }]));
for (const lista of carac) for (const o of lista) { if (o.pro) reparto[o.pro.sistema].pros++; if (o.contra) reparto[o.contra.sistema].contras++; }
for (const s of K.SISTEMAS) ok(Math.abs(reparto[s].pros - reparto[s].contras) <= 1, `${s}: ${reparto[s].pros} pros y ${reparto[s].contras} contras (a lo sumo una de diferencia)`);

// ---------------------------------------------------------------- 5. el tope, con TODAS las combinaciones
const sumas = Object.fromEntries(K.SISTEMAS.map((s) => [s, 0])), extremos = Object.fromEntries(K.SISTEMAS.map((s) => [s, [Infinity, -Infinity]]));
let combos = 0, alTope = 0, mejorNeto = -Infinity, peorNeto = Infinity, conGananciaNeta = 0;
const pares = []; for (let i = 0; i < K.GUSTOS.length; i++) for (let j = i + 1; j < K.GUSTOS.length; j++) pares.push([K.GUSTOS[i].id, K.GUSTOS[j].id]);
for (const pe of K.PERSONALIDADES) for (const of_ of K.OFICIOS) for (const ho of K.HOBBIES) for (const vi of K.VIRTUDES) for (const df of K.DEFECTOS) for (const gu of pares) {
  const g = { ...def, personalidad: pe.id, oficio: of_.id, hobby: ho.id, virtud: vi.id, defecto: df.id, gustos: gu };
  const b = C.efectosBrutos(g), a = C.efectosAplicados(g);
  combos++;
  let neto = 0;
  for (const s of K.SISTEMAS) {
    assert.ok(Math.abs(a[s]) <= K.TOPES[s], 'tope');   // ningún sistema pasa del tope (la cuenta se hace una vez, abajo)
    sumas[s] += b[s]; neto += a[s];
    extremos[s][0] = Math.min(extremos[s][0], b[s]); extremos[s][1] = Math.max(extremos[s][1], b[s]);
    assert.ok(a[s] === Math.max(-K.TOPES[s], Math.min(K.TOPES[s], b[s])), 'lo aplicado es lo bruto recortado');
  }
  if (C.sistemasAlTope(g).length) alTope++;
  mejorNeto = Math.max(mejorNeto, neto); peorNeto = Math.min(peorNeto, neto);
  if (neto > 0) conGananciaNeta++;
}
ok(true, 'en todas las combinaciones ningún sistema pasa del tope y lo aplicado es lo bruto recortado');
ok(combos === 5 * 6 * 5 * 5 * 5 * 15, `se recorrieron todas las combinaciones (${combos})`);
const medias = Object.fromEntries(K.SISTEMAS.map((s) => [s, sumas[s] / combos]));
for (const s of K.SISTEMAS) ok(Math.abs(medias[s]) <= 1, `${s}: el promedio sobre todas las combinaciones está cerca de cero (${medias[s].toFixed(2)} pasos)`);
// Decidido el 14-10: se deja el tope simétrico, aceptando que apilar contras en un solo sistema sale algo más barato. Esto lo deja acotado:
// si un cambio del catálogo empeora el número, la prueba avisa en vez de pasar en silencio. (Hoy: 9,9 % de las combinaciones, hasta +4 pasos.)
ok(conGananciaNeta / combos <= 0.12, `las combinaciones con ganancia neta no pasan del 12 % (hoy ${(100 * conGananciaNeta / combos).toFixed(1)} %)`);
ok(mejorNeto <= 4 && peorNeto >= -4, `la suma aplicada entre los cuatro sistemas queda entre −4 y +4 pasos (hoy de ${peorNeto} a ${mejorNeto})`);
console.log(`combinaciones: ${combos}`);
console.log('promedio bruto por sistema (pasos):', Object.fromEntries(K.SISTEMAS.map((s) => [s, +medias[s].toFixed(2)])));
console.log('extremos brutos por sistema [mín, máx]:', JSON.stringify(extremos));
console.log(`combinaciones que llegan al tope en algún sistema: ${alTope} (${(100 * alTope / combos).toFixed(1)} %)`);
console.log(`suma aplicada entre los cuatro sistemas: de ${peorNeto} a ${mejorNeto} pasos; con ganancia neta (>0): ${conGananciaNeta} (${(100 * conGananciaNeta / combos).toFixed(1)} %)`);

// ---------------------------------------------------------------- 6. los gustos y los vecinos
const ids = (l) => l.map((x) => x.id);
for (const [v, gs] of Object.entries(K.GUSTOS_DE_VECINOS)) {
  ok(gs.length >= 1 && gs.length <= 2 && new Set(gs).size === gs.length && gs.every((g) => ids(K.GUSTOS).includes(g)), `vecino ${v}: uno o dos gustos válidos y distintos`);
}
ok(Object.keys(K.GUSTOS_DE_VECINOS).length === 37, 'la tabla trae los 36 vecinos y la bailarina');
for (const g of ids(K.GUSTOS)) ok(Object.values(K.GUSTOS_DE_VECINOS).filter((gs) => gs.includes(g)).length >= 3, `el gusto ${g} lo comparte al menos tres vecinos (si no, no sirve elegirlo)`);
ok(Object.values(K.GUSTOS_DE_VECINOS).filter((gs) => gs.includes('mate')).length < 31, 'en la tabla el mate no llega a todos los vecinos');
const gb = { ...def, gustos: ['mate', 'trenes'] };
ok(C.afinidadConVecino(gb, 'jefe') === 1 && C.afinidadConVecino(gb, 'guarda') === 1.5 && C.afinidadConVecino(gb, 'maestra') === 0.5 && C.afinidadConVecino(gb, 'pintora') === 0, 'la afinidad suma los gustos compartidos (el mate, medio paso)');
ok(C.afinidadConVecino(gb, 'inventado') === 0 && C.afinidadConVecino(gb, '__proto__') === 0, 'un vecino que no existe no da afinidad');
const gs = { ...def, personalidad: 'sociable', oficio: 'docente', virtud: 'simpatico', gustos: ['trenes', 'asado'] };   // +2 +2 +2 de afecto y afinidad con el jefe
ok(C.efectosBrutos(gs).afecto === 6 && C.efectosAplicados(gs).afecto === 4, 'el afecto bruto pasa de 4 y el tope lo recorta');
ok(C.afectoConVecino(gs, 'jefe') === 4 && C.afectoConVecino(gs, 'pintora') === 4, 'el afecto con un vecino también tiene tope');
ok(C.sistemasAlTope(gs).includes('afecto') && !C.sistemasAlTope(def).includes('afecto'), 'se sabe qué sistemas están al tope (para avisar en la ficha)');

// ---------------------------------------------------------------- 7. la ficha y las partidas viejas
const R = C.resumenDeBruno(def);
ok(R.nombre === 'Bruno Castellanos' && R.edad === 27 && Array.isArray(R.pros) && Array.isArray(R.contras) && R.aplicados && Array.isArray(R.alTope), 'la ficha trae nombre, edad, pros, contras, efectos aplicados y sistemas al tope');
ok(R.pros.every((x) => x.lado === 'pro') && R.contras.every((x) => x.lado === 'contra'), 'los pros son pros y los contras son contras');
ok(R.pros.length + R.contras.length === 3 * 2 + 2 + 2, 'la ficha cuenta personalidad, oficio y hobby (pro y contra), los dos gustos (contra), la virtud y el defecto');
const viejo = { piel: 'morena', pelo: 'rubio', peinado: 'largo', contextura: 'robusta', campera: 'notro', gorro: true, bufanda: true, poncho: true, guantes: true, botas: 'goma' };
const pre = C.genomaDesdePersonajeViejo(viejo);
ok(pre.piel === 'morena' && pre.pelo === 'rubio' && pre.peinado === 'melena' && pre.contextura === 'robusta' && pre.campera === 'notro' && pre.accesorio === 'gorro', 'la precarga conserva piel, pelo, contextura y campera, y pasa el peinado y el gorro');
ok(C.genomaDesdePersonajeViejo({ bufanda: true }).accesorio === 'bufanda' && C.genomaDesdePersonajeViejo({}).accesorio === 'ninguno', 'sin gorro pero con bufanda, la bufanda');
for (const [v, n] of [['corto', 'corto'], ['largo', 'melena'], ['trenza', 'coleta'], ['rodete', 'rodete'], ['rapado', 'corto']]) ok(C.genomaDesdePersonajeViejo({ peinado: v }).peinado === n, `el peinado viejo ${v} pasa a ${n}`);
for (const raro of [undefined, null, 7, 'x', [], { piel: 'x', campera: 'y', peinado: 'z' }]) ok(validos(C.genomaDesdePersonajeViejo(raro)), `la precarga con ${JSON.stringify(raro)} siempre da un genoma válido`);
ok(JSON.stringify(C.genomaDesdePersonajeViejo({})) === JSON.stringify(def), 'una partida vieja sin nada elegido arranca con el Bruno por defecto');
ok(K.LANAS.every((l) => ['crudo', 'gris', 'marron', 'negro', 'ocre', 'musgo', 'notro', 'calafate', 'maqui'].includes(l.id)), 'los colores de lana conservan los ids de «Tu personaje»');
const alCrear = C.opcionesAlCrear('campera').map((l) => l.id);
ok(alCrear.join() === 'crudo,gris,marron,negro,ocre,musgo', 'al crear a Bruno sólo están los tintes que no piden anotación');
ok(!alCrear.includes('notro') && !alCrear.includes('maqui') && !alCrear.includes('calafate') && C.opcionesAlCrear('piel').length === 6 && C.opcionesAlCrear('inexistente').length === 0, 'los tintes que piden anotación no se ofrecen al crear; las demás listas sí enteras');

console.log(`OK 4.1 creador de Bruno · ${pasos} verificaciones · diez personalizaciones, saneo, aspecto, balance, tope en todas las combinaciones, gustos y vecinos, ficha y precarga`);
