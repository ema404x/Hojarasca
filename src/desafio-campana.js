// 4.9 aliados: la campana de alarma, tocada a mano.
//
// La «Campana de alarma» (la pieza `campana` del taller, desde la 1.x) ya avisaba sola cuando un duende se acercaba a 30 m. Ahora
// también se puede tocar: mirándola de cerca, E. Al tocarla (suena un tañido de bronce sintetizado, ver desafio-campana-sonido.js):
//   · los aliados que están en la base corren a sus puestos (Don Ramón, Josefina y los vecinos que ayudan esta noche: la orden pasa a
//     «puesto», el que marcó el jugador o el que les toca por su oficio);
//   · el perro corre al portón (el más cercano a la base; sin portón, al lado por donde entran) y se queda ahí un minuto, salvo que
//     tenga a un duende encima tuyo: ahí muerde, como siempre.
// Se vuelve a poder tocar a los 14 segundos. No hace falta ninguna pieza nueva: es la misma campana, con un uso más.
import { CAMPANA } from './desafio-vecinos.js';
import { crearSonidoCampana } from './desafio-campana-sonido.js';
import { portonDeLaBase, puntoDeOrden } from './desafio-ordenes.js';

export function crearCampana(api) {
  // api: campanas() -> las campanas terminadas ({ datos: { x, y, z }, plano }); D(); nota(); sonido; centroBase(); portones(); alarmaAliados();
  //      alarmaVecinos(); lado() -> rumbo del lado de la noche o null; alturaEn(x, z)
  const snd = crearSonidoCampana(api.sonido);
  let enfria = 0, perroT = 0, destino = null, preparada = false, tPrep = 0;
  const _perro = { x: 0, z: 0, cerca: 2.4, corre: true, quieto: false };

  const cercana = (pos) => {
    let mejor = null, d0 = CAMPANA.radioE;
    for (const o of api.campanas()) {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z) - 0.3;
      if (d < d0 && Math.abs((pos.y ?? o.datos.y) - o.datos.y) < 3.2) { d0 = d; mejor = o; }
    }
    return mejor;
  };
  const avisoCerca = (pos) => {
    if (!cercana(pos)) return null;
    return enfria > 0 ? 'La campana todavía vibra' : 'Tocar la campana: los vecinos a sus puestos y el perro al portón';
  };
  // Dónde se planta el perro: del lado de adentro del portón más cercano a la base; sin portón, 5 m hacia el lado por donde entran.
  function puntoDelPerro() {
    const base = api.centroBase(), porton = portonDeLaBase(api.portones?.() || [], base);
    if (porton) return puntoDeOrden('porton', { base, porton, i: 0, puntoBase: base, jugador: { pos: base, yaw: 0 } });
    const lado = api.lado?.() ?? 0;
    return { x: base.x + Math.sin(lado) * 5, z: base.z + Math.cos(lado) * 5 };
  }
  function tocar(o) {
    enfria = CAMPANA.enfriamiento;
    snd.sonar({ x: o.datos.x, y: o.datos.y + 2.2, z: o.datos.z });
    const n = (api.alarmaAliados?.() || 0) + (api.alarmaVecinos?.() || 0);
    destino = puntoDelPerro();
    perroT = CAMPANA.perroEspera;
    api.nota('¡Suena la campana!', n ? `${n} ${n === 1 ? 'aliado corre' : 'aliados corren'} a su puesto y el perro va al portón` : 'El perro va al portón. Todavía no hay vecinos en la base', true);
    return n;
  }
  const usarCerca = (pos) => {
    const o = cercana(pos);
    if (!o) return false;
    if (enfria > 0) return true;   // la E no hace otra cosa mientras vibra (no se pisa un tañido con otro)
    tocar(o);
    return true;
  };
  function actualizar(dt) {
    if (enfria > 0) enfria = Math.max(0, enfria - dt);
    if (perroT > 0) { perroT -= dt; if (perroT <= 0) destino = null; }
    if (!preparada && (tPrep -= dt) <= 0) { tPrep = 1; preparada = snd.preparar(); }   // cuando el audio ya existe, el tañido se arma en la cola del motor
  }
  // Para el perro (main.js lo pone en `mundoPerro.antojo`: el estado de «ir a un punto»): null si no tiene que ir a ningún lado.
  const perroAlPorton = () => {
    if (!destino || !(perroT > 0)) return null;
    _perro.x = destino.x; _perro.z = destino.z;
    return _perro;
  };
  return {
    avisoCerca, usarCerca, actualizar, perroAlPorton, cercana,
    get enfriando() { return enfria > 0; }, get perroT() { return perroT; },
    __tocar: tocar,
  };
}
