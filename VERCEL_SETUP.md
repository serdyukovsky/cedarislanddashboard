# Vercel Environment Variables Setup

Для корректной работы приложения в Vercel необходимо настроить следующие переменные окружения:

## Обязательные переменные

### Google Sheets API
Выберите один из вариантов:

**Вариант 1 (рекомендуется):**
```
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n
```

**Вариант 2:**
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your_project_id",...}
```

### Google Sheets IDs
```
REVENUE_SHEET_ID=your_revenue_sheet_id_here
EXPENSE_SHEET_ID=your_expense_sheet_id_here
BREAKFAST_SHEET_ID=16mCkLeZ07OUYEr23qS5dF2VkkyPHCqml7UpdTo58g4U
```

### Google Sheets Ranges
```
REVENUE_RANGE=A:E
EXPENSE_RANGE=A:Z
BREAKFAST_RANGE=A:B
```

### Google Sheets Names
```
REVENUE_SHEET_NAME=Выручка
EXPENSE_SHEET_NAME=Расходы
BREAKFAST_SHEET_NAME=Лист1
```

## Как настроить в Vercel

1. Перейдите в настройки проекта в Vercel
2. Откройте раздел "Environment Variables"
3. Добавьте все переменные выше
4. Перезапустите деплой

## Проверка

После настройки переменных приложение должно работать без ошибок HTTP 500.
