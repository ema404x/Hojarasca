# Hojarasca 3.5.1 — Crashes y revisión de todo el juego

El usuario: "se crashea" y "analizá problemas en todo el juego, no sólo donde se me crasheó".
Cuatro equipos en paralelo (memoria, caídas, Relax, Desafío), cada uno en su rama.

## Crashes y recuperación
- **`prompt()` no anda en Electron:** ponerle nombre a una obra terminada tiraba error
  siempre (estaba en el registro de caídas desde la 2.x). Ahora hay un **cuadro propio del
  juego** (Enter acepta, Esc cancela, mouse y mando A/B), y también reemplaza las seis
  preguntas del navegador (partida nueva, borrar partida, importar, carpeta sincronizada, otra
  vuelta, oferta de la sincronía).
- **Un sistema que falla ya no congela el juego:** antes, un error dentro del cuadro congelaba
  la imagen y escribía el error 60 veces por segundo. Ahora cada sistema está aislado: el
  error se anota una vez y el juego sigue dibujando.
- **Si la placa pierde los gráficos** (común en placas integradas): el juego guarda, muestra
  "Recuperando los gráficos…", rearma lo que hace falta (árboles lejanos pre-dibujados,
  sombras, programas) y sigue. Si no vuelven en 15 s, guarda y se reabre.
- **Si la ventana se cae o se cuelga 20 s:** se reabre sola con lo último guardado y un aviso.
  Con tope: a la cuarta caída en 5 minutos, pregunta. Si la placa se cae dos veces, prueba otra
  forma de iniciar el 3D.
- **Autoguardado cada 20 segundos reales** (antes contaba tiempo de juego, que se estira con
  pocos cuadros): un crash pierde como mucho 20 s.
- **Memoria:** sesiones largas simuladas de Relax y Desafío: la memoria se estabiliza (~107 MB
  y ~128 MB). Dos fugas chicas arregladas: los puestos invasores rotos quedaban en la escena, y
  las fotos (si fallaba el guardado normal) dejaban 2 MB cada una. Prueba nueva
  `humo-3-5-1-memoria.cjs` y herramienta `herramientas/soak-memoria.cjs`.
- La causa exacta del crash del usuario (el registro de Windows marcó una fuga en Hojarasca.exe
  el 29-09 y la ventana se cayó el 26-09) no se reprodujo en las pruebas: probablemente el
  driver de la placa integrada o la memoria compartida. Ahora el juego se recupera solo.

## Relax (25 arreglos)
- **Capítulo 6 imposible:** el molino, el aserradero y la estación meteorológica no pasaban de
  la primera etapa.
- **Contadores que bajaban** (árboles talados, cosechas): podían trabar capítulos y encargos.
- **Trampas:** E dos veces al dormir pasaba dos días; el modo foto escribía en el reloj (días
  infinitos) y dejaba usar E, F y O; mover el gallinero daba 4 huevos; armar y desarmar un
  cerco daba materiales; con "hora de tu reloj" cada siesta de noche sumaba un día.
- **Lo que se perdía:** desarmar una obra destruía lo guardado (leñera, aserradero, molino,
  colmena, ahumadero); mover un cantero perdía el cultivo; el caballo aparecía en la esquina
  del mapa después de recargar; mover la casa de un poblador lo dejaba yendo al lugar viejo.
- **Sincronía entre PC:** en un caso pisaba lo de la otra PC sin preguntar; ahora pregunta.
- **Mando:** después de cambiar teclas, los botones no andaban o hacían otra cosa; al
  desenchufarlo con el palito apretado, el jugador seguía caminando; "Invertir Y" pedía
  reiniciar. F2 asignado a una acción no andaba.
- Encargo final que dejaba la yerba en 1; visitas de noche que no llegaban; eventos de vecinos
  en partidas sin vecinos; nombre con tildes duplicado en el torneo; la línea de estado tapaba
  la barra; Esc no pausaba colgado de la tirolesa; la prueba de rendimiento anotaba lugares.

## Desafío (25 arreglos)
- **Noche 20:** los grupos de la nodriza nunca aterrizaban (invasores "vivos" toda la noche, no
  se podía dormir, la oleada se cortaba). Recargar en la noche final perdía la nodriza.
- **Cerrar el juego mientras cae la nave perdía la victoria** para siempre.
- **La Madre:** al volver a subir, ojos y pilares rotos sin nada a qué apuntar.
- **Trampas:** cristal infinito con las crías de la nave; guardias de los puestos que
  reaparecían; abrojos gastados que devolvían todo; el hielo de la pirca que nunca se derretía.
- **Invasores:** atravesaban paredes al empujarse; los que nacían en el agua quedaban trabados
  (no dejaban dormir ni subir a la nave); los voladores se desvanecían en el aire; campos que
  pasaban de una vida a la otra; `invocar` movía la nave de la oleada.
- **Arsenal:** granadas sin daño a nido, puestos, torres y la Madre; el arpón arrastraba a
  través de paredes; lo tirado adentro de la nave caía 650 m al valle; bloquear seguía activo
  al cambiar de arma; abrir la construcción no cortaba la ráfaga.
- Morir de día cerraba la noche y borraba la noche especial; la noche podía empezar con vos
  adentro de la nave; guardar adentro volvía flotando; la barra de la Madre en la portada;
  el sonido mudo al salir; los aliados le apuntaban a crías y dormidos.

## Pruebas
- Gate con 4 pruebas nuevas (`verificar-3-5-1-relax/desafio/caidas`) y 4 partidas reales
  nuevas (`humo-3-5-1-relax/desafio/caidas/memoria`).
- `humo-3-1-pueblo`: deja pasar tiempo real antes de mirar el aviso (la ventana oculta de la
  prueba no corre requestAnimationFrame y quién está enfrente se mira 15 veces por segundo).
- `empaquetar.sh`: el código fuente del zip ya no lleva la carpeta `.git`.
