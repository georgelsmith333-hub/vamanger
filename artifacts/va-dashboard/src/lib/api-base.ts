const envApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const appBase = import.meta.env.BASE_URL.replace(/\/+$/, "");

export const API_BASE: string = envApiBase
  ? envApiBase.replace(/\/+$/, "")
  : appBase;
