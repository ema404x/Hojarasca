// 2.7.4: variantes de luces compiladas antes de hacer falta.
//
// three arma un programa de shader por cada cantidad de luces puntuales y focos que ve.
// El LOD de las estructuras, el tren, los faroles de las obras y la Nave ocultan o
// muestran luces, y cada cantidad nueva recompilaba en ese mismo cuadro todos los
// materiales iluminados a la vista: un tirón de varias décimas de segundo.
//
// Lo que NO se hace, a propósito: dejar fija la cantidad de luces (todas prendidas con
// intensidad 0, o una reserva fija que copia las activas). Se probó y la imagen cambia:
// con una luz de más, aunque sume exactamente 0, el driver compila el shader de otra
// forma y algunos píxeles salen con un valor de diferencia (medido: 1 a 3 píxeles en 4
// de 25 vistas). La regla es que no cambie nada de lo que se ve, así que la cantidad
// de luces sigue siendo la misma que antes en cada cuadro.
//
// 3.3: el usuario eligió la fluidez: ahora SÍ hay un presupuesto fijo de luces (como RAGE o
// Minecraft), ver `crearPresupuestoLuces` al final. Las luces del juego quedan en su lugar (el
// juego las prende, apaga, mueve y oculta igual que siempre), pero three ya no las ve: cada
// cuadro se copian a unas pocas luces fijas, siempre visibles. La cantidad de luces no cambia
// nunca, así que los programas quedan todos hechos al cargar. Precio: ±1 en algunos píxeles.
// Lo de abajo (las variantes) queda para cuando el presupuesto está apagado.
//
// Lo que se hace: cuando un edificio con luces (o el tren) está por aparecer o
// desaparecer, se compilan de a poco, en los cuadros previos, los programas que va a
// necesitar la cantidad nueva. Se compilan con `renderer.compile` contra una escena de
// luces de muestra con esas cantidades, así que son exactamente los mismos programas
// que three armaría al llegar ahí (misma clave): cuando el LOD cambia, three los
// encuentra hechos y no compila nada. Con KHR_parallel_shader_compile el driver los
// termina en segundo plano. Compilar no dibuja: la imagen no cambia.
import * as THREE from 'three';

const fuentes = [];   // todas las luces puntuales y focos del juego
let presupuestoActivo = null;   // 3.3: el presupuesto fijo, si está prendido (ver abajo)

export function registrarLuz(luz) {
  if (luz && (luz.isPointLight || luz.isSpotLight) && !fuentes.includes(luz)) {
    fuentes.push(luz);
    if (presupuestoActivo) presupuestoActivo.esconder(luz);
  }
  return luz;
}
export function olvidarLuz(luz) {
  const i = fuentes.indexOf(luz);
  if (i >= 0) fuentes.splice(i, 1);
  presupuestoActivo?.soltar(luz);   // 3.6 (optimizar): y su máscara guardada (si no, el presupuesto la retenía para siempre)
}

// crear objetos de three toma números de Math.random para los uuid: la escena de muestra
// no los toma, así no corre la secuencia del resto del juego
function sinAzar(fn) {
  const azar = Math.random;
  let n = 0;
  Math.random = () => ((n++ * 0.6180339887) % 1);
  try { return fn(); } finally { Math.random = azar; }
}

// los materiales cuyo programa depende de las luces (los mismos que three revisa)
function usaLuces(m) {
  return !!m && (m.isMeshLambertMaterial || m.isMeshToonMaterial || m.isMeshPhongMaterial || m.isMeshStandardMaterial
    || m.isShadowMaterial || (m.isShaderMaterial && m.lights === true));
}

// lo que del objeto entra en la clave del programa además del material
function firmaDe(o, m) {
  let f = o.__firmaLuces;
  if (f === undefined) {
    const g = o.geometry;
    const at = g ? Object.keys(g.attributes).sort().join(',') : '';
    const mo = g ? Object.keys(g.morphAttributes).join(',') : '';
    f = o.__firmaLuces = `${o.isInstancedMesh ? 1 : 0}${o.instanceColor ? 1 : 0}${o.morphTexture ? 1 : 0}${o.isSkinnedMesh ? 1 : 0}${o.isBatchedMesh ? 1 : 0}${o.isPoints ? 1 : 0}|${at}|${g?.attributes?.color?.itemSize || 0}|${mo}`;
  }
  return m.id + '|' + f;
}

