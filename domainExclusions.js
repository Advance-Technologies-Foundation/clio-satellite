/**
 * Domain exclusion module
 * Contains a unified list of excluded domains and functions to check them
 */

/**
 * List of domains where the extension should not be activated
 */
const excludedDomains = [
  'gitlab.com', 
  'github.com',
  'bitbucket.org',
  'google.com',
  'mail.google.com',
  'youtube.com',
  'atlassian.net',
  'upsource.creatio.com',
  'work.creatio.com',
  'creatio.workplace.com',
  'community.creatio.com',
  'studio.creatio.com',
  'academy.creatio.com',
  'tscore-git.creatio.com'
];

/**
 * Checks if the current domain is in the exclusion list
 * @returns {boolean} True if domain is in the exclusion list, otherwise False
 */
function isExcludedDomain() {
  const currentHost = window.location.hostname;

  for (const domain of excludedDomains) {
    if (currentHost.includes(domain)) {
      console.log(`Domain ${currentHost} is in the exclusion list. Skipping activation.`);
      return true;
    }
  }
  
  console.log(`Domain ${currentHost} is NOT in the exclusion list.`);
  return false;
}

// Export function for use in other files
window.isExcludedDomain = isExcludedDomain;