# Hojarasca — checklist para publicar en Steam

## Build y QA

- Ejecutar `npm install` en una máquina limpia con Node.js 20+.
- Ejecutar `npm run verify` y exigir salida completamente verde.
- Confirmar que la auditoría headless RC4 reporte todas las estructuras críticas, 0 plataformas sin superficie visual y 0 solapamientos de huellas/estaciones.
- Ejecutar `npm run verify:geometry` y revisar cualquier componente flotante reportado.
- Ejecutar `npm run verify:physics` y revisar discrepancias entre pisos visibles y físicos.
- Jugar una partida nueva y cargar una partida previa/migrada.
- Probar guardado, backup, recuperación, fotos, mapa, tren, kayak, pesca, clima, construcción y encargos.
- Ejecutar `node pruebas/verificar-construccion-premium-rc6.mjs` y exigir compatibilidad histórica de 4 categorías sin geometrías inválidas.
- Ejecutar `node pruebas/verificar-construccion-multinivel-rc9.mjs` y exigir 25 planos, soporte estructural, apilado de tres niveles, hueco físico y escalera de 11 peldaños.
- Ejecutar `node pruebas/verificar-construccion-ultra-rc10.mjs` y exigir 30 planos, diagnóstico semántico de habitación, refugio modular, cubierta transitable y reglas estrictas de soporte.
- Ejecutar `node pruebas/verificar-habitat-premium-rc11.mjs` y exigir 34 planos, confort 10/10 equipado, cubierta climática, farol dinámico, catre y estufa contenida.
- Ejecutar `node pruebas/verificar-habitat-conectado-rc12.mjs` y exigir 37 planos, red interior de dos módulos, puerta interior con transferencia por apertura y colocación correcta en planta/terraza.
- Ejecutar `node pruebas/verificar-naturaleza-patagonica-rc13.mjs` y exigir bosque húmedo/ecotono/estepa, flora regional, coironal, contraluz de fauna y tropilla de guanacos.
- Ejecutar `node pruebas/verificar-naturaleza-viva-rc14.mjs` y exigir raíces integradas, hojarasca procedural, cuatro variantes arbóreas, fauna alineada a pendiente y presupuesto de detalle cercano.
- Ejecutar `node pruebas/verificar-naturaleza-cinematica-rc15.mjs` y exigir copas profundas, transición LOD por dither, viento por altura y locomoción quieto/paso/trote/galope en huemul, zorro, pudú y guanaco.
- Ejecutar `node pruebas/verificar-naturaleza-reactiva-rc16.mjs` y exigir firma sonora por superficie/clima, cobertura visual, escucha animal y contacto al suelo de fauna/árboles.
- Ejecutar `node pruebas/verificar-ecosistema-dinamico-rc17.mjs` y exigir red inter-especie, zorro/liebre, rutas de escape con cobertura, rastros en nieve y briznas de estepa.
- Ejecutar `node pruebas/verificar-ecosistema-atmosferico-rc18.mjs` y exigir ritmos diarios, descanso/forrajeo, alarma aviar en cadena, huellas ampliadas, ráfagas locales y niebla de mallín/ribera.
- Comparar amanecer, mediodía y noche: huemul/zorro/guanaco/liebre/aves deben cambiar actividad sin aparecer o desaparecer con cortes artificiales.
- En mallín/ribera durante amanecer con poco viento, revisar bruma baja; repetir en ladera expuesta y comprobar menor persistencia.
- Cruzar bosque→estepa durante viento medio: las ráfagas deben ganar amplitud en abierto y quedar más amortiguadas entre árboles, sin cambios instantáneos.
- En nieve, seguir una tropilla de guanacos y una liebre cercana: los rastros deben ser más pequeños/grandes según especie y desaparecer con la lógica existente de nevada.
- Observar una liebre y un zorro en la misma zona de noche: la persecución debe ser breve/local, la liebre debe huir en zigzag y el zorro debe priorizar al jugador si éste se vuelve amenaza.
- Asustar un huemul cerca del borde del bosque: su ruta debe tender a cobertura segura sin entrar al agua ni trepar pendientes absurdas.
- En invierno, seguir huemul/zorro cerca del jugador: las huellas animales deben aparecer sólo localmente y desvanecerse con la misma lógica de nieve que las pisadas del jugador.
- Recorrer estepa con viento: deben verse briznas secas cercanas sin aparecer con la misma intensidad dentro del bosque húmedo.
- Acercarse a pudú/huemul caminando agachado sobre pasto y repetir corriendo sobre hojarasca/agua: la distancia de alerta debe cambiar de forma perceptible.
- Repetir bajo lluvia fuerte/tormenta: la aproximación sonora debe quedar parcialmente enmascarada, sin volver ciega o sorda a la fauna.
- Observar pudú, huemul, zorro y guanaco detenidos y en marcha: la sombra de contacto debe permanecer pegada al terreno, sin rebotar con el cuerpo ni verse como un disco duro.
- Revisar bases de árboles a 5–40 m y al superar ~46 m: la mancha de contacto debe integrar raíces/suelo cerca y desaparecer sin popping molesto a distancia.
- Recorrer un bosque denso caminando en línea recta y en zigzag alrededor del umbral LOD: la transición entre copa detallada/simplificada no debe producir saltos evidentes, huecos ni parpadeo.
- Observar árboles durante ráfagas: base y raíces deben quedar prácticamente firmes mientras la copa responde con más amplitud y torsión.
- Seguir un mamífero desde reposo hasta huida: el cambio paso→trote→galope debe sentirse progresivo, sin aumentar simplemente la velocidad de una misma animación.
- En bosque húmedo, revisar a pie la base de coihues/lengas/ñires: raíces y hojarasca deben integrar el tronco al suelo sin z-fighting ni parches flotantes.
- Cruzar una ladera observando huemul, zorro, pudú o guanaco: el cuerpo debe acompañar la pendiente suavemente sin inclinaciones bruscas ni patas enterradas.
- Recorrer la transición oeste húmedo → ecotono → estepa y comprobar que densidad, sotobosque y color del pasto cambien gradualmente, sin una frontera artificial.
- Comparar lenga/ñire protegidos con ejemplares altos o expuestos: los segundos deben verse más bajos y anchos, sin deformaciones extremas.
- Observar una ráfaga fuerte: troncos relativamente firmes, copa/ramillas y coironal más reactivos, sin efecto de árbol de goma.
- Observar huemul, pudú, zorro colorado, guanaco y cóndor en sus ambientes previstos; la tropilla de guanacos debe conservar cohesión, un centinela más atento y una cría más pequeña.
- En calidad alta, recorrer bosque denso y estepa mirando picos de frame time, popping y transiciones de variantes antes de declarar Gold.
- Probar construcción en terreno llano y pendiente: rotación R/rueda, categorías Tab, avance Y y cancelación Supr.
- Construir casilla + mobiliario sobre su piso; verificar que mesa/estante no se hundan ni floten.
- Construir cobertizo o banco de carpintero y confirmar que habilitan aserrado lejos del galpón original.
- Encadenar pasarelas y cercos; revisar visualmente apoyos, colisiones y separación entre piezas.
- Construir un módulo de dos y tres niveles: comprobar que entrepisos sin soporte se rechacen y que paredes/pilares críticos no puedan desmontarse si sostienen un nivel superior.
- Construir `Entrepiso con escalera` + `Escalera de nivel`: atravesar el hueco sin plataforma invisible y subir los 11 peldaños sin saltos o enganches.
- Superar 8 planos en una categoría y verificar paginación con `[` / `]`, selección 1–8 y edición de una pieza situada en otra página del catálogo.
- Construir una habitación modular RC10: cuatro lados cerrados, al menos una puerta y una cubierta; comprobar que el panel indique “habitación cerrada” y que `dentro()`/mecánicas de refugio la reconozcan.
- Repetir quitando temporalmente una pared con Shift+Y: durante la edición debe dejar de figurar habitable y restaurarse al cancelar.
- Probar marco abierto + tres paredes + techo: debe figurar “espacio protegido”, no habitación cerrada.
- Probar cuatro medias paredes: no deben habilitar un entrepiso estructural.
- Subir a la cubierta plana y revisar que la superficie física coincida con la geometría visible.
- Montar una habitación RC11 con catre, farol y estufa: verificar confort/protección en HUD, luz nocturna, aviso de estufa y descanso en catre.
- Montar una galería de tres paredes + marco abierto + techo: la precipitación debe desaparecer bajo la cubierta, pero el espacio no debe tratarse como habitación cerrada.
- Encender una estufa durante lluvia: comprobar llama contenida, ausencia de fogón exterior/humo abierto y luz/calor estables.
- Construir dos módulos contiguos sin muro compartido: ambos deben figurar como ambientes conectados, no como dos refugios incompletos.
- Repetir con `Tabique con puerta interior`: cerrada debe amortiguar calor y bloquear luz compartida; abierta debe comunicar ambos ambientes.
- En una cubierta plana transitable, colocar mobiliario desde planta baja y luego desde la terraza; cada pieza debe respetar la altura del jugador.
- Probar 1080p y 1440p; modo ventana/pantalla completa; Alt+Tab y cierre con guardado.
- Confirmar que el juego arranca sin conexión a internet.
- Dejar abierta una partida prolongada, tomar/reemplazar muchas fotos del refugio y vigilar memoria/GPU.
- Probar recuperación desde backup con un save principal corrupto y con un JSON válido pero inválido como partida.

