// 🎨 Bảng màu low poly thống nhất — Protocol mục 2.
// KHÔNG hardcode màu rải rác: mọi material/vertex color đọc từ đây.
export const palette = {
  asphalt: '#3a3d42',
  asphaltWorn: '#45484d',
  sidewalk: '#9a9a96',
  curb: '#b5b5b0',
  lineWhite: '#f2f2f0',
  lineYellow: '#f2c230',
  grass: '#6b9a4a',
  treeLeaf: ['#3f7a3a', '#55913f'],
  wallCream: '#e8dfc8',
  wallGrey: '#b8b4aa',
  wallBrick: '#b5654a',
  roofTile: '#7a3b2e',
  window: '#4a6a80',
  skyTop: '#6aa8e8',
  skyHorizon: '#cfe6f7'
} as const;

export type PaletteKey = keyof typeof palette;
