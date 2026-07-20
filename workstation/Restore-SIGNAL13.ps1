<#
SIGNAL13 Workstation Development Restore
Restores services stopped by the latest Optimize-SIGNAL13.ps1 run.
GUI applications are not force-opened; the script reports what should be
opened manually if needed.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$ManifestPath
)

$ErrorActionPreference = "Continue"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogRoot = Join-Path $ScriptRoot "logs"
if (-not (Test-Path -LiteralPath $LogRoot)) {
    New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$TranscriptPath = Join-Path $LogRoot "restore-$Timestamp.log"
$TranscriptStarted = $false

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path $LogRoot "latest-optimize.json"
}

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-MemorySnapshot {
    try {
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
        $totalMb = [math]::Round($os.TotalVisibleMemorySize / 1024, 1)
        $freeMb = [math]::Round($os.FreePhysicalMemory / 1024, 1)
        return [PSCustomObject]@{
            Available = $true
            Source = "CIM Win32_OperatingSystem"
            TotalMB = $totalMb
            FreeMB = $freeMb
            UsedMB = [math]::Round($totalMb - $freeMb, 1)
        }
    } catch {
    }

    try {
        Add-Type -AssemblyName Microsoft.VisualBasic -ErrorAction Stop
        $computerInfo = New-Object Microsoft.VisualBasic.Devices.ComputerInfo
        $totalMb = [math]::Round($computerInfo.TotalPhysicalMemory / 1MB, 1)
        $freeMb = [math]::Round($computerInfo.AvailablePhysicalMemory / 1MB, 1)
        return [PSCustomObject]@{
            Available = $true
            Source = ".NET Microsoft.VisualBasic.Devices.ComputerInfo"
            TotalMB = $totalMb
            FreeMB = $freeMb
            UsedMB = [math]::Round($totalMb - $freeMb, 1)
        }
    } catch {
    }

    [PSCustomObject]@{
        Available = $false
        Source = "Unavailable"
        TotalMB = $null
        FreeMB = $null
        UsedMB = $null
    }
}

function Format-MemorySnapshot {
    param([Parameter(Mandatory)]$Snapshot)

    if ($Snapshot.Available) {
        return "Used $($Snapshot.UsedMB) MB / Free $($Snapshot.FreeMB) MB (source: $($Snapshot.Source))"
    }

    return "RAM tidak dapat dibaca"
}

try {
    Start-Transcript -Path $TranscriptPath -Force | Out-Null
    $TranscriptStarted = $true

    Write-Host "SIGNAL13 Development Mode - Restore" -ForegroundColor Cyan

    if (-not (Test-Path -LiteralPath $ManifestPath)) {
        Write-Warning "Manifest backup tidak ditemukan: $ManifestPath"
        Write-Warning "Tidak ada service yang direstore. Buka aplikasi GUI manual jika diperlukan."
        return
    }

    $isAdmin = Test-IsAdministrator
    if (-not $isAdmin) {
        throw "Restore wajib dijalankan sebagai Administrator agar service bisa dipulihkan dengan benar."
    }

    $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
    $memoryBefore = Get-MemorySnapshot
    $restoredServices = @()
    $failedServices = @()

    foreach ($serviceInfo in @($manifest.StoppedServices)) {
        if ($serviceInfo.Status -ne "Running") {
            continue
        }

        $service = Get-Service -Name $serviceInfo.Name -ErrorAction SilentlyContinue
        if (-not $service) {
            $failedServices += [PSCustomObject]@{
                Name = $serviceInfo.Name
                DisplayName = $serviceInfo.DisplayName
                Error = "Service tidak ditemukan."
            }
            continue
        }

        if ($service.Status -eq "Running") {
            $restoredServices += [PSCustomObject]@{
                Name = $service.Name
                DisplayName = $service.DisplayName
                Status = "AlreadyRunning"
            }
            continue
        }

        try {
            if ($PSCmdlet.ShouldProcess($service.DisplayName, "Start service")) {
                Start-Service -Name $service.Name -ErrorAction Stop
                $restoredServices += [PSCustomObject]@{
                    Name = $service.Name
                    DisplayName = $service.DisplayName
                    Status = "Started"
                }
            }
        } catch {
            $failedServices += [PSCustomObject]@{
                Name = $service.Name
                DisplayName = $service.DisplayName
                Error = $_.Exception.Message
            }
            Write-Warning "Gagal start service $($service.DisplayName): $($_.Exception.Message)"
        }
    }

    Start-Sleep -Seconds 1
    $memoryAfter = Get-MemorySnapshot

    $restoreResultPath = Join-Path $LogRoot "restore-$Timestamp.json"
    $result = [PSCustomObject]@{
        Tool = "SIGNAL13 Workstation Module"
        Action = "Restore"
        Timestamp = $Timestamp
        ManifestUsed = $ManifestPath
        IsAdministrator = $isAdmin
        MemoryBefore = $memoryBefore
        MemoryAfter = $memoryAfter
        RestoredServices = $restoredServices
        FailedServices = $failedServices
        ManualRestartApplications = $manifest.ManualRestartApplications
    }

    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $restoreResultPath -Encoding UTF8

    Write-Host ""
    Write-Host "Ringkasan Restore SIGNAL13" -ForegroundColor Green
    Write-Host ("Service dipulihkan : {0}" -f $restoredServices.Count)
    Write-Host ("Service gagal      : {0}" -f $failedServices.Count)
    Write-Host ("RAM saat restore   : {0}" -f (Format-MemorySnapshot -Snapshot $memoryAfter))
    Write-Host ("Result log         : {0}" -f $restoreResultPath)
    Write-Host ""
    Write-Host "Aplikasi GUI berikut tidak dibuka otomatis. Buka manual jika diperlukan:"
    foreach ($app in @($manifest.ManualRestartApplications)) {
        Write-Host ("- {0}" -f $app)
    }
} finally {
    if ($TranscriptStarted) {
        Stop-Transcript | Out-Null
    }
}
