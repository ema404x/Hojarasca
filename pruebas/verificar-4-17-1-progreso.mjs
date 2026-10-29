// 4.17.1 (progreso): arreglos del guion y del progreso de la Historia (zonas E2 y E4 del pase de bugs 8). Todo en Node, corriendo el código.
//   1. el reinicio de las partidas viejas: sólo la historia vieja EN CURSO; terminada, en pausa, nunca empezada o Libre sólo se limpia
//   2. la copia previa: del texto crudo, en el formato de «Exportar», «Importar acá» la acepta y no se vuelve a reiniciar; nombre real
//   3. la carpeta sincronizada avisa del reinicio
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { funcion } from './ayuda-codigo.mjs';

const raiz = new URL('..', import.meta.url);
const leer = (f) => readFileSync(new URL(f, raiz), 'utf8');
const requerir = createRequire(import.meta.url);
let pasos = 0;
const ok = (c, m) => { assert.ok(c, m); pasos++; };

// localStorage de mentira (guardado.js lo usa como global)
const almacen = new Map();
globalThis.localStorage = {
  getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => { almacen.set(k, String(v)); }, removeItem: (k) => { almacen.delete(k); },
  key: (i) => [...almacen.keys()][i] ?? null, get length() { return almacen.size; }, clear: () => almacen.clear(),
};

const H = await import('../src/historia.js');
const R = await import('../src/historia-reinicio.js');
const T = await import('../src/transferir.js');
const G = await import('../src/guardado.js');
const S = await import('../src/sincronia.js');

// ---------------------------------------------------------------- 1. qué partidas viejas se reinician
{
  const mundo = { dia: 200, horas: 10, materiales: { tabla: 40 }, obras: [{ plano: 'banco-trabajo', x: 0, z: 0 }], ramitas: 12 };
  const conHistoria = (h) => { const p = { ...JSON.parse(JSON.stringify(mundo)), historia: h }; return p; };
  // como las deja cargarProgreso: la historia pasada por el saneado de la versión nueva
  const cargada = (h) => { const p = conHistoria(h); p.historia = H.sanearHistoria(p.historia); return p; };
  const casos = [
    ['en curso (capítulo 6)', { activa: true, capitulo: 5, fase: 'jugando', empezada: 3, hechos: { 'molino:molino': 40 } }, true],
    ['en curso, esperando la tarjeta de un capítulo', { activa: true, capitulo: 3, fase: 'intro', empezada: 3 }, true],
    ['terminada (4.14: activa seguía en true)', { activa: true, capitulo: 7, fase: 'fin', empezada: 3, terminada: 40, hechos: { 'temporal:noche': 39 } }, false],
    ['terminada sólo con el día', { activa: true, capitulo: 7, fase: 'jugando', empezada: 3, terminada: 40 }, false],
    ['terminada sólo con la fase', { activa: true, capitulo: 7, fase: 'fin', empezada: 3 }, false],
    ['los ocho capítulos hechos, faltaba la tarjeta de cierre', { activa: true, capitulo: 7, fase: 'outro', empezada: 3 }, false],
    ['terminada y en pausa', { activa: false, capitulo: 7, fase: 'fin', empezada: 3, terminada: 40 }, false],
    ['en pausa (Relax libre)', { activa: false, capitulo: 4, fase: 'jugando', empezada: 3, hechos: { 'lago:kayak': 20 } }, false],
    ['nunca empezada', { activa: false, capitulo: 0, fase: 'intro', empezada: 0, terminada: 0, hechos: {} }, false],
  ];
  for (const [nombre, h, reinicia] of casos) {
    ok(R.debeReiniciar(cargada(h), 'relax') === reinicia, `${nombre}: ${reinicia ? 'se reinicia' : 'NO se reinicia'}`);
    ok(R.debeReiniciar(conHistoria(h), 'relax') === reinicia, `${nombre} (sin sanear): igual`);
    ok(!R.debeReiniciar(cargada(h), 'desafio'), `${nombre}: el Desafío nunca`);
  }
  const libre = { ...mundo };
  ok(!R.historiaVieja(libre) && !R.debeReiniciar(libre, 'relax'), 'modo Libre sin historia: nada');
  ok(!R.debeReiniciar(cargada({ activa: true, version: 2, capitulo: 3, fase: 'jugando', empezada: 2 }), 'relax'), 'una historia nueva: nada');
  // lo que hace main.js con cada una: el mismo bloque, corrido
  const main = leer('src/main.js');
  const bloque = main.slice(main.indexOf('if (progreso && !esDesafio && historiaVieja(progreso)) {'), main.indexOf('let reiniciandoPartida = false;'));
  ok(bloque.length > 50 && bloque.includes('limpiarHistoria(progreso)'), 'main.js: el bloque del reinicio');
  const correr = (p, copia = 'copia-previa-historia-4.15.0-p1-20261029-1200.json') => new Function('env', `with (env) { ${bloque}; return progreso; }`)({
    progreso: p, esDesafio: false, historiaVieja: R.historiaVieja, debeReiniciar: R.debeReiniciar, reiniciarPartida: R.reiniciarPartida, limpiarHistoria: R.limpiarHistoria,
    guardarCopiaPrevia: () => copia, progresoNuevo: G.progresoNuevo, guardarProgreso: () => true,
  });
  const terminada = correr(cargada(casos[2][1]));
  ok(terminada.dia === 200 && terminada.obras.length === 1 && terminada.materiales.tabla === 40 && terminada.historia.version === 2 && !terminada.historia.activa, 'terminada: el mundo queda entero y sólo se limpia la historia');
  const enCurso = correr(cargada(casos[0][1]));
  ok(enCurso.dia === 1 && enCurso.historia.avisoReinicio === true, 'en curso: se reinicia (decisión del usuario)');
  const sinCopia = correr(cargada(casos[0][1]), null);
  ok(sinCopia.dia === 200 && sinCopia.obras.length === 1, 'en curso pero sin copia: no se reinicia');
}

