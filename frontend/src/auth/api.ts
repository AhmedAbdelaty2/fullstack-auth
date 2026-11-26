import axios, { type AxiosResponse } from 'axios';

const api = axios.create({ baseURL: '/api/auth', withCredentials: true, timeout: 10_000 });

export interface Session {
  user: { name: string; email: string };
  expiresAt: number;
}

interface ErrorBody {
  message?: string;
  fields?: Partial<Record<'name' | 'email' | 'password', string>>;
}

export const sessionKey = ['session'] as const;
export const signedOutSession = 'signed-out';
export type SessionState = Session | null | typeof signedOutSession;

function toLocalSession({ data, headers }: AxiosResponse<Session>): Session {
  const serverTime = Date.parse(String(headers.date));
  if (!Number.isFinite(serverTime)) return data;
  return { ...data, expiresAt: Date.now() + data.expiresAt - serverTime };
}

export async function getSession(signal?: AbortSignal) {
  try {
    return toLocalSession(await api.get<Session>('/me', { signal }));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
}

export async function authenticate(values: { name?: string; email: string; password: string }) {
  return toLocalSession(await api.post<Session>(values.name === undefined ? '/signin' : '/signup', values));
}

export async function logout() {
  await api.post('/logout');
}

export function errorDetails(error: unknown, fallback: string): ErrorBody {
  if (!axios.isAxiosError<ErrorBody>(error)) return { message: fallback };
  const response = error.response;
  if (response?.status === 429) return { message: 'Too many attempts. Wait a minute and try again.' };
  if (response && response.status < 500 && response.data?.message) return response.data;
  return { message: fallback };
}
