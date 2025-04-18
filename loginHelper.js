/**
 * Модуль для добавления вспомогательных элементов на странице логина
 * Позволяет быстро войти в систему под учетной записью Supervisor
 */

/**
 * Функция ожидает загрузки элементов формы логина и добавляет кнопку для входа под Supervisor
 */
function waitForLoginElements() {
  // Сначала проверяем, исключен ли домен
  if (typeof isExcludedDomain === 'function' && isExcludedDomain()) {
    console.log("Domain is in exclusion list, not adding login helper button");
    return false;
  }

  const usernameField = document.querySelector('#loginEdit-el');
  const passwordField = document.querySelector('#passwordEdit-el');
  const loginButton = document.querySelector('.login-button-login');

  if (usernameField && passwordField && loginButton) {
    const autoLoginButton = document.createElement('button');
    autoLoginButton.textContent = 'LOGIN AS SUPERVISOR';
    autoLoginButton.className = 'auto-login-button btn';
    
    // Копируем только динамические атрибуты, которые нельзя вынести в CSS
    autoLoginButton.style.width = loginButton.offsetWidth + 'px';
    autoLoginButton.style.height = loginButton.offsetHeight + 'px';
    autoLoginButton.style.fontSize = window.getComputedStyle(loginButton).fontSize;
    autoLoginButton.style.padding = window.getComputedStyle(loginButton).padding;

    autoLoginButton.addEventListener('click', () => {
      usernameField.value = 'Supervisor';
      passwordField.value = 'Supervisor';
      loginButton.click();
    });

    const autoLoginRow = document.createElement('div');
    autoLoginRow.className = 'login-row';

    autoLoginRow.appendChild(autoLoginButton);

    const passwordFieldRow = document.querySelector('#passwordEdit-wrap').parentElement;
    passwordFieldRow.parentElement.appendChild(autoLoginRow);
    
    console.log("Login form elements found and auto login button added");
  } else {
    // Если элементы формы еще не загружены, пробуем снова через 500мс
    setTimeout(waitForLoginElements, 500);
  }
}

// Инициализация функционала входа на странице логина
function initLoginHelper() {
  console.log("Initializing login helper");
  waitForLoginElements();
}

// Экспорт функции для использования в других файлах
window.initLoginHelper = initLoginHelper;

// Автоматически запускаем инициализацию
initLoginHelper();