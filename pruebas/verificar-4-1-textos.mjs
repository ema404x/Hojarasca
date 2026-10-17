// 4.1 (F4): los textos de Bruno (src/creador-textos.js): propuestos por Claude, a revisar por el usuario. Se prueba que:
//  · están los 32 rasgos del catálogo, cada uno con su frase, su pro y su contra donde corresponde (virtud: frase y pro; defecto: frase y contra);
//  · respetan los largos máximos (frase 15 palabras; pro y contra 10 cada uno);
//  · no quedan «…», «...» ni TODO, ni números, ni tuteo, ni mayúsculas gritadas;
//  · cada pro y cada contra DICE LO QUE HACE EL JUEGO (el sistema y el sentido del efecto del catálogo); los de sabor no prometen ningún efecto;
//  · el prólogo tiene 5 pantallas, en segunda persona y con los textos que eligió el usuario;
//  · las 26 líneas de asado y lluvia de los vecinos (8 y 18) son exactamente las de la tabla de gustos, y salen en «¿Cómo andás?» sólo si Bruno comparte el gusto;
//  · todo el texto vive en creador-textos.js (la pantalla, la ficha y el prólogo no traen textos propios de rasgos).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const T = await imp('creador-textos.js'), K = await imp('creador-catalogo.js'), V = await imp('vecindad.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const palabras = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const NUMERO = /[0-9%]/;
const PROHIBIDO = /…|\.\.\.|\bTODO\b|XXX|[Ll]orem/;
const TUTEO = /\b(tú|tienes|puedes|quieres|eres|estás|sabes|haces|vienes|mira tú|contigo|tu casa tienes)\b/i;

const LISTAS = { personalidad: K.PERSONALIDADES, oficio: K.OFICIOS, gustos: K.GUSTOS, hobby: K.HOBBIES, virtud: K.VIRTUDES, defecto: K.DEFECTOS };
const CONTEO = { personalidad: 5, oficio: 6, gustos: 6, hobby: 5, virtud: 5, defecto: 5 };

// ---------------------------------------------------------------- 1. los 32 rasgos
ok(Object.keys(T.TARJETAS).join() === Object.keys(LISTAS).join(), 'las seis clases de carácter');
let total = 0;
for (const [clase, lista] of Object.entries(LISTAS)) {
  ok(lista.length === CONTEO[clase], `${clase}: ${CONTEO[clase]} opciones en el catálogo`);
  ok(Object.keys(T.TARJETAS[clase]).sort().join() === lista.map((o) => o.id).sort().join(), `${clase}: las tarjetas son exactamente las opciones del catálogo`);
  for (const o of lista) {
    total++;
    const t = T.TARJETAS[clase][o.id];
    ok(t && typeof t.frase === 'string' && t.frase.length > 8, `${clase}/${o.id}: tiene frase`);
    ok(palabras(t.frase) <= T.LIMITES_PALABRAS.frase, `${clase}/${o.id}: la frase tiene ${palabras(t.frase)} palabras (máx. ${T.LIMITES_PALABRAS.frase})`);
    const lleva = (lado) => typeof t[lado] === 'string' && t[lado].length > 5;
    if (clase === 'virtud') ok(lleva('pro') && t.contra === undefined, `${clase}/${o.id}: sólo frase y pro`);
    else if (clase === 'defecto') ok(lleva('contra') && t.pro === undefined, `${clase}/${o.id}: sólo frase y contra`);
    else ok(lleva('pro') && lleva('contra'), `${clase}/${o.id}: frase, pro y contra`);
    for (const lado of ['pro', 'contra']) if (t[lado] !== undefined) ok(palabras(t[lado]) <= T.LIMITES_PALABRAS[lado], `${clase}/${o.id}: el ${lado} tiene ${palabras(t[lado])} palabras (máx. ${T.LIMITES_PALABRAS[lado]})`);
    for (const [campo, texto] of Object.entries(t)) {
      ok(!PROHIBIDO.test(texto), `${clase}/${o.id}/${campo}: sin «…» ni TODO`);
      ok(!NUMERO.test(texto), `${clase}/${o.id}/${campo}: sin números ni porcentajes`);
      ok(!TUTEO.test(texto), `${clase}/${o.id}/${campo}: sin tuteo`);
      ok(/^[A-ZÁÉÍÓÚ¡¿]/.test(texto) && /[.!?]$/.test(texto), `${clase}/${o.id}/${campo}: empieza con mayúscula y termina con punto`);
      ok(texto === texto.trim() && !texto.includes('  '), `${clase}/${o.id}/${campo}: sin espacios de más`);
    }
  }
}
ok(total === 32, 'son 32 rasgos');
ok(Object.keys(T.SABOR).every((c) => Object.keys(T.SABOR[c]).every((id) => LISTAS[c].some((o) => o.id === id))), 'la lista de rasgos de sabor sólo nombra rasgos que existen');
// la marca «propuestos por Claude, a revisar por el usuario» está en el archivo
const fuenteTextos = leer('src/creador-textos.js');
ok(/PROPUESTOS POR CLAUDE, A REVISAR POR EL USUARIO/.test(fuenteTextos), 'el archivo de textos dice que son propuestos por Claude, a revisar por el usuario');
ok(!/\bTODO\b/.test(fuenteTextos) && !/provisori/i.test(fuenteTextos.replace(/propuestos por Claude/g, '')), 'y ya no quedan TODO ni «provisorio»');