export function crearVariantesLuces(renderer, escena, camara, { objetivo = () => null } = {}) {
  // grupos que el juego muestra u oculta con luces adentro: { obj, margen() → metros que
  // le faltan para cambiar, visibleEn(pos) → cómo quedaría con la cámara en pos (o null) }
  const conmutadores = [];
  const hechas = new Map();       // 'P,S' → Set de firmas ya compiladas para esa cantidad
  const catalogo = [];            // [firma, obj] de lo iluminado que se vio (se recorre de a poco)
  const enCatalogo = new Set();
  const contenido = new Map();    // grupo → [firma, obj] de todo lo que tiene adentro
  const cursores = new Map();     // 'P,S' → hasta dónde se revisó el catálogo
  let deseadas = [];              // [{ clave, P, S, extras: [obj] }], la más urgente primero
  let pila = [];                  // recorrido en curso del catálogo
  let ultimaPrediccion = -1e9, ultimoRecorrido = -1e9;
  const stats = { compiladas: 0, ms: 0 };
  let proxy = null, proxyDir = null, proxyHemi = null;
  const proxyP = [], proxyS = [];

  function escenaDeMuestra(P, S, conSolYCielo = true) {
    sinAzar(() => {
      if (!proxy) {
        proxy = new THREE.Scene();
        proxyDir = new THREE.DirectionalLight(0xffffff, 0);
        proxyHemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0);
        proxy.add(proxyDir, proxyHemi);
      }
      while (proxyP.length < P) { const l = new THREE.PointLight(0xffffff, 0); proxy.add(l); proxyP.push(l); }
      while (proxyS.length < S) { const l = new THREE.SpotLight(0xffffff, 0); proxy.add(l); proxyS.push(l); }
    });
    proxyP.forEach((l, i) => { l.visible = i < P; });
    proxyS.forEach((l, i) => { l.visible = i < S; });
    // el resto de las luces, como en la escena de verdad: el sol (con o sin sombra) y el cielo
    let dir = 0, dirSombra = false, hemi = 0;
    for (const h of escena.children) {
      if (!h.visible || !h.layers.test(camara.layers)) continue;
      if (h.isDirectionalLight) { dir++; dirSombra = dirSombra || h.castShadow; }
      if (h.isHemisphereLight) hemi++;
    }
    proxyDir.visible = conSolYCielo && dir > 0; proxyDir.castShadow = dirSombra;
    proxyHemi.visible = conSolYCielo && hemi > 0;
    proxy.fog = escena.fog;
    proxy.environment = escena.environment;
    return proxy;
  }

  // ¿la cuenta three en este cuadro? visible ella y toda su cadena, y en una capa de la cámara
  function cuenta(l) {
    if (!l.layers.test(camara.layers)) return false;
    let o = l;
    while (o) {
      if (!o.visible) return false;
      if (o === escena) return true;
      o = o.parent;
    }
    return false;
  }
  function contar() {
    let P = 0, S = 0;
    for (let i = 0; i < fuentes.length; i++) if (cuenta(fuentes[i])) { if (fuentes[i].isSpotLight) S++; else P++; }
    return { P, S };
  }

  // Lo que el juego muestra u oculta: los edificios del LOD (con luces o sin), los tramos de
  // vía y el tren. `objetos`: lo que aparece y desaparece junto (un grupo, o las mallas de un
  // tramo); `margen()`: metros que le faltan para cambiar; `visibleEn(pos)`: cómo quedaría
  // con la cámara en `pos` (null si no depende de la cámara); `alInstante`: el juego aplica
  // la regla en cada cuadro (el tren), no cada tanto (el LOD).
  function conmutador(objetos, margen, visibleEn = () => null, { umbral = 80, alInstante = false } = {}) {
    objetos = (Array.isArray(objetos) ? objetos : [objetos]).filter(Boolean);
    if (!objetos.length) return;
    const i = conmutadores.findIndex((c) => c.objetos[0] === objetos[0]);
    if (i >= 0) conmutadores.splice(i, 1);
    const adentro = (l) => { for (let q = l; q; q = q.parent) if (objetos.includes(q)) return true; return false; };
    conmutadores.push({ objetos, margen, visibleEn, umbral, alInstante, conLuces: fuentes.some(adentro) });
  }
  const seVe = (c) => c.objetos[0].visible;

  // cuántas luces vería three si estos grupos cambiaran; se prueba dando vuelta `visible`
  // y dejándolo como estaba, sin dibujar nada en el medio
  function cantidadCon(cs) {
    const conLuces = cs.filter((c) => c.conLuces);
    for (const c of conLuces) for (const o of c.objetos) o.visible = !o.visible;
    const r = contar();
    for (const c of conLuces) for (const o of c.objetos) o.visible = !o.visible;
    return r;
  }
  function desear(lista, cs) {
    const { P, S } = cantidadCon(cs);
    const clave = P + ',' + S;
    const extras = cs.filter((c) => !seVe(c)).flatMap((c) => c.objetos);
    const ya = lista.find((d) => d.clave === clave);
    if (ya) { for (const e of extras) if (!ya.extras.includes(e)) ya.extras.push(e); return; }
    lista.push({ clave, P, S, extras });
  }

  // lo que cambiaría si la cámara estuviera en `pos` (según la regla de cada uno)
  function cambiosEn(pos) {
    return conmutadores.filter((c) => c.objetos[0].parent && (c.visibleEn(pos) ?? seVe(c)) !== seVe(c));
  }

  function predecir(futura) {
    const lista = [];
    // lo que el LOD va a aplicar en su próxima vuelta (corre cada tanto, no en cada cuadro)
    const pendientes = cambiosEn(camara.position);
    if (pendientes.length) desear(lista, pendientes);
    // lo que va a ver el jugador al entrar (desde el menú la cámara está en otro lado)
    if (futura) {
      const cambian = cambiosEn(futura);
      if (cambian.length) desear(lista, cambian);
    }
    // lo que está por aparecer u ocultarse: hasta tres grupos con luces cerca del corte, y
    // sus mezclas; lo que no tiene luces y está por aparecer, con las luces de ahora
    const cercaLuz = [], cercaSin = [];
    for (const c of conmutadores) {
      if (!c.objetos[0].parent) continue;
      const m = c.margen();
      if (m >= c.umbral) continue;
      if (c.conLuces) cercaLuz.push([m, c]);
      else if (!seVe(c)) cercaSin.push(c);
    }
    cercaLuz.sort((a, b) => a[0] - b[0]);
    const n = Math.min(3, cercaLuz.length);
    for (let mask = 1; mask < (1 << n); mask++) {
      const cs = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) cs.push(cercaLuz[i][1]);
      desear(lista, cs);
    }
    if (cercaSin.length) desear(lista, cercaSin);
    const base = contar();
    deseadas = lista.filter((d) => d.P !== base.P || d.S !== base.S || d.extras.length);
    for (const d of deseadas) {
      // con las luces de ahora, lo que ya está a la vista ya tiene sus programas
      d.soloExtras = d.P === base.P && d.S === base.S;
      if (!hechas.has(d.clave)) { hechas.set(d.clave, new Set()); cursores.set(d.clave, 0); }
    }
  }

  function anotar(lista, visto, o, soloIluminados) {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || (soloIluminados && !usaLuces(m))) continue;
      const f = firmaDe(o, m);
      if (visto.has(f)) continue;
      visto.add(f);
      lista.push([f, o]);
    }
  }
  // lo iluminado a la vista, de a pedazos; cuando termina, vuelve a empezar al rato
  function recorrer(presupuesto, ahora) {
    if (!pila.length) {
      if (ahora - ultimoRecorrido < 1000) return;
      ultimoRecorrido = ahora;
      pila = [escena];
    }
    while (pila.length && presupuesto-- > 0) {
      const o = pila.pop();
      if (!o.visible) continue;
      anotar(catalogo, enCatalogo, o, true);
      const h = o.children;
      for (let i = h.length - 1; i >= 0; i--) pila.push(h[i]);
    }
  }
  // todo lo de adentro de un grupo que va a aparecer (iluminado o no: lo que no usa luces
  // igual toma la cantidad de luces del momento en que se dibuja por primera vez)
  function contenidoDe(obj) {
    let c = contenido.get(obj);
    if (!c) {
      c = [];
      const visto = new Set();
      obj.traverse((o) => anotar(c, visto, o, false));
      contenido.set(obj, c);
    }
    return c;
  }

  // compila sin dejar rastro: three guarda el programa nuevo en sus cachés, y el estado de
  // cada material que ya se había dibujado (programa actual, uniformes, versión) queda
  // exactamente como estaba. Uno que todavía no se dibujó queda con lo que armó three,
  // como si hubiera aparecido: al dibujarse, three revisa y elige igual que siempre.
  function compilarUno(P, S, o) {
    const muestra = escenaDeMuestra(P, S);
    const props = renderer.properties;
    const guardados = [];
    o.traverse((x) => {
      if (!x.material) return;
      for (const m of Array.isArray(x.material) ? x.material : [x.material]) {
        if (!m || guardados.some((g) => g[0] === m)) continue;
        const p = props.get(m);
        // three apunta los uniformes de luces del material a los de la muestra: se guardan
        const valores = p.uniforms ? Object.entries(p.uniforms).map(([k, u]) => [u, u?.value]) : [];
        guardados.push([m, m.version, { ...p }, valores]);
      }
    });
    const rt = renderer.getRenderTarget();
    const capas = fuentes.map((l) => l.layers.mask);
    // las luces del juego que cuelguen del objeto no cuentan: las cantidades las pone la muestra
    for (const l of fuentes) l.layers.mask = 0;
    try {
      renderer.setRenderTarget(objetivo());
      renderer.compile(o, camara, muestra);
    } finally {
      fuentes.forEach((l, i) => { l.layers.mask = capas[i]; });
      renderer.setRenderTarget(rt);
      for (const [m, version, antes, valores] of guardados) {
        if (!antes.programs) continue;
        const p = props.get(m);
        const programas = p.programs;
        for (const k of Object.keys(p)) if (!(k in antes)) delete p[k];
        Object.assign(p, antes);
        if (programas) p.programs = programas;
        for (const [u, v] of valores) if (u) u.value = v;
        m.version = version;
      }
    }
    stats.compiladas++;
  }

  function siguiente(d) {
    const h = hechas.get(d.clave);
    for (const e of d.extras) for (const [f, o] of contenidoDe(e)) if (!h.has(f)) { h.add(f); return o; }
    if (d.soloExtras) return null;
    let i = cursores.get(d.clave);
    while (i < catalogo.length) {
      const [f, o] = catalogo[i++];
      if (!h.has(f)) { h.add(f); cursores.set(d.clave, i); return o; }
    }
    cursores.set(d.clave, i);
    return null;
  }

  // cada cuadro, después de dibujar: poco trabajo y acotado. `ahora` en milisegundos;
  // `futura`: dónde va a estar la cámara al empezar a jugar (en el menú), o null
  function actualizar(ahora, futura = null) {
    if (presupuestoActivo) return;   // 3.3: con el presupuesto fijo la cantidad no cambia
    if (ahora - ultimaPrediccion > 300) { ultimaPrediccion = ahora; predecir(futura); }
    if (!deseadas.length) return;
    // el catálogo de lo que está a la vista sólo hace falta si va a cambiar la cantidad de luces
    if (deseadas.some((d) => !d.soloExtras)) recorrer(600, ahora);
    const t0 = performance.now();
    let n = 0;
    for (const d of deseadas) {
      let o;
      while ((o = siguiente(d))) {
        compilarUno(d.P, d.S, o);
        n++;
        if (n >= 3 || performance.now() - t0 > 3) { stats.ms += performance.now() - t0; return; }
      }
    }
    stats.ms += performance.now() - t0;
  }

  // Al terminar la carga: se compila todo lo de la escena (esté a la vista o no) para las
  // cantidades de luces de los primeros cuadros y de cuando el jugador entra, contra la
  // misma salida que se va a dibujar. Antes se compilaba contra la pantalla (sin el
  // postproceso) y con todas las luces del valle, y el primer cuadro recompilaba casi todo.
  // Como la compilación de siempre, deja a three con los programas listos y nada más: el
  // primer dibujo de cada material elige su programa como siempre.
  function compilarCarga(posJugador) {
    // 3.3: con el presupuesto fijo, una sola cantidad de luces: se compila todo de una vez,
    // en paralelo si la placa puede (compileAsync), contra la salida del postproceso
    if (presupuestoActivo) return presupuestoActivo.compilarTodo(renderer, objetivo());
    // los primeros cuadros: el LOD todavía no corrió (todo a la vista) pero lo que se decide
    // en cada cuadro (el tren) ya está; y el juego, con todo según dónde aparece el jugador
    const cambios = cambiosEn(posJugador);
    const cantidades = [cantidadCon(cambios.filter((c) => c.alInstante)), cantidadCon(cambios)];
    const claves = new Set();
    const rt = renderer.getRenderTarget();
    const capas = fuentes.map((l) => l.layers.mask);
    for (const l of fuentes) l.layers.mask = 0;
    try {
      renderer.setRenderTarget(objetivo());
      for (const { P, S } of cantidades) {
        if (claves.has(P + ',' + S)) continue;
        claves.add(P + ',' + S);
        // las luces del sol y del cielo las pone la escena; las puntuales y los focos, la muestra
        renderer.compile(escena, camara, escenaDeMuestra(P, S, false));
      }
    } finally {
      fuentes.forEach((l, i) => { l.layers.mask = capas[i]; });
      renderer.setRenderTarget(rt);
    }
    return [...claves];
  }

  const api = { conmutador, actualizar, contar, compilarCarga, stats, fuentes, conmutadores };
  escena.userData.variantesLuces = api;   // para las pruebas y el diagnóstico (?debug=1)
  return api;
}

