# 4.10 guardian — el progreso del jugador dentro de la partida (tanda 3 del Desafío, «Volver a jugar»)

Rama `v410-guardian` (sale de `main` = 4.9.0). No sube la versión.

## Lo que ya existía (antes de tocar)
- Récords y logros: `desafio-logros.js` (`LOGROS`, `registrarRecord`, top 10 por dificultad del modo sin fin, récord por código de semilla). Nada de eso da poder al jugador: sólo se anota.
- Mejoras de armas: `MEJORAS` / `MEJORAS_ARSENAL` (lanza dorada, arco reforzado, pistola cargada...) con cristales; `armaEfectiva` las aplica.
- Bestiario del Desafío (`desafio-noche2.js`, `BESTIARIO`): cada tipo se anota al verlo de cerca, se «aprende cómo pelea» al primer abatido y se conoce el punto débil al tercero. Sólo texto. **El curandero y el enjambre (4.8) no estaban en el bestiario** (`anotarBestiario` los ignoraba).
- Cuaderno de campo con las pestañas Bruno, Especies, Álbum, Diario, Oficios, Bestiario y (4.9) «La aldea».
- La salud máxima era la constante `SALUD_MAX = 100` en seis lugares de `desafio.js`; correr, recarga, daño y reparación eran fijos.

## Qué hay ahora
### Bonos del jugador (el contrato) — `src/desafio-bonos.js`
Exporta `BONOS_CLAVES = ['saludMax','correr','recarga','dano','reparar','alcance']`, `bonosNuevos()`, `sumarBono(d, origen, clave, valor)`, `quitarBonosDeOrigen(d, origen)`, `bonoDe(d, clave)` y `sanearBonos(v)`. El estado vive en `D().bonos = { origen: { [origen]: { [clave]: n } } }`.
- `sumarBono` acumula dentro del mismo origen (para reemplazar: `quitarBonosDeOrigen` y volver a sumar). Rechaza claves desconocidas, valores que no son números, orígenes vacíos, de más de 24 letras o `__proto__`; hasta 16 orígenes; cada valor acotado a ±1000.
- `bonoDe` suma todos los orígenes; `bonoAplicado` lo acota con `TOPES_BONO` (el estado guarda la suma tal cual; el tope se pone al usarlo).
- Orígenes en uso: `'habilidad'` (este documento). `'ventaja'` (partidas), `'trofeo'` y `'defensa'` (base) los suman con `sumarBono`. `'bestiario'` está reservado, pero hoy **no se usa**: el efecto del estudio 3 es por tipo de duende (no cabe en una clave) y se calcula directo del contador.
- Lo que significa cada clave: `saludMax` puntos de salud (+/-); `correr`, `recarga`, `dano`, `reparar`, `alcance` fracciones (0,1 = 10 %). `recarga` es menos espera entre ataques.
- Dónde se aplican (cambios mínimos, en bloques `// 4.10 guardian:`):
  - `saludMax`: `saludMaxima()` en `desafio.js` (curar, levantarse, regenerar, la barra, el emplasto, `cerrarNoche`) y el tope de la salud guardada en `sanearDesafio`; la caída que guarda en `main.js` guarda la salud máxima de la partida. Piso de 40.
  - `dano`, `alcance`, `recarga`: `armaConBonos(armaEfectiva(...), D())` en `atacar` y `atacarAlterno` (daño y disparo cargado; alcance de golpe y del rayo, y la velocidad del tiro; la espera). Piso de espera 0,12 s.
  - `reparar`: el martillo repara `10 % × (1 + b)` por golpe, y la receta de reparar (R) cuesta `ceil(cantidad / (1 + b))` y cura lo mismo o más.
  - `correr`: cada medio segundo el Desafío le pone `estado.bonoCorrer` al jugador; `jugador.js` lo usa (una línea) sólo corriendo y a pie.

### Habilidades del guardián — `desafio-habilidades.js` (puro), `desafio-habilidades-mundo.js` (pantalla)
**Regla de los puntos:** un punto por cada noche aguantada. Se da en `amanecer()` (una noche resistida: la base no cayó y vos tampoco); si caés, la noche se pierde y no hay punto. Una sola vez por noche (guarda `habilidades.noche`): recargar y volver a amanecer no suma. 
Tres ramas, dos habilidades cada una, tres niveles (1, 2 y 3 puntos). Tener todo cuesta 36 puntos: hay que elegir.

| Rama | Habilidad | Nivel 1 / 2 / 3 |
|---|---|---|
| Tiro | Pulso firme | +6/12/20 % daño y +5/10/15 % alcance |
| Tiro | Mano ligera | -6/12/20 % de espera entre ataques |
| Reparar | Manos hábiles | +25/50/80 % de reparación por golpe y por material |
| Reparar | Material justo | un material rinde 4/5/6 golpes de martillo (sin ella, 3) |
| Aguante | Corazón de coihue | +10/20/35 de salud máxima; -5 % y -10 % de daño recibido en los niveles 2 y 3 |
| Aguante | Pies de zorro | corrés +4/8/13 % más rápido |

