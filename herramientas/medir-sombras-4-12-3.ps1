# 4.12.3: corre medir-sombras-4-12-3.cjs (varias configuraciones alternadas en una misma página) con el candado de Electron tomado SÓLO durante la corrida.
# Uso (desde la carpeta del proyecto): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\medir-sombras-4-12-3.ps1 -Calidad media -Configs nada,m-base,m-sil,m-c100 -Salida C:\carpeta\m1.json [-Ciclos 10] [-Vistas ladera,plaza-ocaso] [-Pagina C:\otro\index.html]
param([string]$Calidad = 'media', [string]$Configs = 'm-base,m-sil', [string]$Salida, [string]$Ciclos = '10', [string]$Vistas = '', [string]$Pagina = '')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
if (-not $Pagina) { $Pagina = Join-Path $raiz 'index.html' }
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  $env:HOJ_HTML = $Pagina; $env:HOJ_SALIDA = $Salida; $env:HOJ_CALIDAD = $Calidad; $env:HOJ_CONFIGS = $Configs; $env:HOJ_VISTAS = $Vistas; $env:HOJ_CICLOS = $Ciclos
  $perfil = Join-Path $env:TEMP 'hx\perfil4123-medir'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'herramientas\medir-sombras-4-12-3.cjs' -Visible -Espera 900 -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
