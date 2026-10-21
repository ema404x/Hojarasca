---
name: hojarasca-medir
description: Cómo medir el rendimiento de Hojarasca (fps, ms por cuadro, dibujos, tirones) según en qué PC se esté, y comparar antes/después de un cambio. Usala cuando haya que medir, cuando un cambio pueda pesar (geometría, luces, vegetación, gente) o al cerrar una versión.
---

# Medir el rendimiento de Hojarasca

## 1. ¿En qué PC estoy?
```powershell
(Get-CimInstance Win32_Processor).Name
```
- **Ryzen 5 4600G** (escritorio del usuario, monitor externo a 120 Hz): es la PC de referencia. Sus números son los que cuentan.
- **Ryzen 7 7730U** (notebook): los ms **no** son los de la 4600G. Sirve sólo para comparar antes/después en la misma máquina.
- Otra: igual que la notebook.

## 2. Lo que se mide igual en cualquier PC (hacerlo siempre)
No depende de la máquina y es lo que más avisa si algo va a pesar:
- **Dibujos y triángulos por cuadro**: `npm run diag:dibujo` (de dónde sale cada dibujo) y las columnas de dibujos/triángulos de `medir-vistas.cjs`.
- **Luces**: no pasar de 4+1 fijas (F3 muestra el «máx»).
- **Compilaciones de shaders a mitad de juego**: tienen que ser 0 (`medir-caminata.cjs` cuenta los programas nuevos por cuadro).
- **Repaso de matrices**: `npm run diag:matrices`.

## 3. Antes / después en la misma máquina
1. Armá la versión anterior en una carpeta temporal (`git worktree add <tmp> <rama-o-etiqueta-anterior>` + unión a `node_modules`, y `node armar.mjs` ahí).
2. En cada carpeta, con perfil propio y oculto (ver la skill `hojarasca-partidas`):
   ```
   HTML=<index.html> SALIDA=<a.json> CALIDAD=alta MODO=relax npx electron herramientas/medir-vistas.cjs --user-data-dir=<carpeta propia>
   ```
   (vistas fijas del valle: CPU + placa por cuadro con `gl.finish()`, sin vsync; `VISTAS=a,b` para elegir, `MODO=desafio` para la noche).
3. Si el cambio toca la caminata (vegetación, bloques, gente que se arma al acercarte): `herramientas/medir-caminata.cjs` en las dos versiones (`SALIDA=<a.json>`) y comparar sus tablas: p50, p95 y cuántos cuadros pasan de 16,7 ms por recorrido. (El encabezado nombra un `comparar-caminata.cjs` que no existe: comparar los json con un script propio en la carpeta temporal.) **Necesita la ventana visible** (una oculta no corre `requestAnimationFrame`): pedirle permiso al usuario antes, en el monitor externo.
4. Correr cada medición **2 o 3 veces alternando** versiones (A, B, A, B): la PC cargada mueve los números. Informar mediana (p50) y p95, no un solo valor.
5. Regla: si el después empeora más de ~1 ms en la plaza o en la aldea (que andan justas: ~15 ms de 16,7), avisar antes de seguir.

## 4. En la 4600G (la medición que cuenta)
- `npm run medir:caminata` con `REPETIR=3` y ventana visible (en el monitor externo) y `medir-vistas.cjs` en calidad alta.
- Anotar los números en `CAMBIOS_<ver>.md` como referencia, comparados con la versión anterior.

## 5. Si no estoy en la 4600G
- Hacer 2 y 3 en la notebook (empeoramientos se atrapan igual).
- Anotar en `SEGUIR-EN-OTRA-PC.md` y en `CAMBIOS_<ver>.md`: «**falta medir en la 4600G**», con el comando exacto y qué comparar.
- Nunca presentar ms de la notebook como «los fps del juego».
