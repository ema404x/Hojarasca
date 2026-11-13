// 4.26.5: cómo se apoya una pieza plana y baja (una laja, un tablón) en un terreno en pendiente. Reglas puras (sin three ni DOM).
// Antes cada laja del camino de la Casa de Té se apoyaba a la altura del terreno en su CENTRO y quedaba horizontal: en la bajada hacia la calle de la Aldea
// (28 % medido) una punta colgaba hasta 24 cm sobre el pasto y la otra se hundía hasta 11 cm en el ripio (de lejos, lajas «en cuña»). Ahora la pieza toma la altura
// media de sus cuatro lados y se inclina con el terreno.
//
// `alturaA(a, b)`: la altura del terreno a `a` metros del centro de la pieza a lo largo de ella y a `b` a lo ancho (en el marco de la pieza, ya girada).
// Devuelve { y, inclinaX, inclinaZ }: la altura del plano en el centro y los giros (rad) de matriz(pos, [inclinaX, giro, inclinaZ]) (orden YXZ de geometria.js):
// inclinaZ sube el lado +a (a lo largo) y inclinaX sube el lado +b (a lo ancho). Con alturas que no son números, la pieza queda horizontal a la altura 0.
export function apoyoEnPlano(alturaA, largo, ancho) {
  const hxa = Number(alturaA(-largo / 2, 0)), hxb = Number(alturaA(largo / 2, 0)), hza = Number(alturaA(0, -ancho / 2)), hzb = Number(alturaA(0, ancho / 2));
  if (![hxa, hxb, hza, hzb].every(Number.isFinite) || !(largo > 0) || !(ancho > 0)) return { y: 0, inclinaX: 0, inclinaZ: 0 };
  return { y: (hxa + hxb + hza + hzb) / 4, inclinaZ: Math.atan2(hxb - hxa, largo), inclinaX: -Math.atan2(hzb - hza, ancho) };
}
