// 4.0.3: I-2 de la zona I. Los rincones de la aldea (fuerte del bosque, retablo, atril, tu talla, cerco de la huerta de todos, arcos del potrero) y el puesto de
// la feria ya no se atraviesan. Corre el valle de verdad con la aldea y los rincones montados, y un caminante que replica a jugador.js.
import assert from 'node:assert/strict';
import { cargarValle } from './ayuda-4-0-3-valle.mjs';
import { caminarA } from './ayuda-4-0-3-caminante.mjs';

let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const { M, valle } = cargarValle(['rincones-mundo.js', 'rincones.js', 'feria-mundo.js', 'futbol.js']);
const v = valle({ aldea: true });
v.am.arrancar(); await v.am.listo(); v.am.montarCola();
const { T, col, puertas } = v;
const veg = { arboles: [], despejar() {}, colisiones: [] };
const cuenta = (duenio) => { let k = 0; const a0 = col.agregar; return () => k; };
// se anota qué agrega cada dueño
const agregados = {}; const a0 = col.agregar;
col.agregar = (o) => { agregados[o.duenio] = (agregados[o.duenio] || 0) + 1; return a0(o); };
const R = M.rincones_mundo.crearRinconesMundo({ T, escena: v.escena, col, puertas, veg, aldeaMundo: v.am, refugio: () => T.lugares.refugio });
R.montar();
const estado = (o = {}) => ({ pos: { x: 0, y: 0, z: 0 }, noche: 0, minga: false, etapaFuerte: 0, campamento: false, fuerteHecho: false, talla: false, cuaderno: false, titeres: false, adornos: '', tallerArmado: false, etapaCasa: -1, tiempo: 1, ...o });
R.actualizar(0.1, estado());
ok(agregados['rincones:cuerpos'] >= 6, `el retablo, el atril, la huerta y los arcos tienen cuerpo (${agregados['rincones:cuerpos']} piezas)`);
ok(!agregados['rincones:fuerte'], 'sin fuerte hecho no hay palos');
R.actualizar(0.1, estado({ etapaFuerte: 3, fuerteHecho: true, talla: true }));
ok(agregados['rincones:fuerte'] === 14, `el fuerte hecho: 14 palos (${agregados['rincones:fuerte']})`);
ok(agregados['rincones:talla'] === 1, 'tu talla tiene su cuerpo');
// el estado repetido no los vuelve a agregar
R.actualizar(0.1, estado({ etapaFuerte: 3, fuerteHecho: true, talla: true }));
ok(agregados['rincones:fuerte'] === 14 && agregados['rincones:talla'] === 1, 'y no se duplican en el cuadro siguiente');

