# Hojarasca 4.8.0 — Noches distintas (tanda 1 de las mejoras del Desafío)

Rama `v48-integra` (sobre `main` = 4.7.0). Juntada de `v48-noches` (`CAMBIOS_4_8_NOCHES.md`), `v48-ataques` (`CAMBIOS_4_8_ATAQUES.md`) y
`v48-ambiente` (`CAMBIOS_4_8_AMBIENTE.md`). Plan: `PLAN_DESAFIO_MEJORAS.md` (tanda 1). Problema que resuelve: el Desafío se volvía repetitivo.

## Qué trae (La noche de los duendes)
- **Noches nuevas:** **niebla** (15 % más duendes, los tiradores ven la mitad, se los oye antes, el perro gruñe antes) y **luna llena** (85 % de la
  cantidad, casi todos viejos y con +20 % de vida, más grandotes, más luz). Las noches especiales suben de 38 % a 49 % de las noches elegibles.
- **Giros a las 2 de la mañana:** una tirada por noche (20 % en las noches 2 y 3, 40 % desde la 4; nunca en la primera, ni con jefe, final, rescate,
  tren varado o asedio): baja la niebla, llegan refuerzos (con un curandero) o la defensa más fuerte queda al 12 % (se arregla).
- **Noches que se encadenan:** el que escapó con lo robado vuelve con compañía (+2 rastreadores), los que huyeron vuelven como brutos, sin bajas la
  siguiente viene un 25 % más grande, y entran por la defensa más débil. Aviso: «Lo de anoche no se olvida».
- **Lados de entrada:** cada noche entran por el río, el monte o el camino (se decide al caer la tarde, reproducible con la semilla, nunca el mismo lado
  más de dos noches seguidas; probado en las 13 bases posibles). El perro mira hacia ese lado al caer la tarde.
- **Tácticas en grupo:** desde la noche 3, de 2 a 6 señuelos salen por el otro lado, hacen bulla y atacan la defensa más cercana; el grupo principal baja
  5 a 9 s después. Los que se topan con una defensa y tienen compañeros la rodean.
- **Duendes nuevos:** el **curandero** (34 de vida, se queda 7 m atrás, cura a 3 heridos cada 3,4 s hasta 8 veces, huye si lo alcanzás; desde la noche 4) y
  el **enjambre** (una docena de duendecitos de 30 cm con 7 de vida; una noche de cada tres desde la 6, de 8 a 14; cupo aparte y las especiales no lo multiplican).
- **Ambiente y miedo:** la primera noche da miedo desde el principio (ramas y una risita lejana de tarde; los últimos segundos de la previa, silencio total;
  un golpe grave al salir; ojos naranjas entre los troncos; una antorcha lejana que se apaga y una brasa que huye con una risita); música que sube con el
  miedo y variantes para niebla y luna llena; niebla que sube en unos 85 s; luna más fría y baja (2,3 veces más luz); sombras largas de antorcha; teros y
  vacas que avisan y pájaros y grillos que se callan cuando pasan duendes; raíces del cofre del alba rehechas (ocho, desparejas, medio enterradas).

## Decisiones de la junta
- El giro de las 2 que baja la niebla también lo ven y lo oyen el ambiente (`e.giroNiebla`, `nieblaAhora()`).
- Las pruebas de noches se ajustaron: el enjambre va aparte, el curandero ya existe y ya no se comprueba que esa rama no tocara lo de ataques.

## Verificación
- `npm run verify` de corrido: **273 pasos OK** (4.7.0: 270 + noches + ataques + ambiente).
- Partidas reales (ocultas, de a una, en el monitor externo): `humo-4-8-noches`, `humo-4-8-ataques`, `humo-4-8-ambiente`, `humo-3-0-asedio`, `humo-3-5-1-desafio`,
  `humo-desafio-premium`, `humo-3-8-6-relax` OK; `humo-4-7-pantalla` falló una vez por tiempo con los otros agentes corriendo y pasó dos veces sola.
- Rendimiento (notebook, antes/después): ataques +0,2 ms y +2,5 % de triángulos con 24 duendes + curandero + enjambre; ambiente 6,8 µs por cuadro; sin shaders ni luces nuevas.

## Pendiente
- **El platillo volador sigue llegando cada noche** (se reemplaza en la 4.8.1: rama `v481-aro`; ver `PLAN_DESAFIO_MEJORAS.md`).
- **Sin escuchar:** ramas, tero, vaca (la que más duda el agente), golpe de salida, silencio raro y las dos músicas nuevas. Los ojos se ven chicos de lejos.
- Sin jugar: el equilibrio (49 % de especiales, +25 % sin bajas, 12 duendecitos pegando, cuántas curas da el curandero).
- Sin medir en la 4600G; la corrida sin fin no trae enjambre; el aviso de la bulla de los señuelos y 3 ítems de la guía están sólo en castellano (inglés al final).
