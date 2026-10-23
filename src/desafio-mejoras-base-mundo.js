// 4.10 base: las defensas que mejoran, en el mundo (las reglas puras están en desafio-mejoras-base.js).
//
// Lleva la cuenta de las noches de cada defensa (en `datos.curt` de la obra, que se guarda con la partida), le baja el daño según su
// nivel, la cura un poco cuando sube y le cuelga la placa: UNA malla chica fusionada (madera o piedra, tipo 0 y 4; las barritas de
// bronce, una por nivel) que se cuelga del grupo de su obra y se va con ella. Las geometrías salen de una caché por (nivel, piedra,
// altura y fondo), así que no se arma geometría nueva cada vez que una defensa sube. Se revisa cada segundo, no cada cuadro.
import * as THREE from 'three';
import { Constructor, matriz } from './geometria.js';
import { vidaMaxObra } from './desafio-reglas.js';
import { esDePiedra } from './desafio-roto.js';
import { CURTIDO, curtible, nivelDe, factorDano, alAnochecer, tocar, alAlba, nombreCurtido, textoSubida, sitioDePlaca, piezasDePlaca } from './desafio-mejoras-base.js';

export function crearMejorasBaseMundo(obras, efectos, api) {
  const completa = (o) => o.datos.etapas >= o.plano.etapas.length && o !== obras.editando;
  const noche = () => api.D().oleadas;
  const cache = new Map();
  const _p = new THREE.Vector3();

  // la geometría fusionada de la placa: la de adelante y la de atrás, en una sola
  function geometriaDe(plano, nivel) {
    const piedra = esDePiedra(plano), sitio = sitioDePlaca(plano);
    const clave = `${nivel}|${piedra ? 1 : 0}|${sitio.y.toFixed(2)}|${sitio.z.toFixed(2)}`;
    if (cache.has(clave)) return cache.get(clave);
    const c = new Constructor();
    for (const lado of [-1, 1]) {
      for (const p of piezasDePlaca(nivel, piedra)) {
        const geo = new THREE.BoxGeometry(p.e[0], p.e[1], p.e[2]);
        const r = p.r || [0, 0, 0];
        // lado -1: la cara de adelante (mira a -z); lado 1: la de atrás, girada media vuelta
        c.agregar(geo, { color: p.color, tipo: p.tipo, variar: 0.08,
          matriz: matriz([p.p[0] * -lado, sitio.y + p.p[1], lado * (sitio.z) + p.p[2] * -lado], [r[0], lado > 0 ? Math.PI : 0, r[2]]) });
        geo.dispose();
      }
    }
    const g = c.geometria();
    cache.set(clave, g);
    return g;
  }

  function quitar(o) {
    const M = o.userCurtido;
    if (!M) return;
    if (M.mesh) o.grupo.remove(M.mesh);
    o.userCurtido = null;
  }
  function vestir(o) {
    if (!o.malla) return;
    const nivel = nivelDe(o.datos.curt);
    if (!nivel || !curtible(o.plano)) { if (o.userCurtido) quitar(o); return; }
    const M = o.userCurtido;
    if (M && M.nivel === nivel && M.malla === o.malla) return;   // ya está vestida con este nivel y esta malla
    if (M?.mesh) o.grupo.remove(M.mesh);
    const mesh = new THREE.Mesh(geometriaDe(o.plano, nivel), o.malla.material);
    mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    o.grupo.add(mesh);
    o.userCurtido = { nivel, malla: o.malla, mesh };
  }

  // ---- el ciclo de la noche
  // Al caer la noche: toda defensa terminada que está en pie queda anotada.
  function alAnochecerNoche(n) {
    let anotadas = 0;
    for (const o of obras.obras) {
      if (!curtible(o.plano) || !completa(o)) continue;
      o.datos.curt = alAnochecer(o.datos.curt, n);
      anotadas++;
    }
    return anotadas;
  }
  // Recibió daño o participó (la ballesta que tiró).
  function participo(o) {
    if (o?.datos?.curt) tocar(o.datos.curt, noche());
  }
  // Con la primera luz: las que estuvieron en pie y participaron suman una noche. Devuelve las que subieron de nivel.
  function alAlbaNoche(n) {
    const subidas = [];
    for (const o of obras.obras) {
      const c = o.datos.curt;
      if (!c) continue;
      const r = sanear(o, c, n);
      if (r) subidas.push(r);
    }
    return subidas;
  }
  function sanear(o, c, n) {
    const r = alAlba(c, n);
    if (r.curt) o.datos.curt = r.curt; else delete o.datos.curt;
    if (!r.subio) return null;
    // sube de nivel: recupera un poco de resistencia
    const max = vidaMaxObra(o.plano, o.datos.etapas);
    if (Number.isFinite(o.datos.vida) && max > 0) o.datos.vida = Math.min(max, o.datos.vida + max * CURTIDO.cura);
    return { obra: o, nivel: r.nivel };
  }

  // Los avisos esperan un rato (después del «Resististe la noche»): `api.esperar` los pone en la cola de tiempos del juego (en las pruebas se corre a mano).
  const esperar = (f, ms) => (api.esperar ? api.esperar(f, ms) : setTimeout(f, ms));
  // Avisa lo que subió: una nota por defensa (hasta tres) o una sola para todas.
  function avisarSubidas(subidas, retraso = 6500) {
    if (!subidas.length) return;
    if (subidas.length > 3) {
      esperar(() => api.nota(`${subidas.length} defensas se curtieron`, 'Aguantaron otra noche y reciben menos daño: mirá las placas', true), retraso);
    } else {
      subidas.forEach((s, i) => {
        const t = textoSubida(s.obra.plano.nombre, s.nivel);
        esperar(() => api.nota(t.titulo, t.texto, true), retraso + i * 2200);
      });
    }
    for (const s of subidas) efectos?.destello?.(_p.set(s.obra.datos.x, (s.obra.datos.y || 0) + 1.5, s.obra.datos.z), 0.8, '#f0c26a');
  }

  let acum = 9;
  function actualizar(dt) {
    acum += dt;
    if (acum < CURTIDO.cada) return;
    acum = 0;
    for (const o of obras.obras) {
      if (!o.datos.curt && !o.userCurtido) continue;
      if (!completa(o)) { if (o.userCurtido) quitar(o); continue; }
      vestir(o);
    }
  }
  const nivelDeObra = (o) => (curtible(o?.plano) ? nivelDe(o?.datos?.curt) : 0);
  const factorDeObra = (o) => factorDano(nivelDeObra(o));
  // El nombre con el nivel («Pirca curtida · nivel 2») para la pantalla de la base y los avisos.
  const nombreDeObra = (o) => nombreCurtido(o.datos.nombre || o.plano.nombre, nivelDeObra(o));
  // Cuántas defensas hay en cada nivel (0 a 3) y la suma de los niveles.
  function niveles() {
    const lista = [];
    for (const o of obras.obras) if (curtible(o.plano) && completa(o)) lista.push(nivelDeObra(o));
    return lista;
  }
  function limpiar() { for (const o of obras.obras) if (o.userCurtido) quitar(o); }
  return { alAnochecer: alAnochecerNoche, participo, alAlba: alAlbaNoche, avisarSubidas, actualizar, factorDeObra, nivelDeObra, nombreDeObra, niveles, vestir, limpiar,
    get geometrias() { return cache.size; } };
}