// ============================================================ 3.3: presupuesto fijo de luces
//
// Una cantidad fija de luces puntuales y de focos, siempre en la escena y siempre visibles.
// Cada cuadro, justo antes de que three junte las luces (`onBeforeRender` de la escena, ya con
// las matrices al día), las luces del juego que cuentan (visibles, prendidas y con su alcance
// dentro de lo que ve la cámara) se copian a las fijas: la más cercana primero. Las que sobran
// quedan con intensidad 0 y lejos. Así el shader de cada material es siempre el mismo: no hay
// programas nuevos cuando aparece un edificio con luces o el tren.
//
// Las fuentes que no entran en el cupo son las más lejanas: su alcance (la distancia de corte)
// casi no llega a lo que se ve. Para no hacer saltar la luz, una fuente que ya tenía lugar lo
// conserva mientras siga entre las elegidas (el orden de la suma tampoco cambia).

// El cupo: lo mínimo que cubre lo medido. Recorrido de noche por el valle (refugio, galpón,
// almacén, casa de té, faro, molino, cabaña, puesto, mirador): como mucho 3 puntuales y 1 foco
// prendidos y con su alcance a la vista a la vez. Con 8+2 la placa pagaba de más en cada
// píxel iluminado; 4+1 deja una de margen y, si alguna vez hay más, quedan afuera las lejanas.
export const PRESUPUESTO_LUCES = { puntuales: 4, focos: 1 };

