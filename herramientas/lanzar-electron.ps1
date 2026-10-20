# 3.9.0: lanza una prueba o captura de Electron SIEMPRE en el monitor externo y con perfil propio (rutas absolutas: `-r herramientas\...` relativo no arranca en
# esta PC), espera a que termine (o la mata a los `-Espera` segundos) y muestra lo que imprimió.
# Uso (desde la carpeta del proyecto): powershell -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-3-9-0-cantina.cjs [-Espera 840] [-Perfil C:\carpeta]
param([string]$Script, [string]$Perfil = '', [int]$Espera = 600, [string]$Arg1 = '', [switch]$Visible)
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $raiz
if (-not $Perfil) { $Perfil = Join-Path $env:TEMP 'hojarasca-perfil-lanzar' }
$env:HOJ_PERFIL = $Perfil
# 4.3.1: por defecto OCULTO (nada en pantalla, sin foco); -Visible lo muestra (discreto) en el monitor externo
if ($Visible) { $env:HUMO_OCULTO = '0' } else { $env:HUMO_OCULTO = '1' }
$log = Join-Path $env:TEMP ("log-" + [IO.Path]::GetFileNameWithoutExtension($Script) + ".txt")
$args2 = @('--no-sandbox', '--mute-audio', '-r', "$raiz\herramientas\al-monitor.cjs", '-r', "$raiz\herramientas\perfil-propio.cjs", "$raiz\$Script")
if ($Arg1) { $args2 += $Arg1 }
$p = Start-Process -FilePath "$raiz\node_modules\electron\dist\electron.exe" -ArgumentList $args2 -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err"
try { $p.PriorityClass = 'BelowNormal' } catch {}   # 4.3.1: modo discreto, prioridad baja
$p.WaitForExit($Espera * 1000) | Out-Null
if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force; 'TIEMPO' }
Get-Content $log -ErrorAction SilentlyContinue
