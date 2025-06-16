## Chrome Web Store Publishing Form Responses

### Single Purpose Description
Clio Satellite enhances user productivity in Creatio platform by providing simplified login management and quick access to essential system functions and pages.

### Scripting Justification
The extension uses content scripts to inject UI elements into Creatio login and shell pages for seamless profile management and quick access to system functions. The injected scripts only modify specific Creatio pages to enhance user workflow without affecting other websites.

### ActiveTab Justification
ActiveTab permission is used to identify when a user is on a Creatio login page or shell interface to provide relevant functionality. It's required to detect the current URL to determine when to display login controls or system navigation tools.

### Tabs Justification
Tabs permission is needed to open the options page when the user clicks on the 'Settings' menu item. It's also used to reload the current tab when the 'Restart App' function is selected, which is essential for refreshing the Creatio application.

### Storage Justification
Storage permission is required to save and manage user profiles (including credentials and autologin preferences) securely in the browser's local storage. This enables the core functionality of multiple profile management and site-specific autologin features.

### ContextMenus Justification
Context menu integration provides users with convenient access to extension settings and frequently used functions from any page. This enhances usability by allowing quick access to the options page from the browser's right-click menu.

### Host Permission Justification
Host permissions are limited to Creatio platform domains where the extension's functionality is applicable. These permissions are necessary for the extension to identify Creatio login pages and shell interfaces to provide its functionality.

### Remote Code Justification
The extension does not use remote code. All scripts are included in the extension package and execute locally. Scripts only interact with specific Creatio platform elements to enhance user experience by adding profile management and quick navigation capabilities.
