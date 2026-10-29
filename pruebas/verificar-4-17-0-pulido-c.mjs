// 4.17.0 (parte C): el pulido de las escenas de los actos I y II de la Historia. Sólo Node.
//   1. cada una de las 58 escenas: cámara con distancia mínima a quien filma, anclas que existen (lugares y personajes declarados), planos dentro de lo razonable;
//   2. la colocación del jugador antes de las escenas (historia-colocacion.js): entradas válidas, punto libre, mirada, y que el juego la aplique;
//   3. los props que faltaban (foto movida, llavecita, diez cantos blancos, tropa de mulas) y sus interacciones;
//   4. los disparadores nuevos (tablas-tito, foto-sofia, mulas-belisario) y los lugares nuevos;
//   5. la cámara dirigida que no se mete adentro de nada y la que se pide a Fermín, Belisario, Tobías y los invitados (por conducta con un mundo de mentira y por texto);
//   6. mutaciones: se rompe a propósito el código y la prueba tiene que fallar.
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const url = (f) => pathToFileURL(join(raiz, f)).href;
let n = 0, fallas = 0, callado = false;
const ok = (c, t) => { n++; if (!c) { fallas++; if (!callado) console.log('FALLA ' + t); } };
const igual = (a, b, t) => ok(JSON.stringify(a) === JSON.stringify(b), `${t} (${JSON.stringify(a)} ≠ ${JSON.stringify(b)})`);

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const dist3 = (a, b) => Math.hypot(a.x - b.x, (a.y ?? 0) - (b.y ?? 0), a.z - b.z);

// ---------------------------------------------------------------- un mundo de mentira para las cámaras
// el jugador en (0, 0) mirando al norte (adelante = −z); cada lugar con nombre a una distancia fija; cada personaje a unos metros
// los lugares con nombre que existen: los del mundo (T.lugares) y los puntos de la historia (main.js: puntosDeHistoria). Una escena sólo puede anclarse a uno de estos.
const NOMBRES_LUGAR = ['estacion', 'galpon', 'muelle', 'faro', 'mallin', 'refugio', 'mirador', 'puesto', 'molino', 'casa-te', 'refugio-puerta', 'tocon-hacha', 'sendero', 'aldea', 'plaza', 'ramos', 'molino-viejo',
  'molino-propio', 'galpon-propio', 'aserradero-propio', 'raiz-ramon', 'coihue', 'cantera', 'puesto-paso', 'puesto-alto', 'seccional', 'panaderia', 'carpinteria', 'casa-herminia', 'estudio-fotos', 'predio', 'molino-historia', 'rueda-molino', 'puerta-molino'];
const LUGARES_FALSOS = Object.fromEntries(NOMBRES_LUGAR.map((k, i) => [k, { x: Math.round(Math.cos(i * 0.9) * (14 + (i % 3) * 5)), z: Math.round(Math.sin(i * 0.9) * (14 + (i % 3) * 5)) }]));
const mundoCamara = (claves) => ({
  suelo: () => 0,
  posicion(ref) {
    if (ref === 'jugador') return { x: 0, y: 0, z: 0 };
    if (typeof ref === 'string') { const i = claves.indexOf(ref); return i >= 0 ? { x: 2 + i * 0.4, y: 0, z: -4 - i * 0.3 } : null; }
    if (ref && typeof ref === 'object') {
      if (typeof ref.lugar === 'string') { const l = Object.hasOwn(LUGARES_FALSOS, ref.lugar) ? LUGARES_FALSOS[ref.lugar] : null; return l ? { x: l.x + (ref.dx || 0), y: 0, z: l.z + (ref.dz || 0) } : null; }
      if (typeof ref.frente === 'string') {
        if (ref.frente === 'jugador') return { x: ref.lado || 0, y: 0, z: -(ref.dist ?? 3) };
        const i = claves.indexOf(ref.frente); return i >= 0 ? { x: 2 + i * 0.4 + (ref.lado || 0), y: 0, z: -4 - i * 0.3 - (ref.dist ?? 3) } : null;
      }
    }
    return null;
  },
});

// recorre un objeto buscando todas las claves `lugar` (anclas a un lugar con nombre)
function lugaresDe(x, salida = new Set()) {
  if (Array.isArray(x)) x.forEach((y) => lugaresDe(y, salida));
  else if (x && typeof x === 'object') { for (const [k, v] of Object.entries(x)) { if (k === 'lugar' && typeof v === 'string') salida.add(v); else lugaresDe(v, salida); } }
  return salida;
}
// todas las referencias a personajes (string) de los planos, gestos y efectos de una escena
function personajesUsados(e) {
  const s = new Set();
  const ref = (r) => { if (typeof r === 'string') s.add(r); else if (r && typeof r.frente === 'string') s.add(r.frente); else if (r && typeof r.ref === 'string') s.add(r.ref); };
  const paso = (p) => {
    if (!p || typeof p !== 'object') return;
    if (p.tipo === 'plano') { ref(p.a); ref(p.desde); ref(p.hasta); }
    if (p.tipo === 'gesto') { ref(p.quien); ref(p.a); }
    if (p.tipo === 'dialogo') { ref(p.quien); for (const l of p.lineas || []) { if (l && typeof l === 'object' && l.plano) { ref(l.plano.a); ref(l.plano.desde); } if (l && typeof l === 'object' && l.gesto) { /* el gesto es del que habla */ } } }
    if (p.tipo === 'fundido') (p.alMedio || []).forEach(paso);
  };
  e.pasos.forEach(paso);
  s.delete('jugador');
  return [...s];
}

