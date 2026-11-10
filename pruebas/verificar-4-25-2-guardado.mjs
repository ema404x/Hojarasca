// 4.25.2 (guardado, economía, códigos, teclas y mundo): los arreglos de las zonas G2 y G3 de la revisión de la 4.25.1.
//   M1  el récord de la semilla con una perilla más fácil (se anotaba al amanecer, antes de la guarda de registrarRecords)
//   M2  las perillas se miraban sólo al alba: una noche jugada con una perilla más fácil marca la partida (`desafio.facilitada`)
//   M3  la consola de códigos en el Desafío marca la partida (`desafio.trucos`): sin logros ni récords (tampoco los de la corrida y los puntos)
//   M4  lo comprado en la trochita no se revende con ganancia en la tienda de campo ni en la consigna de la feria (reventa.js)
//   B1  `guardar` en la consola no dice «guardada» si no se guardó
//   B2  `cuaderno completo` que anota algo que la Historia pide como objetivo deja la marca `trucos.historia`
//   B4  «Importar acá» avisa que una partida con la historia vieja a medias se reinicia
//   G3-1 una acción no se puede poner en una tecla fija del juego (Q, R, V, 1-9, Enter…); un mapa guardado así vuelve a la de fábrica
//   G3-2 la noche de la nevada mira la tecla traducida; y no se duerme durante la noche
//   G3-3 la cámara arriba del alero no cuenta como «adentro» (no apaga el exterior)
//   G3-4 el panel de la Historia se vuelve a medir con otro ancho de ventana u otro tamaño de letra
//   G3-5 perder el foco con Mayús apretada no deja la escena acelerada
// Cada grupo tiene sus mutaciones: la misma prueba sobre una copia con el arreglo deshecho tiene que fallar. Las copias de módulos van en src/ con
// nombre «-mutN.js» (las saltean verificar-release y la cantina) y se borran al terminar.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(raiz, 'src');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');
let n = 0, fallas = 0;

// ---------------------------------------------------------------- módulos con mutación
// `mut`: { archivo, de, a } o null. Si el archivo mutado es de `grupo`, se copian TODOS los del grupo como «X-mutK.js» (con sus imports entre sí
// cambiados) y se carga de ahí. Si no, se cargan los de verdad.
const copias = [];
let k = 0;
async function cargarGrupo(grupo, mut) {
  const mods = {};
  if (!mut || !grupo.includes(mut.archivo)) {
    for (const f of grupo) mods[f] = await import(pathToFileURL(join(SRC, f)).href);
    return mods;
  }
  const id = ++k;
  const nombre = (f) => f.replace(/\.js$/, `-mut${id}.js`);
  for (const f of grupo) {
    let t = leer(f);
    if (f === mut.archivo) {
      if (!t.includes(mut.de)) throw new Error(`mutación sin texto en ${f}: ${mut.de.slice(0, 80)}`);
      t = t.split(mut.de).join(mut.a);
    }
    for (const g of grupo) t = t.split(`'./${g}'`).join(`'./${nombre(g)}'`);
    const destino = join(SRC, nombre(f));
    writeFileSync(destino, t);
    copias.push(destino);
  }
  try { for (const f of grupo) mods[f] = await import(pathToFileURL(join(SRC, nombre(f))).href); }
  finally { for (const f of grupo) { try { rmSync(join(SRC, nombre(f)), { force: true }); } catch { /* ya no está */ } } }   // (ya cargados: se borran enseguida, así las pruebas que recorren src/ casi no las ven)
  return mods;
}
// Texto de un archivo, con la mutación si es ese
const texto = (f, mut) => {
  const t = leer(f);
  if (!mut || mut.archivo !== f) return t;
  if (!t.includes(mut.de)) throw new Error(`mutación sin texto en ${f}: ${mut.de.slice(0, 80)}`);
  return t.split(mut.de).join(mut.a);
};

