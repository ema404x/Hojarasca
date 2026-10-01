import { crearColisiones } from '../src/colisiones.js';

function assert(ok, msg) { if (!ok) throw new Error(msg); }

// 1) Un jugador exactamente sobre el eje de un muro debe ser expulsado.
{
  const c = crearColisiones();
  c.agregar({ seg: true, ax: -2, az: 0, bx: 2, bz: 0, r: 0.2 });
  const p = { x: 0, y: 0.5, z: 0 };
  c.resolver(p, 0.35);
  assert(Math.hypot(p.x, p.z) > 0.5, 'resolver dejó al jugador incrustado en un segmento');
}

// 2) plataformaBaja debe respetar el radio de una plataforma circular.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, radio: 2, alto: 4 });
  assert(c.plataformaBaja(0.5, 0.5)?.alto === 4, 'no detectó plataforma circular bajo el punto');
  assert(c.plataformaBaja(3, 3) === null, 'detectó plataforma circular fuera de su radio');
}

// 3) Un anillo no debe contar dentro de su hueco interior.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, radio: 4, radioInterior: 2, alto: 6 });
  assert(c.plataformaBaja(0, 0) === null, 'el hueco interior del anillo se tomó como piso');
  assert(c.plataformaBaja(3, 0)?.alto === 6, 'no detectó el anillo en su zona caminable');
}

// 4) El hueco angular de una plataforma circular debe mantenerse abierto.
{
  const c = crearColisiones();
  c.agregarPlataforma({ x: 0, z: 0, radio: 4, alto: 5, huecoCentro: 0, huecoMedio: 0.4, huecoDesde: 1 });
  assert(c.plataformaBaja(0, -3) === null, 'plataformaBaja cerró un hueco angular');
  assert(c.plataformaBaja(3, 0)?.alto === 5, 'plataformaBaja perdió la parte sólida');
}

console.log('OK colisiones core');
