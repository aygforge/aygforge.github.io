#!/usr/bin/env python3
"""Hazır 16×16 ikon paketlerinden seçilen ikonları oyuna aktarır (yalnız geliştirme aracı, Pillow gerekir).

Kullanım:  python3 tools/import-icons.py <paketlerin_açıldığı_klasör>

Klasörde Clockwork Raven Studios paketleri açılmış olmalı:
  "Clockwork raven - Weapons and Potions - Free pack/icons16x16.png"            (silah + iksir, 16 sütun)
  "FREE RPG Icon Pack - 100+ Accessories and Armor - Clockwork Raven Studios/icons16x16.png"  (zırh + aksesuar)
  "Free - Raven Fantasy Icons/Full Spritesheet/16x16.png"                       (kalkan, eldiven, kolye, materyal, beceri)

Çıktı: src/art/iconPack.js — eşya kimliği → 16×16 piksel verisi (ortak palet + palet indeksi). Oyun ikonları zaten
16×16 sanat pikseli olduğu için ölçekleme yapılmaz. Pakette uygun karşılığı olmayanlar (mühürler, Yarasa Kanadı,
görev eşyaları ve arayüz simgeleri) procedural ikonla çizilmeye devam eder.

Renk uyarlaması ('tint'): ('metal', renk) gri/metal pikselleri renge karıştırır (ör. Kızıl Hüküm'ün kırmızı namlusu);
('hue', renk) doymuş pikselleri hedef renk tonuna çevirir (ör. cübbe rengi). Böylece aynı çizimi paylaşan eşyalar
oyundaki renk kimliklerini korur. ('mono', renk) bütün ikonu parlaklığını koruyarak tek renge boyar (ör. mavi kalkanı
gri demire, turuncu eldiveni deriye çevirmek için).
"""
import colorsys
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JS = os.path.join(ROOT, 'src', 'art', 'iconPack.js')
SHEETS = {
    'wp': 'Clockwork raven - Weapons and Potions - Free pack/icons16x16.png',
    'ar': 'FREE RPG Icon Pack - 100+ Accessories and Armor - Clockwork Raven Studios/icons16x16.png',
    'rf': 'Free - Raven Fantasy Icons/Full Spritesheet/16x16.png',
}

