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
  "mon_meadow_rat": {
    "w": 59,
    "h": 22,
    "body": 20,
    "ox": 0.5424,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 10,
        "fps": 9,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 12,
        "repeat": -1
      },
      "atk": {
        "frames": 12,
        "fps": 20,
        "repeat": 0
      },
      "hurt": {
        "frames": 3,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 6,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Monsters Creatures Fantasy 2 — Rat (LuizMelo)"
  },
  "mon_cave_bat": {
    "w": 52,
    "h": 40,
    "body": 40,
    "ox": 0.4653,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 11,
        "fps": 11,
        "repeat": -1
      },
      "walk": {
        "frames": 11,
        "fps": 15,
        "repeat": -1
      },
      "atk": {
        "frames": 11,
        "fps": 20,
        "repeat": 0
      },
      "hurt": {
        "frames": 3,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 9,
        "repeat": 0
      }
    },
    "credit": "Monsters Creatures Fantasy 2 — Bat (LuizMelo)"
  },
  "mon_forest_raider": {
    "w": 64,
    "h": 70,
    "body": 56,
    "ox": 0.3721,
    "oy": 0.9787,
    "anims": {
      "idle": {
        "frames": 4,
        "fps": 6,
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
      "hurt": {
        "frames": 2,
        "fps": 10,
        "repeat": 0
      },
      "die": {
        "frames": 8,
        "fps": 12,
        "repeat": 0
      }
    },
    "credit": "Bandits — Light Bandit (Sven Thole)"
  },
  "mon_gray_wolf": {
    "w": 62,
    "h": 49,
    "body": 25,
    "ox": 0.5081,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 6,
        "fps": 8,
        "repeat": -1
      },
      "walk": {
        "frames": 6,
        "fps": 12,
        "repeat": -1
      },
      "atk": {
        "frames": 5,
        "fps": 14,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 14,
        "repeat": 0
      },
      "die": {
        "frames": 7,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Skullwolf — Massacre"
  },
  "mon_pick_goblin": {
    "w": 88,
    "h": 46,
    "body": 36,
    "ox": 0.4943,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 4,
        "fps": 7,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 13,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 16,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 9,
        "repeat": 0
      }
    },
    "credit": "Monster Creatures Fantasy — Goblin (LuizMelo)"
  },
  "mon_thorn_rootling": {
    "w": 71,
    "h": 45,
    "body": 37,
    "ox": 0.4437,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 4,
        "fps": 6,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 11,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 14,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 9,
        "repeat": 0
      }
    },
    "credit": "Monster Creatures Fantasy — Mushroom (LuizMelo)"
  },
  "mon_rotten_guard": {
    "w": 98,
    "h": 59,
    "body": 51,
    "ox": 0.3316,
    "oy": 0.9661,
    "anims": {
      "idle": {
        "frames": 4,
        "fps": 6,
        "repeat": -1
      },
      "walk": {
        "frames": 4,
        "fps": 7,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 13,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 9,
        "repeat": 0
      }
    },
    "credit": "Monster Creatures Fantasy — Skeleton (LuizMelo)"
  },
  "mon_red_vein_watcher": {
    "w": 112,
    "h": 82,
    "body": 66,
    "ox": 0.4821,
    "oy": 0.8049,
    "anims": {
      "idle": {
        "frames": 8,
        "fps": 10,
        "repeat": -1
      },
      "walk": {
        "frames": 8,
        "fps": 14,
        "repeat": -1
      },
      "atk": {
        "frames": 8,
        "fps": 14,
        "repeat": 0
      },
      "hurt": {
        "frames": 4,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 9,
        "repeat": 0
      }
    },
    "credit": "Monster Creatures Fantasy — Flying Eye (LuizMelo)"
  },
  "mon_swamp_leech": {
    "w": 111,
    "h": 35,
    "body": 20,
    "ox": 0.3063,
    "oy": 1.0,
    "anims": {
      "idle": {
        "frames": 14,
        "fps": 10,
        "repeat": -1
      },
      "walk": {
        "frames": 6,
        "fps": 10,
        "repeat": -1
      },
      "atk": {
        "frames": 19,
        "fps": 22,
        "repeat": 0
      },
      "hurt": {
        "frames": 3,
        "fps": 12,
        "repeat": 0
      },
      "die": {
        "frames": 11,
        "fps": 12,
        "repeat": 0
      }
    },
    "credit": "Monsters Creatures Fantasy 2 — Slime (LuizMelo)"
  },
  "mon_crimson_scorpion": {
    "w": 46,
    "h": 46,
    "body": 44,
    "ox": 0.5,
    "oy": 0.9677,
    "anims": {
      "idle": {
        "frames": 3,
        "fps": 5,
        "repeat": -1
      },
      "walk": {
        "frames": 3,
        "fps": 9,
        "repeat": -1
      },
      "atk": {
        "frames": 3,
        "fps": 9,
        "repeat": 0
      },
      "hurt": {
        "frames": 2,
        "fps": 10,
        "repeat": 0
      },
      "die": {
        "frames": 4,
        "fps": 10,
        "repeat": 0
      }
    },
    "credit": "Scorpian"
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
