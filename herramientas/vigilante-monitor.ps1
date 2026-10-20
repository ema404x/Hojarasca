# Vigilante: cualquier ventana de un Electron de DESARROLLO (electron.exe, o sea las pruebas y mediciones de los agentes)
# que aparezca en la pantalla de la notebook se manda al monitor externo, sin importar como se lanzo (tambien los dialogos de error de Electron).
# NO toca el juego instalado (Hojarasca.exe), ni la app de Claude, ni ningun otro programa.
# Si no hay monitor externo, esas ventanas se ocultan en vez de quedarse en la notebook.
# Uso: powershell -NoProfile -WindowStyle Hidden -File vigilante-monitor.ps1 -CadaMs 80      Parar: Stop-Process -Id (Get-Content vigilante-monitor.pid)
param([int]$CadaMs = 250)
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Text;
public class Vig {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint flags);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  // Mueve al monitor externo toda ventana visible de esos procesos cuyo centro este dentro de la pantalla de la notebook.
  public static int Corregir(HashSet<uint> pids, int nbL, int nbT, int nbR, int nbB, bool hayExterno, int exL, int exT, int exR, int exB) {
    int movidas = 0;
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid); if (!pids.Contains(pid)) return true;
      if (!IsWindowVisible(h)) return true;
      RECT r; GetWindowRect(h, out r); int w = r.R - r.L, hh = r.B - r.T; if (w < 60 || hh < 40) return true;
      int cx = r.L + w / 2, cy = r.T + hh / 2;
      bool enNotebook = cx >= nbL && cx < nbR && cy >= nbT && cy < nbB;
      if (!enNotebook) return true;
      if (!hayExterno) { ShowWindow(h, 0); movidas++; return true; }
      int ancho = Math.Min(w, exR - exL), alto = Math.Min(hh, exB - exT);
      int x = exL + (exR - exL - ancho) / 2, y = exT + (exB - exT - alto) / 2;
      SetWindowPos(h, IntPtr.Zero, x, y, ancho, alto, 0x0004 | 0x0010); // SWP_NOZORDER | SWP_NOACTIVATE
      movidas++; return true; }, IntPtr.Zero);
    return movidas; } }
"@
Set-Content -Path (Join-Path $PSScriptRoot 'vigilante-monitor.pid') -Value $PID
$ultimoEscaneo = [DateTime]::MinValue; $prim = $null; $ext = $null
while ($true) {
  try {
    $ps = [System.Diagnostics.Process]::GetProcessesByName('electron')   # solo el Electron de desarrollo se llama electron.exe; el juego instalado es Hojarasca.exe y Claude es claude.exe
    if ($ps.Count -gt 0) {
      if (([DateTime]::Now - $ultimoEscaneo).TotalMilliseconds -gt 2000) {
        $pantallas = [System.Windows.Forms.Screen]::AllScreens
        $prim = $pantallas | Where-Object { $_.Primary } | Select-Object -First 1
        $ext = $pantallas | Where-Object { -not $_.Primary } | Select-Object -First 1
        $ultimoEscaneo = [DateTime]::Now
      }
      $pids = New-Object 'System.Collections.Generic.HashSet[uint32]'
      foreach ($p in $ps) { [void]$pids.Add([uint32]$p.Id); $p.Dispose() }
      if ($prim) {
        $nb = $prim.Bounds; $hay = [bool]$ext
        $eb = if ($ext) { $ext.WorkingArea } else { $nb }
        $n = [Vig]::Corregir($pids, $nb.Left, $nb.Top, $nb.Right, $nb.Bottom, $hay, $eb.Left, $eb.Top, $eb.Right, $eb.Bottom)
        if ($n -gt 0) { Add-Content -Path (Join-Path $PSScriptRoot 'vigilante-monitor.log') -Value ("{0} movidas {1}" -f (Get-Date -Format 'HH:mm:ss'), $n) }
      }
    }
  } catch {}
  Start-Sleep -Milliseconds $CadaMs
}
