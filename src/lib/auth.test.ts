import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  verifyPassword,
  createSessionCookie,
  verifySessionCookie,
  SESSION_COOKIE_NAME,
} from './auth';

const ORIGINAL = { ...process.env };

describe('auth', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'family-secret';
    process.env.ADMIN_COOKIE_SECRET = 'a-long-random-cookie-signing-secret';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  describe('verifyPassword', () => {
    it('정답이면 true', () => {
      expect(verifyPassword('family-secret')).toBe(true);
    });

    it('오답이면 false', () => {
      expect(verifyPassword('wrong')).toBe(false);
    });

    it('길이가 달라도(짧/긺) false 이고 throw 하지 않는다', () => {
      expect(verifyPassword('')).toBe(false);
      expect(verifyPassword('family-secret-plus-extra')).toBe(false);
    });

    it('ADMIN_PASSWORD 미설정이면 항상 false', () => {
      delete process.env.ADMIN_PASSWORD;
      expect(verifyPassword('family-secret')).toBe(false);
    });
  });

  describe('session cookie', () => {
    it('createSessionCookie 가 만든 값을 verifySessionCookie 가 받아들인다', () => {
      const cookie = createSessionCookie();
      expect(verifySessionCookie(cookie)).toBe(true);
    });

    it('undefined·빈 값은 거부', () => {
      expect(verifySessionCookie(undefined)).toBe(false);
      expect(verifySessionCookie('')).toBe(false);
    });

    it('형식이 틀리거나 서명이 위조되면 거부', () => {
      expect(verifySessionCookie('garbage')).toBe(false);
      const cookie = createSessionCookie();
      const tampered = cookie.slice(0, -1) + (cookie.endsWith('0') ? '1' : '0');
      expect(verifySessionCookie(tampered)).toBe(false);
    });

    it('다른 시크릿으로 서명한 쿠키는 거부 (서명 검증)', () => {
      const cookie = createSessionCookie();
      process.env.ADMIN_COOKIE_SECRET = 'a-different-secret';
      expect(verifySessionCookie(cookie)).toBe(false);
    });

    it('SESSION_COOKIE_NAME 이 정의되어 있다', () => {
      expect(typeof SESSION_COOKIE_NAME).toBe('string');
      expect(SESSION_COOKIE_NAME.length).toBeGreaterThan(0);
    });
  });
});
