// Genişleme 3 yaması: yeni objeler + fırlatma nesneleri + çan ikonu + yelken armaları
export default function (rep, { read }) {
  const anchor = '  var c = (a, e = {}) => ({ type: a, ...e }),';
  rep(anchor, read('x3props.js') + anchor);
  rep('                      : t.kind === "flare" &&', '                      : X3FX.proj(e, t.kind, s, o - l, this.t) ? 0 : t.kind === "flare" &&');
  rep('        if (a.skull && ha === 0 && X > 20) {', '        ha === 0 && X > 20 && X3FX.emblem(O, a, S, Ba + Math.round(X * 0.55));\n        if (a.skull && ha === 0 && X > 20) {');
  rep('sailShade: "#2a8a8a", flag: "#58d0c8" },', 'sailShade: "#2a8a8a", flag: "#58d0c8", emblem: "swallow" },');
  rep('sailShade: "#5a1218", flag: "#8a1f2a" },', 'sailShade: "#5a1218", flag: "#8a1f2a", emblem: "anvil" },');
  rep('        crane: !0,', '        crane: !0,\n        emblem: "compass",');
  rep('sailShade: "#d0b890", flag: "#e07a3a" }', 'sailShade: "#d0b890", flag: "#e07a3a", emblem: "pot" }');
  rep('sailShade: "#9ab4c4", flag: "#6a8aa0" }', 'sailShade: "#9ab4c4", flag: "#6a8aa0", emblem: "snow" }');
  rep('      varo: {', '      varo: {\n        emblem: "sword",');
  // eksik deniz tonları: alacakaranlık ve sis
  rep('      calm: { base: "#2f78a6", deep: "#26668f", crest: "#7cc4e0", foam: "#e8f6fb" },', '      calm: { base: "#2f78a6", deep: "#26668f", crest: "#7cc4e0", foam: "#e8f6fb" },\n      dusk: { base: "#3d5d8a", deep: "#2e4a74", crest: "#e8a67c", foam: "#ffe2c4" },\n      fog: { base: "#4c6c7e", deep: "#405e70", crest: "#9cb6c2", foam: "#e0e9ed" },');
  rep('      bone: (a) => {', '      bell: (a) => X3FX.icBell(a),\n      bone: (a) => {');
}
