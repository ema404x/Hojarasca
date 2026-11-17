# 4.30.0 (A): corre un guion de Electron con el candado de Electron tomado SÓLO durante la corrida, minimizado (sin -Visible).
# Uso (desde la carpeta del proyecto):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-4-30-0-a.ps1 -Script <guion.cjs> [-Espera 900] [-Perfil <nombre>]
# Las variables de entorno del guion (AUD_*, HUMO_*...) se pasan tal cual.
param([string]$Script, [int]$Espera = 900, [string]$Perfil = 'perfil-4300-a')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 25) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  $ruta = Join-Path $env:TEMP ('hx\' + $Perfil)
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script $Script -Espera $Espera -Perfil $ruta
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
