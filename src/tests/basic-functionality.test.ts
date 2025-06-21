import { describe, test, expect } from '@jest/globals';

describe('Basic Functionality Tests', () => {
  test('basic math works', () => {
    expect(2 + 2).toBe(4);
  });

  test('string operations work', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });

  test('arrays work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });

  test('objects work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });

  test('promises work', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
