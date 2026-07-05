
(function(){
  'use strict';

  const API_URL = 'ISI_URL_WEB_APP_FAST_V2_DI_SINI';
  const MODULE = 'rapor';
  const DATASET = '';
  const TITLE = 'Rapor PBJ Cepat';
  const SUBTITLE = 'Rapor PBJ dibuat ringan: backend mengirim data sesuai pencarian, bukan seluruh sheet.';
  const COLUMNS = [{"label": "Satuan Kerja", "keys": ["satuan_kerja", "satker", "opd"]}, {"label": "Indikator", "keys": ["indikator", "uraian", "nama_paket"]}, {"label": "Nilai", "keys": ["nilai", "skor", "nilai_itkp"]}, {"label": "Status", "keys": ["status", "keterangan"], "type": "badge"}, {"label": "Tahun", "keys": ["tahun"]}, {"label": "Catatan", "keys": ["catatan", "analisis", "rekomendasi"]}];
  const SUMMARY_MAP = {"fastStat1": {"label": "Jumlah OPD", "keys": ["jumlahOpd", "instansi"]}, "fastStat2": {"label": "Jumlah Data", "keys": ["jumlahPaket", "totalRows"]}, "fastStat3": {"label": "Total Nilai", "keys": ["totalPagu", "totalRealisasi"], "type": "money"}, "fastStat4": {"label": "Rata-rata", "keys": ["avgItkp", "avgPersen"], "type": "decimal"}};

  window.__moduleInit = function({container}) {
    const root = container || document;
    let page = 1;
    let totalPages = 1;
    let lastRows = [];

    root.innerHTML = renderShell();
    const q = (sel) => root.querySelector(sel);

    q('#fastRefresh')?.addEventListener('click', loadAll);
    q('#fastSearchBtn')?.addEventListener('click', () => { page = 1; search(); });
    q('#fastKeyword')?.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ page = 1; search(); } });
    q('#fastLimit')?.addEventListener('change', () => { page = 1; search(); });
    q('#fastPrev')?.addEventListener('click', () => { if(page > 1){ page--; search(); } });
    q('#fastNext')?.addEventListener('click', () => { if(page < totalPages){ page++; search(); } });
    q('#fastExport')?.addEventListener('click', exportCurrent);

    loadAll();

    return function(){};

    async function loadAll(){
      clearError();
      await Promise.allSettled([summary(), search()]);
    }

    async function summary(){
      try{
        const res = await request({module: MODULE, action:'summary', dataset: DATASET});
        const s = res.summary || {};
        Object.keys(SUMMARY_MAP).forEach(id => {
          const cfg = SUMMARY_MAP[id];
          const val = getAny(s, cfg.keys || []);
          const el = q('#' + id);
          if(!el) return;
          el.textContent = cfg.type === 'money' ? money(val) : cfg.type === 'decimal' ? decimal(val) : int(val);
        });
      }catch(err){
        showError(err.message || String(err));
      }
    }

    async function search(){
      try{
        setLoading();
        clearError();
        const keyword = q('#fastKeyword')?.value || '';
        const limit = q('#fastLimit')?.value || 10;
        const res = await request({module: MODULE, action:'search', dataset: DATASET, keyword, page, limit});
        lastRows = res.rows || [];
        totalPages = res.totalPages || 1;
        renderTable(lastRows);
        q('#fastInfo').textContent = `${int(res.total || 0)} data cocok • tampil ${int(lastRows.length)} data`;
        q('#fastPageInfo').textContent = `Page ${res.page || page} / ${res.totalPages || totalPages}`;
        q('#fastPageNum').textContent = String(res.page || page);
      }catch(err){
        showError(err.message || String(err));
        q('#fastBody').innerHTML = `<tr><td colspan="99">Data gagal dimuat.</td></tr>`;
      }
    }

    function renderShell(){
      return `
        <div class="fast-page">
          <section class="fast-hero">
            <div>
              <h1 class="fast-title">${esc(TITLE)}</h1>
              <p class="fast-subtitle">${esc(SUBTITLE)}</p>
              <div class="fast-error" id="fastError"></div>
            </div>
            <div class="fast-toolbar">
              <button class="fast-btn" id="fastRefresh" type="button">Refresh</button>
              <button class="fast-btn primary" id="fastExport" type="button">Export Halaman Ini</button>
            </div>
          </section>

          <section class="fast-grid">
            <div class="fast-card fast-stat"><div class="fast-stat-label">${esc(SUMMARY_MAP.fastStat1.label)}</div><div class="fast-stat-value" id="fastStat1">0</div><div class="fast-stat-note">Summary cepat dari backend</div></div>
            <div class="fast-card fast-stat"><div class="fast-stat-label">${esc(SUMMARY_MAP.fastStat2.label)}</div><div class="fast-stat-value" id="fastStat2">0</div><div class="fast-stat-note">Tanpa load semua ke browser</div></div>
            <div class="fast-card fast-stat"><div class="fast-stat-label">${esc(SUMMARY_MAP.fastStat3.label)}</div><div class="fast-stat-value" id="fastStat3">0</div><div class="fast-stat-note">Cache backend 10 menit</div></div>
            <div class="fast-card fast-stat"><div class="fast-stat-label">${esc(SUMMARY_MAP.fastStat4.label)}</div><div class="fast-stat-value" id="fastStat4">0</div><div class="fast-stat-note">Backend-side calculation</div></div>

            <div class="fast-card fast-filter">
              <div class="fast-filter-row">
                <div class="fast-field wide"><label>Kata Kunci</label><input class="fast-input" id="fastKeyword" placeholder="Cari paket, kode, OPD, penyedia, metode..."></div>
                <div class="fast-field small"><label>Tampil</label><select class="fast-select" id="fastLimit"><option>10</option><option>20</option><option>50</option></select></div>
                <div class="fast-field action"><button class="fast-btn primary" id="fastSearchBtn" type="button">Cari</button></div>
              </div>
            </div>

            <div class="fast-card fast-table-card">
              <div class="fast-table-head">
                <div>
                  <h2 class="fast-section-title">Daftar Data</h2>
                  <p class="fast-section-subtitle" id="fastInfo">Mengambil data...</p>
                </div>
              </div>
              <div class="fast-table-wrap">
                <table class="fast-table">
                  <thead id="fastHead"></thead>
                  <tbody id="fastBody"></tbody>
                </table>
              </div>
              <div class="fast-pagination">
                <div id="fastPageInfo">Page 1</div>
                <div class="fast-page-buttons">
                  <button class="fast-page-btn" id="fastPrev" type="button">‹</button>
                  <button class="fast-page-btn active" id="fastPageNum" type="button">1</button>
                  <button class="fast-page-btn" id="fastNext" type="button">›</button>
                </div>
              </div>
            </div>
          </section>
        </div>`;
    }

    function setLoading(){
      q('#fastHead').innerHTML = '';
      q('#fastBody').innerHTML = `<tr><td colspan="99"><div class="fast-loading" style="height:46px"></div></td></tr>`;
    }

    function renderTable(rows){
      const cols = COLUMNS && COLUMNS.length ? COLUMNS : inferColumns(rows);
      q('#fastHead').innerHTML = '<tr>' + cols.map(c => `<th>${esc(c.label || c.key)}</th>`).join('') + '</tr>';
      if(!rows.length){
        q('#fastBody').innerHTML = `<tr><td colspan="${cols.length || 1}">Belum ada data.</td></tr>`;
        return;
      }
      q('#fastBody').innerHTML = rows.map(row => {
        return '<tr>' + cols.map(c => {
          const raw = getAny(row, c.keys || [c.key]);
          const val = c.type === 'money' ? money(raw) : c.type === 'badge' ? badge(raw) : esc(raw || '-');
          return `<td>${val}</td>`;
        }).join('') + '</tr>';
      }).join('');
    }

    function inferColumns(rows){
      if(!rows.length) return [{key:'data', label:'Data'}];
      return Object.keys(rows[0]).slice(0,8).map(k => ({key:k, label:k}));
    }

    function exportCurrent(){
      if(!lastRows.length){ alert('Tidak ada data untuk diexport.'); return; }
      const cols = COLUMNS && COLUMNS.length ? COLUMNS : inferColumns(lastRows);
      const csv = [
        cols.map(c => csvCell(c.label || c.key)).join(','),
        ...lastRows.map(row => cols.map(c => csvCell(getAny(row, c.keys || [c.key]))).join(','))
      ].join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${MODULE}-${DATASET || 'data'}-page-${page}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function csvCell(v){
      const s = String(v == null ? '' : v).replace(/"/g,'""');
      return `"${s}"`;
    }

    function showError(msg){
      const el = q('#fastError');
      if(!el) return;
      el.textContent = msg;
      el.classList.add('show');
    }

    function clearError(){
      const el = q('#fastError');
      if(!el) return;
      el.textContent = '';
      el.classList.remove('show');
    }
  };

  function request(params, timeoutMs = 30000){
    return new Promise((resolve,reject)=>{
      if(!API_URL || API_URL.includes('ISI_URL_WEB_APP')){
        reject(new Error('URL backend FAST V2 belum diisi di file JS modul.'));
        return;
      }
      const cb = `__fastCb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = setTimeout(()=>{cleanup(); reject(new Error('Timeout mengambil data backend.'));}, timeoutMs);
      function cleanup(){ clearTimeout(timer); delete window[cb]; if(script.parentNode) script.parentNode.removeChild(script); }
      window[cb] = (payload) => { cleanup(); if(!payload || payload.ok === false) reject(new Error(payload && payload.message ? payload.message : 'Backend error.')); else resolve(payload); };
      const u = new URL(API_URL);
      Object.keys(params || {}).forEach(k => {
        if(params[k] !== undefined && params[k] !== null && String(params[k]) !== '') u.searchParams.set(k, params[k]);
      });
      u.searchParams.set('callback', cb);
      u.searchParams.set('_', Date.now());
      script.src = u.toString();
      script.async = true;
      script.onerror = () => { cleanup(); reject(new Error('Gagal memanggil backend.')); };
      document.head.appendChild(script);
    });
  }

  function getAny(row, keys){
    if(!row) return '';
    for(const key of keys){
      const k = normKey(key);
      if(Object.prototype.hasOwnProperty.call(row, k)) return row[k];
      if(Object.prototype.hasOwnProperty.call(row, key)) return row[key];
    }
    const all = Object.keys(row);
    for(const actual of all){
      const a = normKey(actual);
      for(const key of keys){
        if(a.includes(normKey(key))) return row[actual];
      }
    }
    return '';
  }

  function normKey(v){ return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function int(v){ return Number(v || 0).toLocaleString('id-ID'); }
  function decimal(v){ return Number(v || 0).toLocaleString('id-ID', {maximumFractionDigits:2}); }
  function money(v){
    const n = Number(String(v||'').replace(/[^\d.-]/g,'')) || Number(v) || 0;
    if(n >= 1e12) return 'Rp ' + (n/1e12).toLocaleString('id-ID',{maximumFractionDigits:2}) + ' T';
    if(n >= 1e9) return 'Rp ' + (n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2}) + ' M';
    if(n >= 1e6) return 'Rp ' + (n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1}) + ' Jt';
    return 'Rp ' + n.toLocaleString('id-ID');
  }
  function badge(v){
    const s = String(v || '-');
    const n = s.toLowerCase();
    let tone = 'gray';
    if(/selesai|completed|valid|sesuai|menang|aktif/.test(n)) tone = 'green';
    else if(/proses|berjalan|evaluasi|pengumuman|on process/.test(n)) tone = 'blue';
    else if(/perhatian|warning|sanggah|adendum|belum/.test(n)) tone = 'yellow';
    else if(/gagal|batal|error|tolak|dobel/.test(n)) tone = 'red';
    return `<span class="fast-badge ${tone}">${esc(s)}</span>`;
  }
  function esc(v){return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
})();
