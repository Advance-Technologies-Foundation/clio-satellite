// Builds the view model of one surface (login or shell) from the cached feed and the stored state.
import { validateFeed, selectVisible, unreadItems, onboardingSkip } from './newsCore.js';
import { loadState, requestFeed, pruneTo, completeOnboarding } from './newsStore.js';

function extensionVersion() {
  try {
    return chrome.runtime.getManifest?.().version;
  } catch {
    return undefined;
  }
}

let pruned = false;

// Returns null when news are off or there is nothing to show
export async function loadSurface(surface, { now = Date.now() } = {}) {
  const state = await loadState();
  if (!state.enabled) return null;
  const raw = await requestFeed();
  if (!raw) return null;
  const { items } = validateFeed(raw);
  if (!state.onboardedAt) {
    state.skipped = await completeOnboarding(onboardingSkip(items, { now }), now);
  }
  if (!pruned && items.length) {
    pruned = true;
    pruneTo(items.map(i => i.id));
  }
  const visible = selectVisible(items, {
    now,
    surface,
    audiences: state.audiences,
    extensionVersion: extensionVersion(),
    read: state.read,
    firstShown: state.firstShown,
    skipped: state.skipped,
  });
  if (!visible.length) return null;
  const ctx = { now, read: state.read, firstShown: state.firstShown };
  return { visible, unread: unreadItems(visible, ctx), ctx, state };
}
