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

Скопируйте `.env.example` в `.env`: dev-сервер проксирует `/api` и `/health` на бэкенд из `VITE_API_PROXY_TARGET` (`bilimtrack_v2_back`).

## Деплой

Сборка ходит в API по относительному `/api/v1`, как и dev-сервер: хостинг проксирует `/api/*` и `/health/` на `https://api.bilimtrack.kg` — правила в `vercel.json` (Vercel) и `public/_redirects` (Netlify). Так не нужен CORS и не важен домен панели. Без прокси статический хостинг отвечает на `POST /api/v1/auth/login/` кодом 405.

## Доступ

Войти могут только операторы платформы — учётки с записью `ops.PlatformOperator` на бэкенде (без привязки к организации). После логина панель запрашивает `GET /api/v1/ops/me/`: на 403 сессия сразу закрывается. Учётки администраторов создаёт `python manage.py create_ops_admins` с временным паролем; при первом входе панель просит сменить его (`auth/change-password/`).

## Данные

Разделы на реальном API: главная (очередь, события, сводка по клиентам), заявки на демо (`cms/demo-requests`), тикеты (`support-tickets`), идеи (`ideas`), организации и их модули, настройки, структура и люди (`ops/organizations`), лицензии (`ops/licenses`), аккаунты (`ops/accounts`, привязка профиля — `support/accounts`), доска задач (`ops/boards`, `ops/tasks`), статус системы.

Остальные разделы помечены в сайдбаре меткой «демо»: бэкенда для них нет, они работают на моковых данных из макета через `useMockQuery` (`shared/api`). Чтобы подключить бэкенд, замените fetcher в хуке сущности на реальный запрос.

## Экраны

| Раздел | Маршруты |
|---|---|
| Главная | `/` — очередь работы, события, график, сводка |
| Бизнес | `/metrics` |
| Продажи | `/leads` (карточка заявки — панель справа) |
| Поддержка | `/tickets`, `/tickets/:id`, `/tickets-states`, `/tickets-priority`, `/ideas` |
| Клиенты | `/orgs`, `/orgs/:id?tab=…`, `/orgs-new` (мастер из 5 шагов, демо), `/onboarding`, `/licenses`, `/accounts`, `/accounts/:login` |
| Биллинг | `/plans`, `/plans/:code`, `/subscriptions`, `/payments`, `/providers`, `/org-billing` |
| Соцсети | `/channels`, `/inbox`, `/templates` |
| Задачи | `/tasks` — канбан с drag-and-drop, список, редактор задачи с комментариями, колонки |
| Контент | `/posts`, `/posts/editor`, `/dicts`, `/media` |
| Платформа | `/audit`, `/logins`, `/system`, `/errors`, `/team`, `/denied` |

## Архитектура — Feature-Sliced Design

```
src/
├── app/        точка входа, роутер, guards (авторизация и роли), глобальные стили и токены
├── pages/      страницы — по слайсу на экран
├── widgets/    app-shell (сайдбар + шапка), tickets-table, ticket-thread, task-board
├── features/   действия пользователя: auth, change-password, link-profile, toggle-org-module,
│               edit-license, task-editor, manage-columns, create-organization,
│               refund-payment, add-org-payment, pick-media, edit-dictionary-entry
├── entities/   ticket, organization, client-health, license, onboarding, metrics, lead, idea,
│               account, plan, subscription, payment, org-billing, channel, task,
│               article, platform, session
└── shared/     ui-kit по дизайн-системе, api (http-клиент, mock + query client), lib, config (маршруты)
```

Слайс отдаёт наружу только `index.ts`. Правила импортов проверяет ESLint (`eslint.config.js`):

1. Слой импортирует только из нижележащих слоёв: `app → pages → widgets → features → entities → shared`.
2. Импорт слайса — только через его public API: `@/entities/ticket`, а не `@/entities/ticket/model`.