## Distribución

- `npm run dist:steam:win` genera la carpeta Windows (`win-unpacked`) para un depot de Steam.
- `npm run dist:win` genera instalador y portable para distribución fuera de Steam.
- `npm run dist:linux` genera AppImage si se decide soportar Linux.
- Verificar icono, nombre, versión, ejecutable y rutas de guardado en una PC limpia.
- Mantener una copia del ZIP fuente de la RC exacta que produjo la build subida.

## Steamworks

- Crear/confirmar App ID y depots reales; **este proyecto no inventa un App ID**.
- Subir primero a una rama beta privada y probar mediante el cliente de Steam.
- Preparar cápsulas, screenshots, tráiler, descripción, requisitos, idiomas, privacidad, créditos y licencias de terceros (incluidas fuentes OFL y Three.js).
- Configurar Cloud Saves solo después de definir y verificar la ubicación final del guardado.
- Achievements, overlay avanzado y Steam Input son opcionales; no bloquear el lanzamiento si no forman parte del alcance 1.0.

## Gold

Una build pasa a Gold únicamente después de smoke test en hardware real, recorrido QA completo y prueba desde el depot privado de Steam.

## Inspección visual RC5

- Recorrer Refugio del Arroyo y ambas cabañas: ningún travesaño cruza el vano de puerta y las hojas apoyan sobre el piso.
- Confirmar que las fotos desbloqueadas están apoyadas contra la pared del refugio, sin separación visible.
- Revisar chimeneas desde interior y exterior: hogar/fuste/remate forman un conjunto continuo y el humo nace en la boca superior.