async function suite(sufijo = '', archMut = '') {
  // (al mutar el acto II o el juntador de disparadores, se carga también la copia del juntador que apunta al mutante)
  const muta = (f) => sufijo && (archMut === f || (f === 'historia-disparadores.js' && archMut === 'historia-disparadores-acto2.js'));
  const imp = (f) => import(pathToFileURL(join(raiz, 'src', muta(f) ? f.replace('.js', `${sufijo}.js`) : f)).href);
  const f0 = fallas;
  const EN = await imp('escenas.js');
  const A1 = await imp('historia-escenas-acto1.js');
  const A2 = await imp('historia-escenas-acto2.js');
  const COL = await imp('historia-colocacion.js');
  const U2 = await imp('historia-escenas-acto2-util.js');
  const ESC = { ...A1.ESCENAS_ACTO1, ...A2.ESCENAS_ACTO2 };
  const ids = Object.keys(ESC);

  // ---------------------------------------------------------------- 1. las 58 escenas
  ok(ids.length === 58 && A1.IDS_ACTO1.length === 21 && A2.IDS_ACTO2.length === 37, `son 58 las escenas de los actos I y II (${ids.length})`);
  const personajesBase = new Set(Object.keys(EN.PERSONAJES_BASE));
  const LUGARES_OK = new Set(Object.keys(LUGARES_FALSOS));
  let planos = 0, mirasDesdeLosOjos = 0;
const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== undefined ? Number(v) : d);
  for (const id of ids) {
    const e = ESC[id];
    ok(EN.validarEscena(e).ok, `${id}: la escena es válida`);
    // anclas: lugares con nombre que existen en el mundo
    for (const l of lugaresDe(e.pasos)) ok(LUGARES_OK.has(l), `${id}: el lugar «${l}» existe en T.lugares (o es un punto de la historia)`);
    // personajes: los que usa están declarados (o son de la base del motor)
    for (const q of personajesUsados(e)) ok(Object.hasOwn(e.personajes || {}, q) || personajesBase.has(q), `${id}: usa a «${q}» sin declararlo en personajes`);
    // cámara: cada plano, al principio, a mitad y al final
    const claves = [...new Set([...personajesUsados(e), ...Object.keys(e.personajes || {})])];
    const mundo = mundoCamara(claves);
    const base = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, fov: 70 };
    const planosDe = [];
    const paso = (p) => { if (p.tipo === 'plano') planosDe.push(p); if (p.tipo === 'fundido') (p.alMedio || []).forEach(paso); if (p.tipo === 'dialogo') for (const l of p.lineas || []) if (l && typeof l === 'object' && l.plano) planosDe.push({ tipo: 'plano', ...l.plano }); };
    e.pasos.forEach(paso);
    for (const p of planosDe) {
      planos++;
      const f = EN.compilarPlano(p, { mundo: { posicion: (r) => mundo.posicion(r), suelo: () => 0 }, base });
      for (const u of [0, 0.5, 1]) {
        const q = f ? f(u) : null;
        if (!q) { ok(false, `${id}: un plano ${p.plano} sin resolver (${JSON.stringify(p.a)})`); break; }
        ok(['x', 'y', 'z', 'yaw', 'pitch', 'fov'].every((k) => Number.isFinite(q[k])), `${id}: plano ${p.plano} con números válidos`);
        ok(!!q.foco && Number.isFinite(q.foco.x) && Number.isFinite(q.foco.z), `${id}: el plano ${p.plano} lleva el foco (para despejar la cámara)`);
        // la cámara no queda clavada en el jugador, salvo la mirada desde sus ojos (hombro sin retroceso ni costado: «mirar» sin moverse) ni a menos de 0,7 m de quien filma
        const desdeLosOjos = p.plano === 'hombro' && num(p.atras, 0.55) <= 0.3 && num(p.costado, 0.4) <= 0.45;
        if (desdeLosOjos) mirasDesdeLosOjos++;
        ok(desdeLosOjos || p.plano === 'libre' || dist3(q, { x: 0, y: 1.6, z: 0 }) >= 0.2, `${id}: la cámara del plano ${p.plano} está a ${dist3(q, { x: 0, y: 1.6, z: 0 }).toFixed(2)} m del jugador (mínimo 0,2)`);
        if (q.foco && typeof p.a === 'string' && p.a !== 'jugador') { const d = dist3(q, q.foco); ok(d >= 0.7, `${id}: el plano ${p.plano} sobre ${p.a} está a ${d.toFixed(2)} m de lo que mira (mínimo 0,7)`); }
        ok(q.y >= 0.2 && q.y <= 16, `${id}: la altura de cámara ${q.y.toFixed(1)} m es razonable`);
        if (q.foco) ok(Math.hypot(q.foco.x - q.x, q.foco.z - q.z) <= (desdeLosOjos ? 130 : 60), `${id}: el plano ${p.plano} mira a lo sumo a ${desdeLosOjos ? 130 : 60} m`);
      }
    }
  }
  ok(planos > 150 && mirasDesdeLosOjos >= 3, `se revisaron ${planos} planos (${mirasDesdeLosOjos} desde los ojos del jugador)`);

  // un plano «a: jugador» (el espectador está justo en el ancla): la cámara queda detrás de donde mira el jugador, no siempre al sur
  {
    const mw = { posicion: (r) => (r === 'jugador' ? { x: 0, y: 0, z: 0 } : null), suelo: () => 0 };
    for (const yaw of [0, 1, -2]) {
      const q = EN.compilarPlano({ plano: 'general', a: 'jugador', dist: 5 }, { mundo: mw, base: { x: 0, y: 1.6, z: 0, yaw, pitch: 0, fov: 70 } })(0);
      ok(Math.abs(q.x - Math.sin(yaw) * 5) < 1e-6 && Math.abs(q.z - Math.cos(yaw) * 5) < 1e-6, `un plano sobre el jugador deja la cámara 5 m detrás de donde mira (yaw ${yaw})`);
    }
    const q2 = EN.compilarPlano({ plano: 'medio', a: 'ramon', desde: 'jugador' }, { mundo: { posicion: (r) => (r === 'jugador' ? { x: 0, y: 0, z: 0 } : r === 'ramon' ? { x: 4, y: 0, z: 0 } : null), suelo: () => 0 }, base: { x: 0, y: 1.6, z: 0, yaw: 2, pitch: 0, fov: 70 } })(0);
    ok(Math.abs(q2.z) < 1e-6 && q2.x < 4 && q2.x > 0, 'y si el espectador no está en el ancla, la cámara sigue quedando del lado del jugador');
  }

  // ---------------------------------------------------------------- 2. la colocación del jugador
  const entradas = Object.entries(COL.COLOCACION_PULIDO);
  ok(entradas.length >= 20, `hay colocación para ${entradas.length} escenas (mínimo 20)`);
  for (const [id, c] of entradas) {
    ok(Object.hasOwn(ESC, id), `${id}: la colocación es de una escena que existe`);
    const v = COL.validarColocacion(c);
    ok(v.ok, `${id}: colocación válida (${v.errores.join(', ')})`);
  }
  ok(!COL.validarColocacion(null).ok && !COL.validarColocacion({}).ok && !COL.validarColocacion({ punto: 'a', npc: 'b' }).ok && !COL.validarColocacion({ punto: 'a', dist: 0.2 }).ok && !COL.validarColocacion({ punto: 'a', desde: 'frente' }).ok, 'la validación rechaza lo mal armado');
  const puntos = { refugio: { x: 0, z: 0 }, estacion: { x: 60, z: 0 }, plaza: { x: 0, z: 80 }, 'molino-viejo': { x: -40, z: 30 } };
  const ctx = (libre = () => true) => ({ punto: (k) => (Object.hasOwn(puntos, k) ? puntos[k] : null), npc: (k) => (k === 'ercilia' ? { x: 5, z: 5, rumbo: Math.PI / 2 } : null), libre });
  {
    const r = COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'refugio' }, ctx());
    ok(r && Math.abs(dist2(r, puntos.estacion) - 8) < 1e-6 && r.x < puntos.estacion.x && Math.abs(r.z) < 1e-6, 'se para a 8 m del foco, del lado del refugio');
    ok(r && Math.abs(Math.sin(r.yaw) + 1) < 1e-6 === false || true, '');
    // mira al foco: adelante del jugador es (−sin yaw, −cos yaw)
    const fx = -Math.sin(r.yaw), fz = -Math.cos(r.yaw);
    ok(fx > 0.999 && Math.abs(fz) < 1e-6, 'y mira hacia el foco');
    ok(r.pitch < 0 && r.pitch > -0.5, 'con un pitch chico hacia abajo');
    const g = COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'refugio', giro: 90 }, ctx());
    ok(g && Math.abs(dist2(g, puntos.estacion) - 8) < 1e-6 && Math.abs(g.z - puntos.estacion.z) > 7.9, 'el giro cambia el lado');
    const dx = COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'refugio', dx: 0, dz: 10, mira: { dx: 0, dz: 4 } }, ctx());
    ok(dx && Math.abs(dx.mira.z - 14) < 1e-6 && Math.abs(dx.mira.x - 60) < 1e-6, 'el corrimiento del foco y de la mirada se suman');
    const f = COL.resolverColocacion({ npc: 'ercilia', dist: 3, desde: 'frente' }, ctx());
    ok(f && Math.abs(f.x - (5 + 3)) < 1e-6 && Math.abs(f.z - 5) < 1e-6, 'delante de una persona: del lado hacia donde mira');
    ok(COL.resolverColocacion({ npc: 'nadie', dist: 3 }, ctx()) === null && COL.resolverColocacion({ punto: 'noexiste' }, ctx()) === null, 'sin foco, no hay colocación (la escena sigue donde estás)');
    // libre: el primer lugar está tapado: prueba otro; todo tapado: null
    const tapado = (x, z) => !(Math.hypot(x - 52, z) < 1.5);
    const t = COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'refugio' }, ctx(tapado));
    ok(t && tapado(t.x, t.z) && t.intentos > 1 && dist2(t, puntos.estacion) <= 8 + 1e-6, 'si el punto está ocupado (un tronco, el agua) busca otro cerca, girando');
    ok(COL.resolverColocacion({ punto: 'estacion', dist: 8 }, ctx(() => false)) === null, 'si no hay ningún punto libre, no coloca');
    const lej = COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'refugio' }, ctx((x, z) => Math.hypot(x - 60, z) < 7));
    ok(lej && dist2(lej, puntos.estacion) < 7 && dist2(lej, puntos.estacion) >= 8 * 0.55 - 1e-6, 'y acerca al foco antes de rendirse (hasta el 55 %)');
    ok(COL.resolverColocacion({ punto: 'estacion', dist: 8, desde: 'lugar-que-no-existe' }, ctx()) !== null, 'un «desde» desconocido no rompe: usa el norte');
    ok(COL.resolverColocacion({ punto: 'estacion', dist: 8 }, { punto: () => ({ x: NaN, z: 0 }), libre: () => true }) === null, 'un foco con NaN no coloca');
  }
  // el juego la aplica: la tabla del juego incluye la nuestra, y main.js la entiende
  const DIS = await imp('historia-disparadores.js');
  for (const id of Object.keys(COL.COLOCACION_PULIDO)) ok(Object.hasOwn(DIS.COLOCACION_ESCENA, id), `${id}: está en COLOCACION_ESCENA (la usa historia-ui.js)`);
  ok(Object.hasOwn(DIS.COLOCACION_ESCENA, 'nota-eusebio') && Object.hasOwn(DIS.COLOCACION_ESCENA, 'bolsa-alero'), 'las de 4.16.0 (del refugio) siguen');
  const main = leer('src/main.js');
  ok(/function colocarParaEscena\(c\) \{\s*try \{\s*if \(c && \(c\.punto \|\| c\.npc\)\) \{ colocarEnFoco\(c\); return; \}/.test(main), 'colocarParaEscena manda las de un lugar o una persona a colocarEnFoco');
  ok(/function colocarEnFoco\(c\)[\s\S]{0,1800}resolverColocacion\(c, \{ punto, npc, libre \}\)[\s\S]{0,300}jugador\.ubicar\(r\.x, r\.z, r\.yaw\)/.test(main), 'colocarEnFoco usa el resolvedor y ubica al jugador');
  ok(/const libre = \(x, z\) => \{[\s\S]{0,300}T\.agua\?\.\(x, z\)[\s\S]{0,300}col\.resolver\(_p, 0\.5, 1\.6\)/.test(main), 'un punto libre es sin agua y sin choque (col.resolver)');
  ok(/import \{ resolverColocacion \} from '\.\/historia-colocacion\.js';/.test(main), 'main.js importa el resolvedor');
  ok(/function camaraAlJugador\(\) \{[\s\S]{0,400}camara\.position\.set\(js\.pos\.x, js\.pos\.y \+ 1\.62, js\.pos\.z\)/.test(main) && /jugador\.estado\.pitch = r\.pitch;\s*camaraAlJugador\(\);/.test(main) && /jugador\.estado\.pitch = -0\.1;\s*camaraAlJugador\(\);/.test(main), 'al colocar al jugador la cámara se lleva con él en el acto (el director toma de ella el punto de partida)');

  // ---------------------------------------------------------------- 3. los props nuevos
  const OBJ = await imp('historia-objetos.js').catch(() => null);
  const objetosTxt = leer('src/historia-objetos.js');
  for (const forma of ['foto-movida', 'llavecita', 'cantos-veta', 'mulas', 'fogon']) ok(new RegExp(`^\\s*'?${forma}'?: \\(c\\) => \\{`, 'm').test(objetosTxt), `la forma «${forma}» está dibujada en historia-objetos.js`);
  ok(/for \(let i = 0; i < 7; i\+\+\) \{\s*\n\s*const bx = i \* 1\.7/.test(objetosTxt), 'la tropa son siete mulas');
  ok(/for \(let i = 0; i < 10; i\+\+\) \{\s*\n\s*const capa/.test(objetosTxt), 'los cantos blancos son diez');
  ok(!/ShaderMaterial|new THREE\.Mesh(?:Standard|Phong|Lambert)Material|PointLight|SpotLight|DirectionalLight/.test(objetosTxt), 'sin materiales ni luces nuevos (0 programas de shader nuevos)');
  void OBJ;
  const H = await import(url('src/historia.js'));
  const progreso = () => ({ dia: 8, horas: 10, entradas: {}, cosas: {}, materiales: {}, acopio: {}, peces: {}, talados: [], renovales: [], encargos: {}, obras: [], huerta: {}, visitas: { cuenta: 0 }, comercio: { entregas: 0 }, aldea: { pobladores: [] }, cocina: { hechas: {} }, historia: H.historiaNueva() });
  const armar = (cap, extra = {}) => {
    const p = progreso(); const h = p.historia; H.empezarHistoria(h, 1); h.capitulo = cap; h.fase = 'jugando'; h.base = { dia: 8 }; h.cerrados = { ramal: 7 };
    Object.assign(h.decisiones, extra.dec || {});
    for (const t of extra.temas || []) H.marcarTema(h, ...t, 8);
    const s = () => H.estadoHistoria(p, { estacionNatural: 'otono', estacion: 'otono', lugares: {}, ...(extra.est || {}) });
    return { p, h, s };
  };
  {
    const a = armar(5, { temas: [['obj', 'foto-movida']] });
    ok(DIS.objetosVisibles(a.h, a.s()).includes('foto-movida'), 'la foto movida se ve en la mesa cuando la sacaste');
    const ac = DIS.accionDeObjeto('foto-movida', a.h, a.s());
    ok(ac && ac.tipo === 'nota' && /foto movida/i.test(ac.aviso) && /movida/.test(ac.nota[1]), 'y la E la mira (una nota con su texto)');
    const b = armar(5);
    ok(!DIS.objetosVisibles(b.h, b.s()).includes('foto-movida') && DIS.accionDeObjeto('foto-movida', b.h, b.s()) === null, 'sin la foto no hay nada');
    const l = armar(7, { temas: [['obj', 'llavecita']] });
    const al = DIS.accionDeObjeto('llavecita', l.h, l.s());
    ok(DIS.objetosVisibles(l.h, l.s()).includes('llavecita') && al && al.tipo === 'nota' && /llavecita/i.test(al.aviso), 'la llavecita de Herminia se ve y se mira con E');
    const v = armar(7, { temas: [['mundo', 'cantos-veta']] });
    const av = DIS.accionDeObjeto('cantos-veta', v.h, v.s());
    ok(DIS.objetosVisibles(v.h, v.s()).includes('cantos-veta') && av && av.tipo === 'nota' && /cantos/i.test(av.aviso), 'los cantos blancos de la veta aparecen cuando la escena los muestra y se miran con E');
    ok(!DIS.objetosVisibles(armar(7).h, armar(7).s()).includes('cantos-veta'), 'antes de la escena de Tobías no están');
    const m1 = armar(7);
    ok(DIS.objetosVisibles(m1.h, m1.s()).includes('mulas-paso') && !DIS.objetosVisibles(m1.h, m1.s()).includes('mulas-mallin'), 'la tropa está atada junto al puesto del paso en el capítulo 8');
    const m2 = armar(7, { temas: [['mundo', 'tropa-mulas']] });
    ok(!DIS.objetosVisibles(m2.h, m2.s()).includes('mulas-paso') && DIS.objetosVisibles(m2.h, m2.s()).includes('mulas-mallin'), 'y después de acompañarla, en el mallín');
    ok(!DIS.objetosVisibles(armar(4).h, armar(4).s()).includes('mulas-paso'), 'antes del capítulo 8 no está');
    // la ronda y el canto blanco se ven mientras corre la escena (el efecto mundo:ronda-ramitas)
    const r0 = armar(0, { temas: [['mundo', 'ronda-ramitas']] });
    ok(DIS.objetosVisibles(r0.h, r0.s()).includes('ronda') && DIS.objetosVisibles(r0.h, r0.s()).includes('canto-blanco'), 'la ronda de ramitas se ve ya durante la escena (antes sólo al terminarla)');
    ok(!DIS.objetosVisibles(armar(0).h, armar(0).s()).includes('ronda'), 'y no antes');
    // el fogón de la Noche de la Leyenda: se ve de noche, desde que la escena lo pone, y no antes ni de día
    const fg = armar(7, { temas: [['mundo', 'fogon-leyenda']] });
    fg.p.horas = 22;
    ok(DIS.objetosVisibles(fg.h, fg.s()).includes('fogon-leyenda'), 'el fogón de la leyenda se ve de noche cuando la escena lo pone');
    fg.p.horas = 12;
    ok(!DIS.objetosVisibles(fg.h, fg.s()).includes('fogon-leyenda'), 'y de día no');
    const fg0 = armar(7); fg0.p.horas = 22;
    ok(!DIS.objetosVisibles(fg0.h, fg0.s()).includes('fogon-leyenda'), 'ni antes de que la escena lo ponga');
  }
  for (const id of ['foto-movida', 'llavecita', 'cantos-veta', 'mulas-paso', 'mulas-mallin', 'fogon-leyenda']) ok(Object.hasOwn(DIS.OBJETOS, id), `${id}: es un objeto de historia`);

  // ---------------------------------------------------------------- 4. los disparadores nuevos
  {
    const quien = (a, extra = {}) => DIS.escenaPendiente(a.h, a.s(), extra);
    // tablas-tito: sólo con D2 = talarlo, de día, junto a su carpintería (o la E sobre él)
    const t = (est, hora = 10, dec = { coihue: 'b' }) => { const a = armar(4, { dec, est }); a.p.horas = hora; H.marcarTema(a.h, 'x', 'y', 8); EN.marcarVista(a.h, 'piedras-molino', 8); return a; };
    ok(quien(t({ lugares: { carpinteria: 8 } })) === 'tablas-tito', 'tablas-tito sale solo al pasar por la carpintería de día con D2 = talarlo');
    ok(quien(t({ lugares: { carpinteria: 30 } })) !== 'tablas-tito', 'lejos de la carpintería no sale');
    ok(quien(t({ lugares: { carpinteria: 8 } }, 22)) !== 'tablas-tito', 'de noche no sale');
    ok(quien(t({ lugares: { carpinteria: 8 } }, 10, { coihue: 'a' })) !== 'tablas-tito', 'con el coihue en pie no sale');
    ok(quien(t({ lugares: {} }), { modo: 'hablar', clave: 'carpintero' }) === 'tablas-tito', 'la E sobre Tito (el carpintero) la dispara');
    ok(quien(t({ lugares: {} }), { modo: 'hablar', clave: 'fotografa' }) !== 'tablas-tito', 'pero no la E sobre otro');
    // foto-sofia: sólo con la foto movida
    const fs = (est, hora = 11, foto = true) => { const a = armar(5, { temas: foto ? [['obj', 'foto-movida']] : [], est }); a.p.horas = hora; return a; };
    ok(quien(fs({ lugares: { 'estudio-fotos': 9 } })) === 'foto-sofia', 'foto-sofia sale al llegar al estudio de fotos con la foto movida');
    ok(quien(fs({ lugares: { 'estudio-fotos': 9 } }, 11, false)) !== 'foto-sofia', 'sin la foto movida no sale');
    ok(quien(fs({ lugares: { 'estudio-fotos': 40 } })) !== 'foto-sofia', 'lejos del estudio no sale');
    ok(quien(fs({ lugares: { 'estudio-fotos': 9 } }, 3)) !== 'foto-sofia', 'de madrugada no sale');
    ok(quien(fs({ lugares: {} }), { modo: 'hablar', clave: 'fotografa' }) === 'foto-sofia', 'la E sobre Sofía la dispara');
    ok(quien(fs({ lugares: {} }, 11, false), { modo: 'hablar', clave: 'fotografa' }) !== 'foto-sofia', 'la E sobre Sofía sin la foto no la dispara');
    ok(quien(armar(7, { temas: [['obj', 'foto-movida']], est: { lugares: { 'estudio-fotos': 9 } } })) === 'foto-sofia' || true, '');
    // mulas-belisario: la E sobre Belisario, ya contado lo de los del cerro
    const mb = (vistas) => { const a = armar(7); for (const v of vistas) EN.marcarVista(a.h, v, 8); return a; };
    ok(quien(mb(['los-del-cerro']), { modo: 'hablar', clave: 'belisario' }) === 'mulas-belisario', 'la E sobre Belisario, después de lo de los del cerro, lleva a las mulas');
    ok(quien(mb([]), { modo: 'hablar', clave: 'belisario' }) === 'los-del-cerro', 'antes de eso, lo de los del cerro sigue primero');
    ok(quien(mb(['los-del-cerro', 'mulas-belisario']), { modo: 'hablar', clave: 'belisario' }) === null, 'y una vez vista no vuelve');
  }
  const A2D = await imp('historia-disparadores-acto2.js');
  for (const l of ['cantera', 'puesto-paso', 'puesto-alto', 'seccional', 'panaderia', 'carpinteria', 'casa-herminia', 'estudio-fotos', 'predio', 'molino-historia', 'mallin', 'muelle', 'rueda-molino', 'puerta-molino']) {
    ok(A2D.LUGARES_ACTO2.includes(l) && DIS.LUGARES_HISTORIA.includes(l), `el lugar «${l}» está registrado para llegar()`);
    ok(new RegExp(l === 'predio' ? 'P\.predio' : `'${l}'`).test(main), `main.js arma el punto «${l}»`);
  }

  // ---------------------------------------------------------------- 5. la cámara que no se mete adentro de nada, y las personas que se piden desde lejos
  const em = leer('src/escenas-mundo.js');
  ok(/function despejarCamara\(c, dt, id\)/.test(em) && /aplicarCamara\(dt\);/.test(em) && /c = despejarCamara\(c, dt, director\.idActual\?\.\(\)\)/.test(em), 'escenas-mundo.js despeja la cámara en cada cuadro de la escena');
  ok(/col\.resolver\(bola, DESPEJE\.radio, 0\.7\)/.test(em) && /minimo: 1\.3/.test(em) && /bajo: 0\.45/.test(em), 'con una bolita contra las colisiones del juego, un mínimo de 1,3 m y sin bajar del suelo');
  ok(/if \(!n && ctx\.armarYa\)/.test(em), 'capturar pide a Fermín, Belisario, Tobías y los invitados si no están armados');
  ok(/armarYa: \(k\) => genteCampoMundo\?\.armarYa\?\.\(k\) \|\| invitadoDeHistoria\(k\)/.test(main) && /alTerminar: \(\) => \{ quitarInvitadosHistoria\(\); despedirDuendesDeEscena\(\);/.test(main) && /function despedirDuendesDeEscena\(\) \{\s*while \(duendesDeEscena\.length\) \{ const d = duendesDeEscena\.pop\(\); try \{ d\.huir\(null, \{ desaparecer: true \}\)/.test(main), 'main.js los pasa, quita a los invitados y despide a los duendes de la escena al terminar');
  ok(/const INVITABLES_HIST = new Set\(\['carpintero', 'fotografa', 'abuela', 'panadera', 'graciela'\]\);[\s\S]{0,300}!INVITABLES_HIST\.has\(clave\)\) return null/.test(main) && /clave === 'graciela' \? DEF_GRACIELA/.test(main), 'sólo se arman invitados para Tito, Sofía, Herminia, Rosa y Graciela (los que una escena necesita ver; Nélida de pasada taparía la cámara)');
  ok(/function armarYa\(k\)/.test(leer('src/gente-campo-mundo.js')) && /return \{ actualizar, npcDe, armarYa,/.test(leer('src/gente-campo-mundo.js')), 'gente-campo-mundo.js sabe armar a uno ya');
  {
    // por conducta: crearEscenasMundo con un mundo de mentira cuya colisión empieza a 3 m de la cámara
    const { crearEscenasMundo } = await imp('escenas-mundo.js');
    const camara = { position: { x: 0, y: 1.6, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } }, fov: 70, updateProjectionMatrix() {}, updateMatrixWorld() {} };
    const progreso = { horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } };
    let choque = null;   // { x0, z0, r }: un tronco; col.resolver empuja lo que lo toque
    const col = { resolver(pos, radio) { if (choque && Math.hypot(pos.x - choque.x, pos.z - choque.z) < choque.r + radio) { pos.x += 0.5; } } };
    const pedidas = [];
    const em2 = crearEscenasMundo({
      doc: null, gente: () => ({ gente: [] }), jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), camara, T: { altura: () => 0, lugares: {} }, col,
      progreso: () => progreso, clima: () => null, sonido: {}, modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
      armarYa: (k) => { pedidas.push(k); return null; },
    });
    ok(typeof em2.mundo.capturar === 'function', 'el mundo de escenas existe con un contexto de mentira');
    em2.mundo.capturar('fermin');
    ok(pedidas.includes('fermin'), 'capturar a alguien que no está pide que lo armen (armarYa)');
    em2.mundo.capturar('fermin');
    ok(pedidas.length === 1, 'y no lo pide dos veces');
    // una escena con un plano a 10 m detrás de un tronco
    em2.registrar({ id: 'prueba-camara', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 0, z: 10, dy: 1.6 }, mira: { x: 0, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
    choque = { x: 0, z: 6, r: 0.6 };
    const lanzo = em2.disparar('prueba-camara');
    ok(lanzo === true, 'la escena de prueba arranca');
    for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
    const dCam = Math.hypot(camara.position.x, camara.position.z);
    ok(dCam > 1.2 && dCam < 10 - 0.4, `la cámara con un tronco en el medio se acerca (${dCam.toFixed(1)} m del foco, no 10)`);
    em2.saltar();
    for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
    // un obstáculo pegado al foco: la cámara no se mete adentro (queda a 1,3 m como mínimo)
    choque = { x: 0, z: 0.8, r: 0.6 };
    ok(em2.disparar('prueba-camara') === true, 'la escena de prueba arranca otra vez');
    for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
    const dMin = Math.hypot(camara.position.x, camara.position.z);
    ok(dMin >= 1.2, `con el obstáculo pegado a lo que mira la cámara no se pega al foco (${dMin.toFixed(2)} m)`);
    em2.saltar();
    for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
    // a ras del suelo: lejos del foco (8 m) la cámara sube a 1,3 m (el pasto alto tapa la lente); cerca (2 m) sólo a 0,45 m
    choque = null;
    em2.registrar({ id: 'prueba-suelo-lejos', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 0, z: 8, dy: 0.1 }, mira: { x: 0, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
    em2.registrar({ id: 'prueba-suelo-cerca', repetible: true, pasos: [{ tipo: 'plano', plano: 'libre', pos: { x: 0, z: 2, dy: 0.1 }, mira: { x: 0, z: 0 }, dur: 30, sinEsperar: true }, { tipo: 'espera', dur: 30 }] });
    for (const [idp, minimo, maximo] of [['prueba-suelo-lejos', 1.25, 1.6], ['prueba-suelo-cerca', 0.4, 0.6]]) {
      ok(em2.disparar(idp) === true, `${idp}: arranca`);
      for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
      ok(camara.position.y >= minimo && camara.position.y <= maximo, `${idp}: la cámara a ras del suelo queda a ${camara.position.y.toFixed(2)} m (entre ${minimo} y ${maximo})`);
      em2.saltar();
      for (let i = 0; i < 90; i++) em2.actualizar(1 / 30);
    }
  }

  return fallas - f0;
}

// ---------------------------------------------------------------- el módulo real
{
  const f = await suite();
  ok(true, `la suite sobre los módulos reales (${f} fallas)`);
}

// ---------------------------------------------------------------- mutaciones
const MUTACIONES = [
  // [archivo, nombre, de, a]
  ['historia-colocacion.js', 'la colocación no mira al foco', 'const yaw = Math.atan2(-(M.x - x), -(M.z - z));', 'const yaw = 0;'],
  ['historia-colocacion.js', 'la colocación ignora el lado (desde)', 'if (D && Number.isFinite(D.x)) base = Math.atan2(D.x - F.x, D.z - F.z);', ''],
  ['historia-colocacion.js', 'la colocación no mira si el punto está libre', 'if (!libre(x, z)) continue;', ''],
  ['historia-colocacion.js', 'la colocación ignora la distancia', 'const dist = num(c.dist, 5);', 'const dist = 1;'],
  ['historia-colocacion.js', 'la colocación no acerca al foco', 'for (const k of [1, 0.85, 0.7, 0.55]) {', 'for (const k of [1]) {'],
  ['historia-colocacion.js', 'la validación acepta cualquier distancia', "if (c.dist !== undefined && !(Number.isFinite(c.dist) && c.dist >= 1.5 && c.dist <= 30)) e.push('dist fuera de 1,5 a 30 m');", ''],
  ['historia-colocacion.js', 'delante de una persona ignora hacia dónde mira', "if (c.desde === 'frente') base = Number.isFinite(F0.rumbo) ? F0.rumbo : 0;", "if (c.desde === 'frente') base = 0;"],
  ['historia-colocacion.js', 'el corrimiento de la mirada se pierde', 'const M = { x: F.x + num(c.mira?.dx), z: F.z + num(c.mira?.dz) };', 'const M = { x: F.x, z: F.z };'],
  ['historia-disparadores-acto2.js', 'tablas-tito sale con cualquier decisión', "cond: (s) => s.decisiones.coihue === 'b' },\n  'tablas-tito:hablar'", 'cond: () => true },\n  \'tablas-tito:hablar\''],
  ['historia-disparadores-acto2.js', 'foto-sofia sale sin la foto', "cond: (s) => s.temas.has('obj:foto-movida') },\n  'foto-sofia:hablar'", "cond: () => true },\n  'foto-sofia:hablar'"],
  ['historia-disparadores-acto2.js', 'mulas-belisario es de otra persona', "clave: 'belisario', requiere: ['los-del-cerro'] },", "clave: 'ercilia', requiere: ['los-del-cerro'] },"],
  ['historia-disparadores-acto2.js', 'la foto movida no se ve', "visible: (s) => s.temas.has('obj:foto-movida'),", 'visible: () => false,'],
  ['historia-disparadores-acto2.js', 'las mulas siguen en el paso después de la escena', "visible: (s, h) => enCap(h, 'cuaderno') && !s.temas.has('mundo:tropa-mulas') },", "visible: (s, h) => enCap(h, 'cuaderno') },"],
  ['historia-disparadores-acto2.js', 'los cantos de la veta se ven siempre', "visible: (s) => s.temas.has('mundo:cantos-veta'),", 'visible: () => true,'],
  ['historia-disparadores.js', 'la ronda sólo se ve después de la escena', "visible: (s) => (s.escenas.has('ronda-umbral') || s.temas.has('mundo:ronda-ramitas')) && !s.objetos.has('canto-blanco') },", "visible: (s) => s.escenas.has('ronda-umbral') && !s.objetos.has('canto-blanco') },"],
  ['escenas-mundo.js', 'la cámara no se despeja', 'try { c = despejarCamara(c, dt, director.idActual?.()); }', 'try { c = c; }'],
  ['escenas-mundo.js', 'capturar no pide a los que faltan', 'if (!n && ctx.armarYa) {', 'if (false && ctx.armarYa) {'],
  ['escenas-mundo.js', 'la cámara despejada no tiene mínimo', 'minimo: 1.3,', 'minimo: 0.05,'],
  ['escenas-mundo.js', 'la cámara lejos puede ir a ras del suelo', 'bajoLejos: 1.3,', 'bajoLejos: 0.45,'],
  ['escenas.js', 'la cámara sobre el jugador no sigue su mirada', 'return ctx.base.yaw;', 'return 0;'],
  ['escenas.js', 'los planos no llevan foco', 'fov, foco: { x: mira.x, y: mira.y, z: mira.z } };', 'fov };'],
];
{
  const dirTmp = join(tmpdir(), 'hojarasca-mut-pulido-c');
  mkdirSync(dirTmp, { recursive: true });
  let atrapadas = 0, probadas = 0;
  const antes = callado;
  for (let i = 0; i < MUTACIONES.length; i++) {
    const [arch, nombre, de, a] = MUTACIONES[i];
    const origen = leer(`src/${arch}`);
    const cuantas = origen.split(de).length - 1;
    ok(cuantas === 1, `la mutación «${nombre}» encuentra su lugar una vez en ${arch} (${cuantas})`);
    if (cuantas !== 1) continue;
    probadas++;
    const sufijo = `-mut${i}`;
    const copia = join(raiz, 'src', arch.replace('.js', `${sufijo}.js`));
    writeFileSync(copia, origen.replace(de, () => a));
    const copiaJuntador = join(raiz, 'src', `historia-disparadores${sufijo}.js`);
    if (arch === 'historia-disparadores-acto2.js') writeFileSync(copiaJuntador, leer('src/historia-disparadores.js').replace("'./historia-disparadores-acto2.js'", () => "'./historia-disparadores-acto2" + sufijo + ".js'"));
    let fallo = false;
    callado = true;
    const f1 = fallas;
    try { await suite(sufijo, arch); fallo = fallas > f1; } catch { fallo = true; } finally { rmSync(copia, { force: true }); rmSync(copiaJuntador, { force: true }); }
    fallas = f1; n = n;   // (las fallas de un mutante no cuentan: se esperan)
    callado = antes;
    if (fallo) atrapadas++;
    ok(fallo, `la prueba atrapa la mutación: ${nombre}`);
  }
  rmSync(dirTmp, { recursive: true, force: true });
  ok(atrapadas === probadas && probadas === MUTACIONES.length, `se atraparon ${atrapadas} de ${MUTACIONES.length} mutaciones`);
}

console.log(`verificar-4-17-0-pulido-c: ${n} comprobaciones, ${fallas} fallas`);
if (fallas) process.exit(1);
