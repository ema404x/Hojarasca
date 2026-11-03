# 4.25.0 (A): corre un guion de Electron (por defecto pruebas\humo-4-25-0-a.cjs) con el candado de Electron tomado SÓLO durante la corrida.
# Uso (desde la carpeta del proyecto):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-25-0-a.ps1 [-Script pruebas\humo-4-25-0-a.cjs] [-Espera 2700] [-Perfil <nombre>]
# Las variables de entorno del guion (LARGO_MINUTOS, LARGO_SEMILLA, HUMO_SECCIONES...) se pasan tal cual.
param([string]$Script = 'pruebas\humo-4-25-0-a.cjs', [int]$Espera = 2700, [string]$Perfil = 'perfil-4250-a')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  $ruta = Join-Path $env:TEMP ('hx\' + $Perfil)
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script $Script -Visible -Espera $Espera -Perfil $ruta
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
