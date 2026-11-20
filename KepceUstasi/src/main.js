// Kepçe Ustası — Alpha 0.1 giriş noktası (yerel/itch.io derlemesi: font ve kütüphaneler pakette).
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import { bootGame } from './boot.js';

bootGame({ registerServiceWorker: import.meta.env.PROD });
