/* FOOTBALL WARS — video export.
 * Path A: WebCodecs H.264 + AAC/Opus -> MP4 (mp4-muxer, inlined, MIT)  [offline, frame-exact]
 * Path B: MediaRecorder video/mp4 (realtime replay)                      [only if the browser really supports it]
 * Path C: WebCodecs VP9/VP8 + Opus -> WebM (webm-muxer, inlined, MIT)    [offline, frame-exact]
 * Path D: MediaRecorder WebM (realtime replay)
 * Never renames WebM to .mp4. */
(function (root) {
'use strict';
const HAS_WC = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
const HAS_AE = typeof AudioEncoder !== 'undefined' && typeof AudioData !== 'undefined';
const HAS_MR = typeof MediaRecorder !== 'undefined';

function avcCandidates(w, h, fps) {
  const big = w * h > 921600;
  if (big) return fps > 30 ? ['avc1.64002a', 'avc1.4d002a', 'avc1.640032', 'avc1.42002a'] : ['avc1.640028', 'avc1.4d0028', 'avc1.640032', 'avc1.420028', 'avc1.42002a'];
  return fps > 30 ? ['avc1.640020', 'avc1.4d0020', 'avc1.640028', 'avc1.420020'] : ['avc1.64001f', 'avc1.4d001f', 'avc1.640028', 'avc1.42001f'];
}
function bitrate(w, h, fps) { const big = w * h > 921600; return big ? (fps > 30 ? 14e6 : 10e6) : (fps > 30 ? 9e6 : 6e6); }

async function findVideoConfig(kind, w, h, fps) {
  if (!HAS_WC) return null;
  const list = kind === 'avc' ? avcCandidates(w, h, fps) : ['vp09.00.40.08', 'vp09.00.31.08', 'vp8'];
  for (const hw of ['no-preference', 'prefer-software']) for (const codec of list) {
    const cfg = { codec, width: w, height: h, bitrate: bitrate(w, h, fps), framerate: fps, hardwareAcceleration: hw, latencyMode: 'quality' };
    if (kind === 'avc') cfg.avc = { format: 'avc' };
    try { const s = await VideoEncoder.isConfigSupported(cfg); if (s && s.supported) return cfg; } catch (e) { /* try next */ }
  }
  return null;
}
async function findAudioConfig(kind) {
  if (!HAS_AE) return null;
  const cfg = kind === 'aac' ? { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 } : { codec: 'opus', sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
  try { const s = await AudioEncoder.isConfigSupported(cfg); if (s && s.supported) return cfg; } catch (e) { }
  if (kind === 'aac') { const c2 = { codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 2, bitrate: 160000 }; try { const s = await AudioEncoder.isConfigSupported(c2); if (s && s.supported) return c2; } catch (e) { } }
  return null;
}
function mrType(container) {
  if (!HAS_MR) return null;
  const list = container === 'mp4'
    ? ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4']
    : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (const t of list) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) { } }
  return null;
}

async function detect() {
  const caps = { webcodecs: HAS_WC, audioEncoder: HAS_AE, mediaRecorder: HAS_MR, secure: typeof isSecureContext !== 'undefined' ? isSecureContext : null, h264: {}, vp: {}, aac: null, opus: null, mrMp4: mrType('mp4'), mrWebm: mrType('webm') };
  for (const [w, h] of [[1080, 1920], [720, 1280]]) for (const fps of [30, 60]) {
    const k = w + 'x' + h + '@' + fps;
    caps.h264[k] = await findVideoConfig('avc', w, h, fps);
    caps.vp[k] = await findVideoConfig('vp', w, h, fps);
  }
  caps.aac = await findAudioConfig('aac');
  caps.opus = await findAudioConfig('opus');
  return caps;
}
function plan(caps, w, h, fps, wantAudio) {
  const k = w + 'x' + h + '@' + fps;
  if (caps.h264[k] && (!wantAudio || caps.aac || caps.opus || !caps.mrMp4)) {
    return { path: 'wc-mp4', container: 'mp4', ext: 'mp4', mime: 'video/mp4', video: caps.h264[k], audio: wantAudio ? (caps.aac || caps.opus) : null,
      label: 'MP4 (H.264' + (wantAudio ? (caps.aac ? ' + AAC' : caps.opus ? ' + Opus' : ', sessiz') : ', ses kapalı') + ')' };
  }
  if (caps.mrMp4) return { path: 'mr-mp4', container: 'mp4', ext: 'mp4', mime: caps.mrMp4, label: 'MP4 (MediaRecorder: ' + caps.mrMp4 + ', gerçek zamanlı)' };
  if (caps.vp[k]) return { path: 'wc-webm', container: 'webm', ext: 'webm', mime: 'video/webm', video: caps.vp[k], audio: wantAudio ? caps.opus : null, label: 'WebM (' + caps.vp[k].codec.split('.')[0].toUpperCase() + (wantAudio && caps.opus ? ' + Opus' : '') + ')', warn: 'MP4 burada desteklenmiyor; WebM kullanılacak.' };
  if (caps.mrWebm) return { path: 'mr-webm', container: 'webm', ext: 'webm', mime: caps.mrWebm, label: 'WebM (MediaRecorder, gerçek zamanlı)', warn: 'MP4 burada desteklenmiyor; WebM kullanılacak.' };
  return null;
}

const yieldUI = (() => { const ch = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null; const q = []; if (ch) ch.port1.onmessage = () => { const f = q.shift(); f && f(); }; return () => new Promise(r => { if (ch) { q.push(r); ch.port2.postMessage(0); } else setTimeout(r, 0); }); })();
function waitQueue(enc, max) {
  if (enc.encodeQueueSize <= max) return Promise.resolve();
  return new Promise(res => {
    let done = false; const fin = () => { if (done) return; done = true; enc.removeEventListener && enc.removeEventListener('dequeue', chk); clearInterval(iv); res(); };
    const chk = () => { if (enc.encodeQueueSize <= max) fin(); };
    enc.addEventListener && enc.addEventListener('dequeue', chk);
    const iv = setInterval(chk, 5);
  });
}

async function encodeAudio(muxerAdd, cfg, audio, onErr) {
  if (!audio || !cfg) return 0;
  let n = 0, err = null;
  const enc = new AudioEncoder({ output: (chunk, meta) => { try { muxerAdd(chunk, meta); n++; } catch (e) { err = e; } }, error: e => { err = e; } });
  enc.configure(cfg);
  let L = audio.L, R = audio.R, sr = audio.sampleRate;
  if (cfg.sampleRate !== sr) { // simple linear resample (only used if 48 kHz AAC is unavailable)
    const k = cfg.sampleRate / sr, m = Math.floor(L.length * k); const L2 = new Float32Array(m), R2 = new Float32Array(m);
    for (let i = 0; i < m; i++) { const p = i / k, j = p | 0, f = p - j; L2[i] = L[j] + ((L[j + 1] || 0) - L[j]) * f; R2[i] = R[j] + ((R[j + 1] || 0) - R[j]) * f; }
    L = L2; R = R2; sr = cfg.sampleRate;
  }
  const FS = 4800;
  for (let off = 0; off < L.length; off += FS) {
    if (err) break;
    const nf = Math.min(FS, L.length - off);
    const data = new Float32Array(nf * 2); data.set(L.subarray(off, off + nf), 0); data.set(R.subarray(off, off + nf), nf);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: nf, numberOfChannels: 2, timestamp: Math.round(off * 1e6 / sr), data });
    enc.encode(ad); ad.close();
    if (enc.encodeQueueSize > 8) await waitQueue(enc, 4);
  }
  await enc.flush(); enc.close();
  if (err) { onErr && onErr(err); throw err; }
  return n;
}

