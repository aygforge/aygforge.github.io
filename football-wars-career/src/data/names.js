// Original, procedurally generated names for the fictional football world. No real clubs, cities or players.
import { Rng } from '../career/util.js';

const C1 = ['Bar', 'Vel', 'Kor', 'Ast', 'Mir', 'Dun', 'Sel', 'Tor', 'Gal', 'Ren', 'Ost', 'Var', 'Lun', 'Hal', 'Bre', 'Cal', 'Fen', 'Gor', 'Ise', 'Jor', 'Kel', 'Lor', 'Mar', 'Nor', 'Pel', 'Quin', 'Ros', 'Sal', 'Tam', 'Ul', 'Vin', 'Wes', 'Yar', 'Zan', 'Ash', 'Bel', 'Cor', 'Dra', 'Elm', 'Fal', 'Gren', 'Hav', 'Ivo', 'Kas', 'Lem', 'Mol', 'Nev', 'Orm', 'Pra', 'Riv', 'Sto', 'Tre', 'Val', 'Wyn', 'Ard', 'Bry', 'Cas', 'Dov', 'Eld', 'Fir'];
const C2 = ['ford', 'mouth', 'haven', 'dale', 'gate', 'wick', 'stead', 'ton', 'burg', 'mere', 'vale', 'holm', 'port', 'field', 'crest', 'moor', 'bridge', 'side', 'brook', 'lund', 'hurst', 'stone', 'ria', 'enna', 'ova', 'ika', 'ano', 'ora', 'esa', 'ino', 'ville', 'heim', 'grad', 'by', 'thorpe', 'cliff', 'wood', 'bay', 'shire', 'water'];
const SUFFIX = ['FC', 'Athletic', 'Rovers', 'Wanderers', 'City', 'Town', 'Sporting', 'Albion', 'Rangers', 'Olympic', 'Dynamo', 'Union', 'Atletico', 'Vale', 'Harriers', 'Strikers', 'Mariners', 'Forge', 'Comets', 'Phoenix'];
const PREFIX = ['Real', 'Racing', 'Inter', 'Royal', 'Sporting', 'Club', 'Deportivo', 'Olympique', 'Athletic', 'United'];
const FIRST = ['Ari', 'Bram', 'Caio', 'Dario', 'Emre', 'Fynn', 'Goran', 'Hugo', 'Ilyas', 'Jaro', 'Kian', 'Lior', 'Mateo', 'Nilo', 'Oskar', 'Pavo', 'Quim', 'Rafe', 'Sami', 'Teo', 'Ugo', 'Vito', 'Wim', 'Xan', 'Yuri', 'Zeno', 'Alvo', 'Beno', 'Cyr', 'Deni', 'Eli', 'Faro', 'Gil', 'Haro', 'Ivo', 'Jules', 'Kemal', 'Luca', 'Milo', 'Nael', 'Otto', 'Piet', 'Rui', 'Soren', 'Tarik', 'Umut', 'Valen', 'Yago', 'Zoltan', 'Ansel', 'Bayo', 'Cenk', 'Dimo', 'Enzo', 'Fadi', 'Gavi', 'Hakan', 'Joaq', 'Kaito', 'Leon', 'Mert', 'Noa', 'Orri', 'Remy', 'Sefa', 'Timo', 'Unai', 'Vasco'];
const L1 = ['Ab', 'Bel', 'Cor', 'Dra', 'Esk', 'Fal', 'Gru', 'Hel', 'Ist', 'Jav', 'Kal', 'Lun', 'Mor', 'Nak', 'Orl', 'Pas', 'Ruv', 'Sab', 'Tov', 'Ulm', 'Var', 'Wex', 'Yal', 'Zor', 'Ben', 'Cas', 'Dum', 'Fer', 'Gal', 'Kov', 'Mar', 'Nor', 'Pet', 'Ros', 'Sim', 'Tar', 'Vel', 'Zel'];
const L2 = ['ani', 'ero', 'ovic', 'sen', 'enko', 'ard', 'etti', 'oglu', 'inho', 'ez', 'ski', 'ner', 'ow', 'acz', 'elli', 'ard', 'ius', 'aro', 'emi', 'dor', 'kin', 'rich', 'avo', 'ens', 'ola', 'uk', 'ini', 'mann', 'ay', 'oza'];
const SHAPES = ['diagonal', 'stripes', 'band', 'chevron', 'quarters', 'orb'];
const PATTERNS = ['plain', 'stripes', 'hoops', 'halves', 'sash', 'sleeves'];
const PALETTE = ['#e63946', '#1d3557', '#457b9d', '#f1c40f', '#2a9d8f', '#e76f51', '#8e44ad', '#ffffff', '#111827', '#22c55e', '#f97316', '#0ea5e9', '#b91c1c', '#7c3aed', '#facc15', '#14532d', '#be185d', '#0f766e', '#c2410c', '#4338ca', '#9ca3af', '#78350f', '#06b6d4', '#84cc16'];

export function makeNameFactory(seed) {
  const r = new Rng(seed);
  const usedClub = new Set(), usedPerson = new Set(), usedCity = new Set();
  function city() { for (;;) { const n = r.pick(C1) + r.pick(C2); if (!usedCity.has(n) && n.length <= 13) { usedCity.add(n); return n; } } }
  function club() {
    for (;;) {
      const c = city(); const st = r.next();
      const name = st < 0.55 ? c + ' ' + r.pick(SUFFIX) : st < 0.85 ? r.pick(PREFIX) + ' ' + c : c;
      if (usedClub.has(name)) continue; usedClub.add(name);
      return { name, city: c, short: c.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() };
    }
  }
  function person() { for (;;) { const n = r.pick(FIRST) + ' ' + r.pick(L1) + r.pick(L2); if (!usedPerson.has(n)) { usedPerson.add(n); return n; } } }
  function kit() {
    let p = r.pick(PALETTE), s = r.pick(PALETTE); while (s === p) s = r.pick(PALETTE);
    return { primary: p, secondary: s, pattern: r.pick(PATTERNS), crest: r.pick(SHAPES) };
  }
  return { city, club, person, kit, rng: r, reserve: n => usedPerson.add(n), reserveClub: n => usedClub.add(n) };
}
export { SHAPES as CREST_SHAPES, PATTERNS as KIT_PATTERNS, PALETTE };
