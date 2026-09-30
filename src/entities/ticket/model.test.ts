import { describe, expect, it } from "vitest";
import { fillTemplate, ticketQuery, toTicket, type ApiTicket } from "./model";

const NOW = new Date("2026-09-30T12:00:00Z").getTime();

const api = (patch: Partial<ApiTicket> = {}): ApiTicket => ({
  id: 1,
  ticketNumber: "TCK-ABCD1234",
  subject: "Не могу войти",
  category: "technical",
  priority: "high",
  source: "telegram",
  status: "open",
  organization: null,
  author: null,
  userFullName: "",
  userContact: "tg:42",
  telegramUsername: "kurman",
  assignee: null,
  isUnread: true,
  lastMessageAt: "2026-09-30T11:00:00Z",
  lastMessageSenderType: "user",
  lastMessagePreview: "Пишет неверный пароль",
  firstResponseAt: null,
  slaDueAt: "2026-09-30T14:00:00Z",
  slaState: "ok",
  rating: null,
  createdAt: "2026-09-30T10:00:00Z",
  updatedAt: "2026-09-30T11:00:00Z",
  closedAt: null,
  ...patch,
});

describe("toTicket", () => {
  it("names a guest by the Telegram handle and marks an open ticket as awaiting a reply", () => {
    const t = toTicket(api(), NOW);
    expect(t.author).toBe("@kurman");
    expect(t.hasAccount).toBe(false);
    expect(t.unread).toBe(true);
    expect(t.awaitingReply).toBe(true);
  });

  it("does not wait for a reply once support wrote last or the ticket is done", () => {
    expect(toTicket(api({ lastMessageSenderType: "support" }), NOW).awaitingReply).toBe(false);
    expect(toTicket(api({ status: "closed" }), NOW).awaitingReply).toBe(false);
  });

  it("recomputes the SLA against the local clock", () => {
    expect(toTicket(api(), NOW).sla).toEqual({ label: "в норме · 2 ч", state: "ok" });
    expect(toTicket(api({ slaDueAt: "2026-09-30T12:30:00Z" }), NOW).sla.state).toBe("soon");
    expect(toTicket(api({ slaDueAt: "2026-09-30T09:00:00Z" }), NOW).sla).toEqual({ label: "просрочен 3 ч", state: "over" });
    expect(toTicket(api({ slaDueAt: "2026-09-30T09:00:00Z", firstResponseAt: "2026-09-30T08:00:00Z" }), NOW).sla.state).toBe("done");
    expect(toTicket(api({ slaDueAt: "2026-09-30T09:00:00Z", status: "resolved" }), NOW).sla.state).toBe("done");
  });
});

describe("ticketQuery", () => {
  it("joins sets with commas and sends flags only when on", () => {
    expect(ticketQuery({ status: ["resolved", "closed"], priority: [], unread: true, awaiting: false, assignee: "me" })).toEqual({
      q: undefined,
      status: "resolved,closed",
      priority: "",
      category: undefined,
      source: undefined,
      assignee: "me",
      organizationId: undefined,
      sla: undefined,
      unread: "true",
      awaiting: undefined,
      ordering: undefined,
    });
  });
});

describe("fillTemplate", () => {
  const ctx = { name: "Асанов Курманбек", ticket: "TCK-ABCD1234", operator: "Максат" };

  it("fills the known placeholders", () => {
    expect(fillTemplate("Здравствуйте, {name}!\nОбращение {ticket}. {operator}", ctx)).toBe("Здравствуйте, Асанов Курманбек!\nОбращение TCK-ABCD1234. Максат");
  });

  it("greets without a name when the requester gave none", () => {
    expect(fillTemplate("Здравствуйте, {name}!\n\nПароль сброшен.", { ...ctx, name: "" })).toBe("Здравствуйте!\n\nПароль сброшен.");
  });

  it("leaves an unknown placeholder visible", () => {
    expect(fillTemplate("Код: {code}", ctx)).toBe("Код: {code}");
  });
});
