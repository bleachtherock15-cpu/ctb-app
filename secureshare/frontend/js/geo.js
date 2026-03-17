// ═══════════════════════════════════════════════
//  geo.js — GeoSight AI Location Detection
// ═══════════════════════════════════════════════

let geoFile   = null;
let geoLat    = null;
let geoLng    = null;

const GEO_STEPS = [
  'Reading image data...',
  'Identifying text and language...',
  'Analyzing architectural patterns...',
  'Matching landscape features...',
  'Cross-referencing geography database...',
  'Estimating GPS coordinates...',
];

// ── File handling ─────────────────────────────
function geoDrop(e) {
  e.preventDefault();
  document.getElementById('geo-dz').classList.remove('drag');
  handleGeoFile(e.dataTransfer.files[0]);
}

function geoFileSelect(e) {
  handleGeoFile(e.target.files[0]);
}

function handleGeoFile(f) {
  if (!f) return;
  if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) {
    showGeoError('Unsupported file type. Please use JPG, PNG, WEBP, MP4, or MOV.');
    return;
  }
  geoFile = f;
  hideGeoError();
  document.getElementById('geo-dz').classList.add('has-file');
  document.getElementById('geo-dz-title').textContent = f.name;
  document.getElementById('geo-dz-sub').textContent   = fmtSz(f.size) + ' · ' + (f.type || 'unknown');

  if (f.type.startsWith('image/')) {
    const url = URL.createObjectURL(f);
    const pi  = document.getElementById('geo-preview');
    pi.src    = url;
    document.getElementById('geo-preview-wrap').style.display = 'block';
  } else {
    document.getElementById('geo-preview-wrap').style.display = 'none';
  }

  document.getElementById('geo-btn').disabled = false;
  document.getElementById('geo-result').classList.remove('show');
}

function clearGeoFile() {
  geoFile = null;
  document.getElementById('geo-dz').classList.remove('has-file');
  document.getElementById('geo-preview-wrap').style.display = 'none';
  document.getElementById('geo-dz-title').textContent = 'Drop image or video here';
  document.getElementById('geo-dz-sub').textContent   = 'Click to browse · JPG · PNG · WEBP · MP4 · MOV';
  document.getElementById('geo-btn').disabled = true;
  document.getElementById('geo-fi').value = '';
  document.getElementById('geo-result').classList.remove('show');
  hideGeoError();
}

// ── Analysis ──────────────────────────────────
async function doGeoAnalyze() {
  if (!geoFile) return;

  const btn = document.getElementById('geo-btn');
  btn.disabled = true;
  hideGeoError();

  document.getElementById('geo-result').classList.remove('show');
  document.getElementById('geo-loading').classList.add('show');

  // animate steps
  const stepsEl = document.getElementById('geo-steps');
  stepsEl.innerHTML = GEO_STEPS.map((s, i) =>
    `<div class="geo-step" id="gstep-${i}"><div class="geo-step-dot"></div>${s}</div>`
  ).join('');

  let si = 0;
  const stepIv = setInterval(() => {
    if (si > 0) document.getElementById('gstep-' + (si - 1))?.classList.replace('active', 'done');
    if (si < GEO_STEPS.length) { document.getElementById('gstep-' + si)?.classList.add('active'); si++; }
    else clearInterval(stepIv);
  }, 500);

  try {
    const b64       = await toBase64(geoFile);
    const mediaType = geoFile.type.startsWith('image/') ? geoFile.type : 'image/jpeg';

    const response = await fetch(`${API_BASE}/geo/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ss_token')}`,
      },
      body: JSON.stringify({ imageBase64: b64, mediaType }),
    });

    clearInterval(stepIv);
    GEO_STEPS.forEach((_, i) => {
      document.getElementById('gstep-' + i)?.classList.add('done');
      document.getElementById('gstep-' + i)?.classList.remove('active');
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'API error ' + response.status);
    }

    const result = await response.json();

    setTimeout(() => {
      document.getElementById('geo-loading').classList.remove('show');
      renderGeoResult(result);
    }, 500);

  } catch (err) {
    clearInterval(stepIv);
    document.getElementById('geo-loading').classList.remove('show');
    btn.disabled = false;
    showGeoError('Analysis failed: ' + err.message);
  }
}

