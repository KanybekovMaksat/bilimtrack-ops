# Bilimtrack Ops

Внутренняя операционная панель команды Bilimtrack: тикеты поддержки, клиентские организации и состояние сервисов.

**Стек:** React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Tailwind CSS v4 · lucide-react

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint     # ESLint, включая правила FSD
```

Вход — любая почта `@bilimtrack.kg` и пароль от 6 символов (мок-авторизация). Данные хранятся в памяти (`entities/*/api`) с имитацией задержки сети. Чтобы подключить реальный backend, замените реализацию `*Api` в сущностях. Хуки и UI при этом не меняются.

## Архитектура — Feature-Sliced Design

```
src/
├── app/        # инициализация: провайдеры, роутер, guards, глобальные стили
├── pages/      # страницы-композиции: dashboard, tickets, ticket-details, organizations, services, login, not-found
├── widgets/    # самостоятельные блоки UI: app-layout, stats-overview, tickets-table, service-status-board, organizations-table
├── features/   # пользовательские действия: auth, ticket-filters, update-ticket, create-ticket, toggle-theme
├── entities/   # бизнес-сущности: ticket, organization, employee, service, session
└── shared/     # без бизнес-логики: ui-kit, api-утилиты, lib, config
```

Каждый слайс устроен по сегментам `ui/`, `model/`, `api/` и наружу отдаёт только `index.ts` (public API).

### Правила импортов

1. Слой импортирует только из **нижележащих** слоёв: `app → pages → widgets → features → entities → shared`.
2. Слайсы одного слоя не импортируют друг друга.
3. Импорт — только через public API: `@/entities/ticket`, а не `@/entities/ticket/api/ticket-api`.

Правила 1 и 3 проверяются ESLint (`eslint.config.js`), и их нарушение ломает `npm run lint`.
