/**
 * Multi-persona storage helpers.
 *
 * The app supports running several test personas in the same browser by
 * scoping localStorage keys with a `?user=<slot>` URL param. Open
 * `…/?user=A` and `…/?user=B` in two tabs to demo two users on one device.
 *
 * Pure functions — they accept the search/href as a string so they're easy
 * to unit-test without jsdom. The React glue in App.tsx passes
 * `window.location.search` / `window.location.href` at the call site.
 */

const SLOT_KEY_PREFIX = 'mbti-user-';
const LEGACY_KEY = 'mbti-user';

export function getUserSlot(search = '') {
  const params = new URLSearchParams(search);
  return params.get('user') ?? 'default';
}

export function getUserStorageKey(search = '') {
  return SLOT_KEY_PREFIX + getUserSlot(search);
}

export function shouldForceOnboarding(search = '') {
  return new URLSearchParams(search).has('newuser');
}

/** Strip ?newuser from an href, preserving everything else. */
export function cleanFreshFlag(href) {
  const url = new URL(href);
  if (!url.searchParams.has('newuser')) return href;
  url.searchParams.delete('newuser');
  // URL.toString() includes a trailing "?" if no params remain — strip it.
  return url.toString().replace(/\?$/, '');
}

/**
 * One-time migration: move pre-multi-persona localStorage data from the
 * legacy key (`mbti-user`) to the default-slot key. Called from App.tsx
 * bootstrap. Safe to call repeatedly — it's a no-op after the first run.
 */
export function migrateLegacyKey(storage = globalThis.localStorage) {
  if (!storage) return;
  const legacy = storage.getItem(LEGACY_KEY);
  const defaultKey = SLOT_KEY_PREFIX + 'default';
  if (legacy && !storage.getItem(defaultKey)) {
    storage.setItem(defaultKey, legacy);
  }
  if (legacy) storage.removeItem(LEGACY_KEY);
}
