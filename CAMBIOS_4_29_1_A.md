# 4.29.1 (A) — Ultra medido y recortado

Medido con el bucle real de la partida (Alta y Ultra alternados en la misma partida, 3 rondas de 60 cuadros tras 200 de calentamiento, placa,
1080p de lienzo, ventana visible, PC en reposo; herramienta de la 4.29.0, `hx\a4291\corre.ps1` + `med.js`).

## Antes (4.29.0) y después de recortar (ms por cuadro de placa; tres rondas; en negrita la mediana)
| | Alta antes | Ultra antes | Alta después | Ultra después |
|---|---|---|---|---|
| Plaza de día (05) | 26,6 · 27,4 · 26,9 | 35,5 · 35,5 · 35,5 → **35,5** | 26,5 · 26,5 · 26,5 | 35,6 · 34,6 · 34,8 → **34,8** |
| Bosque denso (b1) | 25,2 · 25,0 · 24,8 | 35,5 · 32,1 · 33,0 → **33,0** | 25,1 · 24,7 · 25,5 | 32,2 · 31,4 · 31,2 → **31,4** |
| Lago al amanecer (25) | 14,1 · 14,0 · 14,2 | 26,7 · 27,4 · 26,4 → **26,7** | 14,6 · 13,9 · 14,2 | 25,9 · 26,3 · 26,0 → **26,0** |

## Qué se recortó (en el orden del brief; todo dentro de Ultra, con Ultra apagado no cambia ningún programa)
1. Oclusión: 4 muestras a 3 (`AO_ULTRA.muestras`; ya era a media resolución).
2. Niebla: de 7 a 6 pasos (el piso del brief).
3. Relieve de los materiales: se apaga entre 12 y 20 m (antes 14 y 25), en la aldea y en las estructuras.
No hizo falta tocar el reflejo del lago (26 ms, bajo 33) y no se tocó el pasto ni lo mojado.

## Lo que no entra: la plaza de día
Queda en **34,8 ms**, 1,8 sobre los 33. Con todos los recortes de la lista hechos (la niebla en su piso de 6 pasos), el resto es la base de
Ultra de la 4.28.0 (Alta en la plaza da 26,5; Ultra suma 8 ms). Medido por partes en la plaza: la oclusión con 3 muestras cuesta ~0 (anulada
da lo mismo), la niebla ~2,3 ms (anulada, 32,4); lo demás (sombras de 4096, cielo con dispersión, composición, materiales) no está en la lista
de recortes de este brief y no se tocó. Decisión que queda para el usuario: aceptar 34,8 ms en la plaza de día o recortar algo de esa base.

## Pruebas
- Nueva: `pruebas/verificar-4-29-1-a.mjs` (en `verify:pasos`), 7 mutaciones atrapadas.
- Ajustadas a propósito: `verificar-4-28-0-a` (6 pasos y 3 muestras) y `verificar-4-28-0-c` (relieve entre 12 y 20 m). En verde junto con `4-29-0-a`.
- Visto en el juego: captura de la plaza con los recortes (`hx\a4291\m3\05-plaza-dia.png`), sin diferencias que molesten.
