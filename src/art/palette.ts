// 🎨 Bảng màu low poly thống nhất — Protocol mục 2.
// KHÔNG hardcode màu rải rác: mọi material/vertex color đọc từ đây.
export const palette = {
  asphalt: '#3a3d42',
  asphaltWorn: '#45484d',
  sidewalk: '#9a9a96',
  curb: '#b5b5b0',
  lineWhite: '#f2f2f0',
  lineYellow: '#f2c230',
  grass: '#5c8042',
  plazaStone: '#848078',
  plazaPavingAlt: '#8c8880',
  water: '#4a7c99',      // sông Spree — xanh xám đặc trưng sông Berlin
  riverBank: '#7a756a',  // tường kè đá (Kaimauer) quanh sông
  treeLeaf: ['#3f7a3a', '#55913f'],
  wallCream: '#e8dfc8',
  wallGrey: '#b8b4aa',
  wallBrick: '#b5654a',
  roofTile: '#7a3b2e',
  window: '#4a6a80',
  // Trời/fog: fog của three trộn vào framebuffer SAU tone mapping → màu hiển thị =
  // giá trị LINEAR của hex. Chọn hex sáng hơn bình thường để hiển thị ra trời xanh dịu.
  skyTop: '#8ab8e8',
  skyHorizon: '#d5e8f8'
} as const;

export type PaletteKey = keyof typeof palette;
