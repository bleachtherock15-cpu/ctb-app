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
  ['hash', 'cipher', 'encode'].forEach(t => {
    document.getElementById('hp-' + t).classList.toggle('on', t === tab);
    const btn = document.getElementById('ht-' + t);
    btn.classList.toggle('tm', t === tab);
    btn.classList.toggle('tc', false);
  });
}

// ════════════════════════════════════════════════
//  CIPHER — AES / DES / 3DES / RC4 / Rabbit
// ════════════════════════════════════════════════

const ALGO_HINTS = {
  AES:    { base: 'AES',      hint: 'AES: คีย์ใดก็ได้ (แนะนำ 16+ ตัวอักษร)' },
  DES:    { base: 'DES',      hint: 'DES: คีย์ 8 ตัวอักษร — เก่า ใช้เพื่อศึกษา' },
  '3DES': { base: 'TripleDES',hint: 'Triple DES: คีย์ 24 ตัวอักษร — เก่า ใช้เพื่อศึกษา' },
  Rabbit: { base: 'Rabbit',   hint: 'Rabbit: Stream cipher — คีย์ใดก็ได้' },
  RC4:    { base: 'RC4',      hint: 'RC4: Stream cipher — ไม่ปลอดภัย ใช้เพื่อศึกษาเท่านั้น' },
};

function onAlgoChange() {
  const algo = document.getElementById('enc-algo').value;
  const isStream = ['Rabbit', 'RC4'].includes(algo);
  document.getElementById('enc-mode-wrap').style.display = isStream ? 'none' : '';
  document.getElementById('enc-key-hint').textContent = (ALGO_HINTS[algo] || {}).hint || '';
}

function genEncKey() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  document.getElementById('enc-key').value = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function _getCryptoObj(algo) {
  if (!window.CryptoJS) throw new Error('CryptoJS ไม่พร้อมใช้งาน');
  const map = { AES: CryptoJS.AES, DES: CryptoJS.DES, '3DES': CryptoJS.TripleDES, Rabbit: CryptoJS.Rabbit, RC4: CryptoJS.RC4 };
  return map[algo] || CryptoJS.AES;
}

function _getOpts(algo) {
  if (['Rabbit', 'RC4'].includes(algo)) return {};
  const mode = document.getElementById('enc-mode').value;
  return {
    mode:    CryptoJS.mode[mode] || CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  };
}

function runEncrypt() {
  const algo  = document.getElementById('enc-algo').value;
  const key   = document.getElementById('enc-key').value.trim();
  const input = document.getElementById('enc-input').value;
  if (!key)   { notify('กรอก Secret Key ก่อน', true); return; }
  if (!input) { notify('กรอกข้อความที่ต้องการเข้ารหัส', true); return; }
  try {
    const cipher    = _getCryptoObj(algo);
    const encrypted = cipher.encrypt(input, key, _getOpts(algo)).toString();
    _showCipherResult(encrypted, algo, 'encrypt');
  } catch(e) { notify('Encrypt ไม่สำเร็จ: ' + e.message, true); }
}

function runDecrypt() {
  const algo  = document.getElementById('enc-algo').value;
  const key   = document.getElementById('enc-key').value.trim();
  const input = document.getElementById('enc-input').value.trim();
  if (!key)   { notify('กรอก Secret Key ก่อน', true); return; }
  if (!input) { notify('กรอก Ciphertext ที่ต้องการถอดรหัส', true); return; }
  try {
    const cipher    = _getCryptoObj(algo);
    const decrypted = cipher.decrypt(input, key, _getOpts(algo)).toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('คีย์ไม่ถูกต้อง หรือ ciphertext เสียหาย');
    _showCipherResult(decrypted, algo, 'decrypt');
  } catch(e) { notify('Decrypt ไม่สำเร็จ: ' + e.message, true); }
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
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(output)}).then(()=>notify('คัดลอกแล้ว'))">คัดลอก</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('enc-input').value=${JSON.stringify(output)};notify('วางลง Input แล้ว')">ใส่ Input</button>
        </div>
      </div>
    </div>`;
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
          <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(output)}).then(()=>notify('คัดลอกแล้ว'))">คัดลอก</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('cod-input').value=${JSON.stringify(output)};notify('วางลง Input แล้ว')">ใส่ Input</button>
        </div>
      </div>
    </div>`;
}

window.md5          = md5;
window.hashAll      = hashAll;
window.setHashTab   = setHashTab;
window.onAlgoChange = onAlgoChange;
window.genEncKey    = genEncKey;
window.runEncrypt   = runEncrypt;
window.runDecrypt   = runDecrypt;
window.setEncodeMethod = setEncodeMethod;
window.runEncode    = runEncode;
window.runDecode    = runDecode;
