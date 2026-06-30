export const categoryGroups = [
  { id: 'gefahrenlehre', de: 'Gefahrenlehre', vi: 'Lý thuyết về nguy hiểm', keys: ['Lý thuyết về nguy hiểm', 'Các tình huống nguy hiểm', 'Nhận biết nguy hiểm', 'Gefahrenlehre', 'Các mối nguy hiểm'] },
  { id: 'verhalten', de: 'Verhalten im Straßenverkehr', vi: 'Hành vi trong giao thông', keys: ['Verhalten Im Strassenverkehr', 'Hành Vi Trong Giao Thông Đường Bộ', 'Hành vi trong giao thông đường bộ', 'Verhalten'] },
  { id: 'vorfahrt', de: 'Vorfahrt, Vorrang', vi: 'Nhường đường & Quyền ưu tiên', keys: ['Vorfahrt Vorrang', 'Vorfahrt'] },
  { id: 'verkehrszeichen', de: 'Verkehrszeichen', vi: 'Biển báo giao thông', keys: ['Verkehrszeichen'] },
  { id: 'umweltschutz', de: 'Umweltschutz', vi: 'Bảo vệ môi trường', keys: ['Umweltschutz', 'Umwelt'] },
  { id: 'technik', de: 'Technik', vi: 'Kỹ thuật', keys: ['Technik', 'Technik & Formeln'] },
  { id: 'eignung', de: 'Eignung und Befähigung', vi: 'Phẩm chất & Năng lực', keys: ['Eignung Und Befaehigung Von Kraftfahrern'] },
  { id: 'vorschriften', de: 'Vorschriften', vi: 'Quy định vận hành', keys: ['Vorschriften Ueber Den Betrieb Der Fahrzeuge'] },
  { id: 'autobahn', de: 'Autobahn', vi: 'Đường cao tốc', keys: ['Autobahn'] }
];

export const getCategoryLabel = (cat, languageMode) => {
  if (!cat) return '';
  const group = categoryGroups.find(g => g.keys.includes(cat));
  if (group) return languageMode === 'de' ? group.de : `${group.vi} / ${group.de}`;
  return cat; // fallback
};
