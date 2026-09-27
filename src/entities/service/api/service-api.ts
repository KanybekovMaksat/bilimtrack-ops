import { useQuery } from "@tanstack/react-query";
import { delay } from "@/shared/api";
import type { Service } from "../model/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const services = (): Service[] => [
  { id: "web", name: "Web-приложение", description: "Next.js PWA для студентов, менторов и родителей", host: "bilimtrack.kg", status: "operational", uptime: 99.98, latencyMs: 142, checkedAt: minutesAgo(1) },
  { id: "api", name: "API", description: "Django REST API (gunicorn)", host: "api.bilimtrack.kg", status: "operational", uptime: 99.95, latencyMs: 88, checkedAt: minutesAgo(1) },
  { id: "admin", name: "Админ-панель", description: "Панель директора и администрации", host: "admin.bilimtrack.kg", status: "operational", uptime: 99.9, latencyMs: 164, checkedAt: minutesAgo(2) },
  { id: "celery", name: "Celery worker", description: "Фоновые задачи: импорт, отчёты, рассылки", host: "internal", status: "degraded", uptime: 99.2, latencyMs: 2100, checkedAt: minutesAgo(1) },
  { id: "push", name: "Push-уведомления", description: "Web Push / APNs шлюз", host: "internal", status: "degraded", uptime: 98.7, latencyMs: 640, checkedAt: minutesAgo(3) },
  { id: "db", name: "PostgreSQL", description: "Основная база данных", host: "internal", status: "operational", uptime: 100, latencyMs: 4, checkedAt: minutesAgo(1) },
  { id: "redis", name: "Redis", description: "Кэш и брокер очередей", host: "internal", status: "operational", uptime: 100, latencyMs: 1, checkedAt: minutesAgo(1) },
];

export const serviceApi = {
  list: () => delay(services()),
};

export const serviceKeys = { all: ["services"] as const };

export const useServices = () =>
  useQuery({ queryKey: serviceKeys.all, queryFn: serviceApi.list, refetchInterval: 60_000 });