## RC19 — Naturaleza cercana

- [ ] Observar huemul/guanaco quietos durante 30–60 s: deben alternar forrajeo, rumia, acicalado y vigilancia sin cortes bruscos.
- [ ] Acercarse lentamente a una liebre: las orejas deben reaccionar antes de la huida y nunca interferir con el zigzag.
- [ ] Ver un zorro patrullando: olfateo/orejas/cola deben desaparecer al entrar en persecución o escape.
- [ ] Observar zorzales en bosque abierto: algunos pueden aparecer en posadero bajo y otros en suelo; ante amenaza ambos deben levantar vuelo.
- [ ] Observar bandurrias detenidas en mallín/pastizal: sondeo y vigilancia no deben parecer un único loop sincronizado.
- [ ] Revisar pelaje a contraluz y sombra: la microfibra no debe producir moiré/parpadeo visible a 1080p/1440p.


## RC20 — Optimización sistémica

- [ ] Recorrer bosque denso y estepa en calidad Alta con F3 apagado: comparar stutter/1% low frente a RC19, no sólo FPS promedio.
- [ ] Repetir con F3 encendido y confirmar que el medidor sigue reportando lógica/dibujo correctamente.
- [ ] Acercarse/alejarse de huemul, pudú, zorro, guanaco y NPCs: las sombras reales deben aparecer/desaparecer sin discos duros ni cambios visibles molestos.
- [ ] Caminar entre interior, galería y exterior bajo lluvia: audio/protección pueden tardar como máximo una fracción de segundo, sin estados pegados.
- [ ] Construir/editar dentro de una base grande: panel de hábitat debe seguir respondiendo mientras evita recalcular toda la red por frame.
- [ ] Probar hacha, aserrado, fogones propios y plantado caminando/corriendo: los avisos no deben sentirse retrasados y la acción final debe mantener validación correcta.
- [ ] Seguir al perro con mucha fauna cercana: marcado estable, sin alternancia errática y sin microtirones al aparecer grupos.
- [ ] Sesión de 20–30 minutos con fauna abundante: observar heap/GC y confirmar ausencia de crecimiento sostenido por listas de sujetos/rastros.


