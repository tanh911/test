/**
 * 🎓 GERMAN FAHRSCHULE LESSON & EXAM CURRICULUM MANAGER (Grundfahraufgaben)
 * Implements structured training lessons for German Driving License Class B (Klasse B).
 */

export const GERMAN_FAHRSCHULE_LESSONS = [
  {
    id: 'lesson_01_anfahren',
    titleVi: 'Bài 1: Khởi hành & Dừng xe an toàn (Anfahren & Anhalten)',
    titleDe: 'Lektion 1: Anfahren & Anhalten (§ 14 StVO)',
    category: 'Grundfahraufgaben',
    durationMinutes: 10,
    objectives: [
      'Thắt dây an toàn (§ 21a StVO)',
      'Bật xi-nhan trước khi rời lề đường',
      'Quan sát vai Schulterblick & nhìn gương chiếu hậu',
      'Dừng xe êm ái trước vạch kẻ đường'
    ],
    spawnPos: { x: -2.88, z: 32.0, rot: 0 },
    targetPos: { x: -2.88, z: 120.0, rot: 0 }
  },
  {
    id: 'lesson_02_parken_parallel',
    titleVi: 'Bài 2: Đỗ xe song song lề đường (Längsparken)',
    titleDe: 'Lektion 2: Längsparken in eine Lücke (§ 12 StVO)',
    category: 'Grundfahraufgaben',
    durationMinutes: 15,
    objectives: [
      'Bật xi-nhan phải và rà phanh lùi xe vào bãi',
      'Quan sát góc chết vai phải Schulterblick',
      'Khoảng cách bánh xe đến bó vỉa đá Granit dưới 30 cm'
    ],
    spawnPos: { x: 154, z: -236, rot: Math.PI },
    targetPos: { x: 156, z: -248, rot: Math.PI }
  },
  {
    id: 'lesson_03_gefahrenbremsung',
    titleVi: 'Bài 3: Phanh khẩn cấp từ 50 km/h (Gefahrenbremsung)',
    titleDe: 'Lektion 3: Abbremsen mit höchstmöglicher Verzögerung',
    category: 'Grundfahraufgaben',
    durationMinutes: 10,
    objectives: [
      'Tăng tốc đạt đúng 50 km/h',
      'Đạp hết hành trình phanh khẩn cấp khi nhận hiệu lệnh',
      'Dừng xe an toàn trên đường thẳng không lệch làn'
    ],
    spawnPos: { x: -781, z: -37, rot: -Math.PI / 2 },
    targetPos: { x: -1100, z: -37, rot: -Math.PI / 2 }
  },
  {
    id: 'lesson_04_rechts_vor_links',
    titleVi: 'Bài 4: Ưu tiên bên phải Zone 30 (Rechts vor Links)',
    titleDe: 'Lektion 4: Vorfahrt im Wohngebiet Tempo-30-Zone (§ 8 StVO)',
    category: 'StVO Rules',
    durationMinutes: 20,
    objectives: [
      'Duy trì tốc độ dưới 30 km/h',
      'Giảm tốc độ và nhường đường cho xe từ nhánh bên phải tới',
      'Không bấm còi bừa bãi (§ 16 StVO)'
    ],
    spawnPos: { x: -16, z: 1290, rot: Math.PI / 2 },
    targetPos: { x: 250, z: 1290, rot: Math.PI / 2 }
  },
  {
    id: 'lesson_05_praktische_pruefung',
    titleVi: 'Bài 5: Bài Thi Thực Hành Tổng Hợp 45 Phút (Praktische Fahrprüfung)',
    titleDe: 'Lektion 5: Praktische Fahrprüfung Klasse B (45 Min)',
    category: 'Exam Mode',
    durationMinutes: 45,
    objectives: [
      'Tuân thủ 100% chỉ dẫn của Giám khảo Prüfer',
      'Không phạm lỗi nghiêm trọng (Schwerer Fehler): Không vượt đèn đỏ, không bỏ qua biển STOP',
      'Đạt tối thiểu 85/100 điểm để nhận bằng lái xe Đức'
    ],
    spawnPos: { x: -2.88, z: 32.0, rot: 0 },
    targetPos: null
  }
];

export class LessonManager {
  constructor() {
    this.currentLesson = GERMAN_FAHRSCHULE_LESSONS[0];
    this.lessonProgress = 0; // 0 to 100%
    this.completedLessons = new Set();
  }

  selectLesson(lessonId) {
    const lesson = GERMAN_FAHRSCHULE_LESSONS.find(l => l.id === lessonId);
    if (lesson) {
      this.currentLesson = lesson;
      this.lessonProgress = 0;
      return lesson;
    }
    return null;
  }

  evaluateLessonProgress(playerX, playerZ, speed, violations = []) {
    if (!this.currentLesson || !this.currentLesson.targetPos) return 100;

    const dx = playerX - this.currentLesson.targetPos.x;
    const dz = playerZ - this.currentLesson.targetPos.z;
    const distToTarget = Math.hypot(dx, dz);

    if (distToTarget < 8.0 && speed < 5.0 && violations.length === 0) {
      this.completedLessons.add(this.currentLesson.id);
      this.lessonProgress = 100;
      return 100;
    }

    const startX = this.currentLesson.spawnPos.x;
    const startZ = this.currentLesson.spawnPos.z;
    const totalDist = Math.hypot(this.currentLesson.targetPos.x - startX, this.currentLesson.targetPos.z - startZ) || 1.0;
    const currentDist = Math.hypot(playerX - startX, playerZ - startZ);

    this.lessonProgress = Math.min(99, Math.round((currentDist / totalDist) * 100));
    return this.lessonProgress;
  }
}
