/**
 * 👨‍✈️ BERLIN-MITTE DYNAMIC DRIVING DIRECTIVES (Hệ Thống Ra Lệnh Hướng Đi Động StVO)
 * 
 * - Điểm xuất phát cố định duy nhất (Fixed Central Spawn Point):
 *   Friedrichstraße / Unter den Linden [X: 2.5, Z: 25.0, Rot: 0]
 * - Mỗi lần xuất phát hoặc đổi bài: Giám khảo Fahrprüfer ra lệnh 1 hướng đi khác nhau
 * - Hỗ trợ Text-to-Speech phát âm tiếng Đức chuẩn bài thi lái xe thực hành StVO Đức
 */

export const BERLIN_FIXED_SPAWN = {
  x: -2.88,
  y: 0,
  z: 32.0,
  rot: 0,
  nameVi: 'Điểm Xuất Phát Fahrschule (Friedrichstraße / Unter den Linden)',
  nameDe: 'Fahrschule Startpunkt · Friedrichstraße'
};

export const BERLIN_DIRECTIVES = [
  {
    id: 'dir_east_alexanderplatz',
    titleVi: 'Hướng Đông · Quảng Trường Alexanderplatz',
    titleDe: 'Richtung Osten · Alexanderplatz',
    icon: '🗼',
    arrow: '↗️',
    color: '#ef4444',
    commandDe: 'Fahren Sie an der nächsten Ampelkreuzung geradeaus und biegen Sie danach rechts ab auf Unter den Linden in Richtung Alexanderplatz.',
    commandVi: 'Ở ngã tư đèn xanh kế tiếp, đi thẳng rồi rẽ phải vào Unter den Linden hướng về Alexanderplatz / Tháp Fernsehturm.',
    lawBadge: '§ 37 StVO (Đèn giao thông) & § 4 StVO (Khoảng cách an toàn)',
    speedLimit: 50,
    dest: {
      x: 1392.9,
      z: 421.8,
      nameVi: 'Quảng Trường Alexanderplatz & Tháp Fernsehturm',
      nameDe: 'Alexanderplatz & Fernsehturm',
      radius: 60
    },
    tipVi: 'Tốc độ tối đa 50 km/h. Quan sát đèn Ampel, dừng trước vạch người đi bộ và giữ khoảng cách an toàn.',
    tipDe: 'Zulässige Höchstgeschwindigkeit 50 km/h. Ampeln beachten und Abstand zum Vordermann halten.'
  },
  {
    id: 'dir_west_brandenburg',
    titleVi: 'Hướng Tây · Cổng Brandenburger Tor',
    titleDe: 'Richtung Westen · Brandenburger Tor',
    icon: '🏛️',
    arrow: '↖️',
    color: '#22c55e',
    commandDe: 'Biegen Sie an der Kreuzung links ab auf den Boulevard Unter den Linden in Richtung Brandenburger Tor und Tiergarten.',
    commandVi: 'Rẽ trái tại ngã tư vào Đại lộ Unter den Linden hướng về Cổng Brandenburger Tor & Công viên Tiergarten.',
    lawBadge: '§ 9 Abs. 3 StVO (Rẽ trái nhường xe ngược chiều) & Schulterblick',
    speedLimit: 50,
    dest: {
      x: -755.7,
      z: -84.6,
      nameVi: 'Cổng Brandenburger Tor & Pariser Platz',
      nameDe: 'Brandenburger Tor & Pariser Platz',
      radius: 60
    },
    tipVi: 'Bật xi-nhan trái sớm, nhường dòng xe đi thẳng ngược chiều và quay đầu kiểm tra điểm mù xe đạp (Schulterblick).',
    tipDe: 'Rechtzeitig links blinken, Gegenverkehr durchfahren lassen und Schulterblick für Radfahrer durchführen.'
  },
  {
    id: 'dir_north_hackescher',
    titleVi: 'Hướng Bắc · Phố Cổ Hackescher Markt (Zone 30)',
    titleDe: 'Richtung Norden · Hackescher Markt (Zone 30)',
    icon: '☕',
    arrow: '⬆️',
    color: '#f97316',
    commandDe: 'Folgen Sie der Friedrichstraße über die Spreebrücke und biegen Sie an der zweiten Kreuzung rechts in die Tempo-30-Zone ab.',
    commandVi: 'Tiếp tục đi thẳng qua cầu Friedrichstraßenbrücke, sau đó rẽ phải ở ngã tư thứ hai vào khu phố cổ (Zone 30).',
    lawBadge: '§ 8 StVO (Rechts vor Links) & § 45 StVO (Zone 30)',
    speedLimit: 30,
    dest: {
      x: 650.0,
      z: 750.0,
      nameVi: 'Phố Cổ Hackescher Markt & Scheunenviertel',
      nameDe: 'Hackescher Markt & Scheunenviertel',
      radius: 55
    },
    tipVi: 'Giảm tốc dưới 30 km/h khi qua biển Zone 30, luôn quan sát và nhường xe đến từ ngã ba bên phải (Rechts vor Links).',
    tipDe: 'Geschwindigkeit auf unter 30 km/h drosseln. Unbedingt Rechts vor Links an unbeschilderten Kreuzungen beachten.'
  },
  {
    id: 'dir_south_gendarmenmarkt',
    titleVi: 'Hướng Nam · Quảng Trường Gendarmenmarkt',
    titleDe: 'Richtung Süden · Gendarmenmarkt & Längsparken',
    icon: '⛪',
    arrow: '⬇️',
    color: '#a855f7',
    commandDe: 'Fahren Sie nach Süden bis zur Französischen Straße, biegen Sie links ab zum Gendarmenmarkt und führen Sie ein Längsparken durch.',
    commandVi: 'Đi xuôi về phía Nam tới phố Französische Straße, rẽ trái vào Gendarmenmarkt và thực hiện bài tập đỗ xe song song.',
    lawBadge: '§ 12 StVO (Đỗ xe) & § 9 StVO (Chuyển hướng an toàn)',
    speedLimit: 50,
    dest: {
      x: 218.0,
      z: -362.9,
      nameVi: 'Quảng Trường Gendarmenmarkt & Nhà Thờ Đôi',
      nameDe: 'Gendarmenmarkt & Französischer Dom',
      radius: 50
    },
    tipVi: 'Bật xi-nhan phải, quan sát gương hậu và Schulterblick trước khi lùi ghép xe song song cách lề đường dưới 30cm.',
    tipDe: 'Rechts blinken, Rückspiegel und Schulterblick prüfen, dann zügig parallel zum Bordstein einparken.'
  },
  {
    id: 'dir_residential_linienstrasse',
    titleVi: 'Tuyến Dân Cư · Linienstraße (Fahrradstraße)',
    titleDe: 'Wohngebiet · Linienstraße (Fahrradstraße)',
    icon: '🚲',
    arrow: '↗️',
    color: '#10b981',
    commandDe: 'Biegen Sie an der Querstraße rechts ab in die Fahrradstraße. Achten Sie besonders auf Radfahrer und Fußgänger.',
    commandVi: 'Rẽ phải ở đường nhánh vào tuyến phố xe đạp (Fahrradstraße). Nhường quyền ưu tiên cho xe đạp và chú ý vạch đi bộ.',
    lawBadge: '§ 21a StVO (Phố xe đạp) & § 26 StVO (Vạch Zebrastreifen)',
    speedLimit: 30,
    dest: {
      x: 50.0,
      z: 650.0,
      nameVi: 'Tuyến Phố Linienstraße & Scheunenviertel',
      nameDe: 'Linienstraße (Fahrradstraße 30)',
      radius: 45
    },
    tipVi: 'Không vượt xe đạp nếu không đủ khoảng cách hông 1.5m. Nhường tuyệt đối người đi bộ đang bước lên vạch Zebrastreifen.',
    tipDe: 'Mindestens 1,5m Seitenabstand zu Radfahrern einhalten. Fußgängern am Zebrastreifen Vorrang gewähren.'
  },
  {
    id: 'dir_stop_leipziger',
    titleVi: 'Thử Thách Giao Lộ · Biển STOP Leipziger Straße',
    titleDe: 'Stoppschild-Prüfung · Leipziger Straße',
    icon: '🛑',
    arrow: '🛑',
    color: '#e11d48',
    commandDe: 'Fahren Sie geradeaus bis zur Leipziger Straße, halten Sie am Stoppschild für volle 3 Sekunden und biegen Sie dann ab.',
    commandVi: 'Đi thẳng tới giao lộ Leipziger Straße, dừng hẳn bánh xe trước biển STOP đủ 3 giây rồi mới tiếp tục chuyển hướng.',
    lawBadge: '§ 41 StVO (Zeichen 206 Halt! Vorfahrt gewähren)',
    speedLimit: 50,
    dest: {
      x: 42.0,
      z: -460.0,
      nameVi: 'Giao Lộ Friedrichstraße / Mohrenstraße (STOP)',
      nameDe: 'Kreuzung Friedrichstraße / Mohrenstraße (STOP)',
      radius: 45
    },
    tipVi: 'Vận tốc xe phải về đúng 0 km/h trong 3 giây trước vạch dừng Haltelinie. Quan sát kỹ cả 2 chiều trước khi nhập làn.',
    tipDe: 'Vollständiger Stillstand (0 km/h) für mindestens 3 Sekunden an der Haltlinie. Vorfahrt beachten.'
  }
];

