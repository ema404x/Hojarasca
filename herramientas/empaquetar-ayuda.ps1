# 4.11.3 (M11): qué hacer con un Hojarasca.exe abierto antes de empaquetar (lo usa empaquetar.ps1; está aparte para poder probarlo sin armar nada).
# Antes se mataba sin preguntar: si el usuario estaba jugando, perdía lo que no se había guardado.
#   · con -Forzar se cierra sin preguntar (para correrlo desde un script);
#   · con consola interactiva se pregunta (s/N) y, si no, se cancela;
#   · sin consola interactiva (entrada redirigida o -NonInteractive) NO se mata nada: se avisa y se falla claro.

function Test-HayConsola {
  return (-not [Console]::IsInputRedirected) -and (-not ([Environment]::GetCommandLineArgs() -contains '-NonInteractive'))
}

# 'nada' | 'cerrar' | 'preguntar' | 'fallar'
function Get-DecisionCierre {
  param([int]$Abiertos, [bool]$Forzar, [bool]$HayConsola)
  if ($Abiertos -le 0) { return 'nada' }
  if ($Forzar) { return 'cerrar' }
  if ($HayConsola) { return 'preguntar' }
  return 'fallar'
}

# Devuelve lo que decidió ('nada', 'cerrar'); tira un error claro si hay que parar. Con -EnSeco decide y no cierra nada.
function Invoke-CierreHojarasca {
  param([string]$Nombre = 'Hojarasca', [switch]$Forzar, [switch]$EnSeco, [scriptblock]$Preguntar = { param($texto) Read-Host $texto }, $HayConsola = $null)
  $abiertos = @(Get-Process -Name $Nombre -ErrorAction SilentlyContinue)
  $consola = if ($null -ne $HayConsola) { [bool]$HayConsola } else { Test-HayConsola }
  $decision = Get-DecisionCierre -Abiertos $abiertos.Count -Forzar ([bool]$Forzar) -HayConsola $consola
  $ids = ($abiertos | ForEach-Object { $_.Id }) -join ', '
  switch ($decision) {
    'cerrar' {
      if (-not $EnSeco) { $abiertos | Stop-Process -Force -ErrorAction SilentlyContinue }
    }
    'preguntar' {
      $r = & $Preguntar "Hay $($abiertos.Count) $Nombre.exe abierto (PID $ids). Si lo cierro se pierde lo que no se haya guardado. ¿Lo cierro? (s/N)"
      if ("$r".Trim() -notmatch '^(s|si|sí)$') { throw "Cancelado: $Nombre.exe sigue abierto (PID $ids). Cerralo vos o corré de nuevo con -Forzar." }
      if (-not $EnSeco) { $abiertos | Stop-Process -Force -ErrorAction SilentlyContinue }
      $decision = 'cerrar'
    }
    'fallar' {
      throw "Hay un $Nombre.exe abierto (PID $ids) y no hay consola interactiva para preguntar: no lo cierro. Cerralo vos o corré con -Forzar."
    }
  }
  return $decision
}
