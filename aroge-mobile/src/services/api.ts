const API_BASE_URL = 'http://localhost:3000';

async function post(path: string, body: Record<string, unknown>) {
  try {
    await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Best-effort dummy calls for local/offline development.
  }
}

export const api = {
  requestTelegramCode: (phoneNumber: string) =>
    post('/auth/telegram/request-code', { phoneNumber }),
  verifyTelegramCode: (phoneNumber: string, code: string) =>
    post('/auth/telegram/verify-code', { phoneNumber, code }),
  sendHeartbeat: () => post('/mobile/ping', { source: 'aroge-mobile' }),
};
