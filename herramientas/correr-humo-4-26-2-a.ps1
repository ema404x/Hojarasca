# 4.26.2 (B): corre pruebas\humo-4-26-2-a.cjs (partida real de Electron) con el candado de Electron tomado SÓLO durante la corrida.
# Uso (desde la carpeta del proyecto): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-26-2-a.ps1 [-Secciones elsa,camara] [-Horas 8,14,19.5] [-Salida <carpeta>] [-Html <otro index.html>]
#   -Html: otra versión armada (la 4.26.0, para el antes); las capturas y los .json salen con «base-» adelante
param([string]$Secciones = '', [string]$Horas = '', [string]$Salida = '', [string]$Html = '')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); Set-Content -Path $candado -Value "A 4.26.2 humo-4-26-2-a $Secciones" -Encoding ascii; break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  if ($Secciones) { $env:HUMO_SECCIONES = $Secciones } else { Remove-Item Env:HUMO_SECCIONES -ErrorAction SilentlyContinue }
  if ($Horas) { $env:HUMO_HORAS = $Horas } else { Remove-Item Env:HUMO_HORAS -ErrorAction SilentlyContinue }
  if ($Salida) { $env:HUMO_SALIDA = $Salida } else { Remove-Item Env:HUMO_SALIDA -ErrorAction SilentlyContinue }
  if ($Html) { $env:HTML = $Html } else { Remove-Item Env:HTML -ErrorAction SilentlyContinue }
  $perfil = Join-Path $env:TEMP 'hx\perfil-4262-a'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'pruebas\humo-4-26-2-a.cjs' -Visible -Espera 2700 -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
