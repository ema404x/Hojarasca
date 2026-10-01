# Corre todas las partidas reales (pruebas/humo-*.cjs) de a una y deja un resumen en
# %TEMP%\suite-humo.log y la salida de cada una en %TEMP%\humo-<nombre>.log.
# Uso (desde la raíz del proyecto):  powershell -File pruebas\suite-humo.ps1
$ErrorActionPreference = 'Continue'
$log = Join-Path $env:TEMP 'suite-humo.log'
"inicio $(Get-Date -Format HH:mm:ss)" | Out-File -Encoding utf8 $log
foreach ($f in Get-ChildItem pruebas\humo-*.cjs | Sort-Object Name) {
  $salida = Join-Path $env:TEMP ("humo-" + $f.BaseName + ".log")
  $t0 = Get-Date
  & npx.cmd electron --no-sandbox $f.FullName 2>&1 | Out-File -Encoding utf8 $salida
  $codigo = $LASTEXITCODE
  $seg = [int]((Get-Date) - $t0).TotalSeconds
  # cada partida termina con una línea «ERRORES:» si algo falló (la ✗ sale rota en el log)
  $mal = (Select-String -Path $salida -Pattern '^ERRORES:' -CaseSensitive -ErrorAction SilentlyContinue | Measure-Object).Count
  $estado = if ($codigo -eq 0 -and $mal -eq 0) { 'OK' } else { 'FALLA' }
  "$estado  $($f.Name) - salida $codigo - $seg s" | Out-File -Encoding utf8 -Append $log
  # una partida que se colgó no puede dejar ventanas abiertas para la siguiente
  Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
"fin $(Get-Date -Format HH:mm:ss)" | Out-File -Encoding utf8 -Append $log