function renderGeoResult(r) {
  geoLat = r.lat;
  geoLng = r.lng;

  const conf  = Math.min(100, Math.max(0, r.confidence || 0));
  const color = conf >= 70 ? 'var(--teal)' : conf >= 40 ? 'var(--amber)' : 'var(--red)';
  const circ  = 201.1;

  // ring animation
  setTimeout(() => {
    const arc = document.getElementById('geo-conf-arc');
    arc.setAttribute('stroke', color);
    arc.setAttribute('stroke-dashoffset', (circ * (1 - conf / 100)).toFixed(1));
  }, 100);
  document.getElementById('geo-conf-pct').textContent = conf + '%';
  document.getElementById('geo-conf-pct').style.color = color;

  // Location
  document.getElementById('geo-loc').textContent    = r.location || 'Unknown';
  document.getElementById('geo-region').textContent = [r.region, r.country].filter(Boolean).join(' · ');

  // Coords
  document.getElementById('geo-lat').textContent = r.lat != null ? (+r.lat).toFixed(6) : '—';
  document.getElementById('geo-lng').textContent = r.lng != null ? (+r.lng).toFixed(6) : '—';

  // Map link
  if (r.lat && r.lng && !(r.lat === 0 && r.lng === 0)) {
    const mapUrl = `https://www.google.com/maps?q=${r.lat},${r.lng}&z=14`;
    document.getElementById('geo-map-link').href       = mapUrl;
    document.getElementById('geo-map-label').textContent = (+r.lat).toFixed(4) + ', ' + (+r.lng).toFixed(4);
  } else {
    document.getElementById('geo-map-link').href = '#';
  }

  // Findings
  document.getElementById('geo-findings').innerHTML = (r.clues || []).map(c => `
    <div class="geo-finding-item">
      <div class="geo-finding-em" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <div>
        <div class="geo-finding-label">${c.label || ''}</div>
        <div class="geo-finding-desc">${c.description || ''}</div>
      </div>
    </div>`).join('');

  // Reasoning
  document.getElementById('geo-reasoning').textContent = r.reasoning || '';

  // Alternatives
  document.getElementById('geo-alternatives').innerHTML = (r.alternatives || []).map((a, i) => `
    <div class="geo-alt-item" role="button" tabindex="0" aria-label="${a.name || '?'}" onclick="openAltMap(${a.lat}, ${a.lng})" onkeydown="if(event.key==='Enter'||event.key===' ')openAltMap(${a.lat}, ${a.lng})">
      <span class="geo-alt-rank">#${i + 2}</span>
      <span class="geo-alt-name">${a.name || '?'}</span>
      <span class="geo-alt-conf">${a.confidence || 0}%</span>
      <div class="geo-alt-bar"><div class="geo-alt-fill" style="width:${a.confidence || 0}%"></div></div>
    </div>`).join('');

  document.getElementById('geo-result').classList.add('show');
  document.getElementById('geo-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('geo-btn').disabled = false;
}

function openAltMap(lat, lng) {
  if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}&z=12`, '_blank');
}

function copyGeoCoord(type) {
  const val = document.getElementById(type === 'lat' ? 'geo-lat' : 'geo-lng').textContent;
  if (val === '—') return;
  navigator.clipboard.writeText(val).then(() => {
    const box  = document.querySelector(`[onclick="copyGeoCoord('${type}')"]`);
    const hint = box?.querySelector('.geo-coord-hint');
    if (hint) { const orig = hint.textContent; hint.textContent = '✓ copied!'; hint.style.color = 'var(--teal)'; setTimeout(() => { hint.textContent = orig; hint.style.color = ''; }, 1800); }
    notify('Coordinate copied!');
  });
}

function resetGeo() {
  clearGeoFile();
  document.getElementById('geo-result').classList.remove('show');
  geoLat = null; geoLng = null;
}

// ── Helpers ───────────────────────────────────
function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result.split(',')[1]);
    r.onerror = () => rej(new Error('File read failed'));
    r.readAsDataURL(file);
  });
}

function showGeoError(msg) {
  const el = document.getElementById('geo-err');
  el.innerHTML = `<div class="emsg mt8">${msg}</div>`;
}
function hideGeoError() {
  document.getElementById('geo-err').innerHTML = '';
}
