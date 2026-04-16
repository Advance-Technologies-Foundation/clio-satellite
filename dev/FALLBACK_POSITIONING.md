# Fallback Positioning Feature - Clio Satellite

## Описание

Добавлена функциональность fallback позиционирования для случаев, когда на странице не найдены стандартные якорные элементы для размещения кнопок плагина.

## Как это работает

### Поиск якорных элементов

Плагин ищет следующие элементы для позиционирования:

**Для Shell страниц:**
- `crt-global-search`
- `[data-item-marker="GlobalSearch"]`
- `.global-search`
- `input[placeholder*="Search"]` или `input[placeholder*="search"]`

**Для Configuration страниц:**
- `button[mat-button].action-button`

### Fallback режим

Если ни один из якорных элементов не найден, активируется fallback режим:

1. **Позиционирование:** Кнопки размещаются горизонтально по центру страницы
2. **Отступ сверху:** 16px от верхнего края страницы
3. **CSS класс:** Добавляется атрибут `data-fallback-position="true"`
4. **Стили:** Применяются специальные стили для fallback режима

## Визуальные отличия

### Fallback режим
- Кнопки горизонтально по центру страницы
- 16px отступ сверху
- Улучшенный фон с рамкой
- Минимальная ширина кнопок 140px
- Высота кнопок 38px

### Стандартный режим
- Позиционирование относительно найденного якорного элемента
- Справа от якорного элемента с отступом 20px
- Вертикальное центрирование относительно якорного элемента

## Интерактивность

### Перетаскивание
- **Клик и перетаскивание:** Пользователь может переместить кнопки в любое место
- **Фиксация позиции:** После перетаскивания устанавливается атрибут `data-user-positioned="true"`
- **Блокировка автопозиционирования:** Плагин перестает автоматически позиционировать кнопки

### Сброс позиционирования
- **Двойной клик:** Возвращает к автоматическому позиционированию
- **Удаление атрибутов:** Убирает `data-user-positioned` и `data-fallback-position`
- **Повторное позиционирование:** Запускает функцию автоматического позиционирования

### Адаптивность
- **Изменение размера окна:** В fallback режиме кнопки пересчитывают центрирование
- **Сохранение пользовательской позиции:** Если пользователь переместил кнопки вручную, они остаются на месте

## Отладка

### Debug сообщения
```javascript
// Fallback режим активирован
'No anchor elements found, using fallback positioning'

// Успешное fallback позиционирование
'Fallback positioning applied: center horizontally (XXXpx), 16px from top'

// Пользователь переместил кнопки
'Container manually positioned by user'

// Сброс к автоматическому позиционированию
'Reset to automatic positioning'

// Блокировка автопозиционирования
'Container was manually positioned by user, skipping auto-positioning'
```

### Проверка в консоли
```javascript
// Получить информацию о контейнере
const container = document.querySelector('.creatio-satelite-floating');
console.log('User positioned:', container.hasAttribute('data-user-positioned'));
console.log('Fallback mode:', container.hasAttribute('data-fallback-position'));
```

## Тестирование

### Тестовый файл
- `test-fallback-positioning.html` - страница без якорных элементов
- Содержит кнопки для тестирования различных сценариев
- Отображает ожидаемое поведение и инструкции

### Сценарии тестирования
1. **Первоначальная загрузка** - кнопки по центру, 16px сверху
2. **Изменение размера окна** - пересчет центрирования
3. **Перетаскивание** - ручное перемещение кнопок
4. **Изменение размера после перетаскивания** - сохранение позиции
5. **Двойной клик** - возврат к автопозиционированию

## CSS Стили

### Fallback режим
```css
.creatio-satelite-floating[data-fallback-position] {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15) !important;
}

.creatio-satelite-floating[data-fallback-position] .scripts-menu-button,
.creatio-satelite-floating[data-fallback-position] .actions-button {
  height: 38px !important;
  min-width: 140px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}
```

## Совместимость

- ✅ Полностью совместимо с существующей функциональностью
- ✅ Работает на Shell страницах
- ✅ Работает на Configuration страницах  
- ✅ Работает на страницах без якорных элементов
- ✅ Сохраняет все существующие возможности перетаскивания
- ✅ Поддерживает все существующие меню и функции
