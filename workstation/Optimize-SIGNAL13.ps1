<#
SIGNAL13 Workstation Development Optimizer
Scope: conservative, session-only cleanup for development work.

This script does not modify startup entries, scheduled tasks, pagefile,
Defender, Windows Update, network, audio, Cloudflare Tunnel, Node, Git,
VS Code, Codex, ChatGPT, Chrome, Magic Utilities, Logitech, or PowerShell.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$SkipRestorePoint,
    [switch]$Force
)

$ErrorActionPreference = "Continue"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogRoot = Join-Path $ScriptRoot "logs"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ManifestPath = Join-Path $LogRoot "optimize-$Timestamp.json"
$LatestManifestPath = Join-Path $LogRoot "latest-optimize.json"
$TranscriptPath = Join-Path $LogRoot "optimize-$Timestamp.log"
$TranscriptStarted = $false

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-MemorySnapshot {
    $warnings = @()

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
            Warning = $null
        }
    } catch {
        $warnings += "CIM gagal: $($_.Exception.Message)"
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
            Warning = ($warnings -join " | ")
        }
    } catch {
        $warnings += ".NET ComputerInfo gagal: $($_.Exception.Message)"
    }

    try {
        $counter = Get-Counter "\Memory\Available MBytes" -ErrorAction Stop
        $freeMb = [math]::Round($counter.CounterSamples[0].CookedValue, 1)
        return [PSCustomObject]@{
            Available = $false
            Source = "Get-Counter partial"
            TotalMB = $null
            FreeMB = $freeMb
            UsedMB = $null
            Warning = "RAM total tidak dapat dibaca. $($warnings -join ' | ')"
        }
    } catch {
        $warnings += "Get-Counter gagal: $($_.Exception.Message)"
    }

    [PSCustomObject]@{
        Available = $false
        Source = "Unavailable"
        TotalMB = $null
        FreeMB = $null
        UsedMB = $null
        Warning = "RAM tidak dapat dibaca. $($warnings -join ' | ')"
    }
}

function Format-MemorySnapshot {
    param([Parameter(Mandatory)]$Snapshot)

    if ($Snapshot.Available -and $null -ne $Snapshot.UsedMB -and $null -ne $Snapshot.FreeMB) {
        return "Used $($Snapshot.UsedMB) MB / Free $($Snapshot.FreeMB) MB (source: $($Snapshot.Source))"
    }

    if ($null -ne $Snapshot.FreeMB) {
        return "RAM tidak dapat dibaca lengkap; Free $($Snapshot.FreeMB) MB (source: $($Snapshot.Source))"
    }

    return "RAM tidak dapat dibaca"
}

function Get-FileMetadata {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        return [PSCustomObject]@{
            CompanyName = $null
            ProductName = $null
            FileDescription = $null
        }
    }

    try {
        $versionInfo = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($Path)
        return [PSCustomObject]@{
            CompanyName = $versionInfo.CompanyName
            ProductName = $versionInfo.ProductName
            FileDescription = $versionInfo.FileDescription
        }
    } catch {
        return [PSCustomObject]@{
            CompanyName = $null
            ProductName = $null
            FileDescription = $null
        }
    }
}

function Test-ProcessVendorMatch {
    param(
        [Parameter(Mandatory)]$Process,
        [Parameter(Mandatory)]$Target
    )

    $path = $Process.Path
    $metadata = Get-FileMetadata -Path $path
    $combined = @($path, $metadata.CompanyName, $metadata.ProductName, $metadata.FileDescription) -join " "

    $matched = $false
    if ($Target.PathPattern -and $path -match $Target.PathPattern) {
        $matched = $true
    }
    if (-not $matched -and $Target.MetadataPattern -and $combined -match $Target.MetadataPattern) {
        $matched = $true
    }

    [PSCustomObject]@{
        Matched = $matched
        Path = $path
        CompanyName = $metadata.CompanyName
        ProductName = $metadata.ProductName
        FileDescription = $metadata.FileDescription
        Validation = if ($matched) { "Vendor/path match" } else { "Skipped: vendor/path metadata tidak cocok atau tidak tersedia" }
    }
}

