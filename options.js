// options.js - Logic for the extension's options page

// Define default profile
const defaultProfiles = [
  { username: 'Supervisor', password: 'Supervisor', alias: '' }
];

// Get references to DOM elements
const userList = document.getElementById('user-list');
const addProfileBtn = document.getElementById('add-profile-btn');
const setToDefaultsBtn = document.getElementById('set-to-defaults');

// Profile modal elements
const profileModal = document.getElementById('profile-modal');
const profileForm = document.getElementById('profile-form');
const modalTitle = document.getElementById('modal-title');
const profileUsernameInput = document.getElementById('profile-username');
const profilePasswordInput = document.getElementById('profile-password');
const profileAliasInput = document.getElementById('profile-alias');
const profileUrlInput = document.getElementById('profile-url');
const profileAutologinCheckbox = document.getElementById('profile-autologin');
const saveProfileBtn = document.getElementById('save-profile-btn');
const closeModalBtn = document.querySelector('.close');
const cancelProfileBtn = document.getElementById('cancel-profile');
const togglePasswordBtn = document.getElementById('toggle-password');

// Track index for deletion confirmation
let currentDeleteIndexToDelete = -1;

// Confirm modal elements
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmCloseBtn = document.querySelector('.confirm-close');

// Close options page when 'Close' button is clicked
const closeBtn = document.getElementById('close-btn');
closeBtn.addEventListener('click', () => {
  window.close();
});

// Track bulk deletion flag
let isBulkDelete = false;

let currentEditIndex = -1;
let isEditMode = false;

// Function to load and display user profiles
function loadProfiles() {
  // Clear the current list
  userList.innerHTML = '';

  // Get profiles from storage
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    const profiles = data.userProfiles;

    // Display each profile
    profiles.forEach((profile, index) => {
      const listItem = document.createElement('li');
      
      // Display profile name with alias if available
      const profileInfo = document.createElement('span');
      const displayName = profile.alias && profile.alias.trim() !== '' 
        ? `${profile.alias} (${profile.username})` 
        : profile.username;
      
      // Add URL info if available
      const urlInfo = profile.url && profile.url.trim() !== '' 
        ? ` - ${profile.url}` 
        : ' - Default (all URLs)';
      
      profileInfo.textContent = displayName + urlInfo;
      
      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '8px';
      
      // Create edit button
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.classList.add('edit-button');
      
      // Add event listener for edit button
      editButton.addEventListener('click', () => {
        openEditModal(profile, index);
      });
      
      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-button');
      
      // Add event listener for delete button
      deleteButton.addEventListener('click', () => {
        openConfirmModal(index);
      });
      
      // Append buttons to container
      buttonsContainer.appendChild(editButton);
      buttonsContainer.appendChild(deleteButton);
      
      // Append elements to list item
      listItem.appendChild(profileInfo);
      listItem.appendChild(buttonsContainer);
      
      // Append list item to the list
      userList.appendChild(listItem);
    });
  });
}

// Function to open profile modal for adding
function openAddModal() {
  isEditMode = false;
  currentEditIndex = -1;
  modalTitle.textContent = 'Add Profile';
  saveProfileBtn.textContent = 'Add Profile';
  profileForm.reset();
  profileModal.style.display = 'block';
}

// Function to open profile modal for editing
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

// Function to close profile modal
function closeProfileModal() {
  profileModal.style.display = 'none';
  currentEditIndex = -1;
  isEditMode = false;
  profileForm.reset();
  profilePasswordInput.type = 'password';
  togglePasswordBtn.style.opacity = '1';
}

// Function to handle profile form submission (both add and edit)
function handleProfileSubmit(event) {
  event.preventDefault();

  // Get input values
  const username = profileUsernameInput.value.trim();
  const password = profilePasswordInput.value;
  const alias = profileAliasInput.value.trim();
  let url = profileUrlInput.value.trim();
  const autologin = profileAutologinCheckbox.checked;
  
  // Normalize URL (remove trailing slash)
  if (url) {
    url = url.replace(/\/$/, '');
  }

  // Basic validation
  if (!username || !password) {
    alert('Please fill in username and password fields.');
    return;
  }

  if (isEditMode) {
    // Edit existing profile
    if (currentEditIndex === -1) {
      return;
    }

    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      
      // Update the profile at the specified index
      if (profiles[currentEditIndex]) {
        profiles[currentEditIndex] = { username, password, alias, url };
        profiles[currentEditIndex].autologin = autologin;

        // Save updated profiles to storage
        chrome.storage.sync.set({ userProfiles: profiles }, () => {
          // Close modal and reload the displayed list
          closeProfileModal();
          loadProfiles();
          console.log('Profile updated successfully.');
        });
      }
    });
  } else {
    // Add new profile
    const newProfile = { username, password, alias, url, autologin };

    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      profiles.push(newProfile);

      // Save updated profiles to storage
      chrome.storage.sync.set({ userProfiles: profiles }, () => {
        // Close modal and reload the displayed list
        closeProfileModal();
        loadProfiles();
        console.log('Profile added successfully.');
      });
    });
  }
}

