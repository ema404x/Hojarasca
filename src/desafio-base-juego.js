// 4.10 base: el enganche de «Volver a jugar, tanda de la base» con el Desafío. desafio.js arma esto una vez con la misma `api` que
// las defensas y lo llama en pocos lugares (al caer la noche, al amanecer, cuando una obra recibe un golpe o cae, y cada cuadro).
//
//   · las defensas que se curten con las noches → desafio-mejoras-base(-mundo).js
//   · los trofeos que se cuelgan en el tablero  → desafio-trofeos(-mundo/-formas).js
//   · el perro que aprende con las noches        → desafio-perro-aprende.js
//
// Los bonos (+vida máxima, +alcance, +recarga…) los reparte `desafio-bonos`, que sube la rama «guardian»: mientras no esté, esta
// base usa su respaldo (`desafio-bonos-base.js`, con los mismos tres nombres). Al juntar las ramas se cambia esta línea de import.
import { sumarBono, quitarBonosDeOrigen, bonoDe } from './desafio-bonos-base.js';
import { crearMejorasBaseMundo } from './desafio-mejoras-base-mundo.js';
import { crearTrofeosMundo } from './desafio-trofeos-mundo.js';
import { nivelDelPerro, alcanceDelPerro, danoDelPerro, nocheConElPerro, textoSubidaPerro, textoPerro } from './desafio-perro-aprende.js';
import { resumenNiveles, nombreCurtido } from './desafio-mejoras-base.js';

export const ORIGEN_DEFENSA = 'defensa';
// Cada nivel de una defensa curtida aporta un poco de «reparar» (una base veterana se mantiene más fácil), con tope.
export const REPARAR_POR_NIVEL = 0.01, REPARAR_TOPE = 0.1;

export function crearBaseCrece(obras, efectos, sonido, api) {
  const bonos = { sumarBono, quitarBonosDeOrigen, bonoDe };
  const mejoras = crearMejorasBaseMundo(obras, efectos, api);
  const trofeos = crearTrofeosMundo(obras, sonido, api, bonos);
  const crece = () => {
    const d = api.D();
    if (!d.crece || typeof d.crece !== 'object') d.crece = { trofeos: {}, perro: { noches: 0 }, bonos: {} };
    if (!d.crece.perro || typeof d.crece.perro !== 'object') d.crece.perro = { noches: 0 };
    return d.crece;
  };

  // El bono de las defensas curtidas: la suma de sus niveles, con tope.
  let firmaDefensas = null;
  function bonosDeDefensas() {
    const suma = mejoras.niveles().reduce((s, n) => s + n, 0);
    if (suma === firmaDefensas) return;
    firmaDefensas = suma;
    const d = api.D();
    bonos.quitarBonosDeOrigen(d, ORIGEN_DEFENSA);
    if (suma > 0) bonos.sumarBono(d, ORIGEN_DEFENSA, 'reparar', Math.min(REPARAR_TOPE, suma * REPARAR_POR_NIVEL));
  }

  // Al caer la noche (nueva): las defensas que están en pie quedan anotadas.
  const alAnochecer = (noche) => mejoras.alAnochecer(noche);
  // Con la primera luz (noche aguantada): suman las defensas que participaron, el perro cuenta una noche con vos.
  function alAmanecer(noche) {
    const subidas = mejoras.alAlba(noche);
    mejoras.avisarSubidas(subidas);
    const c = crece();
    if (api.perroPresente?.()) {
      const { antes, ahora } = nocheConElPerro(c.perro);
      if (ahora > antes) {
        const t = textoSubidaPerro(ahora);
        setTimeout(() => api.nota(t.titulo, t.texto, true), 6500 + subidas.length * 2200 + 1200);
      }
    }
    firmaDefensas = null;
    bonosDeDefensas();
  }
  // Cada cuadro (adentro se mira una vez por segundo).
  let preparado = false;
  function actualizar(dt) {
    mejoras.actualizar(dt);
    trofeos.actualizar(dt);
    if (!preparado) { preparado = true; bonosDeDefensas(); }
  }
  // Una obra tirada por los duendes: el tablero se lleva los trofeos; las defensas curtidas bajan el bono.
  function alCaer(caidas) {
    trofeos.alCaer(caidas);
    firmaDefensas = null;
    bonosDeDefensas();
  }
  const nivelPerro = () => nivelDelPerro(crece().perro.noches);
  // Lo que se muestra en la pantalla de la base (N): defensas por nivel, el perro y los trofeos.
  function resumen() {
    const c = crece();
    const por = resumenNiveles(mejoras.niveles());
    return {
      defensas: por, curtidas: por[1] + por[2] + por[3],
      perro: { nivel: nivelPerro(), noches: c.perro.noches, texto: textoPerro(nivelPerro()) },
      trofeos: Object.keys(c.trofeos).length, hayTablero: trofeos.hayTablero(),
    };
  }
  function limpiar() { mejoras.limpiar(); trofeos.limpiar(); firmaDefensas = null; preparado = false; }
  return {
    alAnochecer, alAmanecer, actualizar, alCaer, limpiar, resumen,
    // el golpe a una obra: cuánto del daño pasa y anotar que participó
    factorDano: (o) => mejoras.factorDeObra(o),
    participo: (o) => mejoras.participo(o),
    nombreDe: (o) => (mejoras.nivelDeObra(o) ? mejoras.nombreDeObra(o) : o.datos.nombre || o.plano.nombre),
    nivelDe: (o) => mejoras.nivelDeObra(o),
    // el perro
    nivelPerro, alcancePerro: () => alcanceDelPerro(nivelPerro()), danoPerro: () => danoDelPerro(nivelPerro()),
    // la E junto al tablero de trofeos
    cerca: (pos) => trofeos.cerca(pos), avisoCerca: (pos) => trofeos.avisoCerca(pos), usarCerca: (pos) => trofeos.usarCerca(pos),
    mejoras, trofeos, bonos, nombreCurtido,
  };
}
