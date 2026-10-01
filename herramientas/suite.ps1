# 3.3: lo mismo que suite.sh, para la PC que no tiene Git Bash. Corre las pruebas de humo
# (Electron) de a UNA —comparten el localStorage del perfil de Electron— y deja un resumen
# y la salida de cada una. Pasa --no-sandbox por línea de comandos: en esa PC, lanzado
# desde las herramientas de Claude, el renderer con sandbox no carga ninguna página.
# Uso: powershell -File herramientas\suite.ps1 <carpeta-del-proyecto> <carpeta-de-salida> [lista separada por comas]
# Sin lista corre todas (humo-partida.cjs incluida: tarda unos 11 minutos).
param([string]$proyecto = '.', [string]$salida = '..\salida-suite', [string]$lista = '')
$ErrorActionPreference = 'Continue'
Set-Location $proyecto
$out = Join-Path $salida 'humo'
New-Item -ItemType Directory -Force $out | Out-Null
$resumen = Join-Path $out 'resumen.txt'
"inicio $(Get-Date -Format HH:mm:ss)" | Out-File -Encoding utf8 $resumen
$pruebas = if ($lista) { $lista.Split(',') | ForEach-Object { Get-Item "pruebas\$($_.Trim())" } } else { Get-ChildItem pruebas\humo-*.cjs | Sort-Object Name }
foreach ($f in $pruebas) {
  $n = $f.BaseName
  $log = Join-Path $out "$n.log"
  $t0 = Get-Date
  $p = Start-Process -FilePath 'npx.cmd' -ArgumentList 'electron', '--no-sandbox', $f.FullName -NoNewWindow -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err"
  $null = $p.Handle   # en PowerShell 5.1, sin esto ExitCode queda vacío
  $termino = $p.WaitForExit(900000)
  if (-not $termino) {
    try { $p.Kill() } catch {}
    # sólo los Electron que arrancó esta prueba (la suite corre de a una)
    Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -ge $t0 } | Stop-Process -Force -ErrorAction SilentlyContinue
    'TIEMPO AGOTADO (15 min)' | Out-File -Append -Encoding utf8 $log
  }
  $codigo = if ($termino) { $p.ExitCode } else { 124 }
  $texto = Get-Content $log -Encoding utf8 -ErrorAction SilentlyContinue
  $mal = @($texto | Where-Object { $_ -cmatch '^ERRORES:' }).Count
  $bien = @($texto | Where-Object { $_ -match '^✓' }).Count
  $fallas = @($texto | Where-Object { $_ -match '^✗' }).Count
  $estado = if ($codigo -eq 0 -and $mal -eq 0) { 'OK' } else { 'FALLA' }
  "$estado $n · salida $codigo · ✓$bien ✗$fallas · $([int]((Get-Date) - $t0).TotalSeconds)s" | Out-File -Append -Encoding utf8 $resumen
}
'FIN' | Out-File -Append -Encoding utf8 $resumen
Get-Content $resumen -Encoding utf8 | Where-Object { $_ -notmatch '^OK' }
"OK: $(@(Get-Content $resumen -Encoding utf8 | Where-Object { $_ -match '^OK' }).Count)"
