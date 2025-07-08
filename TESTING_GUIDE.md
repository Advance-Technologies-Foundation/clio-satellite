# 🧪 Тестирование поддержки Configuration страниц

## Шаги для тестирования:

### 1. Проверка в Chrome DevTools

1. Откройте Configuration страницу в Creatio
2. Откройте DevTools (F12)
3. Перейдите на вкладку Console
4. Проверьте наличие логов `[Clio Satellite]:`

### 2. Ожидаемые логи в консоли:

```
[Clio Satellite]: Creating scripts menu - start
[Clio Satellite]: Configuration page detected
[Clio Satellite]: Configuration page: targeting .left-container
[Clio Satellite]: Buttons placed in .left-container for Configuration page
[Clio Satellite]: Scripts menu created successfully
```

### 3. Визуальная проверка:

- **Ожидается**: Две кнопки в `.left-container`
  - Синяя кнопка "Navigation" 
  - Оранжевая кнопка "⚡" (Actions)
- **Расположение**: Вертикально, одна под другой
- **Поведение**: Клик открывает соответствующие меню

### 4. Проверка функциональности:

- **Горячие клавиши**: Ctrl+Shift+V (Navigation), Ctrl+Shift+A (Actions)
- **Меню**: Должны появляться рядом с кнопками
- **Скрипты**: Должны выполняться при клике

### 5. Элементы для проверки в DOM:

```html
<!-- Основные элементы -->
<ts-workspace-section>...</ts-workspace-section>
<div class="left-container">
  <div class="creatio-satelite creatio-satelite-configuration">
    <button class="scripts-menu-button">Navigation</button>
    <button class="actions-button">⚡</button>
  </div>
</div>

<!-- Контейнеры меню -->
<div class="creatio-satelite-menu-container">
  <div class="scripts-menu-container">...</div>
  <div class="actions-menu-container">...</div>
</div>
```

### 6. Отладка проблем:

#### Если кнопки не появляются:

1. Проверьте наличие `<ts-workspace-section>` в DOM
2. Проверьте наличие `.left-container` 
3. Убедитесь что `debugExtension = true` в content.js
4. Проверьте логи в консоли

#### Если кнопки есть, но меню не работает:

1. Проверьте CSS стили для `.creatio-satelite-configuration`
2. Убедитесь что меню контейнеры созданы
3. Проверьте позиционирование меню

### 7. Тестовая страница:

Откройте `configuration-test.html` в браузере для локального тестирования:

```bash
open configuration-test.html
```

### 8. Проверка в реальном Creatio:

1. Откройте страницу Configuration в Creatio
2. Найдите `.left-container` в DOM
3. Проверьте появление кнопок расширения
4. Протестируйте функциональность

## Возможные проблемы и решения:

### Проблема: Кнопки не появляются на Configuration странице

**Решение**: 
- Убедитесь что `<ts-workspace-section>` присутствует в DOM
- Проверьте что content script загружается для данной страницы
- Включите отладку (`debugExtension = true`)

### Проблема: Кнопки появляются не в том месте

**Решение**:
- Проверьте селектор `.left-container`
- Убедитесь что CSS стили `.creatio-satelite-configuration` применяются

### Проблема: Меню не позиционируется правильно

**Решение**:
- Проверьте функцию `adjustMenuPosition` для Configuration страниц
- Убедитесь что CSS стили для позиционирования меню правильные

## Команды для отладки в DevTools:

```javascript
// Проверить тип страницы
console.log('Page type:', getCreatioPageType());

// Проверить наличие элементов
console.log('Config indicator:', document.querySelector('ts-workspace-section'));
console.log('Left container:', document.querySelector('.left-container'));
console.log('Extension buttons:', document.querySelector('.creatio-satelite'));

// Принудительно создать меню
checkCreatioPageAndCreateMenu();
```
