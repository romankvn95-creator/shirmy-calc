# 🪟 Калькулятор ширм и перегородок

PWA-калькулятор для менеджеров. Работает на iPhone и Android через Safari/Chrome —
можно добавить на главный экран как приложение.

## Как это работает

```
Google Таблица
   ↓ (Sheets API — чтение)
Калькулятор (React, Yandex Cloud)
   ↓ (Apps Script — запись визитов и онлайн-пинга)
Google Таблица (колонки H, I, J, K)
```

- **Ты** заходишь по основному домену → вводишь код → калькулятор
- **Менеджер** получает ссылку `https://ДОМЕН/?t=ТОКЕН` → авто-вход
- **Управление** — прямо в Google Таблице: включить/выключить колонка C (TRUE/FALSE)
- **Онлайн-статус** — колонка K таблицы (🟢 если активен < 5 мин назад)

---

## Запуск: пошаговая инструкция

### Шаг 1 — Google Таблица

1. Создай новую Google Таблицу
2. Строка 1 — заголовки:
   `Имя менеджера | Токен | Активен | Телефон | Дата добавления | Ссылка | Комментарий | Последний вход | Посещений | Онлайн до | 🟢 Онлайн?`
3. В ячейку **K2** вставь формулу (и протяни вниз):
   `=IF(J2="","",IF((NOW()-J2)*1440<5,"🟢 онлайн","⚫ не активен"))`
4. Добавь себя первой строкой (C = TRUE)
5. **Файл → Поделиться → Опубликовать в интернете → Опубликовать**
6. Скопируй ID таблицы из URL

### Шаг 2 — Google Apps Script (онлайн-трекер)

1. В таблице: **Расширения → Apps Script**
2. Вставь содержимое файла `google-apps-script.js`
3. **Развернуть → Новое развёртывание**
   - Тип: Веб-приложение
   - Выполнять как: **Я**
   - Кто имеет доступ: **Все**
4. Скопируй URL скрипта

### Шаг 3 — Google API Key (для чтения таблицы)

1. Перейди: https://console.cloud.google.com
2. APIs & Services → Enable APIs → включи **Google Sheets API**
3. Credentials → Create → API Key
4. Ограничь ключ: только Google Sheets API

### Шаг 4 — GitHub

1. Создай новый репозиторий (например `shirmy-calc`)
2. Загрузи все файлы этой папки (кроме `node_modules`)
3. **Settings → Secrets and variables → Actions → New repository secret**
   Добавь все секреты из таблицы ниже

### Шаг 5 — Yandex Cloud

1. Войди в https://console.yandex.cloud
2. Object Storage → Создать бакет
   - Имя: `shirmy-calc` (или любое другое)
   - Доступ: Публичный
3. Свойства бакета → Хостинг сайта → Включить
   - Главная страница: `index.html`
   - Страница ошибки: `index.html`
4. IAM → Сервисные аккаунты → Создать
   - Роль: `storage.editor`
   - Создай статический ключ → скопируй ID и секрет

### Шаг 6 — Secrets в GitHub

| Secret | Значение |
|--------|----------|
| `VITE_SHEETS_ID` | ID Google Таблицы |
| `VITE_SHEETS_KEY` | Google API Key |
| `VITE_SCRIPT_URL` | URL Apps Script |
| `VITE_ADMIN_SHEET_URL` | Ссылка на Google Таблицу |
| `YC_BUCKET_NAME` | Имя бакета (например `shirmy-calc`) |
| `YC_ACCESS_KEY_ID` | Статический ключ YC |
| `YC_SECRET_ACCESS_KEY` | Секрет статического ключа YC |

### Шаг 7 — Push и деплой

```bash
git add .
git commit -m "init: shirmy-calc"
git push origin main
```

GitHub Actions автоматически соберёт и задеплоит на Yandex Cloud.
Калькулятор будет доступен по адресу: `https://shirmy-calc.website.yandexcloud.net`

---

## Добавить на главный экран (iPhone/Android)

**iPhone Safari:**
Открой URL → нижняя панель → кнопка "Поделиться" → "На экран «Домой»"

**Android Chrome:**
Открой URL → меню (⋮) → "Добавить на главный экран"

---

## Структура проекта

```
shirmy-calc/
├── src/
│   ├── App.tsx              ← роутер + сессия
│   ├── main.tsx             ← точка входа
│   ├── lib/sheets.ts        ← авторизация через Sheets API
│   └── pages/
│       ├── Login.tsx        ← вход (или авто по ?t=TOKEN)
│       └── Calculator.tsx   ← калькулятор
├── public/
│   ├── manifest.json        ← PWA
│   └── sw.js                ← Service Worker
├── google-apps-script.js    ← вставить в Apps Script редактор
├── google-sheet-template.md ← структура таблицы + формулы
├── .github/workflows/deploy.yml  ← CI/CD
└── .env.example             ← переменные окружения
```
