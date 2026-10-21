// OTOMATİK ÜRETİLDİ: tools/import-sprites.py — elle düzenlemeyin.
// Hazır sprite paketleri (public/sprites/<id>/<anim>.png). ox/oy: ayak noktası (orijin).
export const SPRITE_PACKS = {
  "hero_warrior": {
    "w": 196,
    "h": 130,
    "body": 58,
    "ox": 0.5395,
    "oy": 0.9901,
    "anims": {
      "idle": {
        "frames": 10,
        "fps": 9,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 13,
        "repeat": -1
      },
      "atk": {
        "frames": 7,
        "fps": 18,
        "repeat": 0
      },
      "atk2": {
        "frames": 7,
        "fps": 18,
        "repeat": 0
      },
      "cast": {
        "frames": 8,
        "fps": 18,
        "repeat": 0
      },
      "hurt": {
        "frames": 3,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 7,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Fantasy Warrior (LuizMelo, CC0)"
  },
  "hero_mage": {
    "w": 125,
    "h": 92,
    "body": 58,
    "ox": 0.3575,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 6,
        "fps": 8,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 13,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 18,
        "repeat": 0
      },
      "atk2": {
        "frames": 8,
        "fps": 18,
        "repeat": 0
      },
      "cast": {
        "frames": 8,
        "fps": 18,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 7,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Wizard Pack (LuizMelo)"
  },
  "mon_ore_priest": {
    "w": 117,
    "h": 107,
    "body": 72,
    "ox": 0.3698,
    "oy": 0.9156,
    "anims": {
      "idle": {
        "frames": 8,
        "fps": 9,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 12,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 16,
        "repeat": 0
      },
      "atk2": {
        "frames": 8,
        "fps": 16,
        "repeat": 0
      },
      "hurt": {
        "frames": 3,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 7,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Evil Wizard 2 (LuizMelo, CC0)"
  }
};