// ---------------------------------------------------------------- 2. el pro y el contra dicen lo que hace el juego
// Cada sistema, con el sentido de su efecto: la frase del texto tiene que ser la que corresponde.
const DICE = {
  abrigo: { 1: /abriga un poco más/, '-1': /abriga un poco menos/ },
  afecto: { 1: /(suma un poco más|suman más|suma apenas un poco)/, '-1': /(suma menos|suman menos|suma un poco menos)/ },
  pesca: { 1: /pican antes/, '-1': /tardan más en picar/ },
  cuaderno: { 1: /anota antes el cielo/, '-1': /tarda (más )?en anotar/i },
};
// lo que el texto de un rasgo de SABOR no puede decir (nada que el juego haga)
const PROMETE = /(abriga|pican|picar|suma|suman|anota|anotar|anotarlo|cielo|peces|vecinos|frío)/i;
let conEfecto = 0, deSabor = 0;
const efectoDe = (clase, o, lado) => (clase === 'gustos' ? (lado === 'contra' ? o.contra : { sistema: 'afecto', pasos: 1 }) : lado === 'pro' ? o.pro : o.contra);
for (const [clase, lista] of Object.entries(LISTAS)) {
  for (const o of lista) {
    for (const lado of ['pro', 'contra']) {
      const texto = T.TARJETAS[clase][o.id][lado];
      if (texto === undefined) { ok(clase === 'virtud' ? lado === 'contra' : lado === 'pro', `${clase}/${o.id}: sin ${lado} porque no corresponde`); continue; }
      const ef = efectoDe(clase, o, lado);
      const esSabor = !!T.SABOR[clase]?.[o.id]?.includes(lado);
      if (ef === null) {
        deSabor++;
        ok(esSabor, `${clase}/${o.id}/${lado}: el catálogo lo da de sabor y está en la lista SABOR`);
        ok(!PROMETE.test(texto), `${clase}/${o.id}/${lado}: el texto de sabor no promete ningún efecto («${texto}»)`);
      } else {
        conEfecto++;
        ok(!esSabor, `${clase}/${o.id}/${lado}: tiene efecto en el catálogo y no está en SABOR`);
        const signo = clase === 'gustos' && lado === 'pro' ? 1 : Math.sign(ef.pasos);
        ok(DICE[ef.sistema][signo].test(texto), `${clase}/${o.id}/${lado}: dice lo que hace el juego (${ef.sistema} ${signo > 0 ? 'mejora' : 'empeora'}): «${texto}»`);
        for (const [s, d] of Object.entries(DICE)) if (s !== ef.sistema) for (const sg of ['1', '-1']) ok(!d[sg].test(texto), `${clase}/${o.id}/${lado}: no nombra otro sistema (${s})`);
        ok(!DICE[ef.sistema][signo === 1 ? '-1' : '1'].test(texto), `${clase}/${o.id}/${lado}: ni dice lo contrario`);
      }
    }
  }
}
ok(conEfecto > 40 && deSabor >= 10, `quedaron ${conEfecto} textos con efecto y ${deSabor} de sabor`);
// la ficha del cuaderno y la pantalla muestran estos mismos textos
const def = (await imp('creador-personaje.js')).genomaDefecto();
const L = T.lineasDeBruno({ ...def, personalidad: 'tranquilo', gustos: ['lluvia', 'asado'] });
ok(L.pros.includes('Tranquilo: ' + T.TARJETAS.personalidad.tranquilo.pro) && L.contras.includes('Lluvia: ' + T.TARJETAS.gustos.lluvia.contra), 'lineasDeBruno trae «Nombre: texto» de cada rasgo');
ok(L.pros.filter((l) => l.startsWith('Lluvia:') || l.startsWith('Asado:')).length === 2, 'cada gusto elegido trae su pro (la afinidad con los vecinos)');
ok(L.pros.length === 1 + 1 + 1 + 1 + 2 && L.contras.length === 1 + 1 + 1 + 1 + 2, 'cinco clases con pro y contra más dos gustos: ' + L.pros.length + ' pros y ' + L.contras.length + ' contras');
const pantalla = leer('src/creador-pantalla.js'), ficha = leer('src/creador-ficha.js');
ok(pantalla.includes('fraseDe(campo, id)') && pantalla.includes('lineasDeBruno(genoma)'), 'la pantalla de creación lee las frases, los pros y los contras de creador-textos.js');
ok(!/Pesca|pican|abriga|Tranquilo|Friolero/.test(pantalla.replace(/ETIQUETA = \{[^}]*\}/, '')) && !/pican|abriga/.test(ficha), 'y no repite textos de rasgos');

