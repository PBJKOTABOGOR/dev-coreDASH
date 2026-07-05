
(function(){
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzCeSXFiv7gqFPmuOvfc8ADcsmwGVDYQnpiADi7YQZeyj1nDNQOKQ0EIX5H0VobFJPt/exec';
  const SESSION_KEY = 'pemenang_pengadaan_fast_v2_session';
  const COLUMNS = {
    provider: [
      {label:'Tahun', keys:['tahun']},
      {label:'Nama Paket', keys:['nama_paket','namapaket']},
      {label:'Pemenang', keys:['nama_pemenang','pemenang','namapemenang']},
      {label:'Instansi', keys:['instansi']},
      {label:'LPSE', keys:['lpse']},
      {label:'Pagu', keys:['pagu'], type:'money'},
      {label:'HPS', keys:['hps'], type:'money'},
      {label:'Tahap/Status', keys:['tahap_aktif','tahapan','status'], type:'badge'}
    ],
    active: [
      {label:'Tahun', keys:['tahun']},
      {label:'Kode Paket', keys:['kode_paket','kode']},
      {label:'Nama Paket', keys:['nama_paket','namapaket']},
      {label:'Instansi', keys:['instansi']},
      {label:'Pemenang', keys:['nama_pemenang','pemenang','namapemenang']},
      {label:'Pagu', keys:['pagu'], type:'money'},
      {label:'Tahap Aktif', keys:['tahap_aktif','tahapan'], type:'badge'}
    ],
    ecat: [
      {label:'Tahun', keys:['tahun']},
      {label:'Kode Paket', keys:['kode_paket','kode']},
      {label:'Nama Paket', keys:['nama_paket','namapaket','nama_produk']},
      {label:'Penyedia', keys:['nama_pemenang','nama_penyedia','penyedia']},
      {label:'Instansi', keys:['instansi','satker']},
      {label:'Nilai', keys:['pagu','hps','total_nilai','nilai_paket'], type:'money'},
      {label:'Status', keys:['tahap_aktif','status_paket','status'], type:'badge'}
    ]
  };

  window.__moduleInit = function({container}) {
    const root = container || document;
    let dataset = 'provider';
    let page = 1;
    let totalPages = 1;
    let lastRows = [];

    render();
    bind();
    if(getSession()) showApp(); else showLogin();

    return function(){};

    function bind(){
      root.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-dataset]');
        if(tab){
          dataset = tab.dataset.dataset;
          page = 1;
          renderAppBody();
          loadSummary();
          search();
        }
      });
    }

    function render(){
      root.innerHTML = `
        <div class="fast-page">
          <div id="ppLogin"></div>
          <div id="ppApp" style="display:none"></div>
        </div>`;
    }

    function showLogin(){
      $('#ppLogin').style.display = '';
      $('#ppApp').style.display = 'none';
      $('#ppLogin').innerHTML = `
        <div class="fast-login">
          <div class="fast-login-card">
            <div class="fast-login-brand">
              <span class="fast-badge blue">Portal Nasional</span>
              <h2>Pemenang Pengadaan</h2>
              <p>Mode cepat: login dicek backend, data tidak ditarik semua. Pencarian dan pagination diproses di server.</p>
            </div>
            <div class="fast-login-form">
              <h3>Masuk ke Portal</h3>
              <p>Gunakan user id dan password yang sudah disiapkan.</p>
              <div class="fast-field" style="display:flex;grid-column:span 12;margin-bottom:12px"><label>User ID</label><input class="fast-input" id="ppUser"></div>
              <div class="fast-field" style="display:flex;grid-column:span 12;margin-bottom:12px"><label>Password</label><input class="fast-input" id="ppPass" type="password"></div>
              <button class="fast-btn primary" id="ppLoginBtn" type="button" style="width:100%">Masuk</button>
              <div class="fast-error" id="ppLoginError"></div>
            </div>
          </div>
        </div>`;
      $('#ppLoginBtn').addEventListener('click', login);
      $('#ppPass').addEventListener('keydown', e => { if(e.key === 'Enter') login(); });
    }

    function showApp(){
      $('#ppLogin').style.display = 'none';
      $('#ppApp').style.display = '';
      $('#ppApp').innerHTML = `
        <section class="fast-hero">
          <div>
            <h1 class="fast-title">Pemenang Pengadaan</h1>
            <p class="fast-subtitle">Pencarian penyedia, paket aktif, dan e-katalog dengan backend-side search. Cocok untuk data besar.</p>
            <div class="fast-error" id="fastError"></div>
          </div>
          <div class="fast-toolbar">
            <button class="fast-btn" id="ppLogout" type="button">Keluar</button>
            <button class="fast-btn primary" id="fastExport" type="button">Export Halaman Ini</button>
          </div>
        </section>
        <div class="fast-tabs">
          <button class="fast-tab active" data-dataset="provider">Paket Penyedia</button>
          <button class="fast-tab" data-dataset="active">Paket Aktif</button>
          <button class="fast-tab" data-dataset="ecat">E-Katalog</button>
        </div>
        <div id="ppBody"></div>`;
      $('#ppLogout').addEventListener('click', () => { localStorage.removeItem(SESSION_KEY); showLogin(); });
      $('#fastExport').addEventListener('click', exportCurrent);
      renderAppBody();
      loadSummary();
      search();
    }

    function renderAppBody(){
      root.querySelectorAll('.fast-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.dataset === dataset));
      $('#ppBody').innerHTML = `
        <section class="fast-grid">
          <div class="fast-card fast-stat"><div class="fast-stat-label">Penyedia</div><div class="fast-stat-value" id="statProvider">0</div><div class="fast-stat-note">Portal Penyedia</div></div>
          <div class="fast-card fast-stat"><div class="fast-stat-label">Paket Aktif</div><div class="fast-stat-value" id="statActive">0</div><div class="fast-stat-note">Paket berproses</div></div>
          <div class="fast-card fast-stat"><div class="fast-stat-label">E-Katalog</div><div class="fast-stat-value" id="statEcat">0</div><div class="fast-stat-note">Paket katalog</div></div>
          <div class="fast-card fast-stat"><div class="fast-stat-label">Instansi</div><div class="fast-stat-value" id="statInstansi">0</div><div class="fast-stat-note">Data gabungan</div></div>

          <div class="fast-card fast-filter">
            <div class="fast-filter-row">
              <div class="fast-field wide"><label>Kata Kunci</label><input class="fast-input" id="fastKeyword" placeholder="Cari penyedia, paket, instansi, LPSE..."></div>
              <div class="fast-field small"><label>Tampil</label><select class="fast-select" id="fastLimit"><option>10</option><option>20</option><option>50</option></select></div>
              <div class="fast-field action"><button class="fast-btn primary" id="fastSearchBtn" type="button">Cari</button></div>
            </div>
          </div>

          <div class="fast-card fast-table-card">
            <div class="fast-table-head"><div><h2 class="fast-section-title">Hasil Pencarian</h2><p class="fast-section-subtitle" id="fastInfo">Mengambil data...</p></div></div>
            <div class="fast-table-wrap"><table class="fast-table"><thead id="fastHead"></thead><tbody id="fastBody"></tbody></table></div>
            <div class="fast-pagination"><div id="fastPageInfo">Page 1</div><div class="fast-page-buttons"><button class="fast-page-btn" id="fastPrev">‹</button><button class="fast-page-btn active" id="fastPageNum">1</button><button class="fast-page-btn" id="fastNext">›</button></div></div>
          </div>
        </section>`;
      $('#fastSearchBtn').addEventListener('click', () => { page = 1; search(); });
      $('#fastKeyword').addEventListener('keydown', e => { if(e.key === 'Enter'){ page = 1; search(); } });
      $('#fastLimit').addEventListener('change', () => { page = 1; search(); });
      $('#fastPrev').addEventListener('click', () => { if(page > 1){ page--; search(); } });
      $('#fastNext').addEventListener('click', () => { if(page < totalPages){ page++; search(); } });
    }

    async function login(){
      try{
        const userId = $('#ppUser').value.trim();
        const password = $('#ppPass').value;
        $('#ppLoginBtn').disabled = true;
        $('#ppLoginBtn').textContent = 'Memeriksa...';
        const res = await request({module:'pemenang', action:'login', userId, password});
        localStorage.setItem(SESSION_KEY, JSON.stringify({userId:res.userId, loginAt:Date.now()}));
        showApp();
      }catch(err){
        const el = $('#ppLoginError');
        el.textContent = err.message || String(err);
        el.classList.add('show');
      }finally{
        const btn = $('#ppLoginBtn');
        if(btn){ btn.disabled = false; btn.textContent = 'Masuk'; }
      }
    }

    async function loadSummary(){
      try{
        const res = await request({module:'pemenang', action:'summary'});
        const s = res.summary || {};
        setText('statProvider', int(s.provider));
        setText('statActive', int(s.active));
        setText('statEcat', int(s.ecat));
        setText('statInstansi', int(s.instansi));
      }catch(err){ showError(err.message || String(err)); }
    }

    async function search(){
      try{
        setLoading();
        const keyword = $('#fastKeyword')?.value || '';
        const limit = $('#fastLimit')?.value || 10;
        const res = await request({module:'pemenang', action:'search', dataset, keyword, page, limit});
        lastRows = res.rows || [];
        totalPages = res.totalPages || 1;
        renderTable(lastRows);
        setText('fastInfo', `${int(res.total || 0)} data cocok • tampil ${int(lastRows.length)} data`);
        setText('fastPageInfo', `Page ${res.page || page} / ${res.totalPages || totalPages}`);
        setText('fastPageNum', String(res.page || page));
      }catch(err){
        showError(err.message || String(err));
        $('#fastBody').innerHTML = '<tr><td>Data gagal dimuat.</td></tr>';
      }
    }

    function renderTable(rows){
      const cols = COLUMNS[dataset] || COLUMNS.provider;
      $('#fastHead').innerHTML = '<tr>' + cols.map(c => `<th>${esc(c.label)}</th>`).join('') + '</tr>';
      if(!rows.length){ $('#fastBody').innerHTML = `<tr><td colspan="${cols.length}">Belum ada data.</td></tr>`; return; }
      $('#fastBody').innerHTML = rows.map(row => '<tr>' + cols.map(c => {
        const raw = getAny(row, c.keys);
        const val = c.type === 'money' ? money(raw) : c.type === 'badge' ? badge(raw) : esc(raw || '-');
        return `<td>${val}</td>`;
      }).join('') + '</tr>').join('');
    }

    function setLoading(){ $('#fastHead').innerHTML=''; $('#fastBody').innerHTML='<tr><td><div class="fast-loading" style="height:46px"></div></td></tr>'; }
    function showError(msg){ const el = $('#fastError'); if(el){ el.textContent = msg; el.classList.add('show'); } }
    function setText(id,v){ const el = $('#'+id); if(el) el.textContent = v; }
    function $(sel){ return root.querySelector(sel); }
    function getSession(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null} }
    function exportCurrent(){
      if(!lastRows.length){ alert('Tidak ada data untuk diexport.'); return; }
      const cols = COLUMNS[dataset] || COLUMNS.provider;
      const csv = [cols.map(c=>csvCell(c.label)).join(','), ...lastRows.map(r=>cols.map(c=>csvCell(getAny(r,c.keys))).join(','))].join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`pemenang-${dataset}-page-${page}.csv`; a.click(); URL.revokeObjectURL(a.href);
    }
  };

  function request(params, timeoutMs=30000){
    return new Promise((resolve,reject)=>{
      if(!API_URL || API_URL.includes('ISI_URL_WEB_APP')){ reject(new Error('URL backend FAST V2 belum diisi.')); return; }
      const cb = `__ppFast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const s = document.createElement('script');
      const t = setTimeout(()=>{clean();reject(new Error('Timeout mengambil data backend.'))}, timeoutMs);
      function clean(){clearTimeout(t); delete window[cb]; if(s.parentNode)s.parentNode.removeChild(s);}
      window[cb] = payload => { clean(); if(!payload || payload.ok === false) reject(new Error(payload && payload.message ? payload.message : 'Backend error.')); else resolve(payload); };
      const u = new URL(API_URL); Object.keys(params).forEach(k => { if(params[k] !== undefined && params[k] !== null && String(params[k]) !== '') u.searchParams.set(k, params[k]); });
      u.searchParams.set('callback', cb); u.searchParams.set('_', Date.now());
      s.src = u.toString(); s.async = true; s.onerror = () => { clean(); reject(new Error('Gagal memanggil backend.')); };
      document.head.appendChild(s);
    });
  }
  function getAny(row, keys){ if(!row)return''; for(const key of keys){ const k=normKey(key); if(Object.prototype.hasOwnProperty.call(row,k))return row[k]; if(Object.prototype.hasOwnProperty.call(row,key))return row[key]; } const all=Object.keys(row); for(const a of all){ for(const key of keys){ if(normKey(a).includes(normKey(key))) return row[a]; }} return''; }
  function normKey(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function int(v){return Number(v||0).toLocaleString('id-ID')}
  function money(v){const n=Number(String(v||'').replace(/[^\d.-]/g,''))||Number(v)||0;if(n>=1e12)return'Rp '+(n/1e12).toLocaleString('id-ID',{maximumFractionDigits:2})+' T';if(n>=1e9)return'Rp '+(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})+' M';if(n>=1e6)return'Rp '+(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' Jt';return'Rp '+n.toLocaleString('id-ID')}
  function badge(v){const s=String(v||'-'),n=s.toLowerCase();let tone='gray';if(/selesai|completed|valid|sesuai|menang|aktif/.test(n))tone='green';else if(/proses|berjalan|evaluasi|pengumuman|on process/.test(n))tone='blue';else if(/perhatian|warning|sanggah|adendum|belum/.test(n))tone='yellow';else if(/gagal|batal|error|tolak|dobel/.test(n))tone='red';return`<span class="fast-badge ${tone}">${esc(s)}</span>`}
  function csvCell(v){return`"${String(v==null?'':v).replace(/"/g,'""')}"`}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
})();
