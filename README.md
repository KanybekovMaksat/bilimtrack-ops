# Bilimtrack Ops

Внутренняя панель команды Bilimtrack: продажи, поддержка, клиенты, биллинг, каналы связи, контент и мониторинг платформы. Сверстана по макету «Bilimtrack Ops v2» из Claude Design на дизайн-системе Bilimtrack (TikTok Sans, Inter, акцент `#155dfc`).

**Стек:** React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Tailwind CSS v4 · lucide-react

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint     # ESLint, включая правила FSD
```

Вход моковый: подходит любой логин, пароль не проверяется.

## Данные

Всё на моковых данных из макета, «сегодня» — 20 сентября 2026. Данные лежат в `src/entities/*`, читаются через `useMockQuery` (`shared/api`) — это TanStack Query с `useSuspenseQuery` и искусственной задержкой, поэтому загрузка страниц показывает скелетон. Чтобы подключить бэкенд, замените fetcher в хуке сущности на реальный запрос — страницы менять не нужно.

Действия, которые меняют состояние (эскалация тикета, вход от имени, привязка профиля, задачи на доске, анонсы, ручные платежи организаций), хранятся в Zustand-сторах и живут до перезагрузки страницы.

## Экраны

| Раздел | Маршруты |
|---|---|
| Главная | `/` — очередь работы, события, график, сводка |
| Бизнес | `/metrics`, `/health` |
| Продажи | `/leads` (карточка заявки — панель справа) |
| Поддержка | `/tickets`, `/tickets/:id`, `/tickets-states`, `/tickets-priority`, `/ideas` |
| Клиенты | `/orgs`, `/orgs/:slug?tab=…`, `/orgs-new` (мастер из 5 шагов), `/onboarding`, `/licenses`, `/accounts`, `/accounts/:login`, `/accounts/:login/session` |
| Биллинг | `/plans`, `/plans/:code`, `/subscriptions`, `/payments`, `/providers`, `/org-billing` |
| Соцсети | `/channels`, `/inbox`, `/templates` |
| Задачи | `/tasks` — канбан с drag-and-drop и список |
| Контент | `/posts`, `/posts/editor`, `/dicts`, `/media` |
| Платформа | `/audit`, `/logins`, `/system`, `/errors`, `/team`, `/denied` |

## Архитектура — Feature-Sliced Design

```
src/
├── app/        точка входа, роутер, guards (авторизация и роли), глобальные стили и токены
├── pages/      страницы — по слайсу на экран
├── widgets/    app-shell (сайдбар + шапка), tickets-table, ticket-thread, task-board
├── features/   действия пользователя: auth, escalate-ticket, impersonate, link-profile,
│               toggle-org-module, create-organization,
│               refund-payment, add-org-payment, create-task, pick-media, edit-dictionary-entry
├── entities/   ticket, organization, client-health, license, onboarding, metrics, lead, idea,
│               account, plan, subscription, payment, org-billing, channel, task,
│               article, platform, session
└── shared/     ui-kit по дизайн-системе, api (mock + query client), lib, config (маршруты)
```

Слайс отдаёт наружу только `index.ts`. Правила импортов проверяет ESLint (`eslint.config.js`):

1. Слой импортирует только из нижележащих слоёв: `app → pages → widgets → features → entities → shared`.
2. Импорт слайса — только через его public API: `@/entities/ticket`, а не `@/entities/ticket/model`.
