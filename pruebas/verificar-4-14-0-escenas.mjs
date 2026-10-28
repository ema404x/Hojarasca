// 4.14.0: el motor de escenas de la Historia (src/escenas.js, escenas-demo.js, escenas-mundo.js y su enganche en main.js). Sólo Node.
// El director es lógica pura: se prueba con un mundo de mentira (personajes que caminan, hora, cámara). Después se prueban a mano
// MUTACIONES del código (se rompe una garantía y la prueba tiene que fallar) y, por texto, el enganche con el juego.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
let n = 0, fallas = 0;
const ok = (c, t) => { n++; if (!c) { fallas++; console.log('FALLA ' + t); } };

// ---------------------------------------------------------------- un mundo de mentira
function mundoFalso() {
  const actores = { ema: { x: 40, y: 0, z: -30, meta: null, vel: 1.4, capt: false, visible: false, pose: null, mira: null }, ramon: { x: 6, y: 0, z: -9, meta: null, vel: 1, capt: false, visible: true, pose: null, mira: null } };
  const w = {
    actores, hv: 22, horas: [], sonidos: [], climas: [], empezo: 0, termino: 0, posadas: [], tele: [], libres: [],
    puedeEmpezar: () => true,
    posicion(ref) {
      if (ref === 'jugador') return { x: 0, y: 0, z: 0 };
      if (typeof ref === 'string') { const a = Object.hasOwn(actores, ref) ? actores[ref] : null; return a ? { x: a.x, y: a.y, z: a.z } : null; }
      if (ref && ref.frente === 'jugador') return { x: ref.lado || 0, z: -(ref.dist ?? 3) };
      return null;
    },
    suelo: () => 0,
    camaraJugador: () => ({ x: 0, y: 1.6, z: 0, yaw: 0.3, pitch: -0.1, fov: 70 }),
    horaActual: () => w.hv,
    hora(h) { w.hv = h; w.horas.push(h); },
    clima(c) { w.climas.push(c); },
    sonido(id) { w.sonidos.push(id); },
    capturar(k) { if (actores[k]) actores[k].capt = true; },
    soltar(k) { if (actores[k]) { actores[k].capt = false; w.libres.push(k); } },
    caminar(k, d, o) { actores[k].meta = d; actores[k].vel = o?.vel || 1.4; },
    ocupado: (k) => !!actores[k]?.meta,
    mirar(k, p) { actores[k].mira = p; },
    posar(k, pose, dur) { w.posadas.push([k, pose, dur]); },
    aparecer(k, p) { Object.assign(actores[k], { x: p.x, y: p.y ?? 0, z: p.z, visible: true, meta: null }); },
    desaparecer(k) { actores[k].visible = false; },
    teletransportar(k, p) { Object.assign(actores[k], { x: p.x, z: p.z, meta: null }); w.tele.push(k); },
    alEmpezar() { w.empezo++; },
    alTerminar() { w.termino++; },
    simular(dt) {
      for (const a of Object.values(actores)) {
        if (!a.meta) continue;
        const dx = a.meta.x - a.x, dz = a.meta.z - a.z, d = Math.hypot(dx, dz), paso = a.vel * dt;
        if (d <= paso + 0.2) { a.x = a.meta.x; a.z = a.meta.z; a.meta = null; } else { a.x += dx / d * paso; a.z += dz / d * paso; }
      }
    },
  };
  return w;
}