function Test-AutodeskAppActive {
    $activeNames = @(
        "acad", "revit", "3dsmax", "maya", "fusion360", "Inventor",
        "Civil3D", "Alias", "MotionBuilder", "Mudbox", "Navisworks"
    )
    foreach ($name in $activeNames) {
        if (Get-Process -Name $name -ErrorAction SilentlyContinue) {
            return $true
        }
    }
    return $false
}

function Test-DellCriticalActivity {
    $patterns = "Firmware|BIOS|UpdatePackage|DUP|HardwareScan|Hardware Scan|SupportAssistHardware|DellCommandUpdate"
    $processes = Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -match "Dell|SupportAssist" -and $_.ProcessName -match $patterns
    }
    return [bool]$processes
}

function Get-ValidatedProcessTargets {
    param([array]$Targets)

    $planned = @()
    $skipped = @()
    $dellCritical = Test-DellCriticalActivity

    foreach ($target in $Targets) {
        if ($target.Vendor -eq "Dell" -and $dellCritical) {
            $skipped += [PSCustomObject]@{
                ProcessName = $target.Name
                Id = $null
                Path = $null
                Reason = $target.Reason
                Validation = "Skipped: Dell firmware update atau diagnostic aktif terdeteksi."
            }
            continue
        }

        $processes = Get-Process -Name $target.Name -ErrorAction SilentlyContinue
        foreach ($process in $processes) {
            $validation = Test-ProcessVendorMatch -Process $process -Target $target
            $item = [PSCustomObject]@{
                ProcessName = $process.ProcessName
                Id = $process.Id
                Path = $validation.Path
                CompanyName = $validation.CompanyName
                ProductName = $validation.ProductName
                FileDescription = $validation.FileDescription
                WorkingSetMB = [math]::Round($process.WorkingSet64 / 1MB, 1)
                PrivateMemoryMB = [math]::Round($process.PrivateMemorySize64 / 1MB, 1)
                Vendor = $target.Vendor
                Reason = $target.Reason
                Validation = $validation.Validation
            }

            if ($validation.Matched) {
                $planned += $item
            } else {
                $skipped += $item
            }
        }
    }

    [PSCustomObject]@{
        Planned = @($planned)
        Skipped = @($skipped)
    }
}

function Get-ServicePlan {
    param([array]$Targets)

    $planned = @()
    $skipped = @()
    $autodeskActive = Test-AutodeskAppActive
    $dellCritical = Test-DellCriticalActivity

    foreach ($target in $Targets) {
        $service = Get-Service -Name $target.Name -ErrorAction SilentlyContinue
        if (-not $service) {
            continue
        }

        $item = [PSCustomObject]@{
            Name = $service.Name
            DisplayName = $service.DisplayName
            Status = $service.Status.ToString()
            StartType = $service.StartType.ToString()
            Vendor = $target.Vendor
            Reason = $target.Reason
            Validation = "Eligible"
        }

        if ($service.Status -ne "Running") {
            $item.Validation = "Skipped: service tidak sedang Running."
            $skipped += $item
            continue
        }

        if ($target.Vendor -eq "Autodesk" -and $autodeskActive) {
            $item.Validation = "Skipped: aplikasi Autodesk aktif terdeteksi."
            $skipped += $item
            continue
        }

        if ($target.Vendor -eq "Dell" -and $dellCritical) {
            $item.Validation = "Skipped: Dell firmware update atau diagnostic aktif terdeteksi."
            $skipped += $item
            continue
        }

        $planned += $item
    }

    [PSCustomObject]@{
        Planned = @($planned)
        Skipped = @($skipped)
    }
}

