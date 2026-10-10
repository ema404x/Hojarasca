// 3.7.2 (granja): el enganche de la granja con el juego (sólo en el Relax). Las reglas, en granja.js; lo que se ve,
// en granja-mundo.js. Acá:
//   · lo que hace E al lado de un animal o de una obra de la granja (ordeñar, echar un fardo al comedero, echar
//     sobras a la batea, plantar y juntar la fruta, mandar a carnear) y lo que dice el aviso (lo mismo, en el mismo
//     orden: `accion(js)` da las dos cosas, como en aldea-mecanicas-mundo.js);
//   · los trueques en el menú de la charla (Don Ramón, Ayelén, Gladys e Inés), con `opciones` y `elegir` como el amor;
//   · el paso de los días (los terneros, los corderos y los lechones que nacen, la carne que te traen) con sus avisos;
//   · carnear: E una vez pregunta, E otra vez confirma; un fundido (no se ve nada) y Don Ramón se lo lleva.
// `ctx`: { progreso(), ajustes(), desafio(), mundo (granja-mundo.js), obras() → [obra], terminada(obra), corral() →
// { x, z, radio } | null, ovejas() → [{ x, z }], jugador() → estado, nota(t, sub, nueva), guardar(), refrescarBarra(),
// sumarEntrada(k, n), sumarMaterial(k, n), registrar(id), sonido }
import { GRANJA, FRUTALES, QUIENES_GRANJA, TRUEQUE_GRANJA, sanearGranja, avanzarGranja, entregas, ordenar, echarFardo, echarSobras, sobraParaEchar, carnear, esNovillo, corderoListo, esCapon, claveFrutal, frutalNuevo, plantar, elegirPlantin, estadoFrutal, cosecharFrutal, primeraFruta, inviernoGranja, hacerTrueque, opcionesTrueque, textoVaca, textoTernero, textoCordero, textoLechon, textoChancha, textoTambo, textoChiquero, textoFrutal } from './granja.js';
import { TAMBO, CHIQUERO } from './planos-granja.js';

const TITULO_MENU = { ramon: 'Cambiar algo de campo…', veterinaria: 'Lo de la chancha…', madre: 'Plantines de frutales…', herbolaria: 'Matas de frambuesa y de grosella…' };
const PREGUNTA = { ramon: 'Algo de campo te puedo cambiar, m\'hijo. ¿Qué andás necesitando?', veterinaria: 'Tengo una chancha que no sé dónde meter. ¿La querés?', madre: '¿Te gustan los frutales? Tengo plantines de los del patio.', herbolaria: 'Tengo matas con raíz, de las que dan fruta fina.' };
const NOMBRE_ANIMAL = { novillo: 'el novillo', cordero: 'el cordero', capon: 'el capón' };
const QUE_DE = { ternero: 'novillo', cordero: 'cordero', lechon: 'capon' };
const enMundo = (l, lx, lz) => ({ x: l.x + lx * Math.cos(l.rot) + lz * Math.sin(l.rot), z: l.z - lx * Math.sin(l.rot) + lz * Math.cos(l.rot) });

