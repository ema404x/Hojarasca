// 4.10 base: el tablero de trofeos, una pieza barata de la base del Desafío (mismas reglas que las del fortín: sólo tipo 0 y 4, la
// colisión sale de `fisica(h)`, el frente mira a -z). Muestra los trofeos que ganaste (`datos.colgados`, que arma el juego desde la
// partida) y, mientras esté en pie, ellos dan su bono (ver desafio-trofeos-mundo.js).
import { armarTablero } from './desafio-trofeos-formas.js';
import { TABLERO, IDS_TROFEOS } from './desafio-trofeos.js';

export const PIEZAS_TROFEOS = [
  {
    id: 'tablero-trofeos', nombre: 'Tablero de trofeos', pieza: true, soloDesafio: true, categoria: 'defensa',
    radio: 1.8, ancho: TABLERO.ancho + 0.4, fondo: 0.6, alto: 2.6, separacion: 0.6, vida: 260,
    texto: 'Un tablero de tablas con estantes: ahí se cuelgan los trofeos que le ganás a los mandamases, al Coihue Viejo, al Rey Duende y a la cueva del nido. Cada uno te da un efecto chico mientras el tablero esté en pie. Si los duendes lo tiran, los trofeos se pierden. Con E ves cuáles tenés.',
    pide: { tabla: 4, tronco: 1 }, pendienteMax: 0.45, distSendero: 0.4,
    // oculta: no cuenta como defensa para los vecinos que se instalan en la base
    defensa: { tipo: 'trofeos', oculta: true },
    // `colgados` son ids de trofeos; lo que no es un trofeo se ignora (una partida rota no tira la malla)
    arma(c, P, datos, suelo) {
      const lista = Array.isArray(datos?.colgados) ? datos.colgados.filter((id) => IDS_TROFEOS.includes(id)) : [];
      armarTablero(c, lista, suelo);   // 4.11.2 (V13): y los postes llegan al suelo en una ladera de costado
    },
    fisica(h) { h.segmento(-1.6, 0, 1.6, 0, 0.14, -0.05, 2.5); },
  },
];