// Function to open confirmation modal for deletion
function openConfirmModal(index) {
  currentDeleteIndexToDelete = index;
  confirmModal.style.display = 'block';
}

// Function to close confirmation modal
function closeConfirmModal() {
  confirmModal.style.display = 'none';
  currentDeleteIndexToDelete = -1;
  isBulkDelete = false;
  const modalMessage = confirmModal.querySelector('.modal-body p');
  modalMessage.textContent = 'Are you sure you want to delete this profile?';
}

// Function to delete a profile
function deleteProfile(index) {
  // Open custom confirm modal instead of browser confirm
  currentDeleteIndexToDelete = index;
  confirmModal.style.display = 'block';
}

// Handle confirm delete
confirmDeleteBtn.addEventListener('click', () => {
  if (isBulkDelete) {
    // Delete all profiles
    chrome.storage.sync.set({ userProfiles: [] }, () => {
      confirmModal.style.display = 'none';
      isBulkDelete = false;
      loadProfiles();
      console.log('All profiles deleted successfully.');
    });
  } else {
    // Delete single profile
    const indexToDelete = currentDeleteIndexToDelete;
    chrome.storage.sync.get({ userProfiles: [] }, (data) => {
      const profiles = data.userProfiles;
      profiles.splice(indexToDelete, 1);
      chrome.storage.sync.set({ userProfiles: profiles }, () => {
        confirmModal.style.display = 'none';
        loadProfiles();
        console.log('Profile deleted successfully.');
      });
    });
  }
  // Reset delete index
  currentDeleteIndexToDelete = -1;
});

// Handle cancel delete
cancelDeleteBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  currentDeleteIndexToDelete = -1;
});

// Close confirm modal when clicking close button
confirmCloseBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  currentDeleteIndexToDelete = -1;
});

togglePasswordBtn.addEventListener('click', () => {
  const isPassword = profilePasswordInput.type === 'password';
  profilePasswordInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.style.opacity = isPassword ? '0.5' : '1';
});

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.copyTarget;
    const value = document.getElementById(targetId).value;
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      btn.classList.add('copied');
      const original = btn.innerHTML;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('copied');
      }, 1500);
    });
  });
});

// Add event listeners
addProfileBtn.addEventListener('click', openAddModal);
profileForm.addEventListener('submit', handleProfileSubmit);
closeModalBtn.addEventListener('click', closeProfileModal);
cancelProfileBtn.addEventListener('click', closeProfileModal);
cancelDeleteBtn.addEventListener('click', closeConfirmModal);
confirmCloseBtn.addEventListener('click', closeConfirmModal);

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === profileModal) {
    closeProfileModal();
  } else if (event.target === confirmModal) {
    closeConfirmModal();
  }
});

// Function to set profiles to defaults (now triggers custom confirm modal)
function setToDefaults() {
  // Open custom confirm modal for bulk deletion
  isBulkDelete = true;
  // Update modal message for bulk delete
  const modalMessage = confirmModal.querySelector('.modal-body p');
  modalMessage.textContent = 'Are you sure you want to delete all profiles?';
  confirmModal.style.display = 'block';
}

// Function to check if profiles exist and initialize defaults if needed
function initializeDefaultProfilesIfNeeded() {
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    let profiles = data.userProfiles;
    
    if (!profiles || profiles.length === 0) {
      // If no profiles exist, set to defaults
      chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => {
        loadProfiles();
        console.log('Default profiles initialized successfully.');
      });
    } else {
      // Check if existing profiles need to be updated with alias field
      let needsUpdate = false;
      profiles = profiles.map(profile => {
        if (!profile.hasOwnProperty('alias')) {
          profile.alias = '';
          needsUpdate = true;
        }
        if (!profile.hasOwnProperty('url')) {
          profile.url = '';
          needsUpdate = true;
        }
        return profile;
      });
      
      if (needsUpdate) {
        chrome.storage.sync.set({ userProfiles: profiles }, () => {
          loadProfiles();
          console.log('Profiles updated with alias and url fields.');
        });
      }
    }
  });
}

// Add event listener for set to defaults button
setToDefaultsBtn.addEventListener('click', setToDefaults);

// Load profiles when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  initializeDefaultProfilesIfNeeded();
});