/**
 * Lấy ngẫu nhiên một hướng ra lệnh khác với hướng hiện tại
 */
export function getRandomDirective(currentId = null) {
  const candidates = currentId 
    ? BERLIN_DIRECTIVES.filter(d => d.id !== currentId)
    : BERLIN_DIRECTIVES;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx] || BERLIN_DIRECTIVES[0];
}

/**
 * Lấy hướng ra lệnh theo id
 */
export function getDirectiveById(id) {
  return BERLIN_DIRECTIVES.find(d => d.id === id) || BERLIN_DIRECTIVES[0];
}

/**
 * Tính khoảng cách còn lại tới đích (mét)
 */
export function getDistanceToDest(carX, carWorldZ, dest) {
  if (!dest) return 9999;
  const dx = carX - dest.x;
  const dz = carWorldZ - dest.z;
  return Math.hypot(dx, dz);
}

/**
 * Phát âm thanh giọng nói của Giám khảo Fahrprüfer bằng Web Speech API
 */
export function speakExaminerDirective(textDe) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel(); // Hủy giọng đọc cũ nếu đang phát
    const utterance = new SpeechSynthesisUtterance(textDe);
    utterance.lang = 'de-DE';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Không làm gián đoạn nếu trình duyệt chặn autoplay audio
  }
}
