# SIGNAL13 Runtime API v1

## 1. Tujuan Runtime API

Runtime API adalah kontrak resmi untuk membaca kondisi operasional SIGNAL13 saat aplikasi berjalan.

API ini menjadi single source of truth untuk status runtime seperti Gateway, Dashboard, OnTime, Tunnel, Launcher, dan Editor. Dashboard dan consumer lain tidak boleh menebak status service sendiri jika data sudah tersedia dari Runtime API.

Runtime API tidak menyimpan konfigurasi event permanen. Data event seperti nama acara, venue, rundown, show status, dan versi dashboard tetap berada di static configuration seperti `event.json`.

## 2. Arsitektur Runtime

Runtime API diproduksi oleh Gateway.

Gateway bertanggung jawab untuk:

- mengumpulkan status service runtime;
- menormalisasi status ke enum resmi;
- membangun response API yang stabil;
- menghindari status online palsu;
- menyediakan hook untuk service yang belum bisa dideteksi.

Arsitektur internal Gateway dibagi menjadi:

- Runtime collector: mengambil status dari service terkait.
- Status normalizer: memastikan semua status memakai enum resmi.
- Response builder: menyusun payload `/api/status`.

## 3. Endpoint

### `GET /health`

Endpoint ringan untuk memeriksa apakah Gateway hidup.

Response minimal:

```json
{
  "status": "online",
  "server": "SIGNAL13",
  "service": "gateway",
  "version": "3.0",
  "time": "2026-07-21T01:00:05.963Z"
}
```

`/health` hanya menyatakan kondisi Gateway. Endpoint ini tidak menggantikan `/api/status`.

### `GET /api/status`

Endpoint utama Runtime API. Semua consumer harus memakai endpoint ini untuk membaca runtime SIGNAL13.

Response root:

```json
{
  "overall": "online",
  "dashboard": "online",
  "gateway": "online",
  "ontime": "online",
  "tunnel": "unknown",
  "launcher": "unknown",
  "editor": "online",
  "version": "3.0",
  "time": "2026-07-21T01:00:05.952Z"
}
```

## 4. Status Enum

Semua status Runtime API wajib memakai enum berikut:

| Status | Definisi |
|---|---|
| `online` | Service berhasil dideteksi hidup dan dapat digunakan. |
| `offline` | Service dipastikan tidak tersedia, gagal dijangkau, atau gagal validasi. |
| `unknown` | Service belum dapat dipastikan karena detector belum tersedia atau informasi belum lengkap. |

Runtime API tidak boleh menggunakan nilai status lain di luar `online`, `offline`, dan `unknown`.

## 5. Definisi Field `/api/status`

| Field | Tipe | Definisi |
|---|---|---|
| `overall` | status enum | Status keseluruhan runtime SIGNAL13. |
| `dashboard` | status enum | Status file/runtime Dashboard. |
| `gateway` | status enum | Status Gateway sebagai producer Runtime API. |
| `ontime` | status enum | Status OnTime sebagai target proxy utama. |
| `tunnel` | status enum | Status Tunnel publik. Jika belum ada detector, gunakan `unknown`. |
| `launcher` | status enum | Status Launcher lokal. Jika belum ada detector, gunakan `unknown`. |
| `editor` | status enum | Status Editor. Saat ini bergantung pada availability OnTime. |
| `version` | string | Versi Runtime API atau Gateway runtime contract. |
| `time` | ISO timestamp | Waktu response dibuat oleh Gateway. |

Aturan `overall`:

- `online` jika service kritikal tersedia.
- `offline` jika Gateway, Dashboard, atau OnTime dipastikan offline.
- `unknown` jika informasi kritikal belum lengkap.

## 6. Contoh Response

### Semua Online

```json
{
  "overall": "online",
  "dashboard": "online",
  "gateway": "online",
  "ontime": "online",
  "tunnel": "online",
  "launcher": "online",
  "editor": "online",
  "version": "3.0",
  "time": "2026-07-21T01:00:05.952Z"
}
```

### OnTime Offline

```json
{
  "overall": "offline",
  "dashboard": "online",
  "gateway": "online",
  "ontime": "offline",
  "tunnel": "unknown",
  "launcher": "unknown",
  "editor": "offline",
  "version": "3.0",
  "time": "2026-07-21T01:00:05.952Z"
}
```

### Gateway Offline

Jika Gateway offline, consumer biasanya tidak akan menerima response dari Runtime API. Consumer harus memperlakukan fetch failure atau timeout ke `/health` atau `/api/status` sebagai Gateway `offline`.

Contoh state yang boleh dibentuk oleh consumer:

```json
{
  "overall": "offline",
  "dashboard": "online",
  "gateway": "offline",
  "ontime": "unknown",
  "tunnel": "unknown",
  "launcher": "unknown",
  "editor": "unknown",
  "version": "unknown",
  "time": "2026-07-21T01:00:05.952Z"
}
```

### Unknown

```json
{
  "overall": "unknown",
  "dashboard": "online",
  "gateway": "online",
  "ontime": "unknown",
  "tunnel": "unknown",
  "launcher": "unknown",
  "editor": "unknown",
  "version": "3.0",
  "time": "2026-07-21T01:00:05.952Z"
}
```

## 7. Producer & Consumer

### Producer

- Gateway

Gateway adalah satu-satunya producer resmi Runtime API v1.

### Consumer

- Dashboard
- Launcher (future)
- Admin (future)
- Mobile (future)

Consumer harus membaca runtime dari `/api/status` dan tidak membuat status online palsu berdasarkan asumsi route, proxy, atau konfigurasi statis.

## 8. Extension Policy

Runtime API harus backward compatible.

Aturan extension:

- Field lama tidak boleh dihapus tanpa versi API baru.
- Field baru boleh ditambahkan selama tidak mengubah arti field lama.
- Semua status baru tetap wajib memakai enum `online`, `offline`, atau `unknown`.
- Jika service belum bisa dideteksi, status harus `unknown`.
- Runtime API tidak boleh mencampur data runtime dengan static event configuration.
- Consumer harus mengabaikan field tambahan yang belum dikenali.

## 9. Changelog

### Runtime API v1

- Menetapkan Gateway sebagai producer Runtime API.
- Menetapkan `/health` sebagai endpoint health Gateway.
- Menetapkan `/api/status` sebagai single source of truth runtime SIGNAL13.
- Menetapkan status enum resmi: `online`, `offline`, `unknown`.
- Menetapkan field runtime awal: `overall`, `dashboard`, `gateway`, `ontime`, `tunnel`, `launcher`, `editor`, `version`, dan `time`.
