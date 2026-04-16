import { vi, beforeEach, afterEach } from 'vitest';

// In-memory stores — cleared before every test
const localStore = {};
const syncStore = {};

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : Object.keys(keys);
        keyList.forEach(k => { if (k in localStore) result[k] = localStore[k]; });
        callback(result);
      }),
      set: vi.fn((data, callback) => {
        Object.assign(localStore, data);
        if (callback) callback();
      }),
      remove: vi.fn((keys, callback) => {
        (Array.isArray(keys) ? keys : [keys]).forEach(k => delete localStore[k]);
        if (callback) callback();
      }),
    },
    sync: {
      get: vi.fn((defaults, callback) => {
        const result = { ...defaults };
        Object.keys(defaults).forEach(k => { if (k in syncStore) result[k] = syncStore[k]; });
        callback(result);
      }),
      set: vi.fn((data, callback) => {
        Object.assign(syncStore, data);
        if (callback) callback();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    lastError: undefined,
  },
};

beforeEach(() => {
  // Reset in-memory stores so each test starts with clean storage
  Object.keys(localStore).forEach(k => delete localStore[k]);
  Object.keys(syncStore).forEach(k => delete syncStore[k]);
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});