Notas honestas: el daño y el alcance de «Pulso firme» valen para todas las armas (el contrato de bonos no distingue arma); «menos daño recibido» no es un bono (no hay clave) y se lee con `menosDano(d)`; lo mismo `golpesPorMaterial(d)`. Los bonos de las habilidades se **rehacen desde los niveles** al abrir la partida, así que editar el guardado no regala poder.
Pantalla: pestaña **«Guardián (n)»** del cuaderno (J; el número son los puntos), con el cuaderno de la 4.9 como molde. Izquierda: las seis habilidades (rama · nombre · nivel). Derecha: la elegida con sus tres niveles, el botón de subir (dice cuánto falta) y «lo que sumás ahora» de todos los orígenes. Ratón, o teclado: flechas arriba y abajo recorren, Enter elige y pasa al botón, Enter otra vez sube (el foco vuelve solo después de redibujar). Al amanecer sale el aviso «Un punto de guardián».

### Bestiario que premia — `desafio-bestiario-premia.js` (puro)
Diez tipos: rastreador, saltador, tirador, escupidor, bruto, excavador, volador, curandero, enjambre y el jefe. Contador: el `abatidos` del bestiario de siempre (ya se guardaba y se sanea). Estudios a los **5, 15 y 40** abatidos (el enjambre, que viene de a docenas: 20, 60 y 160):
1. **Su punto débil**, con números reales (vida, golpes de lanza y flechas que lo bajan) más un consejo.
2. **Por dónde suele venir**: el lado (río, monte, camino) por el que más lo viste entrar; se anota el lado de cada abatido en `bestiario[tipo].lados` (lo nuevo guardado, saneado en `sanearBestiario`).
3. **Efecto chico:** tus golpes le pegan un 5 % más fuerte (`danoContraTipo`, en `herirAlien` sólo para golpes del jugador).
Se ve en la ficha del Bestiario («Estudio») y avisa en el resumen del bestiario («Bruto: estudio 1 de 3»). Además el curandero («Yuyero») y el enjambre («Duendecito») ahora tienen ficha y se anotan.

### Estado y partidas viejas
`D().bonos` y `D().habilidades = { puntos, noche, niveles }` se crean en `desafioNuevo` y se sanean en `sanearDesafio` (una partida vieja carga sin bonos ni puntos; datos rotos, ids con nombre de objeto, niveles fuera de rango y salud por encima de la máxima cargan limpios). Ningún campo nuevo por invasor (nada que limpiar en `bajarAlien`). La E y el aviso no cambian (el cuaderno se abre con J).

## Pruebas
- `pruebas/verificar-4-10-guardian.mjs` (280 comprobaciones; en el gate): bonos, habilidades, bestiario, estado, pantalla con un cuaderno de mentira, enganche y que nada pase por cuadro de más.
- `herramientas/mutar-4-10-guardian.cjs`: 61 reglas rotas a propósito; las 61 hacen fallar la prueba.
- `pruebas/humo-4-10-guardian.cjs` (partida real, con capturas en `pruebas/salidas/guardian-410`): puntos por noche, la pestaña, gastar con ratón y teclado, efectos medidos (la lanza con Pulso firme pega 38,08 = 34 × 1,12; × 1,05 con 40 abatidos), salud máxima 135, el bono de correr en el jugador, estudios del bestiario, guardar y recargar, partida vieja.
- Pruebas ajustadas (lo mínimo): `verificar-3-8-4-desafio.mjs` (la línea de la caída que guarda ahora usa la salud máxima de la partida) y `verificar-3-8-textos.mjs` (las fichas nuevas del curandero y el enjambre todavía no tienen inglés: se traducen al final; la prueba las deja afuera).
- Fallan igual en la 4.9.0 (no son de esta tanda): `humo-3-5-1-desafio` («caer adentro te escupe al valle», «los pilares también» y «entre tandas no queda nadie colgado»).

## Rendimiento
Nada por cuadro: una resta y una comparación (`relojBonos`) y, cada medio segundo, una suma de seis claves. La pantalla del Guardián sólo se dibuja al abrir el cuaderno. `diag:dibujo` (modo Desafío): 224 llamadas de dibujo en la 4.9.0 y 220 con esta rama (la diferencia es azar de la escena: no se suma ninguna malla).

## No verificado
- Sentir el equilibrio jugando noches enteras: los números (6 a 35 %) salen de la lógica, no de partidas largas. 
- El efecto de «Manos hábiles», «Material justo» y «Pies de zorro» está probado en lógica y en el enganche de texto; en partida real se midió el daño, la salud máxima y que el bono de correr llegue al jugador, no la velocidad en pantalla ni el martillo en una obra rota.
- La noche en que se cae no da punto: se prueba por estructura (sólo `amanecer()` lo da), no cayendo en una partida real.