export function crearGranjaJuego(ctx) {
  const progreso = () => ctx.progreso();
  const dia = () => Math.max(1, Math.floor(Number(progreso().dia) || 1));
  const horas = () => Number(progreso().horas) || 0;
  const activo = () => !ctx.desafio?.();
  const cuanto = (k) => Math.max(0, Math.floor(Number(progreso().entradas?.[k]?.cantidad) || 0));
  const invierno = () => inviernoGranja(dia(), horas(), ctx.ajustes?.()?.estacion || 'auto');
  // 3.8.4: los frutales siguen la estación fijada en Ajustes (ver faseFrutal de granja.js)
  const estacionFrutal = () => ctx.ajustes?.()?.estacion || 'auto';
  function granja() {
    const p = progreso();
    if (!p.granja || typeof p.granja !== 'object' || !Array.isArray(p.granja.terneros)) p.granja = sanearGranja(p.granja, p.dia);
    return p.granja;
  }
  // ---------------------------------------------------------------- las obras de la granja
  const lugarDe = (o) => ({ x: o.datos.x, z: o.datos.z, rot: o.datos.rot || 0, y: o.datos.y });
  const terminadas = (id) => (ctx.obras?.() || []).filter((o) => o.plano?.id === id && ctx.terminada(o));
  let cache = null;
  // Lo que hay construido: el tambo y el chiquero (el más cercano a donde vive el animal, si hay más de uno), la
  // paridera junto al corral y los hoyos de frutal.
  function lugares() {
    const g = granja();
    const masCerca = (lista, ref) => (!lista.length ? null : !ref ? lista[0] : lista.reduce((a, b) => (Math.hypot(a.datos.x - ref.x, a.datos.z - ref.z) <= Math.hypot(b.datos.x - ref.x, b.datos.z - ref.z) ? a : b)));
    const tambo = masCerca(terminadas('tambo'), g.vaca?.lugar);
    const chiquero = masCerca(terminadas('chiquero'), g.chancha?.lugar);
    const corral = ctx.corral?.() || null;
    const paridera = corral ? terminadas('paridera').find((o) => Math.hypot(o.datos.x - corral.x, o.datos.z - corral.z) <= GRANJA.radioParidera) || null : null;
    return { tambo: tambo ? lugarDe(tambo) : null, chiquero: chiquero ? lugarDe(chiquero) : null, corral, paridera: paridera ? lugarDe(paridera) : null, hoyos: terminadas('frutal') };
  }
  // ---------------------------------------------------------------- al día
  function refrescar() {
    if (!activo()) return null;
    const g = granja(), L = lugares(), d = dia(), h = horas();
    if (g.vaca && L.tambo) g.vaca.lugar = { x: L.tambo.x, z: L.tambo.z, rot: L.tambo.rot };
    if (g.chancha && L.chiquero) g.chancha.lugar = { x: L.chiquero.x, z: L.chiquero.z, rot: L.chiquero.rot };
    // la paridera: desde cuándo está (si la desarmás, deja de contar)
    if (L.paridera && !g.paridera) g.paridera = d;
    else if (!L.paridera) g.paridera = 0;
    // los hoyos: uno nuevo, vacío; uno que ya no está, se olvida
    const vivos = new Set();
    const frutales = [];
    for (const o of L.hoyos) {
      const k = claveFrutal(o.datos.x, o.datos.z);
      if (vivos.has(k)) continue;
      vivos.add(k);
      if (!g.frutales[k]) { if (Object.keys(g.frutales).length >= GRANJA.frutales) continue; g.frutales[k] = frutalNuevo(); }
      frutales.push({ clave: k, x: o.datos.x, z: o.datos.z, rot: o.datos.rot || 0, y: o.datos.y, estado: estadoFrutal(g.frutales[k], d, h, estacionFrutal()) });
    }
    for (const k of Object.keys(g.frutales)) if (!vivos.has(k)) delete g.frutales[k];
    cache = { ...L, frutales };
    ctx.mundo?.sincronizar({ granja: g, dia: d, tambo: L.tambo, chiquero: L.chiquero, corral: L.corral, paridera: L.paridera, frutales });
    return cache;
  }
  const NACIO = {
    ternero: () => ['Nació un ternero', 'La overa parió en el tambo, con la primavera'],
    corderos: (n) => [n === 1 ? 'Nació un cordero' : `Nacieron ${n} corderos`, 'En la paridera de tu corral'],
    lechones: (n) => [n === 1 ? 'La chancha tuvo un lechón' : `La chancha tuvo ${n} lechones`, 'En la casilla del chiquero'],   // 3.8.3: «tuvo 1 lechones»
  };
  function avanzar() {
    if (!activo()) return;
    const g = granja(), corral = ctx.corral?.();
    const eventos = avanzarGranja(g, dia(), { ovejas: corral ? 2 : 0 });
    for (const e of eventos) {
      const [t, sub] = NACIO[e.tipo](e.n);
      ctx.nota?.(t, sub, true);
      if (e.tipo === 'corderos') ctx.registrar?.('cordero-propio');
    }
    const llegan = entregas(g, dia(), horas());
    for (const e of llegan) {
      for (const x of e.da) ctx.sumarEntrada?.(x.k, x.n);
      const que = e.da.map((x) => `${x.n} ${x.k === 'chorizo' ? 'chorizos' : x.k === 'carne-vaca' ? 'de carne de vaca' : x.k === 'carne-cordero' ? 'de carne de cordero' : 'de carne de cerdo'}`).join(' y ');
      ctx.nota?.('Don Ramón te trajo la carne', `De ${NOMBRE_ANIMAL[e.que]}: ${que}. Está en la mochila`, true);
    }
    if (eventos.length || llegan.length) { refrescar(); ctx.refrescarBarra?.(); ctx.guardar?.(); }
  }
  let reloj = 0, relojDia = 0;
  function actualizar(dt) {
    if (!activo()) return;
    reloj -= dt; relojDia -= dt;
    if (relojDia <= 0) { relojDia = 1; avanzar(); }
    if (reloj <= 0 || !cache) { reloj = 0.5; refrescar(); }
    const js = ctx.jugador?.();
    if (js && ctx.mundo) ctx.mundo.actualizar(dt, horas(), js.pos, ctx.ovejas?.() || []);
  }

  // ---------------------------------------------------------------- lo que hace E (y dice el aviso)
  let pendiente = null;   // { tipo, id, que, hasta }: E otra vez confirma la carneada
  const ahora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function pedirCarnear(que, a) {
    pendiente = { tipo: a.tipo, id: a.id, que, hasta: ahora() + 7000 };
    ctx.nota?.(`¿Mandás ${NOMBRE_ANIMAL[que]} a carnear?`, 'Si es que sí, E otra vez: Don Ramón pasa a buscarlo y mañana a la mañana te deja la carne');
  }
  function carnearYa(p) {
    pendiente = null;
    const r = carnear(granja(), p.que, p.id, dia());
    if (!r.ok) { ctx.nota?.('Todavía no', r.faltan ? `Le ${r.faltan === 1 ? 'falta un día' : `faltan ${r.faltan} días`}` : ''); return r; }
    ctx.guardar?.();
    // un fundido: no se ve nada; cuando vuelve la imagen, ya no está
    const f = typeof document !== 'undefined' ? document.getElementById('fundido') : null;
    const despues = () => { refrescar(); ctx.nota?.(`Don Ramón se llevó ${NOMBRE_ANIMAL[p.que]}`, 'Mañana a la mañana te deja la carne', true); };
    if (f) {
      f.classList.add('activo');
      setTimeout(() => { refrescar(); setTimeout(() => { f.classList.remove('activo'); despues(); }, 700); }, 1300);
    } else despues();
    return r;
  }
  function ordenarVaca() {
    const r = ordenar(granja(), dia(), horas(), invierno());
    if (!r.ok) {
      const M = { yaHoy: ['Ya la ordeñaste hoy', 'Mañana temprano otra vez'], temprano: ['Es muy temprano', `Se ordeña de ${GRANJA.ordene[0]} a ${GRANJA.ordene[1]}`], tarde: ['Ya pasó la hora del ordeñe', 'La vaca se ordeña a la mañana: mañana temprano'], sinPasto: ['Sin pasto no da leche', 'En invierno come del comedero: echale un fardo (Don Ramón los cambia)'], sinVaca: ['No tenés vaca', 'Don Ramón te cambia una si tenés un tambo'] };
      ctx.nota?.(...(M[r.motivo] || ['No se puede', '']));
      return r;
    }
    ctx.mundo?.ordenar(3);
    ctx.sumarEntrada?.('leche', r.leche);
    ctx.sonido?.juntar?.();
    ctx.nota?.('Ordeñaste a la overa', `+${r.leche} litros de leche · llevás ${cuanto('leche')}`, true);
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return r;
  }
  function echarFardoAlComedero() {
    const g = granja(), r = echarFardo(g, cuanto('fardo'));
    if (!r.ok) { ctx.nota?.(r.motivo === 'lleno' ? 'El comedero está lleno' : r.motivo === 'sinVaca' ? 'Todavía no tenés vaca' : 'No tenés fardos', r.motivo === 'sinFardos' ? 'Don Ramón los cambia por troncos' : ''); return r; }
    ctx.sumarEntrada?.('fardo', -1);
    ctx.nota?.('Le echaste un fardo al comedero', `${g.comedero} raciones: en invierno come una por día`, true);
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return r;
  }
  function echarALaBatea() {
    const g = granja(), r = echarSobras(g, cuanto);
    if (!r.ok) { ctx.nota?.(r.motivo === 'llena' ? 'La batea está llena' : r.motivo === 'sinChancha' ? 'Todavía no tenés chancha' : 'No tenés sobras', r.motivo === 'sinSobras' ? 'Papas, habas, fruta, calafates o frutillas' : ''); return r; }
    ctx.sumarEntrada?.(r.k, -1);
    // 3.8.3: lo que pasa al comer ya (la camada que nace) se avisa: antes se tiraba y los lechones nacían sin nota
    const eventos = avanzarGranja(g, dia(), { ovejas: ctx.corral?.() ? 2 : 0 });   // si hoy no comieron, comen ya
    ctx.nota?.('Echaste sobras a la batea', g.batea ? `${g.batea} ${g.batea === 1 ? 'ración' : 'raciones'}: comen una por día` : 'La chancha se las comió en el momento', true);
    for (const e of eventos) { const [t, sub] = NACIO[e.tipo](e.n); ctx.nota?.(t, sub, true); if (e.tipo === 'corderos') ctx.registrar?.('cordero-propio'); }
    if (eventos.length) refrescar();
    ctx.refrescarBarra?.(); ctx.guardar?.();
    return r;
  }
  function usarFrutal(clave) {
    const g = granja(), f = g.frutales[clave];
    if (!f) return { ok: false };
    if (!f.especie) {
      const especie = elegirPlantin(cuanto, g.frutales);
      if (!especie) { ctx.nota?.('Hace falta un plantín', 'Gladys cambia de manzano, peral, ciruelo y cerezo; Inés, matas de frambuesa y grosella'); return { ok: false }; }
      plantar(f, especie, dia());
      ctx.sumarEntrada?.(FRUTALES[especie].plantin, -1);
      ctx.sonido?.juntar?.();
      ctx.nota?.(`Plantaste un ${FRUTALES[especie].nombre}`, `Da ${FRUTALES[especie].frutas} desde el día ${primeraFruta(f)}`, true);
      refrescar(); ctx.refrescarBarra?.(); ctx.guardar?.();
      return { ok: true, plantado: especie };
    }
    const r = cosecharFrutal(f, dia(), horas(), estacionFrutal());
    if (!r.ok) { ctx.nota?.(textoFrutal(f, dia(), horas(), null, estacionFrutal()), ''); return r; }
    ctx.sumarEntrada?.(r.k, r.n);
    ctx.sonido?.juntar?.();
    ctx.nota?.(`Juntaste ${r.n} ${FRUTALES[f.especie].frutas}`, `Llevás ${cuanto(r.k)}. No se echan a perder`, true);
    refrescar(); ctx.refrescarBarra?.(); ctx.guardar?.();
    return r;
  }
  // { texto, hacer } de lo que tenés al alcance, o null. El mismo orden para el aviso y para E.
  function accion(js) {
    if (!activo() || !js || js.enTren || js.enKayak || js.montado) return null;
    const g = granja(), d = dia(), h = horas(), pos = js.pos;
    const M = ctx.mundo;
    // 1. la carneada que preguntaste (mirando al mismo animal)
    if (pendiente && ahora() < pendiente.hasta && M) {
      const a = M.animalCerca(pos, 2.6);
      if (a && a.tipo === pendiente.tipo && a.id === pendiente.id) { const p = pendiente; return { tipo: 'carnear', texto: `Sí: que Don Ramón se lleve ${NOMBRE_ANIMAL[p.que]}`, hacer: () => carnearYa(p) }; }
    }
    // 2. un animal: si hay algo para hacer (ordeñar, mandar a carnear), eso; si es para mirar nomás (cómo está), queda
    // para el final: al lado de la batea o del comedero, E echa la comida aunque el animal ande cerca
    let mirar = null;
    // (la vaca para ordeñar gana aunque el ternero esté más cerca)
    const vacaCerca = g.vaca ? M?.animalCerca(pos, 1.7, ['vaca']) : null;
    if (vacaCerca && textoVaca(g, d, h, invierno()) === 'Ordeñar la vaca') return { tipo: 'vaca', texto: 'Ordeñar la vaca', hacer: ordenarVaca };
    let a = M?.animalCerca(pos, 1.7);
    // (y si tenés una oveja de tu corral más cerca, es para esquilarla: el aviso y E siguen con la oveja, en main.js)
    const oveja = ctx.ovejaCerca?.();
    if (a && oveja && Math.hypot(oveja.x - pos.x, oveja.z - pos.z) < a.d) a = null;
    if (a) {
      if (a.tipo === 'vaca' && g.vaca) {
        const texto = textoVaca(g, d, h, invierno());
        const r = { tipo: 'vaca', texto, hacer: ordenarVaca };
        if (texto === 'Ordeñar la vaca') return r;
        mirar = r;
      } else if (a.tipo === 'chancha' && g.chancha) mirar = { tipo: 'chancha', texto: textoChancha(g), hacer: () => ctx.nota?.(textoChancha(g), '') };
      else {
        const lista = a.tipo === 'ternero' ? g.terneros : a.tipo === 'cordero' ? g.corderos : a.tipo === 'lechon' ? g.lechones : null;
        const x = lista?.find((y) => y.id === a.id);
        if (x) {
          const que = QUE_DE[a.tipo];
          const listo = que === 'novillo' ? esNovillo(x, d) : que === 'cordero' ? corderoListo(x, d) : esCapon(x);
          const texto = a.tipo === 'ternero' ? textoTernero(x, d) : a.tipo === 'cordero' ? textoCordero(x, d) : textoLechon(x);
          if (listo) return { tipo: a.tipo, texto, hacer: () => pedirCarnear(que, a) };
          mirar = { tipo: a.tipo, texto, hacer: () => ctx.nota?.(texto, '') };
        }
      }
    }
    const L = cache || refrescar();
    if (!L) return mirar;
    // 3. el comedero del tambo
    if (L.tambo) {
      const c = enMundo(L.tambo, TAMBO.comedero.lx, TAMBO.comedero.lz + 0.6);
      if (Math.hypot(c.x - pos.x, c.z - pos.z) < 1.9) return { tipo: 'tambo', texto: textoTambo(g, cuanto('fardo')), hacer: echarFardoAlComedero };
    }
    // 4. la batea del chiquero (desde afuera del cerco)
    if (L.chiquero) {
      const b = enMundo(L.chiquero, CHIQUERO.batea.lx, CHIQUERO.batea.lz);
      if (Math.hypot(b.x - pos.x, b.z - pos.z) < 1.9) return { tipo: 'chiquero', texto: textoChiquero(g, sobraParaEchar(cuanto)), hacer: echarALaBatea };
    }
    // 5. un frutal (el más cercano)
    let fr = null, dm = 1.6;
    for (const f of L.frutales) { const dd = Math.hypot(f.x - pos.x, f.z - pos.z); if (dd < dm) { dm = dd; fr = f; } }
    if (fr && g.frutales[fr.clave]) {
      const f = g.frutales[fr.clave];
      return { tipo: 'frutal', texto: textoFrutal(f, d, h, f.especie ? null : elegirPlantin(cuanto, g.frutales), estacionFrutal()), hacer: () => usarFrutal(fr.clave) };
    }
    // 6. lo del animal que era para mirar
    return mirar;
  }

  // ---------------------------------------------------------------- los trueques en la charla
  function obrasCtx() {
    const L = cache || refrescar() || {};
    return { tambo: !!L.tambo, chiquero: !!L.chiquero, lugarTambo: L.tambo, lugarChiquero: L.chiquero };
  }
  function opciones(clave) {
    if (!activo() || !QUIENES_GRANJA.includes(clave)) return [];
    return opcionesTrueque(clave, progreso(), granja(), obrasCtx()).length ? [{ id: 'granja', titulo: TITULO_MENU[clave] }] : [];
  }
  function elegir(s, id) {
    if (!activo()) return { tipo: 'menu' };
    if (id === 'granja') return { tipo: 'menu', sub: { tipo: 'granja', texto: PREGUNTA[s.clave] || '¿Qué te hace falta?', opciones: [...opcionesTrueque(s.clave, progreso(), granja(), obrasCtx()), { id: 'volver', titulo: 'Mejor no' }], i: 0 } };
    const t = TRUEQUE_GRANJA[String(id).slice('granja:'.length)];
    if (!t || t.quien !== s.clave) return { tipo: 'menu' };
    const g = granja(), r = hacerTrueque(t, progreso(), g, dia(), obrasCtx());
    if (r.ok) {
      for (const e of r.efectos) {
        if (e.tipo === 'material') ctx.sumarMaterial?.(e.k, e.n);
        else if (e.tipo === 'entrada') ctx.sumarEntrada?.(e.k, e.n);
      }
      if (r.animal === 'vaca') { ctx.registrar?.('vaca-lechera'); setTimeout(() => ctx.nota?.('Don Ramón te trajo la overa', 'Con su ternero al pie: está en tu tambo. Se ordeña a la mañana', true), 600); }
      if (r.animal === 'chancha') { ctx.registrar?.('chancha-criolla'); setTimeout(() => ctx.nota?.('Ayelén te trajo la chancha', 'Está en tu chiquero. Con sobras en la batea, en unos días tiene lechones', true), 600); }
      refrescar(); ctx.refrescarBarra?.(); ctx.guardar?.();
    }
    return { tipo: 'renglones', renglones: r.renglones };
  }

  return {
    actualizar, accion, opciones, elegir, refrescar, avanzar, granja,
    // para las pruebas
    ordenarVaca, echarFardoAlComedero, echarALaBatea, usarFrutal, carnearYa, pedirCarnear, lugares: () => cache || refrescar(),
    frutales: () => granja().frutales, pendiente: () => pendiente,
  };
}
