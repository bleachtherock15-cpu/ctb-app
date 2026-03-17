// ═══════════════════════════════════════════════
//  app.js — SecureShare v4
// ═══════════════════════════════════════════════

/* ── Auth ────────────────────────────────────── */
let authMode = 'si';

window.addEventListener('DOMContentLoaded', async () => {
  if (Auth.isLoggedIn()) startApp();
});

function setMode(m) {
  authMode = m;
  document.getElementById('mb-si').className = 'mb-btn' + (m === 'si' ? ' on' : '');
  document.getElementById('mb-su').className = 'mb-btn' + (m === 'su' ? ' on' : '');
  const isLogin = m === 'si';
  document.getElementById('auth-title').textContent = isLogin ? 'เข้าสู่ระบบ' : 'สมัครใช้งาน';
  document.getElementById('auth-desc').textContent  = isLogin ? 'กรอกอีเมลและรหัสผ่านของคุณเพื่อเข้าใช้งาน' : 'กรอกข้อมูลเพื่อสร้างบัญชีใหม่';
  document.getElementById('a-btn').textContent      = isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
  document.getElementById('a-msg').innerHTML = '';
}

async function doAuth() {
  const email = document.getElementById('a-email').value.trim();
  const pass  = document.getElementById('a-pass').value;
  const msg   = document.getElementById('a-msg');
  const btn   = document.getElementById('a-btn');

  if (!email || !pass) { msg.innerHTML = '<div class="emsg">กรุณากรอกอีเมลและรหัสผ่าน</div>'; return; }
  if (pass.length < 6) { msg.innerHTML = '<div class="emsg">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</div>'; return; }

  btn.disabled = true;
  btn.textContent = authMode === 'si' ? 'กำลังเข้าสู่ระบบ...' : 'กำลังสมัครสมาชิก...';

  try {
    if (authMode === 'si') await Auth.login(email, pass);
    else await Auth.register(email, pass);
    startApp();
  } catch (err) {
    const map = {
      INVALID_CREDENTIALS:     'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      EMAIL_ALREADY_REGISTERED:'อีเมลนี้ถูกใช้งานแล้ว',
      INVALID_EMAIL_FORMAT:    'รูปแบบอีเมลไม่ถูกต้อง',
    };
    msg.innerHTML = `<div class="emsg">${map[err.message] || err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === 'si' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
  }
}

function startApp() {
  const user = Auth.getUser();
  document.getElementById('auth').classList.add('off');
  document.getElementById('app').style.display = 'flex';
  if (user) {
    document.getElementById('sb-email').textContent = user.email;
    document.getElementById('sb-av').textContent    = user.email[0].toUpperCase();
    document.getElementById('user-email').textContent = user.email;
  }
  goPage('dash');
  loadShares();
  setInterval(loadShares, 30000);
}

function signOut() { Auth.logout(); }

/* ── Navigation ──────────────────────────────── */
const PAGE_CFG = {
  dash: { cls: 'a-c', accent: 'var(--brand)' },
  hash: { cls: 'a-p', accent: 'var(--purple)' },
  url:  { cls: 'a-g', accent: 'var(--green)' },
  pass: { cls: 'a-a', accent: 'var(--amber)' },
  geo:  { cls: 'a-i', accent: 'var(--indigo)' },
};

const ALL_PAGES = ['dash', 'hash', 'url', 'pass', 'geo'];

/* ── Mobile nav toggle ──────────────────────────────────────── */
function toggleNav() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const open = sb.classList.toggle('mob-open');
  ov.classList.toggle('show', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeNav() {
  document.querySelector('.sidebar').classList.remove('mob-open');
  document.getElementById('sidebar-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

function goPage(p) {
  closeNav();
  document.querySelectorAll('.page').forEach(x => x.classList.remove('on'));
  document.getElementById('p-' + p).classList.add('on');
  // Lazy-load heavy libs on first visit to their page
  if (p === 'pass' && !window.zxcvbn)
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/zxcvbn/4.4.2/zxcvbn.js');


  ALL_PAGES.forEach(id => {
    const ni = document.getElementById('ni-' + id);
    if (ni) ni.className = 'ni';
  });

  const ni = document.getElementById('ni-' + p);
  if (ni) ni.classList.add(PAGE_CFG[p].cls);

  // Update icon colors
  ALL_PAGES.filter(id => id !== 'dash').forEach(id => {
    const ico = document.getElementById('ni-' + id + '-ico');
    if (ico) ico.setAttribute('stroke', id === p ? (PAGE_CFG[p]?.accent || 'var(--tx-3)') : 'var(--tx-3)');
  });
}

/* ── File Share ──────────────────────────────── */
let upFile = null;

function upDrop(e)  { e.preventDefault(); document.getElementById('up-dz').classList.remove('drag'); setUpFile(e.dataTransfer.files[0]); }
function upSelect(e){ setUpFile(e.target.files[0]); }

function setUpFile(f) {
  if (!f) return;
  upFile = f;
  document.getElementById('up-dz').classList.add('has-file');
  document.getElementById('up-dz-t').textContent = f.name;
  document.getElementById('up-dz-t').style.color = 'var(--tx-1)';
  document.getElementById('up-dz-s').textContent = fmtSz(f.size) + ' · ' + (f.type || 'unknown');
}

async function doUpload() {
  if (!upFile) { notify('กรุณาเลือกไฟล์ก่อน', true); return; }

  const btn = document.getElementById('up-btn');
  if (btn) btn.disabled = true;

  const pw  = document.getElementById('up-prog');
  const bar = document.getElementById('up-bar');
  const pct = document.getElementById('up-pct');
  pw.style.display = 'block';
  document.getElementById('up-err').innerHTML = '';

  try {
    const ttl      = document.getElementById('up-ttl').value;
    const maxDl    = document.getElementById('up-mdl').value;
    const password = document.getElementById('up-pw').value.trim();
    await Shares.upload(upFile, { ttl, maxDownloads: maxDl, password: password || undefined }, p => {
      bar.style.width   = p + '%';
      pct.textContent   = 'กำลังอัปโหลด... ' + p + '%';
    });
    bar.style.width = '100%';
    pct.textContent = 'อัปโหลดสำเร็จ!';
    notify('อัปโหลดสำเร็จ!');
    await loadShares();
    setTimeout(() => {
      pw.style.display = 'none';
      if (btn) btn.disabled = false;
      upFile = null;
      document.getElementById('up-dz').classList.remove('has-file');
      document.getElementById('up-dz-t').textContent = 'วางไฟล์ที่นี่เพื่ออัปโหลด';
      document.getElementById('up-dz-t').style.color = '';
      document.getElementById('up-dz-s').textContent = 'หรือคลิกเพื่อเลือกไฟล์ · ไม่เกิน 50 MB';
      document.getElementById('up-ttl').value = '24';
      document.getElementById('up-mdl').value = '';
      document.getElementById('up-pw').value = '';
    }, 800);
  } catch (err) {
    pw.style.display = 'none';
    if (btn) btn.disabled = false;
    document.getElementById('up-err').innerHTML = `<div class="emsg">${err.message}</div>`;
    notify('อัปโหลดล้มเหลว: ' + err.message, true);
  }
}

async function loadShares() {
  try {
    const { shares } = await Shares.list();
    renderShares(shares);
  } catch (e) { console.error(e); }
}

function renderShares(shares) {
  const activeCount = shares.filter(s => !s.expired && !s.limit_reached).length;
  document.getElementById('sh-cnt').textContent = '(' + activeCount + ')';
  const list = document.getElementById('sh-list');
  if (!shares.length) {
    list.innerHTML = '<div style="text-align:center;padding:28px;color:var(--tx-3);font-size:13px">ยังไม่มีการโอนไฟล์</div>';
    return;
  }
  list.innerHTML = shares.map(s => {
    const dead = s.expired || s.limit_reached;
    const tl   = ttlLeft(s.expires_at);
    const dotC = dead ? 'var(--tx-3)' : 'var(--green)';
    return `<div class="sr-wrap">
      <div class="sr ${dead ? 'dead' : ''}">
        <div class="sr-dot" style="background:${dotC};${dead ? '' : 'box-shadow:0 0 6px var(--green)'}"></div>
        <div class="sr-info">
          <div class="sr-name">${escHtml(s.original_name)}</div>
          <div class="sr-meta">
            <span>${fmtSz(s.file_size)}</span>
            <span style="${s.expired ? 'color:var(--red)' : ''}">หมดอายุ: ${tl}</span>
            <span style="${s.limit_reached ? 'color:var(--amber)' : ''}">ดาวน์โหลด: ${s.download_count}${s.max_downloads ? '/' + s.max_downloads : ''}</span>
            ${s.expired ? '<span class="badge bdg-red">หมดอายุแล้ว</span>' : ''}
            ${s.limit_reached ? '<span class="badge bdg-amber">ถึงขีดจำกัดแล้ว</span>' : ''}
          </div>
        </div>
        <div class="sr-act">
          ${!dead && s.has_password ? `<button class="btn btn-ghost btn-sm" onclick="openPwModal('${s.token}','${escHtml(s.original_name)}')">🔒 ดาวน์โหลด</button>` : ''}
          ${!dead && !s.has_password ? `<a class="btn btn-ghost btn-sm" href="${Shares.getDownloadUrl(s.token)}" download style="text-decoration:none" onclick="setTimeout(loadShares,1500)">ดาวน์โหลด</a>` : ''}
          ${!dead ? `<button class="btn btn-ghost btn-sm" onclick="copyShareLink('${s.token}',this)">คัดลอกลิงก์</button>` : ''}
          ${!dead ? `<button class="btn btn-ghost btn-sm" onclick="showQr('${s.token}','${escHtml(s.original_name)}')">QR</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="exportLogsPDF('${s.id}','${escHtml(s.original_name)}')" title="Export PDF">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6M9 11h6M9 18h4"/></svg>
            PDF
          </button>
          ${dead
            ? `<button title="ลบ" onclick="delShare('${s.id}')" style="width:34px;height:34px;border-radius:7px;border:none;background:#dc2626;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(220,38,38,.35);transition:all .15s" onmouseover="this.style.background='#b91c1c';this.style.transform='scale(1.05)'" onmouseout="this.style.background='#dc2626';this.style.transform='scale(1)'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
            : `<button class="btn btn-danger btn-sm" onclick="delShare('${s.id}')">ลบ</button>`}
        </div>
      </div>
      <div class="dl-logs" id="logs-${s.id}" style="display:none"></div>
    </div>`;
  }).join('');
}

function copyShareLink(token, btn) {
  const url = Shares.getShareLink(token);
  navigator.clipboard.writeText(url).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ คัดลอกแล้ว';
    setTimeout(() => btn.textContent = orig, 1800);
    notify('คัดลอกลิงก์แล้ว');
  });
}

async function delShare(id) {
  try {
    await Shares.delete(id);
    notify('ลบไฟล์แล้ว');
    await loadShares();
  } catch (err) { notify('ลบล้มเหลว: ' + err.message, true); }
}

/* ── Toolkit ─────────────────────────────────── */
function showTool(t) {
  document.querySelectorAll('.tp').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.kit-tab').forEach(b => b.classList.remove('kt-active'));
  document.getElementById('tp-' + t).classList.add('on');
  document.getElementById('tt-' + t).classList.add('kt-active');
}

/* HASH */
let hm = 'file', hFile = null;

function setHM(m) {
  hm = m;
  document.getElementById('h-fz').style.display = m === 'file' ? '' : 'none';
  document.getElementById('h-tz').style.display = m === 'text' ? '' : 'none';
  const f = document.getElementById('hm-file'), tx = document.getElementById('hm-text');
  if (m === 'file') { f.classList.add('kms-on'); tx.classList.remove('kms-on'); }
  else { tx.classList.add('kms-on'); f.classList.remove('kms-on'); }
}
function hfSel(e)  { hFile = e.target.files[0]; const fn = document.getElementById('h-fn'); fn.textContent = hFile.name; fn.style.color = 'var(--tx-1)'; }
function hfDrop(e) { e.preventDefault(); hFile = e.dataTransfer.files[0]; document.getElementById('h-fn').textContent = hFile.name; document.getElementById('h-fn').style.color = 'var(--tx-1)'; }

async function runHash() {
  const res = document.getElementById('h-res');
  res.classList.remove('on'); res.innerHTML = '';
  let buf;
  if (hm === 'file') {
    if (!hFile) { notify('กรุณาเลือกไฟล์ก่อน', true); return; }
    buf = await hFile.arrayBuffer();
  } else {
    const t = document.getElementById('h-ti').value;
    if (!t.trim()) { notify('กรุณากรอกข้อความก่อน', true); return; }
    buf = new TextEncoder().encode(t).buffer;
  }
  const hashes = await hashAll(buf);
  const meta = {
    md5:    { color: 'var(--amber)',  label: 'MD5' },
    sha1:   { color: 'var(--red)',    label: 'SHA-1' },
    sha256: { color: 'var(--brand)',  label: 'SHA-256' },
    sha384: { color: 'var(--purple)', label: 'SHA-384' },
    sha512: { color: 'var(--indigo)',  label: 'SHA-512' },
  };
  res.innerHTML = `<div class="card"><div class="cb">` +
    Object.entries(hashes).map(([k, v], i) => `
      <div class="hash-row" style="--i:${i};padding:14px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="badge" style="color:${meta[k].color};border-color:${meta[k].color}33;background:${meta[k].color}11">${meta[k].label}</span>
          <button onclick="cpText('${v}',this)" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--tx-3);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;transition:all .15s" onmouseover="this.style.color='var(--tx-1)';this.style.background='var(--bg-4)'" onmouseout="this.style.color='var(--tx-3)';this.style.background='none'">คัดลอก</button>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--tx-1);word-break:break-all;line-height:1.6">${v}</div>
      </div>`).join('') +
    `</div></div>`;
  res.classList.add('on');
}

function cpText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent; btn.textContent = '✓ คัดลอกแล้ว'; btn.style.color = 'var(--green)';
    const row = btn.closest('.hash-row');
    if (row) { row.classList.remove('copy-flash'); void row.offsetWidth; row.classList.add('copy-flash'); }
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
    notify('คัดลอกไปยังคลิปบอร์ดแล้ว');
  });
}

/* URL SCANNER */
function runUrl() {
  const raw = document.getElementById('url-inp').value.trim();
  if (!raw) return;
  const R   = analyzeUrl(raw);
  const cMap = { Low: 'var(--green)', Medium: 'var(--amber)', High: 'var(--red)' };
  const c    = cMap[R.riskLevel];
  const circ = 2 * Math.PI * 36;
  const res  = document.getElementById('url-res');
  res.innerHTML = `<div class="card"><div class="cb">
    <div style="display:flex;align-items:center;gap:20px;padding:16px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:16px">
      <svg width="84" height="84" viewBox="0 0 84 84" style="flex-shrink:0">
        <circle cx="42" cy="42" r="36" fill="none" stroke="var(--bg-4)" stroke-width="5" transform="rotate(-90 42 42)"/>
        <circle cx="42" cy="42" r="36" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - R.score / 100)).toFixed(1)}" style="filter:drop-shadow(0 0 6px ${c})"/>
        <text x="42" y="46" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="16" font-weight="500" fill="${c}">${R.score}</text>
      </svg>
      <div style="flex:1">
        <div class="badge mb8" style="color:${c};border-color:${c}44;background:${c}11">${R.riskLevel.toUpperCase()} RISK</div>
        <div style="font-size:14px;font-weight:700;color:var(--tx-1);margin-bottom:6px">${R.explanation}</div>
        <div class="ptrack"><div style="height:100%;width:${R.score}%;background:${c};transition:width .6s ease"></div></div>
      </div>
    </div>
    <div style="margin-bottom:12px"><label class="lbl">URL Analyzed</label><div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--tx-2);word-break:break-all;padding:10px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs)">${R.url}</div></div>
    ${R.indicators.length ? `<div><label class="lbl">Risk Indicators</label><div style="display:flex;flex-direction:column;gap:6px">${R.indicators.map(i => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:12px;color:var(--tx-2)"><span style="color:${c};flex-shrink:0">•</span>${i}</div>`).join('')}</div></div>` : ''}
  </div></div>`;
  res.classList.add('on');
}

