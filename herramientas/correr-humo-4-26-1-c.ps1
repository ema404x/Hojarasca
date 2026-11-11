# 4.26.1 (C): corre pruebas\humo-4-26-1-c.cjs (partida real de Electron) con el candado de Electron tomado SÓLO durante la corrida.
# Uso (desde la carpeta del proyecto, después de `node armar.mjs`): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-1-c.ps1 [-Partes campana,pedidos] [-Html C:\otra\index.html] [-Salida C:\carpeta]
param([string]$Partes = '', [string]$Html = '', [string]$Salida = '')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $b = [Text.Encoding]::UTF8.GetBytes('C 4.26.1 humo'); $f.Write($b, 0, $b.Length); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  if ($Partes) { $env:HUMO_PARTES = $Partes } else { Remove-Item Env:HUMO_PARTES -ErrorAction SilentlyContinue }
  if ($Html) { $env:HTML = $Html } else { Remove-Item Env:HTML -ErrorAction SilentlyContinue }
  if ($Salida) { $env:HUMO_SALIDA = $Salida } else { Remove-Item Env:HUMO_SALIDA -ErrorAction SilentlyContinue }
  $perfil = Join-Path $env:TEMP 'hx\perfil-4261-c'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'pruebas\humo-4-26-1-c.cjs' -Visible -Espera 870 -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
