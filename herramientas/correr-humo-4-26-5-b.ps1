# 4.26.5 (B): corre pruebas\humo-4-26-5-b.cjs (partida real de Electron) con el candado de Electron tomado SOLO durante la corrida.
# Uso (desde la carpeta del proyecto): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-5-b.ps1 [-Guion <guion.cjs>] [-Alta] [-Desafio] [-Espera 600]
param([string]$Guion = '', [switch]$Alta, [switch]$Desafio, [int]$Espera = 600)
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  if ($Guion) { $env:HUMO_GUION = (Resolve-Path $Guion).Path } else { Remove-Item Env:HUMO_GUION -ErrorAction SilentlyContinue }
  if ($Alta) { $env:HUMO_ALTA = '1' } else { Remove-Item Env:HUMO_ALTA -ErrorAction SilentlyContinue }
  if ($Desafio) { $env:HUMO_MODO = 'desafio' } else { Remove-Item Env:HUMO_MODO -ErrorAction SilentlyContinue }
  $perfil = Join-Path $env:TEMP 'hx\perfil-4265-b'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'pruebas\humo-4-26-5-b.cjs' -Visible -Espera $Espera -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