// ---------------------------------------------------------------- la suite sobre un módulo `E` (el real o uno mutado)
// Devuelve la lista de lo que falló (vacía si todo está bien). Se usa igual para el módulo real y para cada mutante.
async function suite(E, DEMO, ID) {
  const f = [];
  const c = (cond, t) => { if (!cond) f.push(t); };
  const crear = (extra = {}) => {
    const mundo = mundoFalso();
    const est = { vistas: {}, elecciones: {} };
    const efectos = [];
    const resultados = [];
    const dir = E.crearDirector({ mundo, estado: () => est, dia: () => 5, efectos: { 'demo-nota': (a) => efectos.push(a), ...(extra.efectos || {}) }, alTerminar: (r) => resultados.push(r), ...(extra.opc || {}) });
    return { mundo, est, efectos, resultados, dir };
  };
  // corre hasta que termine; contesta los diálogos (Enter siempre) y la elección con `opcion`
  const correr = (T, { opcion = 0, max = 4000, dt = 0.05, antes = null } = {}) => {
    let i = 0;
    const log = { lineas: 0, planos: new Set(), eleccion: false, camaras: [], dialogos: [] };
    let ultima = '';
    while (T.dir.activa() && i++ < max) {
      T.mundo.simular(dt);
      T.dir.actualizar(dt);
      const d = T.dir.datos();
      const cam = T.dir.camara();
      if (cam) { cam.fase = T.dir.fase(); log.camaras.push(cam); log.planos.add(`${cam.x.toFixed(1)}|${cam.yaw.toFixed(1)}`); }
      if (d?.eleccion) { log.eleccion = true; T.dir.elegir(opcion); }
      else if (d?.dialogo && d.fase === 'corriendo') {
        const k = d.dialogo.nombre + d.dialogo.linea + d.dialogo.de + d.id;
        if (d.dialogo.completo) { const clave = d.dialogo.texto; if (clave !== ultima) { log.lineas++; log.dialogos.push(clave); ultima = clave; } T.dir.avanzar(); }
        else if (i % 7 === 0) T.dir.avanzar();   // a veces antes de que termine de escribir
        void k;
      }
      antes?.(T, d, i);
    }
    log.pasos = i;
    return log;
  };

  // 1) el demo es válido y está completo
  const T = crear();
  const v = T.dir.registrar(DEMO);
  c(v.ok, 'la escena demo valida: ' + (v.errores || []).join('; '));
  c(T.dir.hay(ID) && T.dir.efectosFaltantes(ID).length === 0, 'el demo no pide efectos sin registrar');

  // 2) corre de punta a punta
  c(T.dir.disparar(ID), 'se dispara el demo');
  c(!T.dir.disparar(ID), 'no se dispara una escena ya en marcha');
  c(T.mundo.empezo === 1, 'alEmpezar una vez');
  const log = correr(T, { opcion: 2 });
  c(!T.dir.activa() && T.mundo.termino === 1, 'termina y avisa una vez');
  c(log.lineas >= 7 && log.lineas <= 9, 'entre 7 y 9 líneas de diálogo (hubo ' + log.lineas + ')');
  c(log.eleccion, 'hubo una elección');
  c(log.dialogos.some((t) => /Uy, un mate/.test(t)), 'la rama de la elección «mate» se dijo');
  c(!log.dialogos.some((t) => /Sincero/.test(t)) && !log.dialogos.some((t) => /El valle no deja/.test(t)), 'las otras ramas no se dijeron');
  c(log.planos.size >= 4, 'la cámara cambió de plano al menos 4 veces (hubo ' + log.planos.size + ')');
  c(T.efectos.length === 1 && /demostración/.test(T.efectos[0].titulo), 'el efecto con nombre corrió una vez');
  c(T.mundo.libres.includes('ema') && !T.mundo.actores.ema.capt, 'Josefina quedó libre al terminar');
  c(Math.hypot(T.mundo.actores.ema.x - (-7), T.mundo.actores.ema.z - (-15)) < 0.5, 'Josefina llegó al final de su camino');
  c(T.mundo.posadas.some((p) => p[1] === 'saludo') && T.mundo.posadas.some((p) => p[1] === 'senalar'), 'hizo los gestos (saludo y señalar)');
  c(T.mundo.sonidos.includes('anotar'), 'sonó el sonido de la escena');
  c(Math.abs(((T.mundo.hv - 22.2) % 24 + 24) % 24) < 0.05 || Math.abs(T.mundo.hv - 22.2) < 0.05, 'la hora avanzó 0,2 h (' + T.mundo.hv.toFixed(2) + ')');
  c(!T.dir.vista(ID) && Object.keys(T.est.vistas).length === 0, 'la escena demo es efímera: no queda vista');
  c(T.resultados.length === 1 && T.resultados[0].elecciones.saludo === 'mate' && !T.resultados[0].saltada, 'el resultado trae la elección');
  c(T.dir.disparar(ID), 'el demo se puede volver a disparar');
  T.dir.saltar(); for (let i = 0; i < 80 && T.dir.activa(); i++) T.dir.actualizar(0.05);

  // 3) la cámara: arranca desde la del jugador, se mueve, y al terminar vuelve interpolando
  {
    const U = crear(); U.dir.registrar(DEMO); U.dir.disparar(ID);
    U.dir.actualizar(0.05);
    const p0 = U.dir.camara();
    c(p0 && Math.hypot(p0.x - 0, p0.z - 0) < 2 && Math.abs(p0.yaw - 0.3) < 0.2, 'el primer cuadro de la cámara dirigida sale de la del jugador (sin salto)');
    const log2 = correr(U, { max: 100000 });
    const sal = log2.camaras.filter((q) => q.fase === 'saliendo');
    const dist = (q) => Math.hypot(q.x, q.y - 1.6, q.z) + Math.abs(q.fov - 70) / 10;
    let monotono = true;
    for (let i = 1; i < sal.length; i++) if (dist(sal[i]) > dist(sal[i - 1]) + 1e-6) monotono = false;
    c(sal.length >= 10, 'la salida de la cámara dura varios cuadros, no es un salto (' + sal.length + ')');
    c(sal.length > 1 && monotono && dist(sal[sal.length - 1]) < 0.45 * dist(sal[0]), 'la cámara va acercándose a la del jugador durante la salida');
    c(U.dir.camara() === null, 'después de la salida la cámara ya no se toca');
    // sin saltos grandes entre cuadros consecutivos en la salida
    let maxSalto = 0;
    for (let i = 1; i < log2.camaras.length; i++) { const a = log2.camaras[i - 1], b = log2.camaras[i]; maxSalto = Math.max(maxSalto, Math.abs(b.yaw - a.yaw) > Math.PI ? 2 * Math.PI - Math.abs(b.yaw - a.yaw) : Math.abs(b.yaw - a.yaw)); }
    c(maxSalto < 1.2, 'ningún cuadro gira la cámara de golpe (máximo ' + maxSalto.toFixed(2) + ' rad)');
  }

  // 4) saltar: aplica lo que falta en orden y deja el mundo completo
  {
    const S = crear(); S.dir.registrar(DEMO); S.dir.disparar(ID);
    for (let i = 0; i < 20; i++) { S.mundo.simular(0.05); S.dir.actualizar(0.05); }   // Josefina todavía caminando
    c(S.mundo.ocupado('ema'), 'a esta altura Josefina todavía camina');
    c(S.dir.pedirSaltar() === 'confirmar' && S.dir.activa() && S.dir.datos().confirmar, 'Esc una vez pide confirmar y no salta');
    c(S.dir.pedirSaltar() === 'saltada', 'Esc dos veces salta');
    c(S.dir.fase() === 'saliendo' && S.dir.datos().saltada, 'queda saliendo, marcada como saltada');
    c(S.efectos.length === 1, 'al saltar el efecto del final corrió igual');
    c(Math.hypot(S.mundo.actores.ema.x + 7, S.mundo.actores.ema.z + 15) < 0.5 && !S.mundo.ocupado('ema'), 'al saltar Josefina quedó en su lugar final');
    c(Math.abs(S.mundo.hv - 22.2) < 0.01, 'al saltar la hora quedó en la final');
    c(S.dir.elecciones().saludo === 'quedarme', 'al saltar, la elección toma la opción por defecto');
    for (let i = 0; i < 40; i++) S.dir.actualizar(0.05);
    c(!S.dir.activa() && S.resultados[0]?.saltada === true && S.resultados[0].elecciones.saludo === 'quedarme', 'termina y avisa que fue saltada');
    c(S.mundo.libres.includes('ema'), 'al saltar también se libera a Josefina');
    c(S.dir.saltar() === false, 'saltar sin escena no hace nada');
  }

  // 4b) saltar a mitad de una caminata: llega igual
  {
    const W = crear();
    W.dir.registrar({ id: 'camina', pasos: [{ tipo: 'gesto', quien: 'ramon', accion: 'caminar', a: { x: 30, z: 30 }, sinEsperar: true }, { tipo: 'espera', dur: 50 }] });
    W.dir.disparar('camina');
    for (let i = 0; i < 6; i++) { W.mundo.simular(0.05); W.dir.actualizar(0.05); }
    c(W.mundo.ocupado('ramon'), 'Ramón camina');
    W.dir.saltar();
    c(!W.mundo.ocupado('ramon') && Math.hypot(W.mundo.actores.ramon.x - 30, W.mundo.actores.ramon.z - 30) < 0.5, 'al saltar, el que caminaba termina en su destino');
  }

  // 5) guardado: una escena no se guarda a la mitad
  {
    const G = crear();
    G.dir.registrar({ id: 'visible', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['Hola.', 'Chau.'] }, { tipo: 'efecto', nombre: 'demo-nota', args: {} }] });
    G.dir.disparar('visible');
    for (let i = 0; i < 4; i++) G.dir.actualizar(0.05);
    c(G.dir.activa() && !G.dir.vista('visible'), 'mientras corre, la escena no está vista');
    const g1 = G.dir.paraGuardar();
    c(!Object.hasOwn(g1.vistas, 'visible'), 'lo que se guarda a mitad de la escena no la trae vista');
    // «recarga»: un director nuevo con lo guardado
    const H = crear();
    H.est.vistas = E.sanearEscenas(g1).vistas;
    H.dir.registrar({ id: 'visible', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['Hola.', 'Chau.'] }] });
    c(H.dir.elegible('visible') && H.dir.disparar('visible'), 'tras recargar la escena está pendiente y se puede volver a disparar');
    // termina: se marca vista, con el día; ya no se dispara
    for (let i = 0; i < 400 && G.dir.activa(); i++) { G.dir.actualizar(0.05); G.dir.avanzar(); }
    c(G.dir.vista('visible') && G.est.vistas.visible === 5, 'al terminar queda vista (con el día)');
    c(!G.dir.disparar('visible') && !G.dir.elegible('visible'), 'una escena vista no se dispara sola de nuevo');
    c(G.dir.disparar('visible', { forzar: true }), '… salvo que se fuerce');
    for (let i = 0; i < 30 && G.dir.activa(); i++) G.dir.saltar();
    // las elecciones se guardan por escena
    const K = crear();
    K.dir.registrar({ id: 'con-eleccion', pasos: [{ tipo: 'eleccion', id: 'rumbo', opciones: [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos' }] }] });
    K.dir.disparar('con-eleccion'); K.dir.actualizar(0.05); K.dir.elegir(1);
    for (let i = 0; i < 60 && K.dir.activa(); i++) K.dir.actualizar(0.05);
    c(E.eleccionDe({ escenas: K.est }, 'con-eleccion', 'rumbo') === 'b', 'la elección queda guardada por escena');
  }

  // 6) lo guardado se sanea (basura, claves peligrosas, tope)
  {
    const raro = [null, undefined, 5, 'x', [], { vistas: [], elecciones: 3 }, { vistas: { '__proto__': 4, constructor: 3, ok: 7, 'con espacio': 1, '': 2 }, elecciones: { __proto__: { a: 'b' }, e1: { __proto__: 'x', q: 'r', '??': 's', k: 4 } } }];
    for (const r of raro) {
      let s;
      try { s = E.sanearEscenas(r); } catch (e) { s = null; }
      c(s && typeof s === 'object' && s.vistas && s.elecciones, 'sanearEscenas no rompe con ' + JSON.stringify(r));
    }
    const s = E.sanearEscenas(raro[6]);
    c(Object.keys(s.vistas).join() === 'ok' && s.vistas.ok === 7, 'sólo queda el id válido');
    c(!Object.hasOwn(s.vistas, '__proto__') && !Object.hasOwn(s.vistas, 'constructor') && ({}).polluted === undefined, 'no entra __proto__ ni constructor');
    c(!Object.hasOwn(s.elecciones, '__proto__'), 'ni en las elecciones');
    const grande = { vistas: Object.fromEntries(Array.from({ length: 5000 }, (_, i) => ['e' + i, 1])), elecciones: {} };
    c(Object.keys(E.sanearEscenas(grande).vistas).length <= 600, 'hay un tope de escenas guardadas');
    const h = {};
    E.marcarVista(h, 'una', 3);
    c(E.escenaVista(h, 'una') && !E.escenaVista(h, 'otra') && !E.escenaVista({}, 'una') && !E.escenaVista(null, 'una'), 'escenaVista / marcarVista con el default seguro');
  }

  // 7) validación
  {
    const m = (e) => E.validarEscena(e).ok;
    c(!m(null) && !m({}) && !m({ id: 'x' }) && !m({ id: 'x', pasos: [] }), 'rechaza escenas vacías');
    c(!m({ id: 'x', pasos: [{ tipo: 'inventado' }] }), 'rechaza un tipo de paso desconocido');
    c(!m({ id: 'x', pasos: [{ tipo: 'eleccion', id: 'q', opciones: [{ id: 'a', texto: 'Sí' }] }] }), 'rechaza una elección con una sola opción');
    c(!m({ id: 'x', pasos: [{ tipo: 'eleccion', id: 'q', opciones: [1, 2, 3, 4, 5].map((i) => ({ id: 'o' + i, texto: 'T' + i })) }] }), 'rechaza una elección con cinco opciones');
    c(!m({ id: 'x', pasos: [{ tipo: 'salto', a: 'nada' }] }), 'rechaza un salto a una etiqueta que no existe');
    c(!m({ id: 'x', pasos: [{ tipo: 'plano', plano: 'cenital', a: 'jugador' }] }), 'rechaza un plano desconocido');
    c(!m({ id: 'x', pasos: [{ tipo: 'gesto', quien: 'ramon', accion: 'volar' }] }), 'rechaza un gesto desconocido');
    c(!m({ id: '__proto__', pasos: [{ tipo: 'espera', dur: 1 }] }) && !m({ id: 'con espacio', pasos: [{ tipo: 'espera', dur: 1 }] }), 'rechaza ids peligrosos');
    c(m({ id: 'ok', pasos: [{ tipo: 'espera', dur: 1 }] }), 'acepta una escena mínima');
  }

  // 8) ramas, etiquetas, esperas por hora y el resto de los pasos
  {
    const R = crear({ efectos: { marca: (a) => R.efectos.push(a.x) } });
    R.dir.registrar({
      id: 'rama', pasos: [
        { tipo: 'eleccion', id: 'e', opciones: [{ id: 'si', texto: 'Sí', a: 'fin-si' }, { id: 'no', texto: 'No' }] },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'no' } },
        { tipo: 'salto', a: 'fin' },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'si' }, etiqueta: 'fin-si' },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'fin' }, etiqueta: 'fin' },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'cond' }, si: { cond: 'cierta' } },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'siSi' }, si: { eleccion: 'e', es: 'si' } },
        { tipo: 'efecto', nombre: 'marca', args: { x: 'noelegida' }, si: { eleccion: 'e', es: 'no' } },
      ],
    });
    R.dir.registrarCondicion('cierta', () => true);
    R.dir.disparar('rama'); R.dir.actualizar(0.05); R.dir.elegir(0);
    for (let i = 0; i < 60 && R.dir.activa(); i++) R.dir.actualizar(0.05);
    c(R.efectos.join() === 'si,fin,cond,siSi', 'la opción salta a su etiqueta y las condiciones filtran: ' + R.efectos.join());
    const Q = crear();
    Q.dir.registrar({ id: 'horas', pasos: [{ tipo: 'espera', hastaHora: 1, dur: 2 }, { tipo: 'clima', estado: 'lluvia', dur: 1 }, { tipo: 'fundido', a: 'negro', dur: 0.4 }, { tipo: 'fundido', a: 'claro', dur: 0.4 }] });
    Q.mundo.hv = 23;
    Q.dir.disparar('horas');
    let pasoPorMedianoche = false, ant = 23, maxF = 0;
    for (let i = 0; i < 200 && Q.dir.activa(); i++) { Q.dir.actualizar(0.05); const h = Q.mundo.hv; if (h < ant - 12) pasoPorMedianoche = true; if (Math.abs(h - ant) > 12 && !(h < ant - 12)) pasoPorMedianoche = 'mal'; ant = h; maxF = Math.max(maxF, Q.dir.datos()?.fundido || 0); }
    c(pasoPorMedianoche === true && Math.abs(Q.mundo.hv - 1) < 0.01, 'la hora avanza hacia adelante pasando la medianoche y llega a la pedida');
    c(Q.mundo.climas.includes('lluvia'), 'el clima se pidió');
    c(maxF > 0.9, 'el fundido llegó a negro');
    c(Q.dir.datos() === null || Q.dir.datos().fundido < 0.01, 'al terminar el fundido está claro');
  }

  // 9) los diálogos: la escritura, acelerar, Enter completa la línea antes de pasar a la siguiente
  {
    const D = crear();
    D.dir.registrar({ id: 'hablan', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['Una línea bastante larga para ver cómo se va escribiendo de a poco en la caja.', 'Otra.'] }] });
    D.dir.disparar('hablan');
    D.dir.actualizar(0.05); D.dir.actualizar(0.2);
    let d = D.dir.datos().dialogo;
    c(d.texto.length > 0 && d.texto.length < 30 && !d.completo, 'el texto se escribe de a poco');
    c(d.nombre === 'Don Ramón' && /^#[0-9a-f]{6}$/i.test(d.color), 'se ve el nombre y el color de quien habla');
    D.dir.avanzar();
    d = D.dir.datos().dialogo;
    c(d.completo && d.linea === 1, 'Enter con la línea a medias la completa (no pasa a la siguiente)');
    D.dir.avanzar();
    d = D.dir.datos().dialogo;
    c(d.linea === 2 && d.texto.length < 3, 'Enter con la línea completa pasa a la siguiente');
    const lento = crear(); lento.dir.registrar({ id: 'a', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['x'.repeat(200)] }] });
    const rapido = crear(); rapido.dir.registrar({ id: 'a', pasos: [{ tipo: 'dialogo', quien: 'ramon', lineas: ['x'.repeat(200)] }] });
    lento.dir.disparar('a'); rapido.dir.disparar('a'); rapido.dir.acelerar(true);
    for (let i = 0; i < 10; i++) { lento.dir.actualizar(0.05); rapido.dir.actualizar(0.05); }
    c(rapido.dir.datos().dialogo.texto.length > lento.dir.datos().dialogo.texto.length * 3, 'acelerar escribe bastante más rápido');
    // la elección: flechas, números, Enter
    const L = crear(); L.dir.registrar({ id: 'q', pasos: [{ tipo: 'eleccion', id: 'z', pregunta: '¿Y?', opciones: [{ id: 'a', texto: 'A' }, { id: 'b', texto: 'B' }, { id: 'c', texto: 'C' }] }] });
    L.dir.disparar('q'); L.dir.actualizar(0.05);
    c(L.dir.datos().eleccion?.opciones.length === 3 && L.dir.datos().eleccion.indice === 0, 'la elección muestra sus opciones');
    L.dir.moverEleccion(1); L.dir.moverEleccion(1); L.dir.moverEleccion(1);
    c(L.dir.datos().eleccion.indice === 0, 'las flechas dan la vuelta');
    L.dir.moverEleccion(-1);
    c(L.dir.elegir(9) === false && L.dir.elegir(-1) === false, 'una opción que no existe no hace nada');
    L.dir.avanzar();
    c(L.dir.elecciones().z === 'c', 'Enter confirma la opción marcada');
  }

  // 10) todos los tipos de plano devuelven una pose válida; el travelling y el empuje se mueven
  {
    const mw = mundoFalso();
    const ctx = { mundo: mw, base: mw.camaraJugador() };
    const base = { a: 'ramon', desde: 'jugador' };
    for (const pl of E.TIPOS_PLANO) {
      const p = pl === 'paneo' ? { plano: pl, a: 'ramon', hasta: 'ema' } : pl === 'libre' ? { plano: pl, pos: { x: 1, z: 1, dy: 2 }, mira: 'ramon' } : { plano: pl, ...base };
      const q = E.compilarPlano(p, ctx)?.(0.5);
      c(q && ['x', 'y', 'z', 'yaw', 'pitch', 'fov'].every((k) => Number.isFinite(q[k])), 'el plano ' + pl + ' da una pose válida');
    }
    const e0 = E.compilarPlano({ plano: 'empuje', ...base }, ctx)(0), e1 = E.compilarPlano({ plano: 'empuje', ...base }, ctx)(1);
    c(Math.hypot(e0.x - 6, e0.z + 9) > Math.hypot(e1.x - 6, e1.z + 9) + 0.5, 'el empuje se acerca');
    const p0 = E.compilarPlano({ plano: 'paneo', a: 'ramon', hasta: 'ema' }, ctx)(0), p1 = E.compilarPlano({ plano: 'paneo', a: 'ramon', hasta: 'ema' }, ctx)(1);
    c(Math.abs(p0.x - p1.x) < 1e-6 && Math.abs(p0.yaw - p1.yaw) > 0.1, 'el paneo gira sin mover la cámara');
    const fija = E.compilarPlano({ plano: 'primer', a: 'ramon', desde: 'jugador' }, ctx)(0), g = E.compilarPlano({ plano: 'general', a: 'ramon', desde: 'jugador' }, ctx)(0);
    c(Math.hypot(fija.x - 6, fija.z + 9) < Math.hypot(g.x - 6, g.z + 9) && fija.fov < g.fov, 'el primer plano está más cerca y más cerrado que el general');
    const cp = E.compilarPlano({ plano: 'contrapicado', a: 'ramon', desde: 'jugador' }, ctx)(0), pc = E.compilarPlano({ plano: 'picado', a: 'ramon', desde: 'jugador' }, ctx)(0);
    c(cp.pitch > 0 && pc.pitch < 0, 'el contrapicado mira para arriba y el picado para abajo');
    c(E.compilarPlano({ plano: 'medio', a: 'fantasma' }, ctx)(0) === null, 'un plano a algo que no existe no tira: devuelve null');
    const dif = E.mezclarPoses({ x: 0, y: 0, z: 0, yaw: 3, pitch: 0, fov: 60 }, { x: 0, y: 0, z: 0, yaw: -3, pitch: 0, fov: 60 }, 0.5);
    c(Math.abs(Math.abs(dif.yaw) - Math.PI) < 0.01, 'el giro se mezcla por el camino corto');
  }

  // 11) la mirada dirigida corta
  {
    const m = E.crearMirada();
    c(m.iniciar({ yaw: 0, pitch: 0 }, { yaw: 1, pitch: 0.2 }, 2) && m.activa(), 'la mirada dirigida arranca');
    let max = 0, ult = null, fin = false;
    for (let i = 0; i < 200; i++) { const r = m.paso(0.02); if (!r) break; ult = r; max = Math.max(max, r.yaw); if (r.fin) fin = true; }
    c(max > 0.95 && fin && !m.activa(), 'la mirada llega al punto y termina');
    c(ult && Math.abs(ult.yaw) < 1e-6 && Math.abs(ult.pitch) < 1e-6, 'y vuelve a donde miraba el jugador');
  }
  return f;
}