// job: {width,height,fps,duration,draw(ctx,T),audio:{L,R,sampleRate}|null, onProgress(o), isCancelled(), plan, audioCtx}
async function run(job) {
  const p = job.plan;
  if (p.path === 'wc-mp4' || p.path === 'wc-webm') return runWebCodecs(job);
  return runRecorder(job);
}

async function runWebCodecs(job) {
  const p = job.plan, W = job.width, H = job.height, fps = job.fps;
  const N = Math.max(1, Math.ceil(job.duration * fps - 1e-6));
  const isMp4 = p.container === 'mp4';
  const M = isMp4 ? root.Mp4Muxer : root.WebMMuxer;
  if (!M) throw new Error((isMp4 ? 'mp4-muxer' : 'webm-muxer') + ' yüklenemedi');
  const target = new M.ArrayBufferTarget();
  const aCfg = job.audio ? p.audio : null;
  const muxOpts = { target, firstTimestampBehavior: 'offset' };
  if (isMp4) {
    muxOpts.video = { codec: 'avc', width: W, height: H, frameRate: fps }; muxOpts.fastStart = 'in-memory';
    if (aCfg) muxOpts.audio = { codec: aCfg.codec === 'opus' ? 'opus' : 'aac', sampleRate: aCfg.sampleRate, numberOfChannels: 2 };
  } else {
    muxOpts.video = { codec: p.video.codec.startsWith('vp09') ? 'V_VP9' : 'V_VP8', width: W, height: H, frameRate: fps };
    if (aCfg) muxOpts.audio = { codec: 'A_OPUS', sampleRate: aCfg.sampleRate, numberOfChannels: 2 };
  }
  const muxer = new M.Muxer(muxOpts);
  let vErr = null, vChunks = 0, bytes = 0;
  const enc = new VideoEncoder({ output: (chunk, meta) => { try { muxer.addVideoChunk(chunk, meta); vChunks++; bytes += chunk.byteLength; } catch (e) { vErr = e; } }, error: e => { vErr = e; } });
  enc.configure(p.video);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { alpha: false });
  const t0 = performance.now();
  // audio first (fast, deterministic mix) so both tracks are present before finalize
  let aChunks = 0;
  if (aCfg) { job.onProgress && job.onProgress({ phase: 'audio', frame: 0, total: N }); aChunks = await encodeAudio((c, m) => muxer.addAudioChunk(c, m), aCfg, job.audio); }
  const key = fps * 2;
  try {
    for (let i = 0; i < N; i++) {
      if (job.isCancelled && job.isCancelled()) throw new Error('İptal edildi');
      if (vErr) throw vErr;
      const T = i / fps;
      job.draw(ctx, T, W, H, cv);
      const frame = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % key === 0 });
      frame.close();
      if (enc.encodeQueueSize > 4) await waitQueue(enc, 2);
      if ((i & 1) === 0 || i === N - 1) {
        const el = (performance.now() - t0) / 1000, rate = (i + 1) / el;
        job.onProgress && job.onProgress({ phase: 'video', frame: i + 1, total: N, eta: (N - i - 1) / Math.max(0.1, rate), fpsEnc: rate, canvas: cv });
        await yieldUI();
      }
    }
    await enc.flush();
    if (vErr) throw vErr;
  } finally { try { enc.close(); } catch (e) { } }
  muxer.finalize();
  const buf = target.buffer;
  const blob = new Blob([buf], { type: p.mime });
  cv.width = cv.height = 1;
  return { blob, mime: p.mime, ext: p.ext, container: p.container, videoCodec: p.video.codec, audioCodec: aCfg ? aCfg.codec : null, frames: N, videoChunks: vChunks, audioChunks: aChunks, seconds: (performance.now() - t0) / 1000, path: p.path };
}

