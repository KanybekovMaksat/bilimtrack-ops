# AGENTS.md — Bilimtrack Ops

Правила для ИИ-агентов и разработчиков, которые пишут код в `bilimtrack-ops`.
Прочитай целиком перед первой правкой. Если правило расходится с кодом — прав
этот файл, а код в разделе «Известный долг» чинится отдельной задачей.

## 1. Что это за проект

Bilimtrack Ops — внутренняя панель команды Bilimtrack (не клиентов!): продажи,
поддержка, организации-клиенты, лицензии, аккаунты, модерация, доска задач,
контент блога, аудит и статус платформы.

- Пользователи — только **операторы платформы** (`ops.PlatformOperator` на
  бэкенде). Никакой привязки к организации: оператор работает поверх всех
  клиентов сразу.
- Бэкенд — Django-репозиторий `bilimtrack_backend` (приложения `server/apps/ops`,
  `support`, `users`, `cms`). Его контракт описан в `API_OVERVIEW.md` бэкенда.
  Если нужного эндпоинта нет — не имитируй его на фронте, а скажи об этом.
- Прод: панель на `https://bilimtrack.bashtup.com`, API — `https://api.bilimtrack.kg/api/v1`.
- Язык интерфейса — **русский**. Комментарии в коде — английские (как в
  существующем коде), короткие, объясняют «почему», а не «что».

## 2. Команды и проверки

```bash
npm install
npm run dev        # http://localhost:5173, /api и /health проксируются на VITE_API_PROXY_TARGET
npm run lint       # ESLint + правила FSD
npm run typecheck  # tsc -b
npm test           # vitest: юнит-тесты чистой логики (файлы *.test.ts рядом с кодом)
npm run build      # typecheck + vite build
```

Перед сдачей работы обязательно: `npm run lint`, `npm test` и `npm run build`
без ошибок и без новых warning (то же самое гоняет CI — `.github/workflows/ci.yml`).
Тесты покрывают только чистые функции (`shared/lib`, `shared/config`), без DOM —
поэтому экран всё равно проверяй руками в dev-сервере (главный сценарий +
состояние ошибки/пустого списка). Новую чистую логику в `shared` покрывай тестом.

Новая переменная окружения `VITE_*` → объявить её в `src/vite-env.d.ts` и
описать в `.env.example`.

## 3. Стек

React 19 · TypeScript (strict) · Vite · React Router 8 (`createBrowserRouter`) ·
TanStack Query 5 · Zustand (только сессия) · Tailwind CSS v4 · lucide-react
(через `Icon`) · BlockNote + Mantine (только редактор статей, грузится лениво).

Не добавляй новые зависимости (UI-киты, форм-библиотеки, date-fns, axios и т.п.)
без явной просьбы. Почти всё нужное уже есть в `shared/`.

## 4. Архитектура — Feature-Sliced Design

```
src/
├── app/       вход, провайдеры, роутер, guards, глобальные стили и токены
├── pages/     один слайс = один экран (маршрут)
├── widgets/   крупные самостоятельные блоки из нескольких сущностей/фич
├── features/  действие пользователя: форма, модалка, кнопка с мутацией
├── entities/  бизнес-сущность: типы, запросы, мутации, справочники, мелкий UI
└── shared/    без бизнес-смысла: ui-kit, api-клиент, lib, config (маршруты)
```

### 4.1. Правила импортов (жёсткие)

1. Слой импортирует **только нижележащие** слои:
   `app → pages → widgets → features → entities → shared`.
2. Слайс импортируется **только через public API** — `@/entities/ticket`, не
   `@/entities/ticket/model`. Всё, что нужно снаружи, реэкспортируй в `index.ts(x)`.
3. **Слайсы одного слоя не импортируют друг друга** (feature → feature,
   entity → entity, page → page). Нужна общая логика — опусти её слоем ниже
   (в `shared` или в сущность) или собери вместе слоем выше (feature/widget/page).
4. Внутри слайса — относительные импорты (`./model`). Между слайсами и слоями —
   только алиас `@/`.
5. `shared/` не знает ни о каких сущностях, маршрутах конкретных экранов
   бизнес-логики, правах и т.п.

ESLint проверяет правила 1–3 (`eslint.config.js`: блок правил на каждый
слайс, список слайсов читается из папок). Не отключай эти правила
комментариями — перестрой код.