// ---------------------------------------------------------------- 1) el módulo real
const origen = leer('src/escenas.js');
const ESC = await import(pathToFileURL(join(raiz, 'src/escenas.js')).href);
const DEM = await import(pathToFileURL(join(raiz, 'src/escenas-demo.js')).href);
const reales = await suite(ESC, DEM.ESCENA_DEMO, DEM.ID_ESCENA_DEMO);
for (const t of reales) ok(false, t);
ok(true, 'la suite sobre el módulo real: ' + (reales.length ? reales.length + ' fallas' : 'sin fallas'));

// ---------------------------------------------------------------- 2) mutaciones: se rompe una garantía y la suite tiene que fallar
const MUTANTES = [
  ['saltar no termina la escena', 'terminar(true);\n    return true;', 'return true;'],
  ['saltar no corre los efectos', "case 'efecto': correrEfecto(p.nombre, p.args); break;", "case 'efecto': break;"],
  ['saltar no resuelve la elección', 'return aplicarOpcion(p, p.opciones[i]);', 'return null;'],
  ['saltar deja caminando a quien caminaba', "if (g.tipo === 'caminar') { try { mundo.teletransportar?.(clave(q), g.destino, null); }", "if (false) { try { mundo.teletransportar?.(clave(q), g.destino, null); }"],
  ['al terminar no suelta a los personajes', 'try { mundo.soltar?.(clave(q)); }', 'try { void 0; }'],
  ['marca la escena vista al empezar (guardar a mitad la daría por hecha)', '    s = {\n      id, c, e: c.escena', '    estadoGuardado().vistas[id] = 1;\n    s = {\n      id, c, e: c.escena'],
  ['la cámara no vuelve al jugador', 'return u >= 1 ? null : mezclarPoses(c.pose, vivo, u);', 'return null;'],
  ['la cámara vuelve de golpe', 'export const SALIDA_CAMARA = 1.0;', 'export const SALIDA_CAMARA = 0.001;'],
  ['el primer plano salta sin mezclar desde la cámara del jugador', 'export const ENTRADA_CAMARA = 1.2;', 'export const ENTRADA_CAMARA = 0;'],
  ['las condiciones «si» se ignoran', 'if (!si) return true;', 'return true;'],
  ['un solo Esc salta', 'if (reloj <= s.confirmarHasta) { saltar(); return \'saltada\'; }', "{ saltar(); return 'saltada'; }"],
  ['la hora puede ir hacia atrás', 'else if (delta < 0) delta += 24;', ''],
  ['Enter pasa de línea sin completar la que se escribe', 'if (!d.listaLinea) { d.car = d.chars.length; d.listaLinea = true; d.espera = 0; return false; }', ''],
  ['entra __proto__ a lo guardado', "&& !PROHIBIDOS.has(s);", ';'],
  ['sin tope de escenas guardadas', 'export const MAX_ESCENAS_GUARDADAS = 600;', 'export const MAX_ESCENAS_GUARDADAS = 600000;'],
  ['las elecciones no se guardan', 'if (Object.keys(s.elecciones).length) g.elecciones[s.id]', 'if (false) g.elecciones[s.id]'],
  ['el empuje no se mueve', "const dist = tipo === 'empuje' ? lerp(dist0, num(p.distFin, dist0 * 0.45), u) : dist0;", 'const dist = dist0;'],
];
const dirTmp = join(tmpdir(), 'hojarasca-mut-escenas');
mkdirSync(dirTmp, { recursive: true });
let atrapados = 0;
for (let i = 0; i < MUTANTES.length; i++) {
  const [nombre, de, a] = MUTANTES[i];
  const cuantas = origen.split(de).length - 1;
  ok(cuantas >= 1, `la mutación «${nombre}» encuentra su lugar en escenas.js (${cuantas})`);
  if (!cuantas) continue;
  const texto = origen.replace(de, () => a);
  const arch = join(dirTmp, `escenas-mut-${i}.mjs`);
  writeFileSync(arch, texto);
  let fallo = false;
  try {
    const M = await import(pathToFileURL(arch).href);
    const r = await suite(M, DEM.ESCENA_DEMO, DEM.ID_ESCENA_DEMO);
    fallo = r.length > 0;
  } catch { fallo = true; }
  if (fallo) atrapados++;
  ok(fallo, `la prueba atrapa la mutación: ${nombre}`);
}
rmSync(dirTmp, { recursive: true, force: true });
ok(atrapados === MUTANTES.length, `se atraparon ${atrapados} de ${MUTANTES.length} mutaciones`);

