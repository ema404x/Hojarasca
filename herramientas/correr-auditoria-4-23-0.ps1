# 4.23.0 (C): corre la auditoría visual (herramientas\auditoria-visual-4-20-0.cjs) tomando el candado de Electron por corrida y soltándolo al terminar.
# Si el candado está ocupado espera (y lo rompe si tiene más de 25 minutos). Siempre en el monitor externo, con ventana visible y perfil propio.
# Uso (desde la carpeta del proyecto, después de `node armar.mjs`):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-auditoria-4-23-0.ps1 -Salida C:\carpeta -Solo 05-plaza-dia,17-edificios-casas-dia [-Pagina C:\otro\index.html] [-Tomas herramientas\auditoria-visual-4-23-0.json] [-Medir 0] [-MuestraMs 6000] [-LibreMs 6000]
# -Medir 0 saca sólo las capturas (con la herramienta de medición instalada las capturas salen negras). -Pagina compara otra versión armada (por ejemplo la 4.21.0).
param([string]$Grupo = 'verano', [string]$Solo = '', [string]$Salida, [string]$Etiqueta = 'auditoria', [string]$Pagina = '', [string]$Tomas = '', [string]$Medir = '1', [string]$MuestraMs = '4000', [string]$LibreMs = '3000', [string]$Lluvia = '0', [string]$Clima = 'despejado', [int]$Espera = 900, [string]$Perfil = '', [string]$PerfilMs = '0', [string]$Eval = '')
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $raiz
$lock = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $lock) | Out-Null
if (-not $Perfil) { $Perfil = Join-Path $env:TEMP 'hx\perfil-auditoria-4230' }
$tomado = $false
for ($i = 0; $i -lt 400 -and -not $tomado; $i++) {
  try { $f = [IO.File]::Open($lock, [IO.FileMode]::CreateNew); $b = [Text.Encoding]::UTF8.GetBytes("C 4.23.0 $Etiqueta"); $f.Write($b, 0, $b.Length); $f.Close(); $tomado = $true }
  catch { try { if (((Get-Date) - (Get-Item $lock).LastWriteTime).TotalMinutes -gt 25) { Remove-Item $lock -Force -ErrorAction SilentlyContinue } } catch {}; Start-Sleep -Seconds 5 }
}
if (-not $tomado) { 'LOCK OCUPADO: ' + (Get-Content $lock); exit 3 }
try {
  $env:AUD_SALIDA = $Salida; $env:AUD_GRUPO = $Grupo; $env:AUD_SOLO = $Solo; $env:AUD_MEDIR = $Medir; $env:AUD_CLIMA = $Clima; $env:AUD_LLUVIA = $Lluvia
  $env:AUD_CAPAS = '0'; $env:AUD_PERFIL_MS = $PerfilMs; if ($Eval) { $env:AUD_EVAL = $Eval } else { Remove-Item Env:AUD_EVAL -ErrorAction SilentlyContinue }; $env:AUD_MUESTRA_MS = $MuestraMs; $env:AUD_LIBRE_MS = $LibreMs
  if ($Pagina) { $env:AUD_PAGINA = $Pagina } else { Remove-Item Env:\AUD_PAGINA -ErrorAction SilentlyContinue }
  if ($Tomas) { $env:AUD_TOMAS = $Tomas } else { Remove-Item Env:\AUD_TOMAS -ErrorAction SilentlyContinue }
  powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script herramientas\auditoria-visual-4-20-0.cjs -Espera $Espera -Perfil $Perfil -Visible
} finally { Remove-Item $lock -ErrorAction SilentlyContinue; 'lock suelto' }
