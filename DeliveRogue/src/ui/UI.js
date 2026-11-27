// ui/UI.js — compatibility entry for the engine (Phase 02): the legacy single-module DOM UI was replaced
// by 8 independent scene modules (src/scenes) composed in ui/App.js. The engine keeps importing `UI`.
export { App as UI } from './App.js';
