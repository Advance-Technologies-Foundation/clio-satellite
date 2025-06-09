// options.js - Logic for the extension's options page

// Define default profile
const defaultProfiles = [
  { username: 'Supervisor', password: 'Supervisor', alias: '' }
];

// Get references to DOM elements
const userList = document.getElementById('user-list');
const addUserForm = document.getElementById('add-user-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const aliasInput = document.getElementById('alias');
const setToDefaultsBtn = document.getElementById('set-to-defaults');

// Edit modal elements
const editModal = document.getElementById('edit-modal');
const editUserForm = document.getElementById('edit-user-form');
const editUsernameInput = document.getElementById('edit-username');
const editPasswordInput = document.getElementById('edit-password');
const editAliasInput = document.getElementById('edit-alias');
const closeModalBtn = document.querySelector('.close');
const cancelEditBtn = document.getElementById('cancel-edit');

let currentEditIndex = -1;

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
      profileInfo.textContent = displayName;
      
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
        deleteProfile(index);
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

// Function to open edit modal
function openEditModal(profile, index) {
  currentEditIndex = index;
  editUsernameInput.value = profile.username;
  editPasswordInput.value = profile.password;
  editAliasInput.value = profile.alias || '';
  editModal.style.display = 'block';
}

// Function to close edit modal
function closeEditModal() {
  editModal.style.display = 'none';
  currentEditIndex = -1;
  editUserForm.reset();
}

// Function to edit a profile
function editProfile(event) {
  event.preventDefault();

  if (currentEditIndex === -1) {
    return;
  }

  // Get input values
  const username = editUsernameInput.value.trim();
  const password = editPasswordInput.value;
  const alias = editAliasInput.value.trim();

  // Basic validation
  if (!username || !password) {
    alert('Please fill in username and password fields.');
    return;
  }

  // Get current profiles
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    const profiles = data.userProfiles;
    
    // Update the profile at the specified index
    if (profiles[currentEditIndex]) {
      profiles[currentEditIndex] = { username, password, alias };

      // Save updated profiles to storage
      chrome.storage.sync.set({ userProfiles: profiles }, () => {
        // Close modal and reload the displayed list
        closeEditModal();
        loadProfiles();
        console.log('Profile updated successfully.');
      });
    }
  });
}

// Function to add a new profile
function addProfile(event) {
  event.preventDefault(); // Prevent form submission

  // Get input values
  const username = usernameInput.value.trim();
  const password = passwordInput.value; // Don't trim password
  const alias = aliasInput.value.trim();

  // Basic validation
  if (!username || !password) {
    alert('Please fill in username and password fields.');
    return;
  }

  // Create new profile object
  const newProfile = { username, password, alias };

  // Get current profiles and add the new one
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    const profiles = data.userProfiles;
    profiles.push(newProfile);

    // Save updated profiles to storage
    chrome.storage.sync.set({ userProfiles: profiles }, () => {
      // Clear the form
      addUserForm.reset();
      // Reload the displayed list
      loadProfiles();
      console.log('Profile added successfully.');
    });
  });
}

// Function to delete a profile
function deleteProfile(index) {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete this profile?')) {
    return;
  }

  // Get current profiles
  chrome.storage.sync.get({ userProfiles: [] }, (data) => {
    const profiles = data.userProfiles;
    
    // Remove the profile at the specified index
    profiles.splice(index, 1);

    // Save updated profiles to storage
    chrome.storage.sync.set({ userProfiles: profiles }, () => {
      // Reload the displayed list
      loadProfiles();
      console.log('Profile deleted successfully.');
    });
  });
}

// Add event listener for form submission
addUserForm.addEventListener('submit', addProfile);

// Add event listeners for edit modal
editUserForm.addEventListener('submit', editProfile);
closeModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

// Function to set profiles to defaults
function setToDefaults() {
  // Confirm reset
  if (!confirm('Are you sure you want to reset profiles to defaults? This will remove all existing profiles.')) {
    return;
  }
  
  // Save default profiles to storage
  chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => {
    // Reload the displayed list
    loadProfiles();
    console.log('Profiles reset to defaults successfully.');
  });
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
        return profile;
      });
      
      if (needsUpdate) {
        chrome.storage.sync.set({ userProfiles: profiles }, () => {
          loadProfiles();
          console.log('Profiles updated with alias field.');
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