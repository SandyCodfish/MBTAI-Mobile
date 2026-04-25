/**
 * Tests for src/storage.js — pure URL/localStorage helpers used to support
 * multiple personas in the same browser via `?user=A`, `?user=B`, etc.
 *
 * Pure functions take a search string so they're trivially testable with
 * node:test (no jsdom needed).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserSlot,
  getUserStorageKey,
  shouldForceOnboarding,
  cleanFreshFlag,
} from '../storage.js';

test('getUserSlot defaults to "default" when ?user is absent', () => {
  assert.equal(getUserSlot(''), 'default');
  assert.equal(getUserSlot('?other=1'), 'default');
});

test('getUserSlot returns the ?user value', () => {
  assert.equal(getUserSlot('?user=A'), 'A');
  assert.equal(getUserSlot('?user=alice'), 'alice');
});

test('getUserSlot ignores ?newuser interaction', () => {
  assert.equal(getUserSlot('?user=A&newuser'), 'A');
  assert.equal(getUserSlot('?newuser&user=B'), 'B');
});

test('getUserStorageKey scopes by slot so personas are isolated', () => {
  assert.equal(getUserStorageKey(''), 'mbti-user-default');
  assert.equal(getUserStorageKey('?user=A'), 'mbti-user-A');
  assert.equal(getUserStorageKey('?user=B'), 'mbti-user-B');
  assert.notEqual(getUserStorageKey('?user=A'), getUserStorageKey('?user=B'));
});

test('shouldForceOnboarding returns true only when ?newuser is present', () => {
  assert.equal(shouldForceOnboarding(''), false);
  assert.equal(shouldForceOnboarding('?user=A'), false);
  assert.equal(shouldForceOnboarding('?newuser'), true);
  assert.equal(shouldForceOnboarding('?user=A&newuser'), true);
});

test('cleanFreshFlag strips ?newuser from a URL while preserving the rest', () => {
  assert.equal(
    cleanFreshFlag('https://example.com/?newuser'),
    'https://example.com/',
  );
  assert.equal(
    cleanFreshFlag('https://example.com/?user=A&newuser'),
    'https://example.com/?user=A',
  );
  assert.equal(
    cleanFreshFlag('https://example.com/?newuser&user=B'),
    'https://example.com/?user=B',
  );
});

test('cleanFreshFlag is a no-op when ?newuser is absent', () => {
  assert.equal(
    cleanFreshFlag('https://example.com/?user=A'),
    'https://example.com/?user=A',
  );
  assert.equal(
    cleanFreshFlag('https://example.com/'),
    'https://example.com/',
  );
});