## RC21 — Optimización profunda

- [ ] Comparar bosque/estepa con RC20 en calidad Alta: medir 1% low y cuadros >33 ms con F3, no sólo FPS medio.
- [ ] Sesión larga con F3: observar heap y delta; no debe crecer de forma sostenida por el índice espacial/ecosistema.
- [ ] Acercarse rápido a huemul, pudú, zorro, liebre y guanaco desde >150 m: la reacción debe volverse inmediata al entrar en rango cercano, sin latencia visible.
- [ ] Observar fauna lejana con prismáticos: movimiento/animación deben continuar aunque percepción/decisiones estén escalonadas.
- [ ] Seguir al perro en una zona con mucha fauna: marcado debe conservar estabilidad usando consulta espacial local.
- [ ] Provocar zorro–liebre y alarma aviar: las consultas espaciales no deben cambiar el comportamiento ecológico de RC17–RC19.


## RC22 — Optimización adaptativa

- [ ] Recorrer bosque denso, base grande y estación con F3: el presupuesto debe permanecer L0 cuando hay margen y subir sólo tras presión sostenida.
- [ ] Forzar una escena pesada y comprobar que L1–L3 no afecten controles, locomoción ni animación cercana.
- [ ] Tras volver a una zona liviana, comprobar recuperación gradual a L0 sin oscilación rápida.
- [ ] Comparar pasto/hojarasca cerca del jugador entre L0 y presión: el detalle cercano debe mantenerse; sólo debe acortarse el anillo lejano.
- [ ] Probar hacha y construcción/despeje en bosque denso: interacción inmediata y mismo resultado que RC21.
- [ ] Recorrer estructuras/vía a alta velocidad: no deben quedar objetos ocultos al entrar en rango ni visibles indefinidamente al alejarse.
- [ ] Vigilar `>33ms`, frame EMA y heap durante 20–30 min y comparar con RC21.

## RC23 · Optimización autodiagnóstica
- [ ] Abrir F3 y comprobar que aparecen costos por subsistema sin crecimiento continuo de heap.
- [ ] Forzar escena pesada y verificar reducción gradual de partículas/aves sin popping brusco.
- [ ] Observar NPCs a 40–120 m: movimiento continuo, pose secundaria escalonada sin saltos visibles.
- [ ] Probar juntar/soltar objetos y registrar árboles/plantas sin pérdida de interacción.
- [ ] Construir, mover y desmontar piezas; validar interior/cubierta y búsquedas cercanas.


