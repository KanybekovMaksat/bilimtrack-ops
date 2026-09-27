import { useMockQuery } from "@/shared/api";
import type { PillTone } from "@/shared/ui";

/** Messaging channels (Instagram, WhatsApp, Telegram) used as work channels, not SMM. */
export type ChannelStatus = "Подключён" | "Требует переподключения" | "Отключён";

export const channelTone: Record<ChannelStatus, PillTone> = {
  Подключён: "success",
  "Требует переподключения": "warn",
  Отключён: "danger",
};

export type Channel = {
  name: string;
  icon: string;
  color: string;
  account: string;
  status: ChannelStatus;
  responders: string;
  note: string;
  /** Carries paid PRO service notifications. */
  service: boolean;
};

const CHANNELS: Channel[] = [
  { name: "WhatsApp Business", icon: "brand-whatsapp", color: "#00a63e", account: "+996 555 10 20 30", status: "Требует переподключения", responders: "Айдана С., Ернар К.", note: "Токен доступа Meta истекает 24 сентября. После этого канал тихо перестанет принимать сообщения и служебные уведомления PRO.", service: true },
  { name: "Instagram", icon: "brand-instagram", color: "#ad46ff", account: "@bilimtrack", status: "Подключён", responders: "Жанна М.", note: "Собираем Direct и комментарии. Из Direct чаще всего приходят заявки на демо.", service: false },
  { name: "Telegram", icon: "brand-telegram", color: "#2b7fff", account: "@bilimtrack_bot", status: "Подключён", responders: "Айдана С.", note: "Работает через бота. Обращения из бота попадают в тикеты с источником Telegram.", service: false },
];

export const SERVICE_STATS = [
  { n: "1 284", label: "уведомлений за сутки" },
  { n: "37", label: "не доставлено" },
  { n: "2,9%", label: "доля ошибок" },
];

export const CONNECT_STEPS = [
  { n: 1, label: "До подключения", desc: "Кнопка «Подключить WhatsApp». Объясняем, что уйдём на сторону Meta.", tone: "neutral" },
  { n: 2, label: "Ожидание", desc: "Панель ждёт возврата: «Окно Meta открыто в новой вкладке». Кнопка «Отменить».", tone: "brand" },
  { n: 3, label: "После", desc: "Номер, статус «Подключён», дата истечения токена и кто отвечает за канал.", tone: "success" },
] as const;

export const useChannels = () => useMockQuery(["channels"], () => CHANNELS);

export type Dialog = {
  id: number;
  name: string;
  channel: "instagram" | "whatsapp" | "telegram";
  last: string;
  time: string;
  tag: string;
  messages: { from: "them" | "us"; text: string }[];
};

export const CHANNEL_GLYPH: Record<Dialog["channel"], { icon: string; color: string; label: string }> = {
  instagram: { icon: "brand-instagram", color: "#ad46ff", label: "Instagram Direct" },
  whatsapp: { icon: "brand-whatsapp", color: "#00a63e", label: "WhatsApp" },
  telegram: { icon: "brand-telegram", color: "#2b7fff", label: "Telegram" },
};

const DIALOGS: Dialog[] = [
  {
    id: 0,
    name: "Айгерим Нурлан",
    channel: "instagram",
    last: "Здравствуйте! А для колледжа на 300 студентов сколько будет стоить?",
    time: "12:40",
    tag: "Не обработан",
    messages: [
      { from: "them", text: "Здравствуйте! Видела вашу статью про электронный журнал. А для колледжа на 300 студентов сколько будет стоить?" },
      { from: "us", text: "Здравствуйте, Айгерим! Подскажите название колледжа и город — подготовлю расчёт и предложу время демо." },
      { from: "them", text: "Comtehno, филиал в Оше. Можно в четверг после обеда" },
    ],
  },
  { id: 1, name: "+996 555 21 40 88", channel: "whatsapp", last: "Спасибо, ждём демо в понедельник", time: "11:02", tag: "Заявка создана", messages: [{ from: "us", text: "Бакыт, подтверждаем демо в понедельник, 22 сентября, в 11:00." }, { from: "them", text: "Спасибо, ждём демо в понедельник" }] },
  { id: 2, name: "@aizhan_k", channel: "telegram", last: "Не могу зайти в приложение после смены телефона", time: "вчера", tag: "Тикет TCK-TG7K2M04", messages: [{ from: "them", text: "Не могу зайти в приложение после смены телефона" }] },
  { id: 3, name: "Руслан Абдиев", channel: "instagram", last: "А электронный журнал есть для школы?", time: "вчера", tag: "Обработан", messages: [{ from: "them", text: "А электронный журнал есть для школы?" }, { from: "us", text: "Да, Руслан, для школ есть отдельный пресет с четвертями и табелями. Оставил заявку на демо." }] },
];

export const useDialogs = () => useMockQuery(["dialogs"], () => DIALOGS);

export type TemplateStatus = "Одобрен" | "На проверке" | "Черновик" | "Отклонён";

export const templateTone: Record<TemplateStatus, PillTone> = {
  Одобрен: "success",
  "На проверке": "info",
  Черновик: "neutral",
  Отклонён: "danger",
};

const TEMPLATES = {
  templates: [
    { name: "Приглашение на демо", channel: "WhatsApp", status: "Одобрен", updated: "12 сен", reason: "" },
    { name: "Напоминание за день до демо", channel: "WhatsApp", status: "На проверке", updated: "18 сен", reason: "" },
    { name: "Ответ на запрос цены", channel: "Instagram", status: "Черновик", updated: "19 сен", reason: "" },
    { name: "Акция «PRO за 1 KGS»", channel: "WhatsApp", status: "Отклонён", updated: "15 сен", reason: "Meta: рекламное содержание в служебном шаблоне" },
  ] as { name: string; channel: string; status: TemplateStatus; updated: string; reason: string }[],
  broadcast: [
    { k: "Канал", v: "WhatsApp · +996 555 10 20 30" },
    { k: "Шаблон", v: "Приглашение на демо (одобрен Meta)" },
    { k: "Получателей", v: "148 человек · заявки со статусом «Новая» за 30 дней" },
    { k: "Отправитель", v: "Айдана С." },
    { k: "Время", v: "сразу после подтверждения" },
  ],
  history: [
    { when: "12 сен, 10:00", who: "Айдана С.", channel: "WhatsApp", sent: "96", failed: "4", name: "Приглашение на демо" },
    { when: "03 сен, 16:30", who: "Жанна М.", channel: "Instagram", sent: "54", failed: "0", name: "Анонс статьи про GPA" },
  ],
  previewRaw: "Здравствуйте, [имя]! Подтверждаем демо Bilimtrack для [организация] — [дата_демо]. Если время не подходит, ответьте на это сообщение.",
  previewFilled: "Здравствуйте, Айгерим! Подтверждаем демо Bilimtrack для колледжа Comtehno — 24 сентября, 15:00. Если время не подходит, ответьте на это сообщение.",
};

export const useMessageTemplates = () => useMockQuery(["templates"], () => TEMPLATES);