// Elige qué fuentes van a cada lugar. `candidatas`: [{ fuente, puntaje }] (menor = más
// importante); `previas`: lo que tenía cada lugar el cuadro anterior. Devuelve un arreglo de
// `cupo` lugares (fuente o null). Pura: la usan las pruebas.
export function repartirLuces(candidatas, cupo, previas = []) {
  const orden = candidatas.slice().sort((a, b) => a.puntaje - b.puntaje);
  const elegidas = new Set();
  for (let i = 0; i < orden.length && elegidas.size < cupo; i++) elegidas.add(orden[i].fuente);
  const lugares = new Array(cupo).fill(null);
  const ubicadas = new Set();
  for (let i = 0; i < cupo; i++) {
    const f = previas[i];
    if (f && elegidas.has(f) && !ubicadas.has(f)) { lugares[i] = f; ubicadas.add(f); }
  }
  let libre = 0;
  for (const f of orden) {
    if (!elegidas.has(f.fuente) || ubicadas.has(f.fuente)) continue;
    while (lugares[libre]) libre++;
    lugares[libre] = f.fuente; ubicadas.add(f.fuente);
  }
  return lugares;
}

// qué tan importante es una fuente vista desde `cam` (metros que le faltan a la cámara para
// entrar en su alcance; adentro, 0 menos un poco por cercanía para desempatar)
export function puntajeLuz(x, y, z, alcance, cam) {
  const d = Math.hypot(x - cam.x, y - cam.y, z - cam.z);
  return alcance > 0 ? Math.max(0, d - alcance) * 1000 + d : d;
}

