param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$orientaRoot = Split-Path $PSScriptRoot -Parent
$orientaPython = Join-Path $orientaRoot 'backend\.venv\Scripts\python.exe'
$orientaNode = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $orientaPython)) { throw 'Falta el entorno backend. Ejecuta uv sync --frozen desde backend.' }
if (-not (Test-Path -LiteralPath (Join-Path $orientaRoot 'frontend\node_modules\vite\bin\vite.js'))) { throw 'Faltan dependencias frontend. Ejecuta npm ci desde frontend.' }
if (-not (Test-Path -LiteralPath (Join-Path $orientaRoot '.env'))) { throw 'Copia .env.example a .env y completa las variables locales.' }
foreach ($orientaPort in 8000,5173) {
    $orientaConnection = Get-NetTCPConnection -State Listen -LocalPort $orientaPort -ErrorAction SilentlyContinue
    if ($orientaConnection) { Write-Output "El puerto $orientaPort ya está en uso; se conserva su proceso."; continue }
    if ($orientaPort -eq 8000) {
        Start-Process -FilePath $orientaPython -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory (Join-Path $orientaRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $orientaRoot 'backend\local-backend.log') -RedirectStandardError (Join-Path $orientaRoot 'backend\local-backend-error.log') | Out-Null
    } else {
        Start-Process -FilePath $orientaNode -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort' -WorkingDirectory (Join-Path $orientaRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $orientaRoot 'frontend\local-frontend.log') -RedirectStandardError (Join-Path $orientaRoot 'frontend\local-frontend-error.log') | Out-Null
    }
}
$orientaReady = $false
for ($orientaAttempt=0; $orientaAttempt -lt 20; $orientaAttempt++) {
    try {
        $orientaApi = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2
        $orientaUi = Invoke-WebRequest 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2
        if ($orientaApi.service -eq 'orienta-api' -and $orientaUi.StatusCode -eq 200 -and $orientaUi.Content -match '<title>ORIENTA') { $orientaReady=$true; break }
    } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $orientaReady) { throw 'No se pudo confirmar el inicio. Revisa los logs locales de frontend/backend.' }
Write-Output 'ORIENTA: http://127.0.0.1:5173 · API: http://127.0.0.1:8000/docs'
if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:5173' -WindowStyle Hidden }
