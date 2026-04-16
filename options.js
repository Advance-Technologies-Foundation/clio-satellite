// options.js

const defaultProfiles = [
  { username: 'Supervisor', password: 'Supervisor', alias: '' }
];

// DOM refs
const userList                = document.getElementById('user-list');
const addProfileBtn           = document.getElementById('add-profile-btn');
const setToDefaultsBtn        = document.getElementById('set-to-defaults');

const profileModal            = document.getElementById('profile-modal');
const profileForm             = document.getElementById('profile-form');
const modalTitle              = document.getElementById('modal-title');
const profileUsernameInput    = document.getElementById('profile-username');
const profilePasswordInput    = document.getElementById('profile-password');
const profileAliasInput       = document.getElementById('profile-alias');
const profileUrlInput         = document.getElementById('profile-url');
const profileAutologinCheckbox = document.getElementById('profile-autologin');
const saveProfileBtn          = document.getElementById('save-profile-btn');
const closeModalBtn           = document.querySelector('.close');
const cancelProfileBtn        = document.getElementById('cancel-profile');
const togglePasswordBtn       = document.getElementById('toggle-password');

const confirmModal            = document.getElementById('confirm-modal');
const confirmDeleteBtn        = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn         = document.getElementById('cancel-delete-btn');
const confirmCloseBtn         = document.querySelector('.confirm-close');

const closeBtn                = document.getElementById('close-btn');

let currentDeleteIndexToDelete = -1;
let isBulkDelete = false;
let currentEditIndex = -1;
let isEditMode = false;

// ── SVGs for list item buttons ───────────────────────────────────────────────

const SVG_PENCIL = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 2.5a2.12 2.12 0 0 1 3 3L5 15H2v-3L11.5 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const SVG_TRASH = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1m2 0v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4h10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ── Profile list ─────────────────────────────────────────────────────────────

function loadProfiles() {
  userList.innerHTML = '';

  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    data.userProfiles.forEach((profile, index) => {
      const displayName = profile.alias && profile.alias.trim()
        ? `${profile.alias} (${profile.username})`
        : profile.username;

      const urlText = profile.url && profile.url.trim()
        ? profile.url
        : 'Default (all URLs)';

      const li = document.createElement('li');
      li.className = 'profile-item';

      const info = document.createElement('div');
      info.className = 'profile-item__info';

      const nameEl = document.createElement('div');
      nameEl.className = 'profile-item__name';
      nameEl.textContent = displayName;

      const metaEl = document.createElement('div');
      metaEl.className = 'profile-item__meta';
      metaEl.textContent = urlText;

      info.appendChild(nameEl);
      info.appendChild(metaEl);

      const actions = document.createElement('div');
      actions.className = 'profile-item__actions';

      const editButton = document.createElement('button');
      editButton.className = 'icon-btn edit-button';
      editButton.title = 'Edit';
      editButton.innerHTML = SVG_PENCIL;
      editButton.addEventListener('click', () => openEditModal(profile, index));

      const deleteButton = document.createElement('button');
      deleteButton.className = 'icon-btn delete-button';
      deleteButton.title = 'Delete';
      deleteButton.innerHTML = SVG_TRASH;
      deleteButton.addEventListener('click', () => openConfirmModal(index));

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);

      li.appendChild(info);
      li.appendChild(actions);
      userList.appendChild(li);
    });
  });
}

// ── Profile modal ────────────────────────────────────────────────────────────

function openAddModal() {
  isEditMode = false;
  currentEditIndex = -1;
  modalTitle.textContent = 'Add Profile';
  saveProfileBtn.textContent = 'Add Profile';
  profileForm.reset();
  profileModal.style.display = 'block';
}

function openEditModal(profile, index) {
  isEditMode = true;
  currentEditIndex = index;
  modalTitle.textContent = 'Edit Profile';
  saveProfileBtn.textContent = 'Save Changes';
  profileUsernameInput.value = profile.username;
  profilePasswordInput.value = profile.password;
  profileAliasInput.value = profile.alias || '';
  profileUrlInput.value = profile.url || '';
  profileAutologinCheckbox.checked = profile.autologin || false;
  profileModal.style.display = 'block';
}

function closeProfileModal() {
  profileModal.style.display = 'none';
  currentEditIndex = -1;
  isEditMode = false;
  profileForm.reset();
  profilePasswordInput.type = 'password';
  togglePasswordBtn.style.opacity = '1';
}

