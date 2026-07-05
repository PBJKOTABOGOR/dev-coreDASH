SIPPBJ DEV-DASH FAST V2 - FULL PROJECT PATCH

Yang sudah dibenerin:
1. Semua menu monitoring dibuat FAST:
   - SIRUP
   - eKatalog
   - eTendering
   - eKontrak
   - Non Tender
   - Perencanaan
   - Rapor PBJ
   - Pemenang Pengadaan
2. Pola lama load semua data ke browser diganti:
   - summary kecil dulu
   - search di backend
   - pagination di backend
   - cache Apps Script 10 menit
3. Desain menu dibuat responsive, font lebih kebaca, tabel lebih rapi.
4. Spreadsheet ID/GID/nama sheet tidak lagi ditaruh di frontend menu.
5. Dashboard utama juga dipindahkan ke backend FAST V2 untuk baca sheet.

CARA PASANG:
1. Upload isi folder dev-DASH-main ke GitHub seperti biasa.
2. Jangan upload folder:
   BACKEND_JANGAN_UPLOAD_KE_GITHUB_APPS_SCRIPT_FAST_V2
3. Buat Apps Script baru:
   SIPPBJ_BACKEND_FAST_V2
4. Copy Code.gs dari:
   BACKEND_JANGAN_UPLOAD_KE_GITHUB_APPS_SCRIPT_FAST_V2/Code.gs
5. Edit fungsi setupFastV2Properties().
6. Isi semua Spreadsheet ID, GID, dan nama sheet yang sesuai.
7. Run setupFastV2Properties() sekali.
8. Deploy sebagai Web App:
   Execute as: Me
   Who has access: Anyone
9. Copy URL Web App.
10. Replace semua placeholder ini di project:
   ISI_URL_WEB_APP_FAST_V2_DI_SINI
   dengan URL Web App lu.

File yang perlu diisi URL backend:
- app.js
- modules/monitoring/itkp-sirup/itkp-sirup.js
- modules/monitoring/itkp-ekatalog/itkp-ekatalog.js
- modules/monitoring/itkp-etendering/itkp-etendering.js
- modules/monitoring/itkp-ekontrak/itkp-ekontrak.js
- modules/monitoring/itkp-nontender/itkp-nontender.js
- modules/monitoring/perencanaan/monitoring.js
- modules/rapor-pbj/rapor-pbj.js
- modules/pemenang-pengadaan/pemenang-pengadaan.js

Catatan jujur:
- Ini versi FAST V2 full patch. Tampilan dibuat lebih universal dan cepat.
- Beberapa fitur detail lama yang terlalu berat sengaja diringkas supaya skala data besar tidak bikin browser berat.
- Export yang tersedia adalah export halaman aktif, bukan paksa export puluhan ribu baris dari browser.
