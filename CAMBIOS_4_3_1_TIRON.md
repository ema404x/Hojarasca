# 4.3.1 — el tirón al caminar (informe parcial: herramienta lista, causa NO confirmada)

## Estado honesto
- **Verificado:** se armó una herramienta que reproduce el recorrido caminando y corriendo y registra cada cuadro; la prueba pura (`pruebas/verificar-4-3-1-tiron.mjs`, 11 comprobaciones) pasa.
- **Verificado en esta notebook (Ryzen 7 7730U, alta, aldea completa):** la hipótesis del montaje de bloques **no se sostiene aquí**. Mientras se camina, `veg.actualizar` (árboles cercanos, banda media, impostores) cuesta como máximo ~1,6 ms y `compactarSoto` (bloques del sotobosque) como máximo ~1 ms; el costo de CPU por cuadro es de 5 a 9 ms (p99 ≤ 12 ms) y casi ningún cuadro pasa de 16,7 ms de CPU.
- **Lo que sí aparece al caminar:** rachas de cuadros con intervalo de 33 ms (un vsync perdido) en ~5–7 % de los cuadros en algunos recorridos (sendero corriendo, aldea), con la CPU igual que en los cuadros buenos. El tiempo de placa (cronómetro de la placa) es ~9,6 ms parado y ~11,5 ms caminando, con p95 ~14 y ~14,6 ms en los cuadros lentos: es una placa al límite que cruza 16,7 ms por rachas, no un pico de CPU de montaje. Parado hubo 0–0,5 % de cuadros de 33 ms (salvo en la aldea, 7 %, que ya los tiene parado).
- **Picos puntuales vistos (sin explicar):** en una corrida el dibujo tardó 75–114 ms en 3 cuadros con **+2 / +6 / +22 geometrías** nuevas en la placa y un programa nuevo en otro cuadro (21 ms): primeras subidas de geometría/compilación al aparecer algo por primera vez cerca de (-114, 25), (-111, 6), (-111, 2). Candidato a precalentar al cargar (`renderer.compile` + dibujar una vez lo que luego aparece). **No medido a fondo ni arreglado.**
- **No hecho:** ningún cambio de comportamiento en `vegetacion.js` (la medición no lo justifica todavía), ni antes/después, ni capturas, ni `npm run verify`. En el 4600G del usuario puede ser otra cosa (margen de 1,5–2 ms): ahí hay que correr la herramienta.

## Qué se agregó
- `herramientas/medir-caminata.cjs` + `herramientas/caminata-analisis.cjs`: recorridos `sendero-camina|corre`, `bosque-camina|corre`, `aldea-camina` y controles `*-quieto`. Teclas reales (W, Mayús), rumbo corregido como con el ratón, bucle real (`requestAnimationFrame`, sin límite). Por cuadro: intervalo, CPU, vegetación, objetos, pasto, bloques del sotobosque, secciones del perfilador, programas/geometrías/texturas nuevas, bajadas de heap (GC), tiempo de placa. Imprime una tabla (cuadros >16,7/25/50 ms por CPU y por intervalo, p50/p95/p99, y a qué sistema se llevó cada cuadro >25 ms).
- `src/main.js` (**compartido**): una línea, `__gpuMs` en el objeto de depuración (`?debug=1`).
- `package.json` (**compartido**): script `medir:caminata` y la prueba nueva en `verify`.
- `src/cola-presupuesto.js`: cola con presupuesto de ms por cuadro (clave que reemplaza, prioridad por distancia, siempre una tarea por cuadro). **Sin conectar** a ningún sistema: se usaría para rehacer los bloques del sotobosque de a un tipo por vez si la medición en el 4600G lo pidiera.
- `herramientas/al-monitor.cjs` y `lanzar-electron.ps1`: modo `HUMO_OCULTO=1` (por defecto en `lanzar-electron.ps1`; `-Visible` para mostrar), sin sonido y prioridad baja.

## Cómo correr
- Visible discreto (única forma de medir fps: una ventana oculta o fuera de pantalla **no corre `requestAnimationFrame`**, probado, dio 0 cuadros): `npm run medir:caminata` (arma, abre una ventana con `showInactive`, sin foco, sin sonido) o a mano con prioridad baja:
  `$env:HTML="...\index.html"; $env:SALIDA="...\a.json"; $env:HOJ_PERFIL="...\perfil"; $p = Start-Process electron.exe -ArgumentList '--no-sandbox','--mute-audio','-r','herramientas\al-monitor.cjs','-r','herramientas\perfil-propio.cjs','herramientas\medir-caminata.cjs' -PassThru; $p.PriorityClass='BelowNormal'`.
  Variables: `RUTAS`, `SEGUNDOS` (80), `REPETIR`, `CALIDAD`, `COMPLETA`, `HORA`. Tanda corta: `RUTAS=sendero-corre,bosque-corre SEGUNDOS=40`.
- Humos y capturas (manejan el bucle a mano): modo oculto, que funciona sin ventana.

## Para medir después en el juego real (4600G)
1. Correr la tabla con `REPETIR=3` y mirar cuántos cuadros >16,7 ms hay por CPU y por intervalo y qué sistema los concentra.
2. Si la placa va al límite caminando: comparar con la distancia del sotobosque (`calidad.sotobosque`) y la cantidad de instancias de `statsSoto.instancias` al moverse.
3. Si aparecen picos de dibujo con geometrías/programas nuevos: precalentar.
4. Recién ahí decidir si hace falta repartir `compactarSoto`/`compactarCercanos`/`compactarMedios` con `cola-presupuesto.js`.
