# Privacy Policy for Clio Satellite Extension

**Last updated: October 9, 2026**

## Introduction

This Privacy Policy explains how the Clio Satellite Chrome extension ("Extension", "we", "us", or "our") collects, uses, and discloses your information when you use our Extension.

## For Developers Only

This Extension is intended for use by developers and administrators of Creatio platform. It is not intended for general public use.

## Information We Collect

The Clio Satellite Extension stores the following information in Chrome storage:
- User credentials (usernames and passwords) for Creatio platforms
- Display aliases for profiles
- Autologin preferences for different sites
- Last used profile information

**Important**: Profiles and settings are kept in Chrome sync storage, so when you are signed in to Chrome with sync turned on, Chrome syncs them between your own devices through your Google account (handled by Google under the Google Privacy Policy). This information is never sent to servers operated by the Extension developers or to any other third party.

## Developer News

The Extension shows short news about clio and Creatio developer tools on the Creatio login page and inside Creatio.

- The news are downloaded as plain text (JSON) and images from `https://advance-technologies-foundation.github.io/clio-news-feed/` at most every few hours. The request contains no personal data, no Creatio address and no identifiers.
- Which news you have read and when you first saw them are stored in your browser only. The roles you chose (Administration, Development, Other) and the news on/off switch are saved with your settings and synced like the other settings.
- YouTube previews may be loaded from `i.ytimg.com` (Google) when you open the news list. A video plays from `youtube-nocookie.com` only after you press play; "Watch on YouTube" opens youtube.com.
- Developer news are on by default. You can turn them off in the Extension options; while they are off, the Extension makes no news requests.

## Usage Statistics

- The Extension sends anonymous usage events to Google Analytics 4 (Google) so we can see which Clio satellite menu items and developer news features are used.
- An event contains only: the event name (for example opening the menu, clicking a menu item, opening the news list, opening a news link), the name of the clicked menu item or the news id, where it happened (login page or inside Creatio), the Extension version, and a random identifier generated for this browser profile. It is not linked to your Google account.
- Site addresses, Creatio URLs, user names, passwords, profile names and page contents are never sent. Events with any other data are dropped by the Extension before sending.
- Usage statistics are on by default. You can turn them off in the Extension options (Usage statistics); while they are off, nothing is sent.
- Google processes these events under the [Google Privacy Policy](https://policies.google.com/privacy). We use them only to improve the Extension and do not share them with anyone else.

## How We Use Information

The collected information is used solely to:
- Provide login automation to Creatio platforms
- Enable quick switching between different user profiles
- Remember your preferences for each site you visit
- Enable autologin functionality when enabled

## Data Sharing and Disclosure

We do not share, sell, rent, or trade your information with any third parties. Anonymous usage events (see Usage Statistics) are processed by Google Analytics on our behalf.

## Data Security

All credentials and settings are stored with Chrome's storage API in your browser and, when Chrome sync is on, synced by Chrome through your Google account. The Extension itself never sends credentials, site addresses or profiles over the internet. The only outgoing requests the Extension makes are the developer news downloads and the anonymous usage events described above.

## Changes To This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date of this Privacy Policy.

## Disclaimer of Responsibility

This Extension is provided "as is" without warranty of any kind. The developers are not responsible for any damages, data loss, or security issues that may arise from the use of this Extension. Users are responsible for the security of their credentials and should use this Extension at their own risk.

## Contact Us

If you have any questions about this Privacy Policy, please contact us by creating an issue in our GitHub repository.
