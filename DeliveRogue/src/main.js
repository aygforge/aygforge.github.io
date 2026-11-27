// DeliveRogue — modular entry point.
// Engine init (renderer, input, resize, loop) -> App mounts chrome/overlays and opens the Boot scene,
// which loads/recovers the save, validates data and warms up assets before MainMenu.
import './styles/main.css';
import './styles/scenes.css';
import { Main } from './core/GameEngine.js';

Main.init();