Если двум сущностям нужна одна операция (например, мутация одной сущности
обновляет состояние другой) — это feature, которая импортирует обе
(образец: `features/edit-my-profile` = `operator` + `session`).

### 4.2. Куда положить код

| Что пишешь | Куда |
|---|---|
| Тип ответа сериализатора, ключи запросов, `useX`/`useUpdateX`, словари статусов, маппер `toX`, мелкий UI сущности (`XStatusPill`) | `entities/<x>` |
| Модалка/форма/кнопка, которая что-то меняет (мутация + UI + валидация) | `features/<verb-noun>` |
| Составной блок, переиспользуемый на нескольких страницах (таблица тикетов, канбан, шапка/сайдбар) | `widgets/<name>` |
| Экран: раскладка, фильтры в URL, композиция фич и виджетов | `pages/<name>` |
| Кнопка/инпут/таблица/модалка без бизнес-смысла | `shared/ui` |
| Форматирование дат/чисел, плюрализация, утилиты | `shared/lib` |
| Маршрут | `shared/config` → `routes` |
| Роут, guard, провайдеры | `app/` |

Сомневаешься между page и feature: если действие нужно только на одном экране
и занимает < ~80 строк — можно держать в папке страницы (отдельным файлом).
Если это мутация, которую захочется вызвать ещё где-то, или модалка
подтверждения — это feature.

### 4.3. Анатомия слайса

```
entities/organization/
├── model.ts   типы (по сериализаторам бэкенда), словари-лейблы, чистые функции
├── api.ts     ключи запросов, хуки useQuery/useSuspenseQuery/useMutation
├── ui.tsx     мелкие компоненты сущности (OrgStatusPill)
└── index.ts   public API — только реэкспорты
```

- Маленькую сущность можно держать одним `index.ts`, но когда файл перерастает
  ~200 строк — разбивай на `model.ts` / `api.ts` / `ui.tsx` (образец: `entities/task`).
- Страница больше ~300 строк → выноси подкомпоненты в `ui/` рядом, общие для
  них хелперы — в `lib.ts`/`model.ts` страницы, а `index.tsx` оставь
  коротким: экспорт страницы + композиция (образцы: `pages/moderation`,
  `pages/post-editor`).
- Имена: папки и файлы — `kebab-case`; компоненты — `PascalCase`;
  страница экспортирует `XxxPage`; фича — компонент по действию
  (`EditLicenseModal`, `RefundButton`, `OrgModuleToggle`).

## 5. Данные и API

### 5.1. Клиент (`@/shared/api`)

| Функция | Когда |
|---|---|
| `api<T>(path, { method, body, query })` | любой запрос; сам снимает конверт `{ data }` |
| `apiList<T>(path, query)` | весь список одной страницей (до 500 строк) — для небольших реестров, фильтр на клиенте |
| `apiPage<T>(path, query)` | серверная пагинация → `{ rows, count }` |
| `apiAll<T>(path, query)` | все страницы выборки для экспорта (до `EXPORT_LIMIT` строк); `count` — реальный итог |
| `apiUpload<T>(path, file)` | multipart с полем `file` (аватары, логотипы) |
| `apiBlob(path)` | скачивание файлов с авторизацией (договоры) |

- **Никогда не вызывай `fetch` напрямую** и не собирай URL с `API_URL` руками —
  токены, refresh на 401 и разбор ошибок живут только в `shared/api/http.ts`.
- Пути относительные, без ведущего `/` и **с завершающим `/`**: `"ops/organizations/"`.
- JSON — camelCase в обе стороны (бэкенд сам переводит). Query-параметры тоже
  шли в camelCase (`organizationId`, `boardId`); `page_size` — исключение, как есть.
- Ошибка — всегда `ApiError` (`status`, `message` уже человекочитаемый на русском,
  `code`). `status === 0` — нет сети. Показывай `error.message`, не придумывай свой текст.
- Список с сервера — `{ data: [...], meta: { count, next, previous } }`.
  `data` — это массив. Никаких `.results`.

### 5.2. Запросы — только в `entities`

- `useQuery`/`useMutation`/`api()` вызываются **только в `entities`** (и в
  исключительных случаях — в `features`). Страницы, виджеты и фичи используют
  готовые хуки сущности.