function analyzeUrl(raw) {
  let url = raw.trim(); if (!url.startsWith('http')) url = 'https://' + url;
  let parsed; try { parsed = new URL(url); } catch { return { url: raw, riskLevel: 'High', score: 90, indicators: ['Invalid URL format'], explanation: 'Malformed URL.' }; }
  const host = parsed.hostname.toLowerCase(), path = parsed.pathname + parsed.search;
  let score = 0; const ind = [];
  const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rb.gy', 'cutt.ly'];
  const badTlds    = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.download', '.loan'];
  const phishKw    = ['login', 'signin', 'verify', 'secure', 'update', 'confirm', 'banking', 'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook', 'password', 'credential', 'wallet', 'prize', 'urgent', 'suspended', 'locked'];
  const legit      = ['google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'github.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'microsoft.com', 'apple.com', 'netflix.com'];
  if (parsed.protocol === 'http:') { score += 20; ind.push('Uses insecure HTTP instead of HTTPS'); }
  if (shorteners.some(s => host === s || host.endsWith('.' + s))) { score += 25; ind.push('URL shortener — real destination is hidden'); }
  const bt = badTlds.find(t => host.endsWith(t)); if (bt) { score += 20; ind.push('Suspicious TLD: ' + bt); }
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) { score += 35; ind.push('Raw IP address used instead of domain name'); }
  if (host.split('.').length > 4) { score += 15; ind.push('Excessive subdomains: ' + host); }
  const full = (host + path).toLowerCase(); const matched = phishKw.filter(k => full.includes(k));
  if (matched.length >= 2) { score += 22; ind.push('Multiple phishing keywords: ' + matched.slice(0, 3).join(', ')); }
  else if (matched.length === 1) { score += 9; ind.push('Phishing keyword detected: ' + matched[0]); }
  if (url.length > 200) { score += 10; ind.push('Abnormally long URL (possible obfuscation)'); }
  if (legit.some(l => host === l || host.endsWith('.' + l))) score = Math.max(0, score - 40);
  score = Math.min(100, Math.max(0, score));
  const lvl = score >= 60 ? 'High' : score >= 25 ? 'Medium' : 'Low';
  const exp = { Low: 'No significant threats detected. URL appears legitimate.', Medium: 'Some suspicious characteristics found. Verify before visiting.', High: 'Multiple risk indicators detected. Likely malicious URL.' };
  return { url: parsed.toString(), riskLevel: lvl, score, indicators: ind, explanation: exp[lvl] };
}

