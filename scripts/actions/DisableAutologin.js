// DisableAutologin.js
// Script to disable autologin for the default profile of the current URL
chrome.storage.sync.get({ lastLoginProfiles: {}, userProfiles: [] }, ({ lastLoginProfiles, userProfiles }) => {
  const url = window.location.href;
  const lastUser = lastLoginProfiles[url];
  if (!lastUser) return;
  // Find the profile and unset autologin
  const profileIndex = userProfiles.findIndex(p => p.username === lastUser);
  if (profileIndex !== -1) {
    const profile = userProfiles[profileIndex];
    profile.autologin = false;
    // Save update
    userProfiles[profileIndex] = profile;
    chrome.storage.sync.set({ userProfiles }, () => {
      console.log(`Autologin disabled for user ${lastUser}`);
    });
  }
});
