# 4.0.2 — arreglos de lo que ya hay

Rama `arreglos-4-0-2` (sale de `v392-mejoras`; sin push, sin tocar `main` ni `v392-mejoras`). Sin contenido nuevo, sin textos en inglés (el inglés se hace al final).
Cada arreglo lleva su prueba (todas en el gate: `npm run verify` da **228 pasos OK**, antes 225; `node pruebas/humo-caos.cjs`: 934 pasos sin errores; también sin fallas `humo-4-1-creador.cjs` y `humo-3-9-1-pena.cjs`) y un comentario `4.0.2:` en el código. Nada se quitó del juego.
Capturas antes/después en `Documents\Hojarasca\trabajo\arreglos402\` (Dalia, la maestra, el charco de la cantina). Visor nuevo: `pruebas/visor-dalia.cjs`
(el de la anfitriona pero con poses de baile, fases de máximo paso y tomas de zapatos, escote y cintura).

## 1. Detalles sueltos de Dalia (`src/gente-cuerpo.js`, `src/gente.js`; prueba `verificar-4-0-2-dalia.mjs`)

| Detalle | Estado |
|---|---|
| (a) Zapatos rojos con taco que parecen flotar | **arreglado**. De costado se veía un hueco de ~2 cm entre el contrafuerte del zapato y el taco (el taco arrancaba 7 mm más abajo que el zapato): el taco ahora sube y se mete 2 cm dentro del contrafuerte. La base del taco no se movió (el zapato apoya igual: la punta y el taco siguen en el piso). Visto a tamaño completo de frente, de costado y en las poses de baile |
| (b) Chamamé de 3/4 con las piernas muy abiertas: la falda se abre como pantalón | **mejorado, no del todo**. La falda ceñida con tajo (sólo Dalia: `R.curvas`) sigue la pierna como antes (el seguimiento de los huesos no se tocó: bajarlo hace que las piernas atraviesen la tela), pero el paso del baile es el 72 % (`pasoCorto`): en el tango, el chamamé de a dos y el chamamé solo. Con los pasos más cortos el ruedo se abre menos y no se ve la «V» de pantalón. En el máximo paso de las tres poses vistas de frente, de 3/4 y de costado la falda se lee como falda, pero el tajo en el momento del paso se sigue abriendo un poco (es un tajo) |
| (c) Muesquita en el borde izquierdo de la V del escote | **mejorado, no eliminado**. La causa es que el lóbulo del vestido atraviesa el parche de piel y el ribete (el borde cosido de la V) terminaba en un tope grueso que sobresalía justo en esa esquina: ahora el ribete se afina hacia abajo y muere donde entra el lóbulo. La esquina del propio lóbulo (donde la tela del pecho sube sobre el parche) sigue, igual en los dos lados. Intenté que el parche acompañe al lóbulo (entero y a la mitad): sí borraba la esquina pero abría la V (más piel) y con la mitad dejaba un mordisco: **se descartó para no cambiar el tamaño del escote** (regla del usuario). Si querés la esquina redondeada, hay que decidir cuánta piel más se ve |

El busto, el escote en tamaño y el cuerpo de Dalia no se tocaron.

## 2. El borde de la blusa en la cintura (`src/gente-cuerpo.js`; prueba `verificar-4-0-2-blusa.mjs`)

**Arreglado.** El festoneado no era la blusa sino la cadera de debajo de la ropa (un elipsoide del color del pantalón/pollera) que asomaba 8 mm por la blusa y el chaleco en la cintura:
la intersección de las dos telas dibujaba las ondas. En las mujeres sin curvas esa cadera es ahora 8 mm menos honda en z (0,102 → 0,094); la de los varones y la de Dalia, igual que antes.
Visto en la maestra de verano (de frente, 3/4 y espalda): el borde queda limpio. Lo que se ve debajo del cinturón (el faldón de la campera larga) no cambió.

## 3. Bugs bajos pospuestos de los informes (prueba `verificar-4-0-2-bajos.mjs`)

Leyenda: **arreglado** · **descartado** (no se confirmó o no es seguro; el motivo) · **pregunta** (decide el usuario).

| # | Estado |
|---|---|
| A3 | no se hizo (pedido expreso: requiere diseño y un mando real) |
| A4 | **arreglado**: la peña vuelve a poner el vaso si la cantina vació las mesas (mira `visual.enMesa` y no su propio mapa) |
| A5 | **arreglado**: con la borrachera «apagada» no sale ni el aviso ni la frase de la moza (con «suave» o «reducida» siguen) |
| A6 | **arreglado**: `afluencia` usa la noche de la cantina (la madrugada de 0 a 6 h es la noche de ayer): la peña del sábado de madrugada da 0,75 y no 0,26. Cambia cuánto tarda la moza en esas horas (más, con más gente): es el comportamiento que decía el diseño |
| B7 | **arreglado**: las notas «Calidad según tu placa» y «El juego se recuperó» esperan a entrar de verdad (`volverAlJuego`), no al primer clic en «Entrar» (que con el creador o el prólogo no entra). No se vio en pantalla (se probó por texto) |
| B8 | **descartado**: el efecto es un multiplicador de velocidad, por eso −17 % / +25 %; cambiarlo toca la prueba `verificar-4-1-efectos-cuaderno.mjs` y el balance, y el jugador no ve porcentajes |
| B9 | **pregunta** (ya estaba en 4.0.1): si el afecto de Bruno escala o no el romance |
| B10 | **arreglado**: `parsear` (guardado) saca las claves `toString` y `valueOf` de lo leído (no existen en ninguna partida de verdad): una partida retocada con `{"toString": 1}` carga en vez de devolver null. Probado con la partida rota de verdad |
| B11 | **descartado**: depende de la activación de usuario de Chromium; sin un Electron con el prólogo y 10 s de espera no se confirma |
| B13 | **arreglado**: Tab y Mayús+Tab dan la vuelta dentro del creador y del prólogo (antes llegaban a botones de la portada). Probado por texto; no se tabuló en pantalla |
| B14 | **arreglado**: si la copia a la carpeta falla (típico: más de 64 MB por las fotos) se avisa una vez («No se pudo copiar la partida a la carpeta sincronizada…») y se espera 10 minutos antes de rearmar el paquete entero (antes, en cada guardado y sin decir nada). Texto nuevo sólo en castellano |
| C6 | **arreglado**: los halos de los faroles de la galería de la casa de té son `soloNoche` (como la luz de los ventanales): de día ya no hay brillo alrededor de un farol apagado. **No** se arregló el «encendido de golpe» a los 22 m (sigue igual). No se vio la galería de día en pantalla |
| C7 | **arreglado**: el charco de luz de la puerta de la cantina, en dos pedazos: sobre las tablas de la galería (a 30 cm; antes quedaba a 8 cm y las tablas tapaban los primeros 1,5 m, los más brillantes) y el del suelo de adelante. Visto de noche de lejos (`trabajo\arreglos402\c7`): el cambio es sutil (el brillo de la galería se ve más ancho) y sin costuras a esa distancia; no se miró de cerca |
| C8 | **descartado**: paisaje fijo de los ventanales: no es trivial (hay que pintar un lienzo por clima y estación) |
| C9 | **descartado**: cambiar el orden de dibujo de halos y charcos para que el agua no los tape toca la mezcla de todo lo aditivo con lo transparente (follaje, vidrios); no es seguro sin una revisión visual completa de noche |
| C10 | no se toca (sombras: regla del proyecto) |
| C11 | **pregunta** (ya estaba en 4.0.1): apagar los efectos de la 4.0 al bajar la calidad en vivo |
| D10 | **descartado**: toca el soporte estructural de la construcción (`soporteVerticalNivel`, `dependenciasSobre`, `revisarSitio`); es un cambio de física con riesgo de derribar obras de más |
| D11 | **descartado**: el perro en el agua al bajar del kayak es de navegación (`puntoCerca`/`caminable`) y no se confirmó en el juego |
| D12 | **descartado**: el tren de pasajero que sigue en pausa lo dice el propio comentario del código como diseño (sigue su vía) |
| D13 | **descartado**: la física del puente levadizo queda a lo sumo 1 s tras retirarlo y se limpia sola; arreglarlo toca dos módulos para ganar 1 s |
| D14 | **descartado**: las crías del Rey sin fuego/arrastre/duda/humo es una omisión de diseño (daría ventajas nuevas contra ellas) |
| D15 | **descartado**: relámpagos en pausa pueden ser ambiente buscado (la portada también tiene tormenta); decisión del usuario |
| D16 | **arreglado**: al soltar un sello se vuelve a dibujar con lo guardado: el primer «Girar» ya anda (y el arrastre siguiente ya no pisa el giro con el objeto viejo) |
| D17 | **arreglado**: juntar armas tiradas y golpear puestos y capullos también miran la altura (tolerancia de 6 a 12 m): en la arena del Rey (650 m arriba) ya no se alcanza lo de abajo |
| D18 | **descartado**: vaciar `guardias` en `limpiar()` podría duplicar guardias vivos si `limpiar` corre con la lista en uso; no se pudo confirmar el caso y el efecto beneficia al jugador |
| D19 | **descartado**: agrandar la zona de golpe de los grandotes y mutados cambia la dificultad (balance) |

## 4. Fps

Herramienta: `herramientas/medir-vistas.cjs` (la de siempre, con tres vistas nuevas: `cantina-fuera-noche`, `cantina-dentro-noche` y `pena-sabado` —el día 13 es sábado, 22:30—). Todas con `COMPLETA=1` (aldea completa), 200 cuadros por vista, sin vsync, ventana oculta, perfiles propios fuera de OneDrive.
Un control **de 4.0.1** (`c598168`, el tope de `v392-mejoras`) corrido el mismo día en la misma máquina, intercalado con las corridas de 4.0.2 (corrida 1 de 4.0.2, control, corrida 2 de 4.0.2) para que el ruido caiga parejo. Los p50 están en ms; la diferencia es la de la media de las dos corridas de 4.0.2 contra el control.

**Cómo leerlo (importante):** el ruido de esta máquina es grande y a rachas. En varias vistas el control o una de las corridas tiene un pico (p95 de 30 a 45 ms) que no aparece en la otra, y el control de media salió ~20 ms en vistas donde 4.0.2 dio 8–10 (y a veces al revés).
Por eso los porcentajes **no son una medida de costo**: sirven para decir que no hay una regresión consistente. Lo fiable es la **cantidad de dibujos y de triángulos** (la 4.0.2 no suma nada por cuadro: sólo cambió la forma de unas figuras y un par de luces fijas) y el piso de cada vista (la corrida más baja).
Es una corrida del 17-10-2026 en esta PC, no una medición en la 4600G.

Base de 4.0 que dio el usuario (alta, plaza ~14,5–15,5 ms p50): hoy el control de 4.0.1 dio **16,3** en la plaza (el ruido entre días ya estaba avisado, ±20 %) y 4.0.2 dio **16,5 / 15,3**.

### Calidad alta (Relax, aldea completa)

| vista | 4.0.1 (control) p50 | 4.0.2 corrida 1 p50 | 4.0.2 corrida 2 p50 | p95 (corr. 1 / 2) | dibujos 4.0.2 | triángulos 4.0.2 | diferencia de medias vs control |
|---|---|---|---|---|---|---|---|
| refugio-dia | 4.8 | 5.2 | 5.3 | 6.9 / 8.9 | 197 | 1176 k | +9 % |
| refugio-noche | 10.8 | 11.4 | 10.5 | 18.6 / 11.9 | 160 | 1155 k | +1 % |
| bosque | 11.4 | 19.2 | 10.9 | 26.2 / 12.6 | 222 | 1200 k | +32 % |
| estacion | 5.0 | 6.4 | 4.5 | 20.8 / 12.6 | 170 | 1150 k | +9 % |
| almacen-antes | 14.3 | 15.0 | 14.4 | 16.0 / 15.7 | 269 | 1180 k | +3 % |
| casa-te-antes | 12.8 | 12.9 | 12.2 | 15.7 / 14.1 | 240 | 1082 k | -2 % |
| casa-te-fuera-noche | 12.3 | 13.8 | 11.9 | 15.8 / 13.2 | 198 | 1059 k | +4 % |
| casa-te-dentro-dia | 15.8 | 17.7 | 16.3 | 19.4 / 17.4 | 167 | 1223 k | +8 % **>16,7** |
| casa-te-dentro-noche | 16.2 | 17.5 | 16.3 | 19.2 / 17.3 | 164 | 1210 k | +4 % **>16,7** |
| aldea-plaza-dia | 16.3 | 16.5 | 15.3 | 18.2 / 16.4 | 197 | 1282 k | -2 % |
| aldea-noche | 17.3 | 16.5 | 14.9 | 18.0 / 16.2 | 299 | 1375 k | -9 % |
| aldea-loma-tarde | 25.5 | 15.8 | 15.5 | 18.8 / 16.5 | 199 | 1352 k | -39 % |
| bosque-tarde | 9.4 | 5.4 | 5.0 | 6.8 / 8.5 | 238 | 1233 k | -45 % |
| lago-tarde | 9.6 | 8.7 | 8.7 | 10.6 / 10.4 | 156 | 1025 k | -9 % |
| lago-amanecer | 9.7 | 8.9 | 8.8 | 10.3 / 10.2 | 154 | 1025 k | -9 % |
| molino-campo-dia | 6.6 | 5.3 | 4.4 | 8.7 / 9.0 | 182 | 1301 k | -27 % |
| molino-campo-tarde | 6.8 | 6.4 | 4.0 | 8.0 / 9.2 | 176 | 1302 k | -24 % |
| molino-lejos-tarde | 7.6 | 7.6 | 4.8 | 14.2 / 6.0 | 220 | 1341 k | -18 % |
| puente-dia | 10.2 | 5.7 | 4.1 | 18.4 / 12.2 | 147 | 1241 k | -52 % |
| aldea-loma-noche | 24.1 | 21.7 | 15.0 | 41.7 / 16.1 | 197 | 1243 k | -24 % **>16,7** |
| cantina-fuera-noche | 10.4 | 10.9 | 10.6 | 12.5 / 12.1 | 250 | 1147 k | +3 % |
| cantina-dentro-noche | 15.3 | 15.7 | 16.0 | 17.5 / 18.0 | 259 | 1152 k | +4 % |
| pena-sabado | 15.2 | 15.6 | 15.9 | 17.6 / 17.3 | 246 | 1153 k | +4 % |

cargas: nueva 5584 ms, guardada 5675 ms (corr. 1)

### Calidad media (Relax, aldea completa)

| vista | 4.0.1 (control) p50 | 4.0.2 corrida 1 p50 | 4.0.2 corrida 2 p50 | p95 (corr. 1 / 2) | dibujos 4.0.2 | triángulos 4.0.2 | diferencia de medias vs control |
|---|---|---|---|---|---|---|---|
| refugio-dia | 6.3 | 4.6 | 5.7 | 6.2 / 15.8 | 193 | 698 k | -18 % |
| refugio-noche | 17.2 | 8.5 | 17.0 | 10.0 / 27.4 | 159 | 676 k | -26 % |
| bosque | 17.4 | 8.5 | 16.4 | 10.0 / 27.0 | 154 | 646 k | -28 % |
| estacion | 5.9 | 10.2 | 5.3 | 12.1 / 18.1 | 171 | 637 k | +31 % |
| almacen-antes | 5.9 | 5.9 | 7.1 | 7.7 / 10.4 | 174 | 679 k | +10 % |
| casa-te-antes | 18.0 | 11.1 | 18.8 | 12.7 / 31.3 | 210 | 650 k | -17 % |
| casa-te-fuera-noche | 18.8 | 10.7 | 18.4 | 11.9 / 29.9 | 164 | 625 k | -23 % |
| casa-te-dentro-dia | 23.2 | 14.9 | 22.7 | 15.9 / 44.1 | 164 | 760 k | -19 % |
| casa-te-dentro-noche | 23.0 | 15.1 | 22.7 | 16.2 / 44.1 | 168 | 751 k | -18 % |
| aldea-plaza-dia | 22.2 | 14.4 | 17.2 | 15.8 / 32.9 | 179 | 824 k | -29 % |
| aldea-noche | 21.3 | 13.5 | 13.2 | 15.0 / 14.8 | 273 | 856 k | -37 % |
| aldea-loma-tarde | 21.6 | 13.4 | 13.1 | 14.3 / 14.2 | 187 | 902 k | -39 % |
| bosque-tarde | 5.2 | 4.3 | 4.0 | 6.0 / 8.6 | 161 | 648 k | -20 % |
| lago-tarde | 15.2 | 8.1 | 7.6 | 9.8 / 8.7 | 140 | 595 k | -48 % |
| lago-amanecer | 15.6 | 7.9 | 7.4 | 9.4 / 8.6 | 138 | 595 k | -51 % |
| molino-campo-dia | 27.4 | 30.3 | 15.7 | 44.0 / 17.0 | 334 | 1070 k | -16 % |
| molino-campo-tarde | 26.8 | 23.8 | 15.9 | 36.0 / 17.0 | 321 | 1067 k | -26 % |
| molino-lejos-tarde | 19.0 | 25.3 | 10.7 | 28.2 / 12.2 | 186 | 822 k | -5 % |
| puente-dia | 4.8 | 4.7 | 3.1 | 17.6 / 8.6 | 118 | 627 k | -19 % |
| aldea-loma-noche | 20.8 | 30.0 | 12.6 | 43.2 / 13.7 | 184 | 783 k | +2 % |
| cantina-fuera-noche | 17.9 | 22.0 | 10.0 | 39.3 / 10.9 | 254 | 695 k | -11 % |
| cantina-dentro-noche | 22.1 | 26.2 | 14.4 | 45.2 / 15.3 | 259 | 769 k | -8 % |
| pena-sabado | 21.8 | 23.6 | 14.6 | 44.9 / 15.9 | 235 | 742 k | -12 % |

cargas: nueva 4092 ms, guardada 4036 ms (corr. 1)

### Desafío (alta)

| vista | p50 | p95 | dibujos | triángulos |
|---|---|---|---|---|
| refugio-noche | 10.7 | 12.0 | 190 | 1163 k |
| bosque | 10.6 | 11.8 | 181 | 1175 k |

**Pasan de 16,7 ms p50 en alta** (marcadas en la tabla): `casa-te-dentro-dia` (17,7 / 16,3) y `casa-te-dentro-noche` (17,5 / 16,3): el interior de la casa de té, cuyo costo el usuario ya aceptó el 16-10 (~16 ms, igual que la plaza; el control de hoy dio 15,8 y 16,2: +4 a +8 %, dentro del ruido); y `aldea-loma-noche` en la corrida 1 (21,7, p95 41,7) pero 15,0 en la corrida 2 y 24,1 en el control: un pico de la máquina, no de la vista.
Las vistas nuevas de la cantina por dentro (15,7 / 16,0) y de la peña del sábado (15,6 / 15,9) quedan a ~16 ms, igual que el control (15,3 y 15,2): **la peña con Dalia, parroquianos y música no suma nada medible**. Contra los 16,7 ms de los 60 fps estamos al límite en la plaza, la aldea de noche, la cantina y la peña, como en la 4.0.

**Desafío (alta, `MODO=desafio`):** la herramienta sólo tiene las vistas generales del Desafío a las 22 h, **sin oleada de invasores en pantalla** (no genera una noche grande con duendes: haría falta un humo de partida real). `refugio-noche` 10,7 ms p50 (p95 12,0, 190 dibujos) y `bosque` 10,6 (11,8, 181 dibujos). Sin errores en la consola.
**No se midió una noche grande del Desafío con invasores**: queda sin medir.

No se optimizó nada, como se pidió. Los JSON y los logs de las corridas están en `Documents\Hojarasca\trabajo\arreglos402\fps\`.

## Pruebas agregadas (en el gate: 228 pasos OK, antes 225)

- `verificar-4-0-2-dalia.mjs` — el taco entra 2 cm en el contrafuerte y la base no se movió, el paso corto de Dalia (y sólo de ella) en el tango y el chamamé solo, el ribete afinado.
- `verificar-4-0-2-blusa.mjs` — la cadera de las mujeres sin curvas a 0,094 (la de Dalia y la de los varones igual), la maestra y otras cuatro mujeres se arman.
- `verificar-4-0-2-bajos.mjs` — A4, A5, A6 (con valores), B7, B10 (con la partida rota), B13, B14, C6, C7, D16 y D17.
- Visuales a tamaño completo en el juego real (monitor externo): `pruebas/visor-dalia.cjs` y `pruebas/fotos-aldea-noche-40.cjs solo=cantina-fachada momentos=noche`.

## Decisiones tomadas sin consultar

1. **Dalia: paso al 72 % en vez de tocar los pesos de la falda.** Es la única forma de que la falda no se abra más sin que las piernas la atraviesen. Efecto: en la peña Dalia da pasos un poco más cortos (se nota poco).
2. **Escote: no se abrió el V.** Preferí dejar la esquina del lóbulo antes que mostrar más piel.
3. **Cadera de las mujeres 8 mm menos honda** (afecta a todas las mujeres sin curvas, de perfil el cuerpo debajo de la ropa es apenas más fino).
4. **A6 cambia el ritmo de la moza** de 0:00 a 6:00 (afluencia más alta en la madrugada del sábado y del viernes, más baja en la del domingo… según la noche que corresponda).
5. **B10, sacar `toString` y `valueOf` de lo que se lee.** Si alguna vez un guardado legítimo usara esas claves (hoy ninguno), se perderían.
6. **B14, el aviso nuevo** (texto sólo en castellano; va a la lista de inglés pendiente).

## Preguntas para el usuario

- Escote de Dalia: ¿querés la esquina del lóbulo redondeada aunque se vea un poco más de piel? Si sí, hay que decir cuánto.
- Siguen las preguntas de 4.0.1 (A3 mando, B9, B3, C11, D3) y las de arriba marcadas **pregunta**.
- D15 (relámpagos en pausa) y D12 (tren de pasajero en pausa): ¿diseño buscado o se arreglan?

## No probado

Tab en el creador y el prólogo en pantalla; el aviso de la copia a la carpeta; las notas de primera vez en la portada; la galería de la casa de té de día; el charco de la cantina de cerca; el escote con otras luces.
