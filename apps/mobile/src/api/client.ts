import Constants from 'expo-constants';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ??
  'http://localhost:3000/api/v1';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  requestOtp: (phone: string) =>
    request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string) =>
    request<{ verified: boolean; isNewUser: boolean; token: string | null }>(
      '/auth/otp/verify',
      { method: 'POST', body: JSON.stringify({ phone, code }) },
    ),
  register: (payload: {
    phone: string;
    name: string;
    language: string;
    city?: string;
    state?: string;
  }) =>
    request<{ token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  upcomingOccasions: () => request<any[]>('/occasions/upcoming'),
  listHosts: (q?: string) =>
    request<any[]>(`/hosts${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  joinRoom: (occasionInstanceId: string) =>
    request<{
      roomName: string;
      token: string;
      livekitUrl: string;
      canPublish: boolean;
    }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ occasionInstanceId }),
    }),
  notifications: () => request<any[]>('/notifications'),
};