function Write-PlanReport {
    param(
        [array]$Processes,
        [array]$Services,
        [array]$SkippedProcesses,
        [array]$SkippedServices
    )

    Write-Host ""
    Write-Host "Dry-run / rencana tindakan" -ForegroundColor Yellow
    Write-Host ("Jumlah proses yang direncanakan dihentikan : {0}" -f $Processes.Count)
    Write-Host ("Jumlah service yang direncanakan dihentikan : {0}" -f $Services.Count)

    Write-Host ""
    Write-Host "Proses target:"
    if ($Processes.Count -eq 0) {
        Write-Host "- Tidak ada proses yang cocok."
    } else {
        $Processes | Select-Object ProcessName,Id,Path,Reason | Format-Table -AutoSize | Out-String -Width 240 | Write-Host
    }

    Write-Host "Service target:"
    if ($Services.Count -eq 0) {
        Write-Host "- Tidak ada service yang cocok."
    } else {
        $Services | Select-Object Name,DisplayName,StartType,Status,Reason | Format-Table -AutoSize | Out-String -Width 240 | Write-Host
    }

    if ($SkippedProcesses.Count -gt 0) {
        Write-Host "Proses dilewati karena validasi:"
        $SkippedProcesses | Select-Object ProcessName,Id,Path,Validation | Format-Table -AutoSize | Out-String -Width 240 | Write-Host
    }

    if ($SkippedServices.Count -gt 0) {
        Write-Host "Service dilewati karena validasi:"
        $SkippedServices | Select-Object Name,DisplayName,Status,StartType,Validation | Format-Table -AutoSize | Out-String -Width 240 | Write-Host
    }
}

function Confirm-RealRun {
    param(
        [array]$Processes,
        [array]$Services
    )

    if ($Force) {
        Write-Host "Parameter -Force aktif. Countdown konfirmasi dilewati atas pilihan pengguna."
        return $true
    }

    Write-Host ""
    Write-Warning "Run nyata akan menutup proses GUI dan menghentikan service session-only berikut."
    Write-PlanReport -Processes $Processes -Services $Services -SkippedProcesses @() -SkippedServices @()
    Write-Host "Tekan C lalu Enter dalam 10 detik untuk membatalkan. Tekan Enter atau tunggu untuk lanjut."

    $deadline = (Get-Date).AddSeconds(10)
    while ((Get-Date) -lt $deadline) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            if ($key.KeyChar -eq "c" -or $key.KeyChar -eq "C") {
                Write-Host "Dibatalkan oleh pengguna."
                return $false
            }
            if ($key.Key -eq "Enter") {
                return $true
            }
        }
        Start-Sleep -Milliseconds 200
    }

    return $true
}

function Stop-PlannedProcesses {
    param([array]$Processes)

    $results = @()
    foreach ($processInfo in $Processes) {
        $item = $processInfo | Select-Object *, @{Name = "StopStatus"; Expression = { "Pending" } }, @{Name = "Error"; Expression = { $null } }
        try {
            if ($PSCmdlet.ShouldProcess("$($processInfo.ProcessName) [$($processInfo.Id)]", "Stop process")) {
                Stop-Process -Id $processInfo.Id -Force -ErrorAction Stop
                $item.StopStatus = "Stopped"
            } else {
                $item.StopStatus = "WhatIf"
            }
        } catch {
            $item.StopStatus = "Failed"
            $item.Error = $_.Exception.Message
            Write-Warning "Gagal menghentikan process $($processInfo.ProcessName) [$($processInfo.Id)]: $($item.Error)"
        }
        $results += $item
    }
    return $results
}

function Stop-PlannedServices {
    param([array]$Services)

    $results = @()
    foreach ($serviceInfo in $Services) {
        $item = $serviceInfo | Select-Object *, @{Name = "StopStatus"; Expression = { "Pending" } }, @{Name = "Error"; Expression = { $null } }
        try {
            if ($PSCmdlet.ShouldProcess($serviceInfo.DisplayName, "Stop service for current session")) {
                Stop-Service -Name $serviceInfo.Name -Force -ErrorAction Stop
                $item.StopStatus = "Stopped"
            } else {
                $item.StopStatus = "WhatIf"
            }
        } catch {
            $item.StopStatus = "Failed"
            $item.Error = $_.Exception.Message
            Write-Warning "Gagal menghentikan service $($serviceInfo.DisplayName): $($item.Error)"
        }
        $results += $item
    }
    return $results
}