/* PASSWORD */
let pwVis = false;
function togglePw() { pwVis = !pwVis; document.getElementById('pw-inp').type = pwVis ? 'text' : 'password'; document.getElementById('pw-show').textContent = pwVis ? 'HIDE' : 'SHOW'; }
function runPw(pw) {
  if (!pw) { document.getElementById('pw-bar-wrap').style.display = 'none'; document.getElementById('pw-res').classList.remove('on'); return; }

  // Pattern detection
  const allSame      = /^(.)\1+$/.test(pw);
  const hasRepeat    = /(.)\1{2,}/.test(pw) || /(.{2,})\1{2,}/.test(pw);
  const hasKeyboard  = /qwerty|asdfgh|zxcvbn|qwer|asdf|zxcv|hjkl|yuiop|12345|23456|34567|45678|56789|67890|09876|98765/i.test(pw);
  const hasSeq       = /abcde|bcdef|cdefg|defgh|efghi|fghij|ghijk|hijkl|ijklm|jklmn|klmno|lmnop|mnopq|nopqr|opqrs|pqrst|qrstu|rstuv|stuvw|tuvwx|uvwxy|vwxyz|zyxwv|98765|87654|76543|65432|54321/i.test(pw);
  const uniqueRatio  = new Set(pw.split('')).size / pw.length;
  const lowVariety   = uniqueRatio < 0.4 && pw.length > 4;
  const leet         = pw.replace(/4/g,'a').replace(/3/g,'e').replace(/1/g,'i').replace(/0/g,'o').replace(/5/g,'s').replace(/@/g,'a').replace(/\$/g,'s');
  const commonLeet   = ['password','123456','qwerty','abc123','letmein','monkey','dragon','master','admin','login'].includes(leet.toLowerCase());

  // zxcvbn base analysis
  const z = window.zxcvbn ? zxcvbn(pw) : null;

  const checks = [
    { l: 'At least 8 characters',     p: pw.length >= 8 },
    { l: 'At least 12 characters',    p: pw.length >= 12 },
    { l: 'Lowercase letters',         p: /[a-z]/.test(pw) },
    { l: 'Uppercase letters',         p: /[A-Z]/.test(pw) },
    { l: 'Numbers',                   p: /[0-9]/.test(pw) },
    { l: 'Special characters',        p: /[^a-zA-Z0-9]/.test(pw) },
    { l: 'No repeated characters',    p: !hasRepeat },
    { l: 'No keyboard patterns',      p: !hasKeyboard },
    { l: 'No sequential characters',  p: !hasSeq },
    { l: 'Character variety (40%+)',  p: !lowVariety },
    { l: 'Not a common password',     p: !commonLeet && (!z || z.score >= 2) },
    { l: 'Not all same character',    p: !allSame },
  ];

  // Determine effective score (0-4) with pattern penalties
  let effectiveScore = z ? z.score : Math.min(4, Math.floor(pw.length / 4));
  if (allSame)                          effectiveScore = 0;
  else if (commonLeet)                  effectiveScore = Math.min(effectiveScore, 0);
  else if (hasKeyboard || hasSeq)       effectiveScore = Math.min(effectiveScore, 1);
  else if (hasRepeat || lowVariety)     effectiveScore = Math.min(effectiveScore, 2);

  const scoreMap = [
    { c: 'var(--red)',    w: '8%',   l: 'อันตราย'      },
    { c: '#e06c75',       w: '22%',  l: 'อ่อนแอ'       },
    { c: 'var(--amber)',  w: '48%',  l: 'พอใช้ได้'     },
    { c: 'var(--blue)',   w: '74%',  l: 'แข็งแกร่ง'    },
    { c: 'var(--green)', w: '100%', l: 'ปลอดภัยสูง'   },
  ];
  const cfg = scoreMap[effectiveScore];

  // Crack time from zxcvbn (more accurate) or fallback
  const ct = z
    ? z.crack_times_display.offline_fast_hashing_1e10_per_second
    : (() => { const pool = [/[a-z]/,/[A-Z]/,/[0-9]/,/[^a-zA-Z0-9]/].reduce((a,r,i)=>a+(r.test(pw)?[26,26,10,32][i]:0),0); const secs=Math.pow(2,pw.length*Math.log2(pool||1))/1e10; return secs<1?'Instant':secs<60?Math.round(secs)+'s':secs<3600?Math.round(secs/60)+' min':'Centuries+'; })();

  // Entropy bits
  const ent = z ? (z.guesses_log10 * Math.log2(10)).toFixed(1) : (pw.length * Math.log2(26)).toFixed(1);

  const score = Math.round(checks.filter(c => c.p).length / checks.length * 100);

  // Suggestions
  const sug = [];
  if (allSame)       sug.push('Avoid using the same character repeatedly (e.g. "aaaaaaa")');
  if (commonLeet)    sug.push('This is a common password even with substitutions');
  if (hasKeyboard)   sug.push('Avoid keyboard patterns (qwerty, asdfgh, etc.)');
  if (hasSeq)        sug.push('Avoid sequential characters (abcde, 12345, etc.)');
  if (hasRepeat)     sug.push('Reduce character repetition');
  if (lowVariety)    sug.push('Use more variety — too many repeated characters');
  if (z && z.feedback.warning) sug.push(z.feedback.warning);
  if (z) sug.push(...(z.feedback.suggestions || []));
  if (pw.length < 8)  sug.push('Use at least 8 characters');
  if (pw.length < 12) sug.push('Increase to 12+ characters for better security');
  if (!/[A-Z]/.test(pw)) sug.push('Add uppercase letters');
  if (!/[0-9]/.test(pw)) sug.push('Include numbers');
  if (!/[^a-zA-Z0-9]/.test(pw)) sug.push('Add special characters (!@#$%^&*)');
  const uniqSug = [...new Set(sug)];
  document.getElementById('pw-bar-wrap').style.display = '';
  document.getElementById('pw-str-lbl').textContent = cfg.l;
  document.getElementById('pw-str-lbl').style.color = cfg.c;
  document.getElementById('pw-ent-lbl').textContent = ent + ' bits';
  const segCount = [1, 2, 3, 4, 4][effectiveScore];
  document.querySelectorAll('.kit-pw-seg').forEach((s, i) => {
    s.classList.toggle('on', i < segCount);
    s.style.background = i < segCount ? cfg.c : '';
  });
  const res = document.getElementById('pw-res');
  res.innerHTML = `<div class="card"><div class="cb">
    <div class="g3 mb16">
      <div style="text-align:center;padding:14px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs)">
        <div style="font-size:11px;font-weight:600;color:var(--tx-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Score</div>
        <div style="font-size:24px;font-weight:800;color:${cfg.c}">${score}<span style="font-size:12px;opacity:.6">/100</span></div>
      </div>
      <div style="text-align:center;padding:14px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs)">
        <div style="font-size:11px;font-weight:600;color:var(--tx-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Length</div>
        <div style="font-size:24px;font-weight:800;color:${cfg.c}">${pw.length}</div>
      </div>
      <div style="text-align:center;padding:14px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--rs)">
        <div style="font-size:11px;font-weight:600;color:var(--tx-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Crack time</div>
        <div style="font-size:14px;font-weight:800;color:${cfg.c}">${ct}</div>
      </div>
    </div>
    <label class="lbl mb8">Security checklist</label>
    <div class="ck-grid mb12">${checks.map(c => `<div class="ck-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c.p ? 'var(--green)' : 'var(--tx-3)'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${c.p ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}</svg><span style="color:${c.p ? 'var(--tx-1)' : 'var(--tx-3)'}">${c.l}</span></div>`).join('')}</div>
    ${uniqSug.length ? `<label class="lbl mb8">Suggestions</label><div style="display:flex;flex-direction:column;gap:5px">${uniqSug.map(s => `<div style="font-size:12px;color:var(--tx-2);display:flex;gap:7px;align-items:center"><span style="color:var(--blue)">→</span>${s}</div>`).join('')}</div>` : ''}
  </div></div>`;
  res.classList.add('on');
}

/* FILE METADATA */
function metaSel(e)  { analyzeMeta(e.target.files[0]); }
function metaDrop(e) { e.preventDefault(); document.getElementById('meta-dz').classList.remove('drag'); analyzeMeta(e.dataTransfer.files[0]); }
function analyzeMeta(f) {
  if (!f) return;
  document.getElementById('meta-lbl').textContent = 'Analyzing: ' + f.name;
  const ext    = (f.name.match(/(\.[^.]+)$/) || [''])[0].toLowerCase();
  const execE  = new Set(['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.sh', '.jar', '.dmg', '.msi', '.dll', '.scr']);
  const execT  = new Set(['application/x-msdownload', 'application/x-executable', 'application/x-sh']);
  const isExec = execT.has(f.type) || execE.has(ext);
  const sus = [];
  if (isExec) sus.push('Executable file type: ' + (ext || f.type));
  if (!ext) sus.push('No file extension');
  if (f.size === 0) sus.push('File is empty (0 bytes)');
  const r = new FileReader();
  r.onload = e => {
    const arr   = new Uint8Array(e.target.result);
    const magic = Array.from(arr.slice(0, 8)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const res   = document.getElementById('meta-res');
    res.innerHTML = `<div class="card"><div class="cb">
      ${sus.length ? `<div class="emsg mb12"><strong>⚠ Threats detected</strong><br>${sus.map(s => '• ' + s).join('<br>')}</div>` : ''}
      <label class="lbl mb8">File Information</label>
      ${[['Filename', f.name], ['MIME Type', f.type || 'unknown'], ['Extension', ext || '(none)'], ['File Size', fmtSzD(f.size)], ['Last Modified', new Date(f.lastModified).toLocaleString()], ['Magic Bytes', magic]].map(([k, v]) => `<div class="mr"><span class="mk">${k}</span><span class="mv">${v}</span></div>`).join('')}
      ${isExec ? '<div class="wmsg mt12">⚡ Executable file — handle with caution</div>' : ''}
    </div></div>`;
    res.classList.add('on');
  };
  r.readAsArrayBuffer(f.slice(0, 16));
}

/* ── Lazy script loader ──────────────────────── */
const _loadedScripts = new Set();
function loadScript(src) {
  if (_loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.defer = true;
    s.onload = () => { _loadedScripts.add(src); resolve(); };
    s.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(s);
  });
}

/* ── Utilities ───────────────────────────────── */
function fmtSz(b)  { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function fmtSzD(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(2) + ' KB'; if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB'; return (b / 1073741824).toFixed(2) + ' GB'; }
function ttlLeft(exp) { if (!exp) return 'Never'; const d = new Date(exp) - Date.now(); if (d <= 0) return 'Expired'; const h = Math.floor(d / 3600000), days = Math.floor(h / 24); if (days > 0) return days + 'd ' + (h % 24) + 'h'; if (h > 0) return h + 'h'; return Math.floor(d / 60000) + 'm'; }
function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

let ntTimer;
function notify(msg, err = false) {
  const el   = document.getElementById('notif');
  const icon = document.getElementById('notif-icon');
  document.getElementById('notif-msg').textContent = msg;
  el.className = err ? 'on er' : 'on ok';
  if (err) icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
  else icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
  icon.setAttribute('stroke', err ? 'var(--red)' : 'var(--green)');
  clearTimeout(ntTimer);
  ntTimer = setTimeout(() => el.classList.remove('on', 'er', 'ok'), 2800);
}

// Fix: expose user-email element (sidebar)
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('user-email');
  if (!el) {
    const span = document.createElement('span');
    span.id = 'user-email';
    span.style.display = 'none';
    document.body.appendChild(span);
  }
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop',     e => e.preventDefault());

/* ── Password Modal ──────────────────────────── */
let _pwToken = null;

function openPwModal(token, filename) {
  _pwToken = token;
  document.getElementById('pw-filename').textContent = filename;
  document.getElementById('pw-input').value = '';
  document.getElementById('pw-err').style.display = 'none';
  const m = document.getElementById('pw-modal');
  m.style.display = 'flex';
  setTimeout(() => document.getElementById('pw-input').focus(), 50);
}

function closePwModal() {
  document.getElementById('pw-modal').style.display = 'none';
  _pwToken = null;
}

async function submitPwModal() {
  const pw  = document.getElementById('pw-input').value;
  const err = document.getElementById('pw-err');
  const btn = document.getElementById('pw-submit');
  if (!pw) { err.textContent = 'กรอกรหัสผ่านด้วย'; err.style.display = 'block'; return; }
  btn.disabled = true;
  btn.textContent = 'กำลังตรวจสอบ...';
  err.style.display = 'none';
  try {
    await Shares.downloadWithPassword(_pwToken, pw);
    closePwModal();
    notify('ดาวน์โหลดสำเร็จ!');
  } catch (e) {
    err.textContent = e.message === 'WRONG_PASSWORD' ? 'รหัสผ่านไม่ถูกต้อง' : e.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ดาวน์โหลด';
  }
}

function toggleUpPw() {
  const inp = document.getElementById('up-pw');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ── Download Logs ───────────────────────────── */
async function toggleLogs(shareId, btn) {
  const panel = document.getElementById('logs-' + shareId);
  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  panel.innerHTML = '<div style="padding:10px 14px;font-size:11px;color:var(--tx-3)">กำลังโหลด...</div>';
  try {
    const { logs } = await Shares.getLogs(shareId);
    if (!logs.length) {
      panel.innerHTML = '<div style="padding:10px 14px;font-size:12px;color:var(--tx-3);text-align:center">ยังไม่มีประวัติดาวน์โหลด</div>';
      return;
    }
    panel.innerHTML = `
      <div style="padding:8px 14px 4px;font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--tx-3);letter-spacing:.1em;text-transform:uppercase;border-top:1px solid var(--border)">ประวัติดาวน์โหลด (${logs.length})</div>
      ${logs.map((l, i) => {
        const ua    = parseUA(l.user_agent);
        const time  = new Date(l.downloaded_at).toLocaleString('th-TH', {dateStyle:'short',timeStyle:'short'});
        const flag  = countryFlag(l.country);
        return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 14px;border-top:1px solid var(--border);font-size:11px;${i%2===0?'background:var(--bg-1)':''}">
          <div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--tx-3);flex-shrink:0;min-width:18px;text-align:right;padding-top:1px">${i+1}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              <span style="font-family:\'JetBrains Mono\',monospace;font-weight:600;color:var(--cyan)">${l.ip}</span>
              ${l.country ? `<span style="background:rgba(2,132,199,.08);border:1px solid rgba(2,132,199,.15);border-radius:4px;padding:1px 6px;font-size:10px;color:var(--tx-2)">${flag} ${l.country}</span>` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <span style="color:var(--tx-2)">${ua}</span>
              <span style="color:var(--tx-3);margin-left:auto;flex-shrink:0">${time}</span>
            </div>
          </div>
        </div>`;
      }).join('')}`;
  } catch(e) {
    panel.innerHTML = `<div style="padding:10px 14px;font-size:12px;color:var(--red)">โหลด logs ไม่ได้: ${e.message}</div>`;
  }
}

function parseUA(ua) {
  if (!ua) return 'Unknown';
  if (/iPhone|iPad/.test(ua))        return '📱 iOS';
  if (/Android/.test(ua))            return '📱 Android';
  if (/Windows/.test(ua))            return '🖥️ Windows';
  if (/Macintosh|Mac OS/.test(ua))   return '🖥️ macOS';
  if (/Linux/.test(ua))              return '🖥️ Linux';
  return '🌐 Browser';
}

function countryFlag(country) {
  if (!country) return '';
  const flags = { 'Thailand':'🇹🇭','United States':'🇺🇸','Japan':'🇯🇵','China':'🇨🇳','United Kingdom':'🇬🇧','Germany':'🇩🇪','France':'🇫🇷','Singapore':'🇸🇬','South Korea':'🇰🇷','Australia':'🇦🇺','India':'🇮🇳','Canada':'🇨🇦' };
  return flags[country] || '🌍';
}

function parseUA_text(ua) {
  if (!ua) return 'Unknown';
  if (/iPhone|iPad/.test(ua))       return 'iOS';
  if (/Android/.test(ua))           return 'Android';
  if (/Windows/.test(ua))           return 'Windows';
  if (/Macintosh|Mac OS/.test(ua))  return 'macOS';
  if (/Linux/.test(ua))             return 'Linux';
  return 'Browser';
}

/* ── Export Logs PDF ─────────────────────────── */
/* ── QR Code ─────────────────────────────────── */
async function showQr(token, filename) {
  if (!window.QRCode)
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
  const url = Shares.getShareLink(token);
  document.getElementById('qr-filename').textContent = filename;
  const container = document.getElementById('qr-canvas');
  container.innerHTML = '';
  new QRCode(container, {
    text: url,
    width: 220,
    height: 220,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
  const modal = document.getElementById('qr-modal');
  modal.style.display = 'flex';
}

function closeQrModal() {
  document.getElementById('qr-modal').style.display = 'none';
}

function downloadQrImage() {
  const canvas = document.querySelector('#qr-canvas canvas');
  if (!canvas) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  const name = document.getElementById('qr-filename').textContent.replace(/[^a-z0-9_\-\.]/gi, '_');
  a.download = `QR_${name}.png`;
  a.click();
}

document.getElementById('qr-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('qr-modal')) closeQrModal();
});

async function exportLogsPDF(shareId, filename) {
  notify('กำลังสร้าง PDF...');
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
  }
  let logs = [];
  try {
    const res = await Shares.getLogs(shareId);
    logs = res.logs;
  } catch(e) { notify('โหลด logs ไม่ได้', true); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(167, 59, 36);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CTB - Cyber Tool Box', 10, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Download Activity Report', 10, 16.5);

  // Filename + date (top right)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const fnTrunc = filename.length > 40 ? filename.slice(0, 37) + '...' : filename;
  doc.text(fnTrunc, pageW - 10, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Generated: ' + now, pageW - 10, 15, { align: 'right' });

  // Info boxes
  doc.setTextColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 24, 88, 16, 2, 2, 'F');
  doc.roundedRect(102, 24, 88, 16, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('FILE NAME', 14, 30);
  doc.text('TOTAL DOWNLOADS', 106, 30);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(fnTrunc, 14, 37);
  doc.setTextColor(29, 78, 216);
  doc.text(logs.length + ' times', 106, 37);

  // Table
  doc.setFont('helvetica', 'normal');
  const tableRows = logs.length ? logs.map((l, i) => {
    const ua  = parseUA_text(l.user_agent);
    const loc = l.country || '-';
    const time = new Date(l.downloaded_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return [i + 1, l.ip || '-', loc, ua, time];
  }) : [['', '', 'No download history', '', '']];

  doc.autoTable({
    startY: 46,
    head: [['#', 'IP Address', 'Country', 'Device', 'Downloaded At']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 37 },
    },
    margin: { left: 10, right: 10 },
  });

  // Footer
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 200;
  doc.setDrawColor(226, 232, 240);
  doc.line(10, finalY, pageW - 10, finalY);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CTB - Cyber Tool Box  |  Auto-generated report  |  ' + now, pageW / 2, finalY + 5, { align: 'center' });

  const safeName = filename.replace(/[^a-z0-9_\-\.]/gi, '_');
  doc.save(`CTB_DownloadReport_${safeName}.pdf`);
  notify('ดาวน์โหลด PDF เรียบร้อย');
}
