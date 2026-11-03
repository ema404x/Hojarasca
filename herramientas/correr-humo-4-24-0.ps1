# 4.24.0 (C): corre una prueba de humo de partida real (pruebas\humo-*.cjs) tomando el candado de Electron por corrida y soltándolo al terminar.
# Siempre en el monitor externo (lanzar-electron.ps1 -Visible), con perfil propio. Si el candado está ocupado espera (y lo rompe si tiene más de 25 minutos).
# Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-24-0.ps1 -Script pruebas\humo-partida.cjs [-Espera 2700] [-Etiqueta humo]
param([string]$Script, [int]$Espera = 900, [string]$Etiqueta = 'humo', [string]$Perfil = '')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $raiz
$lock = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $lock) | Out-Null
if (-not $Perfil) { $Perfil = Join-Path $env:TEMP 'hx\perfil-humo-4240' }
$tomado = $false
for ($i = 0; $i -lt 400 -and -not $tomado; $i++) {
  try { $f = [IO.File]::Open($lock, [IO.FileMode]::CreateNew); $b = [Text.Encoding]::UTF8.GetBytes("C 4.24.0 $Etiqueta"); $f.Write($b, 0, $b.Length); $f.Close(); $tomado = $true }
  catch { try { if (((Get-Date) - (Get-Item $lock).LastWriteTime).TotalMinutes -gt 25) { Remove-Item $lock -Force -ErrorAction SilentlyContinue } } catch {}; Start-Sleep -Seconds 5 }
}
if (-not $tomado) { 'LOCK OCUPADO: ' + (Get-Content $lock); exit 3 }
try {
  powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script $Script -Espera $Espera -Perfil $Perfil -Visible
} finally { Remove-Item $lock -ErrorAction SilentlyContinue; 'lock suelto' }
