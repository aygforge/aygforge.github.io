#!/usr/bin/env node
/* tools/android/build.js — web → Capacitor → Gradle hattı
   node tools/android/build.js debug     → dist/CozFis_Debug.apk          (debug imzalı, kurulabilir)
   node tools/android/build.js release   → dist/CozFis_Release.apk        (android/keystore.properties varsa imzalı; yoksa imzasız)
   node tools/android/build.js bundle    → dist/CozFis_Release.aab        (Google Play paketi; imza aynı kurala tabi)
   Gerekenler: Node ≥18, JDK 21, Android SDK (platform 36, build-tools 36) — ANDROID_HOME veya android/local.properties */
'use strict';
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), AND = path.join(ROOT, 'android'), DIST = path.join(ROOT, 'dist');
const mode = process.argv[2] || 'debug';
const run = (cmd, cwd) => { console.log('› ' + cmd); execSync(cmd, { cwd: cwd || ROOT, stdio: 'inherit', env: process.env }); };
const task = { debug: 'assembleDebug', release: 'assembleRelease', bundle: 'bundleRelease' }[mode];
if (!task) { console.error('kullanım: build.js debug|release|bundle'); process.exit(1); }
if (!process.env.ANDROID_HOME && !fs.existsSync(path.join(AND, 'local.properties'))) { console.error('ANDROID_HOME tanımlı değil ve android/local.properties yok (sdk.dir=...)'); process.exit(1); }
run('node tools/build/build.js');                 // dist/web (oyunun modüler sürümü)
run('npx cap sync android');                      // dist/web → android/app/src/main/assets/public + eklentiler
run((process.platform === 'win32' ? 'gradlew.bat ' : './gradlew ') + task + ' --no-daemon', AND);
const out = {
  debug: ['app/build/outputs/apk/debug/app-debug.apk', 'CozFis_Debug.apk'],
  release: [fs.existsSync(path.join(AND, 'app/build/outputs/apk/release/app-release.apk')) ? 'app/build/outputs/apk/release/app-release.apk' : 'app/build/outputs/apk/release/app-release-unsigned.apk', 'CozFis_Release.apk'],
  bundle: ['app/build/outputs/bundle/release/app-release.aab', 'CozFis_Release.aab']
}[mode];
fs.mkdirSync(DIST, { recursive: true }); fs.copyFileSync(path.join(AND, out[0]), path.join(DIST, out[1]));
console.log(`✔ dist/${out[1]}  (${(fs.statSync(path.join(DIST, out[1])).size / 1048576).toFixed(2)} MB)` + (mode !== 'debug' && !fs.existsSync(path.join(AND, 'keystore.properties')) ? '  — İMZASIZ: yüklenemez/kurulamaz, bkz. README_Android.md' : ''));
