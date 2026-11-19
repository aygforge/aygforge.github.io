// Exports game data needed by the Python asset generator.
import { BASES } from '../../shared/data/items.js';
import { MATERIALS } from '../../shared/data/materials.js';
import { SKILLS } from '../../shared/data/skills.js';
process.stdout.write(JSON.stringify({ bases: BASES, materials: MATERIALS, skills: SKILLS }));
