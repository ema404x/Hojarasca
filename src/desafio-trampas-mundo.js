// 4.9 defensas: la trampa de miel en el mundo (las reglas y los números están en desafio-trampas.js).
//
//   · El charco de miel que se ve sobre la bandeja (se achica con los usos, se pone opaco y seco al agotarse).
//   · El duende que la pisa queda pegado lamiendo: `estadoAlien` lo frena y le saca el ataque.
//   · La miel prendida (con una brasa de la pala): arde unos segundos y quema a los pegados.
//   · E junto a la trampa: reponer la miel. `colocarTrampaMiel(x, z)`: ponerla desde afuera (preparar la noche).
//
// desafio-defensas49-juego.js lo arma con la misma `api` que las defensas y el fortín.
import * as THREE from 'three';
import { PLANO } from './construccion.js';
import { QUEMA } from './desafio-arsenal.js';
import { MIEL, sePega, pegarse, prender, arder, reponerMiel, avisoMiel, llenuraMiel, estaSeca, estaPrendida, sanearDatosMiel, usosDe } from './desafio-trampas.js';

const vivo = (a) => a.estado !== 'morir' && a.estado !== 'irse' && a.estado !== 'bajoTierra' && a.estado !== 'dormido' && !a.enNave;

export function crearTrampasMundo(T, escena, obras, efectos, sonido, api) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  let lista = [];
  function refrescar() {
    lista = [];
    for (const o of obras.obras) {
      if (o.plano.defensa?.tipo !== 'miel' || !completa(o)) continue;
      // 4.10.1: la que se arma desde el menú (O) termina sin `usos`: nace llena, como dice la ficha («aguanta 5»); antes nacía seca
      if (o.datos.usos === undefined) o.datos.usos = MIEL.usos;
      sanearDatosMiel(o.datos);
      lista.push(o);
    }
  }

  // ---------------------------------------------------------------- el charco
  // Lambert con brillo propio (emisivo tenue): el mismo programa que el resto de lo que se dibuja con luz.
  const geoCharco = new THREE.CylinderGeometry(0.92, 0.95, 0.05, 14);
  const matMiel = new THREE.MeshLambertMaterial({ color: '#d99a1f', emissive: '#4a2c04' });
  const matSeca = new THREE.MeshLambertMaterial({ color: '#6d5a33' });
  // la miel prendida: un naranja que late (Basic, como las llamas: no hay shaders nuevos)
  const matArde = new THREE.MeshBasicMaterial({ color: '#ff8f2a' });
  function crearCharco(o) {
    const m = new THREE.Mesh(geoCharco, matMiel);
    m.position.y = 0.092;
    m.receiveShadow = true;
    o.grupo.add(m);
    o.userMiel = { m, llena: -1, prendida: false };
  }
  // el charco sigue el estado de la trampa (llenura y si arde); no hace nada si no cambió
  function vestir(o) {
    if (!o.userMiel) crearCharco(o);
    const U = o.userMiel, seca = estaSeca(o.datos), k = llenuraMiel(o.datos);
    const arde = estaPrendida(o.datos);
    const quiere = arde ? -3 : seca ? -2 : k;
    if (U.llena === quiere) return;
    U.llena = quiere;
    U.m.material = arde ? matArde : seca ? matSeca : matMiel;
    const e = seca && !arde ? 0.62 : 0.55 + 0.45 * Math.max(k, arde ? 0.6 : 0);
    U.m.scale.set(e, seca && !arde ? 0.5 : 1, e);
  }

  // ---------------------------------------------------------------- cada cuadro
  let acum = 9, tFuego = 0, tLate = 0;
  function actualizar(dt) {
    tLate += dt;
    matArde.color.setRGB(1, 0.5 + 0.22 * Math.sin(tLate * 13) + 0.08 * Math.sin(tLate * 31), 0.1);
    acum += dt;
    if (acum > 0.8) { acum = 0; refrescar(); for (const o of lista) vestir(o); }
    for (const o of lista) {
      if (!estaPrendida(o.datos) || !obras.obras.includes(o)) continue;
      tFuego -= dt;
      if (tFuego <= 0) {
        tFuego = 0.16;
        efectos.fuego({ x: o.datos.x + (Math.random() - 0.5) * 1.4, y: o.datos.y + 0.12, z: o.datos.z + (Math.random() - 0.5) * 1.4 }, 1.1);
      }
      if (arder(o.datos, dt) === 'termino') consumida(o);
    }
  }
  // La miel se quemó entera: los pegados se sueltan ardiendo, el charco queda seco.
  function consumida(o) {
    for (const a of api.aliens) {
      if (a.pegadoEn !== o) continue;
      soltar(a);
      if (vivo(a)) a.fuegoT = Math.max(a.fuegoT || 0, QUEMA.dura);
    }
    vestir(o);
    api.nota('La miel se quemó', 'Quedó la bandeja seca: se repone con otro frasco (E)');
    sonido.golpeRuido?.({ dur: 0.5, frec: 1400, q: 0.7, vol: 0.12, destino: sonido.fuente?.(o.datos, 1) });
  }

  // ---------------------------------------------------------------- el duende que pisa
  const SAL = { quieto: false, sinAtaque: false };
  function soltar(a) {
    if (a.m?.g && vivo(a)) a.m.g.rotation.x = 0;
    a.pegadoT = 0; a.pegadoEn = null;
  }
  function estadoAlien(a, dt) {
    SAL.quieto = false; SAL.sinAtaque = false;
    if (a.mielCd > 0) a.mielCd -= dt;
    if (a.pegadoT > 0) {
      const o = a.pegadoEn;
      if (!o || !obras.obras.includes(o)) soltar(a);
      else {
        a.pegadoT -= dt;
        // lamiendo: la cabeza va y viene
        const g = a.m.g;
        g.rotation.x = 0.2 + Math.sin(performance.now() * 0.009 + (a.fase || 0)) * 0.08;
        if (estaPrendida(o.datos)) a.fuegoT = Math.max(a.fuegoT || 0, 1.2);
        if (a.pegadoT <= 0) { soltar(a); a.mielCd = MIEL.inmune; a.mielDe = o; }
        else { SAL.quieto = true; SAL.sinAtaque = true; return SAL; }
      }
    }
    if (!lista.length || !sePega(a.def, a)) return SAL;
    const p = a.m.g.position;
    for (const o of lista) {
      const dx = p.x - o.datos.x, dz = p.z - o.datos.z;
      if (dx * dx + dz * dz > MIEL.radio * MIEL.radio) continue;
      if (a.mielCd > 0 && a.mielDe === o) continue;
      if (!obras.obras.includes(o)) continue;   // (la que se derribó hace un instante: la lista se rehace cada tanto)
      if (Math.abs(p.y - (o.datos.y ?? p.y)) > 1.2) continue;
      // pisar miel que arde: se prende
      if (estaPrendida(o.datos)) { a.fuegoT = Math.max(a.fuegoT || 0, QUEMA.dura); a.mielCd = 2; a.mielDe = o; continue; }
      const t = pegarse(o.datos, a.def, Math.random());
      if (t <= 0) continue;
      a.pegadoT = t; a.pegadoEn = o; a.mielDe = o;
      vestir(o);
      sonido.golpeRuido?.({ dur: 0.3, frec: 420, q: 1.2, tipo: 'lowpass', vol: 0.22, destino: sonido.fuente?.(p, 1) });
      SAL.quieto = true; SAL.sinAtaque = true;
      return SAL;
    }
    return SAL;
  }
  // Los invasores se reciclan: lo que quedó pegado de la vida anterior se borra (se llama desde bajarAlien).
  function limpiarAlien(a) { a.pegadoT = 0; a.pegadoEn = null; a.mielCd = 0; a.mielDe = null; }

  // ---------------------------------------------------------------- la brasa
  // La pala de brasas prende la miel de las trampas que caen a menos de `radio` de (x, z). Devuelve cuántas prendió.
  function prenderCerca(x, z, radio) {
    let n = 0;
    for (const o of lista) {
      if (Math.hypot(o.datos.x - x, o.datos.z - z) > radio + MIEL.radio) continue;
      if (!prender(o.datos)) continue;
      n++;
      vestir(o);
      efectos.fuego({ x: o.datos.x, y: o.datos.y + 0.15, z: o.datos.z }, 1.2);
      sonido.encender?.();
    }
    if (n) api.nota(n === 1 ? 'La miel prendió' : 'La miel prendió en varias trampas', 'Los que estén pegados se queman');
    return n;
  }

  // ---------------------------------------------------------------- E junto a la trampa
  function cercaDe(pos, radio = 2.4) {
    let mejor = null, d0 = radio;
    for (const o of lista) {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0 && Math.abs((o.datos.y ?? pos.y) - pos.y) < 1.8) { d0 = d; mejor = o; }
    }
    return mejor;
  }
  function avisoCerca(pos) {
    const o = cercaDe(pos);
    return o ? avisoMiel(o.datos, api.cuanto('miel')) : null;
  }
  // Echa miel en la trampa `o` (gasta un frasco). Devuelve verdadero si la repuso.
  function reponer(o) {
    const r = reponerMiel(o.datos, api.cuanto('miel'));
    if (r.accion !== 'reponer') return false;
    api.gastar('miel', r.gasta);
    vestir(o);
    sonido.juntar?.();
    api.nota('Echaste miel', `La trampa vuelve a pegar a ${MIEL.usos} duendes`);
    api.alGuardarObras?.();
    api.alFabricar?.();
    return true;
  }
  function usarCerca(pos) {
    const o = cercaDe(pos);
    if (!o || !avisoMiel(o.datos, api.cuanto('miel'))) return false;   // lo que la E ofrece es lo mismo que dice el aviso
    if (reponer(o)) return true;
    const r = reponerMiel(o.datos, api.cuanto('miel'));
    if (r.accion === 'sinMiel') api.nota('No tenés miel', 'Viene en el cofre del alba las noches impares y en los pedidos de la aldea');
    else if (r.accion === 'ardiendo') api.nota('La miel está ardiendo', 'Esperá a que se apague');
    return r.accion === 'ardiendo' || r.accion === 'sinMiel';
  }
  // El taller (categoría Base): echar miel en la trampa más cercana al jugador.
  function trampaAReponer(pos, radio = 8) {
    let mejor = null, d0 = radio;
    for (const o of lista) {
      const d = Math.hypot(o.datos.x - pos.x, o.datos.z - pos.z);
      if (d < d0 && usosDe(o.datos) < MIEL.usos && !estaPrendida(o.datos)) { d0 = d; mejor = o; }
    }
    return mejor;
  }

  // ---------------------------------------------------------------- ponerla desde afuera
  // `colocarTrampaMiel(x, z, opciones)`: la deja armada y llena en (x, z) si el lugar sirve. Gasta 2 tablas y 1 frasco de
  // miel, salvo `gratis`. Devuelve { ok, obra } o { ok: false, motivo }. La usa «preparar la noche» (agente «días»).
  function colocar(x, z, { gratis = false, rot = 0 } = {}) {
    const plano = Object.hasOwn(PLANO, 'trampa-miel') ? PLANO['trampa-miel'] : null;
    if (!plano) return { ok: false, motivo: 'No hay trampa de miel' };
    if (!Number.isFinite(x) || !Number.isFinite(z)) return { ok: false, motivo: 'Lugar inválido' };
    const r = obras.revisarSitio(x, z, plano, rot);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    if (!gratis) {
      const falta = [];
      if (api.cuanto('tabla') < plano.pide.tabla) falta.push(`${plano.pide.tabla - api.cuanto('tabla')} ${plano.pide.tabla - api.cuanto('tabla') === 1 ? 'tabla' : 'tablas'}`);
      if (api.cuanto('miel') < 1) falta.push('1 frasco de miel');
      if (falta.length) return { ok: false, motivo: `${falta.length === 1 && /^1 /.test(falta[0]) ? 'Falta' : 'Faltan'} ${falta.join(' y ')}` };
      api.gastar('tabla', plano.pide.tabla);
      api.gastar('miel', 1);
    }
    const datos = { plano: 'trampa-miel', x, z, y: r.base ?? T.altura(x, z), rot, etapas: plano.etapas.length, nombre: null, usos: MIEL.usos };
    obras.sincronizar([datos]);
    const obra = obras.obras.find((o) => o.datos === datos) || null;
    if (!obra) return { ok: false, motivo: 'No se pudo armar' };
    refrescar(); vestir(obra);
    api.alGuardarObras?.();
    return { ok: true, obra };
  }

  function limpiar() {
    for (const a of api.aliens) limpiarAlien(a);
  }
  return {
    actualizar, refrescar, estadoAlien, limpiarAlien, prenderCerca, avisoCerca, usarCerca, reponer, trampaAReponer, colocar, limpiar,
    get trampas() { return lista; },
  };
}
