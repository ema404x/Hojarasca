# 3.3: lo mismo que empaquetar.sh, para la PC que no tiene Git Bash. Arma el instalador,
# el portable, el depot de Steam y el código fuente, y deja Hojarasca-<ver>-completo.zip
# en Descargas. Además confirma que el index.html del ejecutable es el mismo que se probó.
# Uso: powershell -File herramientas\empaquetar.ps1 <carpeta-del-proyecto> <versión> <LEEME.txt>
param([string]$proyecto, [string]$ver, [string]$leeme)
$ErrorActionPreference = 'Stop'
$proy = (Resolve-Path $proyecto).Path
$leeme = (Resolve-Path $leeme).Path
$src = Split-Path $proy -Parent
$carpeta = Split-Path $proy -Leaf
$tmp = Join-Path $env:TEMP 'hojarasca-paquete'
New-Item -ItemType Directory -Force $tmp | Out-Null
Set-Location $proy
Get-Process Hojarasca -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path dist) { Remove-Item -LiteralPath dist -Recurse -Force }
$ErrorActionPreference = 'Continue'
npm run dist:win *> (Join-Path $tmp "dist-$ver.log")
$ErrorActionPreference = 'Stop'
foreach ($f in "dist\Hojarasca-$ver-Setup-x64.exe", "dist\Hojarasca-$ver-Portable-x64.exe") { if (-not (Test-Path $f)) { throw "no se armó $f (ver $tmp\dist-$ver.log)" } }
$asar = 'dist\win-unpacked\resources\app.asar'
if (-not ((npx @electron/asar list $asar) -match 'sincronia-main\.cjs')) { throw 'el asar no trae sincronia-main.cjs' }
$chk = "const a=require('@electron/asar'),fs=require('fs'),c=require('crypto');const h=x=>c.createHash('sha256').update(x).digest('hex');process.stdout.write(h(a.extractFile(process.argv[1],'index.html'))===h(fs.readFileSync(process.argv[2]))?'ASAR OK':'ASAR DISTINTO')"
$asarOk = node -e $chk $asar (Join-Path $proy 'index.html')
if ($asarOk -ne 'ASAR OK') { throw 'el index.html del ejecutable no es el que se probó' }
$tar = "$env:SystemRoot\System32\tar.exe"
$p = Join-Path $tmp "paquete-$ver"; $o = Join-Path $p "Hojarasca-$ver"
if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force }
New-Item -ItemType Directory -Force $o | Out-Null
Set-Location $src
& $tar -a -c -f (Join-Path $o "Hojarasca-$ver-codigo-fuente.zip") --exclude="$carpeta/node_modules" --exclude="$carpeta/dist" --exclude="$carpeta/pruebas/salidas" $carpeta
Set-Location (Join-Path $proy 'dist')
& $tar -a -c -f (Join-Path $o "Hojarasca-$ver-Steam-depot-win64.zip") -C win-unpacked .
Copy-Item "Hojarasca-$ver-Setup-x64.exe", "Hojarasca-$ver-Portable-x64.exe" $o
Copy-Item $leeme (Join-Path $o 'LEEME.txt')
Set-Location $p
$destino = Join-Path $env:USERPROFILE "Downloads\Hojarasca-$ver-completo.zip"
if (Test-Path $destino) { Remove-Item -LiteralPath $destino -Force }
& $tar -a -c -f $destino "Hojarasca-$ver"
Get-ChildItem $o | Select-Object Name, @{ n = 'MB'; e = { [math]::Round($_.Length / 1MB, 1) } } | Format-Table -AutoSize | Out-String
"$asarOk · LISTO $ver · $destino · $([math]::Round((Get-Item $destino).Length / 1MB)) MB"