async function runRecorder(job) {
  // realtime replay into MediaRecorder (fallback). Audio is the same offline mix, played into a MediaStreamDestination.
  const p = job.plan, W = job.width, H = job.height, fps = job.fps;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { alpha: false });
  job.draw(ctx, 0, W, H, cv);
  const vs = cv.captureStream(0); const vt = vs.getVideoTracks()[0];
  const tracks = [vt];
  let src = null, dest = null; const ac = job.audioCtx;
  if (job.audio && ac) {
    dest = ac.createMediaStreamDestination();
    const b = ac.createBuffer(2, job.audio.L.length, job.audio.sampleRate); b.copyToChannel(job.audio.L, 0); b.copyToChannel(job.audio.R, 1);
    src = ac.createBufferSource(); src.buffer = b; src.connect(dest);
    tracks.push(...dest.stream.getAudioTracks());
  }
  const stream = new MediaStream(tracks);
  const rec = new MediaRecorder(stream, { mimeType: p.mime, videoBitsPerSecond: bitrate(W, H, fps), audioBitsPerSecond: 160000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => rec.onstop = r);
  rec.start(500);
  const startAt = ac ? ac.currentTime + 0.15 : 0;
  if (src) src.start(startAt);
  const perf0 = performance.now() + 150;
  const now = () => ac ? ac.currentTime - startAt : (performance.now() - perf0) / 1000;
  let last = -1, frames = 0;
  await new Promise((resolve, reject) => {
    const tick = () => {
      if (job.isCancelled && job.isCancelled()) { reject(new Error('İptal edildi')); return; }
      const T = now();
      if (T >= job.duration) { resolve(); return; }
      const fi = Math.floor(Math.max(0, T) * fps);
      if (fi !== last) { last = fi; job.draw(ctx, fi / fps, W, H, cv); if (vt.requestFrame) vt.requestFrame(); frames++; job.onProgress && job.onProgress({ phase: 'realtime', frame: fi, total: Math.ceil(job.duration * fps), eta: job.duration - T, canvas: cv }); }
      setTimeout(tick, 4);
    };
    tick();
  });
  rec.stop(); await stopped;
  try { src && src.disconnect(); } catch (e) { }
  tracks.forEach(t => t.stop());
  const blob = new Blob(chunks, { type: (rec.mimeType || p.mime).split(';')[0] });
  cv.width = cv.height = 1;
  return { blob, mime: blob.type, ext: p.ext, container: p.container, videoCodec: rec.mimeType || p.mime, audioCodec: job.audio ? 'tarayıcı' : null, frames, path: p.path };
}

// container sniffing (verifies what we produced really is MP4 / WebM)
async function sniff(blob) {
  const b = new Uint8Array(await blob.slice(0, 64).arrayBuffer());
  const s = String.fromCharCode(...b.slice(4, 8));
  if (s === 'ftyp') return { container: 'mp4', brand: String.fromCharCode(...b.slice(8, 12)) };
  if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return { container: 'webm' };
  return { container: 'unknown' };
}
async function mp4Tracks(blob) {
  // list sample-entry codecs present in the moov box (avc1 / mp4a / Opus)
  try {
    const head = new Uint8Array(await blob.slice(0, Math.min(blob.size, 4 * 1024 * 1024)).arrayBuffer());
    const txt = new TextDecoder('latin1').decode(head);
    return { avc1: txt.includes('avc1') && txt.includes('avcC'), mp4a: txt.includes('mp4a'), opus: txt.includes('Opus') && txt.includes('dOps'), moov: txt.includes('moov') };
  } catch (e) { return {}; }
}
root.FWExport = { detect, plan, run, sniff, mp4Tracks, HAS_WC, HAS_AE, HAS_MR };
})(typeof window !== 'undefined' ? window : globalThis);