# eşya → (sayfa, indeks, renk uyarlaması)
MAP = {
    # ---- Warrior silahları
    'W01': ('wp', 0, None), 'W02': ('wp', 2, None), 'W03': ('wp', 6, None), 'W04': ('wp', 10, ('metal', '#efe6cf')),
    'W05': ('wp', 25, ('metal', '#d04a3a')), 'W06': ('wp', 8, ('metal', '#8fb49a')), 'W07': ('wp', 36, ('metal', '#8a8a96')),
    'W08': ('wp', 14, ('metal', '#e0383a')), 'W09': ('wp', 7, ('metal', '#8a7a74')), 'W10': ('wp', 15, ('metal', '#c83a2a')),
    'W11': ('wp', 35, ('metal', '#ff7a2a')), 'W12': ('wp', 24, ('metal', '#bfe8ff')), 'W13': ('wp', 13, ('metal', '#9fe8ff')),
    # ---- Mage silahları (asalar ve değnekler; başlık metali rengi taşır)
    'M01': ('wp', 51, None), 'M02': ('wp', 52, None), 'M03': ('wp', 38, ('metal', '#ff9a3a')), 'M04': ('wp', 39, ('metal', '#9fe0ff')),
    'M05': ('wp', 37, ('metal', '#ffe070')), 'M06': ('wp', 52, ('hue', '#6fe0c8')), 'M07': ('wp', 37, ('metal', '#5ae0ff')),
    'M08': ('wp', 39, ('metal', '#b0f0ff')), 'M09': ('wp', 52, ('hue', '#c8502a')), 'M10': ('wp', 38, ('metal', '#ff6a2a')),
    'M11': ('wp', 37, ('metal', '#ffb040')), 'M12': ('wp', 52, ('hue', '#9fd8f0')), 'M13': ('wp', 39, ('metal', '#e0faff')),
    # ---- Başlık
    'H01': ('ar', 0, None), 'H02': ('ar', 1, None), 'H03': ('ar', 6, ('metal', '#8aa890')), 'H04': ('ar', 8, ('hue', '#6a5a8a')),
    'H05': ('ar', 31, None), 'H06': ('ar', 30, ('hue', '#3f8a8e')), 'H07': ('ar', 4, None), 'H08': ('ar', 7, ('metal', '#bfe8ff')),
    'H09': ('ar', 10, None), 'H10': ('ar', 18, None),
    # ---- Göğüs
    'C01': ('ar', 48, None), 'C02': ('ar', 60, None), 'C03': ('ar', 70, None), 'C04': ('ar', 73, ('metal', '#9ad8ff')),
    'C05': ('ar', 78, ('hue', '#4a5aba')), 'C06': ('ar', 79, None), 'C07': ('ar', 76, ('hue', '#c86a2a')), 'C08': ('ar', 78, ('hue', '#3a7ad0')),
    'C09': ('ar', 108, None), 'C10': ('ar', 75, ('metal', '#c8f0ff')), 'C11': ('ar', 77, ('hue', '#7a4a3a')), 'C12': ('ar', 79, ('hue', '#9fd8f0')),
    # ---- Bot
    'B01': ('ar', 32, None), 'B02': ('ar', 33, None), 'B03': ('ar', 34, ('metal', '#8aa890')), 'B04': ('ar', 37, None),
    'B05': ('ar', 36, None), 'B06': ('ar', 35, None), 'B07': ('ar', 38, None), 'B08': ('ar', 35, ('metal', '#c8f0ff')),
    # ---- Yüzük
    'R01': ('ar', 41, ('hue', '#c07a3a')), 'R02': ('ar', 46, None), 'R03': ('ar', 40, ('hue', '#8be06a')), 'R04': ('ar', 44, None),
    'R05': ('ar', 43, None), 'R06': ('ar', 42, ('hue', '#c070ff')), 'R07': ('ar', 47, None), 'R08': ('ar', 40, ('metal', '#c8f0ff')),
    # ---- İksirler
    'hp_s': ('wp', 64, None), 'hp_m': ('wp', 80, None), 'hp_l': ('wp', 96, None), 'hp_xl': ('wp', 104, None),
    'mp_s': ('wp', 76, None), 'mp_m': ('wp', 92, None), 'mp_l': ('wp', 108, None), 'mp_xl': ('wp', 106, None),
    # ---- Yan el: kalkanlar ve odak/ayna/küre (Raven Fantasy Icons)
    'O01': ('rf', 1106, None), 'O02': ('rf', 2148, ('mono', '#8a8070')), 'O03': ('rf', 2150, ('mono', '#9a9aaa')),
    'O04': ('rf', 1809, None), 'O05': ('rf', 1808, None), 'O06': ('rf', 2134, None),
    'O07': ('rf', 852, None), 'O08': ('rf', 2150, None), 'O09': ('rf', 2128, None), 'O10': ('rf', 2118, None),
    # ---- Eldiven
    'G01': ('rf', 2055, ('mono', '#9a7a50')), 'G02': ('rf', 2055, ('mono', '#6f8a4a')), 'G03': ('rf', 2058, ('metal', '#8a9a90')),
    'G04': ('rf', 2055, ('mono', '#e0d0a8')), 'G05': ('rf', 2170, None), 'G06': ('rf', 2168, ('hue', '#3fb0a8')),
    'G07': ('rf', 2171, None), 'G08': ('rf', 2167, ('mono', '#a8d0e8')),
    # ---- Kolye / madalyon
    'A01': ('rf', 2064, None), 'A02': ('rf', 1847, None), 'A03': ('rf', 2180, None), 'A04': ('rf', 1850, ('hue', '#b0e0ff')),
    'A05': ('rf', 2177, ('hue', '#8be06a')), 'A06': ('rf', 2181, None), 'A07': ('rf', 2182, None), 'A08': ('rf', 2179, None),
    # ---- Materyaller
    'small_fur': ('rf', 203, ('hue', '#a08a6a')), 'wolf_tooth': ('rf', 232, None), 'wolf_pelt': ('rf', 219, None),
    'root_essence': ('rf', 120, None), 'hard_wood': ('rf', 108, None), 'hunter_cloth': ('rf', 104, ('mono', '#7a9a52')),
    'healing_herb': ('rf', 240, ('hue', '#5fd068')), 'iron_scrap': ('rf', 210, None), 'iron_ore': ('rf', 192, None),
    'hard_ore': ('rf', 208, None), 'hard_shell': ('rf', 376, None), 'magic_ore': ('rf', 192, ('hue', '#4a5ac8')),
    'leech_essence': ('rf', 120, ('hue', '#c04040')), 'swamp_mud': ('rf', 112, ('mono', '#7a6440')), 'toxic_crystal': ('rf', 174, None),
    'old_armor_scrap': ('rf', 2048, ('metal', '#7a8070')), 'mana_herb': ('rf', 240, ('hue', '#5aa0ff')),
    'captain_badge': ('rf', 130, None), 'executioner_brand': ('rf', 128, ('mono', '#a04a60')), 'alpha_claw': ('rf', 231, None),
    'golem_shard': ('rf', 212, None), 'ancient_core': ('rf', 2121, ('metal', '#ffcf5a')),
    'ash_dust': ('rf', 209, None), 'crimson_hide': ('rf', 203, ('hue', '#a03a2a')), 'scorpion_stinger': ('rf', 229, ('hue', '#d04a2a')),
    'burnt_chain': ('rf', 126, ('metal', '#6a5a54')), 'ash_ore': ('rf', 192, ('hue', '#ff6a2a')),
    'frost_pelt': ('rf', 219, ('metal', '#d8e8f0')), 'pure_ice': ('rf', 173, None), 'ice_armor_shard': ('rf', 2048, ('metal', '#a8d0f0')),
    'frost_crystal': ('rf', 2145, None), 'butcher_mark': ('rf', 128, ('hue', '#e06a2a')), 'giant_ember': ('rf', 196, None),
    'frozen_core': ('rf', 2120, ('hue', '#7ad8ff')), 'ash_steel': ('rf', 220, ('metal', '#8a6a60')), 'frost_essence': ('rf', 169, ('hue', '#7ad8ff')),
    'ember_core': ('rf', 2117, None), 'mastery_book': ('rf', 98, None), 'altar_dust': ('rf', 209, ('metal', '#c8b0ff')),
    'altar_crystal': ('rf', 172, None), 'iron': ('rf', 220, None), 'hardening_stone': ('rf', 218, ('metal', '#7a9ab0')),
    'empty_bottle': ('rf', 120, ('mono', '#e8f6fa')), 'scrap': ('rf', 194, None),
    'weak_essence': ('rf', 166, None), 'rare_essence': ('rf', 171, None), 'epic_remnant': ('rf', 165, None),
    # ---- Beceriler (şeffaf zeminli büyü ikonları)
    'skill:heavy_strike': ('rf', 1043, None), 'skill:whirlwind': ('rf', 791, None), 'skill:iron_skin': ('rf', 1042, ('mono', '#a8b0bc')),
    'skill:war_charge': ('rf', 1047, None), 'skill:blade_rain': ('rf', 1011, ('mono', '#e0e8f0')),
    'skill:fireball': ('rf', 1000, None), 'skill:ice_blast': ('rf', 786, None), 'skill:mana_shield': ('rf', 1023, ('hue', '#4a8aff')),
    'skill:meteor': ('rf', 762, None), 'skill:chain_lightning': ('rf', 1029, None),
    'skill:weapon_discipline': ('rf', 919, None), 'skill:hard_skin': ('rf', 1041, ('hue', '#e04848')),
    'skill:battle_rhythm': ('rf', 946, ('hue', '#e0a040')), 'skill:elemental_mastery': ('rf', 765, None),
    'skill:mana_control': ('rf', 785, None), 'skill:frozen_target': ('rf', 1008, None),
    'skill:unyielding_will': ('rf', 1042, None), 'skill:arcane_resonance': ('rf', 775, None),
}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tint(img, mode, color):
    tr, tg, tb = hex_rgb(color)
    th, ts, tv = colorsys.rgb_to_hsv(tr / 255, tg / 255, tb / 255)
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if mode == 'metal':
                if s < 0.22 and v > 0.3:   # gri/metal: hedef rengin parlaklığa göre ölçeklenmiş hali; en açık parlama korunur
                    k = 0.92 if v < 0.9 else 0.4
                    sc = min(1.0, v / max(tv, 0.01))
                    r, g, b = [round(c * (1 - k) + min(255, t * sc) * k) for c, t in zip((r, g, b), (tr, tg, tb))]
            elif mode == 'mono':        # parlaklık korunur, renk hedefe çekilir
                lum = (0.299 * r + 0.587 * g + 0.114 * b) / max(1, 0.299 * tr + 0.587 * tg + 0.114 * tb)
                r, g, b = [round(t * lum * 0.9 + c * 0.1) for c, t in zip((r, g, b), (tr, tg, tb))]
            elif mode == 'hue':
                if s > 0.18:
                    r2, g2, b2 = colorsys.hsv_to_rgb(th, max(s, ts * 0.8), v)
                    r, g, b = round(r2 * 255), round(g2 * 255), round(b2 * 255)
            px[x, y] = (min(255, r), min(255, g), min(255, b), a)
    return img


