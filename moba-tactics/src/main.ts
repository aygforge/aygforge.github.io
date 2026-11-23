import './ui/style.css';
import { App } from './ui/app';

window.addEventListener('error', (e) => console.error('[MOBA Tactics]', e.message));
const app = new App();
(window as any).__app = app;
