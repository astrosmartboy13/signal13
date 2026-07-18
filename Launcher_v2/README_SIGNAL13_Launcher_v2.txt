SIGNAL13 Launcher v2.0 (RC1)
Status
Current State: Stable Baseline (RC1)
Semua modul inti telah diuji dan berjalan normal:
✅ OnTime
✅ Gateway
✅ Cloudflare Tunnel
✅ Dashboard
✅ Domain Remote
✅ Auto Open:
Dashboard
Editor
Timer
Backstage
Timeline
Studio
---
Struktur Folder
``` text
Launcher_v2
│
├── START_SIGNAL13.bat
├── STOP_SIGNAL13.bat
├── RUN_ONTIME.bat
├── RUN_GATEWAY.bat
├── RUN_TUNNEL.bat
├── WAIT_HTTP.bat
├── config.bat
└── README.md
```
---
Fungsi File
---
File                           Fungsi
---
START_SIGNAL13.bat             Orchestrator utama untuk menjalankan
seluruh sistem
STOP_SIGNAL13.bat              Menghentikan seluruh sistem secara
berurutan
RUN_ONTIME.bat                 Menjalankan OnTime jika belum aktif
RUN_GATEWAY.bat                Menjalankan SIGNAL13 Gateway
RUN_TUNNEL.bat                 Menjalankan Cloudflare Tunnel
WAIT_HTTP.bat                  Menunggu endpoint HTTP siap
config.bat                     Konfigurasi path dan URL
---
Cara Menjalankan
Jalankan `START_SIGNAL13.bat`.
Tunggu hingga browser membuka:
Dashboard
Editor
Timer
Backstage
Timeline
Studio
Pastikan Dashboard berstatus ONLINE.
---
Saat Show Berjalan
Jangan menutup:
OnTime
SIGNAL13 Gateway
SIGNAL13 Tunnel
Browser boleh ditutup dan dibuka kembali kapan saja.
---
Mengakhiri Operasional
Gunakan:
`STOP_SIGNAL13.bat`
Jangan menghentikan proses dengan menutup jendela CMD secara paksa.
---
Baseline
Launcher_v2 merupakan baseline resmi SIGNAL13 per 16 Juli 2026.
Perubahan berikutnya dilakukan di atas baseline ini agar sistem tetap
mudah dirawat dan diuji.