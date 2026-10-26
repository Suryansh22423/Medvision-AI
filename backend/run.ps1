# MedVision AI backend launcher — frees port 8000 if already in use, then starts Uvicorn.
param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

function Stop-PortListener {
    param([int]$TargetPort)

    $lines = netstat -ano | Select-String ":$TargetPort\s"
    $pids = @()

    foreach ($line in $lines) {
        if ($line -match "\s+(\d+)\s*$") {
            $pid = [int]$matches[1]
            if ($pid -gt 0) {
                $pids += $pid
            }
        }
    }

    foreach ($pid in ($pids | Select-Object -Unique)) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping process $($proc.ProcessName) (PID $pid) using port $TargetPort..."
                Stop-Process -Id $pid -Force -ErrorAction Stop
            }
        } catch {
            Write-Warning "Could not stop PID ${pid}: $_"
        }
    }

    if ($pids.Count -gt 0) {
        Start-Sleep -Seconds 1
    }
}

Push-Location $PSScriptRoot

if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Error "Virtual environment not found. Run: python -m venv venv"
}

Write-Host "Starting MedVision AI backend on http://localhost:$Port"
Stop-PortListener -TargetPort $Port

& ".\venv\Scripts\Activate.ps1"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port $Port

Pop-Location