$SafeProcessTargets = @(
    @{ Name = "AppleMusic"; Vendor = "Apple"; PathPattern = "\\WindowsApps\\AppleInc\.AppleMusicWin_|\\Apple\\"; MetadataPattern = "Apple"; Reason = "Apple Music tidak diperlukan untuk mode development." },
    @{ Name = "AMPLibraryAgent"; Vendor = "Apple"; PathPattern = "\\WindowsApps\\AppleInc\.AppleMusicWin_|\\Apple\\"; MetadataPattern = "Apple"; Reason = "Apple Music library helper tidak diperlukan untuk mode development." },
    @{ Name = "Creative Cloud"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe Creative Cloud background UI aman ditutup saat tidak dipakai." },
    @{ Name = "Creative Cloud UI Helper"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe Creative Cloud helper aman ditutup saat tidak dipakai." },
    @{ Name = "Creative Cloud Helper"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe Creative Cloud helper aman ditutup saat tidak dipakai." },
    @{ Name = "AdobeCollabSync"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe Acrobat sync helper tidak penting untuk development." },
    @{ Name = "AdobeNotificationClient"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe notification helper tidak penting untuk development." },
    @{ Name = "AdobeUpdateService"; Vendor = "Adobe"; PathPattern = "\\Adobe\\"; MetadataPattern = "Adobe"; Reason = "Adobe updater process tidak penting untuk sesi development." },
    @{ Name = "SupportAssistAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell|SupportAssist"; Reason = "Dell SupportAssist tidak diperlukan saat development." },
    @{ Name = "Dell.TechHub"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell TechHub tidak diperlukan saat development." },
    @{ Name = "Dell.CoreServices.Client"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell utility client tidak diperlukan saat development." },
    @{ Name = "Dell.TechHub.Analytics.SubAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell analytics subagent tidak diperlukan saat development." },
    @{ Name = "Dell.TechHub.DataManager.SubAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell data manager subagent tidak diperlukan saat development." },
    @{ Name = "Dell.TechHub.Diagnostics.SubAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell diagnostics subagent tidak diperlukan saat development jika tidak ada diagnostic aktif." },
    @{ Name = "Dell.TechHub.Instrumentation.SubAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell instrumentation subagent tidak diperlukan saat development." },
    @{ Name = "Dell.TechHub.Instrumentation.UserProcess"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell instrumentation user process tidak diperlukan saat development." },
    @{ Name = "Dell.Update.SubAgent"; Vendor = "Dell"; PathPattern = "\\Dell\\|\\SupportAssist\\"; MetadataPattern = "Dell"; Reason = "Dell updater subagent tidak diperlukan saat development jika tidak ada update aktif." },
    @{ Name = "AdskAccessCore"; Vendor = "Autodesk"; PathPattern = "\\Autodesk\\"; MetadataPattern = "Autodesk|Adsk"; Reason = "Autodesk Access background process aman ditutup; licensing service tidak disentuh." },
    @{ Name = "AdskAccessServiceHost"; Vendor = "Autodesk"; PathPattern = "\\Autodesk\\"; MetadataPattern = "Autodesk|Adsk"; Reason = "Autodesk Access background host aman ditutup; licensing service tidak disentuh." },
    @{ Name = "cbservice"; Vendor = "Chaos"; PathPattern = "\\Chaos\\Cosmos\\"; MetadataPattern = "Chaos|Cosmos"; Reason = "Chaos Cosmos browser/helper aman ditutup hanya jika path/metadata tervalidasi." },
    @{ Name = "Cosmos"; Vendor = "Chaos"; PathPattern = "\\Chaos\\Cosmos\\"; MetadataPattern = "Chaos|Cosmos"; Reason = "Chaos Cosmos UI/helper aman ditutup jika tidak dipakai." },
    @{ Name = "CosmosBrowser"; Vendor = "Chaos"; PathPattern = "\\Chaos\\Cosmos\\"; MetadataPattern = "Chaos|Cosmos"; Reason = "Chaos Cosmos browser aman ditutup jika tidak dipakai." },
    @{ Name = "WSVCUUpdateHelper"; Vendor = "Wondershare"; PathPattern = "\\Wondershare\\"; MetadataPattern = "Wondershare"; Reason = "Wondershare update helper tidak penting untuk development." },
    @{ Name = "Wondershare Helper Compact"; Vendor = "Wondershare"; PathPattern = "\\Wondershare\\"; MetadataPattern = "Wondershare"; Reason = "Wondershare helper tidak penting untuk development." },
    @{ Name = "GoogleUpdate"; Vendor = "Google"; PathPattern = "\\Google\\Update\\"; MetadataPattern = "Google"; Reason = "Google updater non-esensial untuk sesi development." },
    @{ Name = "MicrosoftEdgeUpdate"; Vendor = "Microsoft"; PathPattern = "\\Microsoft\\EdgeUpdate\\"; MetadataPattern = "Microsoft"; Reason = "Edge updater non-esensial untuk sesi development." }
)

$SafeServiceTargets = @(
    @{ Name = "AdobeARMservice"; Vendor = "Adobe"; Reason = "Adobe Acrobat updater tidak penting untuk sesi development." },
    @{ Name = "AdobeUpdateService"; Vendor = "Adobe"; Reason = "Adobe updater tidak penting untuk sesi development." },
    @{ Name = "Autodesk Access Service Host"; Vendor = "Autodesk"; Reason = "Autodesk Access service boleh dihentikan hanya jika aplikasi Autodesk tidak aktif." },
    @{ Name = "CosmosUpdater"; Vendor = "Chaos"; Reason = "Chaos Cosmos updater tidak penting untuk sesi development." },
    @{ Name = "SupportAssistAgent"; Vendor = "Dell"; Reason = "Dell SupportAssist tidak diperlukan saat development jika tidak ada update/diagnostic aktif." },
    @{ Name = "DellTechHub"; Vendor = "Dell"; Reason = "Dell TechHub tidak diperlukan saat development jika tidak ada update/diagnostic aktif." },
    @{ Name = "GoogleUpdaterInternalService152.0.7933.0"; Vendor = "Google"; Reason = "Google updater non-esensial untuk sesi development." },
    @{ Name = "GoogleUpdaterService152.0.7933.0"; Vendor = "Google"; Reason = "Google updater non-esensial untuk sesi development." },
    @{ Name = "edgeupdate"; Vendor = "Microsoft"; Reason = "Edge updater non-esensial untuk sesi development." },
    @{ Name = "edgeupdatem"; Vendor = "Microsoft"; Reason = "Edge updater non-esensial untuk sesi development." },
    @{ Name = "NativePushService"; Vendor = "Wondershare"; Reason = "Wondershare push service tidak penting untuk development." }
)

try {
    if (-not $WhatIfPreference -and -not (Test-Path -LiteralPath $LogRoot)) {
        New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
    }

    if (-not $WhatIfPreference) {
        Start-Transcript -Path $TranscriptPath -Force | Out-Null
        $TranscriptStarted = $true
    }

    Write-Host "SIGNAL13 Development Mode - Optimize" -ForegroundColor Cyan
    Write-Host "Scope: konservatif, session-only, reversible."

    $isAdmin = Test-IsAdministrator
    Write-Host ("Administrator: {0}" -f $isAdmin)
    if (-not $WhatIfPreference -and -not $isAdmin) {
        throw "Run nyata wajib dijalankan sebagai Administrator. Gunakan START_SIGNAL13_DEV.bat atau buka PowerShell as Administrator. Dry run (-WhatIf) tetap boleh tanpa Administrator."
    }
    if ($WhatIfPreference -and -not $isAdmin) {
        Write-Warning "Dry run berjalan tanpa Administrator. Ini aman untuk melihat rencana, tetapi run nyata wajib elevated."
    }

    $memoryBefore = Get-MemorySnapshot
    if ($memoryBefore.Warning) {
        Write-Warning $memoryBefore.Warning
    }
    Write-Host ("RAM sebelum: {0}" -f (Format-MemorySnapshot -Snapshot $memoryBefore))

    $processPlan = Get-ValidatedProcessTargets -Targets $SafeProcessTargets
    $servicePlan = Get-ServicePlan -Targets $SafeServiceTargets

    Write-PlanReport -Processes $processPlan.Planned -Services $servicePlan.Planned -SkippedProcesses $processPlan.Skipped -SkippedServices $servicePlan.Skipped

    if ($WhatIfPreference) {
        Write-Host ""
        Write-Host "WhatIf aktif: tidak membuat restore point, transcript, manifest, atau perubahan sistem." -ForegroundColor Yellow
        Write-Host "Process dihentikan : 0"
        Write-Host "Service dihentikan : 0"
        return
    }

    if (-not (Confirm-RealRun -Processes $processPlan.Planned -Services $servicePlan.Planned)) {
        return
    }

    $restorePoint = [PSCustomObject]@{
        Attempted = $false
        Created = $false
        Warning = $null
    }

    if (-not $SkipRestorePoint) {
        $restorePoint.Attempted = $true
        try {
            Checkpoint-Computer -Description "SIGNAL13 Development Mode $Timestamp" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
            $restorePoint.Created = $true
            Write-Host "Restore point berhasil dibuat."
        } catch {
            $restorePoint.Warning = $_.Exception.Message
            Write-Warning "Restore point gagal dibuat. Lanjut memakai backup konfigurasi. Detail: $($restorePoint.Warning)"
        }
    }

    $stoppedProcesses = @(Stop-PlannedProcesses -Processes $processPlan.Planned)
    $stoppedServices = @(Stop-PlannedServices -Services $servicePlan.Planned)

    Start-Sleep -Seconds 2
    $memoryAfter = Get-MemorySnapshot
    if ($memoryAfter.Warning) {
        Write-Warning $memoryAfter.Warning
    }

    $savedMb = $null
    if ($memoryBefore.Available -and $memoryAfter.Available) {
        $savedMb = [math]::Round($memoryAfter.FreeMB - $memoryBefore.FreeMB, 1)
    }

    $manifest = [PSCustomObject]@{
        Tool = "SIGNAL13 Workstation Module"
        Mode = "Development"
        Action = "Optimize"
        Timestamp = $Timestamp
        ComputerName = $env:COMPUTERNAME
        UserName = $env:USERNAME
        IsAdministrator = $isAdmin
        RestorePoint = $restorePoint
        MemoryBefore = $memoryBefore
        MemoryAfter = $memoryAfter
        EstimatedFreedMB = $savedMb
        ProcessPlan = $processPlan.Planned
        SkippedProcesses = $processPlan.Skipped
        ServiceBackup = $servicePlan.Planned
        SkippedServices = $servicePlan.Skipped
        StoppedProcesses = @($stoppedProcesses | Where-Object { $_.StopStatus -eq "Stopped" })
        FailedProcesses = @($stoppedProcesses | Where-Object { $_.StopStatus -eq "Failed" })
        StoppedServices = @($stoppedServices | Where-Object { $_.StopStatus -eq "Stopped" -and $_.Status -eq "Running" })
        FailedServices = @($stoppedServices | Where-Object { $_.StopStatus -eq "Failed" })
        ManualRestartApplications = @(
            "Apple Music",
            "Adobe Creative Cloud",
            "Adobe Acrobat sync",
            "Dell SupportAssist",
            "Dell TechHub",
            "Autodesk Access",
            "Chaos Cosmos",
            "Wondershare helpers"
        )
    }

    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ManifestPath -Encoding UTF8
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $LatestManifestPath -Encoding UTF8

    Write-Host ""
    Write-Host "Ringkasan Optimize SIGNAL13" -ForegroundColor Green
    Write-Host ("Process dihentikan : {0}" -f $manifest.StoppedProcesses.Count)
    Write-Host ("Service dihentikan : {0}" -f $manifest.StoppedServices.Count)
    Write-Host ("RAM sesudah       : {0}" -f (Format-MemorySnapshot -Snapshot $memoryAfter))
    if ($null -ne $savedMb) {
        Write-Host ("Estimasi hemat    : {0} MB" -f $savedMb)
    } else {
        Write-Host "Estimasi hemat    : RAM tidak dapat dibaca"
    }
    Write-Host ("Backup manifest   : {0}" -f $ManifestPath)
    Write-Host ("Log               : {0}" -f $TranscriptPath)
} finally {
    if ($TranscriptStarted) {
        Stop-Transcript | Out-Null
    }
}
