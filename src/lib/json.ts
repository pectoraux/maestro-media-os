// JSON <-> string helpers for Prisma (SQLite has no native JSON/list type).

export function jstr(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function jparse<T = unknown>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function jparseArr<T = unknown>(value: string | null | undefined): T[] {
  return jparse<T[]>(value, []);
}

export function jparseObj<T = Record<string, unknown>>(value: string | null | undefined): T {
  return jparse<T>(value, {} as T);
}
