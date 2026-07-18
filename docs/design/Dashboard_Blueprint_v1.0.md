\# Dashboard Blueprint v1.0



| Item | Value |

|------|-------|

| Project | SIGNAL13 |

| Module | Dashboard |

| Version | 1.0 |

| Status | LOCKED (after approval) |

| Sprint | Sprint 02 |

| Product Owner | Abdul Basit |

| Chief Architect | Ren |

| Implementation | OpenAI Codex |



\---



\# 1. Purpose



Dashboard SIGNAL13 adalah pusat kendali (Production Control Center) untuk seluruh kebutuhan operasional produksi acara.



Dashboard bukan sekadar launcher aplikasi, tetapi menjadi satu halaman utama yang memberikan akses cepat ke seluruh modul produksi serta menampilkan informasi penting mengenai event yang sedang berjalan.



Dashboard harus dapat digunakan oleh Crew maupun Admin dengan tampilan yang konsisten, sederhana, cepat dipahami, dan siap digunakan pada kondisi produksi secara langsung.



\---



\# 2. Objectives



Sprint 02 berfokus pada pembangunan fondasi Dashboard.



Target utama Sprint ini adalah menghasilkan Dashboard UI yang stabil, responsive, mudah dikembangkan, dan siap diintegrasikan pada Sprint berikutnya.



Dashboard harus memiliki struktur yang jelas sehingga seluruh fitur baru dapat ditambahkan tanpa mengubah layout utama.



\---



\# 3. Scope Sprint 02



\## Included



\- Dashboard UI

\- Responsive Layout

\- Semantic HTML

\- Vanilla CSS

\- Vanilla JavaScript

\- Hardcoded Event Data

\- Live Clock

\- Information Cards

\- Quick Access Cards

\- System Status Cards



\## Excluded



\- Login

\- User Role

\- Backend

\- API

\- Gateway Integration

\- OnTime Integration

\- Health Check

\- Database

\- Authentication

\- Launcher Integration



Semua fitur di atas akan dikerjakan pada Sprint berikutnya.



\---



\# 4. Dashboard Philosophy



Dashboard SIGNAL13 dirancang sebagai \*\*Production Control Center\*\*, yaitu satu halaman utama yang menjadi titik awal seluruh aktivitas produksi.



Dashboard harus memenuhi prinsip-prinsip berikut:



\## Simple



Crew harus dapat menemukan informasi atau membuka modul yang dibutuhkan dalam waktu kurang dari 3 detik.



\## Fast



Dashboard harus memiliki waktu muat yang ringan dan tidak bergantung pada backend untuk dapat ditampilkan.



\## Consistent



Seluruh halaman SIGNAL13 harus menggunakan bahasa desain yang sama agar pengguna tidak perlu beradaptasi setiap berpindah modul.



\## Modular



Setiap bagian Dashboard harus berdiri sendiri sehingga dapat ditambah, dihapus, atau dipindahkan tanpa memengaruhi komponen lainnya.



\## Future Ready



Dashboard harus dipersiapkan untuk integrasi dengan Gateway, OnTime, Stage Timer, Cloudflare Tunnel, API, Authentication, dan modul SIGNAL13 lainnya tanpa perlu mengubah struktur utama halaman.



\---



\# 5. Information Architecture



Dashboard terdiri dari enam bagian utama.



```

Header

&#x20;   │

&#x20;   ▼

Hero Section

&#x20;   │

&#x20;   ▼

Production Information

&#x20;   │

&#x20;   ▼

Quick Access

&#x20;   │

&#x20;   ▼

System Status

&#x20;   │

&#x20;   ▼

Footer

```



Urutan tersebut merupakan struktur tetap dan tidak boleh diubah tanpa pembaruan Blueprint.



\---



\# 6. Section Specification



\## 6.1 Header



Header berfungsi sebagai identitas Dashboard.



Komponen:



\- Logo Event

\- Event Name

\- Venue

\- Event Date

\- Live Clock

\- Online Status

\- Instagram / Official Link



\---



\## 6.2 Hero Section



Hero menjadi area utama yang pertama dilihat ketika Dashboard dibuka.



Berisi:



\- Project Name

\- Tagline

\- Current Production Status



Hero tidak boleh berisi tombol atau informasi teknis.



\---



\## 6.3 Production Information



Menampilkan informasi inti produksi.



Card yang ditampilkan:



\- Show Director

\- Stage Manager

\- Total Duration



Seluruh informasi menggunakan format card yang konsisten.



\---



\## 6.4 Quick Access



Quick Access merupakan kumpulan shortcut menuju modul SIGNAL13.



Sprint 02 terdiri dari:



\- Timer

\- Backstage

\- Timeline

\- Studio Clock

\- Rundown



Semua shortcut menggunakan desain card yang sama.



\---



\## 6.5 System Status



Menampilkan status seluruh layanan utama SIGNAL13.



Sprint 02 menggunakan data statis (hardcoded).



Komponen:



\- Dashboard

\- Gateway

\- OnTime

\- Tunnel



Status yang digunakan:



\- Online

\- Offline

\- Unknown



Integrasi status sebenarnya akan dilakukan pada Sprint berikutnya.



\---



\## 6.6 Footer



Footer berisi informasi sistem.



Minimal menampilkan:



\- SIGNAL13 Version

\- Copyright

\- Build Version



\---



\# 7. Component Specification



Seluruh komponen Dashboard harus mengikuti standar desain SIGNAL13.



\---



\## 7.1 Card



Card merupakan komponen utama Dashboard.



Digunakan pada:



\- Production Information

\- Quick Access

\- System Status



Karakteristik:



\- Border Radius : 16px

\- Padding : 24px

\- Border : 1px solid

\- Background : Solid

