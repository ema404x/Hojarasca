# Hojarasca 4.17.0 — Historia nueva, acto III: la Historia completa

Ramas v4170-a (mecánica y noche), v4170-b (guiones) y v4170-c (pulido de los actos I y II), juntadas. Detalle en CAMBIOS_4_17_0_A.md, _B.md y _C.md.

- Capítulos 9 a 13 completos (los primeros fríos, trato o pelea, el arco y la honda, la noche de la nevada, el deshielo): 56 escenas, decisiones D5 (majada) y D6 (trato o pelea), dos finales con variantes, epílogo, créditos y la costumbre del trato. La Historia queda completa de punta a punta (13 capítulos).
- La noche de la nevada reemplaza la de la 4.13.0: tres olas, jefe con lomo débil, defensas prestadas por los vecinos, aliados (perro, Ramón, Josefina, Fermín con honda), ayudas de los duendes en el trato, Otra vez y Que amanezca, variante Viejo. Blancos de práctica, arreo de la majada, helada y nevada forzadas (tope de 2 días), Ramón convaleciente, escena sugerida de la pareja sólo con el amor prendido.
- Pulido de los actos I y II: 58 escenas vistas a ojo, cámara dirigida que no se mete en troncos ni muros, colocación del jugador, invitados, props nuevos (foto movida, llavecita, cantos blancos, mulas, fogón), 14 lugares nuevos, disparadores que faltaban.
- Rendimiento: el programa de profundidad de las instanciadas sin color se compila en la carga (110 a 111 de base, 0 compilaciones a mitad de juego).
- Se retiró verificar-4-13-0-historia-b y su humo (probaban la noche vieja).
- Verificación: npm run verify de corrido; pruebas nuevas de A (237), B (22830), C (71718); humos de partida real de los tres actos y del pulido en orden (con tiempos mayores: -Espera 1800 y 2400).

## Sin ver / pendiente
- De 56 escenas del acto III sólo 4 se vieron a ojo (galpon-encuentro, noche-espera, noche-tras-ganar, umbral-fin); las variantes de pareja y del final B no.
- Sin hacer: Ramón sentado con manta junto a la estufa, Fermín en el techo, faroles de la loma y lucecitas de las raíces; sin disparador: galpon-sin-golpear, cumple-nevada, plumas-gallinero, costumbre-dejar y costumbre-regalito.
- Al llegar de noche a tu galponcito el conteo de programas llegó a subir de 111 a 113 en la corrida larga de A (la de C lo dejó en 111 en Media): revisar en la 4600G.
- Balance de la pelea (daño de los duendes bajado de x0,55 a x0,4 por criterio) sin juzgar por una persona; fps sólo en la notebook, ruido incluido.
- Pruebas de mutación de la 4.16.0 con ESM en caché (sólo la primera mutación de cada archivo mide); logros de Steam sin hacer; textos sólo en castellano.