## RC24 · Optimización anti-tirones
- [ ] Probar límite 60 FPS en monitores 120/144/165/240 Hz: no debe caer a un patrón fijo 48/55 FPS.
- [ ] Recorrer bosque denso/base/estación con F3 y comparar `>33ms` y 1% low frente a RC23.
- [ ] Vigilar picos periódicos cada 0.2–0.3 s: vegetación, ambiente, visibilidad y sombras no deben coincidir sistemáticamente.
- [ ] Mantener partida 2–3 minutos: el autosave de 20 s no debe producir hitch perceptible.
- [ ] Construir/recolectar y forzar guardados explícitos; confirmar integridad del backup y ausencia de corrupción.
- [ ] Alt+Tab, ocultar ventana y cerrar: el último progreso debe persistir.

## RC25 · Bug Hunt integral
- [ ] Guardar en entrepiso/terraza, cerrar y cargar: conservar la misma planta y altura.
- [ ] Cargar un save antiguo sin `pos.y`: mantener compatibilidad y ubicar al jugador de forma segura.
- [ ] Probar refugio prefabricado desde interior, techo y por debajo: sólo el volumen interior debe contar como refugio.
- [ ] Apilar dos paredes con puerta: `E` debe accionar exclusivamente la puerta de la planta del jugador.
- [ ] Apilar catres/talleres/estufas: avisos e interacciones deben seleccionar sólo la planta actual.
- [ ] Encender/usar fogón o estufa con otra fuente exactamente encima/debajo: no debe cruzar plantas.
- [ ] Cambiar clima a Lluvioso/Variable durante un ciclo largo: el preset debe empezar a aplicarse en el siguiente tick, sin esperar minutos.
- [ ] Smoke runtime WebGL: entrar al bosque y jugar varios minutos sin `ReferenceError`, `TypeError` ni cartel de error.


## RC31 — pasada visual estructural obligatoria

- [ ] Acercarse y alejarse de refugio, cabañas, faro, molino, Casa de Té, torre, almacén y galpón: nunca queda una pieza aislada.
- [ ] Abrir/cerrar cada puerta/postigo/portón y alejarse: hoja y edificio desaparecen/reaparecen juntos.
- [ ] Faro: lente, haz y luces siguen al cuerpo completo en visibilidad.
- [ ] Molino y galpón: aspas, tanque y cañerías no flotan ni se separan del complejo.
- [ ] Cabañas: vano de puerta completamente libre, sin listón horizontal atravesando el acceso.
- [ ] Refugio: fotos apoyadas en pared; chimenea continua; props interiores nunca flotan sin el edificio.
- [ ] Casa de Té: chimenea toca terreno, atraviesa la cubierta de forma continua y sobresale del techo.
- [ ] Mirar ventanas desde fuera y dentro: el vidrio no desaparece por backface.
- [ ] Carteles lejanos no aparecen como placas negras aisladas en el horizonte.

## Logros de Steam (1.10)

- Instalar `steamworks.js` (`npm install steamworks.js`): no es dependencia obligatoria, el juego se arma y corre sin ella.
- Poner el App ID en `steam_appid.txt` al lado de `Hojarasca.exe` en el depot (o en `STEAM_APP_ID` para probar).
- Dar de alta en Steamworks los 34 logros de `STEAM_LOGROS.md`, con el **nombre de API exacto** de la tabla; los marcados como ocultos, como *Hidden*.
- Probar con Steam abierto: ganar un logro del Relax (por ejemplo, esquilar una oveja → `RELAX_VELLON`) y verlo aparecer en el overlay.
- Sin Steam abierto o sin App ID: el juego tiene que arrancar igual y los logros quedar en la libreta de la pausa. Si `steamworks.js` falla al iniciar, el motivo queda en `logs/hojarasca-crash.log` con el prefijo `steam`.