// ---------------------------------------------------------------- 3. el prólogo
ok(Array.isArray(T.PROLOGO) && T.PROLOGO.length === 5, 'el prólogo tiene 5 pantallas');
ok(T.PROLOGO.map((p) => p.titulo).join() === 'La ciudad,La decisión,El viaje,La llegada,El primer silencio', 'con los cinco títulos del plan');
for (const [i, p] of T.PROLOGO.entries()) {
  ok(typeof p.texto === 'string' && palabras(p.texto) >= 30 && palabras(p.texto) <= 60, `prólogo ${i + 1}: ${palabras(p.texto)} palabras (de 30 a 60)`);
  ok(!PROHIBIDO.test(p.texto) && !PROHIBIDO.test(p.titulo) && !TUTEO.test(p.texto), `prólogo ${i + 1}: sin «…», TODO ni tuteo`);
}
ok(T.PROLOGO[0].texto.startsWith('Sos Bruno Castellanos.'), 'abre en segunda persona: «Sos Bruno Castellanos»');
ok(T.PROLOGO[4].texto.endsWith('Mañana empieza todo.'), 'y cierra con «Mañana empieza todo»');
ok(T.PROLOGO.every((p) => /\b(Sos|te|tu|tuyo|dejás|escuchabas|creés|querés|dormís)\b/.test(p.texto)), 'cada pantalla le habla a Bruno en segunda persona, con voseo');
ok(Object.values(T.BOTONES_PROLOGO).every((b) => typeof b === 'string' && b.length > 3 && !PROHIBIDO.test(b)), 'los botones del prólogo tienen texto');

