import Phaser from 'phaser';
import { audio, SFX } from '../platform/AudioService.js';
import { app } from '../game/AppState.js';
import { text } from '../ui/widgets.js';

const IMAGES = {
  chef: 'chefs/chef.png',
  tomato: 'enemies/tomato.png',
  pepper: 'enemies/pepper.png',
  egg: 'enemies/egg.png',
  potato: 'enemies/potato.png',
  armored_potato: 'enemies/armored_potato.png',
  salt: 'enemies/salt.png',
  giant_tomato: 'bosses/giant_tomato.png',
  potato_king: 'bosses/potato_king.png',
  mushroom: 'enemies/mushroom.png',
  mushroom_guard: 'enemies/mushroom_guard.png',
  onion: 'enemies/onion.png',
  giant_mushroom: 'bosses/giant_mushroom.png',
  dish_omelet: 'kitchen/dish_omelet.png',
  // V1.0 chapter 4–12 enemies, bosses, dishes
  broccoli: 'enemies/broccoli.png',
  carrot: 'enemies/carrot.png',
  cheese: 'enemies/cheese.png',
  chili: 'enemies/chili.png',
  dough: 'enemies/dough.png',
  eggplant: 'enemies/eggplant.png',
  garlic: 'enemies/garlic.png',
  glazed_tomato: 'enemies/glazed_tomato.png',
  leek: 'enemies/leek.png',
  noodle: 'enemies/noodle.png',
  olive: 'enemies/olive.png',
  pastry: 'enemies/pastry.png',
  pickle: 'enemies/pickle.png',
  rice: 'enemies/rice.png',
  royal_mushroom: 'enemies/royal_mushroom.png',
  royal_noodle: 'enemies/royal_noodle.png',
  royal_tomato: 'enemies/royal_tomato.png',
  sauce: 'enemies/sauce.png',
  sesame: 'enemies/sesame.png',
  soy: 'enemies/soy.png',
  spice: 'enemies/spice.png',
  spinach: 'enemies/spinach.png',
  spiral: 'enemies/spiral.png',
  turmeric: 'enemies/turmeric.png',
  wrap: 'enemies/wrap.png',
  curry_sultan: 'bosses/curry_sultan.png',
  dough_golem: 'bosses/dough_golem.png',
  feast_lord: 'bosses/feast_lord.png',
  giant_wrap: 'bosses/giant_wrap.png',
  layered_borek: 'bosses/layered_borek.png',
  pan_guardian: 'bosses/pan_guardian.png',
  spaghetti_king: 'bosses/spaghetti_king.png',
  spicy_noodle_dragon: 'bosses/spicy_noodle_dragon.png',
  stew_golem: 'bosses/stew_golem.png',
  dish_borek: 'kitchen/dish_borek.png',
  dish_curry: 'kitchen/dish_curry.png',
  dish_feast: 'kitchen/dish_feast.png',
  dish_noodle: 'kitchen/dish_noodle.png',
  dish_pasta: 'kitchen/dish_pasta.png',
  dish_pizza: 'kitchen/dish_pizza.png',
  dish_special_pan: 'kitchen/dish_special_pan.png',
  dish_stew: 'kitchen/dish_stew.png',
  dish_wrap: 'kitchen/dish_wrap.png',
  oil_normal: 'oils/oil_normal.png',
  oil_big: 'oils/oil_big.png',
  oil_cold: 'oils/oil_cold.png',
  cat_catch: 'ui/cat_catch.png',
  cat_attack: 'ui/cat_attack.png',
  cat_pan: 'ui/cat_pan.png',
  cat_defense: 'ui/cat_defense.png',
  cat_control: 'ui/cat_control.png',
  pan: 'kitchen/pan.png',
  dish_menemen: 'kitchen/dish_menemen.png',
  dish_fries: 'kitchen/dish_fries.png',
  flame1: 'kitchen/flame1.png',
  flame2: 'kitchen/flame2.png',
  bubble: 'kitchen/bubble.png',
  battle_bg: 'kitchen/battle_bg.png',
  counter: 'kitchen/counter.png',
  stove: 'kitchen/stove.png',
  pot: 'kitchen/pot.png',
  restaurant_bg: 'kitchen/restaurant_bg.png',
  heart: 'ui/heart.png',
  heart_empty: 'ui/heart_empty.png',
  shield: 'ui/shield.png',
  coin: 'ui/coin.png',
  star: 'ui/star.png',
  star_empty: 'ui/star_empty.png',
  fast: 'ui/fast.png',
  spark: 'ui/spark.png',
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 4, 16, 0xffd84a).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 304, 22).setStrokeStyle(2, 0xfff4dc);
    text(this, width / 2, height / 2 - 40, 'Kepçe Ustası', 30);
    this.load.on('progress', (v) => (bar.width = 300 * v));
    this.load.setPath('assets/');
    for (const [k, f] of Object.entries(IMAGES)) this.load.image(k, f);
    for (const k of SFX) this.load.audio(k, `audio/${k}.wav`);
    this.load.audio('music', 'audio/music.wav');
  }
  create() {
    audio.attach(this.game, app.save.settings);
    this.scene.start('Menu');
  }
}
