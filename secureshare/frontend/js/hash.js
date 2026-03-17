// ═══════════════════════════════════════════════
//  hash.js — Hash + Cipher + Encode
// ═══════════════════════════════════════════════

// ── MD5 (pure JS, no Web Crypto) ────────────────
function md5(data) {
  function sa(x, y) { var l = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xffff); }
  function rl(x, n) { return (x << n) | (x >>> (32 - n)); }
  function cm(q, a, b, x, s, t) { return sa(rl(sa(sa(a, q), sa(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
  const n = data.length, nB = n * 8;
  const ex = ((n % 64) < 56 ? 56 : 120) - (n % 64);
  const pd = new Uint8Array(n + ex + 8); pd.set(data); pd[n] = 0x80;
  const dv = new DataView(pd.buffer);
  dv.setUint32(n + ex, nB & 0xffffffff, true); dv.setUint32(n + ex + 4, Math.floor(nB / 2 ** 32), true);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  for (let i = 0; i < pd.length; i += 64) {
    const M = new Int32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getInt32(i + j * 4, true);
    let aa = a, bb = b, cc = c, dd = d;
    a = ff(a, b, c, d, M[0], 7, -680876936); d = ff(d, a, b, c, M[1], 12, -389564586); c = ff(c, d, a, b, M[2], 17, 606105819); b = ff(b, c, d, a, M[3], 22, -1044525330);
    a = ff(a, b, c, d, M[4], 7, -176418897); d = ff(d, a, b, c, M[5], 12, 1200080426); c = ff(c, d, a, b, M[6], 17, -1473231341); b = ff(b, c, d, a, M[7], 22, -45705983);
    a = ff(a, b, c, d, M[8], 7, 1770035416); d = ff(d, a, b, c, M[9], 12, -1958414417); c = ff(c, d, a, b, M[10], 17, -42063); b = ff(b, c, d, a, M[11], 22, -1990404162);
    a = ff(a, b, c, d, M[12], 7, 1804603682); d = ff(d, a, b, c, M[13], 12, -40341101); c = ff(c, d, a, b, M[14], 17, -1502002290); b = ff(b, c, d, a, M[15], 22, 1236535329);
    a = gg(a, b, c, d, M[1], 5, -165796510); d = gg(d, a, b, c, M[6], 9, -1069501632); c = gg(c, d, a, b, M[11], 14, 643717713); b = gg(b, c, d, a, M[0], 20, -373897302);
    a = gg(a, b, c, d, M[5], 5, -701558691); d = gg(d, a, b, c, M[10], 9, 38016083); c = gg(c, d, a, b, M[15], 14, -660478335); b = gg(b, c, d, a, M[4], 20, -405537848);
    a = gg(a, b, c, d, M[9], 5, 568446438); d = gg(d, a, b, c, M[14], 9, -1019803690); c = gg(c, d, a, b, M[3], 14, -187363961); b = gg(b, c, d, a, M[8], 20, 1163531501);
    a = gg(a, b, c, d, M[13], 5, -1444681467); d = gg(d, a, b, c, M[2], 9, -51403784); c = gg(c, d, a, b, M[7], 14, 1735328473); b = gg(b, c, d, a, M[12], 20, -1926607734);
    a = hh(a, b, c, d, M[5], 4, -378558); d = hh(d, a, b, c, M[8], 11, -2022574463); c = hh(c, d, a, b, M[11], 16, 1839030562); b = hh(b, c, d, a, M[14], 23, -35309556);
    a = hh(a, b, c, d, M[1], 4, -1530992060); d = hh(d, a, b, c, M[4], 11, 1272893353); c = hh(c, d, a, b, M[7], 16, -155497632); b = hh(b, c, d, a, M[10], 23, -1094730640);
    a = hh(a, b, c, d, M[13], 4, 681279174); d = hh(d, a, b, c, M[0], 11, -358537222); c = hh(c, d, a, b, M[3], 16, -722521979); b = hh(b, c, d, a, M[6], 23, 76029189);
    a = hh(a, b, c, d, M[9], 4, -640364487); d = hh(d, a, b, c, M[12], 11, -421815835); c = hh(c, d, a, b, M[15], 16, 530742520); b = hh(b, c, d, a, M[2], 23, -995338651);
    a = ii(a, b, c, d, M[0], 6, -198630844); d = ii(d, a, b, c, M[7], 10, 1126891415); c = ii(c, d, a, b, M[14], 15, -1416354905); b = ii(b, c, d, a, M[5], 21, -57434055);
    a = ii(a, b, c, d, M[12], 6, 1700485571); d = ii(d, a, b, c, M[3], 10, -1894986606); c = ii(c, d, a, b, M[10], 15, -1051523); b = ii(b, c, d, a, M[1], 21, -2054922799);
    a = ii(a, b, c, d, M[8], 6, 1873313359); d = ii(d, a, b, c, M[15], 10, -30611744); c = ii(c, d, a, b, M[6], 15, -1560198380); b = ii(b, c, d, a, M[13], 21, 1309151649);
    a = ii(a, b, c, d, M[4], 6, -145523070); d = ii(d, a, b, c, M[11], 10, -1120210379); c = ii(c, d, a, b, M[2], 15, 718787259); b = ii(b, c, d, a, M[9], 21, -343485551);
    a = sa(a, aa); b = sa(b, bb); c = sa(c, cc); d = sa(d, dd);
  }
  return Array.from(new Uint8Array(new Int32Array([a, b, c, d]).buffer))
    .map(x => x.toString(16).padStart(2, '0')).join('');
}

// ── Hash all (MD5 + SHA-1/256/384/512) ──────────
async function hashAll(buf) {
  const h = a => Array.from(new Uint8Array(a)).map(b => b.toString(16).padStart(2, '0')).join('');
  const [s1, s256, s384, s512] = await Promise.all([
    crypto.subtle.digest('SHA-1',   buf),
    crypto.subtle.digest('SHA-256', buf),
    crypto.subtle.digest('SHA-384', buf),
    crypto.subtle.digest('SHA-512', buf),
  ]);
  return {
    md5:    md5(new Uint8Array(buf)),
    sha1:   h(s1),
    sha256: h(s256),
    sha384: h(s384),
    sha512: h(s512),
  };
}

// ── Hash tab switcher ────────────────────────────
function setHashTab(tab) {
  ['hash', 'cipher'].forEach(t => {
    document.getElementById('hp-' + t).classList.toggle('on', t === tab);
    const btn = document.getElementById('ht-' + t);
    if (btn) { btn.classList.toggle('tm', t === tab); btn.classList.toggle('tc', false); }
  });
}

// ════════════════════════════════════════════════
//  CIPHER — AES (CryptoJS) + RSA (Web Crypto API)
// ════════════════════════════════════════════════

let _rsaKeyPair = null; // { publicKey, privateKey } CryptoKey objects

function onAlgoChange() {
  const algo = document.getElementById('enc-algo').value;
  const isRsa = algo.startsWith('RSA');
  document.getElementById('aes-key-wrap').style.display = isRsa ? 'none' : '';
  document.getElementById('enc-mode-wrap').style.display = isRsa ? 'none' : '';
  document.getElementById('rsa-key-wrap').style.display  = isRsa ? '' : 'none';
  document.getElementById('enc-key-hint').textContent = isRsa ? '' :
    'AES: คีย์ใดก็ได้ (แนะนำ 16+ ตัวอักษร)';
}

function genEncKey() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  document.getElementById('enc-key').value =
    Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32);
}

// ── AES via CryptoJS ──────────────────────────
function _aesOpts() {
  const mode = document.getElementById('enc-mode').value;
  return { mode: CryptoJS.mode[mode] || CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 };
}

// ── RSA via Web Crypto API ────────────────────
async function genRsaKeyPair() {
  const algo  = document.getElementById('enc-algo').value;
  const bits  = algo === 'RSA-4096' ? 4096 : 2048;
  const btn   = document.getElementById('rsa-gen-btn');
  btn.disabled = true; btn.textContent = 'กำลังสร้าง...';
  try {
    _rsaKeyPair = await crypto.subtle.generateKey(
      { name:'RSA-OAEP', modulusLength:bits, publicExponent:new Uint8Array([1,0,1]), hash:'SHA-256' },
      true, ['encrypt','decrypt']
    );
    const [pubDer, privDer] = await Promise.all([
      crypto.subtle.exportKey('spki',  _rsaKeyPair.publicKey),
      crypto.subtle.exportKey('pkcs8', _rsaKeyPair.privateKey),
    ]);
    const toPem = (der, type) => `-----BEGIN ${type}-----\n` +
      btoa(String.fromCharCode(...new Uint8Array(der))).match(/.{1,64}/g).join('\n') +
      `\n-----END ${type}-----`;
    document.getElementById('rsa-pub').value  = toPem(pubDer,  'PUBLIC KEY');
    document.getElementById('rsa-priv').value = toPem(privDer, 'PRIVATE KEY');
    document.getElementById('rsa-keys').style.display = '';
    notify('สร้าง RSA Key Pair สำเร็จ');
  } catch(e) { notify('สร้าง Key Pair ไม่สำเร็จ: ' + e.message, true); }
  btn.disabled = false; btn.textContent = 'สร้างใหม่';
}

async function runEncrypt() {
  const algo  = document.getElementById('enc-algo').value;
  const input = document.getElementById('enc-input').value;
  if (!input) { notify('กรอกข้อความที่ต้องการเข้ารหัส', true); return; }

  if (algo.startsWith('RSA')) {
    if (!_rsaKeyPair) { notify('กด "สร้าง Key Pair" ก่อน', true); return; }
    try {
      const enc = await crypto.subtle.encrypt(
        { name:'RSA-OAEP' }, _rsaKeyPair.publicKey, new TextEncoder().encode(input)
      );
      const b64 = btoa(String.fromCharCode(...new Uint8Array(enc)));
      _showCipherResult(b64, algo, 'encrypt');
    } catch(e) { notify('RSA Encrypt ไม่สำเร็จ: ' + e.message, true); }
  } else {
    const key = document.getElementById('enc-key').value.trim();
    if (!key) { notify('กรอก Secret Key ก่อน', true); return; }
    try {
      const encrypted = CryptoJS.AES.encrypt(input, key, _aesOpts()).toString();
      _showCipherResult(encrypted, algo, 'encrypt');
    } catch(e) { notify('AES Encrypt ไม่สำเร็จ: ' + e.message, true); }
  }
}

async function runDecrypt() {
  const algo  = document.getElementById('enc-algo').value;
  const input = document.getElementById('enc-input').value.trim();
  if (!input) { notify('กรอก Ciphertext ที่ต้องการถอดรหัส', true); return; }

  if (algo.startsWith('RSA')) {
    if (!_rsaKeyPair) { notify('ต้องใช้ Private Key จาก Key Pair เดิม', true); return; }
    try {
      const raw = Uint8Array.from(atob(input), c => c.charCodeAt(0));
      const dec = await crypto.subtle.decrypt({ name:'RSA-OAEP' }, _rsaKeyPair.privateKey, raw);
      _showCipherResult(new TextDecoder().decode(dec), algo, 'decrypt');
    } catch(e) { notify('RSA Decrypt ไม่สำเร็จ: ' + e.message, true); }
  } else {
    const key = document.getElementById('enc-key').value.trim();
    if (!key) { notify('กรอก Secret Key ก่อน', true); return; }
    try {
      const dec = CryptoJS.AES.decrypt(input, key, _aesOpts()).toString(CryptoJS.enc.Utf8);
      if (!dec) throw new Error('คีย์ไม่ถูกต้อง หรือ ciphertext เสียหาย');
      _showCipherResult(dec, algo, 'decrypt');
    } catch(e) { notify('AES Decrypt ไม่สำเร็จ: ' + e.message, true); }
  }
}

function _showCipherResult(output, algo, op) {
  const isStream = ['Rabbit', 'RC4'].includes(algo);
  const mode  = isStream ? '' : ('-' + (document.getElementById('enc-mode').value));
  const label = algo + mode;
  const opTh  = op === 'encrypt' ? 'Ciphertext (เข้ารหัสแล้ว)' : 'Plaintext (ถอดรหัสแล้ว)';
  const color = op === 'encrypt' ? 'var(--cyan)' : 'var(--purple)';
  const res   = document.getElementById('enc-res');
  res.classList.add('on');
  res.innerHTML = `
    <div class="card" style="border-left:3px solid ${color}">
      <div class="card-header">
        <span class="badge" style="color:${color};border-color:${color}40;background:${color}18">${label}</span>
        <div class="card-title">${opTh}</div>
      </div>
      <div class="cb" style="padding:16px">
        <div class="term" style="word-break:break-all;line-height:1.9;font-size:11px;white-space:pre-wrap;max-height:260px;overflow-y:auto">${escHtml(output)}</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(window._cipherOut).then(()=>notify('คัดลอกแล้ว'))">คัดลอก</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('enc-input').value=window._cipherOut;notify('วางลง Input แล้ว')">ใส่ Input</button>
        </div>
      </div>
    </div>`;
  window._cipherOut = output;
}

// ════════════════════════════════════════════════
//  ENCODE — Base64 / Hex / Binary / URL / ROT13 / Caesar
// ════════════════════════════════════════════════

let encodeMethod = 'base64';

function setEncodeMethod(m) {
  encodeMethod = m;
  document.querySelectorAll('.enc-method-btn').forEach(b =>
    b.classList.toggle('kms-on', b.dataset.m === m)
  );
  document.getElementById('caesar-shift-wrap').style.display = m === 'caesar' ? 'flex' : 'none';
}

function runEncode() {
  const input = document.getElementById('cod-input').value;
  if (!input) { notify('กรอกข้อความก่อน', true); return; }
  try {
    _showEncodeResult(_encode(input), 'encode');
  } catch(e) { notify('แปลงไม่สำเร็จ: ' + e.message, true); }
}

function runDecode() {
  const input = document.getElementById('cod-input').value;
  if (!input) { notify('กรอกข้อความก่อน', true); return; }
  try {
    _showEncodeResult(_decode(input), 'decode');
  } catch(e) { notify('แปลงกลับไม่สำเร็จ: ' + e.message, true); }
}

function _encode(input) {
  const shift = parseInt(document.getElementById('caesar-shift')?.value) || 3;
  switch (encodeMethod) {
    case 'base64':  return btoa(unescape(encodeURIComponent(input)));
    case 'hex':     return Array.from(new TextEncoder().encode(input)).map(b => b.toString(16).padStart(2,'0')).join(' ');
    case 'binary':  return Array.from(new TextEncoder().encode(input)).map(b => b.toString(2).padStart(8,'0')).join(' ');
    case 'url':     return encodeURIComponent(input);
    case 'rot13':   return _rot13(input);
    case 'caesar':  return _caesar(input, shift);
    default: return input;
  }
}

function _decode(input) {
  const shift = parseInt(document.getElementById('caesar-shift')?.value) || 3;
  switch (encodeMethod) {
    case 'base64':  return decodeURIComponent(escape(atob(input.trim())));
    case 'hex':     return new TextDecoder().decode(new Uint8Array(input.match(/[0-9a-fA-F]{2}/g).map(h => parseInt(h, 16))));
    case 'binary':  return new TextDecoder().decode(new Uint8Array(input.trim().split(/\s+/).map(b => parseInt(b, 2))));
    case 'url':     return decodeURIComponent(input);
    case 'rot13':   return _rot13(input);
    case 'caesar':  return _caesar(input, 26 - shift);
    default: return input;
  }
}

function _rot13(s) {
  return s.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function _caesar(s, shift) {
  return s.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
}

const ENCODE_LABELS = {
  base64: 'Base64', hex: 'Hexadecimal', binary: 'Binary',
  url: 'URL Encoding', rot13: 'ROT13', caesar: 'Caesar Cipher',
};

function _showEncodeResult(output, op) {
  const color = op === 'encode' ? 'var(--green)' : 'var(--purple)';
  const opTh  = op === 'encode' ? 'Encoded Output' : 'Decoded Output';
  const label = ENCODE_LABELS[encodeMethod] || encodeMethod;
  const res   = document.getElementById('cod-res');
  res.classList.add('on');
  res.innerHTML = `
    <div class="card" style="border-left:3px solid ${color}">
      <div class="card-header">
        <span class="badge" style="color:${color};border-color:${color}40;background:${color}18">${label}</span>
        <div class="card-title">${opTh}</div>
      </div>
      <div class="cb" style="padding:16px">
        <div class="term" style="word-break:break-all;line-height:1.9;font-size:11px;white-space:pre-wrap;max-height:260px;overflow-y:auto">${escHtml(output)}</div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(window._cipherOut).then(()=>notify('คัดลอกแล้ว'))">คัดลอก</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('enc-input').value=window._cipherOut;notify('วางลง Input แล้ว')">ใส่ Input</button>
        </div>
      </div>
    </div>`;
  window._cipherOut = output;
}

// ════════════════════════════════════════════════
//  HASH LOOKUP — dictionary + numbers brute force
// ════════════════════════════════════════════════

const HASH_ALGO_BY_LEN = { 32:'MD5', 40:'SHA-1', 64:'SHA-256', 96:'SHA-384', 128:'SHA-512' };

// Top common passwords + words
const WORDLIST = [
  'password','123456','12345678','qwerty','abc123','monkey','1234567','letmein',
  'trustno1','dragon','baseball','iloveyou','master','sunshine','ashley','bailey',
  'passw0rd','shadow','123123','654321','superman','qazwsx','michael','football',
  'password1','princess','solo','welcome','charlie','donald','batman','zaq1zaq1',
  'pass','hello','admin','root','test','user','guest','login','password123',
  'qwerty123','love','sex','god','money','fuck','shit','bitch','ass','nigga',
  'jordan','harley','ranger','dakota','soccer','hockey','killer','george',
  'thomas','samuel','andrew','jessica','pepper','hunter','joshua','maggie',
  'robert','daniel','stephen','matthew','jennifer','summer','amanda','andrea',
  'pepper','cookie','cheese','butter','chocolate','coffee','banana','orange',
  'apple','mango','lemon','coconut','strawberry','blueberry','watermelon',
  'cat','dog','fish','bird','tiger','lion','bear','wolf','eagle','snake',
  'red','blue','green','yellow','black','white','purple','orange','pink',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'january','february','march','april','may','june','july','august',
  'september','october','november','december','monday','tuesday','wednesday',
  'thursday','friday','saturday','sunday','spring','summer','autumn','winter',
  'thailand','bangkok','khonkaen','kku','chiang','phuket','pattaya',
  'thai','english','chinese','japanese','korean','french','german','spanish',
  'facebook','twitter','google','youtube','instagram','tiktok','line','gmail',
  'qwert','asdfg','zxcvb','12345','11111','00000','99999','55555','88888',
  'abc','abcd','abcde','abcdef','abcdefg','abcdefgh','abcdefghi',
  'pass123','pass1234','admin123','root123','test123','user123','guest123',
  'p@ssw0rd','P@ssword','Pa$$word','P@$$w0rd','Passw0rd','Password1',
  'letmein1','welcome1','dragon1','sunshine1','princess1','master1',
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  'aa','bb','cc','dd','ee','ff','gg','hh','ii','jj','kk','ll','mm',
  'aaa','bbb','ccc','ddd','eee','fff','ggg','hhh','iii','jjj','kkk',
  'aaaa','bbbb','cccc','dddd','eeee','ffff','gggg','hhhh','iiii',
];

function detectHashAlgo(val) {
  const len = val.trim().length;
  const algo = HASH_ALGO_BY_LEN[len];
  const hint = document.getElementById('rev-algo-hint');
  hint.textContent = algo ? `ตรวจพบ: ${algo}` : len > 0 ? 'ไม่รู้จักความยาวนี้' : '';
  hint.style.color = algo ? 'var(--cyan)' : 'var(--amber)';
}

let _lookupRunning = false;
async function runHashLookup() {
  if (_lookupRunning) return;
  const hash = document.getElementById('rev-hash').value.trim().toLowerCase();
  if (!hash) { notify('กรอก Hash ก่อน', true); return; }

  const algo = HASH_ALGO_BY_LEN[hash.length];
  if (!algo) { notify('ความยาว Hash ไม่ถูกต้อง — ตรวจสอบว่าวาง Hash ถูกต้อง', true); return; }

  _lookupRunning = true;
  const lookupBtn = document.querySelector('[onclick="runHashLookup()"]');
  if (lookupBtn) { lookupBtn.disabled = true; lookupBtn.textContent = 'กำลังค้นหา...'; }

  const res = document.getElementById('rev-res');
  res.classList.add('on');
  res.innerHTML = `<div class="card"><div class="cb" style="padding:16px;text-align:center;color:var(--tx-3)">
    <div style="margin-bottom:8px">กำลังค้นหา ${algo}...</div>
    <div class="ptrack" style="max-width:300px;margin:0 auto"><div class="pfill pf-teal" id="rev-prog" style="width:0%;transition:width .1s"></div></div>
  </div></div>`;

  const enc = new TextEncoder();
  const h = a => Array.from(new Uint8Array(a)).map(b => b.toString(16).padStart(2,'0')).join('');

  // Build candidates: wordlist + numbers 0-9999
  const candidates = [...WORDLIST];
  for (let i = 0; i <= 9999; i++) candidates.push(String(i));
  const total = candidates.length;

  const hashOne = async (word) => {
    const buf = enc.encode(word).buffer;
    if (algo === 'MD5') return md5(new Uint8Array(buf));
    const name = algo === 'SHA-1' ? 'SHA-1' : algo;
    return h(await crypto.subtle.digest(name, buf));
  };

  // Process in batches of 200
  const BATCH = 200;
  let found = null;
  for (let i = 0; i < total; i += BATCH) {
    const chunk = candidates.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map(async w => ({ w, d: await hashOne(w) })));
    found = results.find(r => r.d === hash);
    if (found) break;
    // Update progress bar
    const prog = document.getElementById('rev-prog');
    if (prog) prog.style.width = Math.min(100, ((i + BATCH) / total * 100)).toFixed(0) + '%';
    await new Promise(r => setTimeout(r, 0)); // yield to UI
  }

  if (found) {
    res.innerHTML = `
      <div class="card" style="border-left:3px solid var(--green)">
        <div class="card-header">
          <span class="badge bdg-green">พบข้อมูลต้นฉบับ</span>
          <div class="card-title">${algo} → Plaintext</div>
        </div>
        <div class="cb" style="padding:16px">
          <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--tx-1);margin-bottom:8px">${escHtml(found.w)}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--tx-3);margin-bottom:12px">${hash}</div>
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(found.w)}).then(()=>notify('คัดลอกแล้ว'))">คัดลอก</button>
        </div>
      </div>`;
  } else {
    res.innerHTML = `
      <div class="card" style="border-left:3px solid var(--amber)">
        <div class="card-header">
          <span class="badge bdg-amber">ไม่พบในฐานข้อมูล</span>
          <div class="card-title">ค้นหา ${total.toLocaleString()} candidates แล้ว</div>
        </div>
        <div class="cb" style="padding:16px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--tx-3);line-height:1.6">
          ข้อมูลต้นฉบับไม่อยู่ใน wordlist — อาจเป็นรหัสผ่านที่ซับซ้อนหรือข้อความยาว ซึ่ง hash จะไม่สามารถถอดได้
        </div>
      </div>`;
  }
  _lookupRunning = false;
  if (lookupBtn) {
    lookupBtn.disabled = false;
    lookupBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> ค้นหา';
  }
}

window.detectHashAlgo  = detectHashAlgo;
window.runHashLookup   = runHashLookup;

window.md5             = md5;
window.hashAll         = hashAll;
window.setHashTab      = setHashTab;
window.onAlgoChange    = onAlgoChange;
window.genEncKey       = genEncKey;
window.genRsaKeyPair   = genRsaKeyPair;
window.runEncrypt      = runEncrypt;
window.runDecrypt      = runDecrypt;
window.setEncodeMethod = setEncodeMethod;
window.runEncode       = runEncode;
window.runDecode       = runDecode;
