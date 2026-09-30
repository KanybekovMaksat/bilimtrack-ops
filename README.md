# Bilimtrack Ops

Внутренняя панель команды Bilimtrack: продажи, поддержка, клиенты, биллинг, каналы связи, контент и мониторинг платформы. Сверстана по макету «Bilimtrack Ops v2» из Claude Design на дизайн-системе Bilimtrack (TikTok Sans, Inter, акцент `#155dfc`).

**Стек:** React 19 · TypeScript · Vite · React Router · TanStack Query · Zustand · Tailwind CSS v4 · lucide-react

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run lint     # ESLint, включая правила FSD
npm test         # юнит-тесты чистой логики (vitest)
```

Скопируйте `.env.example` в `.env`: dev-сервер проксирует `/api` и `/health` на бэкенд из `VITE_API_PROXY_TARGET` (`bilimtrack_v2_back`).

## Деплой

Панель развёрнута на `https://bilimtrack.bashtup.com`. Собранная версия обращается к API напрямую — `https://api.bilimtrack.kg/api/v1` (переопределяется `VITE_API_URL` / `VITE_HEALTH_URL`); в dev остаётся относительный `/api/v1` через прокси Vite. Домен панели должен быть в `CORS_ALLOWED_ORIGINS` бэкенда (`config/.env` на сервере) — иначе браузер заблокирует запросы. Новый домен панели = новая строка там же и пересоздание `web`.

## Доступ

Войти могут только операторы платформы — учётки с записью `ops.PlatformOperator` на бэкенде (без привязки к организации). После логина панель запрашивает `GET /api/v1/ops/me/`: на 403 сессия сразу закрывается. Учётки администраторов создаёт `python manage.py create_ops_admins` с временным паролем; при первом входе панель просит сменить его (`auth/change-password/`).

## Данные

Разделы на реальном API: главная (очередь, события, сводка по клиентам), заявки на демо (`cms/demo-requests`), тикеты (`support-tickets`), идеи (`ideas`), организации и их модули, настройки, структура и люди (`ops/organizations`), лицензии (`ops/licenses`), аккаунты (`ops/accounts`, привязка профиля — `support/accounts`), доска задач (`ops/boards`, `ops/tasks`), статус системы, аналитика активности (`ops/analytics/*`: страница «Аналитика», вкладка «Активность» организации, карточка активности аккаунта, «Клиенты под риском оттока» на главной).

Остальные разделы помечены в сайдбаре меткой «демо»: бэкенда для них нет, они работают на моковых данных из макета через `useMockQuery` (`shared/api`). Чтобы подключить бэкенд, замените fetcher в хуке сущности на реальный запрос.

## Экраны

| Раздел | Маршруты |
|---|---|
| Главная | `/` — очередь работы, события, график, сводка |
| Бизнес | `/analytics?tab=overview\|pages\|time\|orgs\|retention\|features` (период, организация, портал, устройство — в URL), `/metrics` |
| Продажи | `/leads` (карточка заявки — панель справа) |
| Поддержка | `/tickets`, `/tickets/:id`, `/ideas`, `/moderation` |
| Клиенты | `/orgs`, `/orgs/:id?tab=…`, `/orgs-new` (мастер из 5 шагов), `/onboarding`, `/licenses`, `/accounts`, `/accounts/:login` |
| Биллинг | `/plans`, `/plans/:code`, `/subscriptions`, `/payments`, `/providers`, `/org-billing` |
| Соцсети | `/channels`, `/inbox`, `/templates` |
| Задачи | `/tasks` — канбан с drag-and-drop, список, редактор задачи с комментариями, колонки |
| Контент | `/posts`, `/posts/editor[/:id]`, `/dicts`, `/media` |
| Платформа | `/audit`, `/logins`, `/system`, `/errors`, `/team`, `/profile`, `/denied` |

## Архитектура — Feature-Sliced Design

```
src/
├── app/        точка входа, роутер, guards (авторизация и роли), глобальные стили и токены
├── pages/      страницы — по слайсу на экран
├── widgets/    app-shell (сайдбар + шапка), tickets-table, ticket-thread, task-board, activity-report
├── features/   действия пользователя: auth, change-password, edit-my-profile, link-profile,
│               toggle-org-module, edit-license, task-editor, manage-columns, manage-contracts,
│               manage-operator, manage-organization, create-organization, add-person,
│               refund-payment, add-org-payment
├── entities/   session, operator, organization, contract, license, account, ticket, idea, lead,
│               moderation, task, article, journal, platform, metrics, client-health, onboarding,
│               plan, subscription, payment, org-billing, channel, analytics
└── shared/     ui-kit по дизайн-системе, api (http-клиент, корни ключей запросов, mock + query client),
                lib (форматтеры, хуки), config (маршруты)
```

Слайс отдаёт наружу только `index.ts`. Правила импортов проверяет ESLint (`eslint.config.js`):

1. Слой импортирует только из нижележащих слоёв: `app → pages → widgets → features → entities → shared`.
2. Импорт слайса — только через его public API: `@/entities/ticket`, а не `@/entities/ticket/model`.
3. Слайсы одного слоя не импортируют друг друга.

Подробные правила для разработчиков и ИИ-агентов — в [AGENTS.md](AGENTS.md).
