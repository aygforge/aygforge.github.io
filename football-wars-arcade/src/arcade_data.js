/* FOOTBALL WARS — ARCADE REBORN: arcade data (club display names, 6 added clubs, fictional star pool).
 * Club identities come from the V4 FW_MASTER_DB (194 real clubs) + 6 added real clubs = 200.
 * sourceName = real club name (kept for reference/search); displayName = adapted, recognisable arcade name.
 * No official logos, kits, sponsors or real player names/portraits are used. */
(function (root) {
'use strict';

// sourceId -> arcade display name (manually curated, one unique name per club)
const DISPLAY = {
  TUR_GALATASARAY: 'Galata Lions', TUR_AMED_SK: 'Amed Diyarbakır', TUR_TRABZONSPOR: 'Trabzon 61', TUR_BESIKTAS: 'Beşiktaş Eagles',
  TUR_KASIMPASA: 'Kasımpaşa Sailors', TUR_FENERBAHCE: 'Fener İstanbul', TUR_CORUM_FK: 'Çorum Hittites', TUR_KOCAELISPOR: 'Kocaeli Gulf',
  TUR_GOZTEPE: 'Göztepe İzmir', TUR_ISTANBUL_BASAKSEHIR: 'Başakşehir Owls', TUR_ERZURUMSPOR_FK: 'Erzurum Dadaş', TUR_ALANYASPOR: 'Alanya Riviera',
  TUR_CAYKUR_RIZESPOR: 'Rize Tea Valley', TUR_GENCLERBIRLIGI: 'Ankara Gençler', TUR_KONYASPOR: 'Konya Eagles', TUR_GAZIANTEP_FK: 'Antep Falcons',
  TUR_SAMSUNSPOR: 'Samsun Black Sea', TUR_EYUPSPOR: 'Eyüp Purple',
  ENG_ARSENAL: 'London Cannons', ENG_BRIGHTON_HOVE_ALBION: 'Brighton Seagulls', ENG_MANCHESTER_CITY: 'Manchester Sky', ENG_LIVERPOOL: 'Mersey Reds',
  ENG_CHELSEA: 'London Blues', ENG_EVERTON: 'Mersey Toffees', ENG_AFC_BOURNEMOUTH: 'Bournemouth Cherries', ENG_BRENTFORD: 'Brentford Bees',
  ENG_LEEDS_UNITED: 'Leeds Whites', ENG_ASTON_VILLA: 'Birmingham Villans', ENG_TOTTENHAM_HOTSPUR: 'North London Spurs', ENG_NEWCASTLE_UNITED: 'Tyneside Magpies',
  ENG_HULL_CITY: 'Hull Tigers', ENG_IPSWICH_TOWN: 'Ipswich Tractors', ENG_FULHAM: 'Fulham Cottagers', ENG_NOTTINGHAM_FOREST: 'Trent Foresters',
  ENG_COVENTRY_CITY: 'Coventry Sky Blues', ENG_MANCHESTER_UNITED: 'Manchester Reds', ENG_SUNDERLAND: 'Wearside Black Cats', ENG_CRYSTAL_PALACE: 'South London Eagles',
  ESP_FC_BARCELONA: 'Barcelona Catalans', ESP_REAL_MADRID: 'Madrid Royals', ESP_ATLETICO_DE_MADRID: 'Madrid Rojiblancos', ESP_REAL_BETIS: 'Seville Greens',
  ESP_REAL_SOCIEDAD: 'Donostia Royals', ESP_SEVILLA_FC: 'Seville Nervión', ESP_ATHLETIC_CLUB: 'Bilbao Lions', ESP_VILLARREAL_CF: 'Villarreal Yellow Subs',
  ESP_DEPORTIVO_DE_LA_CORUNA: 'Coruña Depor', ESP_RACING_DE_SANTANDER: 'Santander Racers', ESP_CELTA_DE_VIGO: 'Vigo Celts', ESP_DEPORTIVO_ALAVES: 'Vitoria Alavés',
  ESP_RCD_ESPANYOL: 'Barcelona Parakeets', ESP_RAYO_VALLECANO: 'Vallecas Lightning', ESP_GETAFE_CF: 'Getafe Azulones', ESP_CA_OSASUNA: 'Pamplona Rojillos',
  ESP_LEVANTE_UD: 'Valencia Granotas', ESP_ELCHE_CF: 'Elche Franjiverdes', ESP_VALENCIA_CF: 'Valencia Bats', ESP_MALAGA_CF: 'Málaga Boquerones',
  ITA_SS_LAZIO: 'Rome Eagles', ITA_INTER: 'Milano Blue', ITA_AS_ROMA: 'Rome Wolves', ITA_AC_MILAN: 'Milano Devils', ITA_COMO_1907: 'Como Lakers',
  ITA_FROSINONE: 'Frosinone Canaries', ITA_JUVENTUS: 'Turin Zebras', ITA_BOLOGNA_FC: 'Bologna Rossoblù', ITA_CAGLIARI: 'Sardinia Islanders',
  ITA_SSC_NAPOLI: 'Naples Azzurri', ITA_TORINO_FC: 'Turin Bulls', ITA_ATALANTA: 'Bergamo Nerazzurri', ITA_GENOA_CFC: 'Genoa Griffins',
  ITA_US_LECCE: 'Salento Wolves', ITA_ACF_FIORENTINA: 'Florence Violets', ITA_PARMA_CALCIO: 'Parma Crusaders', ITA_SASSUOLO: 'Sassuolo Neroverdi',
  ITA_AC_MONZA: 'Monza Brianzoli', ITA_VENEZIA_FC: 'Venice Lagoon', ITA_UDINESE: 'Friuli Zebrette',
  GER_BAYERN_MUNICH: 'Munich Reds', GER_BORUSSIA_DORTMUND: 'Dortmund Yellow', GER_SC_FREIBURG: 'Freiburg Breisgau', GER_RB_LEIPZIG: 'Leipzig Rasenballers',
  GER_BAYER_LEVERKUSEN: 'Leverkusen Werkself', GER_WERDER_BREMEN: 'Bremen River', GER_SV_ELVERSBERG: 'Elversberg Saar', GER_VFB_STUTTGART: 'Stuttgart Swabians',
  GER_TSG_HOFFENHEIM: 'Sinsheim Hoffe', GER_EINTRACHT_FRANKFURT: 'Frankfurt Eagles', GER_HAMBURGER_SV: 'Hamburg Dinos', GER_MAINZ_05: 'Mainz Carnival',
  GER_SC_PADERBORN: 'Paderborn Black-Blues', GER_FC_AUGSBURG: 'Augsburg Fuggers', GER_1_FC_KOLN: 'Cologne Billy Goats', GER_UNION_BERLIN: 'Berlin Iron Union',
  GER_SCHALKE_04: 'Gelsenkirchen Royal Blues', GER_BORUSSIA_MONCHENGLADBACH: 'Gladbach Foals',
  FRA_PARIS_SAINT_GERMAIN: 'Paris Saints', FRA_LILLE_OSC: 'Lille Mastiffs', FRA_PARIS_FC: 'Paris City', FRA_OLYMPIQUE_MARSEILLE: 'Marseille Phocaeans',
  FRA_OLYMPIQUE_LYONNAIS: 'Lyon Gones', FRA_OGC_NICE: 'Nice Eaglets', FRA_AS_MONACO: 'Monaco Principality', FRA_STADE_RENNAIS: 'Rennes Red-Blacks',
  FRA_STADE_BRESTOIS: 'Brest Pirates', FRA_FC_LORIENT: 'Lorient Merlus', FRA_RC_LENS: 'Lens Blood & Gold', FRA_TOULOUSE_FC: 'Toulouse Pitchouns',
  FRA_RC_STRASBOURG: 'Strasbourg Alsace', FRA_AJ_AUXERRE: 'Auxerre Burgundy', FRA_LE_MANS_FC: 'Le Mans Sarthe', FRA_ANGERS_SCO: 'Angers Anjou',
  FRA_ESTAC_TROYES: 'Troyes Aube', FRA_LE_HAVRE_AC: 'Havre Dockers',
  POR_FC_PORTO: 'Porto Dragons', POR_SL_BENFICA: 'Lisbon Eagles', POR_SPORTING_CP: 'Lisbon Lions', POR_SANTA_CLARA: 'Azores Santa Clara',
  POR_FC_AROUCA: 'Arouca Wolves', POR_ACADEMICO_DE_VISEU: 'Viseu Académico', POR_GIL_VICENTE: 'Barcelos Roosters', POR_SC_BRAGA: 'Braga Warriors',
  POR_MOREIRENSE: 'Moreira Cónegos', POR_FC_FAMALICAO: 'Famalicão Blues', POR_FC_ALVERCA: 'Alverca Ribatejo', POR_ESTRELA_DA_AMADORA: 'Amadora Stars',
  POR_NACIONAL_MADEIRA: 'Funchal Nacional', POR_VITORIA_SC: 'Guimarães Conquerors', POR_MARITIMO: 'Madeira Maritimers', POR_CASA_PIA: 'Lisbon Gansos',
  POR_RIO_AVE: 'Vila do Conde River', POR_ESTORIL_PRAIA: 'Estoril Coast',
  NED_PSV_EINDHOVEN: 'Eindhoven Lights', NED_FEYENOORD: 'Rotterdam Kuip', NED_AJAX: 'Amsterdam Ajacieden', NED_FC_TWENTE: 'Enschede Tukkers',
  NED_AZ_ALKMAAR: 'Alkmaar Cheeseheads', NED_SC_HEERENVEEN: 'Heerenveen Frisians', NED_FORTUNA_SITTARD: 'Sittard Fortuna', NED_GO_AHEAD_EAGLES: 'Deventer Eagles',
  NED_FC_GRONINGEN: 'Groningen North', NED_SC_CAMBUUR: 'Leeuwarden Cambuur', NED_NEC_NIJMEGEN: 'Nijmegen NEC', NED_SPARTA_ROTTERDAM: 'Rotterdam Castle',
  NED_PEC_ZWOLLE: 'Zwolle Blauwvingers', NED_FC_UTRECHT: 'Utrecht Domstad', NED_EXCELSIOR: 'Rotterdam Kralingen', NED_TELSTAR: 'Velsen White Lions',
  NED_ADO_DEN_HAAG: 'Hague Storks', NED_WILLEM_II: 'Tilburg Tricolores',
  BEL_CLUB_BRUGGE: 'Brugge Blue-Black', BEL_UNION_SAINT_GILLOISE: 'Brussels Union', BEL_KAA_GENT: 'Gent Buffalos', BEL_SPORTING_CHARLEROI: 'Charleroi Carolos',
  BEL_RSC_ANDERLECHT: 'Brussels Mauves', BEL_KRC_GENK: 'Limburg Genk', BEL_LOMMEL_SK: 'Lommel Kempen', BEL_KVC_WESTERLO: 'Westerlo Kemphanen',
  BEL_STANDARD_LIEGE: 'Liège Rouches', BEL_ZULTE_WAREGEM: 'Waregem Essevee', BEL_ROYAL_ANTWERP: 'Antwerp Great Old', BEL_SK_BEVEREN: 'Beveren Waasland',
  BEL_OUD_HEVERLEE_LEUVEN: 'Leuven Brabant', BEL_KV_MECHELEN: 'Mechelen Malinwa', BEL_SINT_TRUIDEN: 'Haspengouw Truiden', BEL_RAAL_LA_LOUVIERE: 'La Louvière Wolves',
  BEL_CERCLE_BRUGGE: 'Brugge Green-Black', BEL_KV_KORTRIJK: 'Kortrijk Kerels',
  GRE_PANATHINAIKOS: 'Athens Clovers', GRE_OLYMPIACOS: 'Piraeus Legend', GRE_AEK_ATHENS: 'Athens Double Eagle', GRE_PAOK: 'Toumba Black-Whites',
  GRE_ARIS_THESSALONIKI: 'Thessaloniki Aris', GRE_OFI_CRETE: 'Heraklion OFI', GRE_AE_KIFISIA: 'Kifisia North', GRE_KALAMATA: 'Messinia Blacks',
  GRE_IRAKLIS: 'Thessaloniki Iraklis', GRE_PANETOLIKOS: 'Agrinio Aetolians', GRE_ASTERAS_TRIPOLIS: 'Tripoli Stars', GRE_ATROMITOS: 'Peristeri Fearless',
  GRE_LEVADIAKOS: 'Levadia Boeotians', GRE_VOLOS_NFC: 'Volos Magnesia',
  SCO_CELTIC: 'Glasgow Hoops', SCO_RANGERS: 'Glasgow Light Blues', SCO_FALKIRK: 'Falkirk Bairns', SCO_HEART_OF_MIDLOTHIAN: 'Edinburgh Jambos',
  SCO_DUNDEE_FC: 'Dundee Dark Blues', SCO_DUNDEE_UNITED: 'Dundee Terrors', SCO_ST_JOHNSTONE: 'Perth Saints', SCO_ST_MIRREN: 'Paisley Buddies',
  SCO_MOTHERWELL: 'Motherwell Steelmen', SCO_HIBERNIAN: 'Edinburgh Hibees', SCO_ABERDEEN: 'Aberdeen Dons', SCO_KILMARNOCK: 'Ayrshire Killie',
  ARG_BOCA_JUNIORS: 'Buenos Aires Xeneizes', ARG_RIVER_PLATE: 'Buenos Aires Millionaires', BRA_FLAMENGO: 'Rio Rubro-Negro',
  BRA_PALMEIRAS: 'São Paulo Verdão', USA_INTER_MIAMI: 'Miami Herons', USA_LOS_ANGELES_FC: 'Los Angeles Black & Gold'
};

// 6 real clubs that are NOT in the V4 database (verified at build/test time), same schema as V4 clubs.
// Power indices are calibrated to the V4 game-scale (club strength relative to European top-flight sides).
const EXTRA_LEAGUES = [
  { id: 'ARG_LPF', name: 'Liga Profesional', country: 'Argentina', country_code: 'ARG' },
  { id: 'BRA_SERIE_A', name: 'Série A', country: 'Brazil', country_code: 'BRA' },
  { id: 'USA_MLS', name: 'Major League Soccer', country: 'United States', country_code: 'USA' }
];
const EXTRA_CLUBS = [
  { id: 'ARG_BOCA_JUNIORS', name: 'Boca Juniors', country: 'Argentina', country_code: 'ARG', league_id: 'ARG_LPF', primary: '#0B3D91', secondary: '#F2C200', power: 80, archetype: 'counter', aggression: 70 },
  { id: 'ARG_RIVER_PLATE', name: 'River Plate', country: 'Argentina', country_code: 'ARG', league_id: 'ARG_LPF', primary: '#F4F4F4', secondary: '#E1251B', power: 82, archetype: 'possession', aggression: 58 },
  { id: 'BRA_FLAMENGO', name: 'Flamengo', country: 'Brazil', country_code: 'BRA', league_id: 'BRA_SERIE_A', primary: '#C8102E', secondary: '#111111', power: 83, archetype: 'wing_attack', aggression: 64 },
  { id: 'BRA_PALMEIRAS', name: 'Palmeiras', country: 'Brazil', country_code: 'BRA', league_id: 'BRA_SERIE_A', primary: '#006437', secondary: '#F4F4F4', power: 82, archetype: 'high_press', aggression: 66 },
  { id: 'USA_INTER_MIAMI', name: 'Inter Miami', country: 'United States', country_code: 'USA', league_id: 'USA_MLS', primary: '#F7B5CD', secondary: '#231F20', power: 75, archetype: 'possession', aggression: 55 },
  { id: 'USA_LOS_ANGELES_FC', name: 'Los Angeles FC', country: 'United States', country_code: 'USA', league_id: 'USA_MLS', primary: '#1A1A1A', secondary: '#C39E6D', power: 76, archetype: 'counter', aggression: 62 }
];
const ARCH_BASE = { // per-archetype attribute shapes and role mixes (mirrors the V4 data style)
  high_press: { attrs: { attack: 0, defense: -2, speed: 5, pressing: 7, stamina: 3, teamwork: -1, physical: -1, technique: 2, goalkeeping: 2, finishing: 0 }, roles: { striker: 20, winger: 22, playmaker: 15, defender: 22, goalkeeper: 8, support: 8, captain: 5 }, specials: ['pressing_storm', 'high_line_interception'] },
  possession: { attrs: { attack: 0, defense: -1, speed: -1, pressing: -3, stamina: 0, teamwork: 7, physical: -3, technique: 6, goalkeeping: 1, finishing: 2 }, roles: { striker: 18, winger: 16, playmaker: 22, defender: 20, goalkeeper: 8, support: 11, captain: 5 }, specials: ['one_two_combo', 'precision_through_ball'] },
  counter: { attrs: { attack: 2, defense: -3, speed: 7, pressing: 0, stamina: 1, teamwork: -1, physical: -1, technique: 0, goalkeeping: 0, finishing: 5 }, roles: { striker: 24, winger: 20, playmaker: 12, defender: 22, goalkeeper: 8, support: 9, captain: 5 }, specials: ['counter_burst', 'quick_transition'] },
  wing_attack: { attrs: { attack: 4, defense: -2, speed: 6, pressing: 0, stamina: 0, teamwork: 2, physical: -3, technique: 1, goalkeeping: -1, finishing: 2 }, roles: { striker: 18, winger: 28, playmaker: 13, defender: 20, goalkeeper: 8, support: 8, captain: 5 }, specials: ['cross_fire', 'flank_overload'] }
};
function buildExtraClub(x) {
  const a = ARCH_BASE[x.archetype], attrs = {};
  for (const k in a.attrs) attrs[k] = Math.max(40, Math.min(99, x.power + a.attrs[k]));
  return {
    id: x.id, name: x.name, display_name_tr: x.name, search_aliases: [x.name], type: 'club', country: x.country, country_code: x.country_code, league_id: x.league_id,
    visual: { primary_color: x.primary, secondary_color: x.secondary, sprite_theme: 'football_pixel_16bit', logo_asset: null, licensed_brand_asset: false },
    source_rating: { provider: 'arcade-calibrated', metric: 'game_power_index', value: x.power, note: 'Not in the V4 Elo snapshot; game-scale estimate.' },
    battle_profile: { power_index: x.power, archetype: x.archetype, attributes: attrs, roles_per_100: Object.assign({}, a.roles), specials: a.specials.slice(), aggression: x.aggression,
      variance: { team_form_std_pct: 9, unit_trait_std_pct: 14, critical_chance_pct: 7, critical_multiplier: 1.45, streak_adaptation: true }, gameplay_fields_are_inferred: true },
    search_key: x.name.toLowerCase(), arcade_added: true
  };
}

// ---------------- fictional star pool: 7 roles x 14 = 98 original characters ----------------
const FIRST = ['Taro', 'Emre', 'Luca', 'Mateo', 'Kofi', 'Aras', 'Nils', 'Rafa', 'Idris', 'Yuki', 'Bruno', 'Sami', 'Tiago', 'Oskar', 'Zane', 'Elio', 'Marek', 'Dario',
  'Kenan', 'Ilya', 'Noah', 'Caio', 'Ferro', 'Jalen', 'Arvid', 'Omar', 'Pietro', 'Hugo', 'Baran', 'Ciro', 'Lior', 'Axel', 'Vito', 'Enzo', 'Kaan', 'Remy', 'Niko', 'Sven',
  'Ademi', 'Joaq', 'Malik', 'Teo', 'Bram', 'Rui', 'Dusan', 'Ozan', 'Levi', 'Iker', 'Anouk'];
const LAST = ['Valdren', 'Kestrova', 'Moraleta', 'Brightwater', 'Okonjo', 'Tazegül', 'Haldane', 'Corvino', 'Abara', 'Sunagawa', 'Ferrugem', 'Lindqvar', 'Doruk',
  'Marchetto', 'Quillon', 'Ravensby', 'Ostrander', 'Kaleyo', 'Pellerin', 'Uzunkaya', 'Varga-Lis', 'Mbetu', 'Castellar', 'Nordhagen', 'Altamira', 'Sorvino', 'Ekwueme',
  'Draganov', 'Fallowmere', 'Yıldırımoğlu', 'Belcastro', 'Torvane', 'Achterberg', 'Ilunga', 'Ramazzi', 'Petrakos', 'Sandoval-Ruiz', 'Hollinger', 'Kızılkaya', 'Mavrides',
  'Oberholt', 'Zamorano-Vey', 'Quintavalle', 'Rønningen', 'Afolabi', 'Delacroixe', 'Strandberg', 'Tavaresco', 'Wenzelmann'];
const ROLE_ABIL = {
  striker: ['counter_burst', 'precision_through_ball', 'one_two_combo', 'cross_fire', 'quick_transition'],
  winger: ['flank_overload', 'cross_fire', 'quick_transition', 'counter_burst'],
  playmaker: ['precision_through_ball', 'one_two_combo', 'quick_transition', 'stamina_surge'],
  defender: ['iron_wall', 'shoulder_charge', 'high_line_interception', 'pressing_storm'],
  goalkeeper: ['last_line_save', 'iron_wall', 'high_line_interception'],
  support: ['stamina_surge', 'last_line_save', 'pressing_storm', 'high_line_interception'],
  captain: ['pressing_storm', 'iron_wall', 'counter_burst', 'stamina_surge', 'shoulder_charge']
};
const ROLES = ['striker', 'winger', 'playmaker', 'defender', 'goalkeeper', 'support', 'captain'];
const RARITY_SPLIT = ['common', 'common', 'common', 'common', 'common', 'rare', 'rare', 'rare', 'rare', 'epic', 'epic', 'epic', 'legendary', 'legendary'];
const NICK = ['The Comet', 'Iron Boot', 'Night Owl', 'The Viper', 'Thunder', 'Silk', 'The Wall', 'Rocket', 'Maestro', 'Falcon', 'The Fox', 'Volcano', 'Ice', 'Storm'];
function buildStars() {
  const out = [], used = new Set();
  let n = 0;
  ROLES.forEach((role, ri) => {
    for (let k = 0; k < 14; k++) {
      let f, l, name, tries = 0;
      do { f = FIRST[(n * 7 + ri * 3 + tries) % FIRST.length]; l = LAST[(n * 11 + k * 5 + ri + tries * 3) % LAST.length]; name = f + ' ' + l; tries++; } while (used.has(name));
      used.add(name);
      const rarity = RARITY_SPLIT[k];
      const ab = ROLE_ABIL[role][(k + ri) % ROLE_ABIL[role].length];
      out.push({ id: 'ST' + String(n + 1).padStart(3, '0'), name, role, rarity, ability: ab, nick: rarity === 'legendary' || rarity === 'epic' ? NICK[(n + k) % NICK.length] : '', look: (n * 2654435761) >>> 0 });
      n++;
    }
  });
  return out;
}

root.ArcadeData = { DISPLAY, EXTRA_CLUBS: EXTRA_CLUBS.map(buildExtraClub), EXTRA_LEAGUES, STARS: buildStars(), ROLE_ABIL, ROLES };
if (typeof module !== 'undefined' && module.exports) module.exports = root.ArcadeData;
})(typeof window !== 'undefined' ? window : globalThis);
