# SIGNAL13 Workstation Module

Modul ini membuat mode development konservatif untuk laptop SIGNAL13.

Scope tahap pertama:

- Tidak mengubah startup registry.
- Tidak mengubah scheduled task.
- Tidak mengubah service startup type.
- Tidak mematikan Defender.
- Tidak mematikan pagefile.
- Tidak mematikan Windows Update service.
- Tidak mematikan audio, network, Magic Utilities, Logitech, Cloudflare Tunnel, Node.js, Git, VS Code, Codex, ChatGPT, Chrome, atau PowerShell gateway.

## File

| File | Fungsi |
|---|---|
| `Optimize-SIGNAL13.ps1` | Menutup proses dan service non-esensial yang aman untuk sesi development. Pada run nyata membuat backup JSON, log transcript, dan mencoba restore point. Pada `-WhatIf` hanya menampilkan rencana. |
| `Restore-SIGNAL13.ps1` | Menghidupkan kembali service yang sebelumnya `Running` dan dihentikan oleh optimizer. Aplikasi GUI tidak dibuka paksa. |
| `START_SIGNAL13_DEV.bat` | Launcher Windows. Meminta Administrator jika perlu, lalu menjalankan optimizer. |
| `STOP_SIGNAL13_DEV.bat` | Launcher restore. Meminta Administrator jika perlu, lalu menjalankan restore. |
| `logs/` | Folder manifest backup, transcript, dan restore result. |

## Target Proses

Target proses dipilih konservatif dan eksplisit:

- Apple Music: `AppleMusic`, `AMPLibraryAgent`
- Adobe background: `Creative Cloud`, `Creative Cloud UI Helper`, `Creative Cloud Helper`, `AdobeCollabSync`, `AdobeNotificationClient`, `AdobeUpdateService`
- Dell utilities: `SupportAssistAgent`, `Dell.TechHub`, `Dell.CoreServices.Client`, `Dell.TechHub.*`, `Dell.Update.SubAgent`
- Autodesk Access: `AdskAccessCore`, `AdskAccessServiceHost`
- Chaos Cosmos: `cbservice`, `Cosmos`, `CosmosBrowser`, hanya jika path/metadata executable cocok dengan Chaos/Cosmos.
- Wondershare: `WSVCUUpdateHelper`, `Wondershare Helper Compact`
- Updater non-esensial: `GoogleUpdate`, `MicrosoftEdgeUpdate`

## Target Service

Target service hanya dihentikan untuk sesi berjalan, tanpa mengubah startup type:

- `AdobeARMservice`
- `AdobeUpdateService`
- `Autodesk Access Service Host`
- `CosmosUpdater`
- `SupportAssistAgent`
- `DellTechHub`
- `GoogleUpdaterInternalService152.0.7933.0`
- `GoogleUpdaterService152.0.7933.0`
- `edgeupdate`
- `edgeupdatem`
- `NativePushService`

`AdskLicensingService` sengaja tidak disentuh agar aplikasi Autodesk tetap bisa berjalan saat dibuka manual. `Autodesk Access Service Host` juga dilewati jika aplikasi Autodesk aktif.

Service dan proses Dell dilewati jika terdeteksi aktivitas firmware update atau diagnostic aktif.

## Cara Pakai

Jalankan dari File Explorer atau terminal:

```bat
workstation\START_SIGNAL13_DEV.bat
```

Untuk restore service yang dihentikan:

```bat
workstation\STOP_SIGNAL13_DEV.bat
```

## Testing Manual Aman

Sebelum menjalankan optimize sungguhan, lakukan syntax check:

```powershell
powershell.exe -NoProfile -Command "$null = [System.Management.Automation.Language.Parser]::ParseFile('workstation\Optimize-SIGNAL13.ps1',[ref]$null,[ref]$null)"
powershell.exe -NoProfile -Command "$null = [System.Management.Automation.Language.Parser]::ParseFile('workstation\Restore-SIGNAL13.ps1',[ref]$null,[ref]$null)"
```

Dry run tanpa perubahan:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File workstation\Optimize-SIGNAL13.ps1 -WhatIf -SkipRestorePoint
```

Run nyata wajib Administrator. Sebelum proses GUI ditutup, script menampilkan target dan memberi countdown 10 detik untuk membatalkan. Gunakan `-Force` hanya jika ingin melewati countdown secara sengaja.

Run normal setelah disetujui:

```bat
workstation\START_SIGNAL13_DEV.bat
```

## Risiko

- Aplikasi Adobe, Apple Music, Dell utility, Autodesk Access, Chaos Cosmos, atau Wondershare yang sedang dipakai bisa tertutup.
- Restore hanya menghidupkan kembali service. Aplikasi GUI dibuka manual agar tidak memaksa state desktop.
- Restore point bisa gagal jika System Protection tidak aktif. Backup JSON dan log tetap dibuat.
- Penghematan RAM bergantung pada aplikasi yang sedang berjalan saat script dijalankan.
