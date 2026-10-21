---
name: hojarasca-planificar
description: Cómo llevar una charla de planificación de Hojarasca (versiones nuevas, mejoras de un modo, ideas) sin ejecutar nada y dejándola escrita. Usala cuando el usuario diga «planifiquemos», «estamos planificando», «seguimos planificando» o pida ideas.
---

# Planificar en Hojarasca

## Regla de oro
Mientras se planifica **no se ejecuta nada**: ni agentes, ni ramas, ni código. Una respuesta a una pregunta de plan es una decisión, no una orden. Se arranca sólo con una orden explícita («arrancá», «dale», «avanzá», «hacelo»). Ante la duda, preguntá con una sola pregunta si arrancás.

## Antes de preguntar
1. Leé el plan que ya exista (`PLAN_*.md`, `DECISIONES_*.md`) y el bloque de arriba de `SEGUIR-EN-OTRA-PC.md`: no vuelvas a preguntar lo ya decidido.
2. Mirá en el código qué existe ya (para no proponer algo hecho, y para proponer construir sobre lo que hay).
3. Tené a mano las ideas **rechazadas** (`CLAUDE.md` y las listas de descartes de cada plan): no las propongas otra vez.

## Cómo preguntar
- Con la herramienta de preguntas: hasta 4 por tanda, 2 a 4 opciones cada una, una línea de descripción concreta por opción (qué se ve o qué pasa en el juego), y la recomendada primera con «(Recomendado)».
- Primero el qué (áreas, problema principal), después el detalle (tipos, números). Si la respuesta es «sin preferencia», proponé vos y decilo.
- Señalá superposiciones con lo que ya existe y riesgos (rendimiento en la plaza, equilibrio de la plata), sin decidir por él.
- Si el plan crece mucho, proponé partirlo en tandas o versiones.

## Dejarlo escrito
Cuando el usuario lo pida (o al cerrar la charla, preguntando): un `PLAN_<tema>.md` en `main` (o en la versión en curso, si hay una sin cerrar) con
- lo decidido (y por quién), el orden respecto de los otros planes,
- lo **descartado** en la charla (para no volver a proponerlo),
- los puntos a cuidar sin decidir,
- lo que ya existe y lo pendiente para tener presente,
- «Plan cerrado; no ejecutar sin orden explícita».
Actualizá la línea del plan en `SEGUIR-EN-OTRA-PC.md`, commit, y push sólo si lo pide.
