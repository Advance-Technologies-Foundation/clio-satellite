    // Add change event handler to execute login when a profile is selected
function registerLoginEvents(loginCaption) {
    loginCaption.addEventListener('click', () => {
        const profileSelect = document.querySelector(".creatio-satelite-login-profile-select");
        const selectedOption = profileSelect.options[profileSelect.selectedIndex];
        const username = selectedOption.dataset.username;
        const password = selectedOption.dataset.password;
        if (username && password) {
            // Fill credentials and submit login form
            const usernameField = document.querySelector('#loginEdit-el');
            const passwordField = document.querySelector('#passwordEdit-el');
            const loginButton = document.querySelector('.login-button-login');
            usernameField.focus();
            usernameField.value = username;
            passwordField.focus();
            passwordField.value = password;
            loginButton.click();
        }
        });
}
