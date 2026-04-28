/**
 * Postgres `numeric` columns are typed as `string` by Drizzle, but our OpenAPI
 * schemas declare these fields as `number`. This helper converts the specified
 * numeric keys from number → string so they can be safely passed to insert/update.
 */
export function coerceNumeric<T extends Record<string, unknown>>(
  input: T,
  keys: readonly (keyof T)[],
): T {
  const out: Record<string, unknown> = { ...input };
  for (const k of keys) {
    const v = out[k as string];
    if (typeof v === "number") {
      out[k as string] = String(v);
    }
  }
  return out as T;
}
