# Hojarasca 4.10.0 — Volver a jugar (tanda 3 de las mejoras del Desafío)

Rama `v410-integra` (sobre `main` = 4.9.0). Juntada de `v410-guardian` (`CAMBIOS_4_10_GUARDIAN.md`), `v410-base` (`CAMBIOS_4_10_BASE.md`),
`v410-partidas` (`CAMBIOS_4_10_PARTIDAS.md`) y `v410-coihue` (`CAMBIOS_4_10_COIHUE.md`). Plan: `PLAN_DESAFIO_MEJORAS.md` (tanda 3).

## Qué trae (La noche de los duendes)
- **Habilidades del guardián:** un punto por noche aguantada (si caés esa noche, no hay punto) para 6 habilidades de 3 niveles (costos 1, 2 y 3; son 36 puntos: hay que elegir):
  Tiro (Pulso firme: +6/12/20 % de daño y más alcance; Mano ligera: menos espera entre ataques), Reparar (Manos hábiles: hasta +80 % por golpe; Material justo: un
  material rinde más golpes) y Aguante (Corazón de coihue: +10/20/35 de salud máxima y menos daño recibido; Pies de zorro: hasta +13 % al correr). Pestaña «Guardián» del cuaderno.
- **Bestiario que premia:** estudiar cada tipo de duende (5, 15 y 40 abatidos; el enjambre 20, 60 y 160) da su punto débil con números, por qué lado suele venir y +5 % de daño
  contra ese tipo. El curandero y el enjambre ahora tienen ficha.
- **Defensas curtidas:** una defensa que aguanta varias noches sube de nivel (2, 4 y 7 noches): recibe ×0,9, ×0,8 y ×0,7 de daño y al subir recupera el 20 % de resistencia;
  lleva una placa que se ve. 15 tipos (no las trampas ni la antorcha). Si cae, pierde la experiencia.
- **Siete trofeos** (casco de corteza, hongo grande, ojo de sombra, piedra de ámbar, piña del Coihue, corona del Rey Duende, raíz del nido) que cuelgan de un tablero de trofeos
  (4 tablas y 1 tronco) y dan bonos chicos mientras esté en pie; si lo desarmás quedan guardados, si lo tiran los duendes se pierden.
- **El perro aprende:** nivel 1, 2 y 3 con 3, 6 y 10 noches con vos: gruñe de más lejos (hasta ×1,5) y muerde más fuerte (de 9 a 13,5 por segundo).
- **Semillas del Coihue** (la moneda de entre partidas; la «semilla dorada» ya es el material del bosque): una por partida terminada, con al menos 3 noches resistidas, guardada aparte.
- **Una sola pantalla al empezar una partida:** modo, hasta 2 de 12 ventajas (arranque, aliados, personaje y con costo) y 5 reglas a elección (sólo arco, sin aliados, noches más
  largas, sin reparar, sin emplastos) que suman puntos al récord: (noches × 100 + abatidos + 1000 si ganaste) × multiplicador, con top 10 propio por modo.
- **Partida corta de 7 noches** (el mandamás a la 7.ª, sin Coihue ni cueva) y **modo pesadilla** (se desbloquea al ganar la campaña: 30 % más duendes, más daño, sin cofre del
  alba, niebla más seguido). **Cuatro finales** según cómo jugaste: Entre las cenizas, La aldea entera, El guardián solo y El valle respira; se anotan en el cuaderno.
- **El Coihue camina hacia la base** en el asedio (unas 5 noches si nadie lo frena; temblor, polvo, huellas y una sombra; se lo retrasa pegándole a sus seis raíces de apoyo o con
  trampas, pero no se detiene del todo; si llega a 24 m el cerco cae). **Subida con peligros:** tres raíces que avisan, barren y quedan atravesadas, y tres duendes en las ramas.
- **Lugares del valle que toman los duendes** (desde la noche 3, uno cada dos noches, con su nido de hongos): mientras estén tomados no se talan árboles, no se pican piedras ni se
  juntan los recursos de la zona; se recuperan quemando o rompiendo el nido de día (+2 semillas doradas).

## Decisiones de la junta
- Los bonos (`src/desafio-bonos.js`, del guardián) los suman también trofeos, defensas y ventajas con sus propios orígenes.
- El perro tiene dos mejoras que se multiplican: la ventaja «perro de pelea» (partidas) y el perro curtido (base).
- En `sanearDesafio` conviven los campos `meta`, `crece`, `valle` y los de la tanda 2; una partida vieja carga limpia.

## Verificación
- `npm run verify` de corrido: ver `RELEASE_STATUS.md` (281 pasos OK en paralelo y de corrido).
- Partidas reales (ocultas, en el monitor externo): ver el cierre en `RELEASE_STATUS.md` y el resumen del traspaso.
- Mutaciones a propósito: 61 (guardián), 60 (base), 71 (partidas) y 77 (Coihue): todas hacen fallar sus pruebas.

## Pendiente
- **Sin escuchar:** los sonidos nuevos (Coihue caminando, raíces de la subida, tañidos de la 4.9.0 y lo de las tandas anteriores).
- **Sin jugar:** el equilibrio de todo (puntos de habilidad, costos de ventajas, ritmo del Coihue —5 noches, 24 m, 8 % por zona libre—, lugares tomados) y una partida corta o pesadilla entera.
- `humo-3-5-1-desafio` y `humo-4-9-defensas` fallan a veces por tiempo cuando la PC está cargada (también en la 4.9.0): conviene endurecerlas.
- Sin medir en la 4600G; la guía F1 y los textos nuevos están sólo en castellano (inglés al final); «perro más rápido» quedó como «perro de pelea».
