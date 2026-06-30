import { describe, it, expect } from 'vitest';
import { getCategoryLabel } from './categoryHelpers';

describe('categoryHelpers', () => {
  it('should return correct label for German language mode', () => {
    expect(getCategoryLabel('Verkehrszeichen', 'de')).toBe('Verkehrszeichen');
    expect(getCategoryLabel('Vorfahrt', 'de')).toBe('Vorfahrt, Vorrang');
  });

  it('should return bilingual label for Vietnamese language mode or both', () => {
    expect(getCategoryLabel('Verkehrszeichen', 'vi')).toBe('Biển báo giao thông / Verkehrszeichen');
    expect(getCategoryLabel('Vorfahrt', 'both')).toBe('Nhường đường & Quyền ưu tiên / Vorfahrt, Vorrang');
  });

  it('should return fallback string when category is unknown', () => {
    expect(getCategoryLabel('Unknown Category', 'de')).toBe('Unknown Category');
  });

  it('should return empty string when category is falsy', () => {
    expect(getCategoryLabel('', 'de')).toBe('');
    expect(getCategoryLabel(null, 'vi')).toBe('');
    expect(getCategoryLabel(undefined, 'both')).toBe('');
  });
});