function handleProfileSubmit(event) {
  event.preventDefault();

  const username  = profileUsernameInput.value.trim();
  const password  = profilePasswordInput.value;
  const alias     = profileAliasInput.value.trim();
  let   url       = profileUrlInput.value.trim();
  const autologin = profileAutologinCheckbox.checked;

  if (url) url = url.replace(/\/$/, '');

  if (!username || !password) {
    alert('Please fill in username and password fields.');
    return;
  }

  if (isEditMode) {
    if (currentEditIndex === -1) return;

    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      if (profiles[currentEditIndex]) {
        profiles[currentEditIndex] = { username, password, alias, url, autologin };
        chrome.storage.sync.set({ userProfiles: profiles }, () => {
          closeProfileModal();
          loadProfiles();
        });
      }
    });
  } else {
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      profiles.push({ username, password, alias, url, autologin });
      chrome.storage.sync.set({ userProfiles: profiles }, () => {
        closeProfileModal();
        loadProfiles();
      });
    });
  }
}

// ── Confirm modal ────────────────────────────────────────────────────────────

function openConfirmModal(index) {
  currentDeleteIndexToDelete = index;
  confirmModal.style.display = 'block';
}

function closeConfirmModal() {
  confirmModal.style.display = 'none';
  currentDeleteIndexToDelete = -1;
  isBulkDelete = false;
  const msg = confirmModal.querySelector('.modal-body p');
  msg.textContent = 'Are you sure you want to delete this profile?';
}

confirmDeleteBtn.addEventListener('click', () => {
  if (isBulkDelete) {
    chrome.storage.sync.set({ userProfiles: [] }, () => {
      confirmModal.style.display = 'none';
      isBulkDelete = false;
      loadProfiles();
    });
  } else {
    const idx = currentDeleteIndexToDelete;
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      profiles.splice(idx, 1);
      chrome.storage.sync.set({ userProfiles: profiles }, () => {
        confirmModal.style.display = 'none';
        loadProfiles();
      });
    });
  }
  currentDeleteIndexToDelete = -1;
});

function setToDefaults() {
  isBulkDelete = true;
  const msg = confirmModal.querySelector('.modal-body p');
  msg.textContent = 'Are you sure you want to delete all profiles?';
  confirmModal.style.display = 'block';
}

// ── Password toggle ──────────────────────────────────────────────────────────

togglePasswordBtn.addEventListener('click', () => {
  const isPassword = profilePasswordInput.type === 'password';
  profilePasswordInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.style.opacity = isPassword ? '0.5' : '1';
});

// ── Copy buttons ─────────────────────────────────────────────────────────────

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const value = document.getElementById(btn.dataset.copyTarget)?.value;
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      btn.classList.add('copied');
      const original = btn.innerHTML;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 1500);
    });
  });
});

// ── Event listeners ──────────────────────────────────────────────────────────

closeBtn.addEventListener('click', () => window.close());
addProfileBtn.addEventListener('click', openAddModal);
setToDefaultsBtn.addEventListener('click', setToDefaults);
profileForm.addEventListener('submit', handleProfileSubmit);
closeModalBtn.addEventListener('click', closeProfileModal);
cancelProfileBtn.addEventListener('click', closeProfileModal);
cancelDeleteBtn.addEventListener('click', closeConfirmModal);
confirmCloseBtn.addEventListener('click', closeConfirmModal);

window.addEventListener('click', (event) => {
  if (event.target === profileModal) closeProfileModal();
  else if (event.target === confirmModal) closeConfirmModal();
});

// ── Theme management ─────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'system');
}

document.getElementById('theme-toggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-switcher__btn');
  if (!btn) return;
  const theme = btn.dataset.themeValue;
  applyTheme(theme);
  chrome.storage.local.set({ theme });
});

// ── Init ─────────────────────────────────────────────────────────────────────

function initializeDefaultProfilesIfNeeded() {
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    let profiles = data.userProfiles;

    if (!profiles || profiles.length === 0) {
      chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => loadProfiles());
      return;
    }

    let needsUpdate = false;
    profiles = profiles.map(profile => {
      if (!profile.hasOwnProperty('alias')) { profile.alias = ''; needsUpdate = true; }
      if (!profile.hasOwnProperty('url'))   { profile.url   = ''; needsUpdate = true; }
      return profile;
    });

    if (needsUpdate) {
      chrome.storage.sync.set({ userProfiles: profiles }, () => loadProfiles());
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme before anything renders
  chrome.storage.local.get({ theme: 'system' }, (data) => applyTheme(data.theme));

  loadProfiles();
  initializeDefaultProfilesIfNeeded();
});
