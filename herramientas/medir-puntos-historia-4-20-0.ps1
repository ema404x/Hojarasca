# 4.20.0 (auditoría B): corre medir-puntos-historia-4-20-0.cjs con el candado de Electron tomado SÓLO durante la corrida (una partida corta que mira y sale).
# Uso (desde la carpeta del proyecto): powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\medir-puntos-historia-4-20-0.ps1
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$candado = Join-Path $env:TEMP 'hx\electron.lock'
New-Item -ItemType Directory -Force (Split-Path $candado) | Out-Null
while ($true) {
  if (Test-Path $candado) { if (((Get-Date) - (Get-Item $candado).LastWriteTime).TotalMinutes -gt 20) { Remove-Item $candado -Force -ErrorAction SilentlyContinue } }
  try { $f = [IO.File]::Open($candado, [IO.FileMode]::CreateNew); $f.Close(); break } catch { Start-Sleep -Milliseconds 500 }
}
try {
  $perfil = Join-Path $env:TEMP 'hx\perfil-4200-b'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $raiz 'herramientas\lanzar-electron.ps1') -Script 'herramientas\medir-puntos-historia-4-20-0.cjs' -Visible -Espera 240 -Perfil $perfil
} finally { Remove-Item $candado -Force -ErrorAction SilentlyContinue }
