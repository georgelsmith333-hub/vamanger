const PATH_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const RAW_API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "");

export const API_ROOT = RAW_API_BASE && RAW_API_BASE.length > 0 ? RAW_API_BASE : PATH_BASE;

export const API_PREFIX = `${API_ROOT}/api`;
