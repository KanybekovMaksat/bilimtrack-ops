export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const LATENCY_MS = { min: 150, max: 450 };

/** Simulates network latency for the in-memory mock backend. */
export function delay<T>(value: T): Promise<T> {
  const ms = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
  // structuredClone so callers can never mutate the mock "database" directly.
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

export function notFound(entity: string, id: string): never {
  throw new ApiError(404, `${entity} "${id}" не найден`);
}

let counter = 1000;
export const nextId = (prefix: string) => `${prefix}-${++counter}`;