const w = { col, T };
const libre = (x, z) => { const q = { x, y: T.altura(x, z), z }; col.resolver(q, 0.35, 1.65); return Math.hypot(q.x - x, q.z - z) < 0.02; };
const { lugarEnMundo, puntoDeLugar } = M.rincones;
// el fuerte: los palos van en un arco que deja una abertura (ángulo -π/2-0,4 + 2π-1,4 + 0,7 = 3,61 rad en el marco del fuerte); por ahí se entra, por los lados no
{
  const L = lugarEnMundo('fuerte'), c = Math.cos(L.rotMundo), s = Math.sin(L.rotMundo);
  const aMundo = (lx, lz) => ({ x: L.x + lx * c + lz * s, z: L.z - lx * s + lz * c });
  const polar = (ang, r) => aMundo(Math.cos(ang) * r, Math.sin(ang) * r);
  const ABERTURA = -Math.PI / 2 - 0.4 + (Math.PI * 2 - 1.4) + 0.7;
  for (const ang of [0.5, 1.5, 2.2, -1.0]) { const p = polar(ang, 1.7); ok(!libre(p.x, p.z), `el fuerte: un palo a ${ang} rad`); }
  const dentro = aMundo(0, 0), entrada = polar(ABERTURA, 1.7);
  ok(libre(dentro.x, dentro.z), 'adentro del fuerte hay lugar');
  ok(libre(entrada.x, entrada.z), 'la abertura del fuerte está libre');
  const desde = (ang, r) => { const o = polar(ang, r); return { x: o.x, z: o.z, y: T.altura(o.x, o.z), vy: 0, enSuelo: true, coyote: 0 }; };
  const q = desde(ABERTURA, 4);
  caminarA(w, q, dentro.x, dentro.z, 700);
  ok(Math.hypot(q.x - dentro.x, q.z - dentro.z) < 0.3, `por la abertura se llega al centro del fuerte (quedó a ${Math.hypot(q.x - dentro.x, q.z - dentro.z).toFixed(2)} m)`);
  const q2 = desde(1.0, 4);
  caminarA(w, q2, dentro.x, dentro.z, 700);
  ok(Math.hypot(q2.x - dentro.x, q2.z - dentro.z) > 0.8, `de costado no se atraviesa la pared del fuerte (quedó a ${Math.hypot(q2.x - dentro.x, q2.z - dentro.z).toFixed(2)} m)`);
}
// el retablo y la huerta
{
  const L = lugarEnMundo('retablo'); ok(!libre(L.x, L.z), 'el retablo no se atraviesa');
  const H = M.rincones.LUGARES_RINCONES.huerta, a = H.ancho / 2, l = H.largo / 2;
  const lado = puntoDeLugar('huerta', a, 0); ok(!libre(lado.x, lado.z), 'el cerco de la huerta de todos no se atraviesa');
  const tranquera = puntoDeLugar('huerta', -a, 0); ok(libre(tranquera.x, tranquera.z), 'la tranquera (del lado de la calle) está abierta');
  const adentro = puntoDeLugar('huerta', 0, 0); 
  // entrar por la tranquera hasta el centro
  const fuera = puntoDeLugar('huerta', -a - 3, 0), q = { x: fuera.x, z: fuera.z, y: T.altura(fuera.x, fuera.z), vy: 0, enSuelo: true, coyote: 0 };
  caminarA(w, q, adentro.x, adentro.z, 700);
  ok(Math.hypot(q.x - adentro.x, q.z - adentro.z) < 1.5, `por la tranquera se entra a la huerta (quedó a ${Math.hypot(q.x - adentro.x, q.z - adentro.z).toFixed(2)} m del centro)`);
  const otro = puntoDeLugar('huerta', a + 3, 0), q3 = { x: otro.x, z: otro.z, y: T.altura(otro.x, otro.z), vy: 0, enSuelo: true, coyote: 0 };
  caminarA(w, q3, adentro.x, adentro.z, 700);
  ok(Math.hypot(q3.x - adentro.x, q3.z - adentro.z) > 1.5, `y por el lado del cerco no (quedó a ${Math.hypot(q3.x - adentro.x, q3.z - adentro.z).toFixed(2)} m)`);
}
// los arcos del potrero: los palos frenan, la boca queda abierta
{
  const P = R.potrero(), A = M.futbol.CANCHA.arco, L2 = M.futbol.CANCHA.largo / 2;
  const palo = P.aMundo(A.ancho / 2, L2), boca = P.aMundo(0, L2);
  ok(!libre(palo.x, palo.z), 'el palo del arco no se atraviesa');
  ok(libre(boca.x, boca.z), 'la boca del arco está abierta');
}
// el puesto de la feria: con cuerpo sólo mientras está armado
{
  const estacion = v.tren.paradas.find((p) => p.nombre === 'Estación del Valle') || v.tren.paradas[0];
  const feria = M.feria_mundo.crearPuestoFeria(T, v.escena, estacion, col);
  const mesa = { x: feria.x + 0, z: feria.z + 0 };
  const c = Math.cos(estacion.ang || 0), s = Math.sin(estacion.ang || 0);
  const centro = { x: feria.x, z: feria.z };
  ok(libre(centro.x, centro.z), 'sin el puesto armado no hay nada (los días sin feria no hay pared invisible)');
  feria.ponerCuerpo(true);
  ok(!libre(centro.x, centro.z), 'con el puesto armado la mesa frena');
  feria.ponerCuerpo(true); feria.ponerCuerpo(true);
  feria.ponerCuerpo(false);
  ok(libre(centro.x, centro.z), 'al desarmarlo se va');
  void mesa; void c; void s;
}
const fuente = (await import('node:fs')).readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
ok(fuente.includes('crearPuestoFeria(T, escena, e, col)') && fuente.includes('puestoFeria.ponerCuerpo?.(puestoFeria.malla.visible)'), 'main.js arma el cuerpo de la feria con su visibilidad');
console.log(`OK 4.0.3 cuerpos · ${n} verificaciones · fuerte, retablo, atril, talla, cerco de la huerta, arcos y puesto de la feria se frenan; las entradas siguen abiertas`);