- Первый элемент любого ключа — корень ресурса из `QK` (`@/shared/api`,
  `shared/api/query-keys.ts`). Новый ресурс → новый корень в `QK`.
- У каждой сущности — фабрика ключей на этих корнях:
  `export const orgKeys = { all: [QK.orgs] as const, detail: (id) => [QK.orgs, id] as const }`.
  Ключи берём из фабрики; массивы со строками руками не пишем
  (исключение — временные ключи демо-моков в `useMockQuery`).
- Два вида чтения:
  - `useX()` — на `useSuspenseQuery`, возвращает **сразу данные**. Для
    основного содержимого страницы: загрузку и ошибку ловят общие
    `Suspense` + `ErrorBoundary` в `AppShell`.
  - `useXSoft()` / хук с `useQuery` — возвращает объект запроса. Для
    второстепенного: счётчики, селекты, данные в модалке, списки с
    `keepPreviousData` (поиск/пагинация без мигания всей страницы).
- Мутация — хук `useDoSomething(id)` в сущности. В `onSuccess` либо
  `setQueryData` свежим ответом, либо `invalidateQueries` по ключам из фабрики.
  Оптимистичные обновления — по образцу `useMoveTask` / `useUpdateIdeaStatus`
  (`onMutate` → снимок → `onError` откат → `onSettled` инвалидация).
- Инвалидация чужой сущности: импортировать чужую фабрику ключей в entity
  нельзя (правило 4.1.3). Сбрасывай её кэш по корню:
  `qc.invalidateQueries({ queryKey: [QK.licenses] })`. Если после мутации
  нужно не просто сбросить кэш, а вызвать логику другой сущности, — это feature.
- Не храни серверные данные в `useState`/Zustand. Сервер → TanStack Query.

### 5.3. Типы

- Тип ответа = сериализатор бэкенда. Над типом — комментарий с именем
  сериализатора/эндпоинта: `/** OrganizationDetailSerializer. */`.
- Если UI нужна другая форма (вычисляемые поля, сортировка сообщений, SLA) —
  `ApiX` (сырой) + `X` (UI-модель) + чистый маппер `toX()` в `model.ts`
  (образец: `entities/ticket`).
- Статусы/enum — union-литералы + `Record<Status, string>` с лейблами.
  Для неизвестного значения с сервера — фолбэк (`label[s] ?? s`).
- Входные данные мутаций — отдельный тип `XInput`.
- Без `any`, без `as never`/`as unknown as`. `!` — только для гарантированных
  DOM-узлов.

### 5.4. Демо-разделы

Разделы без бэкенда (метрики, биллинг организаций, соцсети, онбординг, ошибки) работают на
моках через `useMockQuery` из `shared/api`, а в `NAV` помечены `demo: true`.
Подключая бэкенд: замени fetcher в хуке сущности на `api`/`apiList`, убери
`demo: true`, удали моки. Новые моки без просьбы не добавляй.

## 6. Авторизация и права

- Сессия — `useSession` (`entities/session`, Zustand + persist). Вход →
  `auth/login/` → `ops/me/`. 403 на `ops/me/` = не оператор → разлогин.
- Временный пароль (`mustChangePassword`) — `RequireAuth` показывает смену пароля.
- Права оператора — тип `OpsPermission` (`entities/session`, список
  `OPS_PERMISSIONS`, зеркало бэкенда): `sales`, `support`, `organizations`,
  `licenses`, `accounts`, `moderation`, `tasks`, `content`, `audit`, `team`,
  `billing` (Bilimtrack+: тарифы, подписки, платежи; читать могут все операторы),
  `analytics` (аналитика активности пользователей клиентского приложения).
  Новая привилегия на бэкенде → добавь её в `OPS_PERMISSIONS`.
- Проверка в UI: `const can = useCan(); can("organizations")` — код типизирован,
  опечатка не скомпилируется.

**Новый раздел за привилегией — всегда в трёх местах сразу:**

1. `app/router/router.tsx`: маршрут внутри группы
   `{ element: <RequirePermission perm="…" />, children: [...] }`.
2. `widgets/app-shell/nav.ts`: `perm: "…"` у пункта меню.
3. Кнопки изменения внутри экранов — под `can("…")`.