// ---------------------------------------------------------------- 2. la copia previa
{
  const viejaCruda = { dia: 42, horas: 10, materiales: { tabla: 17 }, obras: [{ plano: 'banco-trabajo', x: 0, z: 0 }], guardadoEn: 1000, versionJuego: '4.14.0',
    historia: { activa: true, capitulo: 5, fase: 'jugando', empezada: 3, hechos: { 'llegada:fuego': 3, 'molino:molino': 40 }, momentos: { molino: 'lanzado' }, cerrados: { llegada: 4, manos: 9 } } };
  const crudo = JSON.stringify(viejaCruda);
  // guardado.js: el texto crudo de la última carga
  G.usarModoGuardado('relax', 1);
  localStorage.clear();
  localStorage.setItem('hojarasca-v1', crudo);
  const cargada = G.cargarProgreso();
  ok(cargada && Object.keys(cargada.historia.hechos).length === 0, 'cargarProgreso sanea la historia vieja (por eso la copia no puede salir de acá)');
  ok(G.textoUltimaCarga() === crudo, 'guardado.js guarda el texto crudo que leyó');
  const paquete = R.textoPaqueteCopia({ crudo: G.textoUltimaCarga(), vieja: cargada, nombre: 'copia-previa-historia-4.15.0-p1-20261029-1200.json', fotos: { f1: 'data:image/png;base64,AAA' }, ranura: 1, version: '4.17.1' });
  const r = T.leerPaquete(paquete);
  ok(r.ok && r.paquete.modo === 'relax' && r.paquete.dia === 42, `«Importar acá» acepta la copia (${r.motivo || 'ok'})`);
  const hv = r.paquete.progreso.historia;
  ok(hv.hechos['molino:molino'] === 40 && hv.momentos.molino === 'lanzado' && hv.cerrados.manos === 9 && hv.capitulo === 5, 'la copia trae la historia vieja tal cual (objetivos, momento y capítulos cerrados)');
  ok(r.paquete.fotos.f1 && r.paquete.progreso.materiales.tabla === 17, 'y el mundo y las fotos');
  // importada: se sanea igual que cualquier partida y NO se vuelve a reiniciar
  ok(G.escribirPartida('relax', 2, r.paquete.progreso, r.paquete.fotos), 'importar: se escribe en la ranura 2 como lo hace «Importar acá»');
  G.usarModoGuardado('relax', 2);
  const importada = G.cargarProgreso();
  G.usarModoGuardado('relax', 1);
  ok(R.historiaVieja(importada) && !R.debeReiniciar(importada, 'relax') && R.esCopiaPrevia(importada), 'importada en esta versión: no se reinicia otra vez (sólo se limpia la historia)');
  const limpia = R.limpiarHistoria(importada);
  ok(limpia.dia === 42 && limpia.obras.length === 1 && limpia.historia.version === 2, 'y vuelve el mundo como estaba, con la historia nueva para empezar');
  ok(R.debeReiniciar({ ...cargada, historia: H.sanearHistoria(viejaCruda.historia) }, 'relax'), 'la partida vieja original sí se reinicia');
  // sin texto crudo (no debería pasar): sale de la cargada, igual importable
  ok(T.leerPaquete(R.textoPaqueteCopia({ vieja: cargada, nombre: 'x.json' })).ok, 'sin texto crudo: igual en formato importable');
  ok(R.textoPaqueteCopia({}) === null, 'sin nada: null');

  // main.js: guardarCopiaPrevia corrida con un mundo de mentira
  const main = leer('src/main.js');
  const C = requerir('../copias-main.cjs');
  const dir = mkdtempSync(join(tmpdir(), 'hoj-copias-4171-'));
  try {
    const guardados = new Map();
    const env = (escribir) => ({
      ranuraActual: () => 1, nombreCopia: R.nombreCopia, textoUltimaCarga: () => crudo, cargarFotos: () => ({ f1: 'data:image/png;base64,AAA' }), textoPaqueteCopia: R.textoPaqueteCopia, textoCopia: R.textoCopia,
      document: { getElementById: () => ({ textContent: 'Versión 4.17.1' }) },
      window: { hojarasca: escribir ? { copias: { escribir } } : undefined },
      localStorage: { setItem: (k, v) => guardados.set(k, v) },
      Object, JSON, String,
    });
    const real = (partida, nombre, texto) => C.escribirCopia(dir, partida, nombre, texto);
    const gcp = funcion(main, 'guardarCopiaPrevia', env(real));
    const n1 = gcp(cargada);
    const n2 = gcp(cargada);
    const archivos = readdirSync(join(dir, 'partidas', 'hojarasca', 'copias')).sort();
    ok(n1 && archivos.includes(n1) && n2 && n2 !== n1 && archivos.includes(n2) && /-2\.json$/.test(n2), `la tarjeta nombra el archivo REAL, también con el nombre ocupado (${n1}, ${n2})`);
    const enArchivo = T.leerPaquete(readFileSync(join(dir, 'partidas', 'hojarasca', 'copias', n1), 'utf8'));
    ok(enArchivo.ok && enArchivo.paquete.progreso.historia.hechos['molino:molino'] === 40 && enArchivo.paquete.fotos.f1, 'el archivo se importa y trae la partida de antes del saneado, con las fotos');
    ok(T.leerPaquete(guardados.get('hojarasca-copia-previa-historia-p1')).ok, 'el respaldo del navegador, también importable');
    // si el archivo no se puede escribir, no hay reinicio (aunque el navegador tenga lugar)
    guardados.clear();
    ok(funcion(main, 'guardarCopiaPrevia', env(() => null))(cargada) === null, 'sin archivo: no hay copia (y entonces no se reinicia)');
    ok(funcion(main, 'guardarCopiaPrevia', env(null))(cargada) === null, 'sin el puente de archivos (navegador): tampoco');
    // con muchas fotos, se prueba sin ellas
    const llamados = [];
    const nf = funcion(main, 'guardarCopiaPrevia', env((p, n, t) => { llamados.push(t.length); return llamados.length === 1 ? null : n; }))(cargada);
    ok(nf && llamados.length === 2 && llamados[1] < llamados[0], 'si no entra con las fotos, se guarda sin ellas');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  // la tarjeta dice cómo traerla
  const t = R.tarjetaAviso({ copiaPrevia: 'copia-previa-historia-4.15.0-p1-20261029-1200-2.json' });
  ok(t.texto.some((x) => x.includes('copia-previa-historia-4.15.0-p1-20261029-1200-2.json') && x.includes('Importar acá')), 'la tarjeta nombra el archivo y dice cómo traerla');
}

// ---------------------------------------------------------------- 3. la carpeta sincronizada
{
  const local = { hay: true, dia: 120, guardadoEn: 1000, secuencia: 3 };
  const reiniciada = { dia: 1, guardadoEn: 9e12, historia: { version: 2, activa: true, avisoReinicio: true, copiaPrevia: 'copia-previa-historia-4.15.0-p1-20261029-1200.json' } };
  ok(/empezó de cero/.test(S.textoOferta(local, { progreso: reiniciada })) && /copia-previa-historia-4\.15\.0-p1/.test(S.textoOferta(local, { progreso: reiniciada })), 'ofrecer la partida reiniciada avisa que es la que empezó de cero');
  ok(/empezó de cero/.test(S.textoDosCambiaron(local, { progreso: reiniciada })), 'también si las dos siguieron');
  const vieja = { dia: 130, guardadoEn: 9e12, historia: { activa: true, capitulo: 3, fase: 'jugando', empezada: 2 } };
  ok(/historia anterior a medias/.test(S.textoOferta(local, { progreso: vieja })), 'ofrecer una partida con la historia vieja a medias avisa que se reiniciará');
  const ya = { dia: 300, guardadoEn: 9e12, historia: { version: 2, activa: true, avisoReinicio: false, copiaPrevia: 'copia-previa-historia-4.15.0-p1-20261029-1200.json' } };
  ok(!/OJO/.test(S.textoOferta(local, { progreso: ya })), 'una partida reiniciada hace mucho y seguida: sin aviso');
  ok(!/OJO/.test(S.textoOferta(local, { progreso: { dia: 5, guardadoEn: 9e12 } })), 'una partida cualquiera: sin aviso');
}

console.log(`verificar-4-17-1-progreso: ${pasos} pasos en verde`);
