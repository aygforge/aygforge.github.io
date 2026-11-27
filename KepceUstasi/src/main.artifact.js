// Artifact (claude.ai) önizleme girişi: Phaser ve matter-js sabit sürümlü CDN'den global olarak yüklenir,
// font Google Fonts'tan gelir. Oyun kodu main.js ile aynıdır; service worker bu ortamda kullanılmaz.
import { bootGame } from './boot.js';

bootGame({ registerServiceWorker: false });
