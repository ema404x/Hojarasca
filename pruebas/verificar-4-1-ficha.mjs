// 4.1 (F2): la ficha de Bruno en el cuaderno (src/creador-textos.js, src/creador-ficha.js) y su retrato guardado (src/personal-bruno.js).
//  · la ficha trae nombre, edad, todo lo elegido, los pros y los contras en texto SIN números, y los avisos de tope;
//  · la pantalla de creación y la ficha usan los mismos textos (se cambian en un solo lugar cuando estén los definitivos);
//  · el retrato: sólo se acepta una imagen JPEG chica; cualquier otra cosa se descarta; sin retrato la ficha no se rompe;
//  · la ficha se dibuja con un DOM mínimo (sólo lectura) y la pestaña «Bruno» es la primera del cuaderno, sin tocar las anotaciones.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imp = (f) => import(pathToFileURL(path.join(raiz, 'src', f)).href);
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const T = await imp('creador-textos.js'), B = await imp('personal-bruno.js'), K = await imp('creador-catalogo.js'), C = await imp('creador-personaje.js'), F = await imp('creador-ficha.js');
let pasos = 0;
const ok = (c, t) => { pasos++; assert.ok(c, t); };
const tieneNumero = (t) => [...t].some((ch) => ch >= '0' && ch <= '9');
const LF = String.fromCharCode(10), CR = String.fromCharCode(13);
const importsBien = (t) => t.split(LF).filter((l) => l.startsWith('import ')).every((l) => l.endsWith(';') && !l.includes('//') && l.includes(' from '));

// ---------------------------------------------------------------- 1. los textos
const def = C.genomaDefecto();
const f = T.fichaDeBruno(def);
ok(f.nombre === 'Bruno Castellanos' && f.edad === 27 && f.presentacion.length > 10, 'la ficha trae nombre, edad y presentación');
ok(f.datos.length === 6 && f.datos.map((d) => d[0]).join() === 'Personalidad,Oficio de antes,Gustos,Hobby,Virtud,Defecto', 'trae los seis datos de carácter, en orden');
ok(f.datos[2][1].split(' y ').length === 2, 'los dos gustos van juntos con «y»');
ok(f.datos.every(([, v]) => typeof v === 'string' && v.length > 0), 'ningún dato queda vacío');
ok(f.retrato === null, 'sin retrato guardado, la ficha trae null');
ok(f.pros.length >= 1 && f.contras.length >= 1, 'tiene pros y contras');
for (const t of [...f.pros, ...f.contras, ...f.avisos, f.presentacion]) ok(!tieneNumero(t), `texto sin números: «${t}»`);
ok(f.sistemas.length === 4 && f.sistemas.every((s) => Number.isInteger(s.valor) && Math.abs(s.valor) <= K.TOPES[s.id]), 'los cuatro sistemas traen su valor dentro del tope');
// la pantalla y la ficha usan los mismos textos
const pantalla = leer('src/creador-pantalla.js');
ok(pantalla.includes("from './creador-textos.js'") && pantalla.includes('lineasDeBruno(genoma)'), 'la pantalla de creación usa lineasDeBruno (los mismos textos que la ficha)');
ok(!pantalla.includes('se nota en el día a día') && !pantalla.includes("'mejora' : 'empeora'") && !pantalla.includes('CLASE_TEXTO') && !pantalla.includes('Textos provisorios'), 'y ya no tiene textos propios duplicados');
// la línea sale de la tarjeta escrita (F4): «Nombre: texto»
const lin = (c) => T.lineaDeContribucion(c);
ok(lin({ clase: 'virtud', id: 'paciente', lado: 'pro' }) === 'Paciente: Los peces pican antes.', 'un pro con efecto dice qué mejora, con el texto de la tarjeta');
ok(lin({ clase: 'defecto', id: 'friolero', lado: 'contra' }) === 'Friolero: Su ropa abriga un poco menos en invierno.', 'un contra con efecto dice qué empeora');
ok(lin({ clase: 'virtud', id: 'paciente', lado: 'contra' }) === null && lin({ clase: 'defecto', id: 'friolero', lado: 'pro' }) === null, 'la virtud no tiene contra ni el defecto tiene pro');
ok(f.pros.some((t) => t.includes(':')) && T.lineasDeBruno(def).pros.length === f.pros.length, 'lineasDeBruno y la ficha traen lo mismo');
ok(f.datos.every((d) => typeof d[2] === 'string' && d[2].length > 0), 'cada dato de la ficha trae la frase del rasgo');
// los avisos de tope
const alMax = T.fichaDeBruno({ ...def, personalidad: 'sociable', oficio: 'docente', virtud: 'simpatico', gustos: ['mate', 'libros'] });
ok(alMax.avisos.length >= 1 && alMax.avisos.some((a) => a.includes('máximo')), 'con tres rasgos que suman afecto, la ficha avisa que está al máximo');
ok(T.fichaDeBruno(def).avisos.every((a) => !a.includes('undefined')), 'ningún aviso trae «undefined»');
for (const raro of [undefined, null, 5, 'x', []]) ok(T.fichaDeBruno(raro).nombre === 'Bruno Castellanos', `con ${JSON.stringify(raro)} la ficha igual se arma`);

