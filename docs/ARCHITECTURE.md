 
# Архитектура проекта

## Структура модулей

### Core (Ядро)
- **config.js** — константы и настройки по умолчанию
- **utils.js** — вспомогательные функции (toast, roundToStep, snapTime)
- **canvas.js** — инициализация Fabric.js canvas

### Animation (Анимация)
- **easing.js** — функции плавности (linear, easeInQuad, etc.)
- **keyframes.js** — управление ключевыми кадрами
- **interpolation.js** — интерполяция значений между ключами
- **playback.js** — воспроизведение (play/pause/scrub)

### Objects (Объекты)
- **manager.js** — добавление/удаление/дублирование объектов
- **visibility.js** — управление видимостью
- **background.js** — фоновые изображения

### UI (Интерфейс)
- **menubar.js** — меню-бар и обработка действий
- **modals.js** — модальные окна (новый проект, экспорт, настройки)
- **inspector.js** — панель свойств объекта
- **timeline.js** — рендеринг временной шкалы

### Export (Экспорт)
- **gif.js** — экспорт в GIF через gif.js
- **video.js** — экспорт в MP4/WebM через MediaRecorder

### Project (Проекты)
- **new.js** — создание нового проекта
- **save.js** — сохранение в ZIP
- **load.js** — загрузка из ZIP

## Поток данных

### Запись ключевого кадра