export function crearPresupuestoLuces(escena, camara, { puntuales = PRESUPUESTO_LUCES.puntuales, focos = PRESUPUESTO_LUCES.focos } = {}) {
  const grupo = new THREE.Group();
  grupo.name = 'presupuesto-luces';
  const fijasP = [], fijasS = [];
  const LEJOS = new THREE.Matrix4().makeTranslation(0, -1e5, 0);
  sinAzar(() => {
    for (let i = 0; i < puntuales; i++) {
      const l = new THREE.PointLight(0x000000, 0, 1, 2);
      l.matrixAutoUpdate = false; l.matrixWorldAutoUpdate = false; l.matrixWorld.copy(LEJOS);
      grupo.add(l); fijasP.push(l);
    }
    for (let i = 0; i < focos; i++) {
      const l = new THREE.SpotLight(0x000000, 0, 1, 0.5, 0, 2);
      l.matrixAutoUpdate = false; l.matrixWorldAutoUpdate = false; l.matrixWorld.copy(LEJOS);
      l.target.matrixAutoUpdate = false; l.target.matrixWorldAutoUpdate = false;
      grupo.add(l); fijasS.push(l);
    }
  });
  const capas = new Map();   // fuente → su máscara de capas de verdad (three ve 0)
  let previasP = [], previasS = [];
  const stats = { vivas: 0, maxVivas: 0, maxP: 0, maxS: 0, fuera: 0, cuadros: 0 };
  // (el three incluido no trae Frustum: los cuatro costados de la vista se arman a mano)
  const enVista = new THREE.Vector3();
  const lados = { ch: 1, sh: 0, cv: 1, sv: 0, ok: false };
  const camPos = new THREE.Vector3();
  const candP = [], candS = [];

  function esconder(l) {
    if (!capas.has(l)) capas.set(l, l.layers.mask);
    l.layers.mask = 0;
  }
  function cuenta(l, cam) {
    if (!(capas.get(l) & cam.layers.mask)) return false;
    if (!(l.intensity > 0)) return false;
    for (let o = l; o; o = o.parent) {
      if (!o.visible) return false;
      if (o === escena) return true;
    }
    return false;
  }
  function copiar(fija, f) {
    fija.color.copy(f.color);
    fija.intensity = f.intensity;
    fija.distance = f.distance;
    fija.decay = f.decay;
    fija.matrixWorld.copy(f.matrixWorld);
    if (fija.isSpotLight) {
      fija.angle = f.angle; fija.penumbra = f.penumbra;
      f.target.updateWorldMatrix(true, false);
      fija.target.matrixWorld.copy(f.target.matrixWorld);
    }
  }
  function apagar(fija) {
    fija.intensity = 0; fija.distance = 1;
    fija.matrixWorld.copy(LEJOS);
    if (fija.isSpotLight) fija.target.matrixWorld.copy(LEJOS);
  }
  // ¿la esfera (centro en el mundo, radio) toca lo que ve la cámara? Los cuatro costados de
  // la pirámide de la vista (sin el plano lejano: los alcances son cortos)
  function seVeLaEsfera(x, y, z, r, cam) {
    if (!lados.ok) return true;
    enVista.set(x, y, z).applyMatrix4(cam.matrixWorldInverse);
    const { x: vx, y: vy, z: vz } = enVista;
    if (vz > r) return false;                                    // toda atrás
    if (vx * lados.ch + vz * lados.sh > r) return false;         // derecha
    if (-vx * lados.ch + vz * lados.sh > r) return false;        // izquierda
    if (vy * lados.cv + vz * lados.sv > r) return false;         // arriba
    if (-vy * lados.cv + vz * lados.sv > r) return false;        // abajo
    return true;
  }
  // cada cuadro, con las matrices de la escena ya al día
  function asignar(cam) {
    candP.length = 0; candS.length = 0;
    cam.getWorldPosition(camPos);
    lados.ok = !!cam.isPerspectiveCamera;
    if (lados.ok) {
      const tv = Math.tan((cam.fov * Math.PI) / 360) / (cam.zoom || 1);
      const v = Math.atan(tv), h = Math.atan(tv * cam.aspect);
      lados.ch = Math.cos(h); lados.sh = Math.sin(h); lados.cv = Math.cos(v); lados.sv = Math.sin(v);
    }
    let fuera = 0;
    for (let i = 0; i < fuentes.length; i++) {
      const f = fuentes[i];
      if (!capas.has(f)) esconder(f);
      if (!cuenta(f, cam)) continue;
      const e = f.matrixWorld.elements;
      // una fuente con alcance que no toca lo que ve la cámara no ilumina ningún píxel
      if (f.distance > 0) {
        if (!seVeLaEsfera(e[12], e[13], e[14], f.distance, cam)) { fuera++; continue; }
      }
      (f.isSpotLight ? candS : candP).push({ fuente: f, puntaje: puntajeLuz(e[12], e[13], e[14], f.distance, camPos) });
    }
    previasP = repartirLuces(candP, puntuales, previasP);
    previasS = repartirLuces(candS, focos, previasS);
    for (let i = 0; i < puntuales; i++) previasP[i] ? copiar(fijasP[i], previasP[i]) : apagar(fijasP[i]);
    for (let i = 0; i < focos; i++) previasS[i] ? copiar(fijasS[i], previasS[i]) : apagar(fijasS[i]);
    stats.cuadros++;
    stats.vivas = candP.length + candS.length; stats.fuera = fuera;
    stats.maxVivas = Math.max(stats.maxVivas, stats.vivas);
    stats.maxP = Math.max(stats.maxP, candP.length); stats.maxS = Math.max(stats.maxS, candS.length);
  }

  function activar() {
    if (presupuestoActivo === api) return;
    for (const l of fuentes) esconder(l);
    escena.add(grupo);
    const antes = escena.onBeforeRender;
    escena.onBeforeRender = function (renderer, sc, cam, rt) {
      antes.call(this, renderer, sc, cam, rt);
      asignar(cam);
    };
    presupuestoActivo = api;
  }

  // todo lo de la escena (a la vista o no) con la única cantidad de luces que va a haber, en
  // paralelo si el driver puede (KHR_parallel_shader_compile); devuelve una promesa
  function compilarTodo(renderer, objetivo) {
    const rt = renderer.getRenderTarget();
    renderer.setRenderTarget(objetivo || null);
    let espera;
    try { espera = renderer.compileAsync(escena, camara); } finally { renderer.setRenderTarget(rt); }
    return Promise.resolve(espera).then(() => [puntuales + ',' + focos]);
  }

  // (la que ya salió de la escena: vuelve a su máscara de verdad, por si se registra otra vez; una que
  // sigue colgada queda como estaba, escondida)
  const soltar = (l) => { if (!capas.has(l) || l.parent) return; l.layers.mask = capas.get(l); capas.delete(l); };
  const api = { grupo, activar, esconder, soltar, asignar, compilarTodo, stats, puntuales, focos, fijasP, fijasS };
  escena.userData.presupuestoLuces = api;   // para las pruebas y el diagnóstico (F3, ?debug=1)
  return api;
}
