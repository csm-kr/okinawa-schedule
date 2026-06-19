import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStore } from './index';
import { MemoryStore } from './memory';
import { UpstashStore } from './upstash';

const ORIGINAL = { ...process.env };

describe('getStore', () => {
  beforeEach(() => {
    delete process.env.STORAGE_DRIVER;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('기본(미설정)은 MemoryStore 를 반환한다', () => {
    expect(getStore()).toBeInstanceOf(MemoryStore);
  });

  it('STORAGE_DRIVER=memory 면 MemoryStore', () => {
    process.env.STORAGE_DRIVER = 'memory';
    expect(getStore()).toBeInstanceOf(MemoryStore);
  });

  it('STORAGE_DRIVER=upstash 면 UpstashStore (env 로 구성)', () => {
    process.env.STORAGE_DRIVER = 'upstash';
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    expect(getStore()).toBeInstanceOf(UpstashStore);
  });

  it('UPSTASH_* 가 없어도 Vercel 주입 KV_REST_API_* 로 UpstashStore 를 구성한다', () => {
    process.env.STORAGE_DRIVER = 'upstash';
    process.env.KV_REST_API_URL = 'https://example.upstash.io';
    process.env.KV_REST_API_TOKEN = 'kv-token';
    expect(getStore()).toBeInstanceOf(UpstashStore);
  });

  it('upstash 인데 env 가 없으면 throw (실수 방지)', () => {
    process.env.STORAGE_DRIVER = 'upstash';
    expect(() => getStore()).toThrow();
  });
});
