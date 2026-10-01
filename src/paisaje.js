// Composición macro del paisaje patagónico.
// Mantiene la ecología de patagonia.js, pero organiza rodales, claros y elementos
// de transición para que el mundo no se lea como una distribución uniforme.
import { clamp, smoothstep, lerp } from './ruido.js';

export function bordeBosqueNatural(perfil) {
  const b = clamp(perfil?.bosque ?? 0, 0, 1);
  const eco = clamp(perfil?.ecotono ?? 0, 0, 1);
  // Máximo alrededor de un bosque medio/abierto; cae tanto en estepa franca
  // como en el centro de un rodal cerrado.
  const banda = 1 - smoothstep(0.18, 0.52, Math.abs(b - 0.46));
  return clamp(banda * 0.72 + eco * 0.48, 0, 1);
}

export function corredorEscenico(x, z, a, b, ancho = 18) {
  if (!a || !b) return 0;
  const abx = b.x - a.x, abz = b.z - a.z;
  const l2 = abx * abx + abz * abz || 1;
  const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / l2, 0, 1);
  const px = a.x + abx * t, pz = a.z + abz * t;
  const d = Math.hypot(x - px, z - pz);
  // Se estrecha en los extremos para no parecer una calle cortada a máquina.
  const extremos = smoothstep(0.02, 0.16, t) * (1 - smoothstep(0.84, 0.98, t));
  return (1 - smoothstep(ancho * 0.42, ancho, d)) * extremos;
}

export function factorRodalPatagonico(perfil, macroRodal, corredor = 0) {
  const m = clamp(macroRodal, 0, 1);
  const borde = bordeBosqueNatural(perfil);
  // La modulación es amplia y suave: abre claros en unas zonas y consolida
  // rodales en otras sin alterar la identidad ecológica del bioma.
  const amplitud = clamp(0.30 + borde * 0.35 + (perfil?.bosqueHumedo ?? 0) * 0.12, 0.28, 0.72);
  const variacion = lerp(0.68, 1.22, m);
  const base = lerp(1, variacion, amplitud);
  return clamp(base * (1 - clamp(corredor, 0, 1) * 0.62), 0.38, 1.24);
}

export function firmaComposicionPaisaje(perfil, macroRoca, macroMadera) {
  const pendiente = clamp(perfil?.pendiente ?? 0, 0, 1.5);
  const exp = clamp(perfil?.exposicion ?? 0, 0, 1);
  const bosque = clamp(perfil?.bosque ?? 0, 0, 1);
  const humedo = clamp(perfil?.bosqueHumedo ?? 0, 0, 1);
  const estepa = clamp(perfil?.estepa ?? 0, 0, 1);
  const borde = bordeBosqueNatural(perfil);
  const mr = clamp(macroRoca, 0, 1), mm = clamp(macroMadera, 0, 1);

  const roca = clamp((pendiente * 0.32 + exp * 0.24 + estepa * 0.18 + borde * 0.12) * smoothstep(0.42, 0.82, mr), 0, 0.34);
  const tronco = clamp((bosque * 0.22 + humedo * 0.32 + borde * 0.08) * smoothstep(0.48, 0.86, mm) * (1 - estepa * 0.85), 0, 0.30);
  return { roca, tronco, borde };
}