def main(src):
    sheets = {k: Image.open(os.path.join(src, p)).convert('RGBA') for k, p in SHEETS.items()}
    palette, pindex, icons = [], {}, {}
    for key, (sheet, idx, tn) in MAP.items():
        im = sheets[sheet]
        cols = im.width // 16
        r, c = divmod(idx, cols)
        icon = im.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16)).copy()
        if tn:
            icon = tint(icon, *tn)
        codes = []
        for y in range(16):
            for x in range(16):
                p = icon.getpixel((x, y))
                p = (0, 0, 0, 0) if p[3] == 0 else p
                h = '%02x%02x%02x%02x' % p
                if h not in pindex:
                    pindex[h] = len(palette)
                    palette.append(h)
                codes.append(pindex[h])
        icons[key] = codes
    width = 2 if len(palette) <= 256 else 3
    icons = {k: ''.join(format(i, f'0{width}x') for i in codes) for k, codes in icons.items()}
    with open(OUT_JS, 'w', encoding='utf-8') as fh:
        fh.write('// OTOMATİK ÜRETİLDİ: tools/import-icons.py — elle düzenlemeyin.\n')
        fh.write('// Clockwork Raven Studios ücretsiz ikon paketlerinden (Weapons & Potions, Accessories & Armor, Raven Fantasy Icons) seçilen 16×16 ikonlar (RGBA palet + piksel başına indeks).\n')
        fh.write(f'export const ICON_PALETTE = {json.dumps(palette)};\n')
        fh.write(f'export const ICON_INDEX_WIDTH = {width};\n')
        fh.write('export const ICON_PACK = ' + json.dumps(icons, indent=0) + ';\n')
    print(f'{len(icons)} ikon, {len(palette)} renk → {os.path.relpath(OUT_JS, ROOT)}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
