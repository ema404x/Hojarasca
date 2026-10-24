// 4.8: los ataques del Desafío, el enganche con el juego (lo puro está en desafio-lados.js,
// desafio-tacticas.js y desafio-duendes-nuevos.js). Esto no tiene THREE: trabaja con los invasores del
// Desafío (`a.m.g.position`, `a.def`, `a.estado`...) y con lo que le da `crearDesafio`.
//
//   · Por dónde entran: el lado de la noche (`D().ladoNoche`: río, monte o camino) se decide al caer la tarde
//     y es de donde bajan; si estás lejos de la base (a más de 220 m) entran por ese rumbo alrededor tuyo.
//   · Tácticas: los señuelos (otro lado, bulla, una defensa lejana) y el rodeo.
//   · El curandero (se queda atrás, cura, huye) y el enjambre (se mueve como una nube).
//
// Todo campo nuevo por invasor se limpia en `limpiar(a)` (lo llama `bajarAlien`): los invasores se reciclan.
import { NOMBRE_LADO, LADO_DE, planDeLados, muestraDelTerreno, ladoNocheNuevo } from './desafio-lados.js';
import { hayDistraccion, repartirGrupos, partirItem, ritmoDeBajada, tiempoDeSenuelo, esperaDeRuido, terminaSenuelo, blancoDelSenuelo, debeRodear, desvioDeRodeo, RODEO } from './desafio-tacticas.js';
import { CURA, MAX_ENJAMBRE, vidaCurada, elegirCurados, puedeCurar, puestoDeRetaguardia, movimientoCurandero, zumbidoDelEnjambre, manchaDelEnjambre } from './desafio-duendes-nuevos.js';

export const FUERA_DE_LA_BASE = 220;   // más lejos que esto de la base, entran por ese rumbo pero alrededor tuyo
export const DISTANCIA_ENTRADA = 84;   // y a esta distancia de vos
export const MAX_INVASORES = 24;       // el tope de siempre (los que no son enjambre)

