# Hojarasca 4.9.0 — La aldea en la noche (tanda 2 de las mejoras del Desafío)

Rama `v49-integra` (sobre `main` = 4.8.1). Juntada de `v49-aliados` (`CAMBIOS_4_9_ALIADOS.md`), `v49-defensas` (`CAMBIOS_4_9_DEFENSAS.md`) y
`v49-dias` (`CAMBIOS_4_9_DIAS.md`). Plan: `PLAN_DESAFIO_MEJORAS.md` (tanda 2).

## Qué trae (La noche de los duendes)
- **Cuatro vecinos que ayudan en las noches grandes** (llegan una hora antes del ataque y se van al amanecer; nivel de ayuda 0, 1 o 2):
  **Anselmo** (el herrero) arregla las defensas rotas (9 a 15 de vida por segundo); **la abuela Herminia** prende de 2 a 4 fuegos que espantan a los
  viejos oscuros (a 9 o 13 m); **Martín** pasa con la trochita y silba, y dispersa a los traviesos si la base queda a menos de 120 m de la vía (si no, el
  silbato se oye y no hace efecto); **los chicos** tiran piedras con hondas desde la empalizada, sin correr peligro.
- **Puestos:** con E sobre un vecino, «Quedate acá, en tu puesto»: lo traés, caminás hasta el lugar y queda ahí (también Ramón y Josefina). Sin puesto marcado, cada
  uno se para en el de su oficio. Se guarda en la partida.
- **Campana de alarma:** mirándola, E: suena el tañido, los aliados corren a sus puestos y el perro va al portón.
- **Lo roto se ve:** tres estados (sana, dañada con menos del 70 % de vida, rota con menos del 35 %) con marcas de garras, tablas torcidas y caídas, un hueco y
  astillas; el portón se inclina hasta 5,7°. Al reparar vuelve a lo normal.
- **Pasadizo de escape:** dos bocas a 9 m (una tapa adentro de la base y un tronco hueco afuera); con E salís por la otra y tenés 2,6 s sin que te peguen. Los
  duendes no lo ven ni lo usan.
- **Trampa de miel:** pega al duende 3 o 4 s, quieto y sin atacar (los brutos la mitad; el jefe y los voladores, nunca); aguanta 5 y se seca; la miel sale del
  cofre del alba (1 frasco las noches impares, 2 desde la séptima).
- **Farol de mano:** los viejos oscuros no se acercan a menos de 5,5 m, pero los tiradores te ven 1,45 veces más lejos; la lluvia fuerte lo apaga.
- **Pala de brasas:** se carga junto a un fogón; tira 9 brasas en abanico que espantan 2,4 s, hacen 6 de daño de fuego, prenden la miel y hacen estallar los
  barriles de resina. También usa los fuegos de Herminia.
- **Pedidos de la aldea de día:** 19 pedidos con su voz (Anselmo 5, Herminia 6, Martín 4, los chicos 4): uno por vecino y por día, hasta las 20:30, sin castigo
  si vencen. Cumplir sube su ayuda (el primero de 0 a 1, el segundo de 1 a 2); el costo crece con la noche (×1 a ×2,2).
- **Preparar la noche:** en el tablón de la base (E) se abre el cuaderno en «La aldea»: la noche que viene, quién te ayuda y los pedidos con *Entregar*. El
  pronóstico (tipo de noche y lado de entrada) coincide con lo que después pasa: la radio da el tipo desde la mañana, el perro el lado desde las 15, la estación
  esta noche y la de mañana; el mapa marca «Por acá entrarían los duendes». Desde ahí se coloca la trampa de miel.

## Decisiones de la junta
- Los vecinos leen el nivel **real** de la aldea (`nivelAyuda` de `desafio-aldea.js`): **sin pedidos cumplidos nadie ayuda**; el primero los sube a 1 y el
  segundo a 2 (diseño de «días»; «aliados» traía un respaldo provisorio de 1 para todos).
- La pala de brasas usa también los fuegos que prende Herminia (`api.fuegos` suma `vecinos.fuegosPrendidos()`).
- «Anselmo, el carpintero» pasó a «el herrero» (en el juego Anselmo es el herrero).
- Las partidas reales de aliados fijan el nivel de ayuda tocando sólo `D.aldea.ayuda` (el sistema de pedidos espera el estado completo).

## Verificación
- `npm run verify` de corrido: **277 pasos OK** (4.8.1: 274 + aliados 329, defensas 2.420 y días 10.014 comprobaciones).
- Partidas reales (ocultas, de a una, en el monitor externo): `humo-4-9-aliados` (53), `humo-4-9-defensas`, `humo-4-9-dias` (34), `humo-4-8-1-sin-naves`,
  `humo-4-8-noches`, `humo-4-8-ataques` y `humo-3-0-asedio` OK; `humo-3-5-1-desafio` falló una vez por tiempo («queda uno colgado en la cola») y pasó dos veces sola.
- Mutaciones a propósito: 31 reglas de aliados, 42 de defensas y 40 de días: todas hacen fallar sus pruebas.
- Rendimiento (notebook, antes/después): 209 dibujos antes y después de noche común; los cuatro cuerpos de los vecinos suman unos +28 dibujos sólo cuando se
  los mira; `vecinos.actualizar` 0,003 a 0,006 ms por cuadro; sin shaders ni luces nuevas.

## Pendiente
- **Sin escuchar:** el tañido de la campana, el martillo de Anselmo, las piedras de los chicos, las brasas y el tintineo de la miel.
- **Sin jugar:** el equilibrio (cuánto cuestan los pedidos, 5 usos de la miel, 5,5 m del farol, las curas), una noche entera con todo a la vez y con la trochita
  andando sola; los fuegos de Herminia no se guardan (si abrís la partida a mitad de noche los vuelve a prender).
- Sin medir en la 4600G; calidades media y baja y el modo sin fin sin probar; la guía F1 y los textos nuevos están sólo en castellano (inglés al final).
- Los vecinos aliados no se ven bien de noche a la luz de los fuegos (siluetas oscuras: no hay luz real, para no sumar luces).
