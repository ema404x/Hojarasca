# 4.23.0 (B): corre pruebas\humo-4-23-0-b.cjs (partida real de Electron) con el candado de Electron tomado SÓLO durante la corrida.
# Uso (desde la carpeta del proyecto): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\correr-humo-4-23-0-b.ps1
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  $perfil = Join-Path $env:TEMP 'hx\perfil-4230-b'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'pruebas\humo-4-23-0-b.cjs' -Visible -Espera 2700 -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