export function crearAtaques(api) {
  const { T } = api;
  const D = api.D;
  let plan = null, planClave = '';
  let pendiente = null;           // lo que está bajando de la cola: { tipo, senuelo }
  let enjambreK = 0, enjambreN = 0;
  let reloj = 0, ultimoRuido = -99, distraccion = null;   // (el reloj es el del juego: segundos de cuadro)
  const grupo = { x: 0, z: 0, n: 0 };
  const _cands = [];

  // ------------------------------------------------------------ los lados
  function planActual() {
    const b = api.base();
    const clave = `${Math.round(b.x)},${Math.round(b.z)}`;
    if (plan && clave === planClave) return plan;
    const lugares = Object.values(T.lugares || {}).filter((l) => Number.isFinite(l?.x) && Number.isFinite(l?.z));
    plan = planDeLados({ x: b.x, z: b.z }, muestraDelTerreno(T, { lugares }));
    planClave = clave;
    return plan;
  }
  // Decide el lado de la noche `noche` (la que viene: oleadas + 1) y lo deja en `D().ladoNoche`. Si ya está
  // decidido para esa noche (se guardó la partida a la tarde), queda ese.
  function decidir(noche) {
    const d = D();
    if (d.ladoNoche && d.ladoNoche.noche === noche) return d.ladoNoche;
    const p = planActual();
    d.ladoNoche = ladoNocheNuevo(p, d.semilla, noche, (x, z) => api.libre(x, z));
    return d.ladoNoche;
  }
  const ladoDe = (noche) => {
    const l = D().ladoNoche;
    return l && l.noche === noche ? l : decidir(noche);
  };
  // Cómo se llama el lado de esta noche («el monte»), o null si no hay o no vale (el blanco está en otro lado).
  function nombreDelLado(noche) {
    const l = D().ladoNoche;
    return l && l.noche === noche && !l.anulado ? NOMBRE_LADO[l.id] : null;
  }
  // Una noche en que el blanco está en otro lado (rescate, trochita, asedio) el lado no cuenta.
  function anularLado() { const l = D().ladoNoche; if (l && !l.anulado) l.anulado = true; }

  // Dónde bajan los duendes esta noche (lo usa `puntoDeAterrizaje`): el punto del lado, o el rumbo del
  // lado alrededor tuyo si estás lejos de la base. null: que siga el camino de siempre.
  function puntoDeEntrada(js, noche) {
    if (api.blancoNoche()) { anularLado(); return null; }
    const l = ladoDe(noche);
    if (!l || l.anulado) return null;
    const b = api.base();
    const lejos = Math.hypot(js.pos.x - b.x, js.pos.z - b.z) > FUERA_DE_LA_BASE;
    const valido = (x, z) => Math.abs(x) <= api.limite - 25 && Math.abs(z) <= api.limite - 25 && !T.agua(x, z);
    if (!lejos) return valido(l.x, l.z) ? { x: l.x, z: l.z } : null;
    for (let i = 0; i < 12; i++) {
      const r = l.rumbo + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.12;
      const x = js.pos.x + Math.sin(r) * DISTANCIA_ENTRADA, z = js.pos.z + Math.cos(r) * DISTANCIA_ENTRADA;
      if (valido(x, z)) return { x, z };
    }
    return null;
  }

  // La pista de la tarde: durante la última hora el perro mira hacia el lado por donde van a entrar (un rato
  // cada tanto: no se queda duro toda la hora).
  function alertaDeLaTarde(horas, horaAtaque, ahoraMs) {
    if (!(horas >= horaAtaque - 0.75 && horas < horaAtaque)) return null;
    // 4.10.2: si por la cadena la noche entra por una defensa sin arreglar (la brecha), el perro mira hacia ahí: el lado viejo ya no vale
    const b = api.brechaProxima?.() || null;
    const l = D().ladoNoche;
    if (!b && (!l || l.noche !== D().oleadas + 1 || l.anulado)) return null;
    const mira = b || l;
    return ((ahoraMs / 1000) % 45) < 14 ? { x: mira.x, z: mira.z } : null;
  }

  // ------------------------------------------------------------ la cola de bajada
  // Cada elemento es el tipo, o `tipo:s` si es un señuelo (ver desafio-tacticas.js).
  function alEmpezar(tipos, nuevaNoche, retomada, puntoFijo) {
    enjambreK = 0; enjambreN = tipos.reduce((n, t) => n + (t === 'enjambre' ? 1 : 0), 0);
    if (!nuevaNoche || retomada || puntoFijo) return tipos;
    const d = D();
    if (api.blancoNoche()) { anularLado(); return tipos; }
    const l = ladoDe(d.oleadas);
    if (!l || l.anulado || !l.otro) return tipos;
    if (!hayDistraccion({ noche: d.oleadas, total: tipos.length, hayOtroLado: true, jefe: tipos.includes('jefe'), final: api.esFinal(), especial: d.especial })) return tipos;
    const r = repartirGrupos(tipos, d.oleadas);
    if (!r.senuelos) return tipos;
    const marca = distraccion = { noche: d.oleadas, lado: l.otro.id, senuelos: r.senuelos };
    setTimeout(() => {
      if (distraccion !== marca) return;
      api.nota(`Se oye bulla ${LADO_DE[l.otro.id]}`, `Unos hacen ruido mientras los demás entran por ${NOMBRE_LADO[l.id]}. No te la creas`, true);
    }, 3800);
    return r.lista;
  }
  const tipoDe = (item) => partirItem(item).tipo;
  const marcarBajada = (item) => { pendiente = partirItem(item); };
  function consumirBajada() { const p = pendiente; pendiente = null; return p; }
  const ritmoTras = (item, siguiente) => ritmoDeBajada(item, siguiente, D().oleadas);
  // ¿No hay lugar? Los enjambres tienen su propio cupo: no le quitan lugar a los demás.
  function lleno(def, tope = MAX_INVASORES) {
    let n = 0, e = 0;
    for (const a of api.aliens) { if (a.def.enjambre) e++; else n++; }
    return def.enjambre ? e >= MAX_ENJAMBRE : n >= tope;
  }
  // Dónde sale uno (null: de la nave, como siempre). `nave` es el punto de la nave.
  function salida(bajada, tipo, nave) {
    if (bajada?.senuelo) {
      const o = D().ladoNoche?.otro;
      if (o) return { x: o.x + (Math.random() - 0.5) * 5, z: o.z + (Math.random() - 0.5) * 5, alPie: true };
    }
    if (tipo === 'enjambre') {
      const m = manchaDelEnjambre(enjambreK++, Math.max(1, enjambreN));
      return { x: nave.x + m.dx, z: nave.z + m.dz, alPie: false };
    }
    return null;
  }
  // Recién nacido (ya en la lista): el señuelo sale del suelo, con su blanco; el curandero, con sus cuentas.
  function alNacer(a, bajada) {
    if (bajada?.senuelo && D().ladoNoche?.otro) {
      const p = a.m.g.position, js = api.jugador().estado, b = api.base();
      const o = D().ladoNoche.otro;
      const blanco = blancoDelSenuelo({ x: o.x, z: o.z }, b, js.pos, api.defensas());
      a.senuelo = { t: 0, tiempo: tiempoDeSenuelo(D().oleadas), blanco, ruido: esperaDeRuido() };
      p.y = T.altura(p.x, p.z);
      a.estado = 'avanzar'; a.t = 0;
      api.polvo(p);
      api.risa(p, a);
    }
    if (a.def.cura) { const q = a.m.g.position; a.curas = 0; a.tCura = CURA.cada * 0.6; a.tSolo = 0; a.retaX = q.x; a.retaZ = q.z; a.aliados = 1; }
  }
  // Lo que se limpia en cada reciclado (todo lo que este módulo le agrega a un invasor).
  function limpiar(a) {
    a.senuelo = null; a.rodeoT = 0; a.rodeos = 0;
    a.curas = 0; a.tCura = 0; a.tSolo = 0; a.retaX = 0; a.retaZ = 0; a.aliados = 0;
  }

  // ------------------------------------------------------------ cada cuadro
  // Una pasada por los invasores: el centro del grupo, los señuelos (tiempo y bulla) y los curanderos.
  function actualizar(dt, js) {
    const aliens = api.aliens;
    reloj += dt;
    if (!aliens.length) return;
    let n = 0, cx = 0, cz = 0, hayCuranderos = false, hayConDuracion = false;
    for (const a of aliens) {
      if (a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar') continue;
      if (a.senuelo) hayConDuracion = true;
      if (a.def.cura) { hayCuranderos = true; continue; }
      if (a.def.vuela || a.estado === 'bajoTierra' || a.estado === 'dormido' || a.enNave) continue;
      const p = a.m.g.position; cx += p.x; cz += p.z; n++;
    }
    grupo.n = n;
    if (n) { grupo.x = cx / n; grupo.z = cz / n; }
    if (hayConDuracion) senuelos(dt, js);
    if (hayCuranderos) curanderos(dt, js);
  }
  // Los señuelos: corre su tiempo (aunque estén rompiendo su defensa), hacen bulla de a uno, y terminan.
  function senuelos(dt, js) {
    const aliens = api.aliens;
    for (const a of aliens) {
      const s = a.senuelo;
      if (!s) continue;
      if (a.estado === 'morir' || a.estado === 'irse') { a.senuelo = null; continue; }
      s.t += dt;
      const p = a.m.g.position;
      const vigente = s.blanco.tipo !== 'obra' || api.obraViva(s.blanco.obra.o);
      if (terminaSenuelo({ t: s.t, tiempo: s.tiempo, distanciaAlJugador: Math.hypot(p.x - js.pos.x, p.z - js.pos.z), conBlanco: vigente })) {
        a.senuelo = null;
        if (a.estado === 'romper') { a.estado = 'avanzar'; a.obra = null; }
        continue;
      }
      s.ruido -= dt;
      if (s.ruido <= 0) {
        s.ruido = esperaDeRuido();
        if (reloj - ultimoRuido > 1.1) { ultimoRuido = reloj; api.risa(p, a); }   // (de a una: la risa de otra, 1 s después como mínimo)
      }
    }
  }
  // El centro de los `k` compañeros más cercanos a `c` (los que andan por tierra); null si no hay ninguno.
  const _kd = [0, 0, 0, 0], _kx = [0, 0, 0, 0], _kz = [0, 0, 0, 0], _cen = { x: 0, z: 0 };
  function cercanos(c, p) {
    let n = 0;
    for (const a of api.aliens) {
      if (a === c || a.def.cura || a.def.vuela || a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.estado === 'bajoTierra' || a.estado === 'dormido' || a.enNave) continue;
      const q = a.m.g.position, d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
      if (n === 4 && d >= _kd[3]) continue;
      let i = n < 4 ? n++ : 3;
      while (i > 0 && _kd[i - 1] > d) { _kd[i] = _kd[i - 1]; _kx[i] = _kx[i - 1]; _kz[i] = _kz[i - 1]; i--; }
      _kd[i] = d; _kx[i] = q.x; _kz[i] = q.z;
    }
    if (!n) return null;
    let sx = 0, sz = 0;
    for (let i = 0; i < n; i++) { sx += _kx[i]; sz += _kz[i]; }
    _cen.x = sx / n; _cen.z = sz / n;
    return _cen;
  }
  // Los curanderos: se paran detrás del grupo y curan.
  function curanderos(dt, js) {
    const aliens = api.aliens;
    for (const c of aliens) {
      if (!c.def.cura || c.estado !== 'avanzar') continue;
      const p = c.m.g.position;
      // con los cuatro compañeros que tiene más cerca (no con todo el grupo: puede estar partido en dos lados)
      const ref = cercanos(c, p) || grupo;
      const ret = puestoDeRetaguardia(ref, js.pos);
      c.retaX = ret.x; c.retaZ = ret.z;
      c.aliados = grupo.n + api.porBajar();
      c.tSolo = c.aliados ? 0 : c.tSolo + dt;
      c.tCura = Math.min(CURA.cada * 2, c.tCura + dt);
      if (!puedeCurar(c.tCura, c.curas)) continue;
      // los heridos a su alcance
      _cands.length = 0;
      for (const a of aliens) {
        if (a === c || a.estado === 'morir' || a.estado === 'irse' || a.estado === 'bajar' || a.enNave) continue;
        const q = a.m.g.position;
        _cands.push({ a, id: _cands.length, vida: a.vida, vidaMax: a.vidaMax, distancia: Math.hypot(q.x - p.x, q.z - p.z), jefe: !!a.def.jefe, cura: !!a.def.cura });
      }
      const elegidos = elegirCurados(_cands);
      if (!elegidos.length) continue;
      for (const e of elegidos) {
        const a = e.a;
        a.vida = vidaCurada(a.vida, a.vidaMax);
        api.destelloCura(a.m.g.position, a.def.altura * a.m.esc);
      }
      c.curas++; c.tCura = 0;
      api.efectoCurandero(p, c);
    }
  }

  // ------------------------------------------------------------ guiar (dentro de actualizarAlien)
  // Se llama cuando el invasor está avanzando y tiene algo de esto. Devuelve { rumbo, mult } (el rumbo al que
  // va y cuánto de su velocidad usa) o null para que siga con lo suyo.
  function guiar(a, dt, js, dist, rumboObj) {
    const p = a.m.g.position, def = a.def;
    if (a.rodeoT > 0) {
      a.rodeoT -= dt;
      if (a.desvioT <= 0) { a.desvio = desvioDeRodeo(a.sentido, Math.max(0, a.rodeos - 1)); a.desvioT = 0.7; }
    }
    if (a.senuelo) {
      const b = a.senuelo.blanco, dx = b.x - p.x, dz = b.z - p.z, d = Math.hypot(dx, dz);
      if (b.tipo === 'obra') {
        if (d < 3 + def.radio) {
          if (api.obraViva(b.obra.o)) { a.estado = 'romper'; a.obra = b.obra.o; a.cd = Math.min(a.cd, 0.4); }
          return { rumbo: Math.atan2(dx, dz), mult: 0 };
        }
        return { rumbo: Math.atan2(dx, dz), mult: 0.9 };
      }
      return d < 3 ? { rumbo: Math.atan2(dx, dz), mult: 0 } : { rumbo: Math.atan2(dx, dz), mult: 0.8 };
    }
    if (def.cura) {
      // sin nadie a quien curar: un rato corre, y después se rinde y se queda quieto (para poder terminar la noche)
      if (a.tSolo >= CURA.soloSeVa) return { rumbo: a.rumbo, mult: 0 };
      const m = movimientoCurandero({ dist, aliados: a.aliados, pos: p, retaguardia: { x: a.retaX, z: a.retaZ }, jugador: js.pos });
      if (m.modo === 'quedarse' || !m.rumboHacia) return { rumbo: Math.atan2(js.pos.x - p.x, js.pos.z - p.z), mult: 0 };
      return { rumbo: Math.atan2(m.rumboHacia.x - p.x, m.rumboHacia.z - p.z), mult: m.vel };
    }
    if (def.enjambre) return { rumbo: rumboObj + zumbidoDelEnjambre(a.fase, a.fase), mult: 1 };
    return null;
  }

  // El duende se topó con la defensa `o`: ¿la rodea en vez de chocarla? Si sí, deja puesto el desvío.
  function rodear(a, o) {
    let vecinos = 0, rompiendo = 0;
    const p = a.m.g.position, R2 = RODEO.radio * RODEO.radio;
    for (const b of api.aliens) {
      if (b === a || (b.estado !== 'avanzar' && b.estado !== 'romper')) continue;
      const q = b.m.g.position, dx = q.x - p.x, dz = q.z - p.z;
      if (dx * dx + dz * dz < R2) vecinos++;
      if (b.estado === 'romper' && b.obra === o) rompiendo++;
    }
    if (!debeRodear({ noche: D().oleadas, vecinos, rompiendo, veces: a.rodeos || 0, pesado: !!a.def.pesado, aDistancia: !!a.def.aDistancia, jefe: !!a.def.jefe })) return false;
    a.rodeos = (a.rodeos || 0) + 1;
    a.rodeoT = RODEO.tiempo;
    a.desvio = desvioDeRodeo(a.sentido, a.rodeos - 1); a.desvioT = 0.7;
    a.atasco = 0;
    return true;
  }

  return {
    planActual, decidir, ladoDe, anularLado, nombreDelLado, puntoDeEntrada, alertaDeLaTarde,
    alEmpezar, tipoDe, marcarBajada, consumirBajada, ritmoTras, lleno, salida, alNacer, limpiar,
    actualizar, guiar, rodear,
    get lado() { return D().ladoNoche || null; },
    get grupo() { return grupo; },
    get distraccion() { return distraccion; },
  };
}
