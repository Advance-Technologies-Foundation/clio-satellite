    // Add change event handler to execute login when a profile is selected
function registerLoginEvents(loginCaption) {
    loginCaption.addEventListener('click', () => {
        const profileSelect = document.querySelector(".creatio-satelite-login-profile-select");
        const selectedOption = profileSelect.options[profileSelect.selectedIndex];
        const username = selectedOption.dataset.username;
        const password = selectedOption.dataset.password;
        if (username && password) {
            // Fill credentials and submit login form - universal selectors
            const usernameField = document.querySelector('#loginEdit-el') || 
                                 document.querySelector('input[name*="username"]') ||
                                 document.querySelector('input[name*="login"]') ||
                                 document.querySelector('input[name*="email"]') ||
                                 document.querySelector('input[name*="user"]') ||
                                 document.querySelector('input[type="text"]') ||
                                 document.querySelector('input[type="email"]');
                                 
            const passwordField = document.querySelector('#passwordEdit-el') ||
                                 document.querySelector('input[type="password"]');
                                 
            const loginButton = document.querySelector('.login-button-login') ||
                               document.querySelector('button[type="submit"]') ||
                               document.querySelector('input[type="submit"]');

            if (usernameField && passwordField && loginButton) {
                usernameField.focus();
                usernameField.value = username;
                passwordField.focus();
                passwordField.value = password;
                loginButton.click();
            }
        }
        });
}