Детальные маршруты (`/tickets/:id`, `/accounts/:login`) лежат в той же группе,
что и список. Данные, которые грузятся «между делом» (счётчики в шапке,
очередь на главной), запрашивай с `enabled: can("…")` — без права запрос не
уходит (`useTicketsSoft({ enabled })`). Бэкенд всё равно проверяет права —
фронт лишь не показывает лишнего, но это не повод забывать guard.

## 7. Роутинг и страницы

- Все пути — в `shared/config` (`routes`). В коде — `routes.org(id)`,
  а не строка `"/orgs/" + id`.
- Новый экран: слайс в `pages/` → путь в `routes` → роут в `router.tsx`
  (в группе `RequirePermission`, если нужен) → пункт в `NAV` (с `perm`, при
  необходимости `also` для вложенных путей).
- Каждая страница — отдельный чанк: в роутере только
  `element: page(() => import("@/pages/x"), (m) => m.XPage)`. Статически
  импортируются лишь `LoginPage` и `DeniedPage`/`NotFoundPage` (нужны guard'ам).
  Загрузку чанка показывает общий `Suspense` в `AppShell`.
- Состояние, которым хочется поделиться ссылкой (вкладка, фильтры, поиск,
  страница, открытая карточка в Drawer), — в URL через `useUrlFilters()` из
  `@/shared/lib` (`get`/`num`/`flag`/`oneOf`/`list` для чтения, `set(patch)` для записи;
  смена фильтра сама сбрасывает `page`). Поле поиска — `useUrlSearch(f)`:
  текст обновляется сразу, `?q=` — с задержкой. Черновики форм — в `useState`.
- Параметры маршрута валидируй: `Number(id)` → проверка `Number.isInteger && > 0`,
  иначе `EmptyState` (образец: `OrgDetailsPage`). Слайс-компонент с данными
  монтируй с `key={id}`, чтобы при смене id состояние сбрасывалось.

### Шаблон страницы

```tsx
import { useNavigate } from "react-router";
import { useOrganizations } from "@/entities/organization";
import { routes } from "@/shared/config";
import { EmptyState, PageHeader, Row, Table } from "@/shared/ui";

export function OrgsPage() {
  const navigate = useNavigate();
  const orgs = useOrganizations(); // suspense: загрузка/ошибка — в AppShell
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Организации" subtitle={`${orgs.length}`} />
      {orgs.length ? (
        <Table cols="minmax(200px,1fr) 120px" head={["Название", "Статус"]}>
          {orgs.map((o) => (
            <Row key={o.id} onClick={() => navigate(routes.org(o.id))}>…</Row>
          ))}
        </Table>
      ) : (
        <EmptyState icon="building" title="Пока пусто" />
      )}
    </div>
  );
}
```

### Шаблон фичи-модалки

```tsx
export function EditThingModal({ thing, onClose }: { thing: Thing; onClose: () => void }) {
  const update = useUpdateThing(thing.id);
  const [form, setForm] = useState({ name: thing.name });
  const valid = form.name.trim().length > 0;
  return (
    <Modal open onClose={onClose} title="Изменить">
      <Field label="Название" strong>
        <TextInput look="plain" value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
      </Field>
      <ErrorNote error={update.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>Отмена</Button>
        <Button size="xl" variant="primary" disabled={!valid || update.isPending}
          onClick={() => update.mutate({ name: form.name.trim() }, { onSuccess: onClose })}>
          {update.isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
```

Модалку родитель монтирует условно (`{editing && <EditThingModal … />}`), чтобы
форма каждый раз стартовала с актуальных данных.

## 8. UI-kit (`@/shared/ui`) — используй его, а не сырой HTML

Перед тем как верстать элемент, проверь `src/shared/ui/index.ts`.

| Нужно | Компонент |
|---|---|
| Кнопка | `Button` — `variant`: primary / outline / muted / danger / dangerOutline / ghost / inverse; `size`: xs…2xl; `icon`, `iconRight`; без children = круглая иконка (тогда `aria-label`) |
| Заголовок страницы | `PageHeader` (title, subtitle, actions), `PageTitle`, `Breadcrumbs` |
| Таблица | `Table` (`cols` = grid-template-columns, `head`, `minWidth`) + `Row` + `Cell` (обрезка) + `Num` (цифры). Сортировка по клику на заголовок: `sortKeys` + `sort` + `onSort`, порядок — `sortRows()` из `shared/lib`, ключ — в URL (`sort=name` / `sort=-name`) |
| Пустое/ошибочное состояние | `EmptyState` |
| Ошибка запроса/мутации под формой или списком | `ErrorNote error={mutation.error}` (+ `prefix="Статус не сохранён"`); сам ничего не рисует без ошибки |
| Плашка-уведомление | `Callout` (`tone`: warn / danger / dangerSoft / info / success / muted…) |
| Статус-бейдж | `Pill` (`tone`), `StatusDot`, `Delta` |
| Поле формы | `Field` + `TextInput` / `TextArea` / `SelectInput` (нативный select) / `Dropdown` (поиск, аватары, иконки) |
| Ключ-значение | `KV`, `SummaryGrid` |
| Фильтр со списком значений | `FilterSelect` — единственный селект панели фильтров: чип «Категория: …», поиск по списку, строка сброса «Все …». Несколько значений сразу — `FilterMultiSelect` (в URL `key=a,b`, читать `f.list`); только там, где список фильтруется на клиенте или API принимает набор. Нативный `SelectInput` в фильтрах не используй |
| Период в журнале | `PeriodFilter` (сегодня / 7 / 30 дней / свой период); в URL — даты `from` и `to` |
| Сброс фильтров | `FilterReset filters={f} keys={[…]}` в конце панели фильтров — ключи URL, которые считаются фильтрами экрана |
| Выгрузка в CSV | `ExportButton` — выгружает текущую выборку; для серверных списков `load` — функция сущности на `apiAll` (все страницы, до `EXPORT_LIMIT` строк) |
| Переключатели | `Toggle`, `CheckBox`, `Segmented`, `Tabs`, `FilterChip` (вкл/выкл-фильтр с иконкой), `ToggleChip`, `SearchInput` |
| Модалка / боковая панель | `Modal` + `ModalActions`, `Drawer` |
| Пагинация | `Pager` |
| Аватары и метки | `UserAvatar` (фото или инициалы), `Avatar`, `OrgMark`, `OrgLabel` |
| Карточка | `Card`, `CardHeader`, `SectionLabel` |
| Иконка | `Icon name="…"` — тип `IconName` = ключи карты `ICONS` в `shared/ui/icon.tsx`; опечатка не скомпилируется. Нужной нет — добавь в карту импорт из `lucide-react`, не импортируй lucide в страницах. Поля с иконкой в данных типизируй как `IconName` |
| Одноразовый пароль | `SecretValue` |

Правила вёрстки:

- Классы собирай через `cn()` из `@/shared/lib` (clsx + tailwind-merge), не
  шаблонными строками.
- Цвета — токены темы, не hex. В классах: `bg-brand`, `text-ink`, `text-warn`,
  `bg-brand-50`, палитра neutral/red/green/amber/…. В `style`/SVG/словарях
  статусов: `"var(--color-red-500)"`, `"var(--color-brand)"`. Свои токены — в
  `src/app/styles/index.css` (`@theme`). Hex допустим только для цвета,
  который хранится на сервере (цвет колонки доски).
- `style={{…}}` — только для действительно динамических значений (ширина
  прогресса, цвет из данных, grid-колонки таблицы).
- Шрифты: `font-sans` (TikTok Sans) — текст, `font-num` (Inter) — логины, числа,
  номера, `font-mono` — пароли/коды.
- Кликабельное — `button`/`Link`, не `div onClick` (исключение — `Row` таблицы).
  У кнопки-иконки обязателен `aria-label`.
- Ключи списков — id сущности, не индекс (индекс только для статичных массивов).
- Панель десктопная (`min-w-[1280px]`), адаптив под телефон не нужен.

Не расширяй `shared/ui` ради одного экрана. Новый примитив — когда тот же
паттерн встречается минимум дважды; тогда вынеси его и замени копии.

## 9. Утилиты и тексты

- Даты/числа — `@/shared/lib`: `formatDate`, `formatDateLong`,
  `formatDateTimeShort`, `formatDateTimeFull`, `formatDayMonth`,
  `formatWeekdayDate`, `formatTime`, `formatRelative`, `formatAgo`,
  `daysSince`, `formatInt`, `formatNumber`, `formatBytes`, `plural`,
  `initialsOf`, `orgShort`. Не создавай `Intl.*Format`/`toLocale*String` в
  сущностях и страницах; нужен новый формат — добавь функцию в `shared/lib`.
- Множественное число — только `plural(n, ["организация", "организации", "организаций"])`.
- Тексты: русский, кавычки «ёлочки», тире «—», многоточие «…».
  Кнопка в процессе: «Сохраняем…», «Создаём…». Подтверждение необратимого
  действия — `Modal` с `Callout tone="danger"` и кнопкой `variant="danger"`.
- `window.alert/confirm/prompt` не используй.

## 10. Состояние и хуки

- Серверные данные — TanStack Query. Глобальное клиентское — только сессия
  (Zustand). Новый Zustand-стор — только по явной необходимости.
- Производное состояние считай при рендере, не синхронизируй через `useEffect`.
  Сброс состояния при смене входных данных — через `key` или паттерн
  «prev-значение в state» (как в `AccountsPage`), не через эффект.
- Поиск «по мере ввода» — `useDebouncedEffect(value, ms, onSettle)` из
  `@/shared/lib`, не свой `setTimeout` в эффекте.
- `eslint-disable` не добавляй (в коде их ноль). Эффект должен читать свежие
  props/state, но не перезапускаться от них — `useEffectEvent`
  (образцы: `shared/ui/dropdown.tsx`, `pages/post-editor`).
- Подписка на стор — селектором: `useSession((s) => s.user)`.

## 11. Связь с бэкендом

- Тикеты поддержки — отдельное API очереди `ops/tickets/*` (бэкенд:
  `support/use_cases/helpdesk.py`): строка списка без сообщений, счётчики
  `summary/`, признак «непрочитано» общий на команду, заметки команды
  (`isInternal`), шаблоны ответов `ops/ticket-templates/`. Клиентский
  `support-tickets/` панель не использует. Живое обновление — опрос: список и
  счётчики раз в 15 с, открытый тикет раз в 5 с; счётчики опрашиваются и в
  фоновой вкладке (по ним строится «(N)» в заголовке).

- Меняется контракт (новое поле, эндпоинт) — сначала бэкенд
  (`bilimtrack_backend`, его `AGENTS.md`, `API_OVERVIEW.md`), потом фронт.
- Поля на фронте, которых может не быть на старом бэкенде, помечай `?` и
  комментарием «Missing on an older backend: …» с фолбэком.
- Не полагайся на фронтовые guard'ы как на защиту: доступ проверяет бэкенд.
- Не показывай и не логируй токены, пароли, персональные данные в консоль.

## 12. Известный долг

Сознательно не исправлено; учитывай, но не расширяй:

- Тесты есть только на чистую логику `shared`; компонентных и e2e-тестов нет —
  экраны проверяются руками.
- Списки заявок, идей и организаций грузятся целиком (`apiList`, до 500 строк)
  и фильтруются на клиенте. Для больших реестров (тикеты, аккаунты, аудит,
  модерация) — серверные фильтры и пагинация: `apiPage` + `Pager`; новые
  большие списки делай так же (образец — `entities/ticket` + `pages/tickets`).
- Демо-разделы (биллинг, соцсети, метрики, онбординг, ошибки) — моки до
  появления бэкенда (см. 5.4).
- `pages/post-editor/index.tsx` (~400 строк): основное состояние редактора
  осталось в одном компоненте; новые блоки правой колонки выноси в `ui/`.
- Редактор статей стилизован своим `editor.css` (классы `ae-*`) и нативными
  `<select>` — это отдельная вёрстка по макету блога, UI-kit там не
  используется намеренно.
- `Table` на `div`-сетке без ролей таблицы — для скринридера это не таблица.

## 13. Чек-лист перед сдачей

- [ ] Код лежит в правильном слое; импорты только вниз и через `index.ts`.
- [ ] Запросы — через хуки сущности и `shared/api`, ключи — из фабрики.
- [ ] Использованы компоненты `shared/ui`, цвета — токены, классы — `cn()`.
- [ ] Новый раздел: `routes` + ленивый роут в группе `RequirePermission` + пункт `NAV` с `perm`.
- [ ] Обработаны загрузка, ошибка (`ErrorNote` / `ErrorBoundary`) и пустое состояние.
- [ ] Тексты на русском, `plural`/форматтеры из `shared/lib`.
- [ ] `npm run lint` и `npm run build` — без ошибок и новых warning.
- [ ] Обновлён `README.md`, если изменились разделы, маршруты или env.