// ---------------------------------------------------------------- 3) escenas-mundo: tomar y soltar a los personajes (sin DOM)
{
  const { crearEscenasMundo } = await import(pathToFileURL(join(raiz, 'src/escenas-mundo.js')).href);
  const mk = (extra = {}) => ({ clave: 'ema', pos: { x: 1, y: 0, z: 2, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, g: { rotation: { y: 0 }, visible: true }, rumbo: 0, cabeza: { rotation: { x: 0, y: 0, z: 0 }, position: { y: 1 } }, brazos: [], ...extra });
  const josefina = mk({ ruta: [{ x: 1, z: 1 }], velocidad: 0.95, pose: 'regar', dormido: false, soloCerca: 40 });   // de ruta: no tiene `camino`
  const aldeana = mk({ clave: 'ercilia', camino: [{ x: 5, z: 5 }], conVos: false, dormido: true, velocidad: 0.8 });
  const gente = { gente: [josefina, aldeana] };
  const progreso = { horas: 12, dia: 1, historia: { escenas: { vistas: {}, elecciones: {} } } };
  const camara = { position: { x: 0, y: 1.6, z: 0 }, rotation: { x: 0, y: 0 }, fov: 70 };
  const em = crearEscenasMundo({
    doc: null, gente: () => gente, jugador: () => ({ estado: { pos: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0 }, soltar() {} }), camara, T: { altura: () => 0, lugares: {} }, col: null,
    progreso: () => progreso, clima: () => null, sonido: {}, modo: () => 'jugando', ajustes: () => ({ fov: 70 }),
  });
  const m = em.mundo;
  m.capturar('ema');
  ok(josefina.conVos === true && josefina.enCita === true && Array.isArray(josefina.camino) && josefina.camino.length === 0 && josefina.pose === null, 'capturar toma al personaje (conVos, sin camino, sin pose)');
  m.caminar('ema', { x: 10, z: 10 }, { vel: 2 });
  ok(m.ocupado('ema') && josefina.camino.length === 1 && josefina.velocidad === 2, 'caminar le da un camino y se la ve ocupada');
  josefina.camino.shift();
  ok(!m.ocupado('ema'), 'al llegar (camino vacío) ya no está ocupada');
  m.posar('ema', 'regar', 3);
  ok(josefina.pose === 'regar', 'una pose del juego se pone en `pose`');
  m.posar('ema', 'cruzados', 3);
  ok(josefina.__quietud === 'cruzados', 'una pose de quietud va en __quietud');
  m.teletransportar('ema', { x: 7, z: 8 }, { x: 7, z: 20 });
  ok(josefina.pos.x === 7 && josefina.pos.z === 8 && Math.abs(josefina.g.rotation.y) < 1e-9, 'teletransportar la deja en el lugar mirando hacia donde se pidió');
  m.soltar('ema');
  ok(!Object.hasOwn(josefina, 'conVos') && !Object.hasOwn(josefina, 'enCita') && josefina.pose === 'regar' && josefina.soloCerca === 40 && josefina.velocidad === 0.95, 'soltar devuelve lo que tenía (y borra lo que no tenía)');
  ok(josefina.camino === undefined && !Object.hasOwn(josefina, '__quietud') && !Object.hasOwn(josefina, 'miraFinal') && josefina.dormido === false, 'una de ruta vuelve sin `camino`, para que siga con su ruta');
  m.capturar('ercilia'); m.aparecer('ercilia', { x: 3, z: 3 }, null);
  ok(aldeana.dormido === false && aldeana.g.visible === true && aldeana.pos.x === 3, 'aparecer trae a quien estaba dormido (lejos) a un punto');
  m.soltar('ercilia');
  ok(aldeana.dormido === true && Array.isArray(aldeana.camino) && aldeana.camino.length === 1 && aldeana.conVos === false, 'soltar a una de la aldea la devuelve a su horario (camino, dormido y conVos como estaban)');
  m.capturar('fantasma'); m.caminar('fantasma', { x: 1, z: 1 }, {}); m.posar('fantasma', 'saludo', 1);
  ok(!m.ocupado('fantasma'), 'un personaje que no existe no rompe nada');
  ok(m.posicion({ frente: 'jugador', dist: 5, lado: 2 }).z === -5 && Math.abs(m.posicion({ frente: 'jugador', dist: 5, lado: 2 }).x - 2) < 1e-9, 'el frente del jugador mirando al norte: 5 m adelante y 2 a la derecha');
  m.hora(1); ok(progreso.horas === 1, 'la hora se pone');
  progreso.horas = 23.5; m.hora(0.5); ok(progreso.dia === 2, 'pasar la medianoche suma un día');
  ok(em.disparar('no-existe') === false, 'una escena que no existe no se dispara');
}

// ---------------------------------------------------------------- 4) el enganche con el juego (por texto)
{
  const main = leer('src/main.js'), mundo = leer('src/escenas-mundo.js'), demo = leer('src/escenas-demo.js'), historia = leer('src/historia.js'), trucos = leer('src/trucos.js');
  ok(/import \{ crearEscenasMundo \} from '\.\/escenas-mundo\.js';/.test(main), 'main.js importa el mundo de escenas');
  ok(/activo: \(\) => modo === 'jugando' && !durmiendo && !escenasMundo\?\.activa\(\)/.test(main), 'durante la escena el jugador no lee teclas de movimiento');
  ok(/alSoltar: \(\) => \{ if \(modo === 'jugando' && !creadorAbierto && !escenasMundo\?\.activa\(\)\) abrir\('pausa'\)/.test(main), 'soltar el mouse en una escena no abre la pausa');
  ok(/if \(escenasMundo && modo === 'jugando'\) \{ try \{ escenasMundo\.actualizar\(dtReal\)/.test(main), 'la escena sólo corre con modo jugando (la pausa la congela)');
  const iJug = main.indexOf('jugador.actualizar(dt); }'), iEsc = main.indexOf('escenasMundo.actualizar(dtReal)');
  ok(iJug > 0 && iEsc > iJug, 'el director corre después de jugador.actualizar (la cámara del jugador ya está puesta)');
  ok(/escenasMundo\?\.activa\(\) && modo === 'jugando' && escenasMundo\.tecla\(e\)\) return;/.test(main), 'el teclado es de la escena mientras corre');
  ok(main.indexOf('escenasMundo.tecla(e)') < main.indexOf("if (modo === 'cuaderno' && (codigo === 'KeyJ'"), 'la escena toma las teclas antes que el resto del juego');
  ok(/if \(escenasMundo\?\.corriendo\(\)\) return false;/.test(main), 'guardar() no escribe a mitad de una escena');
  ok(/escenasMundo\?\.cerrar\(\);[^\n]*\n\s*guardar\(\);/.test(main), 'volver a la portada termina la escena antes de guardar');
  ok(/!escenasMundo\?\.activa\(\) && !jugador\.bloqueado\(\)/.test(main), 'el clic no bloquea el mouse durante la escena');
  ok(/despuesDeGente\(dt\)/.test(main) && main.indexOf('despuesDeGente(dt)') > main.indexOf('gente.actualizar(dt, js, camara'), 'las poses de escena se aplican después de gente.actualizar');
  ok(/if \(!esDesafio\) \{\s*\n\s*escenasMundo = crearEscenasMundo/.test(main), 'sólo en el Relax y la Historia');
  ok(/ocupado: \(\) => !jugador \|\| !!escenasMundo\?\.activa\(\)/.test(main), 'la consola de códigos no se abre en plena escena');
  // rendimiento: nada de three, ni materiales, ni luces, ni shaders en las escenas
  for (const [nombre, txt] of [['escenas.js', origen], ['escenas-mundo.js', mundo], ['escenas-demo.js', demo]]) {
    ok(!/THREE|ShaderMaterial|Material\(|PointLight|SpotLight|\.add\(new/.test(txt.replace(/\/\/[^\n]*/g, '')), nombre + ' no usa three: ni materiales, ni luces, ni shaders nuevos');
  }
  ok(!/^import .*three/m.test(origen + mundo + demo), 'ninguna importa three');
  ok(/escena-barra/.test(mundo) && /\.opciones/.test(mundo) && /escena-velo/.test(mundo), 'las barras de cine, la elección y el fundido son HTML/CSS');
  ok(/'Escape' \|\| k === 'Tab'/.test(mundo) && /'Enter' \|\| k === 'NumpadEnter' \|\| k === 'Space'/.test(mundo) && /ArrowUp/.test(mundo), 'sólo teclado y ratón: Esc o Tab saltan, Enter o Espacio siguen, flechas y números eligen');
  ok(/k === 'F1'\) return false/.test(mundo), 'F1 (la pausa) pasa a través de la escena');
  ok(/escenas: escenasNuevas\(\)/.test(historia) && /h\.escenas = sanearEscenas\(v\.escenas\)/.test(historia), 'historiaNueva y sanearHistoria declaran progreso.historia.escenas');
  // el demo no está en el juego normal: sólo lo registra el disparo del truco
  ok(!/registrarDemo\(\)/.test(main) && /if \(id === ID_ESCENA_DEMO && !director\.hay\(id\)\) registrarDemo\(\)/.test(mundo), 'el demo sólo se registra al dispararlo (truco), no al armar el juego');
  ok(/nombre: 'escena'/.test(trucos) && /ID_ESCENA_DEMO/.test(trucos), 'hay un truco «escena demo»');
  ok(!/\bthe\b|\band\b(?= the)|\bwith\b/.test(demo.replace(/\/\/[^\n]*/g, '')), 'el demo no tiene texto en inglés');
  ok(/efimera: true/.test(demo), 'el demo es efímero (no deja rastro en la partida)');
  const trozo = demo.match(/lineas: \[[\s\S]*?\] \},/g) || [];
  ok(!/Dios|santo|santa|bendici|milagro|rez[aoó]|iglesia/i.test(demo + mundo), 'nada religioso');
  void trozo;
}

console.log(`verificar-4-14-0-escenas: ${n} comprobaciones ${fallas ? 'con ' + fallas + ' FALLAS' : 'OK'}`);
process.exit(fallas ? 1 : 0);
