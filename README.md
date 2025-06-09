# Clio Satellite Extension

## What You Can Do
- Manage multiple user profiles (add, edit, delete) with credentials and optional display aliases.
- Automatically remember and select the last-used profile per site.
- Enable **autologin** for any profile to log in instantly when you visit your Creatio login page.
- Quickly log in from the dropdown selector with a single click.
- Reset or delete all profiles back to defaults in one action.
- Access **Shell page tools**:
  - Navigation scripts (Features, Lookups, Process Log, etc.)
  - Actions (Restart App, Flush Redis, toggle autologin, open settings)
- Open and configure all settings from the **Setup profiles** or extension toolbar menu.

## Installation
1. Clone or download this repository.
2. In Chrome, go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension folder.

## Usage
### Options Page
- Open via the extension toolbar **context menu** or click **Setup profiles** on the login page.
- Add new profiles (username, password, alias, autologin).
- Edit or delete existing profiles.
- Reset to default profiles or delete all profiles.

### Login Page Enhancements
- A **Setup profiles** button opens the options page.
- A **Profile selector** dropdown lists saved profiles with aliases.
- A **Login with profile** button fills credentials and submits the form.
- Last used profile is remembered per site origin; autologin will log in automatically if enabled.

### Shell Page Tools
- **Scripts Menu**: run navigation scripts (Features, Lookups, Process log, etc.).
- **Actions Menu**: run actions (Restart App, Flush Redis, enable/disable autologin, Settings).
- Menus are accessed via buttons in the shell header.

## Advanced / Development
- Manifest V3 extension, vanilla JavaScript (ES6+), plain CSS.
- Background service worker handles storage initialization, context menus, and script execution.
- Content scripts inject UI into Creatio pages.

## Support
Open an issue for bugs or feature requests.

## License
MIT License. See [LICENSE](LICENSE) for details.
