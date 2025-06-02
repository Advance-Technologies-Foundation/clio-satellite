// options.js - Logic for the extension's options page

// Define default profile
const defaultProfiles = [
  { username: 'Supervisor', password: 'Supervisor' }
];

// Get references to DOM elements
const userList = document.getElementById('user-list');
const addUserForm = document.getElementById('add-user-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const setToDefaultsBtn = document.getElementById('set-to-defaults');

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
      
      // Display profile name and username (hide password)
      const profileInfo = document.createElement('span');
      profileInfo.textContent = profile.username;
      
      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-button');
      
      // Add event listener for delete button
      deleteButton.addEventListener('click', () => {
        deleteProfile(index);
      });
      
      // Append elements to list item
      listItem.appendChild(profileInfo);
      listItem.appendChild(deleteButton);
      
      // Append list item to the list
      userList.appendChild(listItem);
    });
  });
}

// Function to add a new profile
function addProfile(event) {
  event.preventDefault(); // Prevent form submission

  // Get input values
  const username = usernameInput.value.trim();
  const password = passwordInput.value; // Don't trim password

  // Basic validation
  if (!username || !password) {
    alert('Please fill in all fields.');
    return;
  }

  // Create new profile object
  const newProfile = { username, password };

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
    if (!data.userProfiles || data.userProfiles.length === 0) {
      // If no profiles exist, set to defaults
      chrome.storage.sync.set({ userProfiles: defaultProfiles }, () => {
        loadProfiles();
        console.log('Default profiles initialized successfully.');
      });
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