// ---------------------------------------------------------------- 4. las 26 líneas de los vecinos
const gustosDe = (g) => Object.entries(K.GUSTOS_DE_VECINOS).filter(([, l]) => l.includes(g)).map(([k]) => k).sort();
ok(gustosDe('asado').length === 8 && gustosDe('lluvia').length === 18, 'la tabla de gustos tiene 8 vecinos de asado y 18 de lluvia');
for (const g of ['asado', 'lluvia']) {
  ok(Object.keys(T.LINEAS_GUSTO[g]).sort().join() === gustosDe(g).join(), `${g}: una línea para cada vecino que comparte el gusto`);
  for (const [k, linea] of Object.entries(T.LINEAS_GUSTO[g])) {
    ok(linea.length >= 40 && linea.length <= 150, `${g}/${k}: largo razonable para un renglón (${linea.length})`);
    ok(!PROHIBIDO.test(linea) && !TUTEO.test(linea) && !NUMERO.test(linea), `${g}/${k}: sin «…», TODO, tuteo ni números`);
    ok(/[.?!]$/.test(linea), `${g}/${k}: termina con punto`);
    ok(g === 'asado' ? /asado|brasa|fuego|parrilla/i.test(linea) : /lluvia|llueve|llover|techo|charcos/i.test(linea), `${g}/${k}: habla del gusto`);
    ok(!/\b(Dios|bendic|rez[oa]|iglesia|plata|pesos|cobr|vend)/i.test(linea.replace('plata.', '').replace('de plata', '')), `${g}/${k}: sin nada religioso ni de economía`);
  }
}
ok(Object.values(T.LINEAS_GUSTO).flatMap((o) => Object.keys(o)).length === 26, 'en total son 26 líneas');
ok(new Set(Object.values(T.LINEAS_GUSTO).flatMap((o) => Object.values(o))).size === 26, 'y las 26 son distintas');
// la función pura
ok(T.lineaDeGustoCompartido('jefe', ['asado', 'mate']) === T.LINEAS_GUSTO.asado.jefe && T.lineaDeGustoCompartido('abuela', ['lluvia', 'libros']) === T.LINEAS_GUSTO.lluvia.abuela, 'lineaDeGustoCompartido devuelve la línea del gusto compartido');
ok(T.lineaDeGustoCompartido('jefe', ['lluvia', 'libros']) === null && T.lineaDeGustoCompartido('maestra', ['asado', 'lluvia']) === null, 'y null si el vecino no comparte ese gusto');
ok(T.lineaDeGustoCompartido('jefe', null) === null && T.lineaDeGustoCompartido('jefe', 'asado') === null && T.lineaDeGustoCompartido('nadie', ['asado']) === null && T.lineaDeGustoCompartido('toString', ['asado']) === null, 'con datos raros no se rompe');
// en la charla real de la vecindad
const comoAndas = (k) => V.temasDeCharla(k, {}, { hora: 12, clima: 'despejado' }).find((t) => t.id === 'como-andas').renglones;
V.fijarGustosDeBruno(null);
for (const k of V.PERSONAS_VECINDAD) ok(comoAndas(k).length === 2, `sin enganche, ${k} dice lo de siempre`);
V.fijarGustosDeBruno(() => []);
for (const k of V.PERSONAS_VECINDAD) ok(comoAndas(k).length === 2, `con Bruno sin gustos compartidos (o sin crear), ${k} dice lo de siempre`);
let dichas = 0;
for (const g of ['asado', 'lluvia']) {
  V.fijarGustosDeBruno(() => [g, 'mate']);
  for (const k of V.PERSONAS_VECINDAD) {
    const r = comoAndas(k);
    if (Object.hasOwn(T.LINEAS_GUSTO[g], k)) { ok(r.length === 3 && r[2] === T.LINEAS_GUSTO[g][k], `${k} dice su línea de ${g}`); dichas++; } else ok(r.length === 2, `${k} no dice nada de ${g}`);
  }
}
ok(dichas === 26, 'las 26 líneas salen en la charla real');
V.fijarGustosDeBruno(() => { throw new Error('no se llama sin vecino'); });
ok(V.temasDeCharla('no-existe', {}, {}).length === 0, 'un vecino que no existe no llama al enganche');
V.fijarGustosDeBruno(null);
// el enchufe en main.js
const main = leer('src/main.js');
ok(/fijarGustosDeBruno\(\(\) => \(!esDesafio && progreso\?\.personal\?\.bruno\?\.creado \? progreso\.personal\.bruno\.gustos : \[\]\)\);/.test(main), 'main.js fija los gustos de Bruno (sólo creado y fuera del Desafío)');
ok(/vecindad\.js';/.test(main) && main.includes('fijarGustosDeBruno }'), 'y los importa de vecindad.js');

// todos los módulos de F4 importan limpio (el empaquetador no soporta comentarios en la línea de un import)
const LF = String.fromCharCode(10);
const importsBien = (t) => t.split(LF).filter((l) => l.startsWith('import ')).every((l) => l.endsWith(';') && !l.includes('//') && l.includes(' from '));
for (const f of ['src/creador-textos.js', 'src/creador-prologo.js', 'src/vecindad.js', 'src/main.js', 'src/creador-pantalla.js', 'src/personal-bruno.js']) ok(importsBien(leer(f)), `${f}: imports en una línea y sin comentarios`);

console.log(`OK 4.1 textos de Bruno · ${pasos} verificaciones · 32 rasgos con largos y sentido, prólogo de 5 pantallas, 26 líneas de vecinos y su enchufe en la charla`);
