import { describe, it, expect } from 'vitest';
import { getMediaUrl } from './mediaHelpers';

describe('getMediaUrl', () => {
  it('returns empty string if url is falsy', () => {
    expect(getMediaUrl('')).toBe('');
    expect(getMediaUrl(null)).toBe('');
    expect(getMediaUrl(undefined)).toBe('');
  });

  it('preserves absolute http/https/blob/data URLs', () => {
    expect(getMediaUrl('https://example.com/video.mp4')).toBe('https://example.com/video.mp4');
    expect(getMediaUrl('http://example.com/video.mp4')).toBe('http://example.com/video.mp4');
    expect(getMediaUrl('data:video/mp4;base64,123')).toBe('data:video/mp4;base64,123');
    expect(getMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
  });

  it('formats root relative URLs correctly', () => {
    expect(getMediaUrl('/videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
    expect(getMediaUrl('/images/1_2_37-002-B.png')).toBe('/images/1_2_37-002-B.png');
  });

  it('fixes relative URLs without leading slash', () => {
    expect(getMediaUrl('videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
    expect(getMediaUrl('images/1_2_37-002-B.png')).toBe('/images/1_2_37-002-B.png');
  });

  it('strips route prefixes like training/ or fragen/', () => {
    expect(getMediaUrl('training/videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
    expect(getMediaUrl('/training/videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
    expect(getMediaUrl('./training/videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
    expect(getMediaUrl('fragen/videos/1_2_37-201-M.mp4')).toBe('/videos/1_2_37-201-M.mp4');
  });
});