\- Hover Effect : Elevation + Border Highlight

\- Transition : 200ms Ease



Semua card menggunakan ukuran dan style yang konsisten.



\---



\## 7.2 Quick Access Card



Setiap Quick Access Card terdiri dari:



\- Icon

\- Title

\- Description

\- Click Area



Seluruh area card harus dapat diklik (Full Clickable Card).



Tidak diperbolehkan menggunakan tombol kecil di dalam card.



\---



\## 7.3 Status Card



Status Card menampilkan kondisi layanan.



Komponen:



\- Service Name

\- Status Badge

\- Last Update (Future)



Status Badge menggunakan warna standar.



Online

= Green



Offline

= Red



Unknown

= Gray



\---



\## 7.4 Information Card



Information Card digunakan untuk data produksi.



Contoh:



Show Director



Stage Manager



Duration



Information Card tidak memiliki aksi (read only).



\---



\# 8. Design System



Dashboard menggunakan satu Design System yang akan menjadi standar seluruh modul SIGNAL13.



\---



\## 8.1 Color Palette



Primary Background



\#0D0D0D



Secondary Background



\#181818



Border



\#2A2A2A



Primary Accent



\#B71C1C



Success



\#22C55E



Warning



\#F59E0B



Danger



\#EF4444



Primary Text



\#FFFFFF



Secondary Text



\#A1A1AA



\---



\## 8.2 Typography



Font Family



Poppins



Fallback



sans-serif



Heading



Bold



Body



Regular



Caption



Medium



\---



\## 8.3 Spacing



Base Unit



8px



Standard Padding



24px



Section Gap



32px



Card Gap



20px



\---



\## 8.4 Border Radius



Small



8px



Medium



12px



Large



16px



\---



\## 8.5 Shadow



Dashboard menggunakan shadow ringan.



Tidak menggunakan glow effect.



Tidak menggunakan neumorphism.



\---



\## 8.6 Icon Style



Menggunakan icon outline yang konsisten.



Ukuran default:



24px



Semua icon menggunakan style yang sama pada seluruh Dashboard.



\---





\---



\# 9. HTML Architecture



Dashboard harus menggunakan HTML5 Semantic.



Struktur minimum halaman adalah sebagai berikut.



```text

<body>



&#x20;   <header>



&#x20;   <main>



&#x20;       <section id="hero">



&#x20;       <section id="production">



&#x20;       <section id="quick-access">



&#x20;       <section id="system-status">



&#x20;   </main>



&#x20;   <footer>



</body>

```



Semua section wajib menggunakan elemen semantic HTML.



Hindari penggunaan `<div>` apabila tersedia elemen semantic yang lebih sesuai.



\---



\## 9.1 Module Attribute



Setiap komponen utama wajib memiliki atribut:



```html

data-module=""

```



Contoh:



```html

<section id="quick-access" data-module="quick-access">



<section id="system-status" data-module="system-status">

```



Hal ini bertujuan mempermudah pengembangan JavaScript pada Sprint berikutnya.



\---



\# 10. CSS Standard



Dashboard menggunakan satu file CSS utama.



Aturan:



\- Menggunakan CSS Variables

\- Tidak menggunakan Inline CSS

\- Menggunakan Flexbox dan Grid

\- Responsive First

\- Tidak menggunakan Framework CSS



Semua warna harus menggunakan CSS Variable.



Contoh:



```css

:root{



\--bg-primary:#0D0D0D;



\--bg-secondary:#181818;



\--accent:#B71C1C;



\--success:#22C55E;



}

```



\---



\# 11. JavaScript Standard



Dashboard menggunakan Vanilla JavaScript.



Aturan:



\- Tidak menggunakan jQuery

\- Tidak menggunakan Framework

\- Tidak menggunakan Inline JavaScript

\- Semua event menggunakan addEventListener()



Data sementara menggunakan Hardcoded Object.



Seluruh fungsi JavaScript harus dipisahkan berdasarkan tanggung jawabnya.



\---



\# 12. Responsive Rules



Dashboard harus dapat digunakan pada tiga ukuran layar.



Desktop



≥1200 px



Tablet



768–1199 px



Mobile



≤767 px



Perubahan layout diperbolehkan.



Perubahan informasi tidak diperbolehkan.



Semua informasi yang tampil pada Desktop harus tetap tersedia pada Mobile.



\---



\# 13. Future Ready



Blueprint ini dipersiapkan untuk pengembangan fitur berikut.



\- Authentication

\- User Role

\- Admin Dashboard

\- Live Health Check

\- OnTime API

\- Stage Timer API

\- Gateway API

\- Cloudflare Tunnel Monitoring

\- Production Log

\- Notification Center

\- Theme System

\- Plugin System

\- AI Assistant



Penambahan fitur tersebut tidak boleh mengubah struktur utama Dashboard.



\---



\# 14. Definition of Done



Sprint 02 dinyatakan selesai apabila seluruh kriteria berikut terpenuhi.



\## Functional



\- Dashboard dapat dibuka tanpa error.

\- Semua section tampil.

\- Semua card tampil.

\- Semua Quick Access tampil.

\- Live Clock berjalan.



\## Visual



\- Responsive.

\- Konsisten dengan Design System.

\- Tidak ada layout yang rusak.

\- Desktop, Tablet, dan Mobile berjalan baik.



\## Technical



\- Semantic HTML.

\- Vanilla CSS.

\- Vanilla JavaScript.

\- Tidak ada Inline CSS.

\- Tidak ada Inline JavaScript.

\- Struktur folder tetap konsisten.



\---



\# 15. Version History



| Version | Status | Description |

|----------|--------|-------------|

| 1.0 | Initial Release | Dashboard Blueprint pertama SIGNAL13 |