// ---------------------------------------------------------------- 2. el retrato
const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT';
ok(B.retratoValido(jpeg), 'una imagen JPEG como texto es válida');
for (const malo of ['', 'hola', 5, null, undefined, {}, [], 'data:image/png;base64,AAAA', 'data:image/jpeg;base64,', 'data:image/jpeg;base64,!!!!', 'javascript:alert(1)', 'data:text/html;base64,AAAA', jpeg + '"><script>']) ok(!B.retratoValido(malo), `se descarta ${JSON.stringify(malo)}`);
ok(!B.retratoValido('data:image/jpeg;base64,' + 'A'.repeat(60000)), 'se descarta un retrato demasiado grande');
ok(B.retratoValido('data:image/jpeg;base64,' + 'A'.repeat(59000)), 'y se acepta uno de tamaño razonable');
ok(B.sanearBruno({ retrato: jpeg }).retrato === jpeg && B.sanearBruno({ retrato: 'x' }).retrato === '' && B.sanearBruno({}).retrato === '', 'sanearBruno conserva el retrato válido y descarta lo demás');
assert.deepEqual(B.sanearBruno(B.sanearBruno({ retrato: jpeg })), B.sanearBruno({ retrato: jpeg })); ok(true, 'sanear con retrato es idempotente');
ok(B.brunoDefecto().retrato === '', 'de fábrica no hay retrato');
ok(T.fichaDeBruno({ ...def, retrato: jpeg }).retrato === jpeg && T.fichaDeBruno({ ...def, retrato: '' }).retrato === null, 'la ficha trae el retrato si lo hay');

// ---------------------------------------------------------------- 3. dibujar la ficha (un DOM mínimo)
class Nodo {
  constructor(tag) { this.tag = tag; this.hijos = []; this.clase = ''; this.textContent = ''; this.style = {}; }
  appendChild(n) { this.hijos.push(n); return n; }
  texto() { return this.textContent + this.hijos.map((h) => h.texto()).join(''); }
  todos() { return [this, ...this.hijos.flatMap((h) => h.todos())]; }
}
globalThis.document = { createTextNode: (t) => { const n = new Nodo('#texto'); n.textContent = t; return n; } };
const el = (tag, clase, texto) => { const n = new Nodo(tag); n.clase = clase || ''; if (texto !== undefined) n.textContent = texto; return n; };
const lista = new Nodo('lista'), hoja = new Nodo('ficha');
F.dibujarFichaBruno(lista, hoja, el, { ...def, retrato: jpeg }, false);
const txt = hoja.texto();
ok(txt.includes('Bruno Castellanos') && txt.includes('27 años') && txt.includes('Personalidad: ') && txt.includes('Oficio de antes: ') && txt.includes('A su favor') && txt.includes('En su contra'), 'la hoja muestra nombre, edad, carácter, pros y contras');
ok(hoja.todos().some((n) => n.tag === 'img' && n.src === jpeg), 'con retrato hay una imagen con esa foto');
ok(!txt.includes('sólo valen en el Relax'), 'en el Relax no avisa de que los rasgos no valen');
const sin = new Nodo('ficha'); F.dibujarFichaBruno(new Nodo('l'), sin, el, def, true);
ok(!sin.todos().some((n) => n.tag === 'img') && sin.texto().includes('sólo valen en el Relax'), 'sin retrato no hay imagen, y en La noche de los duendes avisa que los rasgos no valen');
ok(lista.texto().includes('espejo'), 'la columna de la izquierda explica que el aspecto se rehace en el espejo');
const rota = new Nodo('ficha'); F.dibujarFichaBruno(new Nodo('l'), rota, el, undefined, false);
ok(rota.texto().includes('Bruno Castellanos'), 'sin datos guardados la ficha se dibuja igual');
delete globalThis.document;

// ---------------------------------------------------------------- 4. la pestaña en el cuaderno
const main = leer('src/main.js');
ok(main.includes("const pestanas = [['bruno', 'Bruno'], ['especies', 'Especies y lugares']"), 'la pestaña Bruno es la primera del cuaderno');
ok(main.includes("if (pestana === 'bruno') { dibujarFichaBruno(lista, ficha, el, progreso.personal?.bruno, !!desafio); return; }"), 'se dibuja con lo guardado y sabe si es el Desafío');
ok(main.includes("import { dibujarFichaBruno } from './creador-ficha.js';"), 'main.js importa la ficha en una línea');
ok(main.includes("retrato: retrato || ''") && main.includes('alAceptar: (g, retrato) =>'), 'al terminar la creación se guarda el retrato');
ok(pantalla.includes('function sacarRetrato()') && pantalla.includes("lienzo.toDataURL('image/jpeg'") && pantalla.includes('const retrato = sacarRetrato(); cerrar(); alAceptar?.(g, retrato);'), 'la pantalla saca el retrato antes de cerrar (todavía hay dibujante)');
for (const n of ['src/creador-textos.js', 'src/creador-ficha.js', 'src/creador-pantalla.js']) {
  const t = leer(n);
  ok(!t.includes(CR), `${n}: fines de línea LF`);
  ok(importsBien(t), `${n}: los imports entran en una línea y sin comentario (armar.mjs)`);
}

console.log(`OK 4.1 ficha de Bruno · ${pasos} verificaciones · textos sin números, retrato válido, la hoja del cuaderno y la pestaña`);
