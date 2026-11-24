// Entry point. Load order matters: the engine publishes window.FWEngine before the legacy V4 presentation scripts.
import './ui/styles.css';
import './battle/engine.js';
import './legacy/font.js';
import './legacy/sprites.js';
import './legacy/render.js';
import './legacy/director.js';
import './legacy/v3.js';
import './legacy/audio.js';
import { boot } from './ui/app.js';
boot();
