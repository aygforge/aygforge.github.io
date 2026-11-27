// DeliveRogue — modular entry point (Phase 01 Core Migration).
// Boot order: data validation -> engine init (save load, renderer, input, UI) -> fixed-tick loop.
import { Main } from './core/GameEngine.js';
import { validateData } from './core/DataValidator.js';

const report = validateData();
if (report.errors.length) console.error('[DeliveRogue] data validation errors', report.errors);
Main.init();