// ---------------------------------------------------------------- los grupos: cada uno devuelve [[condición, texto], ...]
const GRUPOS = {
  // M3, B1, B2: el motor de la consola
  async trucos(mut) {
    const { 'trucos.js': T } = await cargarGrupo(['trucos.js', 'trucos-textos.js'], mut);
    const r = [];
    // B1
    const pg = { entradas: {} };
    r.push([T.ejecutar('guardar', { progreso: () => pg, ajustes: () => ({}), jugador: () => ({}), guardar: () => false }).ok === false, 'B1: guardar que devuelve false no dice «guardada»']);
    r.push([T.ejecutar('guardar', { progreso: () => pg, ajustes: () => ({}), jugador: () => ({}), guardar: () => true }).ok === true, 'B1: guardar que guarda sigue diciendo que sí']);
    r.push([T.ejecutar('guardar', { progreso: () => pg, ajustes: () => ({}), jugador: () => ({}), guardar: () => undefined }).ok === true, 'B1: un guardar sin respuesta no se toma como falla']);
    // M3
    const pd = { materiales: {}, desafio: {} };
    const md = { desafio: true, progreso: () => pd, ajustes: () => ({}), jugador: () => ({ pos: { x: 0, z: 0 } }), guardar: () => true, lugares: () => [{ clave: 'base', nombre: 'La base', x: 1, z: 1 }] };
    for (const l of ['ayuda', 'estado', 'guardar', 'donde', 'ir', 'limpiar', 'descongelar']) T.ejecutar(l, md);
    r.push([!pd.desafio.trucos, 'M3: ayuda, estado, guardar, donde, ir sin destino, limpiar y descongelar no marcan la partida']);
    const r1 = T.ejecutar('materiales 9999', md);
    r.push([pd.desafio.trucos === true, 'M3: «materiales» en el Desafío marca la partida']);
    r.push([r1.ok && /no da logros ni anota récords/.test(r1.texto), 'M3: y lo avisa la primera vez']);
    r.push([!/no da logros/.test(T.ejecutar('velocidad 3', md).texto), 'M3: el aviso no se repite']);
    for (const l of ['volar', 'frio', 'velocidad 2', 'salto 3', 'ir base', 'troncos 50']) {
      const p2 = { materiales: {}, desafio: {} };
      T.ejecutar(l, { ...md, progreso: () => p2 });
      r.push([p2.desafio.trucos === true, `M3: «${l}» en el Desafío marca la partida`]);
    }
    const p3 = { materiales: {}, desafio: {} };
    T.ejecutar('plata 500', { ...md, progreso: () => p3 });
    r.push([!p3.desafio.trucos, 'M3: un código que no anda en el Desafío (plata) no marca']);
    const pr = { materiales: {}, economia: { pesos: 0, libro: [] } };
    T.ejecutar('materiales 10', { ...md, desafio: false, progreso: () => pr });
    r.push([!pr.desafio, 'M3: en el Relax no se toca nada del Desafío']);
    // B2
    const ph = { entradas: {}, historia: { hechos: {} } };
    const rh = T.ejecutar('cuaderno completo', { progreso: () => ph, ajustes: () => ({}), jugador: () => ({}) });
    r.push([ph.trucos?.historia === true, 'B2: «cuaderno completo» que anota el refugio y el viaje marca la historia']);
    r.push([/historia/.test(rh.texto), 'B2: y lo dice']);
    r.push([T.vistaParaLogros(ph).historia === undefined, 'B2: los logros no ven la historia']);
    const ph2 = { entradas: {}, historia: { hechos: { 'llegada:refugio': 1, 'bolsa:viaje': 2 } } };
    T.ejecutar('cuaderno completo', { progreso: () => ph2, ajustes: () => ({}), jugador: () => ({}) });
    r.push([!ph2.trucos?.historia, 'B2: con esos objetivos ya hechos no se marca']);
    const ph3 = { entradas: {}, historia: { hechos: {} } };
    T.ejecutar('cuaderno completo flora', { progreso: () => ph3, ajustes: () => ({}), jugador: () => ({}) });
    r.push([!ph3.trucos?.historia, 'B2: una sección que la historia no lee (flora) no marca']);
    return r;
  },

  // M2, M3: las marcas sobreviven al guardado (y una partida vieja carga sin marcas)
  async reglas(mut) {
    const { 'desafio-reglas.js': R } = await cargarGrupo(['desafio-reglas.js'], mut);
    const r = [];
    const nuevo = R.desafioNuevo();
    r.push([nuevo.trucos === false && nuevo.facilitada === false, 'marcas: una partida nueva arranca sin marcas']);
    const s = R.sanearDesafio({ trucos: true, facilitada: true });
    r.push([s.trucos === true && s.facilitada === true, 'marcas: se guardan y vuelven']);
    const v = R.sanearDesafio({ trucos: 'si', facilitada: 1 });
    r.push([v.trucos === false && v.facilitada === false, 'marcas: sólo un true de verdad']);
    const viejo = R.sanearDesafio({ noches: 4 });
    r.push([viejo.trucos === false && viejo.facilitada === false, 'marcas: una partida vieja carga sin marcas']);
    return r;
  },

  // M1, M2, M3: desafio.js, la meta y la corrida (texto: crearDesafio necesita el mundo entero)
  async desafioTexto(mut) {
    const d = texto('desafio.js', mut), mj = texto('desafio-meta-juego.js', mut), m = texto('main.js', mut);
    const r = [];
    const iAm = d.indexOf('function amanecer()');
    const am = d.slice(iAm, d.indexOf('\n  }\n', iAm));
    r.push([/const rs = sinRecords\(\) \? null : recordDeSemilla\(\);/.test(am), 'M1: el amanecer no anota el récord de la semilla sin mirar']);
    r.push([!/const rs = recordDeSemilla\(\)/.test(am), 'M1: ni la llamada suelta de antes']);
    r.push([am.indexOf('marcarFacilitada()') >= 0 && am.indexOf('marcarFacilitada()') < am.indexOf('sinRecords()'), 'M2: el alba marca la partida antes de decidir']);
    r.push([/dificultad: D\(\)\.facilitada \|\| perillasFacilitanPartida\(\) \? 'facilitada'/.test(am), 'M2: el logro de Implacable mira la marca']);
    r.push([/const sinRecords = \(\) => \{ const d = D\(\); return !!d\.trucos \|\| !!d\.facilitada \|\| perillasFacilitanPartida\(\); \};/.test(d), 'M2/M3: sinRecords mira las dos marcas y las perillas de ahora']);
    r.push([/function marcarFacilitada\(\) \{ const d = D\(\); if \(!d\.facilitada && !d\.sinFin && perillasFacilitanPartida\(\)\) d\.facilitada = true; \}/.test(d), 'M2: marcarFacilitada']);
    r.push([/d\.oleadaTerminada = false;\n\s*marcarFacilitada\(\);/.test(d), 'M2: al empezar la noche se marca']);
    r.push([/if \(!d\.oleadaTerminada\) marcarFacilitada\(\);/.test(d), 'M2: bajar la perilla a mitad de noche también marca']);
    const iRec = d.indexOf('function registrarRecords(');
    r.push([/if \(sinRecords\(\)\) return;/.test(d.slice(iRec, iRec + 600)), 'M2/M3: registrarRecords no anota con marcas']);
    const iLog = d.indexOf('function anunciarLogros(');
    r.push([/^\s*function anunciarLogros\(ids\) \{\n\s*if \(D\(\)\.trucos\) return;/m.test(d.slice(iLog - 2, iLog + 200)), 'M3: con códigos no se anuncian ni se dan logros']);
    r.push([/if \(\(d\.noches \|\| 0\) > 0 && !d\.trucos && !d\.facilitada\) \{/.test(mj), 'M2/M3: los puntos de la partida no van a los récords con marcas']);
    r.push([/const r = d\.trucos \? \{ records: recordsSinFin\(\), puesto: 0, puestoCodigo: 0 \} : registrarCorrida\(recordsSinFin\(\), entrada\);/.test(m), 'M3: la corrida sin fin con códigos no anota récord']);
    return r;
  },

  // M4: la reventa
  async reventa(mut) {
    const G = ['reventa.js', 'oficios-propios.js', 'propiedad.js', 'negocios.js'];
    const M = await cargarGrupo(G, mut);
    const O = M['oficios-propios.js'], P = M['propiedad.js'], N = M['negocios.js'], RV = M['reventa.js'];
    const C = await import(pathToFileURL(join(SRC, 'comercio.js')).href);
    const r = [];
    const partida = () => ({ economia: { pesos: 1e6, libro: [] }, negocios: N.negociosNuevo(), materiales: {}, cosas: {}, entradas: {} });
    const poner = (p, bien, u) => {
      const b = C.BIENES[bien];
      if (b.donde === 'material') p.materiales[bien] = (p.materiales[bien] || 0) + u;
      else if (b.donde === 'cosa') p.cosas[bien] = (p.cosas[bien] || 0) + u;
      else p.entradas[bien] = { ...(p.entradas[bien] || {}), cantidad: (p.entradas[bien]?.cantidad || 0) + u };
    };
    const PARADAS = ['Estación del Valle', 'Parada del Mallín', 'Apeadero del Faro', 'Parada Arrayanes', 'Parada del Molino', 'Apeadero de la Casa de Té', 'Apeadero del Pescador', 'Parada del Bosque', 'Aldea de los Duendes', 'Puesto de la Cantera', 'Puesto del Paso', 'Puesto de la Estepa', 'Puesto del Riel Sur'];
    // lo comprado en la parada más barata (que lo produce), dejado en la tienda: nunca gana
    let casos = 0, ganan = 0, peor = null;
    for (const bien of O.TIENDA.mercaderia) {
      for (const parada of PARADAS) {
        if (!C.bienesDe(parada).includes(bien)) continue;
        for (const dia of [1, 17, 40, 77, 113]) for (const temp of ['verano', 'otono', 'invierno']) {
          const pr = C.precios(C.comercioNuevo(), parada, bien, dia, temp, 0.85);
          const pesos = pr.compra * 100;
          const p = partida();
          poner(p, bien, pr.lote + (O.TIENDA.reserva[bien] || 0));   // lo de la receta queda en la mochila (no va a la tienda)
          RV.anotarCompraTren(p, bien, pr.lote, pesos);
          const t = O.sanearTienda({}, 1);
          O.dejarEnTienda(p, t);
          O.venderDias(t, 2);
          casos++;
          if (t.caja > pesos) { ganan++; peor = `${bien} en ${parada}: pagó ${pesos}, la tienda dio ${t.caja}`; }
        }
      }
    }
    r.push([casos > 100 && ganan === 0, `M4: lo comprado en el tren no gana en la tienda (${casos} casos, ${ganan} ganan${peor ? `; ${peor}` : ''})`]);
    // lo propio se sigue pagando como siempre
    {
      const p = partida();
      poner(p, 'pan-casero', 3 * C.BIENES['pan-casero'].lote);
      const t = O.sanearTienda({}, 1);
      O.dejarEnTienda(p, t); O.venderDias(t, 2);
      r.push([t.caja === 3 * O.precioEnTienda('pan-casero'), 'M4: el pan propio se paga entero']);
    }
    // mezcla: dos lotes comprados y uno propio
    {
      const p = partida(), lote = C.BIENES['pan-casero'].lote;
      poner(p, 'pan-casero', 3 * lote); RV.anotarCompraTren(p, 'pan-casero', 2 * lote, 700);
      const t = O.sanearTienda({}, 1);
      const dej = O.dejarEnTienda(p, t);
      r.push([dej[0]?.comprados === 2, 'M4: la tienda marca los dos lotes comprados']);
      O.venderDias(t, 2);
      r.push([t.caja === 700 + O.precioEnTienda('pan-casero'), 'M4: los comprados a lo que costaron, el propio entero']);
      r.push([!t.reventa && !p.negocios.reventa, 'M4: no queda nada marcado de más']);
    }
    // la cuenta nunca pasa de lo que tenés (compraste y te lo comiste: lo que hacés después es tuyo)
    {
      const p = partida(), lote = C.BIENES['miel'].lote;
      RV.anotarCompraTren(p, 'miel', 2 * lote, 400);
      poner(p, 'miel', lote);   // (sólo queda un lote)
      const t = O.sanearTienda({}, 1);
      O.dejarEnTienda(p, t);
      r.push([t.reventa?.miel?.lotes === 1 && !p.negocios.reventa, 'M4: la cuenta se recorta a lo que hay']);
    }
    // la consigna de la feria
    let casosP = 0, ganaP = 0;
    for (const bien of Object.keys(C.BIENES)) {
      for (const parada of PARADAS) {
        if (!C.bienesDe(parada).includes(bien)) continue;
        const pr = C.precios(C.comercioNuevo(), parada, bien, 9, 'verano', 0.85);
        const pesos = pr.compra * 100;
        const p = partida();
        p.negocios.casas.puesto = { desde: 1, caja: 0, stock: {}, dia: 1 };
        poner(p, bien, pr.lote); RV.anotarCompraTren(p, bien, pr.lote, pesos);
        const d = P.dejarEnPuesto(p, bien, 1);
        if (!d.ok) continue;
        P.ventasDelPuesto(p, 2, 1.1, () => 1.3);
        casosP++;
        if (p.negocios.casas.puesto.caja > pesos) ganaP++;
      }
    }
    r.push([casosP > 30 && ganaP === 0, `M4: lo comprado en el tren no gana en la consigna (${casosP} casos, ${ganaP} ganan)`]);
    // sacar de la consigna devuelve lo marcado a la cuenta
    {
      const p = partida(), lote = C.BIENES['harina'].lote;
      p.negocios.casas.puesto = { desde: 1, caja: 0, stock: {}, dia: 1 };
      poner(p, 'harina', lote); RV.anotarCompraTren(p, 'harina', lote, 300);
      P.dejarEnPuesto(p, 'harina', 1);
      r.push([p.negocios.casas.puesto.reventa?.harina?.lotes === 1 && !p.negocios.reventa, 'M4: la consigna marca el lote comprado']);
      P.sacarDelPuesto(p, 'harina', 1);
      r.push([!p.negocios.casas.puesto.reventa && p.negocios.reventa?.harina?.u === lote && Math.round(p.negocios.reventa.harina.pesos) === 300, 'M4: sacarlo lo devuelve a la cuenta con su costo']);
    }
    // el guardado
    const sn = N.sanearNegocios({ reventa: { miel: { u: 4, pesos: 300 }, roto: { u: 0, pesos: 9 }, 'x': 'basura' }, casas: { puesto: { desde: 1, caja: 0, stock: { miel: 2 }, reventa: { miel: { lotes: 5, pesos: 80 }, harina: { lotes: 1, pesos: 1 } }, dia: 1 } } }, 3);
    r.push([sn.reventa?.miel?.u === 4 && !sn.reventa.roto && !sn.reventa.x, 'M4: la cuenta se guarda saneada']);
    r.push([sn.casas.puesto.reventa?.miel?.lotes === 2 && !sn.casas.puesto.reventa.harina, 'M4: los lotes marcados de la consigna, nunca más que los que hay']);
    r.push([!('reventa' in N.sanearNegocios({}, 3)) && !('reventa' in N.sanearNegocios({ casas: { puesto: { desde: 1, caja: 0, stock: {}, dia: 1 } } }, 3).casas.puesto), 'M4: una partida vieja carga igual que antes']);
    const st = O.sanearTienda({ stock: { miel: 1 }, reventa: { miel: { lotes: 3, pesos: 10 }, pan: { lotes: 1, pesos: 1 } } }, 4);
    r.push([st.reventa?.miel?.lotes === 1 && !st.reventa.pan, 'M4: la tienda guarda sus lotes marcados saneados']);
    r.push([!('reventa' in O.sanearTienda({ stock: { miel: 1 } }, 4)), 'M4: una tienda vieja carga igual que antes']);
    // el enganche con la compra en el tren
    const cm = texto('comercio-mundo.js', mut);
    r.push([/sumar\(bien, r\.cantidad\);\n\s*anotarCompraTren\(P\(\), bien, r\.cantidad, aPesos\(r\.precio\)\);/.test(cm), 'M4: comprar en una parada anota la compra']);
    return r;
  },

  // B4
  async importar(mut) {
    const M = await cargarGrupo(['transferir.js', 'historia-reinicio.js'], mut);
    const TR = M['transferir.js'], HR = M['historia-reinicio.js'];
    const r = [];
    const vieja = { dia: 9, historia: { version: 1, activa: true, empezada: 2, capitulo: 3, hechos: { a: 1 } } };
    r.push([/historia anterior a medias/.test(HR.avisoImportarHistoria(vieja)), 'B4: una partida con la historia vieja a medias se avisa']);
    r.push([HR.avisoImportarHistoria({ dia: 3, historia: { ...vieja.historia, copiaPrevia: 'copia-previa-historia-4.15.0-p1-20260101-1200.json' } }) === '', 'B4: la copia previa (la que se importa para recuperar) no se avisa']);
    r.push([HR.avisoImportarHistoria({ dia: 3 }) === '' && HR.avisoImportarHistoria(null) === '', 'B4: sin historia, nada']);
    const t = TR.avisoImportar({ modo: 'relax', dia: 9 }, { hay: true, ranura: 2, dia: 4 }, '', HR.avisoImportarHistoria(vieja));
    r.push([/historia anterior a medias[\s\S]*Esto pisa la partida 2/.test(t), 'B4: el aviso va antes de la pregunta']);
    const m = texto('main.js', mut);
    r.push([/avisoImportar\(r\.paquete, infoPartida\(modoJuego, ranura\), versionNuevaDe\(r\.paquete\), modoJuego === 'relax' \? avisoImportarHistoria\(r\.paquete\.progreso\) : ''\)/.test(m), 'B4: «Importar acá» lo pasa']);
    return r;
  },

  // G3-1
  async teclas(mut) {
    const { 'accesibilidad.js': A } = await cargarGrupo(['accesibilidad.js'], mut);
    const r = [];
    let aceptadas = [];
    for (const accion of A.ACCIONES_TECLA.filter((a) => !A.esFija(a))) {
      for (const c of Object.keys(A.TECLAS_DEL_JUEGO)) {
        if (!A.CODIGO_VALIDO.test(c)) continue;
        const x = A.cambiarTecla(A.mapaPorDefecto(), accion, c);
        if (x.ok) aceptadas.push(`${accion}→${c}`);
      }
    }
    r.push([aceptadas.length === 0, `G3-1: ninguna acción se pone en una tecla fija del juego (${aceptadas.slice(0, 4).join(', ')})`]);
    const q = A.cambiarTecla(A.mapaPorDefecto(), 'interactuar', 'KeyQ');
    r.push([!q.ok && /caña/.test(q.motivo) && q.mapa.interactuar === 'KeyE', 'G3-1: la Q dice que es la de la caña y no cambia nada']);
    r.push([A.cambiarTecla(A.mapaPorDefecto(), 'interactuar', 'Semicolon').ok, 'G3-1: una tecla libre se sigue aceptando']);
    const guardado = { ...A.mapaPorDefecto(), interactuar: 'KeyQ', linterna: 'Digit1', saltar: 'Enter', mochila: 'Semicolon', mapa: 'KeyV' };
    const s = A.sanearMapaTeclas(guardado);
    r.push([s.interactuar === 'KeyE' && s.linterna === 'KeyL' && s.saltar === 'Space' && s.mapa === 'KeyM', 'G3-1: un mapa guardado con teclas fijas vuelve a la de fábrica en esas']);
    r.push([s.mochila === 'Semicolon', 'G3-1: los demás remapeos siguen']);
    r.push([A.accionesEnTeclasDelJuego(guardado).sort().join() === ['interactuar', 'linterna', 'mapa', 'saltar'].join(), 'G3-1: se sabe cuáles volvieron (para el aviso)']);
    // toda tecla que el switch de main.js mira por su código y que una acción podría tomar está en la lista
    const m = texto('main.js', mut);
    const i = m.indexOf('  switch (codigo) {\n    case \'KeyE\': {');
    const sw = m.slice(i, m.indexOf('\n  }\n', i));
    const casos = [...new Set([...sw.matchAll(/case '([A-Za-z0-9]+)'/g)].map((x) => x[1]))];
    const sueltas = casos.filter((c) => A.CODIGO_VALIDO.test(c) && !Object.values(A.TECLAS_POR_DEFECTO).includes(c) && !A.esTeclaDelJuego(c) && c !== 'F4');   // (F4: la cámara libre, sólo en la versión de prueba)
    r.push([casos.length > 30 && sueltas.length === 0, `G3-1: todas las teclas fijas del switch están en la lista (${sueltas.join(', ')})`]);
    r.push([/const pisadas = accionesEnTeclasDelJuego\(ajustes\.teclas\);/.test(m) && /nota\('Volvieron algunas teclas'/.test(m), 'G3-1: al abrir se avisa y se guarda']);
    return r;
  },

  // G3-2 … G3-5
  async mundoTexto(mut) {
    const nm = texto('historia-noche-mundo.js', mut), m = texto('main.js', mut), am = texto('aldea-mundo.js', mut), aa = texto('aldea-arquitectura.js', mut), hu = texto('historia-ui.js', mut);
    const r = [];
    const iT = nm.indexOf('function alTeclear(e)');
    const tecla = nm.slice(iT, nm.indexOf('\n  }\n', iT));
    r.push([/const c = typeof ctx\.traducirTecla === 'function' \? ctx\.traducirTecla\(e\.code\) : e\.code;/.test(tecla) && !/e\.code === '(Digit|KeyE|Numpad)/.test(tecla), 'G3-2: la noche mira la tecla traducida']);
    r.push([/crearNocheMundo\(\{ traducirTecla: \(c\) => codigoCanonico\(c\),/.test(m), 'G3-2: main.js le pasa la traducción']);
    // la noche con la traducción de verdad: «Juntar» en la Q se corta, la E vieja pasa (no hace nada), la linterna en el 1 no elige el arco
    const f = new Function('ctx', 'elegirArma', 'activa', 'pausada', `const e0 = []; ${tecla.replace('function alTeclear(e) {', 'return function (e) {')}\n}; `);
    const A = await import(pathToFileURL(join(SRC, 'accesibilidad.js')).href);
    const mapa = { ...A.mapaPorDefecto(), interactuar: 'Semicolon' };
    const huerf = new Set([A.TECLAS_POR_DEFECTO.interactuar]);
    const canon = (c) => { const a = A.accionDeTecla(mapa, c); return a ? A.TECLAS_POR_DEFECTO[a] : huerf.has(c) ? 'SinAsignar' : c; };
    let cortadas = [];
    const alTeclear = f({ traducirTecla: canon, modo: () => 'jugando' }, () => {}, true, false);
    for (const c of ['Semicolon', 'KeyE']) { let corta = false; alTeclear({ code: c, stopImmediatePropagation() { corta = true; } }); if (corta) cortadas.push(c); }
    r.push([cortadas.join() === 'Semicolon', `G3-2: con «Juntar» en otra tecla, de noche se corta esa (${cortadas.join()})`]);
    const iD = m.indexOf('function dormir(opRincon = null) {');
    r.push([/if \(nocheMundo\?\.activa\?\.\(\)\) \{ nota\('No podés dormir ahora'/.test(m.slice(iD, iD + 400)), 'G3-2: durante la noche no se duerme']);
    // G3-3
    r.push([/K\.techo = \{ x0: -W \/ 2, x1: W \/ 2, z0: -D \/ 2, z1: zG, radio: Math\.min\(W, D\) \/ 2, alero: H \};/.test(aa), 'G3-3: el techo guarda su alero']);
    const iI = am.indexOf('function interiorDe(pos) {');
    r.push([/if \(Number\.isFinite\(pos\.y\) && Number\.isFinite\(alero\) && pos\.y > b\.sitio\.y \+ alero\) return null;/.test(am.slice(iI, iI + 900)), 'G3-3: arriba del alero no es adentro']);
    r.push([/const ALERO_CASA_TE = 0\.38 \+ 2\.7;/.test(m) && /alto: ALERO_CASA_TE, frente:/.test(m), 'G3-3: la casa de té, hasta su alero']);
    const IV = await import(pathToFileURL(join(SRC, 'interior-visible.js')).href);
    const alero = Number((/const ALERO_CASA_TE = ([\d.]+) \+ ([\d.]+);/.exec(m) || [0, 9, 0]).slice(1, 3).reduce((a, b) => a + Number(b), 0));
    const caja = { id: 'casa-te', x: 0, z: 0, y: 24, rot: 0, ancho: 6.4, fondo: 5.2, alto: alero, frente: [[-3.2, 2.6], [0, 2.6], [3.2, 2.6]] };
    const sal = { puertas: null };
    r.push([!IV.interiorDeCaja({ x: -2.6, y: 24 + 3.6, z: -1 }, caja, sal) && !!IV.interiorDeCaja({ x: -2.6, y: 24 + 1.7, z: -1 }, caja, sal), 'G3-3: la cámara sobre el techo de la casa de té está afuera; a la altura de los ojos, adentro']);
    // G3-4
    r.push([/const clave = `\$\{html\}\|\$\{alto\}\|\$\{arriba\}\|\$\{Number\(doc\.defaultView\?\.innerWidth\) \|\| 0\}\|\$\{doc\.documentElement\?\.dataset\?\.escalaLetra \|\| ''\}`;/.test(hu), 'G3-4: el panel se vuelve a medir con otro ancho u otra letra']);
    // G3-5
    r.push([/window\.addEventListener\('blur', \(\) => \{ escenasMundo\?\.teclaSuelta\(\{ code: 'ShiftLeft' \}\); \}\);/.test(m), 'G3-5: perder el foco suelta la Mayús de la escena']);
    return r;
  },
};

// ---------------------------------------------------------------- las mutaciones: [grupo, archivo, de, a]
const MUT = [
  ['trucos', 'trucos.js', "return m.guardar() === false ? no(R.noGuardado) : ok(R.guardado);", 'm.guardar(); return ok(R.guardado);'],
  ['trucos', 'trucos.js', 'if (d && typeof d === \'object\' && !d.trucos) { d.trucos = true;', 'if (false) {'],
  ['trucos', 'trucos.js', "return cmd?.grupo === 'consola' || INOFENSIVOS.has(cmd?.nombre) || (cmd?.nombre === 'ir' && !args.length);", "return cmd?.grupo === 'consola';"],
  ['trucos', 'trucos.js', 'if (tocaHistoria) marcarHistoria(p, true);', ''],
  ['trucos', 'trucos.js', "&& !hechos.some((k) => k.endsWith(`:${o}`))", ''],
  ['reglas', 'desafio-reglas.js', 'facilitada: x.facilitada === true, trucos: x.trucos === true,', ''],
  ['reglas', 'desafio-reglas.js', 'facilitada: x.facilitada === true, trucos: x.trucos === true,', 'facilitada: !!x.facilitada, trucos: !!x.trucos,'],
  ['desafioTexto', 'desafio.js', 'const rs = sinRecords() ? null : recordDeSemilla();', 'const rs = recordDeSemilla();'],
  ['desafioTexto', 'desafio.js', 'if (!d.oleadaTerminada) marcarFacilitada();', ''],
  ['desafioTexto', 'desafio.js', '    if (D().trucos) return;   // 4.25.2 (M3)', '   '],
  ['desafioTexto', 'desafio-meta-juego.js', '&& !d.trucos && !d.facilitada) {', ') {'],
  ['reventa', 'reventa.js', 'return Math.min(precio, Math.floor(costo / 10) * 10);', 'return precio;'],
  ['reventa', 'reventa.js', '  ajustarATengo(p, bien, tengo);\n', ''],
  ['reventa', 'oficios-propios.js', 'precioDelLote(t.reventa, b, precioEnTienda(b))', 'precioEnTienda(b)'],
  ['reventa', 'propiedad.js', 'precioDelLote(pu.reventa, b, precioDeConsigna(b, demanda, factor(b)))', 'precioDeConsigna(b, demanda, factor(b))'],
  ['reventa', 'propiedad.js', "  if (pu.reventa) { devolverAlSacar(p, pu.reventa, bien, q, BIENES[bien].lote); if (!Object.keys(pu.reventa).length) delete pu.reventa; }   // 4.25.2 (M4)\n", ''],
  ['reventa', 'negocios.js', '    ...(Object.keys(reventa).length ? { reventa } : {}),\n', ''],
  ['reventa', 'comercio-mundo.js', "    anotarCompraTren(P(), bien, r.cantidad, aPesos(r.precio));   // 4.25.2 (M4)\n", ''],
  ['importar', 'historia-reinicio.js', "debeReiniciar(progreso, modo) ? AVISO_HISTORIA_A_MEDIAS : ''", "''"],
  ['importar', 'transferir.js', " + (typeof extra === 'string' ? extra : '');", ';'],
  ['teclas', 'accesibilidad.js', "  if (esTeclaDelJuego(c)) return { ok: false,", '  if (false) return { ok: false,'],
  ['teclas', 'accesibilidad.js', "&& !TECLAS_RESERVADAS.includes(c) && !esTeclaDelJuego(c)) { salida[a] = c;", '&& !TECLAS_RESERVADAS.includes(c)) { salida[a] = c;'],
  ['teclas', 'accesibilidad.js', "  KeyU: 'usar lo que tenés en la mano',", ''],
  ['mundoTexto', 'historia-noche-mundo.js', "const c = typeof ctx.traducirTecla === 'function' ? ctx.traducirTecla(e.code) : e.code;", 'const c = e.code;'],
  ['mundoTexto', 'main.js', "  if (nocheMundo?.activa?.()) { nota('No podés dormir ahora',", "  if (false) { nota('No podés dormir ahora',"],
  ['mundoTexto', 'aldea-mundo.js', 'if (Number.isFinite(pos.y) && Number.isFinite(alero) && pos.y > b.sitio.y + alero) return null;', ''],
  ['mundoTexto', 'main.js', 'const ALERO_CASA_TE = 0.38 + 2.7;', 'const ALERO_CASA_TE = 0.38 + 3.62;'],
  ['mundoTexto', 'historia-ui.js', "|${Number(doc.defaultView?.innerWidth) || 0}|${doc.documentElement?.dataset?.escalaLetra || ''}`;", '`;'],
  ['mundoTexto', 'main.js', "    window.addEventListener('blur', () => { escenasMundo?.teclaSuelta({ code: 'ShiftLeft' }); });", ''],
];

try {
  // la versión de verdad tiene que pasar entera
  for (const [g, f] of Object.entries(GRUPOS)) {
    for (const [c, t] of await f(null)) { n++; if (!c) { fallas++; console.log(`FALLA [${g}] ${t}`); } }
  }
  // cada mutación tiene que hacer fallar su grupo
  let vivas = 0;
  for (const [g, archivo, de, a] of MUT) {
    let cae = false;
    try { cae = (await GRUPOS[g]({ archivo, de, a })).some(([c]) => !c); } catch (e) { if (/mutación sin texto/.test(String(e?.message))) { console.log(`FALLA mutación vieja: ${e.message}`); fallas++; continue; } cae = true; }
    n++;
    if (!cae) { vivas++; fallas++; console.log(`FALLA la mutación sigue viva [${g}] ${archivo}: ${de.slice(0, 90)}`); }
  }
  console.log(`verificar-4-25-2-guardado: ${n - fallas}/${n} bien (${MUT.length} mutaciones, ${vivas} vivas)`);
} finally {
  for (const c of copias) { try { rmSync(c, { force: true }); } catch { /* ya no está */ } }
}
process.exit(fallas ? 1 : 0);
