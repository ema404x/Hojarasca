// Perfil ecológico compartido para que Hojarasca no derive a un "bosque genérico".
// La lógica combina bosque andino-patagónico, ecotono, estepa, mallines y altura.
import { clamp, smoothstep } from './ruido.js';

export const FLORA_PATAGONICA = Object.freeze({
  coihue: { nombre: 'Coihue', ambiente: 'bosque_humedo', nativa: true },
  lenga: { nombre: 'Lenga', ambiente: 'bosque_montano', nativa: true },
  nire: { nombre: 'Ñire', ambiente: 'mallin_ecotono', nativa: true },
  cipres: { nombre: 'Ciprés de la cordillera', ambiente: 'ecotono_seco', nativa: true },
  arrayan: { nombre: 'Arrayán', ambiente: 'ribera_bosque_humedo', nativa: true },
  maiten: { nombre: 'Maitén', ambiente: 'claros_ribera', nativa: true },
  pehuen: { nombre: 'Pehuén', ambiente: 'norte_andino', nativa: true },
  coiron: { nombre: 'Coirón', ambiente: 'estepa', nativa: true },
  neneo: { nombre: 'Neneo', ambiente: 'estepa', nativa: true },
  calafate: { nombre: 'Calafate', ambiente: 'ecotono_estepa', nativa: true },
  notro: { nombre: 'Notro', ambiente: 'bosque_abierto', nativa: true },
});

export const FAUNA_PATAGONICA = Object.freeze({
  huemul: { nombre: 'Huemul', ambiente: 'bosque_abierto_montano', nativa: true },
  pudu: { nombre: 'Pudú', ambiente: 'bosque_denso', nativa: true },
  zorro: { nombre: 'Zorro colorado', ambiente: 'ecotono_estepa', nativa: true },
  guanaco: { nombre: 'Guanaco', ambiente: 'estepa_abierta', nativa: true },
  condor: { nombre: 'Cóndor andino', ambiente: 'montana', nativa: true },
  carpintero: { nombre: 'Carpintero gigante', ambiente: 'bosque_maduro', nativa: true },
});

export function perfilHabitatPatagonico(T, x, z) {
  const k = T.indice(x, z);
  const h = T.altura(x, z);
  const bosque = clamp(T.bosque?.[k] ?? 0, 0, 1);
  const estepa = clamp(T.estepa?.[k] ?? 0, 0, 1);
  const pasto = clamp(T.pasto?.[k] ?? 0, 0, 1);
  const pendiente = clamp(T.pendiente?.[k] ?? 0, 0, 2);
  const dRio = (T.distRio?.[k] ?? 999) - (T.anchoRio?.[k] ?? 0);
  const ribera = smoothstep(18, 2, dRio);
  const alto = smoothstep(52, 82, h);
  const muyAlto = smoothstep(72, 96, h);
  const mallin = clamp(pasto * (1 - bosque * 0.55) * (0.45 + ribera * 0.55), 0, 1);
  const ecotono = clamp((1 - Math.abs(bosque - 0.42) * 2.1) * (1 - estepa * 0.25) + estepa * 0.45, 0, 1);
  const bosqueHumedo = clamp(bosque * (0.72 + ribera * 0.28) * (1 - estepa), 0, 1);
  const exposicion = clamp(pendiente * 0.38 + alto * 0.48 + estepa * 0.42, 0, 1);

  let bioma = 'bosque_abierto';
  if (estepa > 0.55) bioma = 'estepa';
  else if (muyAlto > 0.58 && bosque < 0.38) bioma = 'altoandino';
  else if (mallin > 0.56) bioma = 'mallin';
  else if (ribera > 0.58 && bosque > 0.25) bioma = 'ribera';
  else if (bosqueHumedo > 0.68) bioma = 'bosque_humedo';
  else if (ecotono > 0.55 || estepa > 0.18) bioma = 'ecotono';

  return { k, h, bosque, estepa, pasto, pendiente, ribera, alto, muyAlto, mallin, ecotono, bosqueHumedo, exposicion, bioma };
}

export function elegirArbolPatagonico(perfil, tirada, secundaria = 0.5) {
  const p = perfil;
  if (p.bioma === 'estepa') return secundaria < 0.78 ? null : 'maiten';
  if (p.bioma === 'altoandino') return tirada < 0.68 ? 'lenga' : 'nire';
  if (p.bioma === 'mallin') return tirada < 0.62 ? 'nire' : 'maiten';
  if (p.bioma === 'ribera') return tirada < 0.58 ? 'arrayan' : tirada < 0.8 ? 'maiten' : 'coihue';
  if (p.bioma === 'ecotono') {
    if (tirada < 0.4) return 'cipres';
    if (tirada < 0.68) return 'nire';
    if (tirada < 0.88) return 'lenga';
    return 'maiten';
  }
  if (p.bioma === 'bosque_humedo') return tirada < 0.62 ? 'coihue' : tirada < 0.9 ? 'lenga' : 'arrayan';
  return tirada < 0.42 ? 'coihue' : tirada < 0.72 ? 'lenga' : tirada < 0.9 ? 'cipres' : 'maiten';
}

export function formaArbolPatagonico(especie, perfil, azar = 0.5) {
  const exp = perfil.exposicion;
  let ancho = 0.94 + azar * 0.14;
  let alto = 0.96 + (1 - azar) * 0.1;
  if (especie === 'coihue' && perfil.bosqueHumedo > 0.65) alto *= 1.08;
  if (especie === 'lenga' && perfil.alto > 0.45) { alto *= 1 - exp * 0.28; ancho *= 1 + exp * 0.2; }
  if (especie === 'nire') { alto *= 0.9 - exp * 0.22; ancho *= 1.08 + exp * 0.22; }
  if (especie === 'cipres' && perfil.estepa > 0.15) { alto *= 0.92; ancho *= 0.9; }
  return { sx: ancho, sy: Math.max(0.52, alto), sz: 0.96 + (1 - azar) * 0.12, inclinacion: exp * 0.1 };
